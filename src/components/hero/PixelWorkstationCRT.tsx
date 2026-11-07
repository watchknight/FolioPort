import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';
import { Activity, Compass, MapPin, Monitor, RefreshCw } from 'lucide-react';

export type DisplayMode = 'avatar' | 'photo';
export type AvatarAction = 'idle' | 'coding' | 'slash';

export interface PixelWorkstationCRTProps {
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
  imageSrc?: string;
  initialMode?: DisplayMode;
  avatarAction?: AvatarAction;
  onModeChange?: (mode: DisplayMode) => void;
}

// 8x8 Bayer Dither Matrix normalized to 0..63 for vintage PC-98 / DOS dither dissolve
const BAYER_8X8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

// Miniature monitor scrolling code lines
const CODE_SNIPPETS = [
  'void init_watchknight_os() {',
  '  posix_shm_init(&kernel);',
  '  alloc_phys_pages(0x9600);',
  '  mount_vfs("/dev/cyberdeck");',
  '  c_cpp_subsystem_boot();',
  '  gl_wave_particles(14400);',
  '  bind_port(9042, "DHAKA");',
  '  watchknight_ready();',
  '}',
  '// LIVE TELEMETRY: 23°N 90°E',
  'while(sys_alive) {',
  '  poll_neural_events();',
  '  render_crt_frame();',
  '}',
];

export const PixelWorkstationCRT: React.FC<PixelWorkstationCRTProps> = ({
  className = '',
  imageSrc = '/image_0.png',
  initialMode = 'avatar',
  avatarAction: controlledAvatarAction,
  onModeChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenAvatarRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenPhotoRef = useRef<HTMLCanvasElement | null>(null);

  // Display mode: 'avatar' (8-bit procedurally animated scene) vs 'photo' (quantized 16-bit CRT portrait)
  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
  const [isDegaussing, setIsDegaussing] = useState<boolean>(false);
  const [internalAction, setInternalAction] = useState<AvatarAction>('idle');
  const [isHddActive, setIsHddActive] = useState<boolean>(false);

  const activeAction = controlledAvatarAction ?? internalAction;

  // Sync state/props to refs for closure-free, leak-free 60fps render loop
  const activeActionRef = useRef<AvatarAction>(activeAction);
  useEffect(() => {
    activeActionRef.current = activeAction;
    if (activeAction === 'slash') {
      slashProgressRef.current = 0.01;
    }
  }, [activeAction]);

  const isHddActiveRef = useRef<boolean>(isHddActive);
  useEffect(() => {
    isHddActiveRef.current = isHddActive;
  }, [isHddActive]);

  const isDegaussingRef = useRef<boolean>(false);
  useEffect(() => {
    isDegaussingRef.current = isDegaussing;
  }, [isDegaussing]);

  // Transition & Animation state (kept in refs for high-performance 60fps render loop)
  const transitionProgressRef = useRef<number>(initialMode === 'avatar' ? 0.0 : 1.0);
  const targetTransitionRef = useRef<number>(initialMode === 'avatar' ? 0.0 : 1.0);
  const isTransitioningRef = useRef<boolean>(false);

  // Mouse tracking relative to canvas center (-1.0 to 1.0)
  const mouseNormRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const realPhotoImgRef = useRef<HTMLImageElement | null>(null);
  const photoLoadedRef = useRef<boolean>(false);
  const photoImageDataRef = useRef<ImageData | null>(null);
  const dissolveBufferRef = useRef<ImageData | null>(null);

  // Procedural animation frame counters
  const frameCountRef = useRef<number>(0);
  const codeLineOffsetRef = useRef<number>(0);
  const slashProgressRef = useRef<number>(0);
  const steamPuffsRef = useRef<Array<{ x: number; y: number; life: number; seed: number }>>([
    { x: 221, y: 154, life: 0.2, seed: 1 },
    { x: 221, y: 150, life: 0.5, seed: 2 },
    { x: 221, y: 146, life: 0.8, seed: 3 },
  ]);
  const codeSparksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);

  // Load real portrait photo and pre-process for 16-bit CRT scanline & phosphor quantization
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      realPhotoImgRef.current = img;
      photoLoadedRef.current = true;
      preparePhotoCanvas(img);
    };
    img.onerror = () => {
      // Fallback: retry with relative path or keep procedural avatar
      photoLoadedRef.current = false;
    };

    return () => {
      realPhotoImgRef.current = null;
    };
  }, [imageSrc]);

  // Pre-render quantized 16-bit CRT photo to offscreen canvas
  const preparePhotoCanvas = (img: HTMLImageElement) => {
    const w = 320;
    const h = 240;
    let offCanvas = offscreenPhotoRef.current;
    if (!offCanvas) {
      offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      offscreenPhotoRef.current = offCanvas;
    }
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    offCtx.imageSmoothingEnabled = false;
    offCtx.clearRect(0, 0, w, h);

    // Compute aspect-ratio cover crop centered on subject face
    const imgAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    const targetAspect = w / h;
    let drawW = w;
    let drawH = h;
    let drawX = 0;
    let drawY = 0;

    if (imgAspect > targetAspect) {
      drawH = h;
      drawW = h * imgAspect;
      drawX = (w - drawW) * 0.5;
    } else {
      drawW = w;
      drawH = w / imgAspect;
      drawY = (h - drawH) * 0.22; // bias vertically towards face
    }

    offCtx.drawImage(img, drawX, drawY, drawW, drawH);

    // Process 16-bit CRT quantization & phosphor tinting
    try {
      const imgData = offCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      for (let y = 0; y < h; y++) {
        const isScanline = y % 2 === 1;
        const scanlineDim = isScanline ? 0.76 : 1.0;

        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let r = data[idx];
          let g = data[idx + 1];
          let b = data[idx + 2];

          // 16-bit RGB 565 quantization: 5-bit Red, 6-bit Green, 5-bit Blue
          r = Math.floor(r / 8) * 8;
          g = Math.floor(g / 4) * 4;
          b = Math.floor(b / 8) * 8;

          // Subtle NTSC cyber-phosphor tint: boost cyan & green
          g = Math.min(255, Math.floor(g * 1.04));
          b = Math.min(255, Math.floor(b * 1.06));

          // Scanline darkening
          r = Math.floor(r * scanlineDim);
          g = Math.floor(g * scanlineDim);
          b = Math.floor(b * scanlineDim);

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
      offCtx.putImageData(imgData, 0, 0);

      // Vignette overlay
      const grad = offCtx.createRadialGradient(w * 0.5, h * 0.5, h * 0.35, w * 0.5, h * 0.5, h * 0.75);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(7, 8, 20, 0.65)');
      offCtx.fillStyle = grad;
      offCtx.fillRect(0, 0, w, h);

      // Cache processed photo ImageData for high-performance Bayer dither dissolve
      photoImageDataRef.current = offCtx.getImageData(0, 0, w, h);
    } catch {
      // Safe fallback if cross-origin tainted
    }
  };

  // Handle external avatar action events (e.g. from bracket menu keys or custom events)
  useEffect(() => {
    const handleCustomAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: AvatarAction }>;
      if (customEvent.detail?.action) {
        setInternalAction(customEvent.detail.action);
        if (customEvent.detail.action === 'slash') {
          slashProgressRef.current = 0.01;
          setTimeout(() => {
            setInternalAction('idle');
          }, 700);
        } else if (customEvent.detail.action === 'coding') {
          setIsHddActive(true);
          setTimeout(() => {
            setIsHddActive(false);
          }, 800);
        }
      }
    };

    window.addEventListener('wk-avatar-action', handleCustomAction);
    return () => {
      window.removeEventListener('wk-avatar-action', handleCustomAction);
    };
  }, []);

  // Track pointer across window to drive avatar eyes/head
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;

      const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth * 0.5)));
      const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight * 0.5)));
      mouseNormRef.current = { x: normX, y: normY };
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Trigger Hardware Mode Toggle (Avatar <-> Real Photo) with Bayer Dither Dissolve
  const toggleDisplayMode = useCallback(() => {
    const nextMode: DisplayMode = displayMode === 'avatar' ? 'photo' : 'avatar';
    setDisplayMode(nextMode);
    onModeChange?.(nextMode);

    // Audio click feedback with horological escapement
    watchknightAudio.playSpatialClick(0, 0, -1);

    // Blink HDD light
    setIsHddActive(true);
    setTimeout(() => setIsHddActive(false), 600);

    // Animate Bayer Dither Dissolve Progress
    isTransitioningRef.current = true;
    targetTransitionRef.current = nextMode === 'photo' ? 1.0 : 0.0;

    gsap.killTweensOf(transitionProgressRef);
    gsap.to(transitionProgressRef, {
      current: targetTransitionRef.current,
      duration: 0.65,
      ease: 'power2.inOut',
      onComplete: () => {
        isTransitioningRef.current = false;
      },
    });
  }, [displayMode, onModeChange]);

  // Trigger CRT Degauss Effect
  const handleDegauss = useCallback(() => {
    if (isDegaussing) return;
    setIsDegaussing(true);
    watchknightAudio.playSpatialClick(0, 0, -0.5);

    setTimeout(() => {
      setIsDegaussing(false);
    }, 450);
  }, [isDegaussing]);

  // MAIN PROCEDURAL PIXEL ART RENDER LOOP (320x240 native buffer)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Create offscreen canvas for avatar procedural scene
    let avatarCanvas = offscreenAvatarRef.current;
    if (!avatarCanvas) {
      avatarCanvas = document.createElement('canvas');
      avatarCanvas.width = 320;
      avatarCanvas.height = 240;
      offscreenAvatarRef.current = avatarCanvas;
    }
    const actx = avatarCanvas.getContext('2d');
    if (!actx) return;
    actx.imageSmoothingEnabled = false;

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    visibilityObserver.observe(canvas);

    const render = () => {
      if (!isVisible) return;
      frameCountRef.current += 1;
      const f = frameCountRef.current;
      const actx = offscreenAvatarRef.current?.getContext('2d');
      if (!actx) return;

      const W = 320;
      const H = 240;

      // =========================================================================
      // 1. RENDER 8-BIT PROCEDURAL SCENE TO AVATAR CANVAS
      // =========================================================================
      actx.imageSmoothingEnabled = false;
      actx.clearRect(0, 0, W, H);

      // A. Dark Room Wall Background (#0D1512 / #131629)
      actx.fillStyle = '#0D1512';
      actx.fillRect(0, 0, W, H);

      // Subtle wall grid tiles
      actx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      actx.lineWidth = 1;
      for (let x = 0; x < W; x += 16) {
        actx.beginPath();
        actx.moveTo(x, 0);
        actx.lineTo(x, 160);
        actx.stroke();
      }
      for (let y = 0; y < 160; y += 16) {
        actx.beginPath();
        actx.moveTo(0, y);
        actx.lineTo(W, y);
        actx.stroke();
      }

      // B. Retro Cyberdeck Window (X: 185 to 305, Y: 18 to 92)
      actx.fillStyle = '#070814';
      actx.fillRect(185, 18, 120, 74);
      actx.strokeStyle = '#2D3645';
      actx.lineWidth = 2;
      actx.strokeRect(185, 18, 120, 74);

      // Cyber sky gradient & distant skyline
      const skyGrad = actx.createLinearGradient(185, 18, 185, 92);
      skyGrad.addColorStop(0, '#070814');
      skyGrad.addColorStop(0.7, '#190E2C');
      skyGrad.addColorStop(1, '#00F0FF');
      actx.fillStyle = skyGrad;
      actx.globalAlpha = 0.35;
      actx.fillRect(186, 19, 118, 72);
      actx.globalAlpha = 1.0;

      // Twinkling stars in window
      actx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 16; i++) {
        const sx = 190 + ((i * 37 + f * 0.1) % 110);
        const sy = 22 + ((i * 19) % 45);
        const starBlink = (f + i * 11) % 40 < 20 ? 1 : 0;
        if (starBlink) {
          actx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
        }
      }

      // Distant pixel cyber towers
      actx.fillStyle = '#0F1326';
      actx.fillRect(205, 55, 18, 36);
      actx.fillRect(230, 42, 22, 49);
      actx.fillRect(260, 60, 16, 31);
      actx.fillRect(282, 48, 20, 43);

      // Neon antenna beacons
      const beaconOn = (f % 30) < 15;
      actx.fillStyle = beaconOn ? '#FF2A85' : '#4AF626';
      actx.fillRect(240, 39, 2, 3);
      actx.fillRect(291, 45, 2, 3);

      // C. Wall Decorations: Floppy Disk Rack (Left wall, X: 16 to 48, Y: 24 to 76)
      actx.fillStyle = '#1E2338';
      actx.fillRect(16, 24, 34, 52);
      actx.strokeStyle = '#2D3645';
      actx.strokeRect(16, 24, 34, 52);

      // 4 Floppy disks (Cyan, Magenta, Amber, Ivory)
      const floppyColors = ['#00F0FF', '#FF2A85', '#FFCC00', '#F0EFE6'];
      for (let i = 0; i < 4; i++) {
        const fy = 30 + i * 11;
        actx.fillStyle = floppyColors[i];
        actx.fillRect(20, fy, 26, 8);
        actx.fillStyle = '#070814';
        actx.fillRect(24, fy + 2, 12, 4); // label
      }

      // East West University / CSE 1996 Spec Plaque (X: 58 to 110, Y: 24 to 54)
      actx.fillStyle = '#131629';
      actx.fillRect(58, 24, 56, 32);
      actx.strokeStyle = '#00F0FF';
      actx.strokeRect(58, 24, 56, 32);
      actx.fillStyle = '#4AF626';
      actx.fillRect(62, 30, 48, 2);
      actx.fillRect(62, 36, 36, 2);
      actx.fillRect(62, 42, 42, 2);
      actx.fillRect(62, 48, 20, 2);

      // D. Workstation Desk (Y: 162 to 240)
      actx.fillStyle = '#1D1A27';
      actx.fillRect(0, 162, W, 78);

      // Beveled top lip
      actx.fillStyle = '#3E374D';
      actx.fillRect(0, 162, W, 3);
      actx.fillStyle = '#121019';
      actx.fillRect(0, 165, W, 2);

      // E. 90s Computer Tower (X: 12 to 44, Y: 104 to 162)
      actx.fillStyle = '#D6CFC2'; // Bezel Putty
      actx.fillRect(12, 104, 32, 58);
      actx.fillStyle = '#9E988D'; // Shadow bevel
      actx.fillRect(12, 104, 2, 58);
      actx.fillRect(12, 160, 32, 2);

      // 5.25" and 3.5" Floppy slots & CD-ROM bay
      actx.fillStyle = '#1A1822';
      actx.fillRect(17, 110, 22, 5); // 5.25" bay
      actx.fillRect(17, 119, 18, 4); // 3.5" bay
      actx.fillRect(17, 127, 22, 6); // CD-ROM
      actx.fillStyle = '#00F0FF';
      actx.fillRect(35, 130, 2, 1); // CD LED

      // Power switch, Turbo LED & HDD/Power LEDs
      actx.fillStyle = '#FF2A85';
      actx.fillRect(35, 119, 2, 2); // Turbo LED
      actx.fillStyle = isHddActiveRef.current || f % 20 < 8 ? '#FFCC00' : '#443A10';
      actx.fillRect(17, 139, 3, 3); // HDD Amber LED
      actx.fillStyle = '#4AF626';
      actx.fillRect(23, 139, 3, 3); // Power Green LED
      actx.fillStyle = '#2D3645';
      actx.fillRect(31, 137, 6, 6); // Power button

      // F1. DUAL-MONITOR SETUP: PRIMARY MINI CRT (Code Screen, X: 50 to 106, Y: 102 to 154)
      actx.fillStyle = '#D6CFC2';
      actx.fillRect(50, 102, 56, 50); // monitor casing
      actx.fillStyle = '#9E988D';
      actx.fillRect(50, 102, 2, 50);
      actx.fillRect(50, 150, 56, 2);

      // Primary monitor neck & base
      actx.fillStyle = '#B8B0A2';
      actx.fillRect(72, 152, 12, 6);
      actx.fillRect(64, 158, 28, 4);

      // Primary Dark Phosphor Screen (X: 55 to 101, Y: 107 to 147)
      actx.fillStyle = '#07100B';
      actx.fillRect(55, 107, 46, 40);
      actx.strokeStyle = '#00F0FF';
      actx.lineWidth = 1;
      actx.strokeRect(55, 107, 46, 40);

      // Scrolling green phosphor code lines
      if (f % 18 === 0) {
        codeLineOffsetRef.current = (codeLineOffsetRef.current + 1) % CODE_SNIPPETS.length;
      }
      actx.fillStyle = '#4AF626';
      for (let l = 0; l < 5; l++) {
        const lineIdx = (codeLineOffsetRef.current + l) % CODE_SNIPPETS.length;
        const text = CODE_SNIPPETS[lineIdx];
        const lineY = 111 + l * 6;
        const lineLen = Math.min(text.length * 1.8, 38);
        actx.fillRect(58, lineY, lineLen, 2);
        // Random syntax highlight blocks in cyan
        if (l % 2 === 0) {
          actx.fillStyle = '#00F0FF';
          actx.fillRect(58, lineY, 6, 2);
          actx.fillStyle = '#4AF626';
        }
      }

      // Blinking terminal cursor on primary screen
      if (f % 16 < 8) {
        actx.fillStyle = '#4AF626';
        actx.fillRect(80, 137, 3, 3);
      }

      // F2. DUAL-MONITOR SETUP: SECONDARY MINI CRT (Cyber Wave & Telemetry Display, X: 110 to 154, Y: 106 to 154)
      actx.fillStyle = '#C8C1B4'; // Angled casing
      actx.fillRect(110, 106, 44, 46);
      actx.fillStyle = '#9E988D';
      actx.fillRect(110, 106, 2, 46);
      actx.fillRect(110, 150, 44, 2);

      // Secondary monitor neck & base
      actx.fillStyle = '#B8B0A2';
      actx.fillRect(126, 152, 10, 6);
      actx.fillRect(120, 158, 22, 4);

      // Secondary screen (X: 114 to 150, Y: 110 to 146)
      actx.fillStyle = '#070814';
      actx.fillRect(114, 110, 36, 36);
      actx.strokeStyle = '#FF2A85';
      actx.lineWidth = 1;
      actx.strokeRect(114, 110, 36, 36);

      // Mini CRT 2: Header title
      actx.fillStyle = '#FFCC00';
      actx.fillRect(116, 112, 12, 2);

      // Mini CRT 2: Real-time Cyber Wave Oscilloscope
      actx.beginPath();
      actx.strokeStyle = '#00F0FF';
      actx.lineWidth = 1;
      for (let ox = 0; ox < 32; ox += 2) {
        const oy = 126 + Math.sin((ox * 0.4) + (f * 0.12)) * 6 + Math.cos((ox * 0.2) + (f * 0.08)) * 3;
        if (ox === 0) actx.moveTo(116 + ox, oy);
        else actx.lineTo(116 + ox, oy);
      }
      actx.stroke();

      // Mini CRT 2: Secondary wave crest in Magenta
      actx.beginPath();
      actx.strokeStyle = '#FF2A85';
      actx.lineWidth = 1;
      for (let ox = 0; ox < 32; ox += 3) {
        const oy = 136 + Math.sin((ox * 0.3) - (f * 0.15)) * 4;
        if (ox === 0) actx.moveTo(116 + ox, oy);
        else actx.lineTo(116 + ox, oy);
      }
      actx.stroke();

      // Mini CRT 2: Telemetry status dot
      actx.fillStyle = f % 20 < 10 ? '#4AF626' : '#FF2A85';
      actx.fillRect(144, 112, 3, 3);

      // G. Keyboard & Mouse (X: 58 to 152, Y: 168 to 186)
      actx.fillStyle = '#D6CFC2';
      actx.fillRect(60, 168, 68, 16);
      actx.fillStyle = '#9E988D';
      actx.fillRect(60, 168, 2, 16);
      actx.fillRect(60, 182, 68, 2);

      // Keyboard key rows
      actx.fillStyle = '#2D3645';
      for (let kx = 64; kx < 124; kx += 4) {
        actx.fillRect(kx, 171, 2, 2);
        actx.fillRect(kx, 175, 2, 2);
        actx.fillRect(kx, 179, 2, 2);
      }

      // Mousepad & Mouse
      actx.fillStyle = '#131629';
      actx.fillRect(134, 170, 18, 18);
      actx.fillStyle = '#D6CFC2';
      actx.fillRect(138, 173, 9, 12);
      actx.fillStyle = '#9E988D';
      actx.fillRect(142, 173, 1, 5); // mouse button split

      // Mouse cable curving to computer tower
      actx.strokeStyle = '#2D3645';
      actx.lineWidth = 1;
      actx.beginPath();
      actx.moveTo(142, 173);
      actx.quadraticCurveTo(126, 164, 44, 150);
      actx.stroke();

      // H. Floating Pixel Coffee Mug (Levitating with sinusoidal anti-gravity hover)
      const mugBobY = Math.round(Math.sin(f * 0.08) * 3);
      const mugY = 150 + mugBobY;

      // Anti-gravity emitter ring & shadow on desk at Y = 163
      actx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      actx.fillRect(217, 163, 13, 2);
      actx.fillStyle = 'rgba(7, 8, 20, 0.45)';
      actx.fillRect(219, 164, 9, 1);

      // Mug body & handle hovering above desk
      actx.fillStyle = '#F0EFE6';
      actx.fillRect(217, mugY, 12, 11); // mug body
      actx.fillRect(229, mugY + 2, 3, 7); // handle
      actx.fillStyle = '#00F0FF';
      actx.fillRect(220, mugY + 4, 6, 4); // @wk logo mark

      // Animated rising steam puffs
      steamPuffsRef.current.forEach((puff, idx) => {
        puff.life += 0.02;
        if (puff.life > 1.0) {
          puff.life = 0.0;
          puff.x = 221 + Math.sin(f * 0.1 + idx) * 3;
          puff.y = mugY - 2;
        }
        const py = mugY - 2 - puff.life * 18;
        const px = puff.x + Math.sin(f * 0.15 + puff.seed) * 2;
        const alpha = Math.max(0, 1.0 - puff.life);
        actx.fillStyle = `rgba(240, 239, 230, ${alpha * 0.6})`;
        actx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      });

      // =========================================================================
      // I. THE @WATCHKNIGHT PIXEL AVATAR CHARACTER
      // =========================================================================
      // Position: Center-Right (X: 146 to 206, Y: 84 to 200)
      const lookNorm = mouseNormRef.current;
      const headShiftX = Math.round(lookNorm.x * 2);
      const headShiftY = Math.round(lookNorm.y * 1);

      // 4-frame breathing idle loop
      const breathFrame = Math.floor((f % 60) / 15); // 0, 1, 2, 3
      const breathY = breathFrame === 1 || breathFrame === 2 ? -1 : 0;

      // Chair backrest behind avatar
      actx.fillStyle = '#1A1828';
      actx.fillRect(160, 96, 32, 68);
      actx.fillStyle = '#2D3645';
      actx.fillRect(164, 88, 24, 10); // headrest
      actx.fillStyle = '#00F0FF';
      actx.fillRect(166, 92, 20, 2); // neon chair highlight

      // Avatar Torso & Cyberdeck Coat (#131629 with Cyan & Magenta neon trim)
      const torsoY = 120 + breathY;
      actx.fillStyle = '#131629';
      actx.fillRect(162, torsoY, 28, 44);

      // Coat shoulders & collar
      actx.fillStyle = '#1E2338';
      actx.fillRect(158, torsoY + 2, 36, 12);

      // Cyan neon lapel stripes
      actx.fillStyle = '#00F0FF';
      actx.fillRect(172, torsoY + 4, 2, 28);
      actx.fillRect(178, torsoY + 4, 2, 28);

      // Magenta shoulder epaulets
      actx.fillStyle = '#FF2A85';
      actx.fillRect(158, torsoY + 3, 5, 3);
      actx.fillRect(189, torsoY + 3, 5, 3);

      // Head & Face (X: 168 + headShiftX, Y: 94 + breathY + headShiftY)
      const headX = 168 + headShiftX;
      const headY = 94 + breathY + headShiftY;

      // Neck
      actx.fillStyle = '#E2B08C';
      actx.fillRect(172 + headShiftX, headY + 20, 8, 6);

      // Face base (Skin tone #FAD5B8)
      actx.fillStyle = '#FAD5B8';
      actx.fillRect(headX, headY + 6, 16, 16);
      // Jawline / shadow
      actx.fillStyle = '#DCA080';
      actx.fillRect(headX + 2, headY + 20, 12, 2);

      // Anime / Cyberdeck Hair (Jet black #0D111A with cyan specular highlight)
      actx.fillStyle = '#0D111A';
      actx.fillRect(headX - 3, headY, 22, 8); // top hair
      actx.fillRect(headX - 4, headY + 4, 6, 14); // left hair
      actx.fillRect(headX + 14, headY + 4, 6, 14); // right hair
      actx.fillRect(headX, headY + 6, 16, 3); // bangs forehead
      actx.fillRect(headX + 2, headY + 9, 3, 4); // bang strand left
      actx.fillRect(headX + 11, headY + 9, 3, 4); // bang strand right

      // Cyan hair highlight streak
      actx.fillStyle = '#00F0FF';
      actx.fillRect(headX + 4, headY + 1, 8, 2);
      actx.fillRect(headX + 12, headY + 3, 4, 2);

      // Eyes & Pupil Cursor-Tracking
      const eyeBlink = f % 180 < 6; // blink every 3s
      if (eyeBlink) {
        // Closed eyelid
        actx.fillStyle = '#544F48';
        actx.fillRect(headX + 3, headY + 12, 4, 1);
        actx.fillRect(headX + 9, headY + 12, 4, 1);
      } else {
        // Eye whites
        actx.fillStyle = '#F0EFE6';
        actx.fillRect(headX + 2, headY + 10, 5, 4);
        actx.fillRect(headX + 9, headY + 10, 5, 4);

        // Pupils shift with cursor
        const pupilDx = Math.max(-1, Math.min(1, Math.round(lookNorm.x)));
        const pupilDy = Math.max(-1, Math.min(1, Math.round(lookNorm.y)));
        actx.fillStyle = '#070814';
        actx.fillRect(headX + 3 + pupilDx, headY + 11 + pupilDy, 3, 3);
        actx.fillRect(headX + 10 + pupilDx, headY + 11 + pupilDy, 3, 3);

        // Pupil specular sparks
        actx.fillStyle = '#00F0FF';
        actx.fillRect(headX + 3 + pupilDx, headY + 11 + pupilDy, 1, 1);
        actx.fillRect(headX + 10 + pupilDx, headY + 11 + pupilDy, 1, 1);
      }

      // Cyber decker headphones around neck / ears
      actx.fillStyle = '#FF2A85';
      actx.fillRect(headX - 5, headY + 9, 3, 8); // left earcup
      actx.fillRect(headX + 18, headY + 9, 3, 8); // right earcup
      actx.fillStyle = '#2D3645';
      actx.fillRect(headX - 3, headY - 2, 22, 2); // headband

      // Arms & Hands: Dynamic state based on activeAction ('idle' | 'coding' | 'slash')
      const currentAction = activeActionRef.current;
      if (currentAction === 'coding') {
        // CODING ANIMATION: Hands frantically alternate tapping keyboard keys
        const typeFrame = f % 6 < 3 ? 0 : 1;
        const leftHandY = typeFrame === 0 ? 170 : 173;
        const rightHandY = typeFrame === 0 ? 173 : 170;

        actx.fillStyle = '#1E2338';
        // Left arm stretching to keyboard
        actx.fillRect(156, torsoY + 14, 10, 16);
        actx.fillRect(146, leftHandY - 6, 14, 8);
        actx.fillStyle = '#FAD5B8';
        actx.fillRect(138, leftHandY, 8, 5); // left hand

        // Right arm stretching to keyboard
        actx.fillStyle = '#1E2338';
        actx.fillRect(186, torsoY + 14, 10, 16);
        actx.fillRect(180, rightHandY - 6, 14, 8);
        actx.fillStyle = '#FAD5B8';
        actx.fillRect(174, rightHandY, 8, 5); // right hand

        // Code Sparks bursting from keyboard keys (capped to 30 max)
        if (f % 2 === 0 && codeSparksRef.current.length < 30) {
          codeSparksRef.current.push({
            x: 130 + Math.random() * 50,
            y: 170,
            vx: (Math.random() - 0.5) * 3,
            vy: -2 - Math.random() * 3,
            life: 1.0,
            color: Math.random() > 0.4 ? '#00F0FF' : '#4AF626',
          });
        }
      } else if (currentAction === 'slash') {
        // ENERGY SLASH ANIMATION: Raising hand with glowing aura and energy crescent arc
        slashProgressRef.current = Math.min(1.0, slashProgressRef.current + 0.05);
        const sp = slashProgressRef.current;

        // Raised right arm
        actx.fillStyle = '#1E2338';
        actx.fillRect(186, torsoY + 6, 12, 12);
        actx.fillRect(194, torsoY - 4, 10, 14);
        actx.fillStyle = '#FAD5B8';
        actx.fillRect(200, torsoY - 10, 8, 8);

        // Glowing Energy Aura around hand
        actx.fillStyle = f % 4 < 2 ? '#00F0FF' : '#FF2A85';
        actx.fillRect(196, torsoY - 14, 16, 16);
        actx.fillStyle = '#FFFFFF';
        actx.fillRect(200, torsoY - 10, 8, 8);

        // Brilliant curved Energy Slash Arc sweeping across the screen
        const slashRadius = 30 + sp * 85;
        const slashAngle = -Math.PI * 0.4 + sp * Math.PI * 0.8;
        const slashX = 200 - Math.cos(slashAngle) * slashRadius;
        const slashY = (torsoY - 5) + Math.sin(slashAngle) * (slashRadius * 0.6);

        actx.save();
        actx.beginPath();
        actx.arc(200, torsoY - 5, slashRadius, -Math.PI * 0.4, slashAngle);
        actx.lineWidth = 4;
        actx.strokeStyle = '#00F0FF';
        actx.stroke();

        actx.beginPath();
        actx.arc(200, torsoY - 5, slashRadius - 2, -Math.PI * 0.35, slashAngle);
        actx.lineWidth = 2;
        actx.strokeStyle = '#FF2A85';
        actx.stroke();
        actx.restore();

        // Energy slash impact burst sparks
        for (let s = 0; s < 4; s++) {
          actx.fillStyle = s % 2 === 0 ? '#00F0FF' : '#FFCC00';
          const sparkOffset = (s * 7 + f * 5) % 18;
          actx.fillRect(Math.floor(slashX + sparkOffset), Math.floor(slashY - sparkOffset), 2, 2);
        }
      } else {
        // IDLE STATE: Hands resting forward near desk/keyboard
        actx.fillStyle = '#1E2338';
        actx.fillRect(160, torsoY + 12, 10, 18);
        actx.fillRect(182, torsoY + 12, 10, 18);
        actx.fillStyle = '#FAD5B8';
        actx.fillRect(162, torsoY + 28, 8, 5);
        actx.fillRect(182, torsoY + 28, 8, 5);
      }

      // Update & Render Code Sparks
      for (let i = codeSparksRef.current.length - 1; i >= 0; i--) {
        const spark = codeSparksRef.current[i];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life -= 0.04;
        if (spark.life <= 0) {
          codeSparksRef.current.splice(i, 1);
        } else {
          actx.fillStyle = spark.color;
          actx.fillRect(Math.floor(spark.x), Math.floor(spark.y), 2, 2);
        }
      }

      // =========================================================================
      // 2. COMPOSITE FINAL FRAME (BAYER DITHER DISSOLVE BETWEEN AVATAR & PHOTO)
      // =========================================================================
      const progress = transitionProgressRef.current;
      ctx.clearRect(0, 0, W, H);

      // CRT Degauss Screen Jitter offset
      const jitterX = isDegaussingRef.current ? Math.round((Math.random() - 0.5) * 6) : 0;
      const jitterY = isDegaussingRef.current ? Math.round((Math.random() - 0.5) * 4) : 0;

      if (progress <= 0.001) {
        // Pure Avatar Mode (Fast path, direct blit)
        ctx.drawImage(avatarCanvas, jitterX, jitterY);
      } else if (progress >= 0.999 && offscreenPhotoRef.current) {
        // Pure 16-bit Quantized Photo Mode (Fast path, direct blit)
        ctx.drawImage(offscreenPhotoRef.current, jitterX, jitterY);
      } else if (offscreenPhotoRef.current) {
        // DUAL-MODE BAYER DITHER DISSOLVE
        try {
          const avatarData = actx.getImageData(0, 0, W, H);
          const photoData = photoImageDataRef.current;

          if (photoData) {
            if (!dissolveBufferRef.current) {
              dissolveBufferRef.current = ctx.createImageData(W, H);
            }
            const outImg = dissolveBufferRef.current;
            const aBuf = avatarData.data;
            const pBuf = photoData.data;
            const oBuf = outImg.data;

            for (let y = 0; y < H; y++) {
              const bayerRow = (y % 8) * 8;
              for (let x = 0; x < W; x++) {
                const bayerVal = BAYER_8X8[bayerRow + (x % 8)] / 64.0;
                const idx = (y * W + x) * 4;

                const usePhoto = progress >= bayerVal;
                const srcBuf = usePhoto ? pBuf : aBuf;

                oBuf[idx] = srcBuf[idx];
                oBuf[idx + 1] = srcBuf[idx + 1];
                oBuf[idx + 2] = srcBuf[idx + 2];
                oBuf[idx + 3] = 255;
              }
            }
            ctx.putImageData(outImg, jitterX, jitterY);
          } else {
            ctx.drawImage(offscreenPhotoRef.current, jitterX, jitterY);
          }
        } catch {
          // Fallback if cross-origin: smooth globalAlpha cross-fade
          ctx.drawImage(avatarCanvas, jitterX, jitterY);
          ctx.globalAlpha = progress;
          ctx.drawImage(offscreenPhotoRef.current, jitterX, jitterY);
          ctx.globalAlpha = 1.0;
        }
      } else {
        ctx.drawImage(avatarCanvas, jitterX, jitterY);
      }

      // Degauss electromagnetic chromatic flash
      if (isDegaussingRef.current) {
        ctx.fillStyle = f % 2 === 0 ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 42, 133, 0.22)';
        ctx.fillRect(0, 0, W, H);
      }

      // CRT Scanline raster overlay inside canvas (0.05 opacity)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      for (let y = 0; y < H; y += 2) {
        ctx.fillRect(0, y, W, 1);
      }
    };

    gsap.ticker.add(render);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(render);
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="hero-portrait"
      className={`relative w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[380px] xl:max-w-[430px] mx-auto select-none font-mono ${className}`}
      aria-label="Interactive 90s CRT Workstation & Character Scene"
    >
      {/* SLEEK DARK CYBERDECK FRAME (#0D1512 with 2px solid #00F0FF & magenta corner brackets) */}
      <div
        className={`relative w-full bg-[#0D1512] p-2.5 sm:p-3.5 border-2 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25),4px_4px_0_0_#070814] transition-transform duration-200 ${
          isDegaussing ? 'translate-x-1 translate-y-0.5 animate-pulse' : ''
        }`}
        style={{
          boxShadow: `
            inset 1px 1px 0 0 rgba(0, 240, 255, 0.3),
            inset -1px -1px 0 0 rgba(255, 42, 133, 0.3),
            4px 4px 0 0 #070814,
            0 0 20px rgba(0, 240, 255, 0.2)
          `,
        }}
      >
        {/* Magenta corner brackets */}
        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#FF2A85] pointer-events-none" />
        <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#FF2A85] pointer-events-none" />
        <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#FF2A85] pointer-events-none" />
        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#FF2A85] pointer-events-none" />

        {/* MONITOR TOP COOLING VENTS & BRAND EMBOSS */}
        <div className="flex items-center justify-between pb-2 px-1 border-b-2 border-[#2D3645] mb-2">
          {/* Top Cooling Slots */}
          <div className="flex items-center gap-1 opacity-70">
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
          </div>

          {/* Retro Monitor Brand Badge */}
          <div className="font-pixel text-[8px] sm:text-[9px] font-bold text-[#00F0FF] tracking-wider uppercase">
            WATCHKNIGHT // SYS.96 CRT
          </div>

          <div className="flex items-center gap-1 opacity-70">
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
            <span className="w-5 h-1 bg-[#2D3645] shadow-[inset_0_1px_0_#00F0FF]" />
          </div>
        </div>

        {/* INNER WINDOW CHROME SUB-PANEL */}
        <div className="bg-[#131629] border-2 border-[#2D3645] shadow-[inset_2px_2px_0_0_#070814] p-1.5 sm:p-2 mb-2.5">
          {/* Window Titlebar with Controls */}
          <div className="flex items-center justify-between px-2 py-1 bg-[#2D3645] text-[#F0EFE6] text-[10px] mb-1.5 shadow-[inset_1px_1px_0_#D6CFC2]">
            <div className="flex items-center gap-1.5 font-pixel text-[8px] sm:text-[9px]">
              <Monitor className="w-3 h-3 text-[#00F0FF]" />
              <span className="truncate">DEV_WORKSTATION.EXE</span>
            </div>

            {/* Retro [ - ] [ + ] [ x ] Controls */}
            <div className="flex items-center gap-1 text-[9px] font-bold">
              <span className="px-1.5 bg-[#D6CFC2] text-[#070814] shadow-[1px_1px_0_#070814] cursor-pointer hover:bg-white leading-tight">
                _
              </span>
              <span className="px-1.5 bg-[#D6CFC2] text-[#070814] shadow-[1px_1px_0_#070814] cursor-pointer hover:bg-white leading-tight">
                □
              </span>
              <span className="px-1.5 bg-[#FF2A85] text-white shadow-[1px_1px_0_#070814] cursor-pointer leading-tight">
                ×
              </span>
            </div>
          </div>

          {/* CURVED DARK PHOSPHOR CRT SCREEN CONTAINER (#0D1512) */}
          <div
            className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D1512] border-2 border-[#070814] shadow-[inset_0_0_25px_rgba(0,0,0,0.9),0_0_12px_rgba(0,240,255,0.15)]"
            style={{
              borderRadius: '6px',
            }}
          >
            {/* CRISP HTML5 2D PIXEL CANVAS (ctx.imageSmoothingEnabled = false) */}
            <canvas
              ref={canvasRef}
              width={320}
              height={240}
              className="w-full h-full block cursor-crosshair"
              style={{
                imageRendering: 'pixelated',
              }}
              aria-label={
                displayMode === 'avatar'
                  ? 'Procedural 8-bit Pixel Art Developer Scene (@watchknight)'
                  : 'Real CRT Portrait Photo of Abdur Rahman Moayed'
              }
            />

            {/* CRT Glass Reflection Sheen */}
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 25%, transparent 60%),
                  radial-gradient(circle at 50% 50%, transparent 65%, rgba(7, 8, 20, 0.5) 100%)
                `,
              }}
              aria-hidden="true"
            />

            {/* CRT Degauss Screen Flash */}
            {isDegaussing && (
              <div
                className="absolute inset-0 pointer-events-none z-30 animate-pulse bg-gradient-to-r from-[#00F0FF]/30 via-white/50 to-[#FF2A85]/30 mix-blend-screen"
                aria-hidden="true"
              />
            )}

            {/* Corner HUD Pill: Active Mode Badge */}
            <div className="absolute top-2 left-2 z-20 pointer-events-none font-pixel text-[7px] sm:text-[8px] uppercase tracking-wider px-1.5 py-0.5 border border-[#2D3645] bg-[#070814]/85 text-[#F0EFE6] flex items-center gap-1.5 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4AF626] animate-pulse" />
              <span>{displayMode === 'avatar' ? '8-BIT SPRITE' : 'REAL CRT PHOTO'}</span>
            </div>

            {/* Bottom Coordinate Telemetry Stamp */}
            <div className="absolute bottom-2 right-2 z-20 pointer-events-none font-pixel text-[7px] sm:text-[8px] px-1.5 py-0.5 border border-[#2D3645] bg-[#070814]/85 text-[#00F0FF] shadow">
              23.76°N 90.42°E
            </div>
          </div>
        </div>

        {/* HARDWARE BEZEL CONTROLS & DUAL-MODE PORTRAIT SWITCHER */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1">
          {/* HARDWARE TOGGLE BUTTON: [ AVATAR: 8-BIT SPRITE | REAL CRT PHOTO ] */}
          <button
            type="button"
            onClick={toggleDisplayMode}
            className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#D6CFC2] hover:bg-[#F5EFEB] active:bg-[#B8B0A2] text-[#2D3645] font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider border-2 border-[#2D3645] shadow-[2px_2px_0_0_#070814] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            aria-label="Toggle between 8-bit character sprite and real CRT portrait photo"
            title="DUAL-MODE PORTRAIT SWITCHER: [ AVATAR: 8-BIT SPRITE | REAL CRT PHOTO ]"
          >
            <RefreshCw className="w-3 h-3 text-[#FF2A85] group-hover:rotate-180 transition-transform duration-300" />
            <span className="font-bold">
              {displayMode === 'avatar' ? 'PHOTO MODE' : 'AVATAR MODE'}
            </span>
            <span className="text-[7px] text-[#544F48] hidden sm:inline">
              {displayMode === 'avatar' ? '[8-BIT SPRITE]' : '[REAL CRT PHOTO]'}
            </span>
          </button>

          {/* Degauss & Diagnostics Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDegauss}
              className="px-2 py-1 bg-[#D6CFC2] hover:bg-white text-[#2D3645] font-pixel text-[8px] uppercase border border-[#2D3645] shadow-[1px_1px_0_0_#070814] active:translate-y-0.5"
              aria-label="Trigger CRT Degauss"
              title="Degauss CRT Monitor"
            >
              DEGAUSS
            </button>

            {/* Hardware LEDs */}
            <div className="flex items-center gap-2 pl-1">
              {/* HDD Access LED */}
              <div className="flex flex-col items-center">
                <span
                  className={`w-2 h-2 rounded-full border border-black/40 transition-colors duration-100 ${
                    isHddActive ? 'bg-[#FFCC00] shadow-[0_0_6px_#FFCC00]' : 'bg-[#5A4800]'
                  }`}
                />
                <span className="text-[7px] text-[#2D3645] font-bold">HDD</span>
              </div>

              {/* Power LED */}
              <div className="flex flex-col items-center">
                <span className="w-2 h-2 rounded-full bg-[#4AF626] border border-black/40 shadow-[0_0_6px_#4AF626]" />
                <span className="text-[7px] text-[#2D3645] font-bold">PWR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METADATA COORDINATES DIRECTLY BENEATH CRT MONITOR */}
      <div
        className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-[#8E98AA] tracking-wider uppercase font-mono"
        aria-label="Geographic Coordinates & Station Telemetry"
      >
        <div className="flex items-center gap-1.5 text-[#F0EFE6]">
          <Compass className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
          <span className="font-semibold text-xs">23.7644° N, 90.4252° E</span>
        </div>

        <span className="text-white/20 select-none">•</span>

        <div className="flex items-center gap-1.5 text-[#F0EFE6]">
          <MapPin className="w-3.5 h-3.5 text-[#FF2A85] shrink-0" />
          <span className="font-semibold text-xs">Dhaka, BD (UTC+6)</span>
        </div>

        <span className="text-white/20 select-none hidden sm:inline">•</span>

        <div className="hidden sm:flex items-center gap-1.5 text-[#4AF626] text-[10px]">
          <Activity className="w-3 h-3 text-[#4AF626] shrink-0" />
          <span className="font-bold">SYS.96_ONLINE</span>
        </div>
      </div>
    </div>
  );
};

export default PixelWorkstationCRT;
