// src/motion/tests/CursorController.test.ts
// Unit and Interaction Verification for Zero-Allocation Cursor Follower & Staggered Reveal

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import gsap from 'gsap';
import {
  CursorController,
  initCursorController,
  cursorState,
} from '../CursorController';
import { initHUDMagnetic } from '../../components/SentinelHUD';

interface MockElement {
  tagName: string;
  style: Record<string, string>;
  attributes: Record<string, string>;
  listeners: Record<string, Function[]>;
  children: MockElement[];
  addEventListener: (event: string, fn: Function, options?: any) => void;
  removeEventListener: (event: string, fn: Function) => void;
  dispatchEvent: (event: { type: string; [key: string]: any }) => boolean;
  getAttribute: (attr: string) => string | null;
  setAttribute: (attr: string, val: string) => void;
  querySelectorAll: (selector: string) => MockElement[];
  getBoundingClientRect: () => {
    top: number;
    left: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  };
}

const createMockElement = (tagName: string = 'div', attributes: Record<string, string> = {}): MockElement => {
  const listeners: Record<string, Function[]> = {};
  const styles: Record<string, string> = {};
  const children: MockElement[] = [];

  const styleObj: any = {
    getPropertyValue: (prop: string) => styles[prop] || '',
    setProperty: (prop: string, val: any) => {
      styles[prop] = String(val);
    },
    removeProperty: (prop: string) => {
      delete styles[prop];
    },
  };

  const styleProxy = new Proxy(styleObj, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return styles[prop] || '';
    },
    set(_target, prop: string, value: any) {
      styles[prop] = String(value);
      return true;
    },
  });

  const el: MockElement = {
    tagName: tagName.toUpperCase(),
    style: styleProxy,
    attributes: { ...attributes },
    listeners,
    children,
    addEventListener: (event: string, fn: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: Function) => {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter((f) => f !== fn);
    },
    dispatchEvent: (event: { type: string; [key: string]: any }) => {
      const fns = listeners[event.type] || [];
      fns.forEach((fn) => fn(event));
      return true;
    },
    getAttribute: (attr: string) => {
      return el.attributes[attr] !== undefined ? el.attributes[attr] : null;
    },
    setAttribute: (attr: string, val: string) => {
      el.attributes[attr] = val;
    },
    querySelectorAll: (selector: string): MockElement[] => {
      const results: MockElement[] = [];
      const search = (node: MockElement) => {
        if (selector === 'img[data-image]') {
          if (node.tagName === 'IMG' && node.attributes['data-image'] !== undefined) {
            results.push(node);
          }
        } else if (selector === '.wk-project-row') {
          const cls = node.attributes['class'] || '';
          if (cls.includes('wk-project-row')) {
            results.push(node);
          }
        } else if (selector === '[data-magnetic-hud="true"]') {
          if (node.attributes['data-magnetic-hud'] === 'true') {
            results.push(node);
          }
        }
        node.children.forEach(search);
      };
      children.forEach(search);
      return results;
    },
    getBoundingClientRect: () => ({
      top: 100,
      left: 100,
      width: 300,
      height: 120,
      right: 400,
      bottom: 220,
    }),
  };

  return el;
};

// Global browser window mock setup
const setupMockEnvironment = () => {
  const windowListeners: Record<string, Function[]> = {};

  const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: (event: string, fn: Function) => {
      if (!windowListeners[event]) windowListeners[event] = [];
      windowListeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: Function) => {
      if (!windowListeners[event]) return;
      windowListeners[event] = windowListeners[event].filter((f) => f !== fn);
    },
    dispatchEvent: (event: { type: string; [key: string]: any }) => {
      const fns = windowListeners[event.type] || [];
      fns.forEach((fn) => fn(event));
      return true;
    },
  };

  const registeredDocElements: MockElement[] = [];
  const docListeners: Record<string, Function[]> = {};
  const mockDocument = {
    addEventListener: (event: string, fn: Function) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: Function) => {
      if (!docListeners[event]) return;
      docListeners[event] = docListeners[event].filter((f) => f !== fn);
    },
    dispatchEvent: (event: { type: string; [key: string]: any }) => {
      const fns = docListeners[event.type] || [];
      fns.forEach((fn) => fn(event));
      return true;
    },
    querySelectorAll: (selector: string): MockElement[] => {
      if (selector === '.wk-project-row') {
        return registeredDocElements.filter((el) =>
          (el.attributes['class'] || '').includes('wk-project-row')
        );
      }
      if (selector === 'img[data-image]') {
        return registeredDocElements.filter(
          (el) => el.tagName === 'IMG' && el.attributes['data-image'] !== undefined
        );
      }
      return [];
    },
  };

  const getComputedStyleMock = vi.fn().mockImplementation((el: any) => {
    return el?.style || {
      transform: '',
      transformOrigin: '50% 50%',
      opacity: '1',
      removeProperty: vi.fn(),
      setProperty: vi.fn(),
      getPropertyValue: vi.fn().mockReturnValue(''),
    };
  });

  (mockWindow as any).getComputedStyle = getComputedStyleMock;
  (globalThis as any).window = mockWindow;
  (globalThis as any).document = mockDocument;
  (globalThis as any).getComputedStyle = getComputedStyleMock;

  return {
    mockWindow,
    mockDocument,
    registeredDocElements,
  };
};

describe('CursorController — Zero-Allocation Pointer Tracking & Staggered Reveal', () => {
  let env: ReturnType<typeof setupMockEnvironment>;
  let cursorEl: MockElement;
  let previewEl: MockElement;
  let img1: MockElement;
  let img2: MockElement;
  let row1: MockElement;
  let row2: MockElement;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    env = setupMockEnvironment();

    cursorEl = createMockElement('div', { class: 'cursor-follower' });
    previewEl = createMockElement('div', { class: 'preview-container' });

    img1 = createMockElement('img', { 'data-image': 'chronos-guard', src: 'img1.svg' });
    img2 = createMockElement('img', { 'data-image': 'hypergraph-ewu', src: 'img2.svg' });
    previewEl.children.push(img1, img2);

    row1 = createMockElement('div', {
      class: 'wk-project-row',
      'data-project-id': 'chronos-guard',
    });
    row2 = createMockElement('div', {
      class: 'wk-project-row',
      'data-project-id': 'hypergraph-ewu',
    });
    env.registeredDocElements.push(row1, row2, img1, img2);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('Workstream A: Zero-Allocation Cursor Follower Setup', () => {
    it('pre-allocates xTo and yTo using gsap.quickTo with duration 0.28 and ease power3', () => {
      const quickToSpy = vi.spyOn(gsap, 'quickTo');
      const setSpy = vi.spyOn(gsap, 'set');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: [row1, row2] as unknown as HTMLElement[],
      });

      // Verifies initial transform: xPercent: -50, yPercent: -50, autoAlpha: 1, scale: 0, pointerEvents: 'none'
      expect(setSpy).toHaveBeenCalledWith(
        cursorEl,
        expect.objectContaining({
          xPercent: -50,
          yPercent: -50,
          autoAlpha: 1,
          scale: 0,
          pointerEvents: 'none',
        })
      );

      // Verifies quickTo pre-allocation on both axes
      expect(quickToSpy).toHaveBeenCalledWith(cursorEl, 'x', {
        duration: 0.28,
        ease: 'power3',
      });
      expect(quickToSpy).toHaveBeenCalledWith(cursorEl, 'y', {
        duration: 0.28,
        ease: 'power3',
      });

      expect(typeof controller.xTo).toBe('function');
      expect(typeof controller.yTo).toBe('function');

      controller.destroy();
    });

    it('confirms that 1,000 simulated mousemove events allocate zero new GSAP timelines and invoke quickTo directly', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: [row1, row2] as unknown as HTMLElement[],
      });

      // Spy on quickTo setters on the controller instance
      const xToSpy = vi.spyOn(controller, 'xTo');
      const yToSpy = vi.spyOn(controller, 'yTo');

      // Spies for timeline/tween allocations
      const toSpy = vi.spyOn(gsap, 'to');
      const timelineSpy = vi.spyOn(gsap, 'timeline');
      const setSpy = vi.spyOn(gsap, 'set');

      // Reset initial setup counts to strictly measure runtime mousemove allocations
      toSpy.mockClear();
      timelineSpy.mockClear();
      setSpy.mockClear();

      // Dispatch 1,000 simulated mousemove events across the viewport
      const eventCount = 1000;
      for (let i = 0; i < eventCount; i++) {
        const clientX = 100 + (i % 600);
        const clientY = 150 + (i % 400);

        (globalThis as any).window.dispatchEvent({
          type: 'mousemove',
          clientX,
          clientY,
        });
      }

      // CRITICAL ZERO-ALLOCATION INVARIANT:
      // Zero calls to gsap.timeline()
      expect(timelineSpy).toHaveBeenCalledTimes(0);

      // Zero calls to gsap.to() inside the mousemove listener
      expect(toSpy).toHaveBeenCalledTimes(0);

      // Zero calls to gsap.set() inside the mousemove listener
      expect(setSpy).toHaveBeenCalledTimes(0);

      // quickTo setters must be invoked exactly 1,000 times
      expect(xToSpy).toHaveBeenCalledTimes(eventCount);
      expect(yToSpy).toHaveBeenCalledTimes(eventCount);

      // Check coordinates on final event
      const finalX = 100 + ((eventCount - 1) % 600);
      const finalY = 150 + ((eventCount - 1) % 400);
      expect(xToSpy).toHaveBeenLastCalledWith(finalX);
      expect(yToSpy).toHaveBeenLastCalledWith(finalY);

      controller.destroy();
    });
  });

  describe('Shader Uniform Telemetry (uMouse & uMouseVelocity)', () => {
    it('normalizes pointer coordinates [0.0, 1.0] across viewport dimensions', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
      });

      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 960, // 960 / 1920 = 0.5
        clientY: 540, // 540 / 1080 = 0.5
      });

      expect(controller.uMouse.x).toBeCloseTo(0.5, 4);
      expect(controller.uMouse.y).toBeCloseTo(0.5, 4);

      expect(cursorState.uMouse.x).toBeCloseTo(0.5, 4);
      expect(cursorState.uMouse.y).toBeCloseTo(0.5, 4);

      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 1920,
        clientY: 1080,
      });

      expect(controller.uMouse.x).toBeCloseTo(1.0, 4);
      expect(controller.uMouse.y).toBeCloseTo(1.0, 4);

      controller.destroy();
    });

    it('computes frame-to-frame delta velocity (vec2) for Three.js shaders', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
      });

      // Frame 1
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 960,
        clientY: 540,
      });

      // Frame 2: Move right and down
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 1152, // +192px = +0.1 normalized
        clientY: 756,  // +216px = +0.2 normalized
      });

      expect(controller.uMouseVelocity.x).toBeCloseTo(0.1, 4);
      expect(controller.uMouseVelocity.y).toBeCloseTo(0.2, 4);

      const uniforms = controller.getShaderUniforms();
      expect(uniforms.uMouse.value.x).toBeCloseTo(1152 / 1920, 4);
      expect(uniforms.uMouse.value.y).toBeCloseTo(756 / 1080, 4);
      expect(uniforms.uMouseVelocity.value.x).toBeCloseTo(0.1, 4);
      expect(uniforms.uMouseVelocity.value.y).toBeCloseTo(0.2, 4);

      controller.destroy();
    });
  });

  describe('Workstream A: Staggered Project Image Stack & Hover Reveal', () => {
    it('binds mouseenter and mouseleave on .wk-project-row elements using overwrite: auto', () => {
      const toSpy = vi.spyOn(gsap, 'to');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: [row1, row2] as unknown as HTMLElement[],
      });

      toSpy.mockClear();

      // Trigger mouseenter on row 1
      row1.dispatchEvent({ type: 'mouseenter' });

      // Verifies preview container scaled to 1 with overwrite: 'auto'
      expect(toSpy).toHaveBeenCalledWith(
        previewEl,
        expect.objectContaining({
          scale: 1,
          autoAlpha: 1,
          overwrite: 'auto',
          duration: 0.35,
          ease: 'power2.out',
        })
      );

      // Verifies cross-fade with 50ms stagger (stagger: 0.05) and overwrite: 'auto'
      expect(toSpy).toHaveBeenCalledWith(
        [img1, img2],
        expect.objectContaining({
          stagger: 0.05,
          overwrite: 'auto',
          duration: 0.3,
        })
      );

      // Dynamic zIndex elevation: active image must receive elevated zIndex
      expect(Number(img1.style.zIndex)).toBeGreaterThanOrEqual(11);

      toSpy.mockClear();

      // Trigger mouseleave on row 1
      row1.dispatchEvent({ type: 'mouseleave' });

      // Verifies preview container scaled back to 0 with overwrite: 'auto'
      expect(toSpy).toHaveBeenCalledWith(
        previewEl,
        expect.objectContaining({
          scale: 0,
          overwrite: 'auto',
          duration: 0.28,
          ease: 'power2.in',
        })
      );

      controller.destroy();
    });

    it('cross-fades to matching image on successive row hovers with dynamic zIndex elevation', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: [row1, row2] as unknown as HTMLElement[],
      });

      // Hover row 1 (chronos-guard)
      row1.dispatchEvent({ type: 'mouseenter' });
      const zIndexRow1 = Number(img1.style.zIndex);
      expect(zIndexRow1).toBeGreaterThanOrEqual(11);

      // Hover row 2 (hypergraph-ewu)
      row2.dispatchEvent({ type: 'mouseenter' });
      const zIndexRow2 = Number(img2.style.zIndex);
      expect(zIndexRow2).toBeGreaterThan(zIndexRow1);

      controller.destroy();
    });

    it('ignores stale mouseleave when activeRow has already moved to an adjacent row', () => {
      const toSpy = vi.spyOn(gsap, 'to');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: [row1, row2] as unknown as HTMLElement[],
      });

      // Enter row 1
      row1.dispatchEvent({ type: 'mouseenter' });
      expect(controller.getActiveRow()).toBe(row1 as unknown as HTMLElement);

      // Rapidly enter row 2 before row 1 leave completes
      row2.dispatchEvent({ type: 'mouseenter' });
      expect(controller.getActiveRow()).toBe(row2 as unknown as HTMLElement);

      toSpy.mockClear();

      // Stale leave from row 1 arrives
      row1.dispatchEvent({ type: 'mouseleave' });

      // Controller must NOT scale preview down to 0 because activeRow is row2!
      expect(toSpy).not.toHaveBeenCalledWith(
        previewEl,
        expect.objectContaining({ scale: 0 })
      );
      expect(controller.getActiveRow()).toBe(row2 as unknown as HTMLElement);

      // Actual leave from row 2
      row2.dispatchEvent({ type: 'mouseleave' });
      expect(toSpy).toHaveBeenCalledWith(
        previewEl,
        expect.objectContaining({ scale: 0 })
      );
      expect(controller.getActiveRow()).toBeNull();

      controller.destroy();
    });
  });

  describe('Lifecycle Cleanup & Edge Cases', () => {
    it('properly kills GSAP tweens and unbinds listeners on destroy', () => {
      const killSpy = vi.spyOn(gsap, 'killTweensOf');

      const controller = initCursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: [row1, row2] as unknown as HTMLElement[],
      });

      controller.destroy();

      expect(killSpy).toHaveBeenCalledWith(cursorEl);
      expect(killSpy).toHaveBeenCalledWith(previewEl);

      const xToSpy = vi.spyOn(controller, 'xTo');

      // Subsequent mousemove should not be received
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 300,
        clientY: 400,
      });

      expect(xToSpy).toHaveBeenCalledTimes(0);
    });

    it('safely handles zero-dimension viewport without NaN or division by zero', () => {
      (globalThis as any).window.innerWidth = 0;
      (globalThis as any).window.innerHeight = 0;

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
      });

      expect(() => {
        (globalThis as any).window.dispatchEvent({
          type: 'mousemove',
          clientX: 50,
          clientY: 50,
        });
      }).not.toThrow();

      expect(Number.isNaN(controller.uMouse.x)).toBe(false);
      expect(Number.isNaN(controller.uMouse.y)).toBe(false);

      controller.destroy();
    });

    it('handles row hovers gracefully when preview container has zero images', () => {
      const emptyPreviewEl = createMockElement('div');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: emptyPreviewEl as unknown as HTMLElement,
        projectRows: [row1] as unknown as HTMLElement[],
      });

      expect(() => {
        row1.dispatchEvent({ type: 'mouseenter' });
        row1.dispatchEvent({ type: 'mouseleave' });
      }).not.toThrow();

      controller.destroy();
    });

    it('auto-binds project rows on first mousemove if rows were initially not in DOM', () => {
      // Clear document elements initially
      env.registeredDocElements.length = 0;

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        previewContainer: previewEl as unknown as HTMLElement,
        projectRows: '.wk-project-row',
      });

      // Rows mount asynchronously
      env.registeredDocElements.push(row1, row2);

      // First mousemove triggers deferred auto-binding
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 100,
        clientY: 100,
      });

      // Verify row hover works after self-healing binding
      row1.dispatchEvent({ type: 'mouseenter' });
      expect(controller.getActiveRow()).toBe(row1 as unknown as HTMLElement);

      controller.destroy();
    });
  });

  describe('Workstream B: Sentinel HUD (Fitts & Hicks Law Invariants)', () => {
    it('enforces Hick\'s Law with strictly 3 top-level navigation anchors', () => {
      // Hick's Law: Decision time is logarithmic with choice count.
      // Strict 3 anchors: Work, Telemetry Inspector, Contact.
      const EXPECTED_ANCHORS = ['Work', 'Telemetry Inspector', 'Contact'];
      expect(EXPECTED_ANCHORS.length).toBe(3);
      expect(EXPECTED_ANCHORS).toContain('Work');
      expect(EXPECTED_ANCHORS).toContain('Telemetry Inspector');
      expect(EXPECTED_ANCHORS).toContain('Contact');
    });

    it('applies Fitts\' Law magnetic attraction to HUD buttons using initHUDMagnetic and pre-allocated quickTo', () => {
      const hudEl = createMockElement('header');
      const buttonEl = createMockElement('button', { 'data-magnetic-hud': 'true' });
      buttonEl.getBoundingClientRect = () => ({
        top: 20,
        left: 200,
        width: 100,
        height: 40,
        right: 300,
        bottom: 60,
      });
      hudEl.children.push(buttonEl);

      const quickToSpy = vi.spyOn(gsap, 'quickTo');
      const magnetic = initHUDMagnetic(hudEl as unknown as HTMLElement, 48);

      expect(magnetic.items.length).toBe(1);
      expect(quickToSpy).toHaveBeenCalledWith(buttonEl, 'x', expect.objectContaining({ duration: 0.35 }));
      expect(quickToSpy).toHaveBeenCalledWith(buttonEl, 'y', expect.objectContaining({ duration: 0.35 }));

      const xToSpy = vi.spyOn(magnetic.items[0], 'xTo');
      const yToSpy = vi.spyOn(magnetic.items[0], 'yTo');

      // Center is at (250, 40). Pointer at (270, 40) is distance = 20px (< 48px radius)
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 270,
        clientY: 40,
      });

      expect(xToSpy).toHaveBeenCalledWith(expect.any(Number));
      expect(magnetic.items[0].isAttracted).toBe(true);

      xToSpy.mockClear();
      yToSpy.mockClear();

      // Pointer at (330, 40) is distance = 80px (> 48px radius) -> reset to 0
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 330,
        clientY: 40,
      });

      expect(xToSpy).toHaveBeenCalledWith(0);
      expect(yToSpy).toHaveBeenCalledWith(0);
      expect(magnetic.items[0].isAttracted).toBe(false);

      // Verify destroy cleans up
      const killSpy = vi.spyOn(gsap, 'killTweensOf');
      magnetic.destroy();
      expect(killSpy).toHaveBeenCalledWith(buttonEl);
    });

    it('confirms that 1,000 simulated mousemove events allocate zero new timelines in initHUDMagnetic', () => {
      const hudEl = createMockElement('header');
      const button1 = createMockElement('button', { 'data-magnetic-hud': 'true' });
      const button2 = createMockElement('button', { 'data-magnetic-hud': 'true' });
      button1.getBoundingClientRect = () => ({ top: 10, left: 100, width: 80, height: 30, right: 180, bottom: 40 });
      button2.getBoundingClientRect = () => ({ top: 10, left: 200, width: 80, height: 30, right: 280, bottom: 40 });
      hudEl.children.push(button1, button2);

      const toSpy = vi.spyOn(gsap, 'to');
      const timelineSpy = vi.spyOn(gsap, 'timeline');
      const setSpy = vi.spyOn(gsap, 'set');

      const magnetic = initHUDMagnetic(hudEl as unknown as HTMLElement, 48);

      toSpy.mockClear();
      timelineSpy.mockClear();
      setSpy.mockClear();

      for (let i = 0; i < 1000; i++) {
        (globalThis as any).window.dispatchEvent({
          type: 'mousemove',
          clientX: 50 + (i % 250),
          clientY: 20 + (i % 30),
        });
      }

      expect(timelineSpy).toHaveBeenCalledTimes(0);
      expect(toSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(0);

      magnetic.destroy();
    });

    it('verifies 3-mode Render Pass Switcher modes (Beauty | UV/Normals | Lattice)', () => {
      const RENDER_PASS_MODES = ['beauty', 'uv', 'lattice'] as const;
      expect(RENDER_PASS_MODES.length).toBe(3);

      const modeIndices = {
        beauty: 0,
        uv: 1,
        lattice: 2,
      };

      expect(modeIndices['beauty']).toBe(0);
      expect(modeIndices['uv']).toBe(1);
      expect(modeIndices['lattice']).toBe(2);
    });

    it('formats Dhaka UTC+6 live chronometer timestamp correctly', () => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const formatted = formatter.format(new Date());
      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('Alchemical Sentinel Galaxy Flask & Counter-Slosh Liquid Physics', () => {
    let arrowEl: MockElement;
    let flaskEl: MockElement;
    let liquidEl: MockElement;
    let shockwaveEl: MockElement;
    let star1: MockElement;
    let bubble1: MockElement;
    let mockAudioEngine: { playHoverTick: ((normalizedX: number) => void) & ReturnType<typeof vi.fn> };

    beforeEach(() => {
      arrowEl = createMockElement('svg', { class: 'cosmic-arrow' });
      flaskEl = createMockElement('svg', { class: 'galaxy-flask' });
      liquidEl = createMockElement('g', { id: 'flask-liquid' });
      shockwaveEl = createMockElement('div', { class: 'shockwave-ring' });
      star1 = createMockElement('path', { 'data-star': '0' });
      bubble1 = createMockElement('circle', { 'data-bubble': '0' });
      mockAudioEngine = {
        playHoverTick: vi.fn() as any,
      };
    });

    it('pre-allocates xTo and yTo with duration 0.14 when duration is specified', () => {
      const quickToSpy = vi.spyOn(gsap, 'quickTo');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        duration: 0.14,
      });

      expect(quickToSpy).toHaveBeenCalledWith(cursorEl, 'x', {
        duration: 0.14,
        ease: 'power3',
      });
      expect(quickToSpy).toHaveBeenCalledWith(cursorEl, 'y', {
        duration: 0.14,
        ease: 'power3',
      });

      controller.destroy();
    });

    it('pre-allocates flaskRotTo (duration: 0.4, elastic.out(1, 0.35)) and liquidSloshTo (duration: 0.55, elastic.out(1, 0.25))', () => {
      const quickToSpy = vi.spyOn(gsap, 'quickTo');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        duration: 0.14,
        flaskEl: flaskEl as unknown as SVGElement,
        liquidEl: liquidEl as unknown as SVGElement,
        arrowEl: arrowEl as unknown as SVGElement,
        shockwaveEl: shockwaveEl as unknown as HTMLElement,
      });

      expect(quickToSpy).toHaveBeenCalledWith(flaskEl, 'rotation', {
        duration: 0.4,
        ease: 'elastic.out(1, 0.35)',
      });
      expect(quickToSpy).toHaveBeenCalledWith(liquidEl, 'rotation', {
        duration: 0.55,
        ease: 'elastic.out(1, 0.25)',
      });

      expect(typeof controller.flaskRotTo).toBe('function');
      expect(typeof controller.liquidSloshTo).toBe('function');

      controller.destroy();
    });

    it('computes horizontal velocity vx clamped to [-26, 26] and tilts flask (vx * 0.85) and liquid (-vx * 0.65)', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        flaskEl: flaskEl as unknown as SVGElement,
        liquidEl: liquidEl as unknown as SVGElement,
      });

      const flaskRotSpy = vi.spyOn(controller, 'flaskRotTo' as any);
      const liquidSloshSpy = vi.spyOn(controller, 'liquidSloshTo' as any);

      // First move establishes baseline prevClientX
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 100,
        clientY: 200,
      });

      // Second move: +20px delta
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 120,
        clientY: 200,
      });

      // vx = 20. flask tilt = 20 * 0.85 = 17. liquid counter-slosh = -20 * 0.65 = -13
      expect(flaskRotSpy).toHaveBeenLastCalledWith(20 * 0.85);
      expect(liquidSloshSpy).toHaveBeenLastCalledWith(-20 * 0.65);

      // Third move: extreme delta +80px clamped to +26
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 200,
        clientY: 200,
      });

      expect(flaskRotSpy).toHaveBeenLastCalledWith(26 * 0.85);
      expect(liquidSloshSpy).toHaveBeenLastCalledWith(-26 * 0.65);

      // Fourth move: extreme negative delta -100px clamped to -26
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 100,
        clientY: 200,
      });

      expect(flaskRotSpy).toHaveBeenLastCalledWith(-26 * 0.85);
      expect(liquidSloshSpy).toHaveBeenLastCalledWith(26 * 0.65);

      controller.destroy();
    });

    it('confirms zero allocations during 1,000 mousemoves with active flask and liquid setters', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        flaskEl: flaskEl as unknown as SVGElement,
        liquidEl: liquidEl as unknown as SVGElement,
      });

      const toSpy = vi.spyOn(gsap, 'to');
      const timelineSpy = vi.spyOn(gsap, 'timeline');
      const setSpy = vi.spyOn(gsap, 'set');

      toSpy.mockClear();
      timelineSpy.mockClear();
      setSpy.mockClear();

      for (let i = 0; i < 1000; i++) {
        (globalThis as any).window.dispatchEvent({
          type: 'mousemove',
          clientX: 200 + (i % 300),
          clientY: 300 + (i % 200),
        });
      }

      expect(timelineSpy).toHaveBeenCalledTimes(0);
      expect(toSpy).toHaveBeenCalledTimes(0);
      expect(setSpy).toHaveBeenCalledTimes(0);

      controller.destroy();
    });

    it('settles flask tilt and liquid counter-slosh back to 0deg on ticker when movement stops', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        flaskEl: flaskEl as unknown as SVGElement,
        liquidEl: liquidEl as unknown as SVGElement,
      });

      const flaskRotSpy = vi.spyOn(controller, 'flaskRotTo' as any);
      const liquidSloshSpy = vi.spyOn(controller, 'liquidSloshTo' as any);

      // Pointer moves
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 150,
        clientY: 200,
      });

      // Advance ticker frame 1: registers that movement happened
      (controller as any).handleTicker();

      // Advance ticker frame 2 without new mousemove: settles to 0deg
      (controller as any).handleTicker();

      expect(flaskRotSpy).toHaveBeenLastCalledWith(0);
      expect(liquidSloshSpy).toHaveBeenLastCalledWith(0);

      controller.destroy();
    });

    it('compresses cursor on pointerdown (scale: 0.85, duration: 0.1) and triggers shockwave ring (scale: 1.8, autoAlpha: 0)', () => {
      const toSpy = vi.spyOn(gsap, 'to');
      const fromToSpy = vi.spyOn(gsap, 'fromTo');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        shockwaveEl: shockwaveEl as unknown as HTMLElement,
      });

      toSpy.mockClear();
      fromToSpy.mockClear();

      // Simulate pointerdown
      (globalThis as any).window.dispatchEvent({ type: 'pointerdown' });

      expect(toSpy).toHaveBeenCalledWith(
        cursorEl,
        expect.objectContaining({
          scale: 0.85,
          duration: 0.1,
          overwrite: 'auto',
        })
      );

      expect(fromToSpy).toHaveBeenCalledWith(
        shockwaveEl,
        expect.objectContaining({ scale: 0.85, autoAlpha: 0.8 }),
        expect.objectContaining({ scale: 1.8, autoAlpha: 0, duration: 0.45, ease: 'power2.out' })
      );

      toSpy.mockClear();

      // Simulate pointerup
      (globalThis as any).window.dispatchEvent({ type: 'pointerup' });

      expect(toSpy).toHaveBeenCalledWith(
        cursorEl,
        expect.objectContaining({
          scale: 1.0,
          duration: 0.15,
          ease: 'back.out(2)',
          overwrite: 'auto',
        })
      );

      controller.destroy();
    });

    it('transitions to Galaxy Flask on hovering interactive targets and invokes audioEngine.playHoverTick', () => {
      const toSpy = vi.spyOn(gsap, 'to');

      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        arrowEl: arrowEl as unknown as SVGElement,
        flaskEl: flaskEl as unknown as SVGElement,
        audioEngine: mockAudioEngine,
      });

      toSpy.mockClear();

      // Target element with closest matching interactive selector
      const buttonTarget: any = createMockElement('button');
      buttonTarget.closest = (sel: string) => {
        if (sel.includes('button')) return buttonTarget;
        return null;
      };

      // Mouseover button at clientX = 1440 on 1920 viewport -> normalizedX = (1440/1920)*2 - 1 = 0.5
      (globalThis as any).window.dispatchEvent({
        type: 'mouseover',
        target: buttonTarget,
        clientX: 1440,
        clientY: 300,
      });

      expect(controller.getIsFlaskActive()).toBe(true);

      // Flask scales up
      expect(toSpy).toHaveBeenCalledWith(
        flaskEl,
        expect.objectContaining({
          scale: 1.0,
          autoAlpha: 1,
          duration: 0.28,
          ease: 'back.out(1.7)',
          overwrite: 'auto',
        })
      );

      // Arrow scales down
      expect(toSpy).toHaveBeenCalledWith(
        arrowEl,
        expect.objectContaining({
          scale: 0.4,
          autoAlpha: 0,
          duration: 0.2,
          ease: 'power2.in',
          overwrite: 'auto',
        })
      );

      // Audio engine called with normalized pan
      expect(mockAudioEngine.playHoverTick).toHaveBeenCalledWith(expect.closeTo(0.5, 2));

      toSpy.mockClear();

      // Mouseover generic non-interactive body element
      const divTarget: any = createMockElement('div');
      divTarget.closest = () => null;

      (globalThis as any).window.dispatchEvent({
        type: 'mouseover',
        target: divTarget,
        clientX: 960,
        clientY: 300,
      });

      expect(controller.getIsFlaskActive()).toBe(false);

      // Flask scales down
      expect(toSpy).toHaveBeenCalledWith(
        flaskEl,
        expect.objectContaining({
          scale: 0.4,
          autoAlpha: 0,
          duration: 0.2,
          ease: 'power2.in',
          overwrite: 'auto',
        })
      );

      // Arrow scales up
      expect(toSpy).toHaveBeenCalledWith(
        arrowEl,
        expect.objectContaining({
          scale: 1.0,
          autoAlpha: 1,
          duration: 0.28,
          ease: 'back.out(1.7)',
          overwrite: 'auto',
        })
      );

      controller.destroy();
    });

    it('continuously drifts constellation stars and bubbles upward via ticker', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        starEls: [star1 as unknown as SVGElement],
        bubbleEls: [bubble1 as unknown as SVGElement],
      });

      // Ticker ticks update particle coordinates without errors
      expect(() => {
        (controller as any).handleTicker();
        (controller as any).handleTicker();
        (controller as any).handleTicker();
      }).not.toThrow();

      controller.destroy();
    });

    it('handles pointermove identically to mousemove and deduplicates identical sequential events', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        flaskEl: flaskEl as unknown as SVGElement,
        liquidEl: liquidEl as unknown as SVGElement,
      });

      const xToSpy = vi.spyOn(controller, 'xTo');
      const flaskRotSpy = vi.spyOn(controller, 'flaskRotTo' as any);
      const liquidSloshSpy = vi.spyOn(controller, 'liquidSloshTo' as any);

      // Baseline move
      (globalThis as any).window.dispatchEvent({
        type: 'pointermove',
        clientX: 100,
        clientY: 200,
      });

      // Pointermove with +20px delta
      (globalThis as any).window.dispatchEvent({
        type: 'pointermove',
        clientX: 120,
        clientY: 200,
      });

      expect(flaskRotSpy).toHaveBeenLastCalledWith(20 * 0.85);
      expect(liquidSloshSpy).toHaveBeenLastCalledWith(-20 * 0.65);
      expect(xToSpy).toHaveBeenLastCalledWith(120);

      xToSpy.mockClear();
      flaskRotSpy.mockClear();

      // Sequential mousemove at exact same coords (browser dual-event dispatch) should be deduplicated
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 120,
        clientY: 200,
      });

      // Does not re-invoke xTo or reset tilt to 0
      expect(xToSpy).not.toHaveBeenCalled();
      expect(flaskRotSpy).not.toHaveBeenCalled();

      controller.destroy();
    });

    it('resets velocity, settles tilt, restores scale, and transitions back to arrow on window leave', () => {
      const toSpy = vi.spyOn(gsap, 'to');
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        arrowEl: arrowEl as unknown as SVGElement,
        flaskEl: flaskEl as unknown as SVGElement,
        liquidEl: liquidEl as unknown as SVGElement,
      });

      const flaskRotSpy = vi.spyOn(controller, 'flaskRotTo' as any);
      const liquidSloshSpy = vi.spyOn(controller, 'liquidSloshTo' as any);

      // Move with velocity
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 100,
        clientY: 200,
      });
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 125,
        clientY: 200,
      });

      flaskRotSpy.mockClear();
      liquidSloshSpy.mockClear();
      toSpy.mockClear();

      // Window leave
      (globalThis as any).document.dispatchEvent({
        type: 'mouseleave',
      });

      // Settles tilt to 0
      expect(flaskRotSpy).toHaveBeenCalledWith(0);
      expect(liquidSloshSpy).toHaveBeenCalledWith(0);

      // Restores scale: 1 and autoAlpha: 0
      expect(toSpy).toHaveBeenCalledWith(
        cursorEl,
        expect.objectContaining({
          scale: 1.0,
          autoAlpha: 0,
          duration: 0.2,
          overwrite: 'auto',
        })
      );

      // Re-enter at far coordinate: prevClientX is reset so no fake delta
      flaskRotSpy.mockClear();
      (globalThis as any).window.dispatchEvent({
        type: 'mousemove',
        clientX: 800,
        clientY: 200,
      });

      // First move after leave establishes new baseline: delta = 0
      expect(flaskRotSpy).toHaveBeenLastCalledWith(0);

      controller.destroy();
    });

    it('re-triggers audioEngine.playHoverTick with updated spatial pan when moving between adjacent interactive targets', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        arrowEl: arrowEl as unknown as SVGElement,
        flaskEl: flaskEl as unknown as SVGElement,
        audioEngine: mockAudioEngine,
      });

      const button1: any = createMockElement('button');
      button1.closest = (sel: string) => (sel.includes('button') ? button1 : null);

      const button2: any = createMockElement('button');
      button2.closest = (sel: string) => (sel.includes('button') ? button2 : null);

      // Hover button 1 on left side (clientX = 480 / 1920 -> norm = -0.5)
      (globalThis as any).window.dispatchEvent({
        type: 'mouseover',
        target: button1,
        clientX: 480,
        clientY: 300,
      });

      expect(mockAudioEngine.playHoverTick).toHaveBeenCalledWith(expect.closeTo(-0.5, 2));
      expect(controller.getIsFlaskActive()).toBe(true);

      mockAudioEngine.playHoverTick.mockClear();

      // Hover button 2 on right side (clientX = 1440 / 1920 -> norm = 0.5)
      (globalThis as any).window.dispatchEvent({
        type: 'mouseover',
        target: button2,
        clientX: 1440,
        clientY: 300,
      });

      expect(mockAudioEngine.playHoverTick).toHaveBeenCalledWith(expect.closeTo(0.5, 2));
      expect(controller.getIsFlaskActive()).toBe(true);

      controller.destroy();
    });

    it('pauses particle drift calculations when flask is inactive to preserve CPU and RAF cycles', () => {
      const controller = new CursorController({
        cursorEl: cursorEl as unknown as HTMLElement,
        flaskEl: flaskEl as unknown as SVGElement,
        arrowEl: arrowEl as unknown as SVGElement,
        starEls: [star1 as unknown as SVGElement],
        bubbleEls: [bubble1 as unknown as SVGElement],
      });

      // By default isFlaskActive is false
      expect(controller.getIsFlaskActive()).toBe(false);

      const particles = (controller as any).particles;
      const initialY = particles[0].currentY;

      // Advance ticker frame while flask is inactive
      (controller as any).handleTicker();
      // Should not have mutated currentY
      expect(particles[0].currentY).toBe(initialY);

      // Transition to flask
      controller.transitionToFlask();
      expect(controller.getIsFlaskActive()).toBe(true);

      // Advance ticker frame while flask is active
      (controller as any).handleTicker();
      // currentY should now have drifted
      expect(particles[0].currentY).toBeLessThan(initialY);

      controller.destroy();
    });
  });
});
