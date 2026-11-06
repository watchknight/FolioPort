import React, { useState, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';
import { audio } from '../utils/audio';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Magnetic } from './ui/Magnetic';
import { EasterEggPong } from './EasterEggPong';
import { Activity, Tv } from 'lucide-react';

export const About: React.FC = () => {
  const containerRef = useReveal<HTMLElement>();
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const easterEggTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Support #404 route fallback and direct easter egg deep-linking
  React.useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#404' || hash === '#pong' || hash === '#easteregg' || hash === '#crt') {
        setEasterEggOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const stats = [
    { target: '4+', label: 'Years of Systems & Full-Stack Craft', sub: 'Independent & Academic Production' },
    { target: '120', label: 'FPS Real-Time Canvas Pacing', sub: 'Raycast Piercing & Combat Loops' },
    { target: '100%', label: 'Obsidian Canvas AST Parity', sub: 'Bidirectional Vector Serialization' },
    { target: '0', label: 'POSIX C Kernel Memory Leaks', sub: 'Valgrind Verified Clean IPC Pipelines' },
  ];

  const capabilities = [
    {
      num: '01',
      title: 'Low-Level Systems & Kernel Primitives',
      subtitle: 'Deterministic Memory & Microsecond Latencies',
      skills: [
        'POSIX shared memory (shmget, shmat) with spinlock synchronization',
        'Multi-process fork() hierarchies & anonymous duplex IPC pipes',
        'C, C++, Rust, and Linux Kernel engineering workflows',
        'Valgrind memory profiling ensuring zero buffer overruns',
      ],
      tag: 'SYSTEMS_CORE',
    },
    {
      num: '02',
      title: 'Kinetic DOM & Viewport Physics',
      subtitle: 'Awwwards-Grade Motion & Inertial Choreography',
      skills: [
        'GSAP ScrollTrigger & declarative useReveal() hook architectures',
        'Lenis sub-frame smooth inertia synchronized with ticker',
        'Matter.js rigid-body physics engines with zero-gravity decay',
        'WebGL / Three.js custom multi-pass GLSL shader inspectors',
      ],
      tag: 'CREATIVE_FRONTEND',
    },
    {
      num: '03',
      title: 'Distributed Cloud & Data Fabric',
      subtitle: 'Real-Time Sync & High-Availability Pipelines',
      skills: [
        'Cloud Firestore real-time snapshot listeners with offline cache',
        'Automated GitHub Actions CI/CD staging test pipelines (14/14 pass)',
        'Bengali Unicode glyph subsetting reducing bundle footprint by 78%',
        'Offline-first IndexedDB schema reconciliation & zero-latency local state',
      ],
      tag: 'DATA_FABRIC',
    },
  ];

  const ledgerRecords = [
    {
      ref: 'REF. 01',
      label: 'IDENTITY & CITIZENSHIP',
      value: `${PORTFOLIO_DATA.meta.name} (${PORTFOLIO_DATA.meta.handle})`,
      status: 'VERIFIED',
    },
    {
      ref: 'REF. 02',
      label: 'ACADEMIC INSTITUTION',
      value: `${PORTFOLIO_DATA.meta.academicAnchor} — CSE Undergraduate`,
      status: 'ENROLLED',
    },
    {
      ref: 'REF. 03',
      label: 'OPERATIONAL HEADQUARTERS',
      value: `${PORTFOLIO_DATA.meta.location} — Global Edge CDN Node`,
      status: 'ONLINE',
    },
    {
      ref: 'REF. 04',
      label: 'CURRENT AVAILABILITY',
      value: PORTFOLIO_DATA.meta.status,
      status: 'OPEN FOR HIRE',
    },
  ];

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative z-20 py-24 md:py-32 bg-obsidian text-alabaster border-t border-white/10 overflow-hidden"
    >
      {/* Background Subtle Parallax Coordinates */}
      <div 
        data-parallax="0.12" 
        className="pointer-events-none absolute right-4 top-12 font-mono text-[10vw] font-black text-white/[0.015] select-none uppercase tracking-tighter"
        aria-hidden="true"
      >
        LEDGER//01
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header with Mask Reveal */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div data-anim className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-fluid-micro uppercase tracking-widest text-accent-coral">
                SECTION 01 • EDITORIAL LEDGER
              </span>
            </div>

            <div className="overflow-hidden">
              <h2 
                data-mask 
                className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight uppercase"
              >
                ARCHITECTURAL <span className="text-accent-coral">PHILOSOPHY</span>
              </h2>
            </div>
          </div>

          <p 
            data-anim 
            data-delay="0.15" 
            className="max-w-md font-sans text-sm sm:text-base text-alabaster-dim leading-relaxed"
          >
            {PORTFOLIO_DATA.meta.bio} East West University CSE undergraduate unifying POSIX low-level memory determinism with buttery 120 FPS kinetic viewports.
          </p>
        </div>

        {/* Drawn Top Divider Line */}
        <div data-draw className="w-full h-px bg-white/15 mb-14" />

        {/* Numeric Stat Counters Ledger Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-16">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              data-anim 
              data-delay={String(idx * 0.08)} 
              className="flex flex-col border-l border-white/15 pl-4 sm:pl-6 group"
            >
              <div className="flex items-baseline gap-1">
                <span 
                  data-counter={stat.target}
                  data-counter-target={stat.target}
                  className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-alabaster group-hover:text-accent-coral transition-colors tracking-tight"
                >
                  {stat.target}
                </span>
              </div>
              <span className="font-display font-bold text-xs sm:text-sm text-alabaster mt-2 uppercase tracking-wide">
                {stat.label}
              </span>
              <span className="font-mono text-[11px] text-muted mt-0.5">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Drawn Interstitial Divider Line */}
        <div data-draw className="w-full h-px bg-white/10 mb-16" />

        {/* Section Sub-heading */}
        <div className="flex items-center justify-between mb-8">
          <div data-anim className="flex items-center gap-2">
            <span className="font-mono text-fluid-micro text-muted uppercase tracking-widest">
              [CAPABILITY COLUMNS // STAGGERED REVEAL]
            </span>
          </div>
          <span data-anim className="hidden sm:inline font-mono text-fluid-micro text-accent-coral">
            3 CORE ENGINEERING PILLARS
          </span>
        </div>

        {/* Staggered Capability Columns */}
        <div 
          data-stagger="0.08" 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {capabilities.map((cap) => (
            <div
              key={cap.num}
              onMouseEnter={() => audio.playTick()}
              className="flex flex-col justify-between p-6 rounded-2xl bg-obsidian-surface/60 border border-white/10 hover:border-accent/40 hover:bg-obsidian-card transition-all duration-300 group shadow-editorial-card"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-accent-coral group-hover:bg-accent/20 transition-colors">
                    PILLAR {cap.num}
                  </span>
                  <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                    {cap.tag}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg text-alabaster group-hover:text-white transition-colors mb-1">
                  {cap.title}
                </h3>
                <p className="font-mono text-xs text-accent-coral/80 mb-5">
                  {cap.subtitle}
                </p>

                <ul className="space-y-2.5 text-xs text-alabaster-dim">
                  {cap.skills.map((skill, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="text-accent-coral/60 mt-0.5">›</span>
                      <span className="leading-relaxed">{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-muted">
                <span>VERIFIED STANDARD</span>
                <span className="text-accent-coral opacity-0 group-hover:opacity-100 transition-opacity">
                  ACTIVE PIPELINE →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Drawn Lower Ledger Divider */}
        <div data-draw className="w-full h-px bg-white/10 mb-8" />

        {/* Editorial Ledger Audit Table */}
        <div data-anim className="bg-obsidian-surface/40 rounded-2xl border border-white/10 overflow-hidden mb-12">
          <div className="px-6 py-3.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between font-mono text-fluid-micro text-muted uppercase tracking-wider">
            <span>OFFICIAL SYSTEM RECORD // AUDIT TELEMETRY</span>
            <span className="hidden sm:inline">SHA-256 AUTHENTICATED</span>
          </div>

          <div className="divide-y divide-white/5">
            {ledgerRecords.map((rec, i) => (
              <div
                key={i}
                onMouseEnter={() => audio.playTick()}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-accent-coral">{rec.ref}</span>
                  <span className="font-mono text-xs text-muted tracking-wide">{rec.label}</span>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="font-sans text-xs sm:text-sm font-medium text-alabaster group-hover:text-white transition-colors">
                    {rec.value}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent-coral">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lower Ledger Bottom Bar with Drawn Rule & Easter Egg Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div data-anim className="flex items-center gap-2 text-xs font-mono text-muted">
            <Activity className="w-3.5 h-3.5 text-accent-coral" />
            <span>EAST WEST UNIVERSITY // DHAKA, BANGLADESH (UTC+6)</span>
          </div>

          {/* Interactive Easter Egg Toggle Button */}
          <div data-anim data-delay="0.1">
            <Magnetic
              as="button"
              ref={easterEggTriggerRef}
              onClick={() => {
                setEasterEggOpen(true);
                audio.playChord();
              }}
              onMouseEnter={() => audio.playTick()}
              aria-label="Open retro CRT channel surfing Easter egg"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 hover:border-accent hover:bg-accent/10 text-alabaster font-mono text-xs tracking-wider uppercase transition-all duration-200 group shadow-editorial-card"
            >
              <Tv className="w-3.5 h-3.5 text-accent-coral group-hover:scale-110 transition-transform" />
              <span>[CRT // PONG_SURF.EXE]</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
            </Magnetic>
          </div>
        </div>

      </div>

      {/* Render Retro CRT Easter Egg Modal */}
      <EasterEggPong
        isOpen={easterEggOpen}
        onClose={() => {
          setEasterEggOpen(false);
          setTimeout(() => {
            easterEggTriggerRef.current?.focus();
          }, 80);
        }}
        triggerElementRef={easterEggTriggerRef}
      />
    </section>
  );
};

export default About;
