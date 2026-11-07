import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import gsap from 'gsap';
import {
  calculateSkew,
  clampSkew,
  scrollState,
  initScrollEngine,
  destroyScrollEngine,
  getScrollEngine,
  getOrInitScrollEngine,
  refreshVelocityTargets,
  getSkewProxy,
  getGlobalScrollTrigger,
  applyVelocitySkew,
  CLAMP_MIN_SKEW,
  CLAMP_MAX_SKEW,
  VELOCITY_DIVISOR,
} from '../ScrollEngine';

// Setup minimal browser simulation environment for Node-based Vitest execution
const setupMockDom = (prefersReducedMotion = false) => {
  const classListSet = new Set<string>();
  const classList = {
    add: (c: string) => classListSet.add(c),
    remove: (c: string) => classListSet.delete(c),
    contains: (c: string) => classListSet.has(c),
    [Symbol.iterator]: () => classListSet.values(),
  };

  const createStyle = () => ({
    removeProperty: vi.fn(),
    setProperty: vi.fn(),
    getPropertyValue: vi.fn().mockReturnValue(''),
  });

  const createNode = () => ({
    classList,
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 1920,
    clientHeight: 1080,
    offsetWidth: 1920,
    offsetHeight: 1080,
    style: createStyle(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    hasAttribute: vi.fn().mockReturnValue(false),
    getAttribute: vi.fn().mockReturnValue(null),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    getBoundingClientRect: vi.fn().mockReturnValue({
      top: 0,
      left: 0,
      width: 1920,
      height: 1080,
      right: 1920,
      bottom: 1080,
    }),
  });

  const mockDoc = {
    documentElement: createNode(),
    body: createNode(),
    querySelectorAll: vi.fn().mockReturnValue([]),
    querySelector: vi.fn().mockReturnValue(null),
    createElement: vi.fn().mockImplementation(() => createNode()),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  globalThis.requestAnimationFrame = (fn: FrameRequestCallback) =>
    setTimeout(fn, 16) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);

  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  class MockWindow {
    innerWidth = 1920;
    innerHeight = 1080;
    scrollX = 0;
    scrollY = 0;
    pageXOffset = 0;
    pageYOffset = 0;
    __lenis = undefined;
    history = { scrollRestoration: 'auto' };
    document = mockDoc;
    requestAnimationFrame = globalThis.requestAnimationFrame;
    cancelAnimationFrame = globalThis.cancelAnimationFrame;
    matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce') ? prefersReducedMotion : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    scrollTo = vi.fn();
    getComputedStyle = vi.fn().mockImplementation(() => createStyle());
  }

  const mockWin = new MockWindow();

  // @ts-ignore
  globalThis.Window = MockWindow;
  // @ts-ignore
  globalThis.window = mockWin;
  // @ts-ignore
  globalThis.document = mockDoc;
  // @ts-ignore
  globalThis.getComputedStyle = mockWin.getComputedStyle;
  // @ts-ignore
  globalThis.ResizeObserver = MockResizeObserver;

  gsap.ticker.wake();

  return { mockWin, mockDoc };
};

describe('ScrollEngine & Velocity Skew Architecture', () => {
  beforeEach(() => {
    destroyScrollEngine();
    setupMockDom(false);
  });

  afterEach(() => {
    destroyScrollEngine();
  });

  describe('1. Skew Calculation & Clamping Bounds Invariants ([-14, 14])', () => {
    it('exports strict bounds [-14, 14] and divisor -280', () => {
      expect(CLAMP_MIN_SKEW).toBe(-14);
      expect(CLAMP_MAX_SKEW).toBe(14);
      expect(VELOCITY_DIVISOR).toBe(-280);
    });

    it('clamps arbitrary values strictly within [-14, 14]', () => {
      expect(clampSkew(0)).toBe(0);
      expect(clampSkew(5)).toBe(5);
      expect(clampSkew(-5)).toBe(-5);
      expect(clampSkew(14)).toBe(14);
      expect(clampSkew(-14)).toBe(-14);
      expect(clampSkew(25)).toBe(14);
      expect(clampSkew(-25)).toBe(-14);
      expect(clampSkew(99999)).toBe(14);
      expect(clampSkew(-99999)).toBe(-14);
    });

    it('calculates 0 deg skew when velocity is 0', () => {
      expect(calculateSkew(0)).toBe(0);
    });

    it('maps downward velocity (positive velocity) to negative skew angle', () => {
      // velocity / -280: 280 / -280 = -1
      expect(calculateSkew(280)).toBeCloseTo(-1, 5);
      // 1400 / -280 = -5
      expect(calculateSkew(1400)).toBeCloseTo(-5, 5);
      // 2800 / -280 = -10
      expect(calculateSkew(2800)).toBeCloseTo(-10, 5);
      // Exact bound at 3920 / -280 = -14
      expect(calculateSkew(3920)).toBeCloseTo(-14, 5);
    });

    it('strictly clamps excessive positive velocity to -14 deg', () => {
      expect(calculateSkew(4200)).toBe(-14);
      expect(calculateSkew(10000)).toBe(-14);
      expect(calculateSkew(100000)).toBe(-14);
    });

    it('maps upward velocity (negative velocity) to positive skew angle', () => {
      // -280 / -280 = 1
      expect(calculateSkew(-280)).toBeCloseTo(1, 5);
      // -1400 / -280 = 5
      expect(calculateSkew(-1400)).toBeCloseTo(5, 5);
      // -2800 / -280 = 10
      expect(calculateSkew(-2800)).toBeCloseTo(10, 5);
      // Exact bound at -3920 / -280 = 14
      expect(calculateSkew(-3920)).toBeCloseTo(14, 5);
    });

    it('strictly clamps excessive negative velocity to 14 deg', () => {
      expect(calculateSkew(-4200)).toBe(14);
      expect(calculateSkew(-10000)).toBe(14);
      expect(calculateSkew(-100000)).toBe(14);
    });
  });

  describe('2. Single-Ticker Registration & Lenis Lifecycle', () => {
    it('instantiates single Lenis instance and exposes safely on window.__lenis', () => {
      const lenis = initScrollEngine();
      expect(lenis).not.toBeNull();
      expect(window.__lenis).toBe(lenis);
      expect(getScrollEngine()).toBe(lenis);
    });

    it('enforces single-ticker registration invariant across repeated calls', () => {
      const tickerAddSpy = vi.spyOn(gsap.ticker, 'add');

      const lenis1 = initScrollEngine();
      const callCountAfterFirstInit = tickerAddSpy.mock.calls.length;

      // Second initialization should return identical instance without adding new ticker
      const lenis2 = initScrollEngine();
      const lenis3 = getOrInitScrollEngine();

      expect(lenis2).toBe(lenis1);
      expect(lenis3).toBe(lenis1);
      expect(tickerAddSpy.mock.calls.length).toBe(callCountAfterFirstInit);

      tickerAddSpy.mockRestore();
    });

    it('configures gsap.ticker with lagSmoothing(0) for zero-jank frame pacing', () => {
      const lagSmoothingSpy = vi.spyOn(gsap.ticker, 'lagSmoothing');
      initScrollEngine();
      expect(lagSmoothingSpy).toHaveBeenCalledWith(0);
      lagSmoothingSpy.mockRestore();
    });

    it('returns null safely when window is undefined (SSR environment)', () => {
      // @ts-ignore
      delete globalThis.window;
      expect(initScrollEngine()).toBeNull();
      setupMockDom(false);
    });
  });

  describe('3. Clean Teardown on Unmount', () => {
    it('removes ticker callback, kills ScrollTrigger, destroys Lenis, and cleans window.__lenis', () => {
      const tickerRemoveSpy = vi.spyOn(gsap.ticker, 'remove');
      const lenis = initScrollEngine();
      expect(lenis).not.toBeNull();

      const lenisDestroySpy = vi.spyOn(lenis!, 'destroy');

      destroyScrollEngine();

      expect(tickerRemoveSpy).toHaveBeenCalled();
      expect(lenisDestroySpy).toHaveBeenCalled();
      expect(window.__lenis).toBeUndefined();
      expect(getScrollEngine()).toBeNull();

      tickerRemoveSpy.mockRestore();
    });

    it('resets scrollState telemetry to zero values on destroy', () => {
      initScrollEngine();
      scrollState.velocity = 540;
      scrollState.normalizedVelocity = 1.92;
      scrollState.skewDeg = -2;

      destroyScrollEngine();

      expect(scrollState.velocity).toBe(0);
      expect(scrollState.normalizedVelocity).toBe(0);
      expect(scrollState.skewDeg).toBe(0);
    });

    it('allows clean re-initialization after destruction', () => {
      const lenis1 = initScrollEngine();
      expect(lenis1).not.toBeNull();
      destroyScrollEngine();
      expect(getScrollEngine()).toBeNull();

      const lenis2 = initScrollEngine();
      expect(lenis2).not.toBeNull();
      expect(getScrollEngine()).toBe(lenis2);
      expect(window.__lenis).toBe(lenis2);
    });
  });

  describe('4. Velocity Skew Proxy & Smooth Deceleration Invariant', () => {
    it('maintains a skew proxy object initialized at 0', () => {
      const proxy = getSkewProxy();
      expect(proxy).toBeDefined();
      expect(proxy.skew).toBe(0);
    });

    it('refreshes velocity targets without errors even if no matching elements exist', () => {
      expect(() => refreshVelocityTargets()).not.toThrow();
    });

    it('resets proxy skew to 0 on engine teardown', () => {
      const proxy = getSkewProxy();
      proxy.skew = 8.5;
      destroyScrollEngine();
      expect(proxy.skew).toBe(0);
    });

    it('updates scrollState and initiates deceleration tween when velocity accelerates', () => {
      initScrollEngine();
      const gsapToSpy = vi.spyOn(gsap, 'to');

      // Downward scroll velocity: 1400 -> skew -5
      applyVelocitySkew(1400);

      expect(scrollState.velocity).toBe(1400);
      expect(scrollState.normalizedVelocity).toBeCloseTo(5, 5);
      expect(getSkewProxy().skew).toBeCloseTo(-5, 5);
      expect(scrollState.skewDeg).toBeCloseTo(-5, 5);
      expect(gsapToSpy).toHaveBeenCalledWith(
        expect.objectContaining({ skew: expect.any(Number) }),
        expect.objectContaining({
          skew: 0,
          duration: 0.8,
          ease: 'power3',
          overwrite: true,
        })
      );

      gsapToSpy.mockRestore();
    });

    it('does not re-trigger gsap.to when deceleration occurs in the same direction (preventing twitch)', () => {
      initScrollEngine();
      applyVelocitySkew(2800); // target skew = -10 deg
      expect(getSkewProxy().skew).toBeCloseTo(-10, 5);

      const gsapToSpy = vi.spyOn(gsap, 'to');

      // Slower velocity in the same direction (560 -> target skew = -2 deg)
      // Since Math.abs(-2) <= Math.abs(-10), it should NOT trigger a new gsap.to tween
      applyVelocitySkew(560);

      expect(gsapToSpy).not.toHaveBeenCalled();
      expect(getSkewProxy().skew).toBeCloseTo(-10, 5); // Kept previous skew without snapping

      gsapToSpy.mockRestore();
    });

    it('triggers a new deceleration tween when scroll direction reverses', () => {
      initScrollEngine();
      applyVelocitySkew(2800); // target skew = -10 deg
      expect(getSkewProxy().skew).toBeCloseTo(-10, 5);

      const gsapToSpy = vi.spyOn(gsap, 'to');

      // Reversing direction upwards (-560 -> target skew = +2 deg)
      applyVelocitySkew(-560);

      expect(gsapToSpy).toHaveBeenCalled();
      expect(getSkewProxy().skew).toBeCloseTo(2, 5);
      expect(scrollState.skewDeg).toBeCloseTo(2, 5);

      gsapToSpy.mockRestore();
    });

    it('creates and attaches global ScrollTrigger on init, and kills it on destroy', () => {
      initScrollEngine();
      const st = getGlobalScrollTrigger();
      expect(st).not.toBeNull();
      expect(typeof st?.vars.onUpdate).toBe('function');

      destroyScrollEngine();
      expect(getGlobalScrollTrigger()).toBeNull();
    });

    it('restores default lagSmoothing(500, 33) on destroy', () => {
      initScrollEngine();
      const lagSmoothingSpy = vi.spyOn(gsap.ticker, 'lagSmoothing');
      destroyScrollEngine();
      expect(lagSmoothingSpy).toHaveBeenCalledWith(500, 33);
      lagSmoothingSpy.mockRestore();
    });
  });

  describe('5. Reduced Motion Compliance', () => {
    it('initializes Lenis with duration 0 and smoothWheel false when prefers-reduced-motion is active', () => {
      destroyScrollEngine();
      setupMockDom(true); // prefers-reduced-motion: true

      const lenis = initScrollEngine();
      expect(lenis).not.toBeNull();
      expect(window.__lenis).toBe(lenis);
    });

    it('forces velocity skew to 0 deg when prefers-reduced-motion is active', () => {
      applyVelocitySkew(2800, true); // isReducedMotion = true
      expect(getSkewProxy().skew).toBe(0);
      expect(scrollState.skewDeg).toBe(0);
    });
  });
});
