import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '../hooks/useLenis';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { HeroPortrait } from './hero/HeroPortrait';
import { MagneticButton } from './ui/MagneticButton';
import { GithubIcon } from './ui/Icons';
import { 
  ArrowDownRight, 
  Terminal, 
  Activity, 
  MapPin, 
  Cpu, 
  ExternalLink,
  Command,
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

export const Hero: React.FC = () => {
  const { scrollTo } = useLenis();
  const containerRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const marqueeContainerRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const marqueeSingleRef = useRef<HTMLDivElement | null>(null);
  const hasRevealedRef = useRef<boolean>(false);

  const [dhakaTime, setDhakaTime] = useState<string>('');

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
  const handleLaunchTerminal = () => {
    scrollTo('#terminal', { offset: -80 });
    window.dispatchEvent(new CustomEvent('focus-terminal'));
    setTimeout(() => {
      const input = document.getElementById('terminal-input') as HTMLInputElement | null;
      input?.focus({ preventScroll: true });
    }, 450);
  };

  const handleExploreWork = () => {
    scrollTo('#work', { offset: 0 });
  };

  // Global keyboard shortcut listener for Ctrl + ~ (or Ctrl + `)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === '~' || e.code === 'Backquote')) {
        e.preventDefault();
        handleLaunchTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollTo]);

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
          '.hero-subheadline',
          '.hero-cta-action',
          '.hero-telemetry-bar',
          '.hero-marquee-wrap',
          '.hero-portrait-bg',
          '.hero-portrait-meta',
          '.hero-portrait-meta-marker',
          '.hero-portrait-meta-divider',
        ],
        { autoAlpha: 1, y: 0, yPercent: 0, rotateZ: 0, scale: 1 }
      );
      gsap.set('.hero-portrait-img-mask', {
        clipPath: 'inset(0% 0% 0% 0%)',
        webkitClipPath: 'inset(0% 0% 0% 0%)',
        autoAlpha: 1,
      });
      return;
    }

    // Set initial masked state with autoAlpha
    gsap.set('.hero-split-word', { yPercent: 110, rotateZ: 3, autoAlpha: 0, force3D: true });
    gsap.set(
      [
        '.hero-anchor-badge',
        '.hero-subheadline',
        '.hero-cta-action',
        '.hero-telemetry-bar',
        '.hero-marquee-wrap',
      ],
      { autoAlpha: 0, y: 20, force3D: true }
    );

    // Initial Hero Portrait states
    gsap.set('.hero-portrait-bg', { autoAlpha: 0, scale: 0.94, force3D: true });
    gsap.set('.hero-portrait-img-mask', {
      clipPath: 'inset(100% 0 0 0)',
      webkitClipPath: 'inset(100% 0 0 0)',
      autoAlpha: 1,
    });
    gsap.set('.hero-portrait-meta', { autoAlpha: 0 });
    gsap.set('.hero-portrait-meta-marker', { autoAlpha: 0, y: 16, force3D: true });
    gsap.set('.hero-portrait-meta-divider', { autoAlpha: 0 });

    let activeTl: gsap.core.Timeline | null = null;

    const triggerHeroEntrance = () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      activeTl = tl;

      // 1. Stagger vertical entrance for every masked headline word
      // Starts at 0s (0.3s before preloader curtain finishes lifting)
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
        // 3. Hero Portrait Background Layer: Rich textured #12151C card scale-fades in first
        .to(
          '.hero-portrait-bg',
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
          },
          0.1
        )
        // 4. Curiosity-Gap Subheadline
        .to(
          '.hero-subheadline',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
          },
          0.25
        )
        // 5. Hero Portrait Shutter Entry: Uncover photo from bottom up via clipPath & webkitClipPath
        // Timed to run exactly as preloader curtain finishes lifting (0.3s mark in timeline)
        .to(
          '.hero-portrait-img-mask',
          {
            clipPath: 'inset(0% 0 0% 0)',
            webkitClipPath: 'inset(0% 0 0% 0)',
            duration: 1.6,
            ease: 'power4.inOut',
          },
          0.3
        )
        // 6. Simultaneously stagger-reveal metadata coordinates directly beneath photo
        .to(
          '.hero-portrait-meta',
          {
            autoAlpha: 1,
            duration: 0.4,
            ease: 'power2.out',
          },
          0.35
        )
        .to(
          ['.hero-portrait-meta-marker', '.hero-portrait-meta-divider'],
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: 'power3.out',
            stagger: 0.08,
          },
          0.38
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
          0.6
        )
        // 8. Bottom Scannable Telemetry Bar
        .to(
          '.hero-telemetry-bar',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          },
          0.75
        )
        // 9. Giant Full-Bleed Marquee
        .to(
          '.hero-marquee-wrap',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          },
          0.85
        );
    };

    // Trigger entrance 0.3s before preloader finishes (via event)
    window.addEventListener('hero-reveal', triggerHeroEntrance);

    // Resilient fallback timer (strictly as safety net if preloader was suppressed)
    const fallbackTimer = setTimeout(triggerHeroEntrance, 5000);

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
    let currentDir = -1; // -1 translates left (downward scroll), 1 translates right (upward scroll)
    let targetDir = -1;
    let velocityBoost = 0;
    const baseSpeed = 100; // base pixels per second

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
      className="relative h-screen min-h-[660px] max-h-screen flex flex-col justify-between overflow-hidden bg-obsidian text-alabaster"
      aria-label="Hero Section: Systems & Spatial Web Engineering"
    >
      {/* Editorial Atmospheric Sub-Glows (High-Contrast Restraint: Terracotta Rust #A74024) */}
      <div 
        className="pointer-events-none absolute -top-40 left-10 md:left-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[160px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute top-1/2 -right-24 h-[350px] w-[350px] rounded-full bg-accent-coral/8 blur-[160px]" 
        aria-hidden="true" 
      />

      {/* STRICT TWO-COLUMN ASYMMETRICAL DESKTOP SWISS-GRID LAYOUT */}
      <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-center relative px-4 sm:px-8 lg:px-12 xl:px-16 overflow-hidden max-w-[1720px] mx-auto z-10 pt-28 sm:pt-32 lg:pt-28 xl:pt-32 pb-1">
        
        {/* LEFT COLUMN (Col 1-7): Visual Typographic Stack, Status HUD & Bottom Telemetry HUD */}
        <div className="lg:col-span-7 flex flex-col justify-between w-full h-full self-stretch lg:self-stretch z-10 pointer-events-none py-1">
          
          {/* TOP EDITORIAL METADATA STRIP: Status & Coordinates HUD */}
          <div className="hero-anchor-badge flex flex-wrap items-center justify-between gap-2 mb-2 lg:mb-3 pointer-events-auto">
            {/* Availability Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-surface/90 border border-white/10 shadow-editorial-card font-mono text-[11px] sm:text-xs backdrop-blur-xl">
              <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-80" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </div>

              <span className="font-bold text-alabaster tracking-wide">
                {PORTFOLIO_DATA.meta.name}
              </span>

              <span className="text-accent-coral font-semibold">
                {PORTFOLIO_DATA.meta.handle}
              </span>

              <span className="text-white/20">|</span>

              <span className="text-alabaster-dim hidden sm:inline">
                East West University, Bangladesh
              </span>

              <span className="text-white/20 hidden sm:inline">•</span>

              <span className="text-alabaster font-medium">
                {PORTFOLIO_DATA.meta.status}
              </span>
            </div>

            {/* Dhaka Coordinates & Live Telemetry Clock */}
            <div className="hidden sm:flex items-center gap-2.5 text-muted font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-alabaster-dim">
                <Compass className="w-3.5 h-3.5 text-accent" />
                <span>23°48'N 90°25'E</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5 text-alabaster-dim">
                <Clock className="w-3.5 h-3.5 text-accent-coral" />
                <span>DHAKA, BD {dhakaTime ? `(${dhakaTime})` : '(UTC+6)'}</span>
              </span>
              <span className="text-white/20 hidden xl:inline">•</span>
              <span className="text-alabaster font-semibold uppercase tracking-widest text-[10px] hidden xl:inline">
                VOL. 2026 // ARCH-01
              </span>
            </div>
          </div>

          {/* PRIMARY VISUAL TYPOGRAPHIC STACK: Deep expansive tracking */}
          <div className="pointer-events-auto my-auto py-1">
            <h1 
              ref={headlineRef}
              className="font-display font-black text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl tracking-[0.04em] lg:tracking-[0.06em] text-alabaster uppercase leading-[1.05] mb-2 sm:mb-3"
            >
              <div className="block leading-[1.05] overflow-visible">
                {['ENGINEERING', 'WHERE'].map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    className="inline-block overflow-hidden mr-[0.28em] align-top py-0.5"
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
                    className="inline-block overflow-hidden mr-[0.28em] align-top py-0.5"
                  >
                    <span className="hero-split-word inline-block transform-gpu text-wk-terracotta-pulse font-black tracking-[0.04em] lg:tracking-[0.06em]">
                      {word}
                    </span>
                  </span>
                ))}
              </div>
              <div className="block leading-[1.05] overflow-visible">
                {['MEET', 'SPATIAL', 'WEB', 'EXPERIENCES.'].map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    className="inline-block overflow-hidden mr-[0.28em] align-top py-0.5"
                  >
                    <span className="hero-split-word inline-block transform-gpu text-alabaster font-black tracking-[0.04em] lg:tracking-[0.06em]">
                      {word}
                    </span>
                  </span>
                ))}
              </div>
            </h1>

            {/* Subtitles: Curated systems & spatial engineering bio */}
            <p className="hero-subheadline max-w-xl font-body text-xs sm:text-sm lg:text-xs xl:text-sm text-alabaster-dim pt-1 font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">
              {PORTFOLIO_DATA.meta.bio}
            </p>

            {/* High-Conversion CTAs: Tactile Magnetic Buttons & Direct Action Links */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-3 lg:mt-4 pointer-events-auto">
              {/* Primary Magnetic CTA */}
              <div className="hero-cta-action pointer-events-auto">
                <MagneticButton
                  onClick={handleExploreWork}
                  className="group relative px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-accent text-alabaster font-display font-black text-xs sm:text-xs tracking-wider uppercase shadow-editorial-card hover:bg-accent-coral active:scale-95 transition-all duration-200"
                  aria-label="Explore Flagship Case Studies"
                >
                  <span>Explore Flagship Case Studies</span>
                  <ArrowDownRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 text-alabaster stroke-[2.5]" />
                </MagneticButton>
              </div>

              {/* Secondary Magnetic CTA */}
              <div className="hero-cta-action pointer-events-auto">
                <MagneticButton
                  onClick={handleLaunchTerminal}
                  className="group relative px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-obsidian-card/90 hover:bg-obsidian-elevated border border-white/10 hover:border-accent-coral/50 text-alabaster font-mono text-xs tracking-tight backdrop-blur-xl transition-all duration-200 shadow-editorial-card active:scale-95"
                  aria-label="Launch Interactive Terminal (Ctrl + ~)"
                >
                  <Terminal className="w-3.5 h-3.5 text-accent-coral group-hover:text-accent transition-colors" />
                  <span className="font-semibold">Launch Interactive Terminal</span>
                  
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 text-accent-coral text-[10px] font-mono border border-white/10 shadow-inner group-hover:border-accent-coral/40 transition-colors">
                    <Command className="w-2.5 h-2.5 sm:hidden" />
                    <span>Ctrl + ~</span>
                  </kbd>
                </MagneticButton>
              </div>

              {/* Architectural transmission links */}
              <div className="hero-cta-action pointer-events-auto flex items-center gap-2">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 hover:border-accent/40 bg-obsidian-card/80 text-xs font-mono text-alabaster hover:text-accent transition-colors backdrop-blur-md"
                  aria-label="View Resume PDF"
                >
                  <FileText className="w-3 h-3" />
                  <span>Resume (PDF)</span>
                </a>

                <a
                  href="https://github.com/watchknight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 hover:border-accent/40 bg-obsidian-card/80 text-xs font-mono text-alabaster hover:text-accent transition-colors backdrop-blur-md"
                  aria-label="Visit GitHub Profile @watchknight"
                >
                  <GithubIcon className="w-3 h-3" />
                  <span>@watchknight</span>
                </a>
              </div>
            </div>
          </div>

          {/* BOTTOM SCANNABLE TELEMETRY HUD: 4 Scannable Authority Metrics cleanly aligned */}
          <div className="hero-telemetry-bar rounded-xl bg-obsidian-card/85 border border-white/10 backdrop-blur-2xl p-2.5 sm:p-3 shadow-editorial-card pointer-events-auto mt-2 lg:mt-3 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 font-mono text-fluid-micro">
              
              {/* Metric 1: Focus */}
              <div className="flex items-center gap-2.5 pt-1.5 sm:pt-0 sm:px-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-muted text-[9px] uppercase tracking-wider font-semibold">Focus</div>
                  <div className="text-alabaster font-bold truncate text-xs">Full-Stack &amp; OS Systems</div>
                </div>
              </div>

              {/* Metric 2: Academic Anchor & Location */}
              <div className="flex items-center gap-2.5 pt-1.5 sm:pt-0 sm:px-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent-coral/10 border border-accent-coral/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-accent-coral" />
                </div>
                <div className="min-w-0">
                  <div className="text-muted text-[9px] uppercase tracking-wider font-semibold">Base</div>
                  <div className="text-alabaster font-bold truncate text-xs">East West University, Dhaka</div>
                </div>
              </div>

              {/* Metric 3: GitHub Handle & Profile Link */}
              <a
                href="https://github.com/watchknight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 pt-1.5 sm:pt-0 sm:px-2.5 group transition-colors"
                aria-label="GitHub Profile @watchknight"
              >
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center shrink-0 group-hover:border-accent group-hover:bg-accent/10 transition-colors">
                  <GithubIcon className="w-3.5 h-3.5 text-alabaster group-hover:text-accent transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-muted text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <span>GitHub</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-accent transition-all" />
                  </div>
                  <div className="text-accent-coral font-bold group-hover:underline truncate text-xs">@watchknight</div>
                </div>
              </a>

              {/* Metric 4: Systems & Tooling Environment */}
              <div className="flex items-center gap-2.5 pt-1.5 sm:pt-0 sm:px-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-muted text-[9px] uppercase tracking-wider font-semibold">Environment</div>
                  <div className="text-accent-coral font-bold truncate text-xs">Ubuntu Linux / Vite / C++</div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Col 8-12): Dedicated Vertical Canvas Container for Portrait */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center relative z-10 w-full mt-2 lg:mt-0 pointer-events-auto">
          <HeroPortrait triggerRef={containerRef} imageSrc="/image_0.png" />
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
                <span className="text-accent text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>

          {/* Track 2 (Duplicate for Infinite Velocity Loop) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m2-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-accent text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>

          {/* Track 3 (Buffer for Ultra-Wide / 4K Screens) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m3-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-accent text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>

          {/* Track 4 (Reverse Buffer for Dynamic Direction Flipping) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m4-${index}`} className="flex items-center">
                <span className="font-display font-black text-lg sm:text-xl lg:text-2xl tracking-tight uppercase text-alabaster/90 px-3 sm:px-6">
                  {item}
                </span>
                <span className="text-accent text-base sm:text-lg font-bold px-1.5 sm:px-3">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Aliases and Subcomponent Exports for clean compatibility
export { HeroPortrait } from './hero/HeroPortrait';
export const HeroSection = Hero;
export default Hero;
