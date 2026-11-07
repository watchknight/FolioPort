import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import {
  SPATIAL_WAYPOINTS,
  SpatialWaypoint,
  interpolateSpatialWaypoints,
  hexToRgb,
} from '../utils/sectionTransitions';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import cyberWaveVert from '../shaders/cyberWave.vert.glsl?raw';
import cyberWaveFrag from '../shaders/cyberWave.frag.glsl?raw';
import crtPostProcessFrag from '../shaders/crtPostProcess.frag.glsl?raw';

gsap.registerPlugin(ScrollTrigger);

export type RenderMode = '3D VECTOR' | '3D PIXEL_ART' | 'CRT ANALOG';

export interface CyberWaveEngineOptions {
  canvas: HTMLCanvasElement;
  container?: HTMLElement;
  initialMode?: RenderMode;
  interactive?: boolean;
  enableScrollWaypoints?: boolean;
}

export interface WaveUniformsType {
  u_time: { value: number };
  u_amplitude: { value: number };
  u_audioBass: { value: number };
  u_mouse: { value: THREE.Vector2 };
  u_pixelRatio: { value: number };
  u_gridDensity: { value: number };
  u_troughColor: { value: THREE.Vector3 };
  u_crestColor: { value: THREE.Vector3 };
  u_accentColor: { value: THREE.Vector3 };
  u_paletteMorph: { value: number };
}

export interface CRTUniformsType {
  tDiffuse: { value: THREE.Texture | null };
  u_time: { value: number };
  u_resolution: { value: THREE.Vector2 };
  u_distortion: { value: number };
  u_scanlineInt: { value: number };
  u_crtEnabled: { value: boolean };
}

/**
 * CyberWaveEngine
 * Core Three.js and GLSL Shader Engine driving the interactive
 * 3D Cyan-to-Magenta Wireframe & Particle Wave terrain with hybrid
 * Pixelation and CRT post-processing.
 */
export class CyberWaveEngine {
  public canvas: HTMLCanvasElement;
  public container: HTMLElement | null;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;

  // Post-processing passes
  public renderPass: RenderPass;
  public renderPixelatedPass: RenderPixelatedPass;
  public bloomPass: UnrealBloomPass;
  public crtPass: ShaderPass;
  public outputPass: OutputPass;

  // 3D Topological Grid & Meshes
  public waveGeometry: THREE.PlaneGeometry;
  public wireframeMaterial: THREE.ShaderMaterial;
  public particleMaterial: THREE.ShaderMaterial;
  public waveMesh: THREE.Mesh;
  public particleCloud: THREE.Points;

  // 250 Orbiting Ambient Spark Particles
  public sparkGeometry: THREE.BufferGeometry;
  public sparkMaterial: THREE.ShaderMaterial;
  public sparkPoints: THREE.Points;

  // Shader Uniforms
  public waveUniforms: WaveUniformsType;
  public crtUniforms: CRTUniformsType;

  // State & Physics
  private currentMode: RenderMode = '3D VECTOR';
  private crtFxMode: string = 'FULL';
  private reducedMotion: boolean = false;
  private startTime: number;
  private targetMouse: THREE.Vector2 = new THREE.Vector2(0, 0);
  private currentMouse: THREE.Vector2 = new THREE.Vector2(0, 0);
  private interactive: boolean = true;
  private isVisible: boolean = true;
  private isDisposed: boolean = false;
  private isTickerAttached: boolean = false;
  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private tickerCallback: () => void;
  private pointerMoveHandler: (e: PointerEvent) => void;
  private resizeHandler: () => void;
  private renderModeChangeHandler: (e: Event) => void;
  private renderPassChangeHandler: (e: Event) => void;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
  private crtFxHandler: ((e: Event) => void) | null = null;

  // Spatial Waypoints & ScrollTrigger Animation
  public enableScrollWaypoints: boolean = true;
  private currentProgress: number = 0;
  private isBreathingSector5: boolean = false;
  private scrollTriggerInstance: ScrollTrigger | null = null;
  private matchMediaInstance: gsap.MatchMedia | null = null;
  private quickToCamX: ((val: number) => void) | null = null;
  private quickToCamY: ((val: number) => void) | null = null;
  private quickToCamZ: ((val: number) => void) | null = null;
  private quickToRotX: ((val: number) => void) | null = null;
  private quickToRotY: ((val: number) => void) | null = null;
  private quickToRotZ: ((val: number) => void) | null = null;
  private quickToGridDensity: ((val: number) => void) | null = null;
  private quickToPaletteMorph: ((val: number) => void) | null = null;
  private quickToAmplitude: ((val: number) => void) | null = null;
  private quickToTroughR: ((val: number) => void) | null = null;
  private quickToTroughG: ((val: number) => void) | null = null;
  private quickToTroughB: ((val: number) => void) | null = null;
  private quickToCrestR: ((val: number) => void) | null = null;
  private quickToCrestG: ((val: number) => void) | null = null;
  private quickToCrestB: ((val: number) => void) | null = null;
  private quickToAccentR: ((val: number) => void) | null = null;
  private quickToAccentG: ((val: number) => void) | null = null;
  private quickToAccentB: ((val: number) => void) | null = null;

  constructor(options: CyberWaveEngineOptions) {
    this.canvas = options.canvas;
    this.container = options.container || options.canvas.parentElement;
    this.interactive = options.interactive ?? true;
    this.enableScrollWaypoints = options.enableScrollWaypoints ?? true;
    this.startTime = performance.now();

    const hasWindow = typeof window !== 'undefined';
    const width = this.container?.clientWidth || (hasWindow ? window.innerWidth : 800) || 800;
    const height = this.container?.clientHeight || (hasWindow ? window.innerHeight : 600) || 600;
    const pixelRatio = hasWindow ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    if (hasWindow) {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq) {
        this.reducedMotion = mq.matches;
        this.mediaQueryListener = (e: MediaQueryListEvent) => {
          this.reducedMotion = e.matches;
          this.waveUniforms.u_amplitude.value = this.reducedMotion ? 0.12 : 0.8;
        };
        mq.addEventListener?.('change', this.mediaQueryListener);
      }
    }

    // 1. Scene & Void Background (#070814)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#070814');

    // 2. PerspectiveCamera positioned at angled horizon view (Sector 01 Hero Waypoint)
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    this.camera.position.set(0, -2.8, 5.2);
    this.camera.rotation.set(0.45, 0, 0);

    // 3. High-performance WebGLRenderer
    let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      glContext = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
    } catch {
      glContext = null;
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: glContext || undefined,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
      stencil: false,
      depth: true,
    });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 4. Shared Wave Shader Uniforms
    this.waveUniforms = {
      u_time: { value: 0 },
      u_amplitude: { value: this.reducedMotion ? 0.12 : 0.8 },
      u_audioBass: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0, 0) },
      u_pixelRatio: { value: pixelRatio },
      u_gridDensity: { value: 1.0 },
      u_troughColor: { value: new THREE.Vector3(0.0, 0.941, 1.0) }, // #00F0FF (Cyan)
      u_crestColor: { value: new THREE.Vector3(1.0, 0.165, 0.522) }, // #FF2A85 (Magenta)
      u_accentColor: { value: new THREE.Vector3(1.0, 0.8, 0.0) }, // #FFCC00 (Amber)
      u_paletteMorph: { value: 0.0 },
    };

    // 5. Construct 120x120 topological wave grid
    this.waveGeometry = new THREE.PlaneGeometry(18, 12, 120, 120);

    // Object A: Wireframe Energy Mesh
    this.wireframeMaterial = new THREE.ShaderMaterial({
      vertexShader: cyberWaveVert,
      fragmentShader: cyberWaveFrag,
      wireframe: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      uniforms: this.waveUniforms as any,
    });
    // Line primitive safety: provide dedicated cache key and substitute point-sprite discard with luminous line alpha
    this.wireframeMaterial.customProgramCacheKey = () => 'cyber_wave_wireframe_material';
    this.wireframeMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        /float distFromCenter = [\s\S]*?float alpha = [^;]+;/,
        'float alpha = 0.65;'
      );
    };

    this.waveMesh = new THREE.Mesh(this.waveGeometry, this.wireframeMaterial);
    this.waveMesh.rotation.x = -Math.PI / 2.8;
    this.waveMesh.position.y = -2.2;
    this.waveMesh.position.z = -1.0;
    this.scene.add(this.waveMesh);

    // Object B: Floating Particle Cloud (14,400 vertices from 120x120 grid)
    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: cyberWaveVert,
      fragmentShader: cyberWaveFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: this.waveUniforms as any,
    });

    this.particleCloud = new THREE.Points(this.waveGeometry, this.particleMaterial);
    this.particleCloud.rotation.x = -Math.PI / 2.8;
    this.particleCloud.position.y = -2.2;
    this.particleCloud.position.z = -1.0;
    this.particleCloud.frustumCulled = false;
    this.scene.add(this.particleCloud);

    // 250 Orbiting Ambient Spark Particles
    const sparkCount = 250;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 6.0 + Math.random() * 7.5;
      const y = (Math.random() - 0.5) * 8.0;
      const z = (Math.random() - 0.5) * 2.5;
      sparkPositions[i * 3] = Math.cos(theta) * radius;
      sparkPositions[i * 3 + 1] = Math.sin(theta) * radius + y * 0.4;
      sparkPositions[i * 3 + 2] = z + 0.5;
    }
    this.sparkGeometry = new THREE.BufferGeometry();
    this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    this.sparkGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(sparkCount * 2), 2));
    this.sparkGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(sparkCount * 3), 3));

    this.sparkMaterial = new THREE.ShaderMaterial({
      vertexShader: cyberWaveVert,
      fragmentShader: cyberWaveFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: this.waveUniforms as any,
    });

    this.sparkPoints = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    // 6. EffectComposer & Post-Processing Chain
    this.composer = new EffectComposer(this.renderer);

    // Pass 1: Standard RenderPass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Pass 2: RenderPixelatedPass (pixelSize: 5, normalEdgeStrength: 0.3, depthEdgeStrength: 0.4)
    this.renderPixelatedPass = new RenderPixelatedPass(5, this.scene, this.camera, {
      normalEdgeStrength: 0.3,
      depthEdgeStrength: 0.4,
    });
    this.composer.addPass(this.renderPixelatedPass);

    // Pass 3: UnrealBloomPass (strength: 1.35, radius: 0.4, threshold: 0.8)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.35,
      0.4,
      0.8
    );
    this.composer.addPass(this.bloomPass);

    // Pass 4: CRT Post-Process ShaderPass
    this.crtUniforms = {
      tDiffuse: { value: null },
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_distortion: { value: 0.04 },
      u_scanlineInt: { value: 0.06 },
      u_crtEnabled: { value: false },
    };

    const CRTPostShader = {
      name: 'CRTPostShader',
      uniforms: this.crtUniforms as any,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: crtPostProcessFrag,
    };

    this.crtPass = new ShaderPass(CRTPostShader);
    // Link public crtUniforms reference directly to the cloned pass.uniforms instance
    this.crtUniforms = this.crtPass.uniforms as unknown as CRTUniformsType;
    this.composer.addPass(this.crtPass);

    // Pass 5: OutputPass
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // Initial render mode configuration
    this.setRenderMode(options.initialMode || '3D VECTOR');

    // 7. Event listeners & Unified gsap.ticker
    this.pointerMoveHandler = (e: PointerEvent) => {
      if (!this.interactive) return;
      const rect = this.container ? this.container.getBoundingClientRect() : null;
      const w = (rect && rect.width > 0) ? rect.width : ((typeof window !== 'undefined' ? window.innerWidth : 0) || width);
      const h = (rect && rect.height > 0) ? rect.height : ((typeof window !== 'undefined' ? window.innerHeight : 0) || height);
      const clientX = rect ? (e.clientX - rect.left) : e.clientX;
      const clientY = rect ? (e.clientY - rect.top) : e.clientY;
      const normX = Math.max(-1, Math.min(1, (clientX / w) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, -(clientY / h) * 2 + 1));
      this.targetMouse.set(normX, normY);
    };

    this.resizeHandler = () => {
      const curW = this.container?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800) || 800;
      const curH = this.container?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600) || 600;
      this.resize(curW, curH);
    };

    this.renderModeChangeHandler = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: RenderMode | string; modeIndex?: number }>;
      if (customEvent.detail?.mode) {
        this.setRenderMode(customEvent.detail.mode as RenderMode);
      } else if (typeof customEvent.detail?.modeIndex === 'number') {
        this.setRenderMode(customEvent.detail.modeIndex);
      }
    };

    this.renderPassChangeHandler = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: string; modeIndex?: number; renderMode?: RenderMode }>;
      if (customEvent.detail?.renderMode) {
        this.setRenderMode(customEvent.detail.renderMode);
      } else if (customEvent.detail?.mode) {
        this.setRenderMode(customEvent.detail.mode);
      } else if (typeof customEvent.detail?.modeIndex === 'number') {
        this.setRenderMode(customEvent.detail.modeIndex);
      }
    };

    if (typeof window !== 'undefined') {
      if (this.interactive) {
        window.addEventListener('pointermove', this.pointerMoveHandler, { passive: true });
      }
      window.addEventListener('resize', this.resizeHandler, { passive: true });
      window.addEventListener('wk-render-mode-change', this.renderModeChangeHandler);
      window.addEventListener('wk-render-pass-change', this.renderPassChangeHandler);
      this.crtFxHandler = (e: Event) => {
        const detail = (e as CustomEvent<{ mode?: string }>).detail;
        if (detail?.mode) {
          this.setCrtFxMode(detail.mode);
        }
      };
      window.addEventListener('wk-crt-fx-change', this.crtFxHandler);

      try {
        const savedFx = localStorage.getItem('wk_crt_fx_mode') || document.documentElement.getAttribute('data-crt-fx');
        if (savedFx) {
          this.setCrtFxMode(savedFx);
        }
      } catch {
        // Safe local storage fallback
      }

      // Attach ResizeObserver to keep canvas buffer pixel-matched with responsive container
      if ('ResizeObserver' in window && this.container) {
        try {
          this.resizeObserver = new ResizeObserver(() => {
            this.resizeHandler();
          });
          this.resizeObserver.observe(this.container);
        } catch {
          this.resizeObserver = null;
        }
      }

      // Attach IntersectionObserver to pause heavy EffectComposer passes when scrolled offscreen
      if ('IntersectionObserver' in window && (this.container || this.canvas)) {
        try {
          this.observer = new IntersectionObserver(
            ([entry]) => {
              this.isVisible = entry.isIntersecting;
            },
            { threshold: 0 }
          );
          this.observer.observe(this.container || this.canvas);
        } catch {
          this.isVisible = true;
          this.observer = null;
        }
      }
    }

    // Single unified gsap.ticker loop (Rule 5: gsap.ticker.lagSmoothing(0))
    gsap.ticker.lagSmoothing(0);
    this.tickerCallback = () => {
      this.update();
    };
    gsap.ticker.add(this.tickerCallback);
    this.isTickerAttached = true;

    // 8. Bind Spatial Scroll Waypoints across Sectors 01 - 05
    if (this.enableScrollWaypoints) {
      this.initScrollWaypoints();
    }
  }

  /**
   * Real-time Render Mode Switcher:
   * Toggles renderPixelatedPass.enabled vs renderPass.enabled and updates
   * bloomPass.strength and CRT uniforms without rebuilding the composer chain.
   */
  public setRenderMode(mode: RenderMode | string | number): void {
    let resolved: RenderMode = '3D VECTOR';

    if (typeof mode === 'number') {
      if (mode === 1) resolved = '3D PIXEL_ART';
      else if (mode === 2) resolved = 'CRT ANALOG';
      else resolved = '3D VECTOR';
    } else {
      const upper = String(mode).toUpperCase();
      if (upper.includes('PIXEL') || upper === 'UV' || upper === '1') {
        resolved = '3D PIXEL_ART';
      } else if (upper.includes('CRT') || upper.includes('ANALOG') || upper === 'LATTICE' || upper === '2') {
        resolved = 'CRT ANALOG';
      } else {
        resolved = '3D VECTOR';
      }
    }

    this.currentMode = resolved;

    if (resolved === '3D PIXEL_ART') {
      // Pixelated pass replaces standard render pass
      this.renderPixelatedPass.enabled = true;
      this.renderPass.enabled = false;
      this.crtUniforms.u_crtEnabled.value = false;
      this.bloomPass.strength = 0.95;
    } else if (resolved === 'CRT ANALOG') {
      // Pixelated raster with full analog barrel distortion & scanlines
      this.renderPixelatedPass.enabled = true;
      this.renderPass.enabled = false;
      this.crtUniforms.u_crtEnabled.value = this.crtFxMode !== 'OFF';
      this.bloomPass.strength = 1.45;
    } else {
      // Standard 3D Vector mode: pristine high-resolution rendering
      this.renderPixelatedPass.enabled = false;
      this.renderPass.enabled = true;
      this.crtUniforms.u_crtEnabled.value = false;
      this.bloomPass.strength = 1.35;
    }
  }

  public setCrtFxMode(mode: string): void {
    this.crtFxMode = mode;
    if (mode === 'OFF') {
      this.crtUniforms.u_crtEnabled.value = false;
      this.crtUniforms.u_scanlineInt.value = 0.0;
      this.crtUniforms.u_distortion.value = 0.0;
    } else if (mode === 'LITE') {
      this.crtUniforms.u_crtEnabled.value = this.currentMode === 'CRT ANALOG';
      this.crtUniforms.u_scanlineInt.value = 0.035;
      this.crtUniforms.u_distortion.value = 0.015;
    } else {
      this.crtUniforms.u_crtEnabled.value = this.currentMode === 'CRT ANALOG';
      this.crtUniforms.u_scanlineInt.value = 0.06;
      this.crtUniforms.u_distortion.value = 0.04;
    }
  }

  public getRenderMode(): RenderMode {
    return this.currentMode;
  }

  /**
   * Resizes camera, renderer, composer and pass buffers cleanly
   */
  public resize(width: number, height: number): void {
    if (this.isDisposed || width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    this.crtUniforms.u_resolution.value.set(width, height);
    if (this.bloomPass?.resolution) {
      this.bloomPass.resolution.set(width, height);
    }
    const hasWindow = typeof window !== 'undefined';
    this.waveUniforms.u_pixelRatio.value = hasWindow ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  }

  /**
   * Per-frame GPU uniform update and composer render
   */
  public update(customTime?: number): void {
    if (this.isDisposed) return;

    // Skip expensive multi-pass GPU rendering if canvas is currently off-screen
    if (!this.isVisible && customTime === undefined) return;

    const elapsedTime =
      customTime !== undefined ? customTime : (performance.now() - this.startTime) * 0.001;

    // 1. Advance wave & post-processing time
    this.waveUniforms.u_time.value = elapsedTime;
    this.crtUniforms.u_time.value = elapsedTime;

    // 2. Smoothly interpolate cursor ripple coordinates
    this.currentMouse.x += (this.targetMouse.x - this.currentMouse.x) * 0.08;
    this.currentMouse.y += (this.targetMouse.y - this.currentMouse.y) * 0.08;
    this.waveUniforms.u_mouse.value.copy(this.currentMouse);

    // 3. Modulate wave elevation with 8-bit chiptune audio bass channel
    const chiptuneBass = chiptuneAudio.getAudioBass();
    const wkBass = watchknightAudio?.uniforms?.uAudioBass?.value || 0;
    this.waveUniforms.u_audioBass.value = Math.max(chiptuneBass, wkBass);

    // 3b. Sector 05 Infinite Synthwave Horizon wave amplitude breathing
    if (this.isBreathingSector5 && !this.reducedMotion) {
      const breathe = Math.sin(elapsedTime * 1.6) * 0.12;
      this.waveUniforms.u_amplitude.value = 0.88 + breathe;
    }

    // 4. Orbit ambient spark particles (GPU matrix transform, deterministic frame-rate independent)
    if (this.sparkPoints) {
      this.sparkPoints.rotation.z = elapsedTime * 0.15;
      this.sparkPoints.rotation.y = elapsedTime * 0.09;
    }

    // 5. Render post-processing chain
    try {
      this.composer.render();
    } catch {
      // Non-blocking in mock environments
    }
  }

  /**
   * Initializes ScrollTrigger & gsap.matchMedia for waypoint morphing across Sectors 01 - 05
   */
  public initScrollWaypoints(): void {
    if (typeof window === 'undefined') return;

    try {
      this.matchMediaInstance = gsap.matchMedia();

      this.matchMediaInstance.add(
        {
          isDesktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
          isMobileOrReduced: '(max-width: 1023px), (prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { isDesktop } = context.conditions as {
            isDesktop: boolean;
            isMobileOrReduced: boolean;
          };

          if (isDesktop) {
            this.setupQuickToTweens();

            const targetEl = document.querySelector('main') || document.body;
            this.scrollTriggerInstance = ScrollTrigger.create({
              trigger: targetEl,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.6,
              onUpdate: (self) => {
                this.goToWaypointProgress(self.progress);
              },
            });
          } else {
            // Mobile or prefers-reduced-motion fallback:
            // Disable camera rotation and depth scaling, reset camera to default
            if (this.scrollTriggerInstance) {
              this.scrollTriggerInstance.kill();
              this.scrollTriggerInstance = null;
            }
            this.camera.position.set(0, -2.8, 5.2);
            this.camera.rotation.set(0.45, 0, 0);
            this.waveUniforms.u_amplitude.value = this.reducedMotion ? 0.12 : 0.6;
          }
        }
      );
    } catch {
      // Safe fallback in headless / test environments
    }
  }

  public setupQuickToTweens(): void {
    try {
      this.quickToCamX = gsap.quickTo(this.camera.position, 'x', { duration: 0.8, ease: 'power2.out' });
      this.quickToCamY = gsap.quickTo(this.camera.position, 'y', { duration: 0.8, ease: 'power2.out' });
      this.quickToCamZ = gsap.quickTo(this.camera.position, 'z', { duration: 0.8, ease: 'power2.out' });
      this.quickToRotX = gsap.quickTo(this.camera.rotation, 'x', { duration: 0.8, ease: 'power2.out' });
      this.quickToRotY = gsap.quickTo(this.camera.rotation, 'y', { duration: 0.8, ease: 'power2.out' });
      this.quickToRotZ = gsap.quickTo(this.camera.rotation, 'z', { duration: 0.8, ease: 'power2.out' });
      this.quickToGridDensity = gsap.quickTo(this.waveUniforms.u_gridDensity, 'value', { duration: 0.8, ease: 'power2.out' });
      this.quickToPaletteMorph = gsap.quickTo(this.waveUniforms.u_paletteMorph, 'value', { duration: 0.8, ease: 'power2.out' });
      this.quickToAmplitude = gsap.quickTo(this.waveUniforms.u_amplitude, 'value', { duration: 0.8, ease: 'power2.out' });

      // Smooth color uniforms along with camera movement
      this.quickToTroughR = gsap.quickTo(this.waveUniforms.u_troughColor.value, 'x', { duration: 0.8, ease: 'power2.out' });
      this.quickToTroughG = gsap.quickTo(this.waveUniforms.u_troughColor.value, 'y', { duration: 0.8, ease: 'power2.out' });
      this.quickToTroughB = gsap.quickTo(this.waveUniforms.u_troughColor.value, 'z', { duration: 0.8, ease: 'power2.out' });
      this.quickToCrestR = gsap.quickTo(this.waveUniforms.u_crestColor.value, 'x', { duration: 0.8, ease: 'power2.out' });
      this.quickToCrestG = gsap.quickTo(this.waveUniforms.u_crestColor.value, 'y', { duration: 0.8, ease: 'power2.out' });
      this.quickToCrestB = gsap.quickTo(this.waveUniforms.u_crestColor.value, 'z', { duration: 0.8, ease: 'power2.out' });
      this.quickToAccentR = gsap.quickTo(this.waveUniforms.u_accentColor.value, 'x', { duration: 0.8, ease: 'power2.out' });
      this.quickToAccentG = gsap.quickTo(this.waveUniforms.u_accentColor.value, 'y', { duration: 0.8, ease: 'power2.out' });
      this.quickToAccentB = gsap.quickTo(this.waveUniforms.u_accentColor.value, 'z', { duration: 0.8, ease: 'power2.out' });
    } catch {
      // Fallback
    }
  }

  public goToWaypointProgress(progress: number): void {
    this.currentProgress = Math.max(0, Math.min(1, progress));
    const target = interpolateSpatialWaypoints(this.currentProgress);

    if (this.quickToCamX) {
      this.quickToCamX(target.cameraPosition.x);
      this.quickToCamY?.(target.cameraPosition.y);
      this.quickToCamZ?.(target.cameraPosition.z);
      this.quickToRotX?.(target.cameraRotation.x);
      this.quickToRotY?.(target.cameraRotation.y);
      this.quickToRotZ?.(target.cameraRotation.z);
      this.quickToGridDensity?.(target.gridDensity);
      this.quickToPaletteMorph?.(target.paletteMorph);

      if (!target.isSector5) {
        this.isBreathingSector5 = false;
        this.quickToAmplitude?.(this.reducedMotion ? 0.12 : target.amplitude);
      } else {
        if (!this.isBreathingSector5) {
          gsap.killTweensOf(this.waveUniforms.u_amplitude);
        }
        this.isBreathingSector5 = true;
      }

      // Smooth color transitions
      if (this.quickToTroughR) {
        this.quickToTroughR(target.troughColor.r);
        this.quickToTroughG?.(target.troughColor.g);
        this.quickToTroughB?.(target.troughColor.b);
        this.quickToCrestR?.(target.crestColor.r);
        this.quickToCrestG?.(target.crestColor.g);
        this.quickToCrestB?.(target.crestColor.b);
        this.quickToAccentR?.(target.accentColor.r);
        this.quickToAccentG?.(target.accentColor.g);
        this.quickToAccentB?.(target.accentColor.b);
      } else {
        this.waveUniforms.u_troughColor.value.set(target.troughColor.r, target.troughColor.g, target.troughColor.b);
        this.waveUniforms.u_crestColor.value.set(target.crestColor.r, target.crestColor.g, target.crestColor.b);
        this.waveUniforms.u_accentColor.value.set(target.accentColor.r, target.accentColor.g, target.accentColor.b);
      }
    } else {
      this.camera.position.set(target.cameraPosition.x, target.cameraPosition.y, target.cameraPosition.z);
      this.camera.rotation.set(target.cameraRotation.x, target.cameraRotation.y, target.cameraRotation.z);
      this.waveUniforms.u_gridDensity.value = target.gridDensity;
      this.waveUniforms.u_paletteMorph.value = target.paletteMorph;
      if (!target.isSector5) {
        this.waveUniforms.u_amplitude.value = this.reducedMotion ? 0.12 : target.amplitude;
      }
      this.isBreathingSector5 = target.isSector5;

      this.waveUniforms.u_troughColor.value.set(target.troughColor.r, target.troughColor.g, target.troughColor.b);
      this.waveUniforms.u_crestColor.value.set(target.crestColor.r, target.crestColor.g, target.crestColor.b);
      this.waveUniforms.u_accentColor.value.set(target.accentColor.r, target.accentColor.g, target.accentColor.b);
    }
  }

  public goToWaypoint(sectorIndexOrId: number | string, immediate: boolean = false): void {
    let index = 0;
    if (typeof sectorIndexOrId === 'number') {
      index = Math.max(0, Math.min(SPATIAL_WAYPOINTS.length - 1, sectorIndexOrId));
    } else {
      const idx = SPATIAL_WAYPOINTS.findIndex(
        (wp) => wp.id === sectorIndexOrId || wp.sectorCode === sectorIndexOrId || wp.name === sectorIndexOrId
      );
      if (idx !== -1) index = idx;
    }

    const progress = index / (SPATIAL_WAYPOINTS.length - 1);
    if (immediate) {
      if (this.quickToCamX) {
        gsap.killTweensOf(this.camera.position);
        gsap.killTweensOf(this.camera.rotation);
        gsap.killTweensOf(this.waveUniforms.u_gridDensity);
        gsap.killTweensOf(this.waveUniforms.u_paletteMorph);
        gsap.killTweensOf(this.waveUniforms.u_amplitude);
        gsap.killTweensOf(this.waveUniforms.u_troughColor.value);
        gsap.killTweensOf(this.waveUniforms.u_crestColor.value);
        gsap.killTweensOf(this.waveUniforms.u_accentColor.value);
      }
      const target = SPATIAL_WAYPOINTS[index];
      this.camera.position.set(target.cameraPosition.x, target.cameraPosition.y, target.cameraPosition.z);
      this.camera.rotation.set(target.cameraRotation.x, target.cameraRotation.y, target.cameraRotation.z);
      this.waveUniforms.u_gridDensity.value = target.gridDensity;
      this.waveUniforms.u_amplitude.value = this.reducedMotion ? 0.12 : target.amplitude;
      const tc = hexToRgb(target.troughColor);
      const cc = hexToRgb(target.crestColor);
      const ac = hexToRgb(target.accentColor);
      this.waveUniforms.u_troughColor.value.set(tc.r, tc.g, tc.b);
      this.waveUniforms.u_crestColor.value.set(cc.r, cc.g, cc.b);
      this.waveUniforms.u_accentColor.value.set(ac.r, ac.g, ac.b);
      this.waveUniforms.u_paletteMorph.value = index === 0 ? 0.0 : 1.0;
      this.isBreathingSector5 = index === 4;
      this.currentProgress = progress;
    } else {
      this.goToWaypointProgress(progress);
    }
  }

  public getSpatialWaypoints(): SpatialWaypoint[] {
    return SPATIAL_WAYPOINTS;
  }

  public getCurrentProgress(): number {
    return this.currentProgress;
  }

  /**
   * Cleanly disposes all WebGL buffers, textures, passes, and event listeners
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.matchMediaInstance) {
      this.matchMediaInstance.revert();
      this.matchMediaInstance = null;
    }

    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
      this.scrollTriggerInstance = null;
    }

    // Kill active quickTo tweens and clear function references
    try {
      gsap.killTweensOf(this.camera.position);
      gsap.killTweensOf(this.camera.rotation);
      gsap.killTweensOf(this.waveUniforms.u_gridDensity);
      gsap.killTweensOf(this.waveUniforms.u_paletteMorph);
      gsap.killTweensOf(this.waveUniforms.u_amplitude);
      gsap.killTweensOf(this.waveUniforms.u_troughColor.value);
      gsap.killTweensOf(this.waveUniforms.u_crestColor.value);
      gsap.killTweensOf(this.waveUniforms.u_accentColor.value);
    } catch {
      // Safe fallback
    }
    this.quickToCamX = null;
    this.quickToCamY = null;
    this.quickToCamZ = null;
    this.quickToRotX = null;
    this.quickToRotY = null;
    this.quickToRotZ = null;
    this.quickToGridDensity = null;
    this.quickToPaletteMorph = null;
    this.quickToAmplitude = null;
    this.quickToTroughR = null;
    this.quickToTroughG = null;
    this.quickToTroughB = null;
    this.quickToCrestR = null;
    this.quickToCrestG = null;
    this.quickToCrestB = null;
    this.quickToAccentR = null;
    this.quickToAccentG = null;
    this.quickToAccentB = null;

    if (this.isTickerAttached) {
      gsap.ticker.remove(this.tickerCallback);
      this.isTickerAttached = false;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.pointerMoveHandler);
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('wk-render-mode-change', this.renderModeChangeHandler);
      window.removeEventListener('wk-render-pass-change', this.renderPassChangeHandler);
      if (this.crtFxHandler) {
        window.removeEventListener('wk-crt-fx-change', this.crtFxHandler);
        this.crtFxHandler = null;
      }
      if (this.mediaQueryListener) {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (typeof mq?.removeEventListener === 'function') {
          mq.removeEventListener('change', this.mediaQueryListener);
        }
        this.mediaQueryListener = null;
      }
    }

    // Detach scene graph children
    this.scene.remove(this.waveMesh);
    this.scene.remove(this.particleCloud);
    this.scene.remove(this.sparkPoints);

    // Dispose geometries and materials
    this.waveGeometry.dispose();
    this.wireframeMaterial.dispose();
    this.particleMaterial.dispose();
    this.sparkGeometry.dispose();
    this.sparkMaterial.dispose();

    // Dispose passes
    this.renderPass.dispose();
    this.renderPixelatedPass.dispose();
    this.bloomPass.dispose();
    this.crtPass.dispose();
    this.outputPass.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}

export interface CyberWaveCanvasProps {
  className?: string;
  style?: React.CSSProperties;
  initialMode?: RenderMode;
  interactive?: boolean;
  enableScrollWaypoints?: boolean;
}

export const CyberWaveCanvas: React.FC<CyberWaveCanvasProps> = ({
  className = '',
  style,
  initialMode = '3D VECTOR',
  interactive = true,
  enableScrollWaypoints = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CyberWaveEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new CyberWaveEngine({
      canvas,
      container,
      initialMode,
      interactive,
      enableScrollWaypoints,
    });
    engineRef.current = engine;
    (canvas as any).__cyberWaveEngine = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
      delete (canvas as any).__cyberWaveEngine;
    };
  }, [enableScrollWaypoints]);

  // Update render mode dynamically without rebuilding WebGLRenderer or composer chain
  useEffect(() => {
    if (engineRef.current && initialMode) {
      engineRef.current.setRenderMode(initialMode);
    }
  }, [initialMode]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${className ? className : 'relative'}`}
      style={{
        backgroundColor: 'var(--crt-void-bg, #070814)',
        ...style,
      }}
      aria-label="3D Cyberdeck Wave & Particle Canvas"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};

export default CyberWaveCanvas;
