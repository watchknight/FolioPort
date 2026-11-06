import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '../hooks/useLenis';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { HeroCanvas } from './hero/HeroCanvas';
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

  // Kinetic Hero Choreography: Masked Split-Word Vertical Entrance
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
          '.hero-side-editorial',
          '.hero-marquee-wrap',
        ],
        { autoAlpha: 1, y: 0, yPercent: 0, rotateZ: 0 }
      );
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
        '.hero-side-editorial',
        '.hero-marquee-wrap',
      ],
      { autoAlpha: 0, y: 20, force3D: true }
    );

    let activeTl: gsap.core.Timeline | null = null;

    const triggerHeroEntrance = () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      activeTl = tl;

      // 1. Stagger vertical entrance for every masked headline word
      // yPercent: 110 to 0, rotateZ: 3 to 0, duration: 1.1, ease: 'power4.out', stagger: 0.04
      // STARTS AT 0s (EXACTLY 0.3s before preloader curtain finishes lifting)
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
        // 2. Availability Status Badge & Coordinates concurrently
        .to(
          '.hero-anchor-badge',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
          },
          0.08
        )
        // 3. Curiosity-Gap Subheadline & Side Editorial Card
        .to(
          ['.hero-subheadline', '.hero-side-editorial'],
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.1,
          },
          0.35
        )
        // 4. Conversion CTAs
        .to(
          '.hero-cta-action',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
          },
          0.55
        )
        // 5. Giant Marquee Reveal
        .to(
          '.hero-marquee-wrap',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          },
          0.7
        )
        // 6. Scannable Telemetry Bar
        .to(
          '.hero-telemetry-bar',
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
          },
          0.8
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
  // Reverses its horizontal direction dynamically based on ScrollTrigger scroll direction (self.direction)
  // and dynamically scales with inertial scroll velocity
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

    // ScrollTrigger detecting scroll direction and velocity
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        // self.direction: 1 when scrolling down, -1 when scrolling up
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

      // Smoothly interpolate direction transition
      currentDir += (targetDir - currentDir) * 0.08;

      // Smoothly decay velocity boost
      velocityBoost *= Math.pow(0.93, dt * 60);

      const effectiveSpeed = (baseSpeed + velocityBoost) * currentDir;
      const singleWidth = single.offsetWidth;
      if (singleWidth > 0 && track) {
        currentX += effectiveSpeed * dt;

        // Infinite seamless loop wrapping
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

  const headlineLines = [
    { text: 'ENGINEERING WHERE', isAccent: false },
    { text: 'LOW-LEVEL SYSTEMS', isAccent: true },
    { text: 'MEET SPATIAL WEB EXPERIENCES.', isAccent: false },
  ];

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen pt-24 sm:pt-32 md:pt-36 pb-12 flex flex-col justify-between overflow-hidden bg-obsidian text-alabaster"
      aria-label="Hero Section: Systems & Spatial Web Engineering"
    >
      {/* Interactive 2D Physics Node Canvas Hook (Living Domain Constellation) */}
      <HeroCanvas />

      {/* Editorial Atmospheric Sub-Glows (High-Contrast Restraint: Terracotta Rust #A74024) */}
      <div 
        className="pointer-events-none absolute -top-40 left-10 md:left-1/4 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[160px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute top-1/2 -right-24 h-[420px] w-[420px] rounded-full bg-accent-coral/8 blur-[160px]" 
        aria-hidden="true" 
      />

      {/* Main Asymmetric Editorial Stage */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 my-auto pointer-events-none">
        
        {/* TOP EDITORIAL METADATA STRIP: Coordinates & Availability Badge */}
        <div className="hero-anchor-badge flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8 pointer-events-auto">
          {/* Availability Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-obsidian-surface/90 border border-white/10 shadow-editorial-card font-mono text-fluid-micro backdrop-blur-xl">
            {/* Live Operational Status Pulse */}
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
          <div className="hidden md:flex items-center gap-3 text-muted font-mono text-fluid-micro">
            <span className="flex items-center gap-1.5 text-alabaster-dim">
              <Compass className="w-3.5 h-3.5 text-accent" />
              <span>23°48'N 90°25'E</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-alabaster-dim">
              <Clock className="w-3.5 h-3.5 text-accent-coral" />
              <span>DHAKA, BD {dhakaTime ? `(${dhakaTime})` : '(UTC+6)'}</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="text-alabaster font-semibold uppercase tracking-widest text-[10px]">
              VOL. 2026 // ARCH-01
            </span>
          </div>
        </div>

        {/* ASYMMETRIC EDITORIAL COMPOSITION (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column (Headline, Subheadline & Conversion CTAs) */}
          <div className="lg:col-span-8 pointer-events-auto">
            {/* Split-line display typography with overflow-hidden word masks */}
            <div className="mb-6 md:mb-8">
              <h1 
                ref={headlineRef}
                className="font-display font-black text-fluid-hero tracking-tight text-alabaster uppercase leading-[0.96]"
              >
                {headlineLines.map((line, lineIdx) => (
                  <div key={lineIdx} className="block leading-[0.96] overflow-visible">
                    {line.text.split(' ').map((word, wordIdx) => (
                      <span
                        key={wordIdx}
                        className="inline-block overflow-hidden mr-[0.24em] align-top py-0.5"
                        style={{ overflow: 'hidden', display: 'inline-block' }}
                      >
                        <span
                          className={`hero-split-word inline-block will-change-transform transform-gpu ${
                            line.isAccent
                              ? 'text-accent-coral font-black drop-shadow-[0_0_24px_rgba(223,108,79,0.35)]'
                              : 'text-alabaster font-black'
                          }`}
                        >
                          {word}
                        </span>
                      </span>
                    ))}
                  </div>
                ))}
              </h1>

              {/* Curiosity-Gap Sub-headline */}
              <p className="hero-subheadline max-w-2xl font-body text-fluid-lead text-alabaster-dim pt-4 md:pt-6 font-normal leading-relaxed">
                {PORTFOLIO_DATA.meta.bio}
              </p>
            </div>

            {/* High-Conversion CTAs (Magnetic Buttons with Visceral Tactile Rewards) */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-8 pointer-events-auto">
              {/* Primary Magnetic CTA: Flagship Case Studies */}
              <div className="hero-cta-action pointer-events-auto">
                <MagneticButton
                  onClick={handleExploreWork}
                  className="group relative px-6 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-accent text-alabaster font-display font-black text-xs sm:text-sm tracking-wider uppercase shadow-editorial-card hover:bg-accent-coral active:scale-95 transition-all duration-200"
                  aria-label="Explore Flagship Case Studies"
                >
                  <span>Explore Flagship Case Studies</span>
                  <ArrowDownRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 text-alabaster stroke-[2.5]" />
                </MagneticButton>
              </div>

              {/* Secondary Magnetic CTA: Interactive Terminal with Hotkey Cue */}
              <div className="hero-cta-action pointer-events-auto">
                <MagneticButton
                  onClick={handleLaunchTerminal}
                  className="group relative px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-obsidian-card/90 hover:bg-obsidian-elevated border border-white/10 hover:border-accent-coral/50 text-alabaster font-mono text-xs tracking-tight backdrop-blur-xl transition-all duration-200 shadow-editorial-card active:scale-95"
                  aria-label="Launch Interactive Terminal (Ctrl + ~)"
                >
                  <Terminal className="w-4 h-4 text-accent-coral group-hover:text-accent transition-colors" />
                  <span className="font-semibold">Launch Interactive Terminal</span>
                  
                  {/* Keyboard hotkey pill */}
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/5 text-accent-coral text-[10px] font-mono border border-white/10 shadow-inner group-hover:border-accent-coral/40 transition-colors">
                    <Command className="w-2.5 h-2.5 sm:hidden" />
                    <span>Ctrl + ~</span>
                  </kbd>
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Metadata & Quick Transmission Panel */}
          <div className="lg:col-span-4 hero-side-editorial pointer-events-auto hidden md:block">
            <div className="p-5 sm:p-6 rounded-2xl bg-obsidian-card/75 border border-white/10 backdrop-blur-xl shadow-editorial-card space-y-4 font-mono text-fluid-micro">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <span className="text-muted uppercase tracking-widest text-[10px] font-semibold">Architect Dossier</span>
                <span className="text-accent-coral font-bold">2026 EDITION</span>
              </div>

              <div className="space-y-2">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold">Engineer Identity</div>
                <div className="text-alabaster font-bold text-sm">Abdur Rahman Moayed</div>
                <div className="text-accent-coral font-mono text-xs">@watchknight</div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold">Academic Anchor</div>
                <div className="text-alabaster-dim leading-snug">
                  East West University, Dhaka, Bangladesh • Computer Science & Engineering
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold">Core Primitives</div>
                <div className="text-alabaster-dim text-[11px] leading-relaxed">
                  C / Linux Kernel IPC • POSIX Shared Memory • TypeScript • React 18 • GSAP Motion • Canvas 2D
                </div>
              </div>

              {/* Fast transmission action links */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-accent hover:text-accent-coral font-bold transition-colors"
                  aria-label="View Resume PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume (PDF)</span>
                </a>

                <a
                  href="https://github.com/watchknight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-alabaster hover:text-accent-coral transition-colors"
                  aria-label="Visit GitHub Profile @watchknight"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>@watchknight</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* GIANT FULL-BLEED HORIZONTAL NAME & ROLE MARQUEE (LOWER THIRD VIEWPORT) */}
      <div 
        ref={marqueeContainerRef}
        className="hero-marquee-wrap relative w-full overflow-hidden select-none border-y border-white/10 py-3 sm:py-5 my-4 sm:my-6 bg-obsidian-surface/60 backdrop-blur-md pointer-events-none"
        aria-hidden="true"
      >
        <div
          ref={marqueeTrackRef}
          className="flex whitespace-nowrap will-change-transform"
          style={{ width: 'fit-content' }}
        >
          {/* Track 1 */}
          <div ref={marqueeSingleRef} className="flex items-center shrink-0">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m1-${index}`} className="flex items-center">
                <span className="font-display font-black text-fluid-marquee tracking-tighter uppercase text-alabaster/90 px-4 sm:px-8">
                  {item}
                </span>
                <span className="text-accent text-2xl sm:text-4xl font-bold px-2 sm:px-4">✦</span>
              </span>
            ))}
          </div>

          {/* Track 2 (Duplicate for Infinite Velocity Loop) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m2-${index}`} className="flex items-center">
                <span className="font-display font-black text-fluid-marquee tracking-tighter uppercase text-alabaster/90 px-4 sm:px-8">
                  {item}
                </span>
                <span className="text-accent text-2xl sm:text-4xl font-bold px-2 sm:px-4">✦</span>
              </span>
            ))}
          </div>

          {/* Track 3 (Buffer for Ultra-Wide / 4K Screens) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m3-${index}`} className="flex items-center">
                <span className="font-display font-black text-fluid-marquee tracking-tighter uppercase text-alabaster/90 px-4 sm:px-8">
                  {item}
                </span>
                <span className="text-accent text-2xl sm:text-4xl font-bold px-2 sm:px-4">✦</span>
              </span>
            ))}
          </div>

          {/* Track 4 (Reverse Buffer for Dynamic Direction Flipping) */}
          <div className="flex items-center shrink-0" aria-hidden="true">
            {MARQUEE_ITEMS.map((item, index) => (
              <span key={`m4-${index}`} className="flex items-center">
                <span className="font-display font-black text-fluid-marquee tracking-tighter uppercase text-alabaster/90 px-4 sm:px-8">
                  {item}
                </span>
                <span className="text-accent text-2xl sm:text-4xl font-bold px-2 sm:px-4">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM HERO TELEMETRY STRIP (JetBrains Mono • 4 Scannable Authority Metrics) */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 pointer-events-none">
        <div className="hero-telemetry-bar rounded-2xl bg-obsidian-card/85 border border-white/10 backdrop-blur-2xl p-3 sm:p-4 shadow-editorial-card pointer-events-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 font-mono text-fluid-micro">
            
            {/* Metric 1: Focus */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold">Focus</div>
                <div className="text-alabaster font-bold truncate">Full-Stack & OS Systems</div>
              </div>
            </div>

            {/* Metric 2: Academic Anchor & Location */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 rounded-lg bg-accent-coral/10 border border-accent-coral/30 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-accent-coral" />
              </div>
              <div className="min-w-0">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold">Base</div>
                <div className="text-alabaster font-bold truncate">East West University, Dhaka</div>
              </div>
            </div>

            {/* Metric 3: GitHub Handle & Profile Link */}
            <a
              href="https://github.com/watchknight"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3 group transition-colors"
              aria-label="GitHub Profile @watchknight"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center shrink-0 group-hover:border-accent group-hover:bg-accent/10 transition-colors">
                <GithubIcon className="w-4 h-4 text-alabaster group-hover:text-accent transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                  <span>GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-accent transition-all" />
                </div>
                <div className="text-accent-coral font-bold group-hover:underline truncate">@watchknight</div>
              </div>
            </a>

            {/* Metric 4: Systems & Tooling Environment */}
            <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:px-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-muted text-[10px] uppercase tracking-wider font-semibold">Environment</div>
                <div className="text-accent-coral font-bold truncate">Ubuntu Linux / Vite / C++</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

// Aliases for clean compatibility across existing and new imports
export const HeroSection = Hero;
export default Hero;
