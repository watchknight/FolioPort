import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { FlagshipProject, FLAGSHIP_PROJECTS } from '../components/ProjectsShowcase';
import { SvgCurtain, SvgCurtainHandle } from '../components/transitions/SvgCurtain';

gsap.registerPlugin(Flip);

interface TransitionContextValue {
  activeProject: FlagshipProject | null;
  isTransitioning: boolean;
  openCaseStudy: (project: FlagshipProject, sourceElement?: HTMLElement | null) => void;
  closeCaseStudy: () => void;
  nextCaseStudy: (sourceElement?: HTMLElement | null) => void;
  prevCaseStudy: (sourceElement?: HTMLElement | null) => void;
  consumeFlipState: () => Flip.FlipState | null;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProject] = useState<FlagshipProject | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const curtainRef = useRef<SvgCurtainHandle | null>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const savedScrollPosRef = useRef<number>(0);
  const capturedSourceElRef = useRef<HTMLElement | null>(null);

  const consumeFlipState = useCallback(() => {
    const s = flipStateRef.current;
    flipStateRef.current = null;
    if (capturedSourceElRef.current) {
      capturedSourceElRef.current.removeAttribute('data-flip-id');
      capturedSourceElRef.current = null;
    }
    return s;
  }, []);

  const openCaseStudy = useCallback((project: FlagshipProject, sourceElement?: HTMLElement | null) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Save scroll position and trigger element for seamless restoration upon close
    savedScrollPosRef.current = window.__lenis?.scroll ?? window.scrollY;
    lastTriggerRef.current = sourceElement || (document.activeElement as HTMLElement) || null;

    // Capture GSAP Flip state from source element if provided
    if (sourceElement) {
      try {
        sourceElement.setAttribute('data-flip-id', 'case-study-hero');
        capturedSourceElRef.current = sourceElement;
        flipStateRef.current = Flip.getState(sourceElement, {
          props: 'borderRadius,boxShadow,transform',
        });
      } catch (err) {
        console.warn('Flip.getState error:', err);
      }
    }

    // Pair with full-screen SVG wipe transition curtain
    if (curtainRef.current) {
      curtainRef.current.wipe(
        () => {
          setActiveProject(project);
          document.body.style.overflow = 'hidden';
          window.__lenis?.stop();
          if (typeof window !== 'undefined') {
            window.history.pushState({ caseStudy: project.id }, '', `#case-study/${project.id}`);
          }
        },
        () => {
          setIsTransitioning(false);
        }
      );
    } else {
      setActiveProject(project);
      document.body.style.overflow = 'hidden';
      window.__lenis?.stop();
      setIsTransitioning(false);
    }
  }, [isTransitioning]);

  const closeCaseStudy = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const onFinishClose = () => {
      setActiveProject(null);
      document.body.style.overflow = 'hidden';
      window.__lenis?.start();

      // Restore scroll position to prevent page jump to apex
      if (typeof window !== 'undefined') {
        if (window.__lenis) {
          window.__lenis.scrollTo(savedScrollPosRef.current, { immediate: true });
        } else {
          window.scrollTo({ top: savedScrollPosRef.current, behavior: 'instant' as ScrollBehavior });
        }
      }

      // Restore focus to triggering button/card without disruptive scroll jump
      setTimeout(() => {
        lastTriggerRef.current?.focus({ preventScroll: true });
      }, 50);

      if (typeof window !== 'undefined' && window.location.hash.startsWith('#case-study')) {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    if (curtainRef.current) {
      curtainRef.current.wipe(
        () => {
          onFinishClose();
        },
        () => {
          setIsTransitioning(false);
        }
      );
    } else {
      onFinishClose();
      setIsTransitioning(false);
    }
  }, [isTransitioning]);

  const nextCaseStudy = useCallback((sourceElement?: HTMLElement | null) => {
    if (!activeProject || isTransitioning) return;
    const currentIndex = FLAGSHIP_PROJECTS.findIndex((p) => p.id === activeProject.id);
    const nextIndex = (currentIndex + 1) % FLAGSHIP_PROJECTS.length;
    const nextItem = FLAGSHIP_PROJECTS[nextIndex];

    setIsTransitioning(true);

    // Capture GSAP Flip state from next hero button if provided
    if (sourceElement) {
      try {
        sourceElement.setAttribute('data-flip-id', 'case-study-hero');
        capturedSourceElRef.current = sourceElement;
        flipStateRef.current = Flip.getState(sourceElement, {
          props: 'borderRadius,boxShadow,transform',
        });
      } catch (err) {
        console.warn('Flip.getState error:', err);
      }
    }

    if (curtainRef.current) {
      curtainRef.current.wipe(
        () => {
          setActiveProject(nextItem);
          if (typeof window !== 'undefined') {
            window.history.replaceState({ caseStudy: nextItem.id }, '', `#case-study/${nextItem.id}`);
          }
        },
        () => {
          setIsTransitioning(false);
        }
      );
    } else {
      setActiveProject(nextItem);
      setIsTransitioning(false);
    }
  }, [activeProject, isTransitioning]);

  const prevCaseStudy = useCallback((sourceElement?: HTMLElement | null) => {
    if (!activeProject || isTransitioning) return;
    const currentIndex = FLAGSHIP_PROJECTS.findIndex((p) => p.id === activeProject.id);
    const prevIndex = (currentIndex - 1 + FLAGSHIP_PROJECTS.length) % FLAGSHIP_PROJECTS.length;
    const prevItem = FLAGSHIP_PROJECTS[prevIndex];

    setIsTransitioning(true);

    if (sourceElement) {
      try {
        sourceElement.setAttribute('data-flip-id', 'case-study-hero');
        capturedSourceElRef.current = sourceElement;
        flipStateRef.current = Flip.getState(sourceElement, {
          props: 'borderRadius,boxShadow,transform',
        });
      } catch (err) {
        console.warn('Flip.getState error:', err);
      }
    }

    if (curtainRef.current) {
      curtainRef.current.wipe(
        () => {
          setActiveProject(prevItem);
          if (typeof window !== 'undefined') {
            window.history.replaceState({ caseStudy: prevItem.id }, '', `#case-study/${prevItem.id}`);
          }
        },
        () => {
          setIsTransitioning(false);
        }
      );
    } else {
      setActiveProject(prevItem);
      setIsTransitioning(false);
    }
  }, [activeProject, isTransitioning]);

  // Handle URL hash changes & Escape key
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#case-study/')) {
        const id = hash.replace('#case-study/', '');
        const target = FLAGSHIP_PROJECTS.find((p) => p.id === id);
        if (target && target.id !== activeProject?.id) {
          openCaseStudy(target);
        }
      } else if (activeProject) {
        closeCaseStudy();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeProject) {
        e.preventDefault();
        closeCaseStudy();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeProject, closeCaseStudy, openCaseStudy]);

  // Initial check on load once
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#case-study/')) {
      const id = window.location.hash.replace('#case-study/', '');
      const target = FLAGSHIP_PROJECTS.find((p) => p.id === id);
      if (target) {
        setActiveProject(target);
        document.body.style.overflow = 'hidden';
        window.__lenis?.stop();
      }
    }
  }, []);

  const value: TransitionContextValue = {
    activeProject,
    isTransitioning,
    openCaseStudy,
    closeCaseStudy,
    nextCaseStudy,
    prevCaseStudy,
    consumeFlipState,
  };

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <SvgCurtain ref={curtainRef} />
    </TransitionContext.Provider>
  );
};

export const useTransition = (): TransitionContextValue => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context;
};
