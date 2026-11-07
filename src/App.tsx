import React, { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LenisProvider, getOrInitLenis } from './hooks/useLenis';
import { ThemeProvider } from './context/ThemeContext';
import { TransitionProvider } from './context/TransitionContext';
import { CaseStudyView } from './components/case-study/CaseStudyView';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/cursor/CustomCursor';
import { RetroCommandBar } from './components/navigation/RetroCommandBar';
import { CRTViewportShell } from './components/CRTViewportShell';
import { Hero } from './components/Hero';
import { ProjectsShowcase } from './components/ProjectsShowcase';
import { ExtensionStudio } from './components/ExtensionStudio';
import { Experience } from './components/Experience';
import { GithubLab } from './components/GithubLab';
import { SkillMatrix } from './components/SkillMatrix';
import { TerminalLab } from './components/TerminalLab';
import { ContactFooter } from './components/ContactFooter';
import { SceneManager } from './webgl/SceneManager';
import { NotFoundPage } from './pages/404';
import { CyberWaveCanvas } from './components/CyberWaveCanvas';
import { ShutterSectionStack, ShutterLayer } from './components/ShutterSectionStack';

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

          {/* 90s CRT Monitor Viewport Shell with Hardware Bezel, Scanlines & Live FX Switch */}
          <CRTViewportShell>
            {/* Top Terminal Command Bar (> [01] PROJECTS, > [02] SKILLS, etc.) */}
            <RetroCommandBar />

            {/* Persistent Hardware-Accelerated 3D Cyberdeck Wave WebGL Canvas (Waypoints across Sectors 01 - 05) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
              <CyberWaveCanvas className="w-full h-full" enableScrollWaypoints={true} />
            </div>

            {/* Core Layout Content: z-index: 2 and transparent background */}
            <main
              className="relative z-[2] transition-colors flex flex-col bg-transparent"
            >
              <ShutterSectionStack total={6}>
                {/* Sector 01: Hero Horizon */}
                <ShutterLayer
                  index={0}
                  total={6}
                  title="HERO_HORIZON"
                  id="hero-sector"
                  nextSectionId="work"
                  showDivider={false}
                >
                  <Hero showCanvas={false} />
                </ShutterLayer>

                {/* Sector 02: Flagship Systems & 3D Deck */}
                <ShutterLayer
                  index={1}
                  total={6}
                  title="FLAGSHIP_SYSTEMS_3D_DECK"
                  id="work"
                  nextSectionId="extensions-sector"
                  prevSectionId="hero-sector"
                >
                  <ProjectsShowcase />
                </ShutterLayer>

                {/* Sector 03: Dedicated Browser Extension Studio */}
                <ShutterLayer
                  index={2}
                  total={6}
                  title="BROWSER_EXTENSION_STUDIO"
                  id="extensions-sector"
                  nextSectionId="architecture-sector"
                  prevSectionId="work"
                >
                  <ExtensionStudio />
                </ShutterLayer>

                {/* Sector 04: Motherboard Architecture, Trajectory & BIOS */}
                <ShutterLayer
                  index={3}
                  total={6}
                  title="MOTHERBOARD_BIOS_ARCHITECTURE"
                  id="architecture-sector"
                  nextSectionId="lab-sector"
                  prevSectionId="extensions-sector"
                >
                  <Experience />
                  <SkillMatrix />
                </ShutterLayer>

                {/* Sector 05: GitHub ROMs & Interactive Terminal */}
                <ShutterLayer
                  index={4}
                  total={6}
                  title="GITHUB_ROMS_TERMINAL_ARCADE"
                  id="lab-sector"
                  nextSectionId="contact-sector"
                  prevSectionId="architecture-sector"
                >
                  <GithubLab />
                  <TerminalLab />
                </ShutterLayer>

                {/* Sector 06: Contact Uplink */}
                <ShutterLayer
                  index={5}
                  total={6}
                  title="CONTACT_SATELLITE_UPLINK"
                  id="contact-sector"
                  prevSectionId="lab-sector"
                >
                  <ContactFooter />
                </ShutterLayer>
              </ShutterSectionStack>
            </main>

            {/* GSAP Flip Seamless Morph Case Study Overlay */}
            <CaseStudyView />
          </CRTViewportShell>
        </TransitionProvider>
      </LenisProvider>
    </ThemeProvider>
  );
};

export default App;
