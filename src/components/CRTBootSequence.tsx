import React, { useState, useEffect, useCallback, useRef } from 'react';
import { retroAudio } from '../utils/retroAudio';

export interface CRTBootSequenceProps {
  onComplete?: () => void;
  durationMs?: number;
  skipEnabled?: boolean;
  className?: string;
}

export const CRTBootSequence: React.FC<CRTBootSequenceProps> = ({
  onComplete,
  durationMs = 1200,
  skipEnabled = true,
  className = '',
}) => {
  const [isSkipped, setIsSkipped] = useState(false);
  const [phase, setPhase] = useState<'beam' | 'bios' | 'done'>('beam');
  const isSkippedRef = useRef(false);
  const beamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSkip = useCallback(() => {
    if (!skipEnabled || isSkippedRef.current) return;
    isSkippedRef.current = true;
    setIsSkipped(true);
    setPhase('done');

    if (beamTimerRef.current) {
      clearTimeout(beamTimerRef.current);
      beamTimerRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      retroAudio.playBlip();
    } catch {}

    onComplete?.();
  }, [skipEnabled, onComplete]);

  // Global keydown bypass: Press any key to skip
  useEffect(() => {
    if (!skipEnabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't skip if user pressed modifiers alone (Shift, Ctrl, etc.)
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      handleSkip();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [skipEnabled, handleSkip]);

  // Reduced motion check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        isSkippedRef.current = true;
        setIsSkipped(true);
        setPhase('done');
        onComplete?.();
        return;
      }
    }

    // 1. Phase 1: 350ms CSS clip-path wipe of horizontal light beam
    beamTimerRef.current = setTimeout(() => {
      if (isSkippedRef.current) return;
      setPhase('bios');
      try {
        retroAudio.playKeyTick();
      } catch {}

      // 2. Phase 2: 1.2s (durationMs) 90s BIOS memory check
      timerRef.current = setTimeout(() => {
        if (isSkippedRef.current) return;
        setPhase('done');
        try {
          retroAudio.playBlip();
        } catch {}
        onComplete?.();
      }, durationMs);
    }, 350);

    return () => {
      if (beamTimerRef.current) {
        clearTimeout(beamTimerRef.current);
        beamTimerRef.current = null;
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [durationMs, onComplete]);

  if (phase === 'done' || isSkipped) {
    return null;
  }

  return (
    <>
      {/* Scoped CSS animations for 350ms beam wipe and CRT power flash */}
      <style>{`
        @keyframes crtBeamExpandWipe {
          0% {
            clip-path: inset(50% 0 50% 0);
            opacity: 1;
            filter: brightness(3.5);
          }
          30% {
            clip-path: inset(48% 0 48% 0);
            opacity: 1;
            filter: brightness(2.5);
          }
          100% {
            clip-path: inset(0% 0 0% 0);
            opacity: 1;
            filter: brightness(1);
          }
        }

        @keyframes crtCenterBeamFlare {
          0% {
            opacity: 1;
            transform: scaleY(1);
          }
          40% {
            opacity: 1;
            transform: scaleY(1.8);
          }
          85% {
            opacity: 0.8;
            transform: scaleY(0.4);
          }
          100% {
            opacity: 0;
            transform: scaleY(0);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .crt-boot-beam-wipe {
            animation: crtBeamExpandWipe 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }

          .crt-center-flare {
            animation: crtCenterBeamFlare 350ms ease-out forwards;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .crt-boot-beam-wipe,
          .crt-center-flare {
            animation: none !important;
            clip-path: none !important;
          }
        }
      `}</style>

      {/* Full-screen / In-CRT Boot Sequence Container */}
      <div
        data-testid="crt-boot-sequence"
        role="region"
        aria-label="Fast 90s CRT Power-On and BIOS Boot Sequence"
        onClick={handleSkip}
        onTouchStart={handleSkip}
        className={`crt-boot-beam-wipe absolute inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-[#111712] text-[#c2cdb4] font-pixel select-none cursor-pointer overflow-hidden ${className}`}
        style={{
          backgroundColor: '#111712',
          color: '#c2cdb4',
        }}
      >
        {/* Central Thin Horizontal #c2cdb4 Light Beam Flare (During 350ms wipe) */}
        {phase === 'beam' && (
          <div
            data-testid="crt-light-beam"
            className="crt-center-flare pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#c2cdb4]"
            style={{
              backgroundColor: '#c2cdb4',
              boxShadow: '0 0 18px 3px #c2cdb4, 0 0 40px 6px #c2cdb4',
            }}
            aria-hidden="true"
          />
        )}

        {/* 90s BIOS Header Telemetry */}
        <div className="flex items-start justify-between border-b border-[#6e7d62]/40 pb-2 text-[8px] sm:text-[9px] uppercase tracking-wider opacity-85">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#c2cdb4] animate-pulse" aria-hidden="true" />
            <span>SYSTEM INITIALIZATION</span>
          </div>
          <span>PORT: 0x9600</span>
        </div>

        {/* 1.2-Second 90s BIOS Memory Check Content */}
        <div data-testid="crt-bios-text" className="my-auto flex flex-col gap-2.5 text-xs sm:text-sm font-pixel leading-relaxed">
          <p className="tracking-wide">
            East West University • 640K Base Memory OK • Loading Portfolio...
          </p>

          <div className="flex flex-col gap-1 text-[8px] sm:text-[10px] text-[#6e7d62] pt-2">
            <p>Detecting RAM modules: 640KB base conventional memory verified</p>
            <p>Bus protocol: 32-bit bus master enabled</p>
            <p>Synthesizer: Procedural Web Audio synth ready</p>
          </div>
        </div>

        {/* Instant Skip Prompt Banner */}
        <div className="flex items-center justify-between border-t border-[#6e7d62]/40 pt-2 text-[7.5px] sm:text-[9px] uppercase tracking-wider">
          <button
            type="button"
            data-testid="crt-boot-skip-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            className="text-[#c2cdb4] hover:underline focus:outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2 min-h-[44px] flex items-center"
            aria-label="Instant skip boot sequence"
          >
            Press any key or click to skip
          </button>
          <span className="opacity-60 text-[7px] sm:text-[8px]">
            East West University • Dhaka, Bangladesh
          </span>
        </div>
      </div>
    </>
  );
};

export default CRTBootSequence;
