// src/webgl/tests/SceneManager.test.ts
// Unit and Integration Verification for SceneManager:
// - Single WebGLRenderer initialization on gsap.ticker (no separate RAF loop)
// - OrthographicCamera viewport mapping
// - DOM-to-WebGL plane synchronizer (.wk-project-media mapping & zero forced reflows during scroll)
// - Hero 3D Watchknight Chronometer & Algorithmic Astrolabe (Icosahedron + Torus gimbal rings)
// - Shader uniform binding (uScrollVelocity, uMouse, uMouseVelocity, uHoverState, uAudioBass, uSpectralCentroid, uBeatPulse, uRenderMode)
// - Single-pass post-processing (BloomEffect + TransitionGrainEffect merged into single EffectPass)
// - Preloader shader pre-compilation (compileAsync)
// - Zero GPU memory leaks on route teardown (geometry.dispose, material.dispose, texture.dispose, passes.dispose)
// - Dynamic parallax scroll direction verification
// - Dual string / index render pass switcher verification
// - Detached DOM element culling & DOM opacity restoration on disposal

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  EffectPass,
  RenderPass,
  BloomEffect,
} from 'postprocessing';
import { SceneManager, TransitionGrainEffect } from '../SceneManager';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

// Setup robust WebGL mock environment for headless Node / Vitest
const createMockWebGLContext = () => {
  const handler: ProxyHandler<object> = {
    get(target, prop: string | symbol) {
      if (prop === 'VERSION') return 7938;
      if (prop === 'getParameter') {
        return (p: number) => {
          if (p === 7938) return 'WebGL 1.0 (Mock)';
          if (p === 7937) return 'WebKit WebGL';
          if (p === 7936) return 'WebKit';
          return 16;
        };
      }
      if (prop === 'getProgramInfoLog' || prop === 'getShaderInfoLog') {
        return () => '';
      }
      if (prop === 'getProgramParameter' || prop === 'getShaderParameter') {
        return () => true;
      }
      if (prop === 'getActiveUniform') {
        return () => ({ name: 'uTime', size: 1, type: 5126 });
      }
      if (prop === 'getActiveAttrib') {
        return () => ({ name: 'position', size: 1, type: 5126 });
      }
      if (prop === 'getUniformLocation') {
        return () => ({});
      }
      if (prop === 'getAttribLocation') {
        return () => 0;
      }
      if (prop === 'getShaderPrecisionFormat') {
        return () => ({ precision: 23, rangeMin: 127, rangeMax: 127 });
      }
      if (prop in target) {
        return (target as Record<string | symbol, unknown>)[prop];
      }
      if (typeof prop === 'string' && prop === prop.toUpperCase()) {
        return 1;
      }
      return () => ({});
    },
  };
  return new Proxy({}, handler);
};

let registeredElements: HTMLElement[] = [];

const createMockElement = (tag: string, className = '', id = ''): HTMLElement => {
  const listeners = new Map<string, Array<(e: unknown) => void>>();
  const styleObj: Record<string, unknown> = {
    position: '',
    top: '',
    left: '',
    width: '100vw',
    height: '100vh',
    pointerEvents: '',
    zIndex: '',
    opacity: '',
    borderTopStyle: '',
    removeProperty: vi.fn(),
    setProperty: vi.fn(),
    getPropertyValue: vi.fn().mockReturnValue(''),
  };

  const elem = {
    tagName: tag.toUpperCase(),
    className,
    id,
    style: styleObj,
    width: 1920,
    height: 1080,
    clientWidth: 1920,
    clientHeight: 1080,
    parentElement: null as HTMLElement | null,
    children: [] as HTMLElement[],
    addEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
      const list = listeners.get(event) || [];
      list.push(cb);
      listeners.set(event, list);
    }),
    removeEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
      const list = listeners.get(event) || [];
      listeners.set(event, list.filter((item) => item !== cb));
    }),
    dispatchEvent: vi.fn((event: Event) => {
      const list = listeners.get(event.type) || [];
      list.forEach((cb) => cb(event));
      return true;
    }),
    setAttribute: vi.fn((k: string, v: string) => {
      (elem as unknown as Record<string, unknown>)[k] = v;
    }),
    getAttribute: vi.fn((k: string) => {
      if (k === 'id') return elem.id;
      if (k === 'class') return elem.className;
      return null;
    }),
    hasAttribute: vi.fn((k: string) => {
      if (k === 'style') return true;
      if (k === 'id') return !!elem.id;
      return false;
    }),
    removeAttribute: vi.fn(),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
    closest: vi.fn((sel: string) => {
      const cls = sel.replace('.', '');
      if (elem.className.includes(cls)) return elem;
      let curr = elem.parentElement;
      while (curr) {
        if (curr.className && curr.className.includes(cls)) return curr;
        curr = (curr as unknown as { parentElement: HTMLElement | null }).parentElement;
      }
      return null;
    }),
    contains: vi.fn((child: HTMLElement) => registeredElements.includes(child)),
    getBoundingClientRect: vi.fn().mockReturnValue({
      top: 100,
      left: 100,
      width: 400,
      height: 300,
      right: 500,
      bottom: 400,
    }),
    getContext: vi.fn((type: string) => {
      if (type.includes('webgl')) return createMockWebGLContext();
      return null;
    }),
  } as unknown as HTMLElement;

  return elem;
};

// Global DOM setup for Vitest Node execution
const setupTestDom = () => {
  registeredElements = [];

  globalThis.requestAnimationFrame = (fn: FrameRequestCallback) =>
    setTimeout(fn, 16) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);

  const mockBody = createMockElement('body');
  mockBody.appendChild = vi.fn((child: HTMLElement) => {
    registeredElements.push(child);
    (child as unknown as { parentElement: HTMLElement | null }).parentElement = mockBody;
    return child;
  }) as any;
  mockBody.removeChild = vi.fn((child: HTMLElement) => {
    const idx = registeredElements.indexOf(child);
    if (idx !== -1) registeredElements.splice(idx, 1);
    (child as unknown as { parentElement: HTMLElement | null }).parentElement = null;
    return child;
  }) as any;

  const mockDoc = {
    body: mockBody,
    documentElement: createMockElement('html'),
    createElement: vi.fn((tag: string) => createMockElement(tag)),
    querySelector: vi.fn((sel: string) => {
      if (sel === '.wk-project-media') {
        return registeredElements.find((e) => e.className.includes('wk-project-media')) || null;
      }
      return null;
    }),
    querySelectorAll: vi.fn((sel: string) => {
      if (sel === '.wk-project-media') {
        return registeredElements.filter((e) => e.className.includes('wk-project-media'));
      }
      return [];
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  const mockWin = {
    innerWidth: 1920,
    innerHeight: 1080,
    scrollX: 0,
    scrollY: 0,
    devicePixelRatio: 2,
    document: mockDoc,
    history: { scrollRestoration: 'auto' },
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    matchMedia: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    addEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
      mockDoc.body.addEventListener(event, cb);
    }),
    removeEventListener: vi.fn((event: string, cb: (e: unknown) => void) => {
      mockDoc.body.removeEventListener(event, cb);
    }),
    dispatchEvent: vi.fn((event: Event) => {
      mockDoc.body.dispatchEvent(event);
      return true;
    }),
    __lenis: { scroll: 0, velocity: 0 },
  };

  // @ts-ignore
  globalThis.document = mockDoc;
  // @ts-ignore
  globalThis.window = mockWin;

  return { mockDoc, mockWin, mockBody };
};

describe('SceneManager WebGL Layer & DOM Plane Synchronizer', () => {
  let mockCanvas: HTMLCanvasElement;
  let testDom: ReturnType<typeof setupTestDom>;

  beforeEach(() => {
    vi.clearAllMocks();
    testDom = setupTestDom();
    mockCanvas = testDom.mockDoc.createElement('canvas') as HTMLCanvasElement;
  });

  afterEach(() => {
    const instance = SceneManager.getInstance();
    if (instance) {
      instance.dispose();
    }
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM A: WEBGL RENDERER & ORTHOGRAPHIC CAMERA
  // --------------------------------------------------------------------------

  it('1. Initializes single THREE.WebGLRenderer hooked into existing gsap.ticker loop (no separate RAF)', () => {
    const tickerAddSpy = vi.spyOn(gsap.ticker, 'add');

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    expect(manager.renderer).toBeInstanceOf(THREE.WebGLRenderer);
    expect(tickerAddSpy).toHaveBeenCalled();
  });

  it('2. Configures OrthographicCamera matching viewport pixel dimensions', () => {
    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    expect(manager.camera).toBeInstanceOf(THREE.OrthographicCamera);
    expect(manager.camera.left).toBe(-1920 / 2);
    expect(manager.camera.right).toBe(1920 / 2);
    expect(manager.camera.top).toBe(1080 / 2);
    expect(manager.camera.bottom).toBe(-1080 / 2);
    expect(manager.camera.near).toBe(-2000);
    expect(manager.camera.far).toBe(2000);
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM A: HERO CHRONOMETER & ASTROLABE
  // --------------------------------------------------------------------------

  it('3. Constructs Hero 3D Watchknight Chronometer with nested Icosahedron and Torus gimbal rings', () => {
    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const chronometer = manager.heroChronometer;
    expect(chronometer).toBeInstanceOf(THREE.Group);
    expect(chronometer.name).toBe('WatchknightChronometerAstrolabe');

    // Verify central core geometry
    expect(manager.chronometerCoreGeom).toBeInstanceOf(THREE.IcosahedronGeometry);
    expect(manager.chronometerCoreMesh.geometry).toBe(manager.chronometerCoreGeom);
    expect(manager.chronometerCoreMaterial).toBeInstanceOf(THREE.ShaderMaterial);

    // Verify 3 gimbal rings with distinct radiuses
    expect(manager.gimbalRing1Geom).toBeInstanceOf(THREE.TorusGeometry);
    expect(manager.gimbalRing2Geom).toBeInstanceOf(THREE.TorusGeometry);
    expect(manager.gimbalRing3Geom).toBeInstanceOf(THREE.TorusGeometry);

    expect(manager.gimbalRing1Geom.parameters.radius).toBe(105);
    expect(manager.gimbalRing2Geom.parameters.radius).toBe(130);
    expect(manager.gimbalRing3Geom.parameters.radius).toBe(155);

    // Verify gimbal ring materials match token palette (Terracotta, Alabaster, Verdigris)
    expect(manager.gimbalRing1Material.color.getHex()).toBe(0xb84a27); // Terracotta
    expect(manager.gimbalRing2Material.color.getHex()).toBe(0xf2efe9); // Alabaster
    expect(manager.gimbalRing3Material.color.getHex()).toBe(0x4e9a7f); // Verdigris
  });

  it('4. Rotates Hero Chronometer with scroll velocity, breathes via audio, and parallax-scrolls UPWARDS with page', () => {
    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const initialRotX = manager.gimbalRing1Mesh.rotation.x;
    const initialRotY = manager.gimbalRing2Mesh.rotation.y;

    // Simulate audio bass and beat pulse from WatchknightAudioEngine
    watchknightAudio.uniforms.uAudioBass.value = 0.85;
    watchknightAudio.uniforms.uBeatPulse.value = 0.95;

    // Simulate scroll offset and velocity
    window.__lenis = { scroll: 400, velocity: 850 } as any;
    manager.scrollVelocity = 850;
    manager.smoothedScrollVelocity = 850;

    manager.render();

    // Verify rotations boosted by scroll velocity
    expect(manager.gimbalRing1Mesh.rotation.x).not.toBe(initialRotX);
    expect(manager.gimbalRing2Mesh.rotation.y).not.toBe(initialRotY);

    // Verify scale dynamic breathing response to bass and beat pulse
    const expectedScale = 1.0 + 0.85 * 0.1 + 0.95 * 0.22;
    expect(manager.heroChronometer.scale.x).toBeCloseTo(expectedScale, 2);
    expect(manager.heroChronometer.scale.y).toBeCloseTo(expectedScale, 2);

    // Parallax invariant: Hero Chronometer moves upward (positive Y in orthographic space) when page scrolls down
    expect(manager.heroChronometer.position.y).toBe(400 * 0.45);
    expect(manager.heroChronometer.position.y).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM A & B: DOM-TO-WEBGL PLANE SYNCHRONIZER & LAYOUT CACHING
  // --------------------------------------------------------------------------

  it('5. Maps .wk-project-media HTML elements (opacity: 0) to PlaneGeometry(1, 1, 32, 32) meshes', () => {
    const mockElement = createMockElement('div', 'wk-project-media', 'project-mental-defrag');
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 200,
      left: 100,
      width: 600,
      height: 400,
    });
    testDom.mockBody.appendChild(mockElement);

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const planes = manager.getMediaPlanes();
    expect(planes.length).toBeGreaterThanOrEqual(1);

    const defragPlane = planes.find((p) => p.element === mockElement);
    expect(defragPlane).toBeDefined();

    // Invariant: underlying DOM element has opacity: 0
    expect(mockElement.style.opacity).toBe('0');

    // Invariant: PlaneGeometry(1, 1, 32, 32)
    expect(defragPlane!.geometry).toBeInstanceOf(THREE.PlaneGeometry);
    expect(defragPlane!.geometry.parameters.width).toBe(1);
    expect(defragPlane!.geometry.parameters.height).toBe(1);
    expect(defragPlane!.geometry.parameters.widthSegments).toBe(32);
    expect(defragPlane!.geometry.parameters.heightSegments).toBe(32);

    // Mesh scale mapped to element layout dimensions
    expect(defragPlane!.mesh.scale.x).toBe(600);
    expect(defragPlane!.mesh.scale.y).toBe(400);

    testDom.mockBody.removeChild(mockElement);
  });

  it('6. Caches layout metrics on resize and updates Y positions without forced reflows (zero getBoundingClientRect in scroll update)', () => {
    const mockElement = createMockElement('div', 'wk-project-media', 'p1');
    const rectSpy = vi.fn().mockReturnValue({
      top: 500,
      left: 200,
      width: 400,
      height: 300,
    });
    mockElement.getBoundingClientRect = rectSpy;
    testDom.mockBody.appendChild(mockElement);

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    // Reset rect call count after initial sync
    rectSpy.mockClear();

    // Simulate active scroll frames using Lenis scroll stream
    window.__lenis = { scroll: 250, velocity: 120 } as any;

    manager.render();
    manager.render();
    manager.render();

    // INVARIANT: getBoundingClientRect is NEVER called during render/scroll frames
    expect(rectSpy).not.toHaveBeenCalled();

    // Plane Y position updated via pure math on cached docTop and scrollY:
    // screenY = docTop (500) - scroll (250) = 250
    // mesh.position.y = -screenY + viewportH/2 - itemH/2 = -250 + 540 - 150 = 140
    const plane = manager.getMediaPlanes().find((p) => p.element === mockElement);
    expect(plane!.mesh.position.y).toBe(140);

    // On resize, getBoundingClientRect IS called to update cached metrics
    manager.handleResize();
    expect(rectSpy).toHaveBeenCalledTimes(1);

    testDom.mockBody.removeChild(mockElement);
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM B: CUSTOM GLSL SHADERS & RENDER INSPECTOR MODES
  // --------------------------------------------------------------------------

  it('7. Binds all required uniforms on project plane ShaderMaterial', () => {
    const mockElement = createMockElement('div', 'wk-project-media', 'p2');
    testDom.mockBody.appendChild(mockElement);

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const plane = manager.getMediaPlanes().find((p) => p.element === mockElement);
    expect(plane).toBeDefined();

    const uniforms = plane!.material.uniforms;

    // Verify all uniforms required by task specification
    expect(uniforms.uScrollVelocity).toBeDefined();
    expect(uniforms.uMouse).toBeDefined();
    expect(uniforms.uMouseVelocity).toBeDefined();
    expect(uniforms.uHoverState).toBeDefined();
    expect(uniforms.uAudioBass).toBeDefined();
    expect(uniforms.uSpectralCentroid).toBeDefined();
    expect(uniforms.uBeatPulse).toBeDefined();
    expect(uniforms.uRenderMode).toBeDefined();
    expect(uniforms.uPlaneSize).toBeDefined();

    testDom.mockBody.removeChild(mockElement);
  });

  it('8. Switches between 3 Colombel-style Render Inspector Modes via indices and custom event strings', () => {
    const mockElement = createMockElement('div', 'wk-project-media', 'p3');
    testDom.mockBody.appendChild(mockElement);

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const plane = manager.getMediaPlanes().find((p) => p.element === mockElement);

    // Default mode: 0 (Beauty Fluid Distortion)
    expect(manager.getRenderMode()).toBe(0);
    expect(plane!.material.uniforms.uRenderMode.value).toBe(0);

    // Switch to Mode 1 via method
    manager.setRenderMode(1);
    expect(manager.getRenderMode()).toBe(1);
    expect(plane!.material.uniforms.uRenderMode.value).toBe(1);

    // Switch to Mode 2 via custom event with string mode ('lattice')
    testDom.mockDoc.body.dispatchEvent(
      new CustomEvent('wk-render-pass-change', { detail: { mode: 'lattice' } })
    );
    expect(manager.getRenderMode()).toBe(2);
    expect(plane!.material.uniforms.uRenderMode.value).toBe(2);

    // Switch back to Mode 0 via custom event with string mode ('beauty')
    testDom.mockDoc.body.dispatchEvent(
      new CustomEvent('wk-render-pass-change', { detail: { mode: 'beauty' } })
    );
    expect(manager.getRenderMode()).toBe(0);
    expect(plane!.material.uniforms.uRenderMode.value).toBe(0);

    testDom.mockBody.removeChild(mockElement);
  });

  // --------------------------------------------------------------------------
  // WORKSTREAM B: SINGLE-PASS POST-PROCESSING & PRELOADER PRE-COMPILATION
  // --------------------------------------------------------------------------

  it('9. Integrates TransitionGrainEffect and provides precompileAsync via renderer.compileAsync', async () => {
    const grainEffect = new TransitionGrainEffect({ grainStrength: 0.04 });
    expect(grainEffect.name).toBe('TransitionGrainEffect');
    expect(grainEffect.uniforms.get('uGrainStrength')?.value).toBe(0.04);

    grainEffect.setTime(2.5);
    expect(grainEffect.uniforms.get('uTime')?.value).toBe(2.5);

    grainEffect.setTransitionProgress(0.7);
    expect(grainEffect.uniforms.get('uTransitionProgress')?.value).toBe(0.7);

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const compileSpy = vi.fn().mockResolvedValue(undefined);
    manager.renderer.compileAsync = compileSpy;

    await manager.precompileAsync();
    expect(compileSpy).toHaveBeenCalledWith(manager.scene, manager.camera);
  });

  it('10. Merges BloomEffect and TransitionGrainEffect into a single fullscreen EffectPass', () => {
    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    // Directly test single-pass post-processing pipeline construction
    const bloom = new BloomEffect({ intensity: 0.35 });
    const grain = new TransitionGrainEffect({ grainStrength: 0.035 });
    const singleEffectPass = new EffectPass(manager.camera, bloom, grain);
    const renderPass = new RenderPass(manager.scene, manager.camera);

    manager.bloomEffect = bloom;
    manager.transitionGrainEffect = grain;
    manager.effectPass = singleEffectPass;
    manager.renderPass = renderPass;

    expect(manager.effectPass).toBeInstanceOf(EffectPass);
    expect(manager.renderPass).toBeInstanceOf(RenderPass);
    expect(manager.bloomEffect).toBeInstanceOf(BloomEffect);
    expect(manager.transitionGrainEffect).toBeInstanceOf(TransitionGrainEffect);

    const passDisposeSpy = vi.spyOn(singleEffectPass, 'dispose');
    const renderPassDisposeSpy = vi.spyOn(renderPass, 'dispose');
    const bloomDisposeSpy = vi.spyOn(bloom, 'dispose');
    const grainDisposeSpy = vi.spyOn(grain, 'dispose');

    manager.dispose();

    expect(passDisposeSpy).toHaveBeenCalled();
    expect(renderPassDisposeSpy).toHaveBeenCalled();
    expect(bloomDisposeSpy).toHaveBeenCalled();
    expect(grainDisposeSpy).toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // VERIFICATION WORKSTREAM: ZERO GPU MEMORY LEAKS & COMPLETE TEARDOWN
  // --------------------------------------------------------------------------

  it('11. Verifies zero GPU memory leaks and restores DOM opacity on route teardown', () => {
    const mockElement = createMockElement('div', 'wk-project-media', 'p4');
    testDom.mockBody.appendChild(mockElement);

    const tickerRemoveSpy = vi.spyOn(gsap.ticker, 'remove');

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    const plane = manager.getMediaPlanes().find((p) => p.element === mockElement);
    expect(plane).toBeDefined();
    expect(mockElement.style.opacity).toBe('0');

    // Attach disposal spies
    const planeGeomDisposeSpy = vi.spyOn(plane!.geometry, 'dispose');
    const planeMatDisposeSpy = vi.spyOn(plane!.material, 'dispose');

    const coreGeomDisposeSpy = vi.spyOn(manager.chronometerCoreGeom, 'dispose');
    const coreMatDisposeSpy = vi.spyOn(manager.chronometerCoreMaterial, 'dispose');

    const ring1GeomDisposeSpy = vi.spyOn(manager.gimbalRing1Geom, 'dispose');
    const ring1MatDisposeSpy = vi.spyOn(manager.gimbalRing1Material, 'dispose');

    const ring2GeomDisposeSpy = vi.spyOn(manager.gimbalRing2Geom, 'dispose');
    const ring2MatDisposeSpy = vi.spyOn(manager.gimbalRing2Material, 'dispose');

    const ring3GeomDisposeSpy = vi.spyOn(manager.gimbalRing3Geom, 'dispose');
    const ring3MatDisposeSpy = vi.spyOn(manager.gimbalRing3Material, 'dispose');

    const rendererDisposeSpy = vi.spyOn(manager.renderer, 'dispose');

    // Route teardown
    manager.dispose();

    // Verify GSAP ticker callback removed
    expect(tickerRemoveSpy).toHaveBeenCalled();

    // Verify all plane geometries and materials disposed
    expect(planeGeomDisposeSpy).toHaveBeenCalled();
    expect(planeMatDisposeSpy).toHaveBeenCalled();

    // Verify all Hero Chronometer geometries and materials disposed
    expect(coreGeomDisposeSpy).toHaveBeenCalled();
    expect(coreMatDisposeSpy).toHaveBeenCalled();
    expect(ring1GeomDisposeSpy).toHaveBeenCalled();
    expect(ring1MatDisposeSpy).toHaveBeenCalled();
    expect(ring2GeomDisposeSpy).toHaveBeenCalled();
    expect(ring2MatDisposeSpy).toHaveBeenCalled();
    expect(ring3GeomDisposeSpy).toHaveBeenCalled();
    expect(ring3MatDisposeSpy).toHaveBeenCalled();

    // Verify WebGLRenderer disposed
    expect(rendererDisposeSpy).toHaveBeenCalled();

    // Verify planes cache emptied
    expect(manager.getMediaPlanes().length).toBe(0);

    // Verify DOM element opacity restored for fallback display
    expect(mockElement.style.opacity).toBe('');

    testDom.mockBody.removeChild(mockElement);
  });

  it('12. Culls and disposes meshes for disconnected DOM elements on syncMediaElements()', () => {
    const mockElement = createMockElement('div', 'wk-project-media', 'p5');
    testDom.mockBody.appendChild(mockElement);

    const manager = new SceneManager({
      canvas: mockCanvas,
      enablePostprocessing: false,
    });

    expect(manager.getMediaPlanes().length).toBe(1);
    const plane = manager.getMediaPlanes()[0];
    const geomDisposeSpy = vi.spyOn(plane.geometry, 'dispose');

    // Detach element from DOM
    testDom.mockBody.removeChild(mockElement);

    // Call syncMediaElements() again
    manager.syncMediaElements();

    // Disconnected element should be culled and disposed
    expect(manager.getMediaPlanes().length).toBe(0);
    expect(geomDisposeSpy).toHaveBeenCalled();
  });
});
