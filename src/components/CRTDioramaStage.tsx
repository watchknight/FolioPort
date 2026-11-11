import React, { useState, useCallback, useRef, useEffect } from 'react';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { retroAudio } from '../utils/retroAudio';
import { RetroCommandMenu } from './RetroCommandMenu';
import { RetroOSWindow } from './RetroOSWindow';
import { BayerDitherTransition } from './BayerDitherTransition';
import { RetroOSProvider, useRetroOS } from '../context/RetroOSContext';

export type PhosphorMode = 'sage' | 'amber';

export interface PhosphorPalette {
  void: string;    // CRT screen background void
  dim: string;     // dark shadow / accent
  mid: string;     // desk line / secondary telemetry
  bright: string;  // bright typography / highlights
}

export const SAGE_PALETTE: PhosphorPalette = {
  void: '#111712',
  dim: '#2e3b2b',
  mid: '#6e7d62',
  bright: '#c2cdb4',
};

export const AMBER_PALETTE: PhosphorPalette = {
  void: '#140f07',
  dim: '#3d2b12',
  mid: '#8c6830',
  bright: '#d4a359',
};

export interface CRTDioramaStageProps {
  id?: string;
  className?: string;
  initialPhosphor?: PhosphorMode;
  onPhosphorChange?: (mode: PhosphorMode) => void;
  onAvatarInteract?: () => void;
  onMacInteract?: () => void;
  onIBMInteract?: () => void;
}

const CRTDioramaStageInner: React.FC<CRTDioramaStageProps> = ({
  id = 'hero',
  className = '',
  initialPhosphor = 'sage',
  onPhosphorChange,
  onAvatarInteract,
  onMacInteract,
  onIBMInteract,
}) => {
  const os = useRetroOS();
  // Monochrome Phosphor Filter mode ('sage' vs 'amber')
  const [internalPhosphorMode, setInternalPhosphorMode] = useState<PhosphorMode>(initialPhosphor);
  const phosphorMode = os.isInsideProvider ? os.phosphorMode : internalPhosphorMode;
  const palette = phosphorMode === 'sage' ? SAGE_PALETTE : AMBER_PALETTE;

  // Interactive micro-states
  const [isAvatarBubbleOpen, setIsAvatarBubbleOpen] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isAvatarWaving, setIsAvatarWaving] = useState(false);

  const [isMacHovered, setIsMacHovered] = useState(false);

  const [isGithubHudVisible, setIsGithubHudVisible] = useState(false);
  const [isGithubHudFlashing, setIsGithubHudFlashing] = useState(false);
  const [isIBMHovered, setIsIBMHovered] = useState(false);

  // Live Dhaka (UTC+6) time generator
  const [dhakaTime, setDhakaTime] = useState<string>('');

  useEffect(() => {
    const updateDhaka = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setDhakaTime(formatter.format(new Date()));
      } catch {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const dhaka = new Date(utc + 6 * 3600000);
        setDhakaTime(dhaka.toLocaleTimeString());
      }
    };
    updateDhaka();
    const interval = setInterval(updateDhaka, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer refs for flash, auto-dismiss, and wave cleanup
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hudDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (hudDismissTimerRef.current) clearTimeout(hudDismissTimerRef.current);
      if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    };
  }, []);

  // Keyboard accessibility: Escape key dismisses open speech bubble and HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAvatarBubbleOpen(false);
        setIsGithubHudVisible(false);
        setIsGithubHudFlashing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Soft mechanical key click during the > WELCOME TO MOAYED'S PORTFOLIO typewriter reveal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (os.isBooting) return; // Delay typewriter sound until boot sequence completes or skips

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      if (tickCount <= 22) {
        try {
          retroAudio.playKeyTick();
        } catch {}
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [os.isBooting]);

  // Toggle Monochrome Phosphor Filter on Compact Macintosh Click
  const handleMacClick = useCallback(() => {
    const nextMode: PhosphorMode = phosphorMode === 'sage' ? 'amber' : 'sage';
    if (os.isInsideProvider) {
      os.togglePhosphorMode();
    } else {
      setInternalPhosphorMode(nextMode);
    }
    onPhosphorChange?.(nextMode);
    onMacInteract?.();

    // Procedural 8-bit audio blip feedback
    try {
      watchknightAudio.play8BitBlip(nextMode === 'amber' ? 480 : 880);
    } catch {
      // Audio fallback safe for headless/SSR environments
    }
  }, [phosphorMode, os, onPhosphorChange, onMacInteract]);

  // Toggle Avatar Speech Bubble and trigger friendly wave frame
  const handleAvatarClick = useCallback(() => {
    setIsAvatarBubbleOpen((prev) => !prev);
    setIsAvatarWaving(true);
    if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    waveTimerRef.current = setTimeout(() => {
      setIsAvatarWaving(false);
      waveTimerRef.current = null;
    }, 1600);

    onAvatarInteract?.();

    try {
      watchknightAudio.play8BitBlip(720);
    } catch {
      // Audio fallback
    }
  }, [onAvatarInteract]);

  // IBM Desktop PC Click: Opens Selected Work [1] View
  const handleIBMClick = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    if (hudDismissTimerRef.current) clearTimeout(hudDismissTimerRef.current);

    setIsGithubHudVisible(true);
    setIsGithubHudFlashing(true);

    // Open Selected Work view
    os.openSection('projects');
    onIBMInteract?.();

    try {
      watchknightAudio.playSpatialClick(0.5, 0, -1);
    } catch {
      // Audio fallback
    }

    flashTimerRef.current = setTimeout(() => {
      setIsGithubHudFlashing(false);
      flashTimerRef.current = null;
    }, 1200);

    // Auto-dismiss HUD after 4.5 seconds if not hovered
    hudDismissTimerRef.current = setTimeout(() => {
      setIsGithubHudVisible(false);
      hudDismissTimerRef.current = null;
    }, 4500);
  }, [os, onIBMInteract]);

  return (
    <div
      id={id}
      data-testid="crt-diorama-stage"
      className={`crt-diorama-container relative w-full min-h-full flex-1 flex flex-col justify-between select-none font-pixel transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: palette.void,
        color: palette.bright,
      }}
    >
      {/* Scoped CSS animations for stepped typewriter, blinking cursor, idle breathing, code scrolling, and waving hand */}
      <style>{`
        @keyframes crtTypewriterEntrance {
          0% {
            max-width: 0ch;
          }
          100% {
            max-width: 32ch;
          }
        }

        @keyframes crtBlockCursorBlink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        @keyframes crtAvatarIdleBreathe {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes crtAvatarEyeBlink {
          0%, 88%, 94%, 100% {
            opacity: 0;
          }
          90%, 92% {
            opacity: 1;
          }
        }

        @keyframes crtAvatarWaveHand {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-15deg);
          }
        }

        @keyframes crtIbmCodeScroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-4px);
          }
        }

        @keyframes crtHudPulseFlash {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 6px currentColor);
          }
          50% {
            opacity: 0.35;
            filter: none;
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .crt-typewriter-steps {
            display: inline-block;
            overflow: hidden;
            white-space: pre;
            animation: crtTypewriterEntrance 0.85s steps(22, end) forwards;
            vertical-align: top;
          }

          .crt-block-cursor {
            display: inline-block;
            animation: crtBlockCursorBlink 1s steps(2, start) infinite;
            vertical-align: baseline;
          }

          .crt-avatar-breathing {
            animation: crtAvatarIdleBreathe 2.2s steps(2) infinite;
            transform-origin: bottom center;
          }

          .crt-avatar-eyelid {
            animation: crtAvatarEyeBlink 4s steps(2, start) infinite;
          }

          .crt-avatar-waving {
            transform-origin: 22px 20px;
            animation: crtAvatarWaveHand 0.35s steps(2) infinite;
          }

          .crt-ibm-scroll {
            animation: crtIbmCodeScroll 2.8s steps(4) infinite;
          }

          .crt-hud-flash {
            animation: crtHudPulseFlash 0.35s steps(2) 3;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .crt-typewriter-steps {
            display: inline-block;
            overflow: visible;
            white-space: pre;
            max-width: none !important;
            animation: none !important;
            vertical-align: top;
          }

          .crt-block-cursor {
            display: inline-block;
            opacity: 1 !important;
            animation: none !important;
            vertical-align: baseline;
          }

          .crt-avatar-breathing {
            animation: none !important;
            transform: none !important;
          }

          .crt-avatar-eyelid {
            animation: none !important;
            opacity: 0 !important;
          }

          .crt-avatar-waving {
            animation: none !important;
          }

          .crt-ibm-scroll {
            animation: none !important;
            transform: none !important;
          }

          .crt-hud-flash {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* TOP-LEFT TERMINAL GREETING HEADER & TOP-RIGHT TELEMETRY READOUT */}
      <header
        className="relative w-full flex items-start justify-between gap-4 p-8 z-20 shrink-0"
        style={{ padding: '32px' }}
      >
        {/* UPPER-LEFT QUADRANT: Two-line Pixel Greeting & Positioning Line */}
        <div className="flex flex-col items-start text-left min-w-0 max-w-[65%] sm:max-w-[78%]">
          <h1
            className="font-pixel text-xs sm:text-base md:text-xl lg:text-2xl font-bold tracking-tight leading-snug uppercase"
            style={{ color: palette.bright }}
          >
            <span
              data-testid="crt-typewriter-greeting"
              className="crt-typewriter-steps"
              style={{
                color: palette.bright,
                animationPlayState: os.isBooting ? 'paused' : 'running',
              }}
            >
              WELCOME TO MOAYED&apos;S{'\n'}PORTFOLIO <span
                data-testid="crt-blinking-cursor"
                className="crt-block-cursor"
                style={{ color: palette.bright }}
                aria-hidden="true"
              >
                █
              </span>
            </span>
          </h1>

          {/* Human-Readable Positioning Line in Plus Jakarta Sans */}
          <p
            data-testid="crt-positioning-line"
            className="mt-2 text-[15px] font-sans font-medium tracking-normal normal-case"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px',
              color: palette.mid,
            }}
          >
            Full-Stack Web &amp; Systems Engineer • CSE @ East West University, Dhaka
          </p>
        </div>

        {/* TOP-RIGHT CORNER: Clean Live Dhaka Clock */}
        <div
          data-testid="crt-telemetry-readout"
          className="text-right font-mono text-[8px] sm:text-[9px] md:text-[10px] tracking-wider uppercase shrink-0 pt-1"
          style={{ color: palette.mid }}
          aria-label="Dhaka • UTC+6"
        >
          <span>{dhakaTime ? `Dhaka • ${dhakaTime} (UTC+6)` : 'Dhaka • UTC+6'}</span>
        </div>
      </header>

      {/* CENTER PIXEL-ART SPRITE DIORAMA STAGE (Middle of CRT Viewport) */}
      <div className="relative w-full flex-1 min-h-[72px] sm:min-h-0 flex flex-col justify-end pb-0">
        {/* DIORAMA STAGE CONTAINER */}
        <div className="relative w-full max-w-[960px] mx-auto px-4 sm:px-8 md:px-12">
          {/* THREE PURE INLINE SVG PIXEL-GRID SPRITES (Resting directly on top of desk line) */}
          <div className="flex items-end justify-between gap-2 sm:gap-6 relative z-20">
            {/* 1. LEFT DIORAMA ELEMENT: PIXEL DEVELOPER AVATAR (32x48, Moayed standing facing right) */}
            <div className="relative group shrink-0">
              {/* Avatar 90s RPG Speech Bubble (Minimal Pixel Tooltip: Hi! Press [1], [2], or [3] below) */}
              <div
                role="dialog"
                aria-label="Speech bubble from Developer Avatar Abdur Rahman Moayed"
                data-testid="rpg-speech-bubble"
                className={`absolute bottom-full mb-3 left-0 sm:left-2 z-30 w-[240px] sm:w-[280px] max-w-[calc(100vw-48px)] transition-all duration-150 ${
                  isAvatarBubbleOpen || isAvatarHovered
                    ? 'opacity-100 pointer-events-auto scale-100'
                    : 'opacity-0 pointer-events-none scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100'
                }`}
              >
                <div
                  data-testid="avatar-hover-tooltip"
                  className="relative p-2.5 sm:p-3 border-2 text-[8px] sm:text-[9px] font-pixel tracking-wider leading-relaxed uppercase"
                  style={{
                    backgroundColor: palette.void,
                    borderColor: palette.bright,
                    color: palette.bright,
                    boxShadow: `2px 2px 0 0 ${palette.void}`,
                  }}
                >
                  Hi! Press 1, 2, or 3 below
                </div>
                {/* Stepped Pixel Speech Bubble Pointer Notch */}
                <div className="ml-6 sm:ml-8 flex flex-col" aria-hidden="true">
                  <span className="w-4 h-1 block" style={{ backgroundColor: palette.bright }} />
                  <span className="w-2.5 h-1 block ml-0.5" style={{ backgroundColor: palette.bright }} />
                  <span className="w-1.5 h-1 block ml-1" style={{ backgroundColor: palette.bright }} />
                </div>
              </div>

              <div
                data-testid="developer-avatar-sprite"
                role="button"
                tabIndex={0}
                aria-label="Abdur Rahman Moayed Pixel Developer Avatar. Click or hover to open speech bubble."
                onClick={handleAvatarClick}
                onMouseEnter={() => setIsAvatarHovered(true)}
                onMouseLeave={() => setIsAvatarHovered(false)}
                onFocus={() => setIsAvatarHovered(true)}
                onBlur={() => setIsAvatarHovered(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAvatarClick();
                  }
                }}
                className="cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2 transition-transform"
              >
                <svg
                  width="64"
                  height="96"
                  viewBox="0 0 32 48"
                  shapeRendering="crispEdges"
                  className="block w-12 h-18 sm:w-16 sm:h-24 transform group-hover:scale-105 transition-transform"
                  aria-hidden="true"
                >
                  {/* UPPER BODY: Styled Hair, Face, Eyes, Neck, Jacket, Shirt (Breathing motion steps(2)) */}
                  <g className="crt-avatar-breathing">
                    {/* HAIR (Dark void with midtone highlights, styled swept right) */}
                    <rect x="12" y="4" width="8" height="2" fill={palette.dim} />
                    <rect x="10" y="5" width="12" height="3" fill={palette.void} />
                    <rect x="9" y="8" width="13" height="3" fill={palette.void} />
                    <rect x="20" y="6" width="3" height="4" fill={palette.void} />
                    <rect x="8" y="10" width="4" height="5" fill={palette.void} />
                    <rect x="14" y="6" width="4" height="1" fill={palette.mid} />

                    {/* FACE (Facing right toward the computers) */}
                    <rect x="13" y="9" width="8" height="7" fill={palette.bright} />
                    <rect x="12" y="11" width="2" height="3" fill={palette.mid} />
                    <rect x="21" y="10" width="1" height="2" fill={palette.bright} />
                    <rect x="21" y="12" width="2" height="2" fill={palette.bright} />
                    <rect x="20" y="14" width="2" height="2" fill={palette.bright} />
                    <rect x="17" y="15" width="4" height="2" fill={palette.mid} />

                    {/* EYE & BLINKING EYELID */}
                    <rect x="17" y="11" width="3" height="2" fill={palette.void} />
                    <rect x="19" y="11" width="1" height="1" fill={palette.bright} />
                    <rect
                      className="crt-avatar-eyelid"
                      x="17"
                      y="11"
                      width="3"
                      height="2"
                      fill={palette.bright}
                    />

                    {/* NECK */}
                    <rect x="14" y="16" width="4" height="2" fill={palette.mid} />

                    {/* LIGHT PIXEL SHIRT */}
                    <rect x="15" y="17" width="2" height="4" fill={palette.bright} />
                    <rect x="14" y="17" width="1" height="2" fill={palette.bright} />
                    <rect x="17" y="17" width="1" height="2" fill={palette.bright} />
                    <rect x="15" y="21" width="2" height="10" fill={palette.bright} />
                    <rect x="15" y="23" width="1" height="1" fill={palette.void} />
                    <rect x="15" y="26" width="1" height="1" fill={palette.void} />
                    <rect x="15" y="29" width="1" height="1" fill={palette.void} />

                    {/* DARK PIXEL JACKET & RIGHT ARM (Normal vs Waving Frame) */}
                    <rect x="8" y="18" width="16" height="3" fill={palette.dim} />
                    <rect x="7" y="20" width="4" height="11" fill={palette.dim} />
                    <rect x="7" y="24" width="2" height="7" fill={palette.void} />
                    <rect x="8" y="31" width="3" height="2" fill={palette.bright} />
                    <rect x="17" y="20" width="3" height="11" fill={palette.dim} />
                    <rect x="19" y="20" width="4" height="11" fill={palette.dim} />

                    {isAvatarWaving ? (
                      <g data-testid="avatar-wave-frame" className="crt-avatar-waving">
                        <rect x="22" y="16" width="4" height="6" fill={palette.dim} />
                        <rect x="24" y="11" width="4" height="6" fill={palette.dim} />
                        <rect x="25" y="7" width="4" height="4" fill={palette.bright} />
                        <rect x="29" y="8" width="1" height="2" fill={palette.bright} />
                      </g>
                    ) : (
                      <g>
                        <rect x="21" y="20" width="3" height="6" fill={palette.dim} />
                        <rect x="22" y="26" width="4" height="4" fill={palette.dim} />
                        <rect x="24" y="29" width="3" height="2" fill={palette.bright} />
                      </g>
                    )}
                    <rect x="9" y="31" width="14" height="2" fill={palette.void} />
                  </g>

                  {/* LOWER BODY: Belt, Trousers & Shoes (Firmly grounded on desk line at y=48) */}
                  <rect x="11" y="33" width="10" height="2" fill={palette.void} />
                  <rect x="15" y="33" width="2" height="2" fill={palette.bright} />
                  <rect x="11" y="35" width="4" height="9" fill={palette.dim} />
                  <rect x="11" y="38" width="1" height="6" fill={palette.void} />
                  <rect x="17" y="35" width="4" height="9" fill={palette.dim} />
                  <rect x="17" y="38" width="1" height="6" fill={palette.void} />
                  <rect x="15" y="35" width="2" height="5" fill={palette.void} />

                  {/* SHOES (Firmly grounded on desk surface line at y=48) */}
                  <rect x="9" y="44" width="6" height="3" fill={palette.void} />
                  <rect x="8" y="47" width="8" height="1" fill={palette.dim} />
                  <rect x="17" y="44" width="7" height="3" fill={palette.void} />
                  <rect x="16" y="47" width="8" height="1" fill={palette.dim} />
                </svg>
              </div>
            </div>

            {/* COMPUTER WORKSTATION CLUSTER: CENTER-RIGHT COMPACT MAC & FAR-RIGHT IBM PC */}
            <div className="flex items-end gap-3 sm:gap-6 md:gap-10 shrink-0">
              {/* 2. CENTER-RIGHT DIORAMA ELEMENT: COMPACT 90S MACINTOSH MONITOR */}
              <div className="relative group shrink-0">
                {/* Compact Macintosh Phosphor Mode Tooltip */}
                <div
                  data-testid="mac-hover-tooltip"
                  className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1.5 border-2 text-[7px] sm:text-[8px] font-pixel uppercase tracking-wider whitespace-nowrap transition-opacity duration-150 ${
                    isMacHovered
                      ? 'opacity-100'
                      : 'opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100'
                  }`}
                  style={{
                    backgroundColor: palette.void,
                    borderColor: palette.mid,
                    color: palette.bright,
                    boxShadow: `2px 2px 0 0 ${palette.void}`,
                  }}
                >
                  Click: Toggle Green / Amber CRT
                </div>

                <div
                  data-testid="compact-mac-sprite"
                  role="button"
                  tabIndex={0}
                  aria-label="Compact 90s Macintosh Computer. Click to toggle secondary CRT monochrome phosphor filter."
                  onClick={handleMacClick}
                  onMouseEnter={() => setIsMacHovered(true)}
                  onMouseLeave={() => setIsMacHovered(false)}
                  onFocus={() => setIsMacHovered(true)}
                  onBlur={() => setIsMacHovered(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMacClick();
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2 transition-transform"
                >
                  <svg
                    width="112"
                    height="96"
                    viewBox="0 0 56 48"
                    shapeRendering="crispEdges"
                    className="block w-20 h-18 sm:w-28 sm:h-24 transform group-hover:scale-105 transition-transform"
                    aria-hidden="true"
                  >
                    {/* MACINTOSH ALL-IN-ONE CHASSIS */}
                    <rect x="12" y="6" width="32" height="2" fill={palette.bright} />
                    <rect x="10" y="8" width="2" height="28" fill={palette.bright} />
                    <rect x="44" y="8" width="2" height="28" fill={palette.dim} />
                    <rect x="10" y="36" width="36" height="2" fill={palette.void} />
                    <rect x="12" y="8" width="32" height="28" fill={palette.mid} />

                    {/* RECESSED DARK CRT SCREEN */}
                    <rect x="15" y="10" width="26" height="17" fill={palette.dim} />
                    <rect x="15" y="10" width="26" height="1" fill={palette.void} />
                    <rect x="15" y="10" width="1" height="17" fill={palette.void} />
                    <rect x="15" y="26" width="26" height="1" fill={palette.bright} />
                    <rect x="40" y="10" width="1" height="17" fill={palette.bright} />
                    <rect x="17" y="12" width="22" height="13" fill={palette.void} rx="1" />

                    {/* MINIATURE PIXEL PROMPT LINES */}
                    <rect x="19" y="14" width="2" height="1" fill={palette.bright} />
                    <rect x="22" y="14" width="8" height="1" fill={palette.bright} />
                    <rect x="31" y="14" width="5" height="1" fill={palette.mid} />

                    <rect x="19" y="17" width="11" height="1" fill={palette.mid} />
                    <rect x="31" y="17" width="4" height="1" fill={palette.dim} />

                    <rect x="19" y="20" width="2" height="1" fill={palette.bright} />
                    <rect className="crt-block-cursor" x="22" y="20" width="2" height="2" fill={palette.bright} />

                    {/* FLOPPY DISK SLOT & FRONT CHIN */}
                    <rect x="14" y="29" width="3" height="3" fill={palette.bright} />
                    <rect x="15" y="30" width="1" height="1" fill={palette.dim} />
                    <rect x="22" y="29" width="16" height="2" fill={palette.void} />
                    <rect x="22" y="29" width="16" height="1" fill={palette.dim} />
                    <rect x="37" y="30" width="1" height="1" fill={palette.bright} />
                    <rect x="14" y="34" width="4" height="1" fill={palette.void} />
                    <rect x="20" y="34" width="4" height="1" fill={palette.void} />
                    <rect x="26" y="34" width="4" height="1" fill={palette.void} />

                    {/* SLOPED MECHANICAL KEYBOARD BASE (Resting on desk line) */}
                    <rect x="8" y="39" width="40" height="1" fill={palette.bright} />
                    <rect x="6" y="40" width="44" height="7" fill={palette.mid} />
                    <rect x="6" y="47" width="44" height="1" fill={palette.void} />

                    {/* KEYCAPS */}
                    <rect x="8" y="41" width="38" height="1" fill={palette.bright} />
                    <rect x="7" y="43" width="40" height="1" fill={palette.bright} />
                    <rect x="7" y="45" width="40" height="1" fill={palette.bright} />
                    <rect x="18" y="46" width="18" height="1" fill={palette.bright} />
                  </svg>
                </div>
              </div>

              {/* 3. FAR-RIGHT DIORAMA ELEMENT: LARGE 90S IBM DESKTOP PC & CRT MONITOR */}
              <div className="relative group shrink-0">
                {/* IBM PC Tooltip: Click: Open Selected Work [1] */}
                <div
                  data-testid="github-status-hud"
                  className={`absolute bottom-full mb-3 right-0 sm:right-2 z-30 px-2.5 py-1.5 border-2 text-[7px] sm:text-[8px] font-pixel tracking-wider uppercase flex items-center gap-2 whitespace-nowrap transition-all duration-150 ${
                    isGithubHudVisible || isIBMHovered
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 pointer-events-none scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100'
                  } ${isGithubHudFlashing ? 'crt-hud-flash' : ''}`}
                  style={{
                    backgroundColor: palette.void,
                    borderColor: palette.bright,
                    color: palette.bright,
                    boxShadow: `2px 2px 0 0 ${palette.void}`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 inline-block animate-pulse shrink-0"
                    style={{ backgroundColor: palette.bright }}
                    aria-hidden="true"
                  />
                  <span data-testid="ibm-hover-tooltip">Click: Open Selected Work</span>
                </div>

                <div
                  data-testid="ibm-workstation-sprite"
                  role="button"
                  tabIndex={0}
                  aria-label="1990s IBM Desktop PC Workstation and CRT Monitor. Click to open Selected Work view."
                  onClick={handleIBMClick}
                  onMouseEnter={() => setIsIBMHovered(true)}
                  onMouseLeave={() => setIsIBMHovered(false)}
                  onFocus={() => setIsIBMHovered(true)}
                  onBlur={() => setIsIBMHovered(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleIBMClick();
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2 transition-transform"
                >
                  <svg
                    width="144"
                    height="96"
                    viewBox="0 0 72 48"
                    shapeRendering="crispEdges"
                    className="block w-26 h-18 sm:w-36 sm:h-24 transform group-hover:scale-105 transition-transform"
                    aria-hidden="true"
                  >
                    {/* SVG DEF: ClipPath to prevent scrolling code from spilling onto monitor bezel */}
                    <defs>
                      <clipPath id="crt-ibm-screen-clip">
                        <rect x="20" y="6" width="32" height="13" rx="1" />
                      </clipPath>
                    </defs>

                    {/* 1. LARGE CRT MONITOR STACKED ON TOP (y: 2 to 27) */}
                    <rect x="26" y="25" width="20" height="3" fill={palette.dim} />
                    <rect x="24" y="27" width="24" height="1" fill={palette.void} />
                    <rect x="14" y="2" width="44" height="23" fill={palette.mid} />
                    <rect x="15" y="2" width="42" height="1" fill={palette.bright} />
                    <rect x="14" y="3" width="1" height="22" fill={palette.bright} />
                    <rect x="57" y="3" width="1" height="22" fill={palette.dim} />

                    {/* Recessed CRT Screen Chassis */}
                    <rect x="18" y="4" width="36" height="17" fill={palette.dim} />
                    <rect x="20" y="6" width="32" height="13" fill={palette.void} rx="1" />

                    {/* SCROLLING MINIATURE LINES OF CODE (Strictly clipped within screen aperture) */}
                    <g clipPath="url(#crt-ibm-screen-clip)">
                      <g className="crt-ibm-scroll">
                        <rect x="22" y="7" width="14" height="1" fill={palette.bright} />
                        <rect x="38" y="7" width="6" height="1" fill={palette.mid} />
                        <rect x="24" y="9" width="18" height="1" fill={palette.mid} />
                        <rect x="44" y="9" width="5" height="1" fill={palette.dim} />
                        <rect x="22" y="11" width="8" height="1" fill={palette.bright} />
                        <rect x="32" y="11" width="12" height="1" fill={palette.bright} />
                        <rect x="26" y="13" width="16" height="1" fill={palette.mid} />
                        <rect x="22" y="15" width="10" height="1" fill={palette.bright} />
                        <rect x="34" y="15" width="8" height="1" fill={palette.mid} />
                        <rect x="24" y="17" width="22" height="1" fill={palette.mid} />
                        {/* Continuous seamless loop filler lines */}
                        <rect x="22" y="19" width="12" height="1" fill={palette.bright} />
                        <rect x="36" y="19" width="10" height="1" fill={palette.mid} />
                        <rect x="24" y="21" width="18" height="1" fill={palette.mid} />
                      </g>
                    </g>

                    {/* Monitor Bezel Knobs & Power Indicator */}
                    <rect x="45" y="22" width="2" height="2" fill={palette.dim} />
                    <rect x="49" y="22" width="2" height="2" fill={palette.dim} />
                    <rect x="53" y="22" width="2" height="2" fill={palette.bright} />

                    {/* 2. HORIZONTAL DESKTOP CPU CASE (y: 28 to 44) */}
                    <rect x="6" y="28" width="60" height="1" fill={palette.bright} />
                    <rect x="6" y="29" width="1" height="14" fill={palette.bright} />
                    <rect x="65" y="29" width="1" height="14" fill={palette.dim} />
                    <rect x="7" y="29" width="58" height="14" fill={palette.mid} />
                    <rect x="6" y="43" width="60" height="1" fill={palette.void} />

                    {/* Brand Badge & Power / Turbo LEDs */}
                    <rect x="9" y="31" width="8" height="4" fill={palette.void} />
                    <rect x="10" y="32" width="6" height="2" fill={palette.bright} />
                    <rect x="20" y="32" width="2" height="2" fill={palette.bright} />
                    <rect x="24" y="32" width="2" height="2" fill={palette.mid} />

                    {/* 7-Segment Turbo Display */}
                    <rect x="28" y="31" width="8" height="5" fill={palette.void} />
                    <rect x="29" y="32" width="2" height="1" fill={palette.bright} />
                    <rect x="29" y="34" width="2" height="1" fill={palette.bright} />
                    <rect x="33" y="32" width="2" height="1" fill={palette.bright} />
                    <rect x="33" y="34" width="2" height="1" fill={palette.bright} />

                    {/* Louvers & Buttons */}
                    <rect x="20" y="37" width="3" height="3" fill={palette.dim} />
                    <rect x="25" y="37" width="3" height="3" fill={palette.dim} />
                    <rect x="9" y="38" width="8" height="1" fill={palette.void} />
                    <rect x="9" y="40" width="8" height="1" fill={palette.void} />

                    {/* Floppy Drive Bays (5.25" and 3.5") */}
                    <rect x="40" y="30" width="23" height="5" fill={palette.dim} />
                    <rect x="42" y="32" width="17" height="1" fill={palette.void} />
                    <rect x="60" y="31" width="2" height="3" fill={palette.bright} />

                    <rect x="40" y="36" width="23" height="5" fill={palette.dim} />
                    <rect x="42" y="37" width="16" height="2" fill={palette.void} />
                    <rect x="59" y="38" width="2" height="2" fill={palette.bright} />

                    {/* 3. WIDE WEDGE KEYBOARD IN FRONT (Resting on desk line) */}
                    <rect x="6" y="42" width="60" height="1" fill={palette.bright} />
                    <rect x="4" y="43" width="64" height="4" fill={palette.mid} />
                    <rect x="4" y="47" width="64" height="1" fill={palette.void} />

                    {/* Keycap Rows & Numeric Pad */}
                    <rect x="6" y="44" width="42" height="1" fill={palette.bright} />
                    <rect x="18" y="45" width="22" height="1" fill={palette.bright} />
                    <rect x="52" y="43" width="13" height="3" fill={palette.dim} />
                    <rect x="53" y="44" width="11" height="1" fill={palette.bright} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRISP FULL-WIDTH 2PX SOLID #6e7d62 HORIZONTAL DESK SURFACE LINE ACROSS MIDDLE OF CRT VIEWPORT */}
      <div
        data-testid="crt-horizontal-desk-line"
        className="w-full relative z-10 shrink-0"
        style={{
          height: '2px',
          backgroundColor: palette.mid,
          borderBottom: `2px solid ${palette.mid}`,
        }}
      />

      {/* WORKSTATION DESK SURFACE & SPLIT-CONSOLE INTERFACE DIRECTLY BELOW HORIZONTAL DESK LINE */}
      <div
        data-testid="crt-split-console"
        className="w-full relative z-0 flex flex-col justify-center px-3 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-2.5 mb-2 sm:mb-3 md:mb-4 select-none shrink-0"
        style={{
          backgroundColor: palette.void,
          color: palette.mid,
        }}
      >
        {/* SPLIT CONSOLE: BOTTOM-LEFT COMMAND MENU & BOTTOM-RIGHT 90S OS PREVIEW WINDOW */}
        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 md:gap-5 items-stretch">
          {/* Bottom-Left Numbered Command Menu [1]-[3] */}
          <div className="w-full flex flex-col justify-start">
            <RetroCommandMenu palette={palette} />
          </div>

          {/* Bottom-Right 90s OS Preview Window */}
          <div className="w-full flex flex-col justify-start">
            {!os.isWindowExpanded ? (
              <RetroOSWindow palette={palette} isClosed={os.wasWindowClosed} />
            ) : (
              <div
                className="w-full h-full border-2 border-dashed border-[#6e7d62]/40 min-h-[170px] flex items-center justify-center text-[8px] uppercase tracking-wider text-[#6e7d62]/60 select-none"
                aria-hidden="true"
              >
                Window Expanded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXPANDED 90S OS WINDOW OVERLAY (Smoothly wipes upward via stepped CSS clip-path to fill main CRT screen workspace) */}
      {os.isWindowExpanded && (
        <RetroOSWindow palette={palette} />
      )}

      {/* 8x8 ORDERED BAYER MATRIX DITHER TRANSITION CANVAS OVERLAY (z-index: 35) */}
      <BayerDitherTransition palette={palette} />
    </div>
  );
};

export const CRTDioramaStage: React.FC<CRTDioramaStageProps> = (props) => {
  const os = useRetroOS();
  if (!os.isInsideProvider) {
    return (
      <RetroOSProvider initialPhosphor={props.initialPhosphor}>
        <CRTDioramaStageInner {...props} />
      </RetroOSProvider>
    );
  }
  return <CRTDioramaStageInner {...props} />;
};

export default CRTDioramaStage;
