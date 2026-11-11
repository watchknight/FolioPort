// src/webgl/SceneManager.ts
// @watchknight Awwwards SOTY WebGL Rendering Layer & DOM Synchronizer
//
// Invariants:
// 1. Single THREE.WebGLRenderer driven by existing gsap.ticker (no separate RAF loop).
// 2. OrthographicCamera matching viewport pixel dimensions.
// 3. DOM-to-WebGL synchronization mapping .wk-project-media (opacity: 0) to PlaneGeometry(1, 1, 32, 32).
// 4. Layout metrics cached on resize; scroll offset applied without forced reflows (zero getBoundingClientRect on scroll).
// 5. Central Hero 3D Watchknight Chronometer & Algorithmic Astrolabe (Icosahedron nested in Torus gimbal rings)
//    rotating with scroll velocity and deforming via uAudioBass and uBeatPulse.
// 6. pmndrs/postprocessing EffectComposer merging BloomEffect and TransitionGrainEffect into a single fullscreen pass.
// 7. Pre-compiled shaders via renderer.compileAsync(scene, camera) during preloader sequence.
// 8. Complete GPU resource disposal on teardown (zero memory leaks).

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  Effect,
  BlendFunction,
} from 'postprocessing';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import projectPlaneVert from '../shaders/watchknightProjectPlane.vert.glsl?raw';
import projectPlaneFrag from '../shaders/watchknightProjectPlane.frag.glsl?raw';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// POST-PROCESSING: CUSTOM TRANSITION & GRAIN EFFECT (SINGLE FULLSCREEN PASS)
// ============================================================================

const transitionGrainFragmentShader = `
  uniform float uGrainStrength;
  uniform float uTime;
  uniform float uTransitionProgress;

  float random(vec2 p) {
    vec2 k1 = vec2(
      23.14069263277926, // e^pi
      2.665144142690225  // 2^sqrt(2)
    );
    return fract(cos(dot(p, k1)) * 12345.6789);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // High-frequency subtle film grain (editorial tactile texture)
    float noise = (random(uv + fract(uTime * 8.0)) - 0.5) * uGrainStrength;
    vec3 col = inputColor.rgb + vec3(noise);

    // Subtle edge vignette during curtain transition
    if (uTransitionProgress > 0.0) {
      float d = distance(uv, vec2(0.5));
      col *= mix(1.0, smoothstep(0.75, 0.25, d), uTransitionProgress * 0.45);
    }

    outputColor = vec4(col, inputColor.a);
  }
`;

export class TransitionGrainEffect extends Effect {
  constructor(options?: { grainStrength?: number; transitionProgress?: number }) {
    super('TransitionGrainEffect', transitionGrainFragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ['uGrainStrength', new THREE.Uniform(options?.grainStrength ?? 0.035)],
        ['uTime', new THREE.Uniform(0.0)],
        ['uTransitionProgress', new THREE.Uniform(options?.transitionProgress ?? 0.0)],
      ]),
    });
  }

  public setTime(time: number): void {
    const u = this.uniforms.get('uTime');
    if (u) u.value = time;
  }

  public setTransitionProgress(progress: number): void {
    const u = this.uniforms.get('uTransitionProgress');
    if (u) u.value = progress;
  }
}

// ============================================================================
// DOM-TO-WEBGL PLANE SYNCHRONIZER DATA STRUCTURES
// ============================================================================

export interface ProjectPlaneUniforms {
  uTexture: { value: THREE.Texture | null };
  uHasTexture: { value: number };
  uResolution: { value: THREE.Vector2 };
  uPlaneSize: { value: THREE.Vector2 };
  uTime: { value: number };
  uScrollVelocity: { value: number };
  uMouse: { value: THREE.Vector2 };
  uMouseVelocity: { value: THREE.Vector2 };
  uHoverState: { value: number };
  uAudioBass: { value: number };
  uSpectralCentroid: { value: number };
  uBeatPulse: { value: number };
  uRenderMode: { value: number };
  uColorTheme: { value: THREE.Vector3 };
}

export interface CachedPlaneMetrics {
  element: HTMLElement;
  interactiveTarget?: HTMLElement;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  texture: THREE.Texture | null;
  docTop: number;
  docLeft: number;
  width: number;
  height: number;
  hoverTween?: gsap.core.Tween;
  cleanupEvents: () => void;
}

export interface SceneManagerOptions {
  canvas?: HTMLCanvasElement;
  container?: HTMLElement;
  enablePostprocessing?: boolean;
  showHeroAstrolabe?: boolean;
}

// ============================================================================
// HERO CHRONOMETER CORE SHADERS
// ============================================================================

const chronometerCoreVert = `
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uBeatPulse;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Dynamic vertex displacement deforming via uAudioBass and uBeatPulse
    float pulse = uAudioBass * 0.18 + uBeatPulse * 0.28;
    float displacement = sin(position.x * 0.06 + uTime * 3.5) * cos(position.y * 0.06 + uTime * 2.8) * (pulse * 24.0);
    vec3 displaced = position + normal * displacement;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const chronometerCoreFrag = `
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uBeatPulse;
  uniform int uRenderMode;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  // Cyber-CRT Token Palette Vectors
  const vec3 C_OBSIDIAN_VOID = vec3(0.027, 0.031, 0.078); // #070814 (--crt-void-bg)
  const vec3 C_TERRACOTTA     = vec3(1.0, 0.165, 0.522);   // #FF2A85 (--tech-magenta-crest)
  const vec3 C_ALABASTER_INK  = vec3(0.941, 0.937, 0.902); // #F0EFE6 (--pixel-ivory-text)
  const vec3 C_VERDIGRIS      = vec3(0.0, 0.941, 1.0);     // #00F0FF (--tech-cyan-wave)

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    if (uRenderMode == 1) {
      // Mode 1: Normal vector field
      gl_FragColor = vec4(normal * 0.5 + 0.5, 0.95);
      return;
    }

    if (uRenderMode == 2) {
      // Mode 2: Clay diffuse + terracotta wire
      vec3 light = normalize(vec3(0.5, 0.8, 1.0));
      float d = max(dot(normal, light), 0.0);
      vec3 clay = mix(C_OBSIDIAN_VOID, C_ALABASTER_INK * 0.8, d);
      gl_FragColor = vec4(clay, 1.0);
      return;
    }

    // Mode 0: Beauty PBR Core
    vec3 lightDir = normalize(vec3(0.6, 0.8, 1.0));
    float diff = max(dot(normal, lightDir), 0.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    float pulse = 0.5 + 0.5 * sin(uTime * 2.5) + uAudioBass * 0.5 + uBeatPulse * 0.8;

    vec3 coreColor = mix(C_OBSIDIAN_VOID, C_TERRACOTTA, 0.5 + pulse * 0.5);
    vec3 finalColor = coreColor * (0.6 + diff * 0.4) + fresnel * C_ALABASTER_INK * 0.85;

    gl_FragColor = vec4(finalColor, 0.45);
  }
`;

// ============================================================================
// MAIN SCENE MANAGER ARCHITECTURE
// ============================================================================

export class SceneManager {
  private static instance: SceneManager | null = null;

  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public composer: EffectComposer | null = null;
  public renderPass: RenderPass | null = null;
  public bloomEffect: BloomEffect | null = null;
  public transitionGrainEffect: TransitionGrainEffect | null = null;
  public effectPass: EffectPass | null = null;

  // Hero Chronometer & Astrolabe
  public heroChronometer: THREE.Group;
  public chronometerCoreMesh: THREE.Mesh;
  public chronometerCoreGeom: THREE.IcosahedronGeometry;
  public chronometerCoreMaterial: THREE.ShaderMaterial;
  public gimbalRing1Mesh: THREE.Mesh;
  public gimbalRing1Geom: THREE.TorusGeometry;
  public gimbalRing1Material: THREE.MeshBasicMaterial;
  public gimbalRing2Mesh: THREE.Mesh;
  public gimbalRing2Geom: THREE.TorusGeometry;
  public gimbalRing2Material: THREE.MeshBasicMaterial;
  public gimbalRing3Mesh: THREE.Mesh;
  public gimbalRing3Geom: THREE.TorusGeometry;
  public gimbalRing3Material: THREE.MeshBasicMaterial;

  // DOM synchronizer cache
  private showHeroAstrolabe: boolean = false;
  private mediaPlanes: CachedPlaneMetrics[] = [];
  private renderMode: number = 0; // 0: Beauty, 1: UV/Normals, 2: Lattice
  private isDisposed: boolean = false;
  private isTickerAttached: boolean = false;
  private tickerBound: () => void;

  // Viewport metrics cache
  public viewportWidth: number = 0;
  public viewportHeight: number = 0;
  public scrollVelocity: number = 0;
  public smoothedScrollVelocity: number = 0;
  private lastScrollY: number = 0;
  private lastScrollTime: number = 0;

  // Global mouse state
  private mousePos: THREE.Vector2 = new THREE.Vector2(0, 0);
  private mouseVelocity: THREE.Vector2 = new THREE.Vector2(0, 0);
  private lastGlobalMouseMove: number = 0;

  // Event handlers
  private onResizeBound: () => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onRenderPassChangeBound: (e: Event) => void;
  private onScrollTriggerRefreshBound: () => void;
  private textureLoader: THREE.TextureLoader;

  constructor(options?: SceneManagerOptions) {
    // 1. Canvas Setup
    if (options?.canvas) {
      this.canvas = options.canvas;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'wk-webgl-canvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '3';
      this.canvas.setAttribute('aria-hidden', 'true');

      const targetParent = options?.container || document.body;
      if (targetParent) {
        targetParent.appendChild(this.canvas);
      }
    }

    // 2. High-Performance WebGLRenderer (Strictly single instance)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: 'high-performance',
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
    });
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));

    // 3. Scene & Full-Viewport Orthographic Camera
    this.scene = new THREE.Scene();

    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    this.viewportWidth = w;
    this.viewportHeight = h;

    this.camera = new THREE.OrthographicCamera(
      -w / 2,
      w / 2,
      h / 2,
      -h / 2,
      -2000,
      2000
    );
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setSize(w, h);
    this.textureLoader = new THREE.TextureLoader();

    // 4. Construct Hero 3D Watchknight Chronometer & Algorithmic Astrolabe
    this.heroChronometer = new THREE.Group();
    this.heroChronometer.name = 'WatchknightChronometerAstrolabe';

    // Core: IcosahedronGeometry(75, 3) for smooth crystalline wave deformation
    this.chronometerCoreGeom = new THREE.IcosahedronGeometry(75, 3);
    this.chronometerCoreMaterial = new THREE.ShaderMaterial({
      vertexShader: chronometerCoreVert,
      fragmentShader: chronometerCoreFrag,
      uniforms: {
        uTime: { value: 0 },
        uAudioBass: { value: 0 },
        uBeatPulse: { value: 0 },
        uRenderMode: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.chronometerCoreMesh = new THREE.Mesh(this.chronometerCoreGeom, this.chronometerCoreMaterial);
    this.heroChronometer.add(this.chronometerCoreMesh);

    // Gimbal Ring 1 (Inner Torus: Terracotta Pulse #B84A27)
    this.gimbalRing1Geom = new THREE.TorusGeometry(105, 2.4, 16, 100);
    this.gimbalRing1Material = new THREE.MeshBasicMaterial({
      color: 0xb84a27,
      transparent: true,
      opacity: 0.55,
    });
    this.gimbalRing1Mesh = new THREE.Mesh(this.gimbalRing1Geom, this.gimbalRing1Material);
    this.heroChronometer.add(this.gimbalRing1Mesh);

    // Gimbal Ring 2 (Middle Torus: Alabaster Ink #F2EFE9)
    this.gimbalRing2Geom = new THREE.TorusGeometry(130, 1.8, 16, 100);
    this.gimbalRing2Material = new THREE.MeshBasicMaterial({
      color: 0xf2efe9,
      transparent: true,
      opacity: 0.45,
    });
    this.gimbalRing2Mesh = new THREE.Mesh(this.gimbalRing2Geom, this.gimbalRing2Material);
    this.heroChronometer.add(this.gimbalRing2Mesh);

    // Gimbal Ring 3 (Outer Torus: Verdigris Signal #4E9A7F)
    this.gimbalRing3Geom = new THREE.TorusGeometry(155, 2.8, 16, 120);
    this.gimbalRing3Material = new THREE.MeshBasicMaterial({
      color: 0x4e9a7f,
      transparent: true,
      opacity: 0.45,
    });
    this.gimbalRing3Mesh = new THREE.Mesh(this.gimbalRing3Geom, this.gimbalRing3Material);
    this.heroChronometer.add(this.gimbalRing3Mesh);

    // Position Hero Chronometer in upper hero region
    this.heroChronometer.position.set(0, 0, 0);
    this.showHeroAstrolabe = options?.showHeroAstrolabe ?? false;
    this.heroChronometer.visible = this.showHeroAstrolabe;
    this.scene.add(this.heroChronometer);

    // 5. Setup pmndrs/postprocessing EffectComposer (Single-Pass Fullscreen Composite)
    if (options?.enablePostprocessing !== false) {
      try {
        this.initPostprocessing();
      } catch (err) {
        // Fallback gracefully in testing / headless environments
        this.composer = null;
      }
    }

    // 6. Bind Event Handlers
    this.tickerBound = () => this.render();
    this.onResizeBound = () => this.handleResize();
    this.onPointerMoveBound = (e: PointerEvent) => this.handlePointerMove(e);
    this.onRenderPassChangeBound = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: string; modeIndex?: number }>;
      if (customEvent.detail) {
        if (typeof customEvent.detail.modeIndex === 'number') {
          this.setRenderMode(customEvent.detail.modeIndex);
        } else if (customEvent.detail.mode) {
          const m = customEvent.detail.mode;
          if (m === 'beauty') this.setRenderMode(0);
          else if (m === 'uv' || m === 'normals') this.setRenderMode(1);
          else if (m === 'lattice' || m === 'wireframe' || m === 'clay' || m === 'transmission') this.setRenderMode(2);
        }
      }
    };
    this.onScrollTriggerRefreshBound = () => {
      this.syncMediaElements();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResizeBound, { passive: true });
      window.addEventListener('pointermove', this.onPointerMoveBound, { passive: true });
      window.addEventListener('wk-render-pass-change', this.onRenderPassChangeBound);
      ScrollTrigger.addEventListener('refresh', this.onScrollTriggerRefreshBound);

      // Attach to existing gsap.ticker loop (Single RAF Loop invariant)
      this.attachTicker();
    }

    // 7. Initial Layout Sync
    this.syncMediaElements();

    SceneManager.instance = this;
  }

  public static getInstance(): SceneManager | null {
    return SceneManager.instance;
  }

  public static getOrInit(options?: SceneManagerOptions): SceneManager {
    if (!SceneManager.instance || SceneManager.instance.isDisposed) {
      SceneManager.instance = new SceneManager(options);
    }
    return SceneManager.instance;
  }

  // ============================================================================
  // POST-PROCESSING PIPELINE INITIALIZATION
  // ============================================================================

  public initPostprocessing(): void {
    // Only initialize if renderer context is available
    const gl = this.renderer.getContext();
    if (!gl) return;

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Subtle Bloom for glowing terracotta telemetry & specular accents
    this.bloomEffect = new BloomEffect({
      intensity: 0.32,
      luminanceThreshold: 0.84,
      luminanceSmoothing: 0.16,
      mipmapBlur: true,
    });

    // Custom Transition & Film Grain Effect
    this.transitionGrainEffect = new TransitionGrainEffect({
      grainStrength: 0.035,
      transitionProgress: 0.0,
    });

    // EffectPass merges BloomEffect & TransitionGrainEffect into ONE single fullscreen shader pass
    this.effectPass = new EffectPass(
      this.camera,
      this.bloomEffect,
      this.transitionGrainEffect
    );
    this.composer.addPass(this.effectPass);
  }

  // ============================================================================
  // DOM-TO-WEBGL PLANE SYNCHRONIZATION
  // ============================================================================

  /**
   * Scans document for .wk-project-media elements, hides DOM representation (opacity: 0),
   * and creates corresponding THREE.PlaneGeometry(1, 1, 32, 32) shader meshes.
   */
  public syncMediaElements(): void {
    if (typeof document === 'undefined') return;

    // 0. Clean up planes whose elements are no longer connected to DOM
    if (this.mediaPlanes.length > 0) {
      const activePlanes: CachedPlaneMetrics[] = [];
      for (let i = 0; i < this.mediaPlanes.length; i++) {
        const item = this.mediaPlanes[i];
        if (typeof document.body.contains === 'function' && !document.body.contains(item.element)) {
          item.cleanupEvents();
          if (item.hoverTween) item.hoverTween.kill();
          this.scene.remove(item.mesh);
          item.geometry.dispose();
          item.material.dispose();
          if (item.texture) item.texture.dispose();
        } else {
          activePlanes.push(item);
        }
      }
      this.mediaPlanes = activePlanes;
    }

    const domElements = Array.from(document.querySelectorAll<HTMLElement>('.wk-project-media'));

    // Check which elements are already tracked
    const existingElementSet = new Set(this.mediaPlanes.map((p) => p.element));

    domElements.forEach((el) => {
      if (existingElementSet.has(el)) return;

      // 1. Enforce DOM element opacity: 0 (underlying layout box preserved)
      el.style.opacity = '0';

      // 2. Extract image texture if present
      let texture: THREE.Texture | null = null;
      const img = el.querySelector<HTMLImageElement>('img');
      const src = img?.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-preview');
      if (src) {
        try {
          texture = this.textureLoader.load(src);
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
        } catch {
          texture = null;
        }
      }

      // 3. Create Unit PlaneGeometry(1, 1, 32, 32)
      const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);

      // 4. Create Custom ShaderMaterial instance
      const uniforms: ProjectPlaneUniforms = {
        uTexture: { value: texture },
        uHasTexture: { value: texture ? 1.0 : 0.0 },
        uResolution: { value: new THREE.Vector2(100, 100) },
        uPlaneSize: { value: new THREE.Vector2(100, 100) },
        uTime: { value: 0.0 },
        uScrollVelocity: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseVelocity: { value: new THREE.Vector2(0.0, 0.0) },
        uHoverState: { value: 0.0 },
        uAudioBass: { value: 0.0 },
        uSpectralCentroid: { value: 0.0 },
        uBeatPulse: { value: 0.0 },
        uRenderMode: { value: this.renderMode },
        uColorTheme: { value: new THREE.Vector3(1.0, 0.165, 0.522) }, // #FF2A85 (Tech Magenta Crest)
      };

      const material = new THREE.ShaderMaterial({
        vertexShader: projectPlaneVert,
        fragmentShader: projectPlaneFrag,
        uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `WkProjectPlane_${el.id || el.getAttribute('data-project-id') || this.mediaPlanes.length}`;
      this.scene.add(mesh);

      // 5. Attach Hover and Pointer Interaction Listeners
      // Attach to closest interactive card or element to ensure events trigger even when media layer has pointer-events: none
      const interactiveTarget =
        (typeof el.closest === 'function' ? el.closest<HTMLElement>('.showcase-item') : null) ||
        el.parentElement ||
        el;

      let lastMoveTime = performance.now();
      let lastClientX = 0;
      let lastClientY = 0;

      const onPointerEnter = () => {
        gsap.to(uniforms.uHoverState, {
          value: 1.0,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: true,
        });
      };

      const onPointerLeave = () => {
        gsap.to(uniforms.uHoverState, {
          value: 0.0,
          duration: 0.55,
          ease: 'power3.out',
          overwrite: true,
        });
        uniforms.uMouseVelocity.value.set(0, 0);
      };

      const onPointerMove = (e: PointerEvent) => {
        const now = performance.now();
        const dt = Math.max((now - lastMoveTime) / 1000, 0.016);
        lastMoveTime = now;

        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const normY = Math.max(0, Math.min(1, 1.0 - (e.clientY - rect.top) / rect.height));

          uniforms.uMouse.value.set(normX, normY);

          const vx = (e.clientX - lastClientX) / (rect.width * dt);
          const vy = (e.clientY - lastClientY) / (rect.height * dt);
          uniforms.uMouseVelocity.value.set(
            gsap.utils.clamp(-5.0, 5.0, vx * 0.05),
            gsap.utils.clamp(-5.0, 5.0, -vy * 0.05)
          );
        }

        lastClientX = e.clientX;
        lastClientY = e.clientY;
      };

      interactiveTarget.addEventListener('pointerenter', onPointerEnter);
      interactiveTarget.addEventListener('pointerleave', onPointerLeave);
      interactiveTarget.addEventListener('pointermove', onPointerMove);

      const cleanupEvents = () => {
        interactiveTarget.removeEventListener('pointerenter', onPointerEnter);
        interactiveTarget.removeEventListener('pointerleave', onPointerLeave);
        interactiveTarget.removeEventListener('pointermove', onPointerMove);
      };

      this.mediaPlanes.push({
        element: el,
        interactiveTarget,
        mesh,
        material,
        geometry,
        texture,
        docTop: 0,
        docLeft: 0,
        width: 100,
        height: 100,
        cleanupEvents,
      });
    });

    // Cache layout coordinates immediately after syncing
    this.cacheLayoutMetrics();
  }

  /**
   * Caches document-relative layout metrics for all registered project planes.
   * STRICT INVARIANT: Executed strictly on initialization, resize, and font/ScrollTrigger refresh.
   * NEVER executed inside the scroll or RAF loop (prevents forced layout reflows).
   */
  public cacheLayoutMetrics(): void {
    if (typeof window === 'undefined') return;

    const scrollY = this.getScrollOffset();
    const scrollX = typeof window.scrollX !== 'undefined' ? window.scrollX : 0;

    for (let i = 0; i < this.mediaPlanes.length; i++) {
      const item = this.mediaPlanes[i];
      const rect = item.element.getBoundingClientRect();

      item.docTop = rect.top + scrollY;
      item.docLeft = rect.left + scrollX;
      item.width = Math.max(1, rect.width);
      item.height = Math.max(1, rect.height);

      item.mesh.scale.set(item.width, item.height, 1);
      item.material.uniforms.uPlaneSize.value.set(item.width, item.height);
      item.material.uniforms.uResolution.value.set(item.width, item.height);
    }
  }

  /**
   * Updates plane Y positions using pure math on cached layout metrics and current Lenis scroll offset.
   * Zero DOM getBoundingClientRect() queries during active scroll.
   */
  private updateMediaPlanes(): void {
    const scrollY = this.getScrollOffset();
    const w = this.viewportWidth;
    const h = this.viewportHeight;

    for (let i = 0; i < this.mediaPlanes.length; i++) {
      const item = this.mediaPlanes[i];

      const screenX = item.docLeft;
      const screenY = item.docTop - scrollY;

      // Map DOM screen coordinates (top-left origin) to OrthographicCamera (center origin)
      item.mesh.position.x = screenX - w / 2 + item.width / 2;
      item.mesh.position.y = -screenY + h / 2 - item.height / 2;

      // Viewport culling buffer (180px above and below viewport)
      const isVisible = screenY + item.height > -180 && screenY < h + 180;
      item.mesh.visible = isVisible;
    }
  }

  // ============================================================================
  // GSAP TICKER & SINGLE RAF LOOP
  // ============================================================================

  public attachTicker(): void {
    if (this.isTickerAttached) return;
    gsap.ticker.add(this.tickerBound);
    gsap.ticker.lagSmoothing(0);
    this.isTickerAttached = true;
  }

  public detachTicker(): void {
    if (!this.isTickerAttached) return;
    gsap.ticker.remove(this.tickerBound);
    this.isTickerAttached = false;
  }

  // ============================================================================
  // MAIN TICKER RENDER PASS
  // ============================================================================

  public render(): void {
    if (this.isDisposed) return;

    const time = gsap.ticker.time;
    const scrollY = this.getScrollOffset();

    // 1. Calculate Real-Time Scroll Velocity
    const now = performance.now();
    const dt = Math.max((now - this.lastScrollTime) / 1000, 0.016);
    this.lastScrollTime = now;

    // Prefer ScrollTrigger.getVelocity() if available
    let currentVel = 0;
    try {
      const st = ScrollTrigger as unknown as { getVelocity?: () => number };
      currentVel = (typeof st.getVelocity === 'function' ? st.getVelocity() : 0) || 0;
    } catch {
      currentVel = (scrollY - this.lastScrollY) / dt;
    }
    this.lastScrollY = scrollY;
    this.scrollVelocity = currentVel;

    // Smooth scroll velocity with decay
    this.smoothedScrollVelocity += (currentVel - this.smoothedScrollVelocity) * 0.12;

    // 2. Fetch Live Audio Shader Uniforms
    const audioUniforms = watchknightAudio.uniforms;
    const uAudioBassVal = audioUniforms.uAudioBass.value;
    const uSpectralCentroidVal = audioUniforms.uSpectralCentroid.value;
    const uBeatPulseVal = audioUniforms.uBeatPulse.value;

    // 3. Update DOM Project Planes
    this.updateMediaPlanes();

    // Propagate live uniforms to all active project planes
    for (let i = 0; i < this.mediaPlanes.length; i++) {
      const plane = this.mediaPlanes[i];
      if (plane.mesh.visible) {
        const u = plane.material.uniforms;
        u.uTime.value = time;
        u.uScrollVelocity.value = this.smoothedScrollVelocity;
        u.uAudioBass.value = uAudioBassVal;
        u.uSpectralCentroid.value = uSpectralCentroidVal;
        u.uBeatPulse.value = uBeatPulseVal;
        u.uRenderMode.value = this.renderMode;
      }
    }

    // 4. Animate Central Hero 3D Watchknight Chronometer & Algorithmic Astrolabe
    if (this.heroChronometer) {
      // Rotation coupling with scroll velocity boost
      const velBoost = this.smoothedScrollVelocity * 0.0018;

      // Gimbal Ring 1: Pitch & Yaw
      this.gimbalRing1Mesh.rotation.x += 0.008 + velBoost * 1.4;
      this.gimbalRing1Mesh.rotation.y += 0.004;

      // Gimbal Ring 2: Yaw & Roll
      this.gimbalRing2Mesh.rotation.y += 0.006 + velBoost * 1.8;
      this.gimbalRing2Mesh.rotation.z += 0.005;

      // Gimbal Ring 3: Roll & Pitch
      this.gimbalRing3Mesh.rotation.z += 0.005 + velBoost * 1.2;
      this.gimbalRing3Mesh.rotation.x += 0.003;

      // Icosahedron Core: Counter-rotation
      this.chronometerCoreMesh.rotation.y -= 0.01 + velBoost * 2.2;
      this.chronometerCoreMesh.rotation.x += 0.007;

      // Uniform updates for vertex displacement
      this.chronometerCoreMaterial.uniforms.uTime.value = time;
      this.chronometerCoreMaterial.uniforms.uAudioBass.value = uAudioBassVal;
      this.chronometerCoreMaterial.uniforms.uBeatPulse.value = uBeatPulseVal;
      this.chronometerCoreMaterial.uniforms.uRenderMode.value = this.renderMode;

      // Whole Chronometer dynamic scale pulse
      const isMobile = this.viewportWidth < 768;
      const responsiveScale = isMobile ? 0.65 : this.viewportWidth < 1024 ? 0.85 : 1.0;
      const astrolabeScale = (1.0 + uAudioBassVal * 0.1 + uBeatPulseVal * 0.22) * responsiveScale;
      this.heroChronometer.scale.set(astrolabeScale, astrolabeScale, astrolabeScale);

      // Parallax scroll position tracking: center in open corridor on desktop, scrolls smoothly upward out of hero viewport
      const targetX = this.viewportWidth >= 1024 ? this.viewportWidth * 0.14 : 0;
      this.heroChronometer.position.x = targetX;
      this.heroChronometer.position.y = scrollY * 0.45;

      // Keep hidden by default to prevent visual clutter over hero canvas
      this.heroChronometer.visible = this.showHeroAstrolabe && scrollY < this.viewportHeight * 1.5;
    }

    // 5. Update Postprocessing Pass Uniforms
    if (this.transitionGrainEffect) {
      this.transitionGrainEffect.setTime(time);
    }

    // 6. Execute Render Pass (Single Fullscreen Shader Pass Composer)
    if (this.composer) {
      this.composer.render(dt);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // ============================================================================
  // PRELOADER SHADER PRE-COMPILATION (ELIMINATES FIRST-HOVER STUTTER)
  // ============================================================================

  /**
   * Pre-compiles all scene shader programs using renderer.compileAsync(scene, camera)
   * during the preloader sequence to eliminate GPU pipeline compilation stutter on first hover.
   */
  public async precompileAsync(): Promise<void> {
    try {
      if (typeof this.renderer.compileAsync === 'function') {
        await this.renderer.compileAsync(this.scene, this.camera);
      } else if (typeof this.renderer.compile === 'function') {
        this.renderer.compile(this.scene, this.camera);
      }
      if (this.composer && typeof this.composer.render === 'function') {
        try {
          this.composer.render(0.016);
        } catch {}
      }
    } catch (err) {
      // Non-blocking in mock environments
    }
  }

  // ============================================================================
  // RENDER MODE SWITCHER (COLOMBEL-STYLE 3-MODE INSPECTOR)
  // ============================================================================

  public setRenderMode(modeIndex: number): void {
    this.renderMode = Math.max(0, Math.min(2, modeIndex));

    for (let i = 0; i < this.mediaPlanes.length; i++) {
      this.mediaPlanes[i].material.uniforms.uRenderMode.value = this.renderMode;
    }

    if (this.chronometerCoreMaterial) {
      this.chronometerCoreMaterial.uniforms.uRenderMode.value = this.renderMode;
    }
  }

  public getRenderMode(): number {
    return this.renderMode;
  }

  // ============================================================================
  // EVENT HANDLERS & HELPERS
  // ============================================================================

  public handleResize(): void {
    if (typeof window === 'undefined') return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.viewportWidth = w;
    this.viewportHeight = h;

    // Update OrthographicCamera bounds
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
    }

    // Refresh cached layout coordinates and dynamic DOM planes on resize
    this.syncMediaElements();
  }

  private handlePointerMove(e: PointerEvent): void {
    const now = performance.now();
    const dt = Math.max((now - this.lastGlobalMouseMove) / 1000, 0.016);
    this.lastGlobalMouseMove = now;

    const normX = (e.clientX / this.viewportWidth) * 2 - 1;
    const normY = -((e.clientY / this.viewportHeight) * 2 - 1);

    const vx = (normX - this.mousePos.x) / dt;
    const vy = (normY - this.mousePos.y) / dt;

    this.mouseVelocity.set(vx * 0.02, vy * 0.02);
    this.mousePos.set(normX, normY);
  }

  private getScrollOffset(): number {
    if (typeof window === 'undefined') return 0;
    if (window.__lenis && typeof window.__lenis.scroll === 'number') {
      return window.__lenis.scroll;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  public getMediaPlanes(): CachedPlaneMetrics[] {
    return this.mediaPlanes;
  }

  // ============================================================================
  // LIFECYCLE CLEANUP & ZERO GPU MEMORY LEAK TEARDOWN
  // ============================================================================

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // 1. Remove from GSAP Ticker
    this.detachTicker();

    // 2. Remove Global Event Listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResizeBound);
      window.removeEventListener('pointermove', this.onPointerMoveBound);
      window.removeEventListener('wk-render-pass-change', this.onRenderPassChangeBound);
      ScrollTrigger.removeEventListener('refresh', this.onScrollTriggerRefreshBound);
    }

    // 3. Dispose DOM Project Planes
    for (let i = 0; i < this.mediaPlanes.length; i++) {
      const item = this.mediaPlanes[i];
      item.cleanupEvents();
      if (item.hoverTween) {
        item.hoverTween.kill();
      }
      this.scene.remove(item.mesh);
      item.geometry.dispose();
      item.material.dispose();
      if (item.texture) {
        item.texture.dispose();
      }
      // Restore DOM element opacity
      try {
        item.element.style.opacity = '';
      } catch {}
    }
    this.mediaPlanes = [];

    // 4. Dispose Hero Chronometer Geometries & Materials
    this.scene.remove(this.heroChronometer);
    this.chronometerCoreGeom.dispose();
    this.chronometerCoreMaterial.dispose();
    this.gimbalRing1Geom.dispose();
    this.gimbalRing1Material.dispose();
    this.gimbalRing2Geom.dispose();
    this.gimbalRing2Material.dispose();
    this.gimbalRing3Geom.dispose();
    this.gimbalRing3Material.dispose();

    // 5. Dispose Postprocessing Passes & Composer
    if (this.effectPass) {
      try {
        this.effectPass.dispose();
      } catch {}
      this.effectPass = null;
    }

    if (this.renderPass) {
      try {
        this.renderPass.dispose();
      } catch {}
      this.renderPass = null;
    }

    if (this.bloomEffect) {
      try {
        this.bloomEffect.dispose();
      } catch {}
      this.bloomEffect = null;
    }

    if (this.transitionGrainEffect) {
      try {
        this.transitionGrainEffect.dispose();
      } catch {}
      this.transitionGrainEffect = null;
    }

    if (this.composer) {
      try {
        this.composer.dispose();
      } catch {}
      this.composer = null;
    }

    // 6. Clear Scene & Dispose Renderer
    this.scene.clear();
    try {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
    } catch {}

    // 7. Remove Canvas from DOM if created by SceneManager
    if (this.canvas && this.canvas.id === 'wk-webgl-canvas' && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }

    if (SceneManager.instance === this) {
      SceneManager.instance = null;
    }
  }
}

export default SceneManager;
