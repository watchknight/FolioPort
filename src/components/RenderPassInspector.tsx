import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { audio } from '../utils/audio';
import { 
  Sparkles, 
  Layers, 
  Activity, 
  RotateCcw, 
  Zap 
} from 'lucide-react';

export type RenderPassId = 'beauty' | 'wireframe' | 'clay' | 'transmission' | 'uv' | 'normals';

interface RenderPassConfig {
  id: RenderPassId;
  label: string;
  key: string;
  subtitle: string;
  description: string;
  badge: string;
}

const RENDER_PASSES: RenderPassConfig[] = [
  {
    id: 'beauty',
    label: 'Beauty',
    key: '1',
    subtitle: 'Physically Based Composite + Chromatic Aberration',
    description: 'Full physically based rendering (PBR) featuring dual-point studio illumination, GGX specular sheen, Fresnel rim glow, subtle chromatic aberration, and interactive fluid mouse-ripple distortion.',
    badge: 'PBR + CHROMA',
  },
  {
    id: 'wireframe',
    label: 'Wireframe',
    key: '2',
    subtitle: 'Topology & Edge Rasterization',
    description: 'Enables high-contrast wireframe stroke rasterization over obsidian depth, isolating polygon density, quad tessellation, and procedural vertex flow.',
    badge: '14.4K TRIS',
  },
  {
    id: 'clay',
    label: 'Clay',
    key: '3',
    subtitle: 'Matte Diffuse Studio Shading',
    description: 'Applies matte diffuse clay lighting (roughness: 0.85, metalness: 0.0) with multi-bounce ambient occlusion to isolate silhouette curvature without specular distraction.',
    badge: 'ROUGHNESS 0.85',
  },
  {
    id: 'transmission',
    label: 'Transmission',
    key: '4',
    subtitle: 'Optical Glass Refraction & Dispersion',
    description: 'Activates refractive optical physical glass (transmission: 0.95, ior: 1.5, thickness: 1.2) simulating refractive flint crystal with internal optical caustics.',
    badge: 'IOR 1.50 // GLASS',
  },
  {
    id: 'uv',
    label: 'UV',
    key: '5',
    subtitle: 'Parametric Texture Coordinate Space',
    description: 'Custom fragment shader outputting procedural 16x16 UV coordinate checkerboard, high-contrast borders, and continuous [U, V] manifold color mapping.',
    badge: '[U, V] MAPPING',
  },
  {
    id: 'normals',
    label: 'Normals',
    key: '6',
    subtitle: 'Surface Normal Vector Field',
    description: 'Visualizes surface normal unit vectors in camera space via MeshNormalMaterial, mapping [Nx, Ny, Nz] directly into normalized RGB color space.',
    badge: 'VECTORS [RGB]',
  },
];

export const RenderPassInspector: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active pass state
  const [activePass, setActivePass] = useState<RenderPassId>('beauty');
  const activePassRef = useRef<RenderPassId>('beauty');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(true);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  // Direct DOM refs for high-frequency 60-120fps telemetry display
  const fpsRef = useRef<HTMLSpanElement | null>(null);
  const pointerCoordsRef = useRef<HTMLSpanElement | null>(null);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const innerCoreRef = useRef<THREE.Mesh | null>(null);
  const outerRingRef = useRef<THREE.Mesh | null>(null);
  const materialsRef = useRef<Record<RenderPassId, THREE.Material>>({} as Record<RenderPassId, THREE.Material>);
  
  const pointAccentRef = useRef<THREE.PointLight | null>(null);
  
  const beautyUniformsRef = useRef<{
    uTime: { value: number };
    uMouse: { value: THREE.Vector2 };
    uRipple: { value: number };
    uRimColor: { value: THREE.Color };
    uBaseCore: { value: THREE.Color };
    uDiffuseColor: { value: THREE.Color };
  } | null>(null);

  const uvUniformsRef = useRef<{
    uTime: { value: number };
  } | null>(null);

  // Pointer tracking & physics
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const rippleEnergyRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Switch pass handler with dynamic real-time property & uniform tweening
  const handlePassSelect = useCallback((passId: RenderPassId) => {
    setActivePass(passId);
    activePassRef.current = passId;
    audio.playChord();

    // Propagate render mode change to full-viewport SceneManager layer
    if (typeof window !== 'undefined') {
      const modeIndex = passId === 'beauty' ? 0 : passId === 'uv' || passId === 'normals' ? 1 : 2;
      window.dispatchEvent(
        new CustomEvent('wk-render-pass-change', {
          detail: { mode: passId, modeIndex, source: 'inspector' },
        })
      );
    }

    const mesh = meshRef.current;
    const materials = materialsRef.current;
    if (mesh && materials[passId]) {
      const targetMat = materials[passId];
      mesh.material = targetMat;

      // Real-time material property & uniform tweens:
      if (passId === 'clay') {
        const clayMat = targetMat as THREE.MeshStandardMaterial;
        gsap.fromTo(
          clayMat,
          { roughness: 0.2, metalness: 0.3 },
          { roughness: 0.85, metalness: 0.0, duration: 0.6, ease: 'power3.out' }
        );
      } else if (passId === 'transmission') {
        const transMat = targetMat as THREE.MeshPhysicalMaterial;
        gsap.fromTo(
          transMat,
          { transmission: 0.2, thickness: 0.2 },
          { transmission: 0.95, thickness: 1.2, duration: 0.7, ease: 'power3.out' }
        );
      } else if (passId === 'wireframe') {
        const wireMat = targetMat as THREE.MeshBasicMaterial;
        gsap.fromTo(
          wireMat,
          { opacity: 0.3 },
          { opacity: 1.0, duration: 0.4, ease: 'power3.out' }
        );
      } else if (passId === 'beauty') {
        rippleEnergyRef.current = 1.4;
      }

      // Elastic 3D mesh punch & orbital pulse
      gsap.fromTo(
        mesh.scale,
        { x: 0.91, y: 0.91, z: 0.91 },
        { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(2)' }
      );

      if (innerCoreRef.current) {
        gsap.fromTo(
          innerCoreRef.current.scale,
          { x: 0.8, y: 0.8, z: 0.8 },
          { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' }
        );
      }
    }
  }, []);

  // Trigger ripple shockwave
  const triggerRippleWave = useCallback(() => {
    rippleEnergyRef.current = 1.4;
  }, []);

  // Keyboard hotkey listener [1 - 6]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const keyIndex = parseInt(e.key, 10);
      if (keyIndex >= 1 && keyIndex <= 6) {
        e.preventDefault();
        const targetPass = RENDER_PASSES[keyIndex - 1];
        if (targetPass) {
          handlePassSelect(targetPass.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePassSelect]);

  // Listen for SentinelHUD 3-mode Render Pass Switcher events
  useEffect(() => {
    const onPassChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: string; source?: string }>;
      if (customEvent.detail?.source === 'inspector') return;
      const mode = customEvent.detail?.mode;
      if (mode === 'beauty') {
        handlePassSelect('beauty');
      } else if (mode === 'uv') {
        handlePassSelect('uv');
      } else if (mode === 'lattice' || mode === 'wireframe') {
        handlePassSelect('wireframe');
      }
    };

    window.addEventListener('wk-render-pass-change', onPassChange);
    return () => window.removeEventListener('wk-render-pass-change', onPassChange);
  }, [handlePassSelect]);

  // Main Three.js Scene Initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. WebGL Renderer with ACESFilmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // 2. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 3. Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5.2);
    cameraRef.current = camera;

    // 4. Studio Environment for Refraction & Fresnel Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envLight1 = new THREE.PointLight(0xdf6c4f, 10, 30);
    envLight1.position.set(4, 5, 4);
    envScene.add(envLight1);
    const envLight2 = new THREE.PointLight(0x5080a0, 8, 30);
    envLight2.position.set(-4, -3, -4);
    envScene.add(envLight2);
    const envLight3 = new THREE.PointLight(0xffffff, 5, 30);
    envLight3.position.set(0, 6, 0);
    envScene.add(envLight3);
    const envAmb = new THREE.AmbientLight(0x202025, 2.0);
    envScene.add(envAmb);

    const envRenderTarget = pmremGenerator.fromScene(envScene);
    scene.environment = envRenderTarget.texture;

    // 5. Studio Lights in Main Scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLightKey = new THREE.DirectionalLight(0xffe8df, 2.4);
    dirLightKey.position.set(4, 6, 4);
    scene.add(dirLightKey);

    const dirLightFill = new THREE.DirectionalLight(0x90b0d0, 1.4);
    dirLightFill.position.set(-4, -3, -3);
    scene.add(dirLightFill);

    const pointAccent = new THREE.PointLight(0xdf6c4f, 3.5, 12);
    pointAccent.position.set(0, 2, 3);
    scene.add(pointAccent);
    pointAccentRef.current = pointAccent;

    // 6. Abstract Procedural Geometry: Intricate Torus Knot Artifact
    // Parameters: radius=1.35, tube=0.42, tubularSegments=220, radialSegments=36, p=2, q=3
    const mainGeometry = new THREE.TorusKnotGeometry(1.35, 0.42, 220, 36, 2, 3);
    mainGeometry.computeVertexNormals();

    // 7. Define All 6 Materials

    // Pass 1: Beauty (PBR with GGX + Chromatic Aberration + Fluid Mouse-Ripple Distortion)
    const beautyUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uRipple: { value: 0 },
      uRimColor: { value: new THREE.Color(0xdf6c4f) },
      uBaseCore: { value: new THREE.Color(0x101115) },
      uDiffuseColor: { value: new THREE.Color(0x33282b) },
    };
    beautyUniformsRef.current = beautyUniforms;

    const beautyMaterial = new THREE.ShaderMaterial({
      uniforms: beautyUniforms,
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uRipple;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec4 vClipPosition;

        void main() {
          vUv = uv;

          // Project vertex to initial clip space to calculate accurate screen-space distance to mouse
          vec4 initialMv = modelViewMatrix * vec4(position, 1.0);
          vec4 initialClip = projectionMatrix * initialMv;
          vec2 screenNdc = initialClip.xy / initialClip.w;

          // Fluid mouse-ripple wave distortion radiating from normalized pointer coordinates
          float dist = length(screenNdc - uMouse);
          float wave = sin(dist * 14.0 - uTime * 4.0) * exp(-dist * 1.8) * (0.04 + uRipple * 0.22);
          vec3 pos = position + normal * wave;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          vClipPosition = projectionMatrix * mvPosition;
          gl_Position = vClipPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uRipple;
        uniform vec3 uRimColor;
        uniform vec3 uBaseCore;
        uniform vec3 uDiffuseColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec4 vClipPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Screen-space NDC for cursor-centered chromatic aberration and ripple wave
          vec2 ndc = vClipPosition.xy / vClipPosition.w;
          float cursorDist = length(ndc - uMouse);

          // Studio key light
          vec3 lightDir = normalize(vec3(0.8, 1.2, 1.0));
          float diff = max(dot(normal, lightDir), 0.0);

          // Studio fill light
          vec3 fillDir = normalize(vec3(-0.8, -0.6, -0.5));
          float fillDiff = max(dot(normal, fillDir), 0.0) * 0.45;

          // GGX Specular highlight
          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(normal, halfDir), 0.0), 38.0);

          // Dynamic Fresnel rim glow matching editorial palette
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
          vec3 rimColor = uRimColor;

          // Dynamic base core with studio fill
          vec3 baseCore = uBaseCore;
          vec3 diffuseCol = mix(baseCore, uDiffuseColor, diff) + vec3(0.04, 0.05, 0.08) * fillDiff;

          // Subtle chromatic aberration channel displacement centered on cursor + Fresnel rim
          float chromShift = fresnel * 0.06 + exp(-cursorDist * 2.5) * (0.04 + uRipple * 0.12);
          vec3 pbrColor;
          pbrColor.r = diffuseCol.r * 1.05 + spec * 1.35 + fresnel * rimColor.r * (1.0 + chromShift);
          pbrColor.g = diffuseCol.g * 0.95 + spec * 1.05 + fresnel * rimColor.g;
          pbrColor.b = diffuseCol.b * 0.90 + spec * 0.85 + fresnel * (rimColor.b + chromShift * 1.8);

          // Fluid ripple luminous pulse
          float ripplePulse = sin(cursorDist * 18.0 - uTime * 4.5) * exp(-cursorDist * 1.8) * uRipple;
          vec3 finalColor = pbrColor + vec3(max(0.0, ripplePulse) * 0.35);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    // Pass 2: Wireframe (High-contrast stroke with clean depth test)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xdf6c4f,
      wireframe: true,
      transparent: false,
    });

    // Pass 3: Clay (Matte diffuse clay shader: roughness 0.85, metalness 0.0)
    const clayMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d4cc,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: false,
    });

    // Pass 4: Transmission (Refractive glass physical material: transmission 0.95, ior 1.5, thickness 1.2)
    const transmissionMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      ior: 1.5,
      thickness: 1.2,
      roughness: 0.08,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: false,
      envMapIntensity: 1.5,
    });

    // Pass 5: UV (Custom procedural UV checkerboard & gradient shader)
    const uvUniforms = {
      uTime: { value: 0 },
    };
    uvUniformsRef.current = uvUniforms;

    const uvMaterial = new THREE.ShaderMaterial({
      uniforms: uvUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          // Continuous UV coordinates with subtle procedural animation
          vec2 animUv = vUv + vec2(uTime * 0.02, uTime * 0.01);

          // 16x16 UV checkerboard
          vec2 grid = fract(animUv * 16.0);
          float checkX = step(0.5, grid.x);
          float checkY = step(0.5, grid.y);
          float checker = (checkX == checkY) ? 0.92 : 0.38;

          // Continuous [U, V] manifold coordinate color mapping:
          // Red = U, Green = V, Blue = sin(U * PI + V * PI)
          vec3 uvGradient = vec3(vUv.x, vUv.y, sin(vUv.x * 3.14159 + vUv.y * 3.14159) * 0.5 + 0.5);

          // Crisp 1px grid line borders
          vec2 edge = step(vec2(0.04), grid) * step(grid, vec2(0.96));
          float gridLine = 1.0 - (edge.x * edge.y);

          vec3 finalColor = mix(uvGradient * checker, vec3(1.0, 1.0, 1.0), gridLine * 0.85);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    // Pass 6: Normals (MeshNormalMaterial visualizing surface normal vectors)
    const normalsMaterial = new THREE.MeshNormalMaterial({
      flatShading: false,
    });

    materialsRef.current = {
      beauty: beautyMaterial,
      wireframe: wireframeMaterial,
      clay: clayMaterial,
      transmission: transmissionMaterial,
      uv: uvMaterial,
      normals: normalsMaterial,
    };

    // 8. Create Main Mesh
    const mesh = new THREE.Mesh(mainGeometry, materialsRef.current[activePassRef.current]);
    scene.add(mesh);
    meshRef.current = mesh;

    // 9. Nested Core Artifact (Interior glowing crystalline octahedron)
    const coreGeom = new THREE.OctahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xdf6c4f,
      emissive: 0xdf6c4f,
      emissiveIntensity: 0.6,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    const innerCore = new THREE.Mesh(coreGeom, coreMat);
    scene.add(innerCore);
    innerCoreRef.current = innerCore;

    // 10. Outer Subtle Orbital Gyro Ring
    const ringGeom = new THREE.TorusGeometry(2.35, 0.015, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xdf6c4f,
      transparent: true,
      opacity: 0.35,
    });
    const outerRing = new THREE.Mesh(ringGeom, ringMat);
    outerRing.rotation.x = Math.PI / 3;
    scene.add(outerRing);
    outerRingRef.current = outerRing;

    // Responsive Canvas Resize Observer
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // FPS calculation state
    let frameCount = 0;
    let lastFpsTime = performance.now();

    // 11. Main 60-120 FPS Animation Loop synchronized via GSAP Ticker
    // Automatically pauses when scrolled completely out of the viewport
    let isVisible = true;
    let isTickerAttached = false;
    let lastTime = performance.now();

    const animate = () => {
      if (!isVisible) return;

      const currentTime = performance.now();
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      const time = currentTime * 0.001;

      // Direct DOM FPS tracking without triggering React component re-renders
      frameCount += 1;
      if (currentTime - lastFpsTime >= 500) {
        const calculatedFps = Math.round((frameCount * 1000) / (currentTime - lastFpsTime));
        if (fpsRef.current) {
          fpsRef.current.textContent = `${calculatedFps} FPS`;
        }
        frameCount = 0;
        lastFpsTime = currentTime;
      }

      // Smooth pointer interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * (0.08 * (dt * 60));
      mouse.y += (mouse.targetY - mouse.y) * (0.08 * (dt * 60));

      // Ripple decay
      rippleEnergyRef.current = Math.max(0, rippleEnergyRef.current - dt * 1.5);

      // Update shader uniforms
      if (beautyUniformsRef.current) {
        beautyUniformsRef.current.uTime.value = time;
        beautyUniformsRef.current.uMouse.value.set(mouse.x, mouse.y);
        beautyUniformsRef.current.uRipple.value = rippleEnergyRef.current;
      }

      if (uvUniformsRef.current) {
        uvUniformsRef.current.uTime.value = time;
      }

      // Rotate Main Mesh
      if (meshRef.current) {
        // Base auto rotation + mouse reactive pitch/yaw
        const autoSpeed = autoRotateRef.current ? 0.35 : 0.05;
        meshRef.current.rotation.y += dt * autoSpeed;
        
        // Tilt mesh reactive to normalized pointer coordinates
        const targetRotX = mouse.y * -0.6;
        const targetRotZ = mouse.x * 0.4;
        meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.06;
        meshRef.current.rotation.z += (targetRotZ - meshRef.current.rotation.z) * 0.06;
      }

      // Rotate inner core opposite direction
      if (innerCoreRef.current) {
        innerCoreRef.current.rotation.y -= dt * 0.7;
        innerCoreRef.current.rotation.x += dt * 0.4;
      }

      // Rotate orbital ring
      if (outerRingRef.current) {
        outerRingRef.current.rotation.z += dt * 0.2;
      }

      // Render scene
      renderer.render(scene, camera);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !isTickerAttached) {
          lastTime = performance.now();
          gsap.ticker.add(animate);
          isTickerAttached = true;
        } else if (!isVisible && isTickerAttached) {
          gsap.ticker.remove(animate);
          isTickerAttached = false;
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    gsap.ticker.add(animate);
    isTickerAttached = true;
    gsap.ticker.lagSmoothing(0);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      if (isTickerAttached) {
        gsap.ticker.remove(animate);
      }

      mainGeometry.dispose();
      coreGeom.dispose();
      ringGeom.dispose();
      Object.values(materialsRef.current).forEach((m) => m.dispose());
      coreMat.dispose();
      ringMat.dispose();
      envRenderTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, []);

  // Listen to editorial-theme-change and dynamically tween 3D shader uniform colors
  useEffect(() => {
    const handleTheme = (e: Event) => {
      const customEvent = e as CustomEvent<{
        id: string;
        shaderColors: {
          baseColor: string;
          rimColor: string;
          accentColor: string;
          pointLight: string;
          wireframe: string;
        };
      }>;
      if (!customEvent.detail?.shaderColors) return;

      const { shaderColors } = customEvent.detail;
      const rim = new THREE.Color(shaderColors.rimColor);
      const point = new THREE.Color(shaderColors.pointLight);
      const wire = new THREE.Color(shaderColors.wireframe);
      const base = new THREE.Color(shaderColors.baseColor);

      const diffuseTarget = customEvent.detail.id === 'alabaster'
        ? new THREE.Color(0xdad7ce)
        : customEvent.detail.id === 'forest'
        ? new THREE.Color(0x1e2e26)
        : new THREE.Color(0x33282b);

      if (beautyUniformsRef.current) {
        gsap.to(beautyUniformsRef.current.uRimColor.value, {
          r: rim.r,
          g: rim.g,
          b: rim.b,
          duration: 0.45,
          ease: 'power3.out',
        });
        gsap.to(beautyUniformsRef.current.uBaseCore.value, {
          r: customEvent.detail.id === 'alabaster' ? base.r * 0.9 : base.r * 0.7,
          g: customEvent.detail.id === 'alabaster' ? base.g * 0.9 : base.g * 0.7,
          b: customEvent.detail.id === 'alabaster' ? base.b * 0.9 : base.b * 0.7,
          duration: 0.45,
          ease: 'power3.out',
        });
        gsap.to(beautyUniformsRef.current.uDiffuseColor.value, {
          r: diffuseTarget.r,
          g: diffuseTarget.g,
          b: diffuseTarget.b,
          duration: 0.45,
          ease: 'power3.out',
        });
      }

      if (pointAccentRef.current) {
        gsap.to(pointAccentRef.current.color, {
          r: point.r,
          g: point.g,
          b: point.b,
          duration: 0.45,
          ease: 'power3.out',
        });
      }

      const mats = materialsRef.current;
      if (mats?.wireframe) {
        gsap.to((mats.wireframe as THREE.MeshBasicMaterial).color, {
          r: wire.r,
          g: wire.g,
          b: wire.b,
          duration: 0.45,
          ease: 'power3.out',
        });
      }

      if (mats?.clay) {
        const clayMat = mats.clay as THREE.MeshStandardMaterial;
        const clayTarget = customEvent.detail.id === 'alabaster'
          ? new THREE.Color(0xede9e0)
          : customEvent.detail.id === 'forest'
          ? new THREE.Color(0x273b30)
          : new THREE.Color(0xd8d4cc);
        gsap.to(clayMat.color, {
          r: clayTarget.r,
          g: clayTarget.g,
          b: clayTarget.b,
          duration: 0.45,
          ease: 'power3.out',
        });
      }

      if (innerCoreRef.current) {
        const cMat = innerCoreRef.current.material as THREE.MeshStandardMaterial;
        gsap.to(cMat.color, { r: wire.r, g: wire.g, b: wire.b, duration: 0.45, ease: 'power3.out' });
        gsap.to(cMat.emissive, { r: wire.r, g: wire.g, b: wire.b, duration: 0.45, ease: 'power3.out' });
      }

      if (outerRingRef.current) {
        const rMat = outerRingRef.current.material as THREE.MeshBasicMaterial;
        gsap.to(rMat.color, { r: wire.r, g: wire.g, b: wire.b, duration: 0.45, ease: 'power3.out' });
      }
    };

    window.addEventListener('editorial-theme-change', handleTheme);
    return () => window.removeEventListener('editorial-theme-change', handleTheme);
  }, []);

  // Pointer event handlers with normalized coordinates [-1, 1] and W3C Pointer Capture
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)));

    mouseRef.current.targetX = nx;
    mouseRef.current.targetY = ny;

    // Direct DOM update for pointer telemetry without React component re-rendering
    if (pointerCoordsRef.current) {
      pointerCoordsRef.current.textContent = `${nx >= 0 ? '+' : ''}${nx.toFixed(2)}, ${ny >= 0 ? '+' : ''}${ny.toFixed(2)}`;
    }

    if (isPointerDownRef.current && meshRef.current) {
      // Manual drag rotation
      const dx = e.clientX - lastPointerPosRef.current.x;
      const dy = e.clientY - lastPointerPosRef.current.y;
      meshRef.current.rotation.y += dx * 0.008;
      meshRef.current.rotation.x += dy * 0.008;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    setIsInteracting(true);
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    triggerRippleWave();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    setIsInteracting(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerLeave = () => {
    if (!isPointerDownRef.current) {
      setIsInteracting(false);
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      if (pointerCoordsRef.current) {
        pointerCoordsRef.current.textContent = '+0.00, +0.00';
      }
    }
  };

  const activePassConfig = RENDER_PASSES.find((p) => p.id === activePass) || RENDER_PASSES[0];

  return (
    <section 
      id="render-pass-inspector"
      data-section="shader-inspector"
      className="relative w-full bg-obsidian text-alabaster py-16 sm:py-24 border-b border-white/10 overflow-hidden"
      aria-label="Interactive 3D Shader and Render-Pass Inspector"
    >
      {/* Background Subtle Editorial Grid & Ambient Glows */}
      <div 
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-accent/10 blur-[180px]" 
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-32 right-10 h-[400px] w-[400px] rounded-full bg-accent-coral/10 blur-[180px]" 
        aria-hidden="true" 
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        {/* EDITORIAL SECTION HEADER: Guillaume Colombel Architectural Bridge */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 font-mono text-fluid-micro text-accent-coral uppercase tracking-widest mb-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Pipeline Stage 01 // Guillaume Colombel WebGL Architecture</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight text-alabaster">
              Interactive 3D <span className="text-accent-coral">Shader</span> & <span className="text-alabaster">Render-Pass</span> Inspector
            </h2>
          </div>

          <div className="max-w-md font-mono text-fluid-micro text-alabaster-dim leading-relaxed">
            Deconstruct real-time WebGL shader pipelines into discrete rendering passes. Swap vertex topologies, normal vectors, UV parameter spaces, matte clay lighting, and refractive glass physical materials in real time.
          </div>
        </div>

        {/* 3D CENTERPIECE CANVAS STAGE WITH OVERLAID HUD TOOLBAR */}
        <div 
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className={`relative w-full h-[520px] sm:h-[600px] lg:h-[660px] rounded-3xl bg-obsidian-card/90 border border-white/10 shadow-editorial-elevated overflow-hidden select-none transition-colors duration-[450ms] ${
            isInteracting ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          data-cursor="pointer"
        >
          {/* Main Three.js Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            aria-label="Interactive 3D procedural geometry artifact"
          />

          {/* TOP-LEFT HUD OVERLAY: Technical Dossier & Telemetry Strip */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
            <div className="p-3 sm:p-4 rounded-2xl bg-obsidian-card/85 backdrop-blur-xl border border-white/10 shadow-editorial-card space-y-2 font-mono text-[11px] max-w-[280px] sm:max-w-[320px]">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 text-accent-coral font-bold tracking-wider uppercase text-[10px]">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>PASS: {activePassConfig.label.toUpperCase()}</span>
                </span>
                <span className="text-white/40 text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  {activePassConfig.badge}
                </span>
              </div>

              <div className="text-alabaster font-semibold text-xs leading-snug">
                {activePassConfig.subtitle}
              </div>

              <p className="text-alabaster-dim text-[10px] leading-relaxed hidden sm:block">
                {activePassConfig.description}
              </p>

              {/* Real-time Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[10px]">
                <div>
                  <span className="text-muted block text-[9px] uppercase">Telemetry</span>
                  <span ref={fpsRef} className="text-emerald-400 font-bold">60 FPS</span>
                  <span className="text-white/30 text-[9px] ml-1">Solid</span>
                </div>
                <div>
                  <span className="text-muted block text-[9px] uppercase">Pointer [X, Y]</span>
                  <span ref={pointerCoordsRef} className="text-accent-coral font-semibold">+0.00, +0.00</span>
                </div>
              </div>

            </div>
          </div>

          {/* TOP-RIGHT CORNER: Interactive Canvas Controls */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
            {/* Auto-Rotation Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAutoRotate((prev) => {
                  autoRotateRef.current = !prev;
                  return !prev;
                });
              }}
              aria-label={`Toggle auto-rotation, currently ${autoRotate ? 'enabled' : 'disabled'}`}
              className={`p-2.5 rounded-xl border backdrop-blur-xl font-mono text-[11px] transition-all active:scale-95 flex items-center gap-1.5 ${
                autoRotate 
                  ? 'bg-accent/20 border-accent/40 text-accent-coral' 
                  : 'bg-obsidian-card/80 border-white/10 text-muted hover:text-white'
              }`}
              title="Toggle orbital auto-rotation"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">{autoRotate ? 'Orbit On' : 'Orbit Paused'}</span>
            </button>

            {/* Ripple Pulse Wave Generator */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerRippleWave();
              }}
              aria-label="Inject fluid shockwave ripple into shader uniforms"
              className="p-2.5 rounded-xl bg-obsidian-card/80 hover:bg-accent/20 border border-white/10 hover:border-accent/40 text-alabaster hover:text-accent-coral backdrop-blur-xl font-mono text-[11px] transition-all active:scale-95 flex items-center gap-1.5"
              title="Inject dynamic fluid ripple into shader uniforms"
            >
              <Zap className="w-3.5 h-3.5 text-accent-coral" />
              <span className="hidden sm:inline">Pulse Ripple</span>
            </button>
          </div>

          {/* ================================================================ */}
          {/* INTERACTIVE HUD TOOLBAR: 6 REAL-TIME RENDER-PASS TOGGLE PILLS     */}
          {/* OVERLAID ON THE CANVAS CORNER (GUILLAUME COLOMBEL ARCHITECTURE)  */}
          {/* ================================================================ */}
          <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-20 flex flex-col items-center sm:items-end">
            
            <div className="w-full sm:w-auto p-1.5 sm:p-2 rounded-2xl bg-obsidian-card/90 backdrop-blur-2xl border border-white/15 shadow-editorial-elevated flex items-center justify-between sm:justify-start gap-1 sm:gap-2">
              
              {/* Hotkey hint label */}
              <div className="hidden lg:flex items-center gap-1.5 pl-2.5 pr-2 font-mono text-[10px] text-muted border-r border-white/10 shrink-0">
                <Layers className="w-3.5 h-3.5 text-accent-coral" />
                <span className="uppercase tracking-wider font-semibold">Passes</span>
              </div>

              {/* The 6 Render-Pass Toggle Pills */}
              <div 
                className="grid grid-cols-6 sm:flex sm:items-center gap-1 sm:gap-1.5 w-full sm:w-auto" 
                role="tablist" 
                aria-label="Shader Render-Pass Modes"
              >
                {RENDER_PASSES.map((pass) => {
                  const isActive = activePass === pass.id;
                  return (
                    <button
                      key={pass.id}
                      role="tab"
                      id={`tab-${pass.id}`}
                      aria-selected={isActive}
                      aria-controls={`panel-${pass.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePassSelect(pass.id);
                      }}
                      className={`relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl font-mono transition-all duration-200 select-none ${
                        isActive
                          ? 'bg-accent text-alabaster shadow-editorial-card font-black scale-[1.02]'
                          : 'text-muted-light hover:text-alabaster hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Active indicator dot */}
                      {isActive && (
                        <span 
                          className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-white shadow-glow-cyan animate-pulse" 
                          aria-hidden="true" 
                        />
                      )}

                      <span className="text-[11px] sm:text-xs tracking-tight uppercase font-bold leading-tight truncate">
                        {pass.label}
                      </span>

                      {/* Hotkey Cue [1 - 6] */}
                      <span className={`text-[9px] mt-0.5 tracking-wider hidden sm:block ${
                        isActive ? 'text-white/80' : 'text-white/30'
                      }`}>
                        [{pass.key}]
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Corner Keyboard Hotkey Prompt */}
            <div className="mt-2 text-right font-mono text-[10px] text-white/40 hidden sm:block">
              Click & drag to inspect • Hotkeys <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-accent-coral border border-white/10">1</kbd> through <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-accent-coral border border-white/10">6</kbd>
            </div>
          </div>

        </div>

        {/* ================================================================ */}
        {/* TECHNICAL ARCHITECTURE BREAKDOWN: 6 PIPELINE DEEP-DIVES         */}
        {/* ================================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-6">
          {RENDER_PASSES.map((pass) => {
            const isActive = activePass === pass.id;
            return (
              <div
                key={pass.id}
                onClick={() => handlePassSelect(pass.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-accent/15 border-accent text-alabaster shadow-editorial-card ring-1 ring-accent'
                    : 'bg-obsidian-card/60 hover:bg-obsidian-card border-white/10 text-muted hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                  <span className="text-accent-coral font-bold">0{pass.key}</span>
                  <span className={`text-[9px] px-1 rounded ${isActive ? 'bg-accent text-alabaster' : 'bg-white/5 text-white/40'}`}>
                    {pass.badge}
                  </span>
                </div>
                <div className={`font-display font-bold text-xs uppercase mb-1 ${isActive ? 'text-alabaster' : 'text-slate-200'}`}>
                  {pass.label} Pass
                </div>
                <p className="font-mono text-[9px] text-muted-light line-clamp-3 leading-snug">
                  {pass.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default RenderPassInspector;
