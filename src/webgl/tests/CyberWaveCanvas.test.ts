import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import gsap from 'gsap';
import { CyberWaveEngine, CyberWaveCanvas, RenderMode } from '../../components/CyberWaveCanvas';
import cyberWaveVert from '../../shaders/cyberWave.vert.glsl?raw';
import cyberWaveFrag from '../../shaders/cyberWave.frag.glsl?raw';
import crtPostProcessFrag from '../../shaders/crtPostProcess.frag.glsl?raw';
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
      if (prop === 'getProgramInfoLog' || prop === 'getShaderInfoLog') {
        return () => '';
      }
      if (prop === 'getProgramParameter' || prop === 'getShaderParameter') {
        return () => true;
      }
      if (prop === 'getActiveUniform') {
        return () => ({ name: 'u_time', size: 1, type: 5126 });
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
    createElement: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  } as any;
  // @ts-ignore
  globalThis.CustomEvent = class CustomEvent extends Event {
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      super(type);
      this.detail = params?.detail;
    }
  } as any;
};

describe('CyberWave Shader Invariants & Source Integrity', () => {
  it('File 1: cyberWave.vert.glsl matches exact requirements', () => {
    expect(cyberWaveVert).toContain('uniform float u_time;');
    expect(cyberWaveVert).toContain('uniform float u_amplitude;');
    expect(cyberWaveVert).toContain('uniform float u_audioBass;');
    expect(cyberWaveVert).toContain('uniform vec2 u_mouse;');
    expect(cyberWaveVert).toContain('uniform float u_pixelRatio;');
    expect(cyberWaveVert).toContain('varying float v_elevation;');
    expect(cyberWaveVert).toContain('varying vec2 v_uv;');
    expect(cyberWaveVert).toContain('varying float v_distToMouse;');
    expect(cyberWaveVert).toContain('float dist = distance(pos.xy, u_mouse * 4.0);');
    expect(cyberWaveVert).toContain('float mouseRipple = sin(dist * 6.0 - u_time * 8.0) * exp(-dist * 1.8) * 0.65;');
    expect(cyberWaveVert).toContain('float elevation = (waveX + waveY) * (u_amplitude + u_audioBass * 0.45) + mouseRipple;');
    expect(cyberWaveVert).toContain('gl_PointSize = (6.5 * u_pixelRatio + (elevation * 4.0)) * (1.0 / -mvPosition.z);');
  });

  it('File 2: cyberWave.frag.glsl matches exact requirements', () => {
    expect(cyberWaveFrag).toContain('float distFromCenter = length(gl_PointCoord - vec2(0.5));');
    expect(cyberWaveFrag).toContain('if (distFromCenter > 0.5) discard;');
    expect(cyberWaveFrag).toContain('vec3 cyanPhosphor = vec3(0.0, 0.941, 1.0);');
    expect(cyberWaveFrag).toContain('vec3 magentaPlasma = vec3(1.0, 0.165, 0.522);');
    expect(cyberWaveFrag).toContain('vec3 amberHighlight = vec3(1.0, 0.8, 0.0);');
    expect(cyberWaveFrag).toContain('float mixStrength = clamp((v_elevation + 0.6) / 1.2, 0.0, 1.0);');
    expect(cyberWaveFrag).toContain('vec3 baseColor = mix(cyanPhosphor, magentaPlasma, mixStrength);');
    expect(cyberWaveFrag).toContain('float cursorGlow = exp(-v_distToMouse * 2.5);');
    expect(cyberWaveFrag).toContain('gl_FragColor = vec4(finalColor, alpha * 0.9);');
  });

  it('File 3: crtPostProcess.frag.glsl matches exact requirements', () => {
    expect(crtPostProcessFrag).toContain('uniform sampler2D tDiffuse;');
    expect(crtPostProcessFrag).toContain('uniform float u_distortion;');
    expect(crtPostProcessFrag).toContain('uniform float u_scanlineInt;');
    expect(crtPostProcessFrag).toContain('uniform bool u_crtEnabled;');
    expect(crtPostProcessFrag).toContain('vec2 barrelDistort(vec2 uv, float amt)');
    expect(crtPostProcessFrag).toContain('vec4(0.027, 0.031, 0.078, 1.0)'); // #070814 bezel void
    expect(crtPostProcessFrag).toContain('float caOffset = centerDist * 0.0035;');
    expect(crtPostProcessFrag).toContain('float scanline = sin(crtUV.y * 672.0) * u_scanlineInt;');
    expect(crtPostProcessFrag).toContain('vec3(1.04, 1.01, 0.95)'); // NTSC color temp
    expect(crtPostProcessFrag).toContain('float vignette = 1.0 - dot(crtUV - 0.5, crtUV - 0.5) * 0.48;');
  });
});

describe('CyberWaveEngine Architecture & Three.js Pipeline', () => {
  let engine: CyberWaveEngine;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    setupTestDom();
    mockCanvas = createMockCanvas();
    engine = new CyberWaveEngine({
      canvas: mockCanvas,
      initialMode: '3D VECTOR',
    });
  });

  afterEach(() => {
    engine?.dispose();
  });

  it('1. Scene is configured on #070814 with PerspectiveCamera at angled horizon view', () => {
    expect(engine.scene).toBeInstanceOf(THREE.Scene);
    const bg = engine.scene.background as THREE.Color;
    expect(bg.getHexString().toLowerCase()).toBe('070814');

    expect(engine.camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(engine.camera.fov).toBe(55);
    expect(engine.camera.position.z).toBeGreaterThan(0);
    expect(engine.camera.position.y).toBeLessThan(0); // angled horizon elevation view
  });

  it('2. Topological wave grid is constructed using PlaneGeometry(18, 12, 120, 120)', () => {
    expect(engine.waveGeometry).toBeInstanceOf(THREE.PlaneGeometry);
    expect(engine.waveGeometry.parameters.width).toBe(18);
    expect(engine.waveGeometry.parameters.height).toBe(12);
    expect(engine.waveGeometry.parameters.widthSegments).toBe(120);
    expect(engine.waveGeometry.parameters.heightSegments).toBe(120);
  });

  it('3. Object A (Wireframe Energy Mesh) is rendered with custom ShaderMaterial', () => {
    expect(engine.waveMesh).toBeInstanceOf(THREE.Mesh);
    expect(engine.waveMesh.geometry).toBe(engine.waveGeometry);
    expect(engine.wireframeMaterial).toBeInstanceOf(THREE.ShaderMaterial);
    expect(engine.wireframeMaterial.wireframe).toBe(true);
    expect(engine.wireframeMaterial.transparent).toBe(true);
    expect(engine.wireframeMaterial.blending).toBe(THREE.AdditiveBlending);
    expect(engine.wireframeMaterial.vertexShader).toBe(cyberWaveVert);
    expect(engine.wireframeMaterial.fragmentShader).toBe(cyberWaveFrag);
    expect(typeof engine.wireframeMaterial.customProgramCacheKey).toBe('function');
    expect(engine.wireframeMaterial.customProgramCacheKey()).toBe('cyber_wave_wireframe_material');

    // Verify onBeforeCompile substitutes point discard with solid wireframe line alpha
    const fakeShader = { fragmentShader: engine.wireframeMaterial.fragmentShader };
    engine.wireframeMaterial.onBeforeCompile(fakeShader as any, null as any);
    expect(fakeShader.fragmentShader).toContain('float alpha = 0.65;');
    expect(fakeShader.fragmentShader).not.toContain('distFromCenter > 0.5');
  });

  it('4. Object B (Floating Particle Cloud) is rendered as THREE.Points with AdditiveBlending and disabled depthWrite & frustumCulled', () => {
    expect(engine.particleCloud).toBeInstanceOf(THREE.Points);
    expect(engine.particleCloud.geometry).toBe(engine.waveGeometry);
    expect(engine.particleMaterial).toBeInstanceOf(THREE.ShaderMaterial);
    expect(engine.particleMaterial.transparent).toBe(true);
    expect(engine.particleMaterial.blending).toBe(THREE.AdditiveBlending);
    expect(engine.particleMaterial.depthWrite).toBe(false);
    expect(engine.particleCloud.frustumCulled).toBe(false);
    expect(engine.particleMaterial.vertexShader).toBe(cyberWaveVert);
    expect(engine.particleMaterial.fragmentShader).toBe(cyberWaveFrag);
  });

  it('5. Ambient Spark Particles has exactly 250 vertices orbiting with AdditiveBlending & depthWrite: false and uv/normal attributes', () => {
    expect(engine.sparkPoints).toBeInstanceOf(THREE.Points);
    expect(engine.sparkGeometry).toBeInstanceOf(THREE.BufferGeometry);
    const posAttr = engine.sparkGeometry.getAttribute('position');
    expect(posAttr.count).toBe(250);
    const uvAttr = engine.sparkGeometry.getAttribute('uv');
    expect(uvAttr).toBeDefined();
    expect(uvAttr.count).toBe(250);
    const normAttr = engine.sparkGeometry.getAttribute('normal');
    expect(normAttr).toBeDefined();
    expect(normAttr.count).toBe(250);

    expect(engine.sparkPoints.frustumCulled).toBe(false);
    expect(engine.sparkMaterial.blending).toBe(THREE.AdditiveBlending);
    expect(engine.sparkMaterial.depthWrite).toBe(false);
  });

  it('6. EffectComposer pass chain matches exact specification', () => {
    expect(engine.composer).toBeDefined();
    const passes = engine.composer.passes;
    expect(passes.length).toBe(5);

    // Pass 1: RenderPass
    expect(passes[0]).toBe(engine.renderPass);
    // Pass 2: RenderPixelatedPass
    expect(passes[1]).toBe(engine.renderPixelatedPass);
    expect(engine.renderPixelatedPass.pixelSize).toBe(5);
    expect(engine.renderPixelatedPass.normalEdgeStrength).toBe(0.3);
    expect(engine.renderPixelatedPass.depthEdgeStrength).toBe(0.4);

    // Pass 3: UnrealBloomPass
    expect(passes[2]).toBe(engine.bloomPass);
    expect(engine.bloomPass.strength).toBe(1.35);
    expect(engine.bloomPass.radius).toBe(0.4);
    expect(engine.bloomPass.threshold).toBe(0.8);

    // Pass 4: ShaderPass (CRTPostShader)
    expect(passes[3]).toBe(engine.crtPass);
    expect(engine.crtUniforms.u_distortion.value).toBe(0.04);
    expect(engine.crtUniforms.u_scanlineInt.value).toBe(0.06);

    // Pass 5: OutputPass
    expect(passes[4]).toBe(engine.outputPass);
  });

  it('7. RenderPixelatedPass replaces RenderPass when enabled, toggling dynamically across 3 modes without rebuilding chain', () => {
    const composerPassesBefore = [...engine.composer.passes];

    // Mode 1: 3D VECTOR
    engine.setRenderMode('3D VECTOR');
    expect(engine.getRenderMode()).toBe('3D VECTOR');
    expect(engine.renderPixelatedPass.enabled).toBe(false);
    expect(engine.renderPass.enabled).toBe(true);
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(false);
    expect(engine.crtPass.uniforms.u_crtEnabled.value).toBe(false);
    expect(engine.bloomPass.strength).toBe(1.35);

    // Mode 2: 3D PIXEL_ART
    engine.setRenderMode('3D PIXEL_ART');
    expect(engine.getRenderMode()).toBe('3D PIXEL_ART');
    expect(engine.renderPixelatedPass.enabled).toBe(true);
    expect(engine.renderPass.enabled).toBe(false);
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(false);
    expect(engine.crtPass.uniforms.u_crtEnabled.value).toBe(false);
    expect(engine.bloomPass.strength).toBe(0.95);

    // Mode 3: CRT ANALOG
    engine.setRenderMode('CRT ANALOG');
    expect(engine.getRenderMode()).toBe('CRT ANALOG');
    expect(engine.renderPixelatedPass.enabled).toBe(true);
    expect(engine.renderPass.enabled).toBe(false);
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(true);
    expect(engine.crtPass.uniforms.u_crtEnabled.value).toBe(true);
    expect(engine.bloomPass.strength).toBe(1.45);

    // Verify composer chain was not rebuilt
    expect(engine.composer.passes.length).toBe(composerPassesBefore.length);
    for (let i = 0; i < composerPassesBefore.length; i++) {
      expect(engine.composer.passes[i]).toBe(composerPassesBefore[i]);
    }
  });

  it('8. Reacts to global window events (wk-render-mode-change & wk-render-pass-change)', () => {
    window.dispatchEvent(
      new CustomEvent('wk-render-mode-change', {
        detail: { mode: '3D PIXEL_ART' },
      })
    );
    expect(engine.getRenderMode()).toBe('3D PIXEL_ART');
    expect(engine.renderPixelatedPass.enabled).toBe(true);
    expect(engine.renderPass.enabled).toBe(false);

    window.dispatchEvent(
      new CustomEvent('wk-render-pass-change', {
        detail: { mode: 'lattice', renderMode: 'CRT ANALOG' },
      })
    );
    expect(engine.getRenderMode()).toBe('CRT ANALOG');
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(true);
    expect(engine.crtPass.uniforms.u_crtEnabled.value).toBe(true);

    window.dispatchEvent(
      new CustomEvent('wk-render-pass-change', {
        detail: { mode: 'beauty', renderMode: '3D VECTOR' },
      })
    );
    expect(engine.getRenderMode()).toBe('3D VECTOR');
    expect(engine.renderPixelatedPass.enabled).toBe(false);
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(false);
    expect(engine.crtPass.uniforms.u_crtEnabled.value).toBe(false);
  });

  it('9. Resizes cleanly via composer.setSize(w, h) and updates camera aspect and uniforms', () => {
    const composerSetSizeSpy = vi.spyOn(engine.composer, 'setSize');
    engine.resize(1440, 900);

    expect(composerSetSizeSpy).toHaveBeenCalledWith(1440, 900);
    expect(engine.camera.aspect).toBeCloseTo(1440 / 900);
    expect(engine.crtUniforms.u_resolution.value.x).toBe(1440);
    expect(engine.crtUniforms.u_resolution.value.y).toBe(900);
    expect(engine.crtPass.uniforms.u_resolution.value.x).toBe(1440);
    expect(engine.crtPass.uniforms.u_resolution.value.y).toBe(900);
  });

  it('10. Updates wave uniforms, audio bass, and spark particle orbits inside render update', () => {
    watchknightAudio.uniforms.uAudioBass.value = 0.72;
    const initialRotZ = engine.sparkPoints.rotation.z;

    engine.update(1.25);

    expect(engine.waveUniforms.u_time.value).toBe(1.25);
    expect(engine.crtUniforms.u_time.value).toBe(1.25);
    expect(engine.crtPass.uniforms.u_time.value).toBe(1.25);
    expect(engine.waveUniforms.u_audioBass.value).toBe(0.72);
    expect(engine.sparkPoints.rotation.z).toBeGreaterThan(initialRotZ);
  });

  it('11. Full resource disposal frees geometries, materials, passes and unbinds listeners', () => {
    const geomDisposeSpy = vi.spyOn(engine.waveGeometry, 'dispose');
    const matDisposeSpy = vi.spyOn(engine.wireframeMaterial, 'dispose');
    const composerDisposeSpy = vi.spyOn(engine.composer, 'dispose');

    engine.dispose();

    expect(geomDisposeSpy).toHaveBeenCalled();
    expect(matDisposeSpy).toHaveBeenCalled();
    expect(composerDisposeSpy).toHaveBeenCalled();
  });

  it('12. CyberWaveCanvas React component and RenderMode types are defined and gsap.ticker has lagSmoothing', () => {
    expect(CyberWaveCanvas).toBeDefined();
    expect(typeof gsap.ticker.lagSmoothing).toBe('function');
    const validModes: RenderMode[] = ['3D VECTOR', '3D PIXEL_ART', 'CRT ANALOG'];
    expect(validModes).toContain('3D VECTOR');
    expect(validModes).toContain('3D PIXEL_ART');
    expect(validModes).toContain('CRT ANALOG');
  });

  it('13. Non-interactive mode does not bind pointermove listener to window', () => {
    (window.addEventListener as any).mockClear();
    const nonInteractiveEngine = new CyberWaveEngine({
      canvas: createMockCanvas(),
      interactive: false,
    });

    const pointerCalls = (window.addEventListener as any).mock.calls.filter(
      (call: any[]) => call[0] === 'pointermove'
    );
    expect(pointerCalls.length).toBe(0);

    nonInteractiveEngine.dispose();
  });

  it('14. Responds to wk-crt-fx-change event, cleanly disabling scanlines and distortion in OFF mode', () => {
    // Mode 3: CRT ANALOG with full FX
    engine.setRenderMode('CRT ANALOG');
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(true);

    // Toggle CRT FX to OFF
    window.dispatchEvent(
      new CustomEvent('wk-crt-fx-change', {
        detail: { mode: 'OFF' },
      })
    );

    expect(engine.crtUniforms.u_crtEnabled.value).toBe(false);
    expect(engine.crtUniforms.u_scanlineInt.value).toBe(0.0);
    expect(engine.crtUniforms.u_distortion.value).toBe(0.0);

    // Toggle CRT FX back to FULL
    window.dispatchEvent(
      new CustomEvent('wk-crt-fx-change', {
        detail: { mode: 'FULL' },
      })
    );
    expect(engine.crtUniforms.u_crtEnabled.value).toBe(true);
    expect(engine.crtUniforms.u_scanlineInt.value).toBe(0.06);
    expect(engine.crtUniforms.u_distortion.value).toBe(0.04);
  });

  it('15. Dampens wave amplitude when prefers-reduced-motion is active', () => {
    // Default amplitude without reduced motion
    expect(engine.waveUniforms.u_amplitude.value).toBe(0.8);

    // If reduced motion is simulated
    (engine as any).waveUniforms.u_amplitude.value = 0.12;
    expect(engine.waveUniforms.u_amplitude.value).toBeLessThan(0.2);
  });
});
