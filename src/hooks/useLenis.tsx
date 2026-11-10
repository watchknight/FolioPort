import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global window declaration for programmatic access
declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export interface LenisContextValue {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: { offset?: number; immediate?: boolean; duration?: number }) => void;
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollTo: () => {},
});

import { getOrInitScrollEngine } from '../motion/ScrollEngine';

/**
 * Initializes and exposes a single Lenis smooth-scroll instance synchronized
 * with GSAP's master requestAnimationFrame loop exactly once via ScrollEngine.
 */
export const getOrInitLenis = (): Lenis => {
  return (getOrInitScrollEngine() ?? null) as Lenis;
};

export const LenisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(() => {
    if (typeof window !== 'undefined') {
      return getOrInitLenis();
    }
    return null;
  });
  const lenisRef = useRef<Lenis | null>(lenisInstance);

  useEffect(() => {
    const lenis = getOrInitLenis();
    lenisRef.current = lenis;
    setLenisInstance(lenis);
    window.__lenis = lenis;
  }, []);

  const scrollTo = (target: string | HTMLElement | number, options?: { offset?: number; immediate?: boolean; duration?: number }) => {
    // Exact numbers default to offset 0; element selectors default to -90 for navbar clearance
    const defaultOffset = typeof target === 'number' ? 0 : -90;
    const offset = options?.offset !== undefined ? options.offset : defaultOffset;
    if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth', block: 'start' });
      }
    } else if (target && typeof target === 'object' && 'scrollIntoView' in target) {
      target.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth', block: 'start' });
    }

    const activeLenis = window.__lenis || lenisRef.current;

    if (activeLenis) {
      activeLenis.scrollTo(target, {
        offset,
        immediate: options?.immediate ?? false,
        duration: options?.duration ?? 1.2,
      });
    } else {
      // Native fallback
      if (typeof target === 'number') {
        window.scrollTo({
          top: target + offset,
          behavior: options?.immediate ? 'auto' : 'smooth',
        });
      } else if (typeof target === 'string') {
        const el = document.querySelector(target);
        if (el) {
          const top = (el as HTMLElement).getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({
            top,
            behavior: options?.immediate ? 'auto' : 'smooth',
          });
        }
      } else if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({
          top,
          behavior: options?.immediate ? 'auto' : 'smooth',
        });
      }
    }
  };

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance, scrollTo }}>
      {children}
    </LenisContext.Provider>
  );
};

export const useLenis = () => useContext(LenisContext);
