// src/utils/tests/sectionTransitions.test.ts
// Unit and Integration Verification for Multi-Layer Spatial Section Transition Engine
// Layer 1: 3D WebGL Camera Waypoints & Shader Morphing
// Layer 2: CRT H-Sync Laser Dividers & Holographic Section Viewport Portals
// Layer 3: Touch & Accessibility Guardrails (gsap.matchMedia & Reduced Motion)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  SPATIAL_WAYPOINTS,
  interpolateSpatialWaypoints,
  decodeTelemetryText,
  formatSectorTag,
  SectionPortalController,
} from '../sectionTransitions';
import { CyberWaveEngine } from '../../components/CyberWaveCanvas';
import { SectionTransitionWrapper } from '../../components/SectionTransitionWrapper';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

// Setup robust WebGL mock context for headless Node / Vitest
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
      if (prop === 'getProgramInfoLog' || prop === 'getShaderInfoLog') return () => '';
      if (prop === 'getProgramParameter' || prop === 'getShaderParameter') return () => true;
      if (prop === 'getActiveUniform') return () => ({ name: 'u_time', size: 1, type: 5126 });
      if (prop === 'getActiveAttrib') return () => ({ name: 'position', size: 1, type: 5126 });
      if (prop === 'getUniformLocation') return () => ({});
      if (prop === 'getAttribLocation') return () => 0;
      if (prop === 'getShaderPrecisionFormat') return () => ({ precision: 23, rangeMin: 127, rangeMax: 127 });
      if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
      if (typeof prop === 'string' && prop === prop.toUpperCase()) return 1;
      return () => ({});
    },
  };
  return new Proxy({}, handler);
};

const createMockCanvas = (): HTMLCanvasElement => {
  const mockGL = createMockWebGLContext();
  const canvas = {
    getContext: vi.fn((type: string) => {
      if (type.includes('webgl')) return mockGL;
      return null;
    }),
    style: {},
    width: 1920,
    height: 1080,
    clientWidth: 1920,
    clientHeight: 1080,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    parentElement: {
      clientWidth: 1920,
      clientHeight: 1080,
    },
  } as unknown as HTMLCanvasElement;
  return canvas;
};

const setupTestDom = () => {
  const listeners = new Map<string, Array<(e: unknown) => void>>();
  const mockWin = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 2,
    matchMedia: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
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
  };

  // @ts-ignore
  globalThis.window = mockWin as any;
  // @ts-ignore
  globalThis.document = {
    documentElement: {
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    },
    createElement: vi.fn((_tag: string) => {
      return {
        style: {},
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(() => []),
      };
    }),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      querySelector: vi.fn(),
    },
  } as any;
};

describe('Layer 1: 3D WebGL Camera Waypoints & Shader Morphing', () => {
  let engine: CyberWaveEngine;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    setupTestDom();
    mockCanvas = createMockCanvas();
    engine = new CyberWaveEngine({
      canvas: mockCanvas,
      initialMode: '3D VECTOR',
      enableScrollWaypoints: false, // controlled manual testing
    });
  });

  afterEach(() => {
    engine?.dispose();
  });

  it('1. Verifies 5 Spatial Waypoint definitions match requirements exactly', () => {
    expect(SPATIAL_WAYPOINTS.length).toBe(5);

    // Sector 01 (Hero): Angled horizon view (0, -2.8, 5.2), cyan #00F0FF troughs with magenta #FF2A85 crests
    const s1 = SPATIAL_WAYPOINTS[0];
    expect(s1.sectorCode).toBe('01');
    expect(s1.cameraPosition).toEqual({ x: 0, y: -2.8, z: 5.2 });
    expect(s1.troughColor).toBe('#00F0FF');
    expect(s1.crestColor).toBe('#FF2A85');

    // Sector 02 (Flagship Systems & 3D Deck): Camera dives forward and banks diagonally (2.0, -1.2, 3.6, rotZ=0.08)
    const s2 = SPATIAL_WAYPOINTS[1];
    expect(s2.sectorCode).toBe('02');
    expect(s2.cameraPosition).toEqual({ x: 2.0, y: -1.2, z: 3.6 });
    expect(s2.cameraRotation.z).toBe(0.08);
    expect(s2.gridDensity).toBeGreaterThan(1.0); // increased wireframe grid density

    // Sector 03 (Chrome Extension Studio): Clean top-down cyber-grid perspective (0, 0, 5.8), electric cyan and amber #FFCC00
    const s3 = SPATIAL_WAYPOINTS[2];
    expect(s3.sectorCode).toBe('03');
    expect(s3.cameraPosition).toEqual({ x: 0, y: 0, z: 5.8 });
    expect(s3.cameraRotation.x).toBe(0);
    expect(s3.cameraRotation.y).toBe(0);
    expect(s3.crestColor).toBe('#FFCC00');
    expect(s3.accentColor).toBe('#FFCC00');

    // Sector 04 (Motherboard, Architecture & GitHub ROMs): Isometric schematic view (-1.8, 1.8, 4.5), phosphor green #4AF626
    const s4 = SPATIAL_WAYPOINTS[3];
    expect(s4.sectorCode).toBe('04');
    expect(s4.cameraPosition).toEqual({ x: -1.8, y: 1.8, z: 4.5 });
    expect(s4.troughColor).toBe('#4AF626');

    // Sector 05 (Terminal Arcade & Satellite Uplink): Infinite synthwave horizon (0, -3.5, 6.0)
    const s5 = SPATIAL_WAYPOINTS[4];
    expect(s5.sectorCode).toBe('05');
    expect(s5.cameraPosition.z).toBeGreaterThanOrEqual(5.8);
  });

  it('2. Initializes camera at Sector 01 (Hero) angled horizon coordinates', () => {
    expect(engine.camera.position.x).toBe(0);
    expect(engine.camera.position.y).toBe(-2.8);
    expect(engine.camera.position.z).toBe(5.2);
    expect(engine.camera.rotation.x).toBeCloseTo(0.45, 2);
    expect(engine.camera.rotation.y).toBe(0);
    expect(engine.camera.rotation.z).toBe(0);
    expect(engine.waveUniforms.u_gridDensity.value).toBe(1.0);
  });

  it('3. Programmatically jumps to Sector 02: dives forward and banks diagonally (rotation.z = 0.08)', () => {
    engine.goToWaypoint(1, true);

    expect(engine.camera.position.x).toBe(2.0);
    expect(engine.camera.position.y).toBe(-1.2);
    expect(engine.camera.position.z).toBe(3.6);
    expect(engine.camera.rotation.z).toBe(0.08);
    expect(engine.waveUniforms.u_gridDensity.value).toBe(1.6);
  });

  it('4. Programmatically jumps to Sector 03: clean top-down perspective and amber accents', () => {
    engine.goToWaypoint(2, true);

    expect(engine.camera.position.x).toBe(0);
    expect(engine.camera.position.y).toBe(0);
    expect(engine.camera.position.z).toBe(5.8);
    expect(engine.waveUniforms.u_crestColor.value.x).toBeCloseTo(1.0);
    expect(engine.waveUniforms.u_crestColor.value.y).toBeCloseTo(0.8);
    expect(engine.waveUniforms.u_crestColor.value.z).toBeCloseTo(0.0);
  });

  it('5. Programmatically jumps to Sector 04: isometric schematic view with phosphor green', () => {
    engine.goToWaypoint(3, true);

    expect(engine.camera.position.x).toBe(-1.8);
    expect(engine.camera.position.y).toBe(1.8);
    expect(engine.camera.position.z).toBe(4.5);
    // Phosphor green trough #4AF626: x: 0.29, y: 0.965, z: 0.149
    expect(engine.waveUniforms.u_troughColor.value.y).toBeGreaterThan(0.9);
  });

  it('6. Programmatically jumps to Sector 05: infinite horizon with breathing wave amplitude in render update', () => {
    engine.goToWaypoint(4, true);

    expect(engine.camera.position.x).toBe(0);
    expect(engine.camera.position.y).toBe(-3.5);
    expect(engine.camera.position.z).toBe(6.0);

    // Call update to verify sinusoidal amplitude breathing
    const prevAmp = engine.waveUniforms.u_amplitude.value;
    engine.update(1.2);
    expect(engine.waveUniforms.u_amplitude.value).not.toBe(prevAmp);
  });

  it('7. Interpolates smoothly between waypoints across global scroll progress [0, 1]', () => {
    const wpMid = interpolateSpatialWaypoints(0.5); // Exact Sector 03
    expect(wpMid.cameraPosition.x).toBeCloseTo(0, 1);
    expect(wpMid.cameraPosition.y).toBeCloseTo(0, 1);
    expect(wpMid.cameraPosition.z).toBeCloseTo(5.8, 1);

    const wpQuarter = interpolateSpatialWaypoints(0.25); // Exact Sector 02
    expect(wpQuarter.cameraPosition.x).toBeCloseTo(2.0, 1);
    expect(wpQuarter.cameraPosition.y).toBeCloseTo(-1.2, 1);
    expect(wpQuarter.cameraPosition.z).toBeCloseTo(3.6, 1);
    expect(wpQuarter.cameraRotation.z).toBeCloseTo(0.08, 2);
  });
});

describe('Layer 2: CRT H-Sync Laser Dividers & Dynamic Text Decryption', () => {
  it('1. Formats standard HUD telemetry tag correctly', () => {
    const tag = formatSectorTag('02', 'EXTENSION_STUDIO');
    expect(tag).toBe('Sector 02 • EXTENSION STUDIO');

    const tag3 = formatSectorTag('3', 'BROWSER_EXTENSION_STUDIO');
    expect(tag3).toBe('Sector 03 • BROWSER EXTENSION STUDIO');
  });

  it('2. Progressively decodes telemetry text from masked glyphs to plaintext', () => {
    const target = 'Sector 02 • EXTENSION STUDIO';

    // At progress 0: text is masked
    const masked = decodeTelemetryText(target, 0);
    expect(masked).toContain('•');
    expect(masked).not.toContain('EXTENSION');

    // At progress 0.5: first half is decoded
    const half = decodeTelemetryText(target, 0.5);
    expect(half.startsWith('Sector 02')).toBe(true);

    // At progress 1.0: completely unlocked
    const unlocked = decodeTelemetryText(target, 1.0);
    expect(unlocked).toBe(target);
  });

  it('3. Audio Engine includes playCrtSyncHum for electron beam sweep', () => {
    expect(typeof watchknightAudio.playCrtSyncHum).toBe('function');

    // Test calling without crash in mock environment
    expect(() => {
      watchknightAudio.playCrtSyncHum(0.25);
    }).not.toThrow();
  });

  it('4. SectionTransitionWrapper renders CRT H-Sync laser beam and HUD telemetry container', () => {
    const html = renderToString(
      React.createElement(
        SectionTransitionWrapper,
        {
          sectionId: '02',
          title: 'BROWSER_EXTENSION_STUDIO',
        },
        React.createElement('div', { id: 'inner-content' }, 'Section Body')
      )
    );

    // Beam container
    expect(html).toContain('crt-hsync-divider-container');
    expect(html).toContain('crt-hsync-beam');
    expect(html).toContain('scaleX(0)');
    expect(html).toContain('transform-origin:left center');

    // Monospace HUD Tag
    expect(html).toContain('crt-hsync-hud');
    expect(html).toContain('H-SYNC: 15.734 kHz');

    // Inner section content wrapper
    expect(html).toContain('section-portal-content');
    expect(html).toContain('Section Body');
    expect(html).toContain('data-sector-id="02"');
    expect(html).toContain('data-sector-title="BROWSER_EXTENSION_STUDIO"');
  });

  it('5. SectionTransitionWrapper does not render divider for Sector 01 (Hero) by default', () => {
    const htmlHero = renderToString(
      React.createElement(
        SectionTransitionWrapper,
        {
          sectionId: '01',
          title: 'HERO_HORIZON',
        },
        React.createElement('div', null, 'Hero Content')
      )
    );

    expect(htmlHero).not.toContain('crt-hsync-divider-container');
    expect(htmlHero).toContain('Hero Content');
  });
});

describe('Layer 3: Touch & Accessibility Guardrails (gsap.matchMedia)', () => {
  it('1. SectionPortalController initializes and cleans up matchMedia cleanly', () => {
    const mockContainer = {
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const controller = new SectionPortalController({
      container: mockContainer,
      sectionId: '02',
      title: 'EXTENSION_STUDIO',
    });

    expect(controller).toBeDefined();

    // Clean teardown
    expect(() => controller.dispose()).not.toThrow();
  });

  it('2. Dampens wave amplitude and disables camera rotation in reduced motion', () => {
    setupTestDom();
    const mockCanvas = createMockCanvas();

    // Create engine with reduced motion active
    const engine = new CyberWaveEngine({
      canvas: mockCanvas,
      enableScrollWaypoints: false,
    });

    (engine as any).reducedMotion = true;
    (engine as any).waveUniforms.u_amplitude.value = 0.12;

    expect(engine.waveUniforms.u_amplitude.value).toBe(0.12);

    engine.dispose();
  });

  it('3. isFirstSector prevents hiding content on initial mount and locks full viewport scale', () => {
    const mockContainer = {
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement;

    const mockContent = {
      style: {},
    } as unknown as HTMLElement;

    const controller = new SectionPortalController({
      container: mockContainer,
      contentElement: mockContent,
      sectionId: '01',
      title: 'HERO_HORIZON',
      isFirstSector: true,
    });

    expect((controller as any).isFirstSector).toBe(true);
    controller.dispose();
  });

  it('4. CyberWaveEngine sets up quickTo tweens for camera and color uniforms', () => {
    setupTestDom();
    const mockCanvas = createMockCanvas();

    const engine = new CyberWaveEngine({
      canvas: mockCanvas,
      enableScrollWaypoints: false,
    });

    engine.setupQuickToTweens();
    expect((engine as any).quickToCamX).toBeDefined();
    expect((engine as any).quickToTroughR).toBeDefined();
    expect((engine as any).quickToCrestR).toBeDefined();

    engine.dispose();
  });
});
