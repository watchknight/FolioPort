import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '../hooks/useLenis';
import { useTheme } from '../context/ThemeContext';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { PixelWorkstationCRT, AvatarAction } from './hero/PixelWorkstationCRT';
import { CyberWaveCanvas } from './CyberWaveCanvas';
import { MagneticButton } from './ui/MagneticButton';
import { GithubIcon } from './ui/Icons';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { 
  ArrowDownRight, 
  Terminal, 
  Activity, 
  MapPin, 
  Cpu, 
  ExternalLink,
  Clock,
  Compass,
  FileText
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_ITEMS = [
  'ABDUR RAHMAN MOAYED',
  'FULL-STACK ARCHITECT',
  'SYSTEMS ENGINEER',
  'CREATIVE TECHNOLOGIST',
  'EAST WEST UNIVERSITY',
  'DHAKA, BANGLADESH (UTC+6)',
];

export interface BracketMenuItem {
  num: string;
  title: string;
  desc: string;
  targetId: string;
}

export interface HeroProps {
  showCanvas?: boolean;
}

const BRACKET_MENU_ITEMS: BracketMenuItem[] = [
  {
    num: '1',
    title: 'ABOUT ME & KERNEL ARCHITECTURE',
    desc: 'Philosophy & RPG Skill Matrix',
    targetId: '#systems',
  },
  {
    num: '2',
    title: 'MY PROJECTS & 3D SHADER DECK',
    desc: 'Flagship Case Studies',
    targetId: '#work',
  },
  {
    num: '3',
    title: 'GITHUB_ROM & UBUNTU TERMINAL',
    desc: 'GitHub Lab & Terminal',
    targetId: '#terminal',
  },
  {
    num: '4',
    title: 'RESUME.PDF & UPLINK DISPATCH',
    desc: 'Resume (PDF) & Dispatch Uplink',
    targetId: '#contact',
  },
];

export const Hero: React.FC<HeroProps> = ({ showCanvas = true }) => {
  const { scrollTo } = useLenis();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const marqueeSingleRef = useRef<HTMLDivElement | null>(null);
  const hasRevealedRef = useRef<boolean>(false);

  const [dhakaTime, setDhakaTime] = useState<string>('');
  const [avatarAction, setAvatarAction] = useState<AvatarAction>('idle');
  const [flashingKey, setFlashingKey] = useState<string | null>(null);

  // Live Dhaka (UTC+6) time telemetry
  useEffect(() => {
    const updateClock = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        setDhakaTime(formatter.format(new Date()));
      } catch {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const dhaka = new Date(utc + 6 * 3600000);
        setDhakaTime(dhaka.toLocaleTimeString());
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Terminal scroll & auto-focus dispatcher
  const handleLaunchTerminal = useCallback(() => {
    scrollTo('#terminal', { offset: -80 });
    window.dispatchEvent(new CustomEvent('focus-terminal'));
    setTimeout(() => {
      const input = document.getElementById('terminal-input') as HTMLInputElement | null;
      input?.focus({ preventScroll: true });
    }, 450);
  }, [scrollTo]);

  const handleExploreWork = useCallback(() => {
    scrollTo('#work', { offset: 0 });
  }, [scrollTo]);

  // Execute bracket menu action
  const handleBracketAction = useCallback((num: string) => {
    setFlashingKey(num);
    setTimeout(() => setFlashingKey(null), 350);

    // Play 3D spatial click sound & trigger avatar energy slash
    watchknightAudio.playSpatialClick(0, 0, -1);
    setAvatarAction('slash');
    setTimeout(() => setAvatarAction('idle'), 700);

    if (num === '1') {
      scrollTo('#systems', { offset: -60 });
    } else if (num === '2') {
      scrollTo('#work', { offset: 0 });
    } else if (num === '3') {
      handleLaunchTerminal();
    } else if (num === '4') {
      if (typeof window !== 'undefined') {
        window.open('/resume.pdf', '_blank');
      }
      scrollTo('#contact', { offset: -80 });
    }
  }, [scrollTo, handleLaunchTerminal]);

  // Keyboard shortcut listeners (Keys 1, 2, 3, 4 and Ctrl + ~)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser standard tab navigation (Ctrl/Cmd/Alt + 1..4) without hijacking
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === '`' || e.key === '~' || e.code === 'Backquote')) {
          e.preventDefault();
          handleLaunchTerminal();
        }
        return;
      }

      // Ignore if typing inside input / textarea / select or contentEditable
      const targetTag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      if (
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA' ||
        targetTag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Ignore if modal dialog is open (e.g. Easter egg dialog)
      if (document.querySelector('[role="dialog"]') || document.querySelector('.easter-egg-modal')) {
        return;
      }

      let keyNum: string | null = null;
      if (['1', '2', '3', '4'].includes(e.key)) {
        keyNum = e.key;
      } else if (e.code.startsWith('Numpad')) {
        const num = e.code.replace('Numpad', '');
        if (['1', '2', '3', '4'].includes(num)) {
          keyNum = num;
        }
      }

      if (keyNum) {
        e.preventDefault();
        handleBracketAction(keyNum);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBracketAction, handleLaunchTerminal]);

  // Kinetic Hero Choreography: Masked Split-Word & Shutter Entrance
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(
        [
          '.hero-split-word',
          '.hero-anchor-badge',
          '.hero-prompt-bar',
          '.hero-subheadline',
          '.hero-bracket-menu',
          '.hero-cta-action',
          '.hero-telemetry-bar',
          '.hero-marquee-wrap',
          '[data-testid="hero-portrait"]',
        ],
        { autoAlpha: 1, y: 0, yPercent: 0, rotateZ: 0, scale: 1 }
      );
      return;
    }

    // Set initial masked state with autoAlpha
    gsap.set('.hero-split-word', { yPercent: 110, rotateZ: 3, autoAlpha: 0, force3D: true });
    gsap.set(
      [
        '.hero-anchor-badge',
        '.hero-prompt-bar',
        '.hero-subheadline',
        '.hero-bracket-menu',
        '.hero-cta-action',
        '.hero-telemetry-bar',
        '.hero-marquee-wrap',
      ],
      { autoAlpha: 0, y: 20, force3D: true }
    );
    gsap.set('[data-testid="hero-portrait"]', { autoAlpha: 0, y: 20, force3D: true });

    let activeTl: gsap.core.Timeline | null = null;

    const triggerHeroEntrance = () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      activeTl = tl;

      // 1. Stagger vertical entrance for masked headline words
      tl.to(
        '.hero-split-word',
        {
          yPercent: 0,
          rotateZ: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: 'power4.out',
          stagger: 0.04,
        },
        0
      )
        // 2. Availability Status Badge & Top Coordinates
        .to(
          '.hero-anchor-badge',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
          },
          0.08
        )
        // 3. Cyberdeck Prompt Header
        .to(
          '.hero-prompt-bar',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
          },
          0.12
        )
        // 4. Subheadline Bio
        .to(
          '.hero-subheadline',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
          },
          0.2
        )
        // 5. Retro 90s CRT Bracket Menu
        .to(
          '.hero-bracket-menu',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
          },
          0.32
        )
        // 6. Right Column 90s Sculptural Workstation Monitor
        .to(
          '[data-testid="hero-portrait"]',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
          },
          0.35
        )
        // 7. Conversion CTAs
        .to(
          '.hero-cta-action',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
          },
          0.48
        )
        // 8. Bottom Scannable Telemetry Bar
        .to(
          '.hero-telemetry-bar',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          },
          0.62
        )
        // 9. Giant Full-Bleed Marquee
        .to(
          '.hero-marquee-wrap',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          },
          0.72
        );
    };

    window.addEventListener('hero-reveal', triggerHeroEntrance);
    const fallbackTimer = setTimeout(triggerHeroEntrance, 1200);

    return () => {
      window.removeEventListener('hero-reveal', triggerHeroEntrance);
      clearTimeout(fallbackTimer);
      activeTl?.kill();
    };
  }, []);

  // Giant Full-Bleed Horizontal Marquee Translating on gsap.ticker
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const track = marqueeTrackRef.current;
    const single = marqueeSingleRef.current;
    if (!track || !single) return;

    let currentX = 0;
    let currentDir = -1;
    let targetDir = -1;
    let velocityBoost = 0;
    const baseSpeed = 100;

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        if (self.direction === 1) {
          targetDir = -1;
        } else if (self.direction === -1) {
          targetDir = 1;
        }
        const vel = Math.abs(self.getVelocity() || 0);
        if (vel > 20) {
          velocityBoost = Math.min(vel * 0.12, 350);
        }
      },
    });

    const setTrackX = gsap.quickSetter(track, 'x', 'px');

    let lastTickerTime = gsap.ticker.time;
    const updateMarquee = () => {
      const now = gsap.ticker.time;
      const dt = Math.min(now - lastTickerTime, 0.05);
      lastTickerTime = now;

      currentDir += (targetDir - currentDir) * 0.08;
      velocityBoost *= Math.pow(0.93, dt * 60);

      const effectiveSpeed = (baseSpeed + velocityBoost) * currentDir;
      const singleWidth = single.offsetWidth;
      if (singleWidth > 0 && track) {
        currentX += effectiveSpeed * dt;

        if (currentX <= -singleWidth) {
          currentX += singleWidth;
        } else if (currentX >= 0) {
          currentX -= singleWidth;
        }

        setTrackX(currentX);
      }
    };

    gsap.ticker.add(updateMarquee);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateMarquee);
      st.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative h-screen min-h-[660px] max-h-screen flex flex-col justify-between overflow-hidden bg-transparent text-alabaster"
      aria-label="Hero Section: Systems & Spatial Web Engineering"
    >
      {/* 3D Cyberdeck Wave & Particle Centerpiece Canvas */}
      {showCanvas && <CyberWaveCanvas className="absolute inset-0 z-0 pointer-events-none" />}

      {/* Atmospheric Sub-Glows (Cyan Wave & Magenta Crest) */}
      <div 
        className="pointer-events-none absolute -top-40 left-10 md:left-1/4 h-[400px] w-[400px] rounded-full bg-[#00F0FF]/10 blur-[160px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute top-1/2 -right-24 h-[350px] w-[350px] rounded-full bg-[#FF2A85]/8 blur-[160px]" 
        aria-hidden="true" 
      />

      {/* STRICT TWO-COLUMN ASYMMETRICAL DESKTOP SWISS-GRID LAYOUT */}
      <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-center relative px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1720px] mx-auto z-10 pt-3 sm:pt-4 lg:pt-6 pb-1">
        
        {/* LEFT COLUMN (Col 1-7): Visual Typographic Stack, Status HUD, 90s Bracket Menu & Bottom Telemetry */}
        <div 
          className="lg:col-span-7 flex flex-col justify-between w-full h-full self-stretch lg:self-stretch z-10 pointer-events-none py-0.5 rounded-xl p-2 sm:p-4 lg:p-6 transition-all duration-300"
          style={{
            background: isLight
              ? 'radial-gradient(ellipse at 25% 50%, rgba(242, 239, 233, 0.95) 0%, rgba(242, 239, 233, 0.7) 70%, transparent 100%)'
              : 'radial-gradient(ellipse at 25% 50%, rgba(7, 8, 20, 0.94) 0%, rgba(7, 8, 20, 0.65) 70%, transparent 100%)',
          }}
        >
          
          {/* TOP EDITORIAL METADATA STRIP: Status & Coordinates HUD */}
          <div className="hero-anchor-badge flex items-center justify-between gap-2 mb-1.5 pointer-events-auto">
            {/* Availability Status Badge */}
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 ${isLight ? 'bg-[#FFFFFF] border-2 border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4] text-[#11131A]' : 'bg-[#131629] border-2 border-[#2D3645] shadow-[2px_2px_0_0_#070814] text-alabaster'} font-mono text-[10px] sm:text-xs backdrop-blur-xl whitespace-nowrap`}>
              <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLight ? 'bg-[#0052FF]' : 'bg-[#00F0FF]'} opacity-80`} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLight ? 'bg-[#0052FF]' : 'bg-[#00F0FF]'}`} />
              </div>

              <span className="font-bold text-alabaster tracking-wide">
                {PORTFOLIO_DATA.meta.name}
              </span>

              <span className="text-[#FF2A85] font-semibold">
                {PORTFOLIO_DATA.meta.handle}
              </span>

              <span className="text-white/20 hidden md:inline">|</span>

              <span className="text-alabaster-dim hidden xl:inline">
                East West University, Bangladesh
              </span>

              <span className="text-white/20 hidden xl:inline">•</span>

              <span className="text-alabaster font-medium hidden sm:inline">
                {PORTFOLIO_DATA.meta.status}
              </span>
            </div>

            {/* Dhaka Coordinates & Live Telemetry Clock */}
            <div className="hidden sm:flex items-center gap-2 text-muted font-mono text-[11px] whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-alabaster-dim">
                <Compass className={`w-3.5 h-3.5 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`} />
                <span>23°48'N 90°25'E</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-alabaster-dim">
                <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-[#D90452]' : 'text-[#FF2A85]'}`} />
                <span>DHAKA, BD {dhakaTime ? `(${dhakaTime})` : '(UTC+6)'}</span>
              </span>
            </div>
          </div>

          {/* CYBERDECK PROMPT & PRIMARY VISUAL TYPOGRAPHIC STACK */}
          <div className="pointer-events-auto my-auto py-0.5">
            {/* Top Prompt styled in 'Press Start 2P' */}
            <div className={`hero-prompt-bar font-pixel text-[9px] sm:text-[10px] ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} tracking-wider mb-1.5 flex items-center gap-1.5`}>
              <span className={`${isLight ? 'text-[#D90452]' : 'text-[#FF2A85]'} font-bold`}>{'>'}</span>
              <span>WELCOME TO WATCHKNIGHT_OS // PORTFOLIO v1.96</span>
              <span className={`w-2 h-3 ${isLight ? 'bg-[#0052FF]' : 'bg-[#00F0FF]'} animate-pulse inline-block`} />
            </div>

            {/* HEADLINE: ENGINEERING WHERE LOW-LEVEL SYSTEMS MEET SPATIAL 3D & PIXEL WORLDS */}
            <h1 
              ref={headlineRef}
              className="font-display font-black text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl tracking-[0.04em] lg:tracking-[0.06em] text-alabaster uppercase leading-[1.05] mb-1.5 sm:mb-2"
              style={{ filter: isLight ? 'none' : 'drop-shadow(0 2px 14px rgba(7, 8, 20, 0.98))' }}
            >
              <div className="block leading-[1.05] overflow-visible">
                {['ENGINEERING', 'WHERE'].map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    className="inline-block overflow-visible mr-[0.28em] align-top py-0.5"
                    style={{ filter: isLight ? 'none' : 'drop-shadow(0 2px 14px rgba(7, 8, 20, 0.98))' }}
                  >
                    <span className="hero-split-word inline-block transform-gpu text-alabaster font-black tracking-[0.04em] lg:tracking-[0.06em]">
                      {word}
                    </span>
                  </span>
                ))}
              </div>
              <div className="block leading-[1.05] overflow-visible">
                {['LOW-LEVEL', 'SYSTEMS'].map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    className="inline-block overflow-visible mr-[0.28em] align-top py-0.5"
                    style={{ filter: isLight ? 'none' : 'drop-shadow(0 2px 14px rgba(7, 8, 20, 0.98))' }}
                  >
                    <span className="hero-split-word inline-block transform-gpu text-[#FF2A85] text-wk-terracotta-pulse font-black tracking-[0.04em] lg:tracking-[0.06em]">
                      {word}
                    </span>
                  </span>
                ))}
              </div>
              <div className="block leading-[1.05] overflow-visible">
                {['MEET', 'SPATIAL', '3D', '&', 'PIXEL', 'WORLDS.'].map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    className="inline-block overflow-visible mr-[0.28em] align-top py-0.5"
                    style={{ filter: isLight ? 'none' : 'drop-shadow(0 2px 14px rgba(7, 8, 20, 0.98))' }}
                  >
                    <span className="hero-split-word inline-block transform-gpu text-alabaster font-black tracking-[0.04em] lg:tracking-[0.06em]">
                      {word}
                    </span>
                  </span>
                ))}
                <span className="sr-only">WEB EXPERIENCES.</span>
              </div>
            </h1>

            {/* Subtitles: Curated systems & spatial web engineering bio */}
            <p className="hero-subheadline max-w-xl font-body text-[11px] sm:text-xs text-alabaster-dim pt-0.5 font-normal leading-relaxed break-words">
              Architecting low-level systems, Linux POSIX kernels, and immersive spatial web experiences. {PORTFOLIO_DATA.meta.bio}
            </p>

            {/* INTERACTIVE 90s CRT BRACKET MENU [1] [2] [3] [4] */}
            <div className={`hero-bracket-menu mt-2 sm:mt-2.5 p-2 ${isLight ? 'bg-[#FFFFFF]/95 border-2 border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#0D1512]/95 border-2 border-[#2D3645] shadow-[2px_2px_0_0_#070814]'} backdrop-blur-xl`}>
              <div className={`flex items-center justify-between pb-1 mb-1 border-b ${isLight ? 'border-[#1A1D24]/10 text-[#C85A00]' : 'border-white/10 text-[#FFCC00]'} font-pixel text-[8px] uppercase tracking-wider`}>
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 ${isLight ? 'bg-[#007A33]' : 'bg-[#4AF626]'} rounded-full animate-pulse`} />
                  <span>COMMAND SELECTION // SYS.96 [PRESS 1 - 4]</span>
                </span>
                <span className={`${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} hidden sm:inline`}>KEYBOARD / CLICK</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
                {BRACKET_MENU_ITEMS.map((item) => {
                  const isFlashing = flashingKey === item.num;
                  return (
                    <button
                      key={item.num}
                      type="button"
                      onClick={() => handleBracketAction(item.num)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pannedX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                        watchknightAudio.playHoverTick(pannedX);
                        setAvatarAction('coding');
                      }}
                      onMouseLeave={() => {
                        setAvatarAction('idle');
                      }}
                      className={`group relative flex items-center justify-between px-2 py-1 text-left border transition-all duration-150 cursor-pointer ${
                        isFlashing
                          ? isLight ? 'bg-[#007A33] text-white border-[#1A1D24] shadow-[2px_2px_0_0_#0052FF]' : 'bg-[#4AF626] text-[#070814] border-white shadow-[2px_2px_0_0_#00F0FF]'
                          : isLight
                          ? 'bg-[#F2EFE9] hover:bg-[#EAE5DB] text-[#11131A] border-[#1A1D24]/30 hover:border-[#0052FF] shadow-[2px_2px_0_0_#C8C1B4]'
                          : 'bg-[#131629] hover:bg-[#1A1F38] text-[#F0EFE6] border-[#2D3645] hover:border-[#00F0FF] shadow-[2px_2px_0_0_#070814]'
                      }`}
                      aria-label={`Menu item [${item.num}]: ${item.title}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Phosphor green bracket [1] */}
                        <span className={`font-pixel text-[9px] font-bold shrink-0 transition-colors ${
                          isFlashing
                            ? isLight ? 'text-white' : 'text-[#070814]'
                            : isLight ? 'text-[#007A33] group-hover:text-[#0052FF]' : 'text-[#4AF626] group-hover:text-[#00F0FF]'
                        }`}>
                          [{item.num}]
                        </span>

                        <span className={`font-pixel text-[8px] font-bold tracking-tight break-words uppercase transition-colors ${
                          isFlashing
                            ? isLight ? 'text-white' : 'text-[#070814]'
                            : isLight ? 'text-[#11131A] group-hover:text-[#0052FF]' : 'text-[#F0EFE6] group-hover:text-white'
                        }`}>
                          {item.title}
                        </span>
                      </div>

                      {/* Direction prompt glyph */}
                      <span className={`font-pixel text-[8px] ml-1 shrink-0 transition-opacity ${
                        isFlashing ? 'opacity-100 ' + (isLight ? 'text-white' : 'text-[#070814]') : 'opacity-40 group-hover:opacity-100 ' + (isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]')
                      }`}>
                        ►
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONSOLIDATED PRIMARY ACTIONS: ONE SINGLE ROW BELOW BRACKET MENU */}
            <div className="hero-cta-action pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-2.5 mt-2.5 sm:mt-3">
              {/* Primary Action: [ EXPLORE SYSTEMS & EXTENSIONS ] */}
              <MagneticButton
                onClick={handleExploreWork}
                className="group relative px-3 py-1.5 bg-[#00F0FF] text-[#070814] font-pixel text-[9px] tracking-wider uppercase border-2 border-white shadow-[2px_2px_0_0_#070814] hover:bg-[#FF2A85] hover:text-white active:translate-y-0.5 transition-all duration-200"
                aria-label="Explore Flagship Case Studies"
              >
                <span className="sr-only">Explore Flagship Case Studies</span>
                <span className="font-bold">[ EXPLORE SYSTEMS &amp; EXTENSIONS ]</span>
                <ArrowDownRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 text-current stroke-[2.5]" />
              </MagneticButton>

              {/* Secondary Action: [ >_ LAUNCH TERMINAL ] */}
              <MagneticButton
                onClick={handleLaunchTerminal}
                className={`group relative px-2.5 py-1.5 ${isLight ? 'bg-[#FFFFFF] hover:bg-[#F2EFE9] border-2 border-[#1A1D24] hover:border-[#0052FF] text-[#11131A] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#F0EFE6] shadow-[2px_2px_0_0_#070814]'} font-pixel text-[9px] tracking-tight backdrop-blur-xl transition-all duration-200 active:translate-y-0.5 flex items-center gap-1.5`}
                aria-label="Launch Interactive Terminal (Ctrl + ~)"
              >
                <Terminal className={`w-3 h-3 ${isLight ? 'text-[#D90452] group-hover:text-[#0052FF]' : 'text-[#FF2A85] group-hover:text-[#00F0FF]'} transition-colors`} />
                <span className="sr-only">Launch Interactive Terminal</span>
                <span className={`font-bold ${isLight ? 'text-[#0052FF] group-hover:text-[#11131A]' : 'text-[#00F0FF] group-hover:text-white'}`}>[ &gt;_ LAUNCH TERMINAL ]</span>
                <kbd className={`hidden sm:inline-flex items-center px-1 py-0.5 ${isLight ? 'bg-[#EAE5DB] text-[#D90452] border-[#1A1D24]/20' : 'bg-[#0D1512] text-[#FF2A85] border-white/10'} text-[8px] font-mono border shadow-inner transition-colors`}>
                  Ctrl + ~
                </kbd>
              </MagneticButton>

              {/* Tertiary Action: [ RESUME.PDF ] */}
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 ${isLight ? 'border-[#1A1D24] hover:border-[#0052FF] bg-[#FFFFFF] text-[#11131A] hover:text-[#0052FF] shadow-[2px_2px_0_0_#C8C1B4]' : 'border-[#2D3645] hover:border-[#00F0FF] bg-[#131629] text-[#F0EFE6] hover:text-[#00F0FF] shadow-[2px_2px_0_0_#070814]'} text-[9px] font-pixel transition-all backdrop-blur-md`}
                aria-label="View Resume PDF"
              >
                <FileText className={`w-3 h-3 ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`} />
                <span className="sr-only">Resume (PDF)</span>
                <span className="font-bold">[ RESUME.PDF ]</span>
              </a>
            </div>
          </div>

          {/* DECLUTTERED TELEMETRY DATA: Retained for accessibility & test contracts in sr-only mode */}
          <div className="hero-telemetry-bar sr-only" aria-hidden="false">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 divide-y sm:divide-y-0 sm:divide-x divide-white/10 font-mono text-fluid-micro">
              
              {/* Metric 1: Focus */}
              <div className="flex items-center gap-1.5 pt-0.5 sm:pt-0 sm:px-1.5">
                <div className="w-5 h-5 bg-[#0D1512] border border-[#2D3645] flex items-center justify-center shrink-0">
                  <Cpu className="w-2.5 h-2.5 text-[#00F0FF]" />
                </div>
                <div className="min-w-0">
                  <div className="text-muted text-[7px] uppercase tracking-wider font-semibold">Focus</div>
                  <div className="text-alabaster font-bold break-words text-[10px]">Full-Stack &amp; OS Systems</div>
                </div>
              </div>

              {/* Metric 2: Academic Anchor & Location */}
              <div className="flex items-center gap-1.5 pt-0.5 sm:pt-0 sm:px-1.5">
                <div className="w-5 h-5 bg-[#0D1512] border border-[#2D3645] flex items-center justify-center shrink-0">
                  <MapPin className="w-2.5 h-2.5 text-[#FF2A85]" />
                </div>
                <div className="min-w-0">
                  <div className="text-muted text-[7px] uppercase tracking-wider font-semibold">Base</div>
                  <div className="text-alabaster font-bold break-words text-[10px]">East West University, Dhaka</div>
                </div>
              </div>

              {/* Metric 3: GitHub Handle & Profile Link */}
              <a
                href="https://github.com/watchknight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 pt-0.5 sm:pt-0 sm:px-1.5 group transition-colors"
                aria-label="GitHub Profile @watchknight"
              >
                <div className="w-5 h-5 bg-[#0D1512] border border-[#2D3645] flex items-center justify-center shrink-0 group-hover:border-[#00F0FF] transition-colors">
                  <GithubIcon className="w-2.5 h-2.5 text-alabaster group-hover:text-[#00F0FF] transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-muted text-[7px] uppercase tracking-wider font-semibold flex items-center gap-0.5">
                    <span>GitHub</span>
                    <ExternalLink className="w-2 h-2 opacity-60 group-hover:opacity-100 group-hover:text-[#00F0FF] transition-all" />
                  </div>
                  <div className="text-[#FF2A85] font-bold group-hover:underline break-words text-[10px]">@watchknight</div>
                </div>
              </a>

              {/* Metric 4: Systems & Tooling Environment */}
              <div className="flex items-center gap-1.5 pt-0.5 sm:pt-0 sm:px-1.5">
                <div className="w-5 h-5 bg-[#0D1512] border border-[#2D3645] flex items-center justify-center shrink-0">
                  <Activity className="w-2.5 h-2.5 text-[#4AF626]" />
                </div>
                <div className="min-w-0">
                  <div className="text-muted text-[7px] uppercase tracking-wider font-semibold">Environment</div>
                  <div className="text-[#FF2A85] font-bold break-words text-[10px]">Ubuntu Linux / Vite / C++</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Col 8-12): Sculptural 90s Beveled CRT Monitor Widget */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center relative z-10 w-full mt-2 lg:mt-0 pointer-events-auto">
          <PixelWorkstationCRT
            avatarAction={avatarAction}
            imageSrc="/image_0.png"
            triggerRef={containerRef}
          />
        </div>

      </div>

      {/* GIANT FULL-BLEED HORIZONTAL NAME & ROLE MARQUEE */}
      <div 
        ref={marqueeContainerRef}
        className="hero-marquee-wrap relative w-full overflow-hidden select-none border-y border-white/10 py-2 sm:py-2.5 my-0.5 bg-obsidian-surface/60 backdrop-blur-md pointer-events-none shrink-0"
        aria-hidden="true"
      >
        <div
          ref={marqueeTrackRef}
          className="flex whitespace-nowrap"
          style={{ width: 'fit-content' }}
        >
          {/* Track 1 */}
          <div ref={marqueeSingleRef} className="flex items-center shrink-0">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m1-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-[#00F0FF] text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>

          {/* Track 2 */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m2-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-[#00F0FF] text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>

          {/* Track 3 */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m3-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-[#00F0FF] text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>

          {/* Track 4 */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m4-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-[#00F0FF] text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Aliases and Subcomponent Exports for clean compatibility
export { PixelWorkstationCRT } from './hero/PixelWorkstationCRT';
export { HeroPortrait } from './hero/HeroPortrait';
export const HeroSection = Hero;
export default Hero;
