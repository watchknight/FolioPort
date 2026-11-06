import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useTransition } from '../../context/TransitionContext';
import { FLAGSHIP_PROJECTS } from '../ProjectsShowcase';
import {
  MentalDefragPreview,
  DocLensBDPreview,
  RannabannaPreview,
  TrashTrailPreview,
  NeonVanguardPreview,
} from '../ProjectsShowcase';
import { GithubIcon } from '../ui/Icons';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Terminal as TerminalIcon,
  X,
  Compass,
  Sparkles,
  Calendar,
  Briefcase,
  Building,
  Globe,
} from 'lucide-react';

gsap.registerPlugin(Flip);

export const CaseStudyView: React.FC = () => {
  const {
    activeProject,
    closeCaseStudy,
    nextCaseStudy,
    prevCaseStudy,
    consumeFlipState,
  } = useTransition();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerBannerRef = useRef<HTMLDivElement | null>(null);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);

  // Determine next project for the "Next Project" footer
  const currentIndex = activeProject
    ? FLAGSHIP_PROJECTS.findIndex((p) => p.id === activeProject.id)
    : -1;
  const nextProject =
    currentIndex >= 0
      ? FLAGSHIP_PROJECTS[(currentIndex + 1) % FLAGSHIP_PROJECTS.length]
      : null;

  // On activeProject change, run GSAP Flip and stagger in metadata & narrative blocks
  useEffect(() => {
    if (!activeProject || !containerRef.current) return;

    // Reset container scroll to top so next project always starts at apex
    containerRef.current.scrollTop = 0;

    // 1. Consume Flip state from the source row/card thumbnail if captured
    const flipState = consumeFlipState();
    if (flipState && headerBannerRef.current) {
      try {
        Flip.from(flipState, {
          targets: headerBannerRef.current,
          duration: 0.75,
          ease: 'power4.inOut',
          absolute: true,
        });
      } catch (err) {
        console.warn('Flip.from error:', err);
      }
    }

    // 2. Stagger in the project metadata (Client, Role, Year, Live URL)
    gsap.fromTo(
      '.case-meta-anim',
      { autoAlpha: 0, y: 25 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.65,
        ease: 'power3.out',
        delay: 0.25,
      }
    );

    // 3. Stagger in problem/solution narrative blocks
    gsap.fromTo(
      '.case-narrative-anim',
      { autoAlpha: 0, y: 35 },
      {
        autoAlpha: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.35,
      }
    );

    return () => {
      gsap.killTweensOf('.case-meta-anim');
      gsap.killTweensOf('.case-narrative-anim');
    };
  }, [activeProject, consumeFlipState]);

  // Initial focus and W3C Accessible Tab Trap inside dialog + Escape key
  useEffect(() => {
    if (!activeProject || !containerRef.current) return;

    const timer = setTimeout(() => {
      backButtonRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCaseStudy();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeProject, closeCaseStudy]);

  if (!activeProject) return null;

  return (
    <div
      ref={containerRef}
      className="case-study-modal fixed inset-0 z-50 overflow-y-auto bg-obsidian text-alabaster select-text transition-colors duration-300"
      aria-label={`Case Study: ${activeProject.title}`}
      role="dialog"
      aria-modal="true"
      data-lenis-prevent
    >
      {/* Background Subtle Editorial Grid & Ambient Glows */}
      <div
        className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-accent/10 blur-[180px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-32 right-10 h-[400px] w-[400px] rounded-full bg-accent-coral/10 blur-[180px]"
        aria-hidden="true"
      />

      {/* STICKY TOP HUD CONTROLS */}
      <header className="sticky top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-obsidian/85 backdrop-blur-2xl border-b border-white/10">
        {/* Return to Index */}
        <button
          ref={backButtonRef}
          type="button"
          onClick={closeCaseStudy}
          aria-label="Return to Project Index"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-alabaster hover:text-white font-mono text-xs font-semibold transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-accent-coral" />
          <span>Back to Projects</span>
          <span className="hidden sm:inline text-[10px] text-muted ml-1">[ESC]</span>
        </button>

        {/* Center: Case Study Monogram & Slide Counter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-accent-coral font-bold">{activeProject.number}</span>
          <span className="text-white/20">/</span>
          <span className="text-alabaster-dim">05</span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-alabaster-dim hidden sm:inline font-semibold uppercase tracking-wider">
            {activeProject.title}
          </span>
        </div>

        {/* Right: Quick Action Controls (Prev/Next & Close) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => prevCaseStudy(e.currentTarget as HTMLElement)}
            aria-label="Navigate to previous project case study"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-alabaster transition-all active:scale-95"
            title="Previous project"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => nextCaseStudy(e.currentTarget as HTMLElement)}
            aria-label="Navigate to next project case study"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-alabaster transition-all active:scale-95"
            title="Next project"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            type="button"
            onClick={closeCaseStudy}
            aria-label="Close Case Study"
            className="p-2 rounded-full bg-accent/20 hover:bg-accent text-accent-coral hover:text-alabaster border border-accent/30 transition-all active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          FULL-BLEED CASE STUDY HEADER BANNER (GSAP FLIP MORPH TARGET)
         ========================================================================= */}
      <section
        ref={headerBannerRef}
        data-flip-id="case-study-hero"
        className="relative w-full min-h-[46vh] sm:min-h-[54vh] lg:min-h-[62vh] flex flex-col justify-between p-6 sm:p-12 lg:p-16 border-b border-white/10 overflow-hidden bg-gradient-to-br from-[#121118] via-[#0d0c12] to-obsidian"
      >
        {/* Ambient Radial Gradient Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 40%, rgba(223, 108, 79, 0.25) 0%, transparent 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 48px 48px, 48px 48px',
          }}
          aria-hidden="true"
        />

        {/* Top: Category & Specification Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 font-mono text-fluid-micro text-accent-coral uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL DOSSIER // {activeProject.category}</span>
          </div>

          <span className="font-mono text-2xl sm:text-4xl font-black text-accent-coral opacity-80">
            {activeProject.number}
          </span>
        </div>

        {/* Center: Monumental Headline Title */}
        <div className="relative z-10 my-auto py-8 space-y-3 max-w-5xl">
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase text-alabaster leading-[0.95]">
            {activeProject.title}
          </h1>
          <p className="font-mono text-fluid-lead text-accent-coral font-medium max-w-3xl">
            {activeProject.subtitle}
          </p>
        </div>

        {/* Bottom Banner Status Telemetry */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10 font-mono text-fluid-micro text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-accent-coral font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent-coral animate-ping" />
              <span>PRODUCTION ARTIFACT</span>
            </span>
            <span className="text-white/20">•</span>
            <span>CORE STACK: {activeProject.coreStack}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-alabaster-dim">DEPLOYED &amp; BENCHMARKED</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PROJECT METADATA STRIP (CLIENT, ROLE, YEAR, LIVE URL) — STAGGERED
         ========================================================================= */}
      <section className="w-full border-b border-white/10 bg-obsidian-surface/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 font-mono">
            {/* Metadata 1: Client */}
            <div className="case-meta-anim case-study-meta space-y-1">
              <div className="flex items-center gap-1.5 text-fluid-micro text-muted uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-accent-coral" />
                <span>Client / Org</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-alabaster font-display">
                {activeProject.client}
              </div>
            </div>

            {/* Metadata 2: Role */}
            <div className="case-meta-anim case-study-meta space-y-1">
              <div className="flex items-center gap-1.5 text-fluid-micro text-muted uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-accent-coral" />
                <span>Role</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-alabaster font-display">
                {activeProject.role}
              </div>
            </div>

            {/* Metadata 3: Year */}
            <div className="case-meta-anim case-study-meta space-y-1">
              <div className="flex items-center gap-1.5 text-fluid-micro text-muted uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-accent-coral" />
                <span>Year</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-accent-coral">
                {activeProject.year}
              </div>
            </div>

            {/* Metadata 4: Live URL & Repository */}
            <div className="case-meta-anim case-study-meta space-y-1.5">
              <div className="flex items-center gap-1.5 text-fluid-micro text-muted uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-accent-coral" />
                <span>Live Coordinates</span>
              </div>
              <div className="flex items-center gap-2">
                {activeProject.liveUrl && (
                  <a
                    href={activeProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-alabaster font-bold text-xs hover:bg-accent-coral transition-colors shadow-editorial-card"
                  >
                    <span>Live Spec</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <a
                  href={activeProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-alabaster transition-colors"
                  aria-label={`GitHub Repository for ${activeProject.title}`}
                  title="GitHub Repository"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PROBLEM & SOLUTION NARRATIVE BLOCKS + INTERACTIVE SIMULATION
         ========================================================================= */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl py-12 sm:py-16 space-y-16">
        {/* Narrative Section 1: Problem vs Solution Dual-Ledger */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Problem Block */}
          <div className="case-narrative-anim narrative-block lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-obsidian-card/90 border border-white/10 shadow-editorial-card space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 font-mono text-fluid-micro text-rose-400 font-semibold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>THE PROBLEM &amp; SYSTEM BOTTLENECK</span>
            </div>

            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-alabaster tracking-tight">
              {activeProject.problem.headline}
            </h3>

            <p className="font-body text-fluid-body text-alabaster-dim leading-relaxed">
              {activeProject.problem.description}
            </p>

            <div className="p-4 rounded-2xl bg-obsidian/80 border border-rose-500/20 font-mono text-xs text-rose-300">
              <span className="font-bold text-rose-400 block mb-1 uppercase tracking-wider text-[10px]">
                Critical Bottleneck Analysis:
              </span>
              {activeProject.problem.bottleneck}
            </div>
          </div>

          {/* Solution Block */}
          <div className="case-narrative-anim narrative-block lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-obsidian-card/90 border border-white/10 shadow-editorial-card space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 font-mono text-fluid-micro text-emerald-400 font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>ARCHITECTURAL RESOLUTION</span>
            </div>

            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-alabaster tracking-tight">
              {activeProject.solution.headline}
            </h3>

            <p className="font-body text-fluid-body text-alabaster-dim leading-relaxed">
              {activeProject.solution.description}
            </p>

            {/* Architectural Mechanics List */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="font-mono text-fluid-micro text-muted uppercase tracking-wider block font-semibold">
                Core Architectural Mechanics:
              </span>
              <ul className="space-y-2 font-mono text-xs text-alabaster-dim">
                {activeProject.solution.architecture.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-accent-coral mt-0.5">❯</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Narrative Section 2: Quantified Telemetry & Authority Metrics */}
        <section className="case-narrative-anim space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="font-mono text-fluid-micro text-accent-coral uppercase tracking-widest">
                QUANTIFIED VALIDATION // PRODUCTION METRICS
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-alabaster uppercase tracking-tight">
                Empirical Telemetry &amp; Impact
              </h3>
            </div>
            <span className="font-mono text-fluid-micro text-muted hidden sm:inline">
              100% Deterministic Benchmarks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {activeProject.impact.metrics.map((m, mIdx) => (
              <div
                key={mIdx}
                className="p-6 rounded-2xl bg-obsidian-surface/90 border border-white/10 shadow-editorial-card space-y-2 font-mono"
              >
                <div className="text-fluid-micro text-muted uppercase tracking-widest">
                  {m.label}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-accent-coral font-display">
                  {m.value}
                </div>
                <div className="text-fluid-micro text-alabaster-dim">{m.detail}</div>
              </div>
            ))}
          </div>

          <p className="font-body text-fluid-body text-alabaster-dim max-w-3xl leading-relaxed pt-2">
            {activeProject.impact.summary}
          </p>
        </section>

        {/* Narrative Section 3: Embedded Interactive Simulation Sandbox */}
        <section className="case-narrative-anim space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-mono text-fluid-micro text-accent-coral uppercase tracking-wider">
              <TerminalIcon className="w-4 h-4 text-accent-coral" />
              <span>LIVE INTERACTIVE SIMULATION SANDBOX</span>
            </div>
            <span className="font-mono text-fluid-micro text-muted">
              Interactive WebGL / Canvas / Telemetry
            </span>
          </div>

          <div className="w-full min-h-[380px] sm:min-h-[440px] rounded-3xl overflow-hidden border border-white/15 bg-obsidian-surface shadow-editorial-elevated">
            {activeProject.previewType === 'mental-defrag' && <MentalDefragPreview />}
            {activeProject.previewType === 'doclens' && <DocLensBDPreview />}
            {activeProject.previewType === 'rannabanna' && <RannabannaPreview />}
            {activeProject.previewType === 'trash-trail' && <TrashTrailPreview />}
            {activeProject.previewType === 'neon-vanguard' && <NeonVanguardPreview />}
          </div>
        </section>

        {/* Narrative Section 4: Complete Technology Stack Badges */}
        <section className="case-narrative-anim space-y-4 pt-4 border-t border-white/10">
          <div className="font-mono text-fluid-micro text-muted uppercase tracking-widest">
            ENGINEERING STACK &amp; SPECIFICATIONS
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {activeProject.techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-alabaster hover:border-accent-coral/50 transition-colors"
              >
                #{tech}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================================================
          "NEXT PROJECT" FOOTER (TRANSITIONS DIRECTLY INTO NEXT WORK ITEM)
         ========================================================================= */}
      {nextProject && (
        <footer className="w-full border-t border-white/15 bg-gradient-to-t from-black via-obsidian-card to-obsidian py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div>
                <span className="font-mono text-fluid-micro text-accent-coral uppercase tracking-widest flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>CONTINUE THE NARRATIVE</span>
                </span>
                <h4 className="font-display font-extrabold text-2xl sm:text-3xl text-alabaster uppercase tracking-tight mt-1">
                  Next Case Study
                </h4>
              </div>

              <div className="font-mono text-fluid-micro text-muted">
                {nextProject.number} / 05 • Click to morph
              </div>
            </div>

            {/* Clickable Next Project Hero Card */}
            <button
              type="button"
              onClick={(e) => nextCaseStudy(e.currentTarget as HTMLElement)}
              aria-label={`Transition directly to next case study: ${nextProject.title}`}
              className="next-case-study-btn group w-full p-8 sm:p-12 rounded-3xl bg-obsidian-surface hover:bg-carbon-elevated border border-white/15 hover:border-accent-coral/50 shadow-editorial-elevated transition-all duration-300 text-left flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xl text-accent-coral">
                    {nextProject.number}
                  </span>
                  <span className="font-mono text-fluid-micro text-muted uppercase tracking-wider">
                    {nextProject.category}
                  </span>
                </div>

                <h3 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-alabaster group-hover:text-accent-coral transition-colors uppercase tracking-tight">
                  {nextProject.title}
                </h3>

                <p className="font-body text-fluid-body text-alabaster-dim">
                  {nextProject.subtitle}
                </p>
              </div>

              {/* Huge Morph Action Arrow */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/20 group-hover:bg-accent border border-accent/40 flex items-center justify-center text-accent-coral group-hover:text-alabaster transition-all group-hover:scale-110 shadow-editorial-card">
                  <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>

            {/* Return to Index bottom action */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={closeCaseStudy}
                aria-label="Return to portfolio index"
                className="font-mono text-xs text-muted hover:text-alabaster transition-colors underline"
              >
                ← Or return to main portfolio index
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
