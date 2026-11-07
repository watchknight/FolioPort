import React, { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LenisProvider, getOrInitLenis } from './hooks/useLenis';
import { ThemeProvider } from './context/ThemeContext';
import { TransitionProvider } from './context/TransitionContext';
import { CaseStudyView } from './components/case-study/CaseStudyView';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/cursor/CustomCursor';
import { SentinelHUD } from './components/SentinelHUD';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { RenderPassInspector } from './components/RenderPassInspector';
import { HorizontalShowcase } from './components/HorizontalShowcase';
import { ProjectLedger } from './components/ProjectLedger';
import { ProjectsShowcase } from './components/ProjectsShowcase';
import { Experience } from './components/Experience';
import { GithubLab } from './components/GithubLab';
import { SkillMatrix } from './components/SkillMatrix';
import { TerminalLab } from './components/TerminalLab';
import { ContactFooter } from './components/ContactFooter';
import { SceneManager } from './webgl/SceneManager';
import { NotFoundPage } from './pages/404';

export const App: React.FC = () => {
  const [is404, setIs404] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const hash = window.location.hash;
    return path === '/404' || path === '/404.html' || hash === '#/404' || hash === '#404';
  });

  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      setIs404(path === '/404' || path === '/404.html' || hash === '#/404' || hash === '#404');
    };

    window.addEventListener('popstate', handleRoute);
    window.addEventListener('hashchange', handleRoute);
    return () => {
      window.removeEventListener('popstate', handleRoute);
      window.removeEventListener('hashchange', handleRoute);
    };
  }, []);
  useEffect(() => {
    // Root application entry: instantiate single Lenis smooth-scroll instance
    // and expose as window.__lenis for programmatic anchor scrolling
    const lenis = getOrInitLenis();
    window.__lenis = lenis;

    // Full-viewport Three.js WebGL rendering layer & DOM plane synchronizer
    const sceneManager = SceneManager.getOrInit();

    // Global layout stabilization listener: refresh ScrollTrigger once document.fonts.ready resolves
    // and after lazy-loaded case-study images finish decoding
    if (typeof document !== 'undefined') {
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        }).catch(() => {});
      }

      // Check case-study and project images decoding
      const images = Array.from(document.querySelectorAll('img'));
      if (images.length > 0) {
        const decodePromises = images.map((img) => {
          if (img.complete) return Promise.resolve();
          if (typeof img.decode === 'function') {
            return img.decode().catch(() => {});
          }
          return new Promise((resolve) => {
            img.addEventListener('load', () => resolve(null), { once: true });
            img.addEventListener('error', () => resolve(null), { once: true });
          });
        });
        Promise.all(decodePromises).then(() => {
          ScrollTrigger.refresh();
        }).catch(() => {});
      }

      const onWindowLoad = () => ScrollTrigger.refresh();
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    // Unified programmatic anchor scrolling delegation for all <a href="#..."> links
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.length > 1 && !href.startsWith('#/')) {
          const targetEl = document.querySelector(href);
          if (targetEl) {
            e.preventDefault();
            const offset = href === '#work' ? 0 : -90;
            lenis.scrollTo(targetEl as HTMLElement, { offset, duration: 1.2 });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      sceneManager.dispose();
    };
  }, []);

  if (is404) {
    return (
      <ThemeProvider>
        <CustomCursor />
        <NotFoundPage
          onReturnHome={() => {
            setIs404(false);
            if (typeof window !== 'undefined') {
              if (window.location.hash.startsWith('#/404') || window.location.hash.startsWith('#404')) {
                window.location.hash = '';
              } else {
                window.history.pushState(null, '', '/');
              }
            }
          }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LenisProvider>
        <TransitionProvider>
          {/* Multilingual and Counter Curtain Preloader (z-index 9999) */}
          <Preloader />

          {/* Dual-layer Magnetic Custom Cursor */}
          <CustomCursor />

          {/* Subtle Fixed SVG Film-Grain Noise Overlay (opacity: 0.035; pointer-events: none; z-index: 9990) */}
          <div
            className="fixed inset-0 pointer-events-none z-[9990] select-none"
            style={{ opacity: 0.035 }}
            aria-hidden="true"
          >
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <filter id="editorial-film-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#editorial-film-grain)" />
            </svg>
          </div>

          {/* Deep Obsidian Background (#0A0A0A) with subtle editorial noise grid */}
          <div className="relative min-h-screen bg-obsidian text-alabaster selection:bg-accent selection:text-alabaster overflow-hidden bg-grid-subtle">
            
            {/* Fitts' & Hick's Law Sentinel HUD Navigation */}
            <SentinelHUD />

            {/* Core Layout Content: z-index: 2 and solid background acting as theatrical curtain stage */}
            <main
              className="relative z-[2] transition-colors flex flex-col"
              style={{ background: 'var(--bg-surface, #121212)' }}
            >
              <Hero />
              {/* Editorial Ledger About Section with drawn rules, numeric stat counters, and capability columns */}
              <About />
              {/* Interactive 3D Shader and Render-Pass Inspector embedded in the hero-to-showcase bridge */}
              <RenderPassInspector />
              {/* Dual-Mode Showcase: Pinned Horizontal Scrollytelling Reel + Editorial Serial Ledger + Flagship Deep-Dives */}
              <div id="work" className="relative">
                <HorizontalShowcase />
                <ProjectLedger />
                <ProjectsShowcase />
              </div>
              {/* Chronological Trajectory & Experience Timeline with data-stagger */}
              <Experience />
              <GithubLab />
              <SkillMatrix />
              <TerminalLab />
            </main>

            {/* Theatrical Curtain Footer Reveal: Tucked beneath main content wrapper (z-[1]) */}
            <ContactFooter />

            {/* GSAP Flip Seamless Morph Case Study Overlay */}
            <CaseStudyView />
          </div>
        </TransitionProvider>
      </LenisProvider>
    </ThemeProvider>
  );
};

export default App;
