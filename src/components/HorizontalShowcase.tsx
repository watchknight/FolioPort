import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '../hooks/useLenis';
import { useTransition } from '../context/TransitionContext';
import { audio } from '../utils/audio';
import { 
  FLAGSHIP_PROJECTS, 
  FlagshipProject,
  MentalDefragPreview,
  DocLensBDPreview,
  RannabannaPreview,
  TrashTrailPreview,
  NeonVanguardPreview
} from './ProjectsShowcase';
import { GithubIcon } from './ui/Icons';
import { 
  ArrowRight, 
  ArrowLeft, 
  Briefcase, 
  Activity, 
  Layers, 
  Compass, 
  CheckCircle2, 
  Terminal as TerminalIcon,
  Zap
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const HorizontalShowcase: React.FC = () => {
  const { scrollTo } = useLenis();
  const { openCaseStudy } = useTransition();
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wrapperTweenRef = useRef<gsap.core.Tween | null>(null);

  // Discrete slide indicator state (only re-renders component on slide step 1..5)
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(1);
  const activeSlideIndexRef = useRef<number>(1);

  // Direct DOM refs for high-frequency 60-120fps telemetry updates (zero React re-renders during scroll)
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const skewTextRef = useRef<HTMLSpanElement | null>(null);
  const velocityTextRef = useRef<HTMLSpanElement | null>(null);

  // Setup GSAP Horizontal Pinning, Master Tween & Container Parallax
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 800px) and (hover: hover) and (prefers-reduced-motion: no-preference)',
        isMobileOrTouch: '(max-width: 799px), (hover: none)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions as {
          isDesktop: boolean;
          isMobileOrTouch: boolean;
          reduceMotion: boolean;
        };

        const items = track.querySelectorAll<HTMLElement>('.showcase-item');

        // Reduced Motion: disable velocity skew, heavy pins & parallax, fallback to gentle crossfade
        if (reduceMotion) {
          gsap.set(items, { autoAlpha: 1, skewX: 0 });
          return;
        }

        // Calculate dynamic horizontal scroll distance
        const getScrollDistance = () => track.scrollWidth - window.innerWidth;

        // Pre-allocated quickTo for velocity skew (compositor-only, force3D: true, power3 ease)
        const skewTo = gsap.quickTo(items, 'skewX', {
          duration: 0.25,
          ease: 'power3.out',
          force3D: true,
        });

        // Pre-allocated quickSetter for GPU compositor-only progress bar (zero layout reflow)
        const setProgressScale = progressBarRef.current
          ? gsap.quickSetter(progressBarRef.current, 'scaleX')
          : null;
        if (progressBarRef.current) {
          gsap.set(progressBarRef.current, { scaleX: 0, transformOrigin: 'left center', force3D: true });
        }

        // Master horizontal tween translating track's x position
        const wrapperTween = gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${getScrollDistance()}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const velocity = self.getVelocity();
              const rawSkew = velocity / -200;
              const clampedSkew = gsap.utils.clamp(-12, 12, rawSkew);

              // Apply velocity skew on desktop/hover
              if (isDesktop) {
                skewTo(clampedSkew);
              }

              // Real-time direct DOM telemetry updates (avoids expensive React re-rendering)
              const p = Math.round(self.progress * 100);
              if (setProgressScale) setProgressScale(self.progress);
              if (progressTextRef.current) progressTextRef.current.textContent = `${p}%`;
              if (velocityTextRef.current) velocityTextRef.current.textContent = `${Math.round(velocity)} px/s`;
              if (skewTextRef.current) skewTextRef.current.textContent = isDesktop ? `${clampedSkew.toFixed(1)}°` : '0.0°';

              // Compute current active slide index (1 to 5)
              const totalSlides = FLAGSHIP_PROJECTS.length;
              const slideIdx = Math.min(
                totalSlides,
                Math.max(1, Math.round(self.progress * (totalSlides - 1)) + 1)
              );
              if (slideIdx !== activeSlideIndexRef.current) {
                activeSlideIndexRef.current = slideIdx;
                setActiveSlideIndex(slideIdx);
              }
            },
            onScrubComplete: () => {
              skewTo(0);
              if (skewTextRef.current) skewTextRef.current.textContent = '0.0°';
              if (velocityTextRef.current) velocityTextRef.current.textContent = '0 px/s';
            },
          },
        });

        wrapperTweenRef.current = wrapperTween;

        // Attach containerAnimation: wrapperTween to each .showcase-item's inner visual layer
        items.forEach((item) => {
          const mediaLayer = item.querySelector<HTMLElement>('.showcase-media-layer');
          if (mediaLayer) {
            gsap.fromTo(
              mediaLayer,
              {
                xPercent: -15,
                backgroundPosition: '0% 50%',
                force3D: true,
              },
              {
                xPercent: 15,
                backgroundPosition: '100% 50%',
                ease: 'none',
                scrollTrigger: {
                  trigger: item,
                  containerAnimation: wrapperTween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              }
            );
          }

          // Secondary subtle parallax on interactive simulation preview boxes
          const previewBox = item.querySelector<HTMLElement>('.showcase-preview-box');
          if (previewBox) {
            gsap.fromTo(
              previewBox,
              { x: -18, force3D: true },
              {
                x: 18,
                ease: 'none',
                scrollTrigger: {
                  trigger: item,
                  containerAnimation: wrapperTween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              }
            );
          }

          // Secondary subtle parallax on inner floating badges for layered 3D depth
          const badgeElements = item.querySelectorAll<HTMLElement>('.showcase-depth-badge');
          badgeElements.forEach((badge, bIdx) => {
            gsap.fromTo(
              badge,
              { x: -16 * (bIdx + 1), force3D: true },
              {
                x: 16 * (bIdx + 1),
                ease: 'none',
                scrollTrigger: {
                  trigger: item,
                  containerAnimation: wrapperTween,
                  start: 'left right',
                  end: 'right left',
                  scrub: true,
                },
              }
            );
          });
        });
      },
      section
    );

    return () => {
      mm.revert();
    };
  }, []);

  // Programmatic slide stepping handlers with exact item offset targeting
  const handleStepSlide = useCallback((direction: 'next' | 'prev') => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const items = Array.from(track.querySelectorAll<HTMLElement>('.showcase-item'));
    if (items.length === 0) return;

    const totalScroll = track.scrollWidth - window.innerWidth;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const currentScrollWithin = Math.max(0, window.scrollY - sectionTop);

    // Find the item currently closest to viewport
    let currentIndex = 0;
    let minDiff = Infinity;
    items.forEach((item, idx) => {
      const itemProgress = totalScroll > 0 ? (item.offsetLeft / totalScroll) * totalScroll : 0;
      const diff = Math.abs(itemProgress - currentScrollWithin);
      if (diff < minDiff) {
        minDiff = diff;
        currentIndex = idx;
      }
    });

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex));

    const targetItem = items[targetIndex];
    const targetOffset = Math.min(totalScroll, Math.max(0, targetItem.offsetLeft));

    scrollTo(sectionTop + targetOffset, { duration: 1.0, immediate: false });
  }, [scrollTo]);

  return (
    <section
      ref={sectionRef}
      className="horizontal-showcase relative bg-obsidian text-alabaster overflow-hidden"
      aria-label="Flagship Scrollytelling Case Study Showcase"
    >
      {/* Editorial Atmospheric Background Glows */}
      <div 
        className="pointer-events-none absolute top-10 left-1/4 h-[500px] w-[600px] rounded-full bg-accent/8 blur-[180px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute bottom-10 right-1/4 h-[450px] w-[500px] rounded-full bg-accent-coral/6 blur-[180px]" 
        aria-hidden="true" 
      />

      {/* FIXED VIEWPORT CHOREOGRAPHY STAGE (100VH) */}
      <div className="h-screen w-full flex flex-col justify-between py-5 sm:py-6 relative z-10 overflow-hidden">
        
        {/* ================================================================ */}
        {/* TOP EDITORIAL HUD STRIP: Header, Category & Slide Counter        */}
        {/* ================================================================ */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl w-full flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 font-mono text-fluid-micro text-accent-coral uppercase tracking-widest">
              <Briefcase className="w-3.5 h-3.5 text-accent" />
              <span>Flagship Scrollytelling Reel // GSAP Pinned Track</span>
            </div>
            <h2 className="font-display font-black text-lg sm:text-2xl text-alabaster uppercase tracking-tight">
              Engineered <span className="text-accent-coral">Systems</span> & Spatial Case Studies
            </h2>
          </div>

          {/* Scrolly Slide Indicator & Parallax Status Pill */}
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[11px]">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted">
              <Compass className="w-3 h-3 text-accent-coral" />
              <span>Scroll to Traverse</span>
            </div>

            <div className="px-3.5 py-1 rounded-full bg-obsidian-surface/90 border border-white/15 shadow-editorial-card flex items-center gap-2">
              <span className="text-accent-coral font-bold">
                0{activeSlideIndex}
              </span>
              <span className="text-white/20">/</span>
              <span className="text-alabaster-dim">
                0{FLAGSHIP_PROJECTS.length}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* THE PINNED HORIZONTAL TRACK & LARGE CASE-STUDY MEDIA PANELS      */}
        {/* ================================================================ */}
        <div
          ref={trackRef}
          className="horizontal-track flex items-center h-[72vh] sm:h-[74vh] pl-6 sm:pl-12 lg:pl-20 pr-16 sm:pr-32 select-none"
          style={{ width: 'fit-content' }}
        >
          {/* INTRO HERO CARD (SETTING THE ARCHITECTURAL STAGE) */}
          <div className="showcase-item shrink-0 w-[82vw] sm:w-[68vw] lg:w-[48vw] max-w-[620px] h-full mr-6 sm:mr-8 rounded-3xl overflow-hidden bg-gradient-to-br from-[#121118]/90 via-[#0d0c12]/95 to-obsidian border border-white/15 shadow-editorial-elevated backdrop-blur-2xl">
            <div className="showcase-inner-visual relative w-full h-full flex flex-col justify-between p-6 sm:p-8 overflow-hidden">
              
              {/* Internal Parallax Media Layer with Bleed Margins */}
              <div 
                className="showcase-media-layer absolute -inset-x-20 -inset-y-8 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(223, 108, 79, 0.18) 0%, transparent 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                  backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                }}
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 font-mono text-fluid-micro text-accent-coral">
                  <Layers className="w-3.5 h-3.5" />
                  <span>ARCHITECTURAL DOSSIER // VOL. 2026</span>
                </div>

                <h3 className="font-display font-black text-2xl sm:text-4xl text-alabaster uppercase leading-tight tracking-tight">
                  Deep Systems Storytelling <br />
                  <span className="text-accent-coral">& Multi-Plane Parallax</span>
                </h3>

                <p className="font-body text-fluid-body text-alabaster-dim leading-relaxed">
                  Glide through 5 production engineering milestones. Every card is an interactive technical dossier showcasing problem bottlenecks, multi-tiered architectures, and quantified real-world impact.
                </p>
              </div>

              <div className="relative z-10 space-y-4 pt-6 border-t border-white/10 font-mono text-[11px]">
                <div className="grid grid-cols-2 gap-3 text-muted">
                  <div>
                    <span className="block text-[10px] uppercase text-alabaster-dim">Pipeline</span>
                    <span className="text-alabaster font-semibold">GSAP ScrollTrigger Pinned</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-alabaster-dim">Kinetic Skew</span>
                    <span className="text-accent-coral font-semibold">Velocity Clamped [-12°, 12°]</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-accent-coral font-bold pt-2">
                  <span>Scroll vertically or use controls below to traverse</span>
                  <ArrowRight className="w-4 h-4 animate-bounce-x" />
                </div>
              </div>

            </div>
          </div>

          {/* THE 5 FLAGSHIP CASE STUDY MEDIA PANELS (.showcase-item) */}
          {FLAGSHIP_PROJECTS.map((project: FlagshipProject) => (
            <article
              key={project.id}
              onMouseEnter={() => audio.playTick()}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a, button')) return;
                openCaseStudy(project, e.currentTarget);
              }}
              className="showcase-item shrink-0 w-[88vw] sm:w-[82vw] lg:w-[74vw] max-w-[1040px] h-full mx-4 sm:mx-6 rounded-3xl overflow-hidden bg-obsidian-card/90 border border-white/15 shadow-editorial-elevated backdrop-blur-2xl flex flex-col justify-between cursor-pointer"
              aria-label={`Case Study: ${project.title}`}
            >
              {/* Card Inner Visual Container with Internal Parallax */}
              <div className="showcase-inner-visual relative w-full h-full flex flex-col justify-between p-5 sm:p-7 lg:p-8 overflow-hidden">
                
                {/* PARALLAX VISUAL BACKGROUND MEDIA LAYER (xPercent: -15 to 15) with Bleed */}
                <div 
                  className="showcase-media-layer absolute -inset-x-20 -inset-y-8 pointer-events-none opacity-25"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(223, 108, 79, 0.16) 0%, transparent 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                  }}
                  aria-hidden="true"
                />

                {/* ============================================================ */}
                {/* CARD HEADER: Project Number, Title, Category & Quick Actions */}
                {/* ============================================================ */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
                  <div className="flex items-baseline gap-3 sm:gap-4">
                    <span className="font-mono font-black text-2xl sm:text-3xl text-accent-coral">
                      {project.number}
                    </span>
                    <div>
                      <h3 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-alabaster tracking-tight uppercase">
                        {project.title}
                      </h3>
                      <p className="font-mono text-fluid-micro text-accent-coral font-medium">
                        {project.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Pills & Links */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="showcase-depth-badge font-mono text-[10px] text-alabaster-dim px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hidden md:inline">
                      {project.role}
                    </span>

                    <span className="showcase-depth-badge font-mono text-[10px] text-accent-coral font-bold px-2.5 py-1 rounded-full bg-accent/10 border border-accent/25">
                      {project.year}
                    </span>

                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`GitHub repository for ${project.title}`}
                      className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent text-slate-300 hover:text-alabaster transition-all active:scale-95"
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => openCaseStudy(project, (e.currentTarget.closest('.showcase-item') as HTMLElement) || e.currentTarget)}
                      className="p-2 sm:p-2.5 rounded-xl bg-accent text-alabaster font-mono text-xs font-bold hover:bg-accent-coral transition-all active:scale-95 flex items-center gap-1 shadow-editorial-card"
                      aria-label={`Open Case Study for ${project.title}`}
                    >
                      <span>Case Study</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* CARD BODY: Technical Storytelling & Interactive Visual       */}
                {/* ============================================================ */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 my-auto py-3 sm:py-4 items-center">
                  
                  {/* Left Column: Deep Problem & Solution Storytelling */}
                  <div className="lg:col-span-6 space-y-3 sm:space-y-4">
                    {/* Problem Bottleneck Card */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-obsidian/70 border border-white/10 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-accent-coral font-bold text-xs uppercase tracking-wider">
                        <TerminalIcon className="w-3.5 h-3.5" />
                        <span>Problem: {project.problem.headline}</span>
                      </div>
                      <p className="font-body text-alabaster-dim text-xs leading-relaxed">
                        {project.problem.description}
                      </p>
                      <div className="text-[10px] text-muted-light pt-1 border-t border-white/5">
                        <span className="text-accent-coral font-semibold">Bottleneck:</span> {project.problem.bottleneck}
                      </div>
                    </div>

                    {/* Solution Architecture Card */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-obsidian/70 border border-white/10 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Solution: {project.solution.headline}</span>
                      </div>
                      <p className="font-body text-alabaster-dim text-xs leading-relaxed">
                        {project.solution.description}
                      </p>
                      <ul className="space-y-1 pt-1 border-t border-white/5 text-[10px] text-alabaster-dim">
                        {project.solution.architecture.slice(0, 2).map((item, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-1.5">
                            <span className="text-accent-coral mt-0.5">❯</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Live Interactive Simulation Preview with Depth Parallax */}
                  <div className="showcase-preview-box lg:col-span-6 h-[220px] sm:h-[260px] lg:h-[280px] w-full rounded-2xl overflow-hidden border border-white/10 bg-obsidian/90 shadow-editorial-card">
                    {project.previewType === 'mental-defrag' && <MentalDefragPreview />}
                    {project.previewType === 'doclens' && <DocLensBDPreview />}
                    {project.previewType === 'rannabanna' && <RannabannaPreview />}
                    {project.previewType === 'trash-trail' && <TrashTrailPreview />}
                    {project.previewType === 'neon-vanguard' && <NeonVanguardPreview />}
                  </div>

                </div>

                {/* ============================================================ */}
                {/* CARD FOOTER: Quantified Impact Metrics & Tech Stack Pills    */}
                {/* ============================================================ */}
                <div className="relative z-10 border-t border-white/10 pt-3 sm:pt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  
                  {/* 3 Authority Metrics */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-[11px]">
                    {project.impact.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                        <span className="text-muted text-[10px] uppercase">{m.label}:</span>
                        <span className="text-accent-coral font-bold">{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    {project.techStack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md bg-obsidian-surface border border-white/10 text-alabaster-dim"
                      >
                        #{tech}
                      </span>
                    ))}
                  </div>

                </div>

              </div>
            </article>
          ))}

          {/* OUTRO CALL-TO-ACTION CARD */}
          <div className="showcase-item shrink-0 w-[80vw] sm:w-[60vw] lg:w-[42vw] max-w-[540px] h-full mx-6 rounded-3xl overflow-hidden bg-gradient-to-br from-obsidian via-[#0f0e15] to-[#160c0c] border border-white/15 shadow-editorial-elevated backdrop-blur-2xl">
            <div className="showcase-inner-visual relative w-full h-full flex flex-col justify-between p-6 sm:p-8 overflow-hidden">
              
              {/* Internal Parallax Media Layer with Bleed Margins */}
              <div 
                className="showcase-media-layer absolute -inset-x-20 -inset-y-8 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(223, 108, 79, 0.16) 0%, transparent 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                  backgroundSize: '100% 100%, 36px 36px, 36px 36px',
                }}
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-coral/15 border border-accent-coral/30 font-mono text-fluid-micro text-accent-coral">
                  <Zap className="w-3.5 h-3.5" />
                  <span>NEXT HORIZON // RESEARCH LAB</span>
                </span>

                <h3 className="font-display font-black text-2xl sm:text-3xl text-alabaster uppercase leading-tight tracking-tight">
                  Inspect Open-Source <br />
                  <span className="text-accent-coral">Low-Level Systems & Experiments</span>
                </h3>

                <p className="font-body text-fluid-body text-alabaster-dim leading-relaxed">
                  Continue scrolling to discover the interactive GitHub Lab, C/C++ memory primitives, SIMD JSON stream parsers, and live telemetry terminal.
                </p>
              </div>

              <div className="relative z-10 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => scrollTo('#lab', { offset: -80 })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-coral text-alabaster font-display font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-editorial-card active:scale-95"
                >
                  <span>Enter Research Lab</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* ================================================================ */}
        {/* BOTTOM HUD STRIP: Horizontal Progress Bar & Velocity Telemetry   */}
        {/* ================================================================ */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl w-full border-t border-white/10 pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 font-mono text-[11px]">
          
          {/* Left: Real-time Velocity & Skew Telemetry */}
          <div className="flex items-center gap-3 text-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent-coral animate-pulse" />
              <span>SKEW:</span>
              <span ref={skewTextRef} className="text-accent-coral font-bold">0.0°</span>
            </span>

            <span className="text-white/20">•</span>

            <span>
              VELOCITY: <span ref={velocityTextRef} className="text-alabaster font-bold">0 px/s</span>
            </span>

            <span className="text-white/20 hidden md:inline">•</span>

            <span className="hidden md:inline text-alabaster-dim">
              CONTAINER-ANIM: <span className="text-emerald-400 font-bold">LOCKED</span>
            </span>
          </div>

          {/* Center: Full-Bleed Progress Bar */}
          <div className="flex items-center gap-3 w-full sm:w-64">
            <span ref={progressTextRef} className="text-muted text-[10px]">0%</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
              <div
                ref={progressBarRef}
                className="w-full h-full bg-gradient-to-r from-accent to-accent-coral rounded-full origin-left"
                style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
              />
            </div>
          </div>

          {/* Right: Manual Slide Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepSlide('prev')}
              aria-label="Scroll to previous case study panel"
              className="p-2 rounded-xl bg-obsidian-surface border border-white/10 hover:border-accent text-alabaster hover:text-accent-coral transition-all active:scale-95"
              title="Previous panel"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleStepSlide('next')}
              aria-label="Scroll to next case study panel"
              className="p-2 rounded-xl bg-obsidian-surface border border-white/10 hover:border-accent text-alabaster hover:text-accent-coral transition-all active:scale-95"
              title="Next panel"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HorizontalShowcase;
