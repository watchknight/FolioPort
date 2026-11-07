import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';
import heroPortraitVert from '../../shaders/heroPortrait.vert.glsl?raw';
import heroPortraitFrag from '../../shaders/heroPortrait.frag.glsl?raw';
import { Compass, MapPin, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface HeroPortraitProps {
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
  imageSrc?: string;
}

const CornerCrosshair: React.FC<{ position: string; label: string }> = ({ position, label }) => (
  <div
    className={`absolute ${position} w-3 h-3 flex items-center justify-center font-mono text-[10px] text-white/60 pointer-events-none select-none z-30`}
    aria-hidden="true"
    data-corner={label}
  >
    <svg
      className="w-3 h-3 text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  </div>
);

export const HeroPortrait: React.FC<HeroPortraitProps> = ({
  className = '',
  triggerRef,
  imageSrc = '/image_0.png',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameWrapperRef = useRef<HTMLDivElement | null>(null);
  const cardFrameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [isWebGLActive, setIsWebGLActive] = useState<boolean>(false);

  // Mutable interactive state (zero garbage collection overhead during rapid pointer tracking)
  const animState = useRef({
    hover: 0,
    velocityMag: 0,
    mouseVelX: 0,
    mouseVelY: 0,
    mouseX: 0.5,
    mouseY: 0.5,
  });

  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerTimeRef = useRef<number>(0);
  const isNearFrameRef = useRef<boolean>(false);
  const isRenderingRef = useRef<boolean>(true);
  const isTouchDeviceRef = useRef<boolean>(false);
  const prefersReducedMotionRef = useRef<boolean>(false);

  // Pre-allocated zero-allocation GSAP setters for rapid pointer tracking & fluid rest decay
  const quickToVelocityMagRef = useRef<((value: number) => void) | null>(null);
  const quickToMouseVelXRef = useRef<((value: number) => void) | null>(null);
  const quickToMouseVelYRef = useRef<((value: number) => void) | null>(null);
  const quickToHoverRef = useRef<((value: number) => void) | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Velocity-Linked Parallax wired to smooth scroll engine (Lenis + GSAP ScrollTrigger)
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    prefersReducedMotionRef.current = prefersReducedMotion;
    if (prefersReducedMotion) return;

    const target = containerRef.current;
    if (!target) return;

    const mm = gsap.matchMedia();

    // Desktop: vertical parallax offset yPercent: -12 to 12
    mm.add('(min-width: 1024px)', () => {
      const triggerElement = triggerRef?.current || '#hero';

      const tween = gsap.fromTo(
        target,
        { yPercent: -5, force3D: true },
        {
          yPercent: 5,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: triggerElement,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    // Mobile / Touch devices fallback: Clean CSS/GSAP parallax scale
    mm.add('(max-width: 1023px)', () => {
      const triggerElement = triggerRef?.current || '#hero';
      const frameTarget = cardFrameRef.current || target;

      const tween = gsap.fromTo(
        frameTarget,
        { scale: 0.98, yPercent: -4, force3D: true },
        {
          scale: 1.04,
          yPercent: 4,
          ease: 'none',
          force3D: true,
          scrollTrigger: {
            trigger: triggerElement,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, [triggerRef]);

  // WebGL Fluid Displacement Canvas & Shaders
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    const cardFrame = cardFrameRef.current;
    if (!canvas || !cardFrame) return;

    // Detect touch / coarse pointer & reduced motion preference
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    isTouchDeviceRef.current = isTouch;

    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    prefersReducedMotionRef.current = prefersReducedMotion;

    if (prefersReducedMotion) {
      setIsWebGLActive(false);
      return;
    }

    // Try WebGL initialization
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    } catch {
      gl = null;
    }

    if (!gl) {
      // Fallback cleanly to static CSS-enhanced image
      setIsWebGLActive(false);
      return;
    }

    // 1. Setup Three.js Scene, Orthographic Camera & High-Performance Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      rendererRef.current = renderer;
    } catch {
      setIsWebGLActive(false);
      return;
    }

    // 2. Uniforms & ShaderMaterial
    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uPlaneResolution: { value: new THREE.Vector2(400, 533) },
      uImageResolution: { value: new THREE.Vector2(487, 483) },
      uTime: { value: 0.0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVelocity: { value: new THREE.Vector2(0.0, 0.0) },
      uVelocityMag: { value: 0.0 },
      uHover: { value: 0.0 },
      uBeatPulse: { value: 0.0 },
      uAudioBass: { value: 0.0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: heroPortraitVert,
      fragmentShader: heroPortraitFrag,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    geometryRef.current = geometry;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 3. Texture Loading (Mount-safe lifecycle protection)
    let isMounted = true;
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageSrc,
      (tex) => {
        if (!isMounted) {
          tex.dispose();
          return;
        }
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        textureRef.current = tex;

        if (materialRef.current) {
          materialRef.current.uniforms.uTexture.value = tex;
          const imgWidth = tex.image?.naturalWidth || tex.image?.width || 487;
          const imgHeight = tex.image?.naturalHeight || tex.image?.height || 483;
          materialRef.current.uniforms.uImageResolution.value.set(imgWidth, imgHeight);
        }
        setIsWebGLActive(true);
      },
      undefined,
      () => {
        if (isMounted) {
          // Safe fallback to image if network fails
          setIsWebGLActive(false);
        }
      }
    );

    // 4. Resize and Canvas Synchronization
    const handleResize = () => {
      if (!canvas || !cardFrame || !rendererRef.current || !materialRef.current) return;
      const rect = cardFrame.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);

      rendererRef.current.setSize(w, h, false);
      materialRef.current.uniforms.uPlaneResolution.value.set(w, h);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(cardFrame);

    // 5. Visibility and GSAP Ticker Connection (Single RAF Loop Invariant)
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isRenderingRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(cardFrame);

    const render = () => {
      if (
        !isRenderingRef.current ||
        !rendererRef.current ||
        !materialRef.current ||
        !sceneRef.current ||
        !cameraRef.current ||
        !textureRef.current ||
        !materialRef.current.uniforms.uTexture.value
      ) {
        return;
      }

      const time = gsap.ticker.time;
      const u = materialRef.current.uniforms;

      u.uTime.value = time;
      u.uHover.value = animState.current.hover;
      u.uVelocityMag.value = animState.current.velocityMag;
      u.uMouse.value.set(animState.current.mouseX, animState.current.mouseY);
      u.uMouseVelocity.value.set(animState.current.mouseVelX, animState.current.mouseVelY);
      u.uBeatPulse.value = watchknightAudio.uniforms.uBeatPulse.value;
      u.uAudioBass.value = watchknightAudio.uniforms.uAudioBass.value;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    gsap.ticker.add(render);
    gsap.ticker.lagSmoothing(0);

    // 6. Magnetic Hover Physics on Frame (within 120px with Zero-Allocation quickTo)
    const frameWrapper = frameWrapperRef.current;
    const quickToFrameX = gsap.quickTo(cardFrame, 'x', { duration: 0.65, ease: 'power3.out' });
    const quickToFrameY = gsap.quickTo(cardFrame, 'y', { duration: 0.65, ease: 'power3.out' });
    const quickToWrapperX = frameWrapper ? gsap.quickTo(frameWrapper, 'x', { duration: 0.75, ease: 'power3.out' }) : null;
    const quickToWrapperY = frameWrapper ? gsap.quickTo(frameWrapper, 'y', { duration: 0.75, ease: 'power3.out' }) : null;

    // Zero-allocation quickTo setters for fluid velocity decay and hover transitions
    quickToVelocityMagRef.current = gsap.quickTo(animState.current, 'velocityMag', {
      duration: 0.6,
      ease: 'power3.out',
    });
    quickToMouseVelXRef.current = gsap.quickTo(animState.current, 'mouseVelX', {
      duration: 0.6,
      ease: 'power3.out',
    });
    quickToMouseVelYRef.current = gsap.quickTo(animState.current, 'mouseVelY', {
      duration: 0.6,
      ease: 'power3.out',
    });
    quickToHoverRef.current = gsap.quickTo(animState.current, 'hover', {
      duration: 0.35,
      ease: 'power2.out',
    });

    const onWindowPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || isTouchDeviceRef.current || prefersReducedMotionRef.current) return;
      const container = containerRef.current;
      const frame = cardFrameRef.current;
      if (!container || !frame) return;

      // Base bounds reference: Use static container rect to prevent feedback oscillation jitter
      const rect = container.getBoundingClientRect();
      const clampedX = Math.max(rect.left, Math.min(e.clientX, rect.right));
      const clampedY = Math.max(rect.top, Math.min(e.clientY, rect.bottom));
      const dist = Math.hypot(e.clientX - clampedX, e.clientY - clampedY);

      if (dist <= 120) {
        if (!isNearFrameRef.current) {
          isNearFrameRef.current = true;
          const activeTargets = [cardFrameRef.current, frameWrapperRef.current].filter(Boolean);
          gsap.killTweensOf(activeTargets);
        }

        const proximity = 1.0 - dist / 120.0;
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        const relX = (e.clientX - centerX) / (rect.width * 0.5);
        const relY = (e.clientY - centerY) / (rect.height * 0.5);

        // Max force: 15% translation offset on the image frame
        const maxForceX = rect.width * 0.15;
        const maxForceY = rect.height * 0.15;
        const targetX = gsap.utils.clamp(-maxForceX, maxForceX, relX * maxForceX * proximity);
        const targetY = gsap.utils.clamp(-maxForceY, maxForceY, relY * maxForceY * proximity);

        quickToFrameX(targetX);
        quickToFrameY(targetY);

        // Outer frames (corner crosshairs wrapper) gently follow with layered depth (35% force)
        quickToWrapperX?.(targetX * 0.35);
        quickToWrapperY?.(targetY * 0.35);
      } else if (isNearFrameRef.current) {
        isNearFrameRef.current = false;
        const returnTargets = [cardFrameRef.current, frameWrapperRef.current].filter(Boolean);
        gsap.to(returnTargets, {
          x: 0,
          y: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto',
        });
      }
    };

    const onWindowLeave = () => {
      if (isNearFrameRef.current && cardFrameRef.current) {
        isNearFrameRef.current = false;
        const returnTargets = [cardFrameRef.current, frameWrapperRef.current].filter(Boolean);
        gsap.to(returnTargets, {
          x: 0,
          y: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto',
        });
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('blur', onWindowLeave);
    document.addEventListener('mouseleave', onWindowLeave);

    return () => {
      isMounted = false;
      gsap.ticker.remove(render);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('blur', onWindowLeave);
      document.removeEventListener('mouseleave', onWindowLeave);

      quickToVelocityMagRef.current = null;
      quickToMouseVelXRef.current = null;
      quickToMouseVelYRef.current = null;
      quickToHoverRef.current = null;

      if (cardFrameRef.current) {
        gsap.killTweensOf(cardFrameRef.current);
        gsap.set(cardFrameRef.current, { x: 0, y: 0 });
      }
      if (frameWrapperRef.current) {
        gsap.killTweensOf(frameWrapperRef.current);
        gsap.set(frameWrapperRef.current, { x: 0, y: 0 });
      }

      // Complete GPU resource cleanup (zero memory leaks)
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      if (textureRef.current) {
        textureRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss?.();
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      materialRef.current = null;
      geometryRef.current = null;
      textureRef.current = null;
    };
  }, [imageSrc]);

  // Card pointer event listeners: Fluid ripple displacement, chromatic aberration & audio sync
  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || isTouchDeviceRef.current || prefersReducedMotionRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const pannedX = normX * 2.0 - 1.0;

    // Initialize pointer tracking state to prevent delta spikes on first move
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerTimeRef.current = performance.now();

    // Dispatch 80ms-throttled stereo-panned escapement tick
    watchknightAudio.playHoverTick(pannedX);

    quickToHoverRef.current?.(1.0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || isTouchDeviceRef.current || prefersReducedMotionRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const now = performance.now();
    const dt = Math.max((now - lastPointerTimeRef.current) / 1000, 0.016);
    lastPointerTimeRef.current = now;

    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, 1.0 - (e.clientY - rect.top) / rect.height));

    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    animState.current.mouseX = normX;
    animState.current.mouseY = normY;

    // Instantaneous normalized mouse speed
    const speed = Math.hypot(dx, dy) / (rect.width * dt);
    const normalizedSpeed = gsap.utils.clamp(0, 1.0, speed * 0.12);

    animState.current.velocityMag = Math.max(animState.current.velocityMag, normalizedSpeed);
    animState.current.mouseVelX = gsap.utils.clamp(-4.0, 4.0, (dx / (rect.width * dt)) * 0.04);
    animState.current.mouseVelY = gsap.utils.clamp(-4.0, 4.0, (-dy / (rect.height * dt)) * 0.04);

    // Dispatch spatial audio tick based on horizontal positions relative to canvas center
    const pannedX = normX * 2.0 - 1.0; // [-1.0, 1.0]
    if (speed > 0.45) {
      watchknightAudio.playHoverTick(pannedX);
    }

    // Zero-allocation decay of fluid ripple immediately when mouse is at rest (ease: "power3", duration: 0.6)
    quickToVelocityMagRef.current?.(0);
    quickToMouseVelXRef.current?.(0);
    quickToMouseVelYRef.current?.(0);
  };

  const handlePointerLeave = () => {
    quickToHoverRef.current?.(0);
    quickToVelocityMagRef.current?.(0);
    quickToMouseVelXRef.current?.(0);
    quickToMouseVelYRef.current?.(0);
  };

  return (
    <div
      ref={containerRef}
      className={`hero-portrait-container relative w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[300px] xl:max-w-[340px] 2xl:max-w-[380px] mx-auto lg:ml-auto lg:mr-0 select-none ${className}`}
      data-testid="hero-portrait"
    >
      {/* FRAME WRAPPER: Hosts 4 Corner Crosshairs without overflow clipping */}
      <div
        ref={frameWrapperRef}
        className="hero-portrait-frame-wrapper relative w-full aspect-[3/4]"
      >
        {/* STRUCTURAL CORNER BRACKETS (+ CROSSHAIRS) - Positioned at corners, unclipped */}
        <CornerCrosshair position="-top-1.5 -left-1.5" label="top-left" />
        <CornerCrosshair position="-top-1.5 -right-1.5" label="top-right" />
        <CornerCrosshair position="-bottom-1.5 -left-1.5" label="bottom-left" />
        <CornerCrosshair position="-bottom-1.5 -right-1.5" label="bottom-right" />

        {/* DOUBLE-LAYERED OVERFLOW-HIDDEN CONTAINER */}
        <div
          ref={cardFrameRef}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="hero-portrait-frame wk-velocity-item relative aspect-[3/4] w-full h-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#12151C] shadow-editorial-card transform-gpu cursor-pointer"
          style={{
            boxShadow: '0 24px 64px -16px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* BACKGROUND LAYER: Rich textured #12151C placeholder card that scale-fades in first */}
          <div
            className="hero-portrait-bg absolute inset-0 bg-[#12151C] flex flex-col justify-between p-6 pointer-events-none z-0 transform-gpu"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 30%, rgba(184, 74, 39, 0.12), transparent 70%),
                linear-gradient(rgba(242, 239, 233, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(242, 239, 233, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 20px 20px, 20px 20px',
            }}
            aria-hidden="true"
          >
            {/* Blueprint Telemetry Markings */}
            <div className="flex items-center justify-between text-[10px] font-mono text-white/30 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>ATELIER SPEC // 2026</span>
              </span>
              <span>SEC.01</span>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping opacity-60" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              </div>
              <span className="font-mono text-[9px] tracking-widest uppercase text-white/40">
                CALIBRATING SPATIAL OPTICS
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-white/30 uppercase tracking-widest border-t border-white/5 pt-3">
              <span>23.7644° N</span>
              <span>90.4252° E</span>
            </div>
          </div>

          {/* FOREGROUND LAYER: The image/shader uncovered bottom-up via split-mask */}
          <div
            className="hero-portrait-img-mask absolute inset-0 w-full h-full overflow-hidden z-10 transform-gpu"
            style={{
              clipPath: 'inset(100% 0 0 0)',
              WebkitClipPath: 'inset(100% 0 0 0)',
            }}
          >
            {/* INTERACTIVE WEBGL FLUID DISPLACEMENT CANVAS */}
            <canvas
              ref={canvasRef}
              data-testid="hero-portrait-canvas"
              className={`absolute inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-700 ease-out ${
                isWebGLActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden="true"
            />

            {/* STATIC ACCESSIBLE IMAGE LAYER (Fallback for SSR, touch & reduced motion) */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Abdur Rahman Moayed (@watchknight) — Full-Stack Architect & Low-Level Systems Engineer"
              className={`w-full h-full object-cover object-[center_20%] contrast-[1.05] brightness-[0.98] transition-all duration-700 ease-out ${
                isWebGLActive ? 'opacity-0' : 'opacity-100'
              } hover:scale-[1.03]`}
              loading="eager"
              decoding="async"
            />

            {/* Cinematic Vignette Overlay */}
            <div
              className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#090A0D]/80 via-transparent to-black/25 z-20"
              aria-hidden="true"
            />

            {/* Tactical Blueprint HUD Pill in Corner */}
            <div className="absolute top-4 left-4 pointer-events-none font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-alabaster/90 flex items-center gap-2 shadow-sm z-20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wk-verdigris-signal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-wk-verdigris-signal" />
              </span>
              <span className="font-bold">ARCHITECT // @watchknight</span>
            </div>

            {/* Bottom subtle edge coordinate stamp */}
            <div className="absolute bottom-4 right-4 pointer-events-none font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-white/60 z-20">
              SENTINEL // UTC+6
            </div>
          </div>
        </div>
      </div>

      {/* STAGGER-REVEAL METADATA COORDINATES DIRECTLY BENEATH PHOTO */}
      <div
        className="hero-portrait-meta mt-2.5 sm:mt-3 flex items-center justify-between gap-1.5 sm:gap-2 px-1 font-mono text-fluid-micro text-muted tracking-widest uppercase"
        aria-label="Geographic Coordinates & Station Telemetry"
      >
        <div className="hero-portrait-meta-marker flex items-center gap-1.5 text-alabaster-dim">
          <Compass className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="font-semibold text-alabaster">23.7644° N, 90.4252° E</span>
        </div>

        <span className="hero-portrait-meta-divider text-white/20 select-none">•</span>

        <div className="hero-portrait-meta-marker flex items-center gap-1.5 text-alabaster-dim">
          <MapPin className="w-3.5 h-3.5 text-accent-coral shrink-0" />
          <span className="font-semibold text-alabaster">Dhaka, BD</span>
        </div>

        <span className="hero-portrait-meta-divider text-white/20 select-none hidden sm:inline">•</span>

        <div className="hero-portrait-meta-marker hidden sm:flex items-center gap-1.5 text-muted text-[10px]">
          <Activity className="w-3 h-3 text-wk-verdigris-signal shrink-0" />
          <span className="text-wk-verdigris-signal font-semibold">SYS.CALIBRATED</span>
        </div>
      </div>
    </div>
  );
};

export default HeroPortrait;
