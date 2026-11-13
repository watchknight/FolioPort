import React, { useState, useCallback, useRef, useEffect } from 'react';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { retroAudio } from '../utils/retroAudio';
import { CRTBootSequence } from './CRTBootSequence';
import { useRetroOS } from '../context/RetroOSContext';

export interface CRTMonitorShellProps {
  children?: React.ReactNode;
  initialBoot?: boolean;
  initialPoweredOn?: boolean;
}

export const CRTMonitorShell: React.FC<CRTMonitorShellProps> = ({
  children,
  initialBoot = true,
  initialPoweredOn = true,
}) => {
  const os = useRetroOS();
  const [isPoweredOn, setIsPoweredOn] = useState(initialPoweredOn);
  const [transitionType, setTransitionType] = useState<'off' | 'on' | null>(null);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isBooting, setIsBooting] = useState<boolean>(initialBoot);
  const screenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSoundActive = os.isInsideProvider ? os.soundEnabled : sfxEnabled;
  const isAmber = os.isInsideProvider && os.phosphorMode === 'amber';
  const phosphorVoid = isAmber ? '#140f07' : '#111712';
  const phosphorBright = isAmber ? '#d4a359' : '#c2cdb4';
  const phosphorMid = isAmber ? '#8c6830' : '#6e7d62';
  const phosphorDim = isAmber ? '#3d2b12' : '#2e3b2b';

  useEffect(() => {
    // Sync sfx state to all procedural audio engines
    retroAudio.setMuted(!isSoundActive);
    watchknightAudio.setMuted(!isSoundActive);
    chiptuneAudio.setMuted(!isSoundActive);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isSoundActive]);

  useEffect(() => {
    if (os.isInsideProvider) {
      os.setIsBooting(isBooting && isPoweredOn);
    }
  }, [isBooting, isPoweredOn, os]);

  const handlePowerToggle = useCallback(() => {
    if (transitionType !== null) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isPoweredOn) {
      setTransitionType('off');
      if (isSoundActive) {
        watchknightAudio.play8BitBlip(160);
        watchknightAudio.playTransitionSwoosh(0.4);
      }
      // 400ms collapse animation duration
      timerRef.current = setTimeout(() => {
        setIsPoweredOn(false);
        setIsBooting(false);
        setTransitionType(null);
        timerRef.current = null;
      }, 400);
    } else {
      setIsPoweredOn(true);
      setTransitionType('on');
      setIsBooting(true);
      if (isSoundActive) {
        retroAudio.playBlip();
      }
      // 500ms expand animation duration
      timerRef.current = setTimeout(() => {
        setTransitionType(null);
        timerRef.current = null;
      }, 500);
    }
  }, [isPoweredOn, transitionType, isSoundActive]);

  // Listen for keydown when powered off to wake monitor instantly
  useEffect(() => {
    if (!isPoweredOn) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        handlePowerToggle();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isPoweredOn, handlePowerToggle]);

  const handleSfxToggle = useCallback(() => {
    try {
      retroAudio.unlock();
      watchknightAudio.unlock();
      chiptuneAudio.unlock();
    } catch {}

    const next = !isSoundActive;
    watchknightAudio.setMuted(!next);
    chiptuneAudio.setMuted(!next);
    retroAudio.setMuted(!next);
    if (os.isInsideProvider) {
      os.setSoundEnabled(next);
    } else {
      setSfxEnabled(next);
    }
    if (next) {
      retroAudio.playBlip();
    }
  }, [isSoundActive, os]);

  return (
    <div
      className="w-full h-full w-screen h-[100dvh] m-0 p-0 overflow-hidden select-none font-pixel bg-[#c8c2ab]"
      style={{
        width: '100vw',
        height: '100dvh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#c8c2ab',
      }}
      data-testid="crt-monitor-room"
    >
      {/* 90s CRT Monitor Outer Hardware Chassis Frame - 100% Viewport Edge-to-Edge */}
      <div
        className="relative w-screen h-[100dvh] w-full h-full m-0 flex flex-col justify-between overflow-hidden overflow-x-hidden bg-[#c8c2ab] border-t-[8px] border-l-[8px] border-t-[#ded8c1] border-l-[#ded8c1] border-b-[12px] border-r-[12px] border-b-[#8f8973] border-r-[#8f8973] p-[6px_6px_0_6px] md:p-[18px_22px_0_22px] box-border"
        style={{
          width: '100vw',
          height: '100dvh',
          margin: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          backgroundColor: '#c8c2ab',
        }}
        data-testid="crt-monitor-casing"
      >
        {/* Top Ventilation Slots Centered in the Slim 18px Top Beige Rim */}
        <div
          className="absolute top-0 left-0 right-0 h-[8px] md:h-[18px] flex items-center justify-between px-3 md:px-6 pointer-events-none opacity-75 z-20"
          aria-hidden="true"
        >
          {/* Top-Left Recessed Corner Seam */}
          <div
            className="w-3 md:w-4 h-1 bg-[#8f8973] shadow-[inset_1px_1px_0_#3b3a32,0_1px_0_#ded8c1]"
            aria-hidden="true"
          />

          {/* Center Cooling Louver Slots */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="h-1 w-2.5 sm:w-3 md:w-5 bg-[#8f8973] shadow-[inset_1px_1px_0_#3b3a32,0_1px_0_#ded8c1]"
              />
            ))}
          </div>

          {/* Top-Right Recessed Corner Seam */}
          <div
            className="w-3 md:w-4 h-1 bg-[#8f8973] shadow-[inset_1px_1px_0_#3b3a32,0_1px_0_#ded8c1]"
            aria-hidden="true"
          />
        </div>

        {/* Deep Recessed Inner Screen Frame Lip (#3b3a32) */}
        <div
          className="relative flex-1 w-full h-full flex flex-col justify-between bg-[#3b3a32] p-1.5 sm:p-2 md:p-2.5 rounded-[22px] border-t-[3px] border-l-[3px] border-[#22211c] border-b-[3px] border-r-[3px] border-[#555348] shadow-[inset_0_4px_16px_rgba(0,0,0,0.9),0_2px_0_#ded8c1] overflow-hidden"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            borderRadius: '22px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#3b3a32',
          }}
          data-testid="crt-bezel-lip"
        >
          {/* Curved CRT Glass Screen (flex: 1, rounded: 22px, bg: phosphorVoid, inset shadow: 65px) */}
          <div
            ref={screenRef}
            className={`relative flex-1 w-full h-full flex flex-col justify-between rounded-[22px] shadow-[inset_0_0_65px_rgba(0,0,0,0.75)] overflow-hidden crt-glass-screen ${
              transitionType === 'off'
                ? 'animate-tube-off'
                : transitionType === 'on'
                ? 'animate-tube-on'
                : ''
            }`}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              borderRadius: '22px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: phosphorVoid,
              boxShadow: 'inset 0 0 65px rgba(0,0,0,0.75)',
            }}
            data-testid="crt-glass-screen"
          >
            {/* Screen Content Wrapper: scrollable inside CRT */}
            <div
              data-lenis-prevent
              className="relative z-10 w-full h-full overflow-y-auto crt-screen-scroll flex flex-col"
              style={{
                display: isPoweredOn ? 'flex' : 'none',
                color: phosphorBright,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {children}
            </div>

            {!isPoweredOn && (
              <div
                role="button"
                tabIndex={0}
                onClick={handlePowerToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePowerToggle();
                  }
                }}
                className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer outline-none focus-visible:outline-dashed"
                style={{ backgroundColor: isAmber ? '#0a0805' : '#070b08' }}
                aria-label="CRT Monitor Standby Mode. Click Power or press any key to turn on."
              >
                <div
                  className="w-2.5 h-2.5 animate-ping mb-4"
                  style={{ backgroundColor: phosphorDim }}
                />
                <p
                  className="font-pixel text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: phosphorMid }}
                >
                  Standby
                </p>
                <p className="font-crt text-sm sm:text-base" style={{ color: phosphorMid }}>
                  Click Power or Press Any Key to Turn On
                </p>
              </div>
            )}

            {/* Fast 90s CRT Power-On & BIOS Boot Sequence */}
            {isPoweredOn && isBooting && (
              <CRTBootSequence
                onComplete={() => {
                  setIsBooting(false);
                  if (os.isInsideProvider) {
                    os.setIsBooting(false);
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Compact Fixed Height Bottom Beige Hardware Bar (52px desktop, 42px mobile) */}
        <aside
          className="shrink-0 w-full h-[42px] md:h-[52px] flex items-center justify-between px-2 sm:px-3 font-pixel select-none text-[8px] sm:text-[9px]"
          style={{
            flexShrink: 0,
            width: '100%',
            padding: '0 12px',
          }}
          aria-label="90s CRT Monitor Hardware Bezel Controls"
        >
          {/* Bottom-Left: Vintage Debossed Hardware Emblem */}
          <div className="flex items-center gap-2">
            <span
              className="font-pixel text-[9px] sm:text-[10px] font-bold text-[#3b3a32] tracking-widest"
              style={{ textShadow: '1px 1px 0 #ded8c1' }}
            >
              MOAYED
            </span>
          </div>

          {/* Bottom-Center: Cooling Louvers / Speaker Grille */}
          <div
            className="flex gap-1 items-center opacity-60"
            aria-hidden="true"
            data-testid="crt-speaker-grille"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="w-1 h-3 bg-[#8f8973] shadow-[0_1px_0_#ded8c1]"
              />
            ))}
          </div>

          {/* Bottom-Right: Tactile Hardware Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Sound Hardware Toggle Switch */}
            <button
              type="button"
              onClick={handleSfxToggle}
              className={`px-2 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all duration-75 border-t-2 border-l-2 border-b-2 border-r-2 flex items-center gap-1 ${
                isSoundActive
                  ? 'bg-[#ded8c1] text-[#111712] border-t-[#ded8c1] border-l-[#ded8c1] border-b-[#8f8973] border-r-[#8f8973] shadow-[1px_1px_0_#3b3a32]'
                  : 'bg-[#8f8973] text-[#ded8c1] border-t-[#3b3a32] border-l-[#3b3a32] border-b-[#ded8c1] border-r-[#ded8c1] translate-y-[1px]'
              }`}
              title="Toggle Web Audio Sound Effects"
              aria-label={`Sound effects are currently ${isSoundActive ? 'ON' : 'OFF'}. Click to toggle.`}
            >
              <span>Sound</span>
              <span className="text-[7.5px] opacity-90">{isSoundActive ? '[ON]' : '[OFF]'}</span>
            </button>

            {/* Glowing Pixel Power LED */}
            <div className="flex items-center gap-1.5 pl-1">
              <span
                className={`w-2 h-2 transition-all duration-200 border border-[#3b3a32] ${
                  isPoweredOn
                    ? isAmber
                      ? 'bg-[#d4a359] shadow-[0_0_8px_#d4a359]'
                      : 'bg-[#c2cdb4] shadow-[0_0_8px_#c2cdb4]'
                    : isAmber
                    ? 'bg-[#3d2b12]'
                    : 'bg-[#2e3b2b]'
                }`}
                aria-hidden="true"
              />
              <span className="text-[8px] font-bold text-[#3b3a32]">PWR</span>
            </div>

            {/* Clickable Tactile Power Button */}
            <button
              type="button"
              onClick={handlePowerToggle}
              disabled={transitionType !== null}
              className="px-2.5 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-[#c8c2ab] text-[#3b3a32] border-t-2 border-l-2 border-[#ded8c1] border-b-2 border-r-2 border-[#8f8973] active:border-t-[#8f8973] active:border-l-[#8f8973] active:border-b-[#ded8c1] active:border-r-[#ded8c1] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed shadow-[1px_1px_0_#3b3a32] hover:bg-[#ded8c1] transition-all"
              aria-label="Toggle CRT Monitor Power"
            >
              Power
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CRTMonitorShell;
