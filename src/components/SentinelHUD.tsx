// src/components/SentinelHUD.tsx
// Fitts' & Hick's Law Sentinel HUD Navigation & Telemetry Inspector Switcher

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useLenis } from '../hooks/useLenis';
import { useWebAudio } from '../hooks/useWebAudio';
import { useTheme } from '../context/ThemeContext';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import {
  Briefcase,
  Activity,
  Mail,
  VolumeX,
  Volume2,
  Clock,
  Menu,
  X,
  Layers,
  Sparkles,
  Grid
} from 'lucide-react';

export type RenderPassMode = 'beauty' | 'uv' | 'lattice';

interface NavAnchor {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

/**
 * Strictly 3 top-level navigation anchors enforcing Hick's Law:
 * Minimizes choice cognitive latency to log2(3) = 1.58 bits.
 */
const HICKS_LAW_ANCHORS: NavAnchor[] = [
  {
    id: '#work',
    label: 'Work',
    subtitle: '04 Verified Anchors',
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  {
    id: '#render-pass-inspector',
    label: 'Telemetry Inspector',
    subtitle: '3D Shader Passes',
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  {
    id: '#contact',
    label: 'Contact',
    subtitle: 'Encrypted Dispatch',
    icon: <Mail className="w-3.5 h-3.5" />,
  },
];

export interface MagneticItem {
  el: HTMLElement;
  xTo: gsap.QuickToFunc;
  yTo: gsap.QuickToFunc;
  isAttracted: boolean;
  stationaryCenterX?: number;
  stationaryCenterY?: number;
}

export interface HUDMagneticCleanup {
  destroy: () => void;
  items: MagneticItem[];
}

/**
 * Applies Fitts' Law magnetic attraction to HUD buttons using pre-allocated gsap.quickTo setters
 * within a 48px proximity radius.
 *
 * Performance invariants:
 * 1. Zero allocations: No gsap.timeline(), gsap.to(), or gsap.set() calls inside pointer tracking.
 * 2. Layout reflow elimination:
 *    - Short-circuits when e.clientY > 160 (rest of page) with zero DOM/GSAP queries.
 *    - Caches stationary center when attraction begins so no repeated getBoundingClientRect or getProperty calls occur while tracking.
 */
export function initHUDMagnetic(
  hud: HTMLElement,
  proximityRadius: number = 48
): HUDMagneticCleanup {
  // Disable magnetic physics on coarse touch devices or reduced motion
  if (typeof window !== 'undefined') {
    const isTouchOnly = window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (isTouchOnly || prefersReducedMotion) {
      return { destroy: () => {}, items: [] };
    }
  }

  // Collect all HUD elements opted into magnetic physics
  const buttonElements = Array.from(
    hud.querySelectorAll<HTMLElement>('[data-magnetic-hud="true"]')
  );

  // Pre-allocate gsap.quickTo setters once per button (zero allocation in loop)
  const items: MagneticItem[] = buttonElements.map((el) => ({
    el,
    xTo: gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out', force3D: true }),
    yTo: gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out', force3D: true }),
    isAttracted: false,
  }));

  const resetAllItems = () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.isAttracted) {
        item.xTo(0);
        item.yTo(0);
        item.isAttracted = false;
        item.stationaryCenterX = undefined;
        item.stationaryCenterY = undefined;
      }
    }
  };

  const handlePointerMove = (e: MouseEvent) => {
    // Fast-path exit: when cursor is well below HUD boundary (> 160px from top)
    if (e.clientY > 160) {
      resetAllItems();
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Cache stationary center upon initial proximity entry
      if (!item.isAttracted || item.stationaryCenterX === undefined || item.stationaryCenterY === undefined) {
        const rect = item.el.getBoundingClientRect();
        const currentX = Number(gsap.getProperty(item.el, 'x')) || 0;
        const currentY = Number(gsap.getProperty(item.el, 'y')) || 0;
        item.stationaryCenterX = rect.left - currentX + rect.width / 2;
        item.stationaryCenterY = rect.top - currentY + rect.height / 2;
      }

      const dx = e.clientX - item.stationaryCenterX;
      const dy = e.clientY - item.stationaryCenterY;
      const distance = Math.hypot(dx, dy);

      if (distance < proximityRadius) {
        // Dynamic magnetic pull toward cursor: inverse falloff within 48px
        const pullStrength = (1 - distance / proximityRadius) * 0.36;
        item.xTo(dx * pullStrength);
        item.yTo(dy * pullStrength);
        item.isAttracted = true;
      } else if (item.isAttracted) {
        // Smooth return to stationary anchor on proximity exit
        item.xTo(0);
        item.yTo(0);
        item.isAttracted = false;
        item.stationaryCenterX = undefined;
        item.stationaryCenterY = undefined;
      }
    }
  };

  const handlePointerLeave = () => {
    resetAllItems();
  };

  const handleResize = () => {
    resetAllItems();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
  }
  hud.addEventListener('mouseleave', handlePointerLeave);

  const destroy = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
    }
    hud.removeEventListener('mouseleave', handlePointerLeave);
    items.forEach((item) => gsap.killTweensOf(item.el));
  };

  return { destroy, items };
}

export const SentinelHUD: React.FC = () => {
  const { lenis, scrollTo } = useLenis();
  const { isEnabled: isSoundEnabled, toggle: toggleSound } = useWebAudio();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<string>('#work');
  const [activeRenderPass, setActiveRenderPass] = useState<RenderPassMode>('beauty');
  const [dhakaTime, setDhakaTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const hudRef = useRef<HTMLElement | null>(null);
  const magneticItemsRef = useRef<MagneticItem[]>([]);

  // 1. East West University / Dhaka live UTC+6 chronometer readout
  useEffect(() => {
    const updateTime = () => {
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

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Active section tracking synchronized with Lenis scroll stream
  useEffect(() => {
    const updateActiveAnchor = (currentScrollY: number) => {
      setScrolled(currentScrollY > 30);

      // Check bottom of document for Contact
      if (
        typeof document !== 'undefined' &&
        window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 80
      ) {
        setActiveSection('#contact');
        return;
      }

      // Check Telemetry Inspector section
      const inspectorEl = document.querySelector('#render-pass-inspector');
      if (inspectorEl) {
        const rect = inspectorEl.getBoundingClientRect();
        const top = rect.top + currentScrollY;
        const bottom = top + rect.height;
        const probe = currentScrollY + window.innerHeight * 0.4;
        if (probe >= top && probe <= bottom) {
          setActiveSection('#render-pass-inspector');
          return;
        }
      }

      // Check Work section
      const workEl = document.querySelector('#work');
      if (workEl) {
        const rect = workEl.getBoundingClientRect();
        const top = rect.top + currentScrollY;
        const bottom = top + rect.height;
        const probe = currentScrollY + window.innerHeight * 0.4;
        if (probe >= top && probe <= bottom) {
          setActiveSection('#work');
          return;
        }
      }

      if (currentScrollY < 300) {
        setActiveSection('');
      }
    };

    const onLenisScroll = (e: { scroll: number } | any) => {
      const scrollVal = typeof e?.scroll === 'number' ? e.scroll : typeof e?.animatedScroll === 'number' ? e.animatedScroll : window.scrollY;
      updateActiveAnchor(scrollVal);
    };
    const onWindowScroll = () => updateActiveAnchor(window.scrollY);

    if (lenis) {
      lenis.on('scroll', onLenisScroll);
    }
    window.addEventListener('scroll', onWindowScroll, { passive: true });

    return () => {
      if (lenis) lenis.off('scroll', onLenisScroll);
      window.removeEventListener('scroll', onWindowScroll);
    };
  }, [lenis]);

  // 3. Fitts' Law Magnetic Attraction within 48px Proximity Radius (Zero-Allocation Loop)
  useEffect(() => {
    const hud = hudRef.current;
    if (!hud) return;

    const magnetic = initHUDMagnetic(hud, 48);
    magneticItemsRef.current = magnetic.items;

    return () => {
      magnetic.destroy();
    };
  }, []);

  // 4. Procedural audio hover tick handler with normalized stereo panning
  const handlePointerHover = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
    watchknightAudio.playHoverTick(normX);
  }, []);

  // 5. Handle navigation anchor jump with 3D spatial click and transition swoosh
  const handleNavClick = useCallback(
    (id: string, e?: React.MouseEvent) => {
      setActiveSection(id);
      const normX = e && typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
      watchknightAudio.playSpatialClick(normX, 0, -1);
      watchknightAudio.playTransitionSwoosh(0.35);
      const offset = id === '#work' ? 0 : -80;
      scrollTo(id, { offset });
      setMobileMenuOpen(false);
    },
    [scrollTo]
  );

  // 6. 3-mode Render Pass Switcher handler
  const handleRenderPassChange = useCallback((mode: RenderPassMode, e?: React.MouseEvent) => {
    setActiveRenderPass(mode);
    const normX = e && typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
    watchknightAudio.playSpatialClick(normX, 0, -1);

    const modeIndex = mode === 'beauty' ? 0 : mode === 'uv' ? 1 : 2;

    // Broadcast change for Three.js shaders and RenderPassInspector
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wk-render-pass-change', {
          detail: { mode, modeIndex },
        })
      );
      document.documentElement.setAttribute('data-render-pass', mode);
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    const nextState = !isSoundEnabled;
    toggleSound();
    watchknightAudio.setMuted(!nextState);
  }, [isSoundEnabled, toggleSound]);

  // Synchronize engine mute state with global sound preference
  useEffect(() => {
    watchknightAudio.setMuted(!isSoundEnabled);
  }, [isSoundEnabled]);

  return (
    <header
      ref={hudRef}
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center pt-2.5 sm:pt-3 px-3 sm:px-6 transition-all duration-300 ${
        scrolled ? 'bg-[#090A0D]/95 backdrop-blur-2xl pb-2.5 border-b border-white/10 shadow-2xl' : ''
      }`}
      style={{
        color: 'var(--wk-alabaster-ink, #F2EFE9)',
      }}
    >
      {/* Top subtle backdrop scrim preventing content from clashing behind HUD */}
      <div 
        className={`absolute inset-x-0 top-0 pointer-events-none -z-10 transition-all duration-300 ${
          scrolled 
            ? 'h-36 sm:h-44 bg-gradient-to-b from-[#090A0D] via-[#090A0D]/95 to-transparent' 
            : 'h-28 sm:h-36 bg-gradient-to-b from-[#090A0D] via-[#090A0D]/85 to-transparent'
        }`} 
        aria-hidden="true" 
      />

      {/* Top Telemetry & UTC+6 Chronometer Readout Ribbon */}
      <div
        className={`pointer-events-auto mb-2 flex items-center justify-between gap-3 px-3.5 py-1 rounded-full text-[11px] font-mono tracking-tight bg-wk-slate-surface/90 border border-wk-ash-muted/20 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          scrolled ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
        }`}
        style={{
          backgroundColor: 'rgba(18, 21, 28, 0.9)',
          borderColor: 'rgba(122, 128, 140, 0.2)',
        }}
      >
        {/* Academic Origin & Live Coordinate Anchoring */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-wk-verdigris-signal animate-pulse" />
          <span className="font-semibold text-wk-alabaster-ink hidden sm:inline">
            East West University • Dhaka
          </span>
          <span className="font-semibold text-wk-alabaster-ink sm:hidden">EWU • Dhaka</span>
          <span className="text-wk-ash-muted/60 hidden md:inline">
            [23.7644° N, 90.4252° E]
          </span>
        </div>

        <div className="h-3 w-px bg-wk-ash-muted/25 hidden sm:block" />

        {/* Live East West University / Dhaka UTC+6 Chronometer */}
        <div className="flex items-center gap-1.5 font-bold text-wk-terracotta-pulse">
          <Clock className="w-3.5 h-3.5" />
          <span>{dhakaTime ? `${dhakaTime} UTC+6` : 'LIVE UTC+6'}</span>
        </div>
      </div>

      {/* Main Glassmorphic Sentinel HUD Pill */}
      <nav
        className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 p-1.5 sm:p-2 rounded-full bg-wk-slate-surface/95 backdrop-blur-3xl border border-wk-ash-muted/30 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-wk-ash-muted/50 relative kanizsa-container"
        style={{
          backgroundColor: 'rgba(18, 21, 28, 0.96)',
        }}
        aria-label="Sentinel HUD Navigation"
      >
        {/* Left: Brand Monogram & Sentinel Identity Anchor */}
        <button
          type="button"
          data-magnetic-hud="true"
          onPointerEnter={handlePointerHover}
          onClick={(e) => {
            scrollTo(0);
            setActiveSection('');
            const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
            watchknightAudio.playSpatialClick(normX, 0, -1);
            watchknightAudio.playTransitionSwoosh(0.4);
          }}
          className="group flex items-center gap-2 pl-2 pr-3 py-1 rounded-full text-wk-alabaster-ink transition-colors focus:outline-none"
          aria-label="Return to apex hero sentinel"
        >
          <div className="w-7 h-7 rounded-full bg-wk-terracotta-pulse/20 border border-wk-terracotta-pulse/50 flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="font-mono font-black text-xs text-wk-terracotta-pulse">WK</span>
          </div>
          <span className="font-display font-extrabold text-xs tracking-wider uppercase text-wk-alabaster-ink hidden xl:inline">
            @WATCH<span className="text-wk-terracotta-pulse">KNIGHT</span>
          </span>
        </button>

        <div className="h-4 w-px bg-wk-ash-muted/20 hidden md:block" />

        {/* Center: Strictly 3 Top-Level Navigation Anchors (Hick's Law Enforcement) */}
        <div className="hidden md:flex items-center gap-1">
          {HICKS_LAW_ANCHORS.map((anchor) => {
            const isActive = activeSection === anchor.id;
            return (
              <button
                key={anchor.id}
                type="button"
                data-magnetic-hud="true"
                onPointerEnter={handlePointerHover}
                onClick={(e) => handleNavClick(anchor.id, e)}
                aria-label={`Navigate to ${anchor.label} section — ${anchor.subtitle}`}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-200 ${
                  isActive
                    ? 'text-wk-alabaster-ink font-bold bg-wk-terracotta-pulse/20 border border-wk-terracotta-pulse/50 shadow-sm'
                    : 'text-wk-ash-muted hover:text-wk-alabaster-ink hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-wk-terracotta-pulse' : 'text-wk-ash-muted'}>
                  {anchor.icon}
                </span>
                <span>{anchor.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-wk-ash-muted/20 hidden sm:block" />

        {/* Right Section: 3-Mode Render Pass Switcher (Beauty | UV/Normals | Lattice) */}
        <div
          className="flex items-center p-0.5 rounded-full bg-wk-obsidian-void border border-wk-ash-muted/20 text-[11px] font-mono"
          role="radiogroup"
          aria-label="3-mode Render Pass Switcher"
        >
          <button
            type="button"
            data-magnetic-hud="true"
            role="radio"
            aria-checked={activeRenderPass === 'beauty'}
            onPointerEnter={handlePointerHover}
            onClick={(e) => handleRenderPassChange('beauty', e)}
            aria-label="Switch to Beauty Render Pass (Fluid Distortion & Specular Sheen)"
            title="Pass 0: Beauty Fluid PBR"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
              activeRenderPass === 'beauty'
                ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold shadow-md'
                : 'text-wk-ash-muted hover:text-wk-alabaster-ink'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden lg:inline">Beauty</span>
          </button>

          <button
            type="button"
            data-magnetic-hud="true"
            role="radio"
            aria-checked={activeRenderPass === 'uv'}
            onPointerEnter={handlePointerHover}
            onClick={(e) => handleRenderPassChange('uv', e)}
            aria-label="Switch to UV/Normals Render Pass (Texture Coordinates & Wave Vectors)"
            title="Pass 1: UV / Normals Telemetry"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
              activeRenderPass === 'uv'
                ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold shadow-md'
                : 'text-wk-ash-muted hover:text-wk-alabaster-ink'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden lg:inline">UV/Normals</span>
          </button>

          <button
            type="button"
            data-magnetic-hud="true"
            role="radio"
            aria-checked={activeRenderPass === 'lattice'}
            onPointerEnter={handlePointerHover}
            onClick={(e) => handleRenderPassChange('lattice', e)}
            aria-label="Switch to Lattice Render Pass (Algorithmic Sentinel Grid & Clay Base)"
            title="Pass 2: Algorithmic Sentinel Lattice"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
              activeRenderPass === 'lattice'
                ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold shadow-md'
                : 'text-wk-ash-muted hover:text-wk-alabaster-ink'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span className="hidden lg:inline">Lattice</span>
          </button>
        </div>

        <div className="h-4 w-px bg-wk-ash-muted/20 hidden sm:block" />

        {/* Global Procedural Web Audio Mute Toggle */}
        <button
          type="button"
          data-magnetic-hud="true"
          onPointerEnter={handlePointerHover}
          onClick={handleToggleSound}
          aria-label={
            isSoundEnabled
              ? 'Mute procedural Web Audio synthesizer'
              : 'Enable procedural Web Audio synthesizer'
          }
          aria-pressed={isSoundEnabled}
          title={isSoundEnabled ? 'Sound ON • Click to Mute' : 'Muted • Click to Enable Procedural Audio'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all ${
            isSoundEnabled
              ? 'bg-wk-terracotta-pulse/20 border-wk-terracotta-pulse/60 text-wk-alabaster-ink font-semibold'
              : 'bg-white/5 border-wk-ash-muted/20 text-wk-ash-muted hover:text-wk-alabaster-ink'
          }`}
        >
          {isSoundEnabled ? (
            <div className="flex items-center gap-0.5 h-3 px-0.5" aria-hidden="true">
              <span className="w-0.5 bg-wk-terracotta-pulse rounded-full animate-sound-bar-1" />
              <span className="w-0.5 bg-wk-terracotta-pulse rounded-full animate-sound-bar-2" />
              <span className="w-0.5 bg-wk-terracotta-pulse rounded-full animate-sound-bar-3" />
              <span className="w-0.5 bg-wk-terracotta-pulse rounded-full animate-sound-bar-4" />
            </div>
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-wk-ash-muted" aria-hidden="true" />
          )}
          <span className="hidden xl:inline">{isSoundEnabled ? 'AUDIO ON' : 'MUTE'}</span>
        </button>

        {/* Editorial Palette Mode Selector */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-wk-obsidian-void border border-wk-ash-muted/20"
          role="radiogroup"
          aria-label="Editorial Palette Selector"
        >
          <button
            type="button"
            data-magnetic-hud="true"
            role="radio"
            aria-checked={theme === 'obsidian' || theme === 'dark'}
            onPointerEnter={handlePointerHover}
            onClick={(e) => {
              setTheme('obsidian');
              const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
              watchknightAudio.playSpatialClick(normX, 0, -1);
            }}
            title="Obsidian Void (#090A0D)"
            aria-label="Switch to Obsidian theme"
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              theme === 'obsidian' || theme === 'dark'
                ? 'ring-2 ring-wk-terracotta-pulse scale-110'
                : 'opacity-60 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: '#090A0D', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#B84A27' }} />
          </button>
          <button
            type="button"
            data-magnetic-hud="true"
            role="radio"
            aria-checked={theme === 'alabaster' || theme === 'light'}
            onPointerEnter={handlePointerHover}
            onClick={(e) => {
              setTheme('alabaster');
              const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
              watchknightAudio.playSpatialClick(normX, 0, -1);
            }}
            title="Editorial Alabaster (#F2EFE9)"
            aria-label="Switch to Alabaster theme"
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              theme === 'alabaster' || theme === 'light'
                ? 'ring-2 ring-wk-terracotta-pulse scale-110'
                : 'opacity-60 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: '#F2EFE9', border: '1px solid rgba(0,0,0,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#12151C' }} />
          </button>
          <button
            type="button"
            data-magnetic-hud="true"
            role="radio"
            aria-checked={theme === 'forest'}
            onPointerEnter={handlePointerHover}
            onClick={(e) => {
              setTheme('forest');
              const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
              watchknightAudio.playSpatialClick(normX, 0, -1);
            }}
            title="Verdigris Signal (#4E9A7F)"
            aria-label="Switch to Forest theme"
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              theme === 'forest'
                ? 'ring-2 ring-wk-terracotta-pulse scale-110'
                : 'opacity-60 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: '#141E19', border: '1px solid rgba(78,154,127,0.3)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4E9A7F' }} />
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-full text-wk-alabaster-ink hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Toggle Mobile Navigation Drawer"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-wk-obsidian-void/95 backdrop-blur-2xl md:hidden flex flex-col justify-center px-6 transition-all duration-300 pointer-events-auto">
          <div className="w-full max-w-sm mx-auto flex flex-col gap-4 py-8">
            <div className="text-center mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-wk-terracotta-pulse">
                East West University • CSE
              </span>
              <h2 className="font-display font-black text-2xl text-wk-alabaster-ink uppercase mt-1">
                Sentinel HUD
              </h2>
            </div>

            {/* Hick's Law 3 Navigation Anchors */}
            <div className="space-y-2">
              {HICKS_LAW_ANCHORS.map((anchor) => (
                <button
                  key={anchor.id}
                  type="button"
                  onClick={() => handleNavClick(anchor.id)}
                  aria-label={`Jump to ${anchor.label}`}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-mono text-sm transition-all ${
                    activeSection === anchor.id
                      ? 'bg-wk-terracotta-pulse/20 border-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                      : 'bg-wk-slate-surface/80 border-wk-ash-muted/20 text-wk-ash-muted hover:text-wk-alabaster-ink'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-wk-terracotta-pulse">{anchor.icon}</span>
                    <span>{anchor.label}</span>
                  </div>
                  <span className="text-[11px] text-wk-ash-muted">{anchor.subtitle}</span>
                </button>
              ))}
            </div>

            {/* Mobile Render Pass Selector */}
            <div className="p-3 rounded-xl bg-wk-slate-surface/60 border border-wk-ash-muted/20 space-y-2">
              <div className="text-xs font-mono text-wk-ash-muted">3D Render Pass Mode</div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleRenderPassChange('beauty')}
                  className={`py-2 rounded-lg transition-all ${
                    activeRenderPass === 'beauty'
                      ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                      : 'bg-wk-obsidian-void text-wk-ash-muted'
                  }`}
                >
                  Beauty
                </button>
                <button
                  type="button"
                  onClick={() => handleRenderPassChange('uv')}
                  className={`py-2 rounded-lg transition-all ${
                    activeRenderPass === 'uv'
                      ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                      : 'bg-wk-obsidian-void text-wk-ash-muted'
                  }`}
                >
                  UV/Normals
                </button>
                <button
                  type="button"
                  onClick={() => handleRenderPassChange('lattice')}
                  className={`py-2 rounded-lg transition-all ${
                    activeRenderPass === 'lattice'
                      ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                      : 'bg-wk-obsidian-void text-wk-ash-muted'
                  }`}
                >
                  Lattice
                </button>
              </div>
            </div>

            {/* Mobile Sound Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-wk-slate-surface/60 border border-wk-ash-muted/20">
              <span className="font-mono text-xs text-wk-ash-muted">Procedural Web Audio</span>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold ${
                  isSoundEnabled
                    ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink'
                    : 'bg-white/10 text-wk-ash-muted'
                }`}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{isSoundEnabled ? 'ENABLED' : 'MUTED'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default SentinelHUD;
