import Lenis, { type LenisOptions } from 'lenis';
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

/**
 * Shared scroll state telemetry updated on each global scroll tick.
 */
export interface ScrollState {
  velocity: number;
  normalizedVelocity: number;
  skewDeg: number;
}

/**
 * Bounds & Divisor for velocity-dependent skewing:
 * Clamped strictly to [-14, 14] degrees.
 * Divisor -280 maps typical scrolling velocity to subtle, responsive dynamic shear.
 */
export const CLAMP_MIN_SKEW = -14;
export const CLAMP_MAX_SKEW = 14;
export const VELOCITY_DIVISOR = -280;
export const SKEW_DECEL_DURATION = 0.8;

export const clampSkew = gsap.utils.clamp(CLAMP_MIN_SKEW, CLAMP_MAX_SKEW);

/**
 * Pure mapping function: self.getVelocity() / -280 through gsap.utils.clamp(-14, 14).
 */
export function calculateSkew(velocity: number): number {
  const skew = clampSkew(velocity / VELOCITY_DIVISOR);
  return skew === 0 ? 0 : skew;
}

/**
 * Shared global scroll state object exported for cross-component telemetry HUDs,
 * custom cursors, and WebGL shader uniform injection.
 */
export const scrollState: ScrollState = {
  velocity: 0,
  normalizedVelocity: 0,
  skewDeg: 0,
};

let sharedLenis: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;
let globalScrollTrigger: ScrollTrigger | null = null;
let velocitySetter: ((val: number) => void) | null = null;
const skewProxy = { skew: 0 };

/**
 * Refreshes .wk-velocity-item DOM selections and re-allocates gsap.quickSetter.
 */
export function refreshVelocityTargets(): void {
  if (typeof document === 'undefined') return;
  const items = document.querySelectorAll('.wk-velocity-item');
  if (items.length > 0) {
    gsap.set('.wk-velocity-item', {
      transformOrigin: 'right center',
      force3D: true,
    });
    velocitySetter = gsap.quickSetter('.wk-velocity-item', 'skewY', 'deg') as (val: number) => void;
  } else {
    velocitySetter = null;
  }
}

/**
 * Core velocity skew updater. Applies calculated shear to .wk-velocity-item
 * and initiates smooth deceleration via gsap.to proxy animation.
 */
export function applyVelocitySkew(rawVelocity: number, isReducedMotion = false): void {
  const targetSkew = isReducedMotion ? 0 : calculateSkew(rawVelocity);

  scrollState.velocity = rawVelocity;
  scrollState.normalizedVelocity = rawVelocity / 280;

  if (isReducedMotion) {
    skewProxy.skew = 0;
    scrollState.skewDeg = 0;
    if (velocitySetter) {
      velocitySetter(0);
    }
    return;
  }

  if (!velocitySetter) {
    refreshVelocityTargets();
  }

  // Only trigger a new gsap.to when Math.abs(skew) > Math.abs(proxy.skew)
  // or on direction reversal so deceleration settles smoothly to 0 deg without twitching
  const isReversingDirection =
    targetSkew !== 0 &&
    skewProxy.skew !== 0 &&
    Math.sign(targetSkew) !== Math.sign(skewProxy.skew);

  const isAccelerating = Math.abs(targetSkew) > Math.abs(skewProxy.skew);

  if (isAccelerating || isReversingDirection) {
    skewProxy.skew = targetSkew;
    scrollState.skewDeg = skewProxy.skew;
    if (velocitySetter) {
      velocitySetter(skewProxy.skew);
    }

    gsap.to(skewProxy, {
      skew: 0,
      duration: SKEW_DECEL_DURATION,
      ease: 'power3',
      overwrite: true,
      onUpdate: () => {
        if (velocitySetter) {
          velocitySetter(skewProxy.skew);
        }
        scrollState.skewDeg = skewProxy.skew;
      },
    });
  }
}

/**
 * Initializes and exposes a single Lenis smooth-scroll instance synchronized
 * with GSAP's master requestAnimationFrame loop exactly once, along with
 * velocity-dependent skew proxy updates.
 */
export function initScrollEngine(options?: Partial<LenisOptions>): Lenis | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Idempotency: single-ticker registration invariant
  if (sharedLenis) {
    window.__lenis = sharedLenis;
    return sharedLenis;
  }

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  // 1. Instantiate single Lenis instance with autoRaf: false
  const lenis = new Lenis({
    duration: prefersReducedMotion ? 0 : 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: !prefersReducedMotion,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.8,
    infinite: false,
    autoRaf: false, // Critical: zero competing loops, driven solely by GSAP ticker
    ...options,
  });

  sharedLenis = lenis;
  window.__lenis = lenis;

  // 2. Synchronize Lenis scroll position with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  // 3. Drive Lenis via GSAP's master ticker RAF loop with lagSmoothing(0)
  tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  // 4. Pre-allocate velocity skew proxy & quickSetter
  refreshVelocityTargets();

  // 5. Global ScrollTrigger for velocity-dependent skewing
  globalScrollTrigger = ScrollTrigger.create({
    onUpdate: (self) => {
      applyVelocitySkew(self.getVelocity(), prefersReducedMotion);
    },
  });

  return lenis;
}

/**
 * Accessor for active Lenis instance or null if not yet initialized.
 */
export function getScrollEngine(): Lenis | null {
  return sharedLenis;
}

/**
 * Initializes the scroll engine if not already active and returns the singleton Lenis instance.
 */
export function getOrInitScrollEngine(options?: Partial<LenisOptions>): Lenis | null {
  return sharedLenis ?? initScrollEngine(options);
}

/**
 * Backward-compatible alias for existing getOrInitLenis callers.
 */
export const getOrInitLenis = getOrInitScrollEngine;

/**
 * Accessor for skew proxy object (useful for inspection and testing).
 */
export function getSkewProxy(): { skew: number } {
  return skewProxy;
}

/**
 * Accessor for global ScrollTrigger instance.
 */
export function getGlobalScrollTrigger(): ScrollTrigger | null {
  return globalScrollTrigger;
}

/**
 * Completely tears down the scroll engine, detaches ticker listeners, kills global ScrollTrigger,
 * destroys Lenis, and cleans window.__lenis.
 */
export function destroyScrollEngine(): void {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }

  if (globalScrollTrigger) {
    globalScrollTrigger.kill();
    globalScrollTrigger = null;
  }

  gsap.killTweensOf(skewProxy);
  gsap.ticker.lagSmoothing(500, 33);

  if (sharedLenis) {
    sharedLenis.destroy();
    sharedLenis = null;
  }

  if (typeof window !== 'undefined') {
    delete window.__lenis;
  }

  scrollState.velocity = 0;
  scrollState.normalizedVelocity = 0;
  scrollState.skewDeg = 0;
  skewProxy.skew = 0;
  velocitySetter = null;
}

export default {
  initScrollEngine,
  getScrollEngine,
  getOrInitScrollEngine,
  getOrInitLenis,
  destroyScrollEngine,
  refreshVelocityTargets,
  applyVelocitySkew,
  calculateSkew,
  clampSkew,
  scrollState,
  getSkewProxy,
  getGlobalScrollTrigger,
  CLAMP_MIN_SKEW,
  CLAMP_MAX_SKEW,
  VELOCITY_DIVISOR,
};

