// src/motion/CursorController.ts
// Zero-Allocation Cursor Follower, Alchemical Sentinel Galaxy Flask & Shader Uniform Bridge

import gsap from 'gsap';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';

export interface Vec2 {
  x: number;
  y: number;
}

export interface CursorState {
  uMouse: Vec2;
  uMouseVelocity: Vec2;
  raw: Vec2;
}

export interface ShaderUniformsBridge {
  uMouse: { value: Vec2 };
  uMouseVelocity: { value: Vec2 };
}

/**
 * Shared global cursor state exposed for Three.js shader uniform consumption.
 * uMouse is normalized [0.0, 1.0] across viewport dimensions.
 * uMouseVelocity tracks frame-to-frame delta in normalized space.
 */
export const cursorState: CursorState = {
  uMouse: { x: 0.5, y: 0.5 },
  uMouseVelocity: { x: 0.0, y: 0.0 },
  raw: { x: 0, y: 0 },
};

export interface CosmicParticle {
  el: HTMLElement | SVGElement;
  baseX: number;
  currentY: number;
  minY: number;
  maxY: number;
  speed: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  phase: number;
  setX: (val: number) => void;
  setY: (val: number) => void;
}

export interface CursorControllerOptions {
  /**
   * The cursor root portal element.
   */
  cursorEl: HTMLElement;
  /**
   * Optional dedicated preview container. Defaults to cursorEl.
   */
  previewContainer?: HTMLElement | null;
  /**
   * Optional project row selector or elements. Defaults to '.wk-project-row'.
   */
  projectRows?: NodeListOf<HTMLElement> | HTMLElement[] | string;
  /**
   * Proximity radius for magnetic attraction (default 48px).
   */
  proximityRadius?: number;
  /**
   * Duration for pointer tracking quickTo (defaults to 0.28 for backward-compat, 0.14 for portal).
   */
  duration?: number;
  /**
   * Initial scale for cursorEl (defaults to 0).
   */
  initialScale?: number;
  /**
   * Transform origin xPercent (defaults to -50).
   */
  xPercent?: number;
  /**
   * Transform origin yPercent (defaults to -50).
   */
  yPercent?: number;
  /**
   * STATE 1: Cosmic Sentinel Arrow SVG element.
   */
  arrowEl?: HTMLElement | SVGElement | null;
  /**
   * STATE 2: Tuned Galaxy Flask SVG element.
   */
  flaskEl?: HTMLElement | SVGElement | null;
  /**
   * Inner liquid layer <g id="flask-liquid"> for counter-slosh physics.
   */
  liquidEl?: HTMLElement | SVGElement | null;
  /**
   * Terracotta shockwave ring element for pointerdown compression feedback.
   */
  shockwaveEl?: HTMLElement | null;
  /**
   * Constellation micro-star elements.
   */
  starEls?: (HTMLElement | SVGElement)[] | null;
  /**
   * Alchemical verdigris bubble elements.
   */
  bubbleEls?: (HTMLElement | SVGElement)[] | null;
  /**
   * Audio synthesizer engine for hover tick playback.
   */
  audioEngine?: { playHoverTick: (normalizedX: number) => void } | null;
  /**
   * Interactive targets selector triggering Galaxy Flask morph.
   */
  interactiveSelector?: string;
}

export class CursorController {
  public readonly cursorEl: HTMLElement;
  public readonly previewContainer: HTMLElement;
  public readonly xTo: gsap.QuickToFunc;
  public readonly yTo: gsap.QuickToFunc;
  public flaskRotTo: gsap.QuickToFunc | null = null;
  public liquidSloshTo: gsap.QuickToFunc | null = null;

  public arrowEl: HTMLElement | SVGElement | null = null;
  public flaskEl: HTMLElement | SVGElement | null = null;
  public liquidEl: HTMLElement | SVGElement | null = null;
  public shockwaveEl: HTMLElement | null = null;
  public audioEngine: { playHoverTick: (normalizedX: number) => void } | null = null;

  public readonly uMouse: Vec2 = { x: 0.5, y: 0.5 };
  public readonly uMouseVelocity: Vec2 = { x: 0.0, y: 0.0 };
  private prevMouse: Vec2 = { x: 0.5, y: 0.5 };

  private prevClientX: number = 0;
  private hasPrevClientX: boolean = false;
  private lastProcessedX: number = -99999;
  private lastProcessedY: number = -99999;
  private movedThisFrame: boolean = false;
  private isMoving: boolean = false;

  private isFlaskActive: boolean = false;
  private isInteractiveHovered: boolean = false;
  private currentInteractive: HTMLElement | null = null;
  private interactiveSelector: string =
    'a, button, [role="button"], .wk-project-row, [data-cursor="flask"], [data-cursor="pointer"], input, select, textarea';

  private particles: CosmicParticle[] = [];
  private particleTime: number = 0;
  private tickerBound: () => void;

  private currentZIndex: number = 10;
  private isDestroyed: boolean = false;
  private rowListeners: Array<{ row: HTMLElement; enter: () => void; leave: () => void }> = [];
  private activeRow: HTMLElement | null = null;
  private customImages: HTMLImageElement[] | null = null;
  private rowsSelector: string | null = null;

  constructor(options: CursorControllerOptions) {
    this.cursorEl = options.cursorEl;
    this.previewContainer = options.previewContainer || options.cursorEl;
    this.audioEngine = options.audioEngine !== undefined ? options.audioEngine : watchknightAudio;
    if (options.interactiveSelector) {
      this.interactiveSelector = options.interactiveSelector;
    }

    // 1. Initial GSAP state setup (preserves scale: 0 & xPercent/yPercent: -50 invariants)
    gsap.set(this.cursorEl, {
      xPercent: options.xPercent !== undefined ? options.xPercent : -50,
      yPercent: options.yPercent !== undefined ? options.yPercent : -50,
      transformOrigin: '0 0',
      autoAlpha: 1,
      scale: options.initialScale !== undefined ? options.initialScale : 0,
      pointerEvents: 'none',
    });

    if (this.previewContainer !== this.cursorEl) {
      gsap.set(this.previewContainer, {
        scale: 0,
        autoAlpha: 0,
        pointerEvents: 'none',
      });
    }

    // 2. Pre-allocate zero-allocation quickTo setters (duration: 0.28 default, or 0.14 tuned)
    const followDuration = options.duration !== undefined ? options.duration : 0.28;
    this.xTo = gsap.quickTo(this.cursorEl, 'x', { duration: followDuration, ease: 'power3' });
    this.yTo = gsap.quickTo(this.cursorEl, 'y', { duration: followDuration, ease: 'power3' });

    // 3. Attach Galaxy Flask, Arrow, and Liquid setters if provided
    this.arrowEl = options.arrowEl || null;
    this.flaskEl = options.flaskEl || null;
    this.liquidEl = options.liquidEl || null;
    this.shockwaveEl = options.shockwaveEl || null;

    if (this.flaskEl) {
      gsap.set(this.flaskEl, {
        scale: 0.4,
        autoAlpha: 0,
        transformOrigin: '22px 28px',
      });
      this.flaskRotTo = gsap.quickTo(this.flaskEl, 'rotation', {
        duration: 0.4,
        ease: 'elastic.out(1, 0.35)',
      });
    }

    if (this.liquidEl) {
      gsap.set(this.liquidEl, {
        transformOrigin: '22px 28px',
      });
      this.liquidSloshTo = gsap.quickTo(this.liquidEl, 'rotation', {
        duration: 0.55,
        ease: 'elastic.out(1, 0.25)',
      });
    }

    if (this.arrowEl) {
      gsap.set(this.arrowEl, {
        scale: 1,
        autoAlpha: 1,
        transformOrigin: '2px 2px',
      });
    }

    if (this.shockwaveEl) {
      gsap.set(this.shockwaveEl, {
        scale: 0.85,
        autoAlpha: 0,
        transformOrigin: 'center center',
      });
    }

    // Initialize rising particles inside liquid clip-path
    this.initParticles(options.starEls, options.bubbleEls);

    // 4. Attach zero-allocation ticker handler for elastic tilt recovery & bubble drift
    this.tickerBound = () => this.handleTicker();
    gsap.ticker.add(this.tickerBound);

    // 5. Attach pointer & mouse listeners
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
      window.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
      window.addEventListener('pointerup', this.handlePointerUp, { passive: true });
      window.addEventListener('mouseover', this.handleMouseOver, { passive: true });
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('mouseleave', this.handleWindowLeave);
      document.addEventListener('mouseenter', this.handleWindowEnter);
    }

    // 6. Bind project rows with selector tracking for deferred/self-healing binding
    if (typeof options.projectRows === 'string') {
      this.rowsSelector = options.projectRows;
      this.bindProjectRows(options.projectRows);
    } else if (options.projectRows) {
      this.bindProjectRows(options.projectRows);
    } else if (typeof document !== 'undefined') {
      this.rowsSelector = '.wk-project-row';
      this.bindProjectRows('.wk-project-row');
    }
  }

  /**
   * Initializes rising cosmic micro-stars and verdigris alchemical bubbles.
   */
  private initParticles(
    starEls?: (HTMLElement | SVGElement)[] | null,
    bubbleEls?: (HTMLElement | SVGElement)[] | null
  ): void {
    this.particles = [];

    const starConfigs = [
      { baseX: 16, startY: 32, speed: 0.12, wobbleSpeed: 1.2, wobbleAmp: 0.8, phase: 0.0, minY: 24, maxY: 38 },
      { baseX: 27, startY: 35, speed: 0.09, wobbleSpeed: 0.9, wobbleAmp: 0.6, phase: 1.5, minY: 24, maxY: 38 },
      { baseX: 21, startY: 37.5, speed: 0.14, wobbleSpeed: 1.5, wobbleAmp: 1.0, phase: 3.0, minY: 24, maxY: 38 },
      { baseX: 25, startY: 29.5, speed: 0.11, wobbleSpeed: 1.1, wobbleAmp: 0.7, phase: 4.2, minY: 24, maxY: 38 },
    ];

    if (starEls && starEls.length > 0) {
      starEls.forEach((el, i) => {
        const cfg = starConfigs[i % starConfigs.length];
        let curX = cfg.baseX;
        let curY = cfg.startY;
        const setX: (val: number) => void =
          typeof gsap.quickSetter === 'function'
            ? (gsap.quickSetter(el, 'x') as (val: number) => void)
            : (v: number) => {
                curX = v;
                (el as HTMLElement).style.transform = `translate(${curX}px, ${curY}px)`;
              };
        const setY: (val: number) => void =
          typeof gsap.quickSetter === 'function'
            ? (gsap.quickSetter(el, 'y') as (val: number) => void)
            : (v: number) => {
                curY = v;
                (el as HTMLElement).style.transform = `translate(${curX}px, ${curY}px)`;
              };

        setX(cfg.baseX);
        setY(cfg.startY);

        this.particles.push({
          el,
          baseX: cfg.baseX,
          currentY: cfg.startY,
          minY: cfg.minY,
          maxY: cfg.maxY,
          speed: cfg.speed,
          wobbleSpeed: cfg.wobbleSpeed,
          wobbleAmp: cfg.wobbleAmp,
          phase: cfg.phase,
          setX,
          setY,
        });
      });
    }

    const bubbleConfigs = [
      { baseX: 18, startY: 36, speed: 0.18, wobbleSpeed: 2.0, wobbleAmp: 1.2, phase: 0.8, minY: 24, maxY: 39 },
      { baseX: 24.5, startY: 33.5, speed: 0.22, wobbleSpeed: 2.4, wobbleAmp: 1.0, phase: 2.4, minY: 24, maxY: 39 },
    ];

    if (bubbleEls && bubbleEls.length > 0) {
      bubbleEls.forEach((el, i) => {
        const cfg = bubbleConfigs[i % bubbleConfigs.length];
        let curX = cfg.baseX;
        let curY = cfg.startY;
        const setX: (val: number) => void =
          typeof gsap.quickSetter === 'function'
            ? (gsap.quickSetter(el, 'x') as (val: number) => void)
            : (v: number) => {
                curX = v;
                (el as HTMLElement).style.transform = `translate(${curX}px, ${curY}px)`;
              };
        const setY: (val: number) => void =
          typeof gsap.quickSetter === 'function'
            ? (gsap.quickSetter(el, 'y') as (val: number) => void)
            : (v: number) => {
                curY = v;
                (el as HTMLElement).style.transform = `translate(${curX}px, ${curY}px)`;
              };

        setX(cfg.baseX);
        setY(cfg.startY);

        this.particles.push({
          el,
          baseX: cfg.baseX,
          currentY: cfg.startY,
          minY: cfg.minY,
          maxY: cfg.maxY,
          speed: cfg.speed,
          wobbleSpeed: cfg.wobbleSpeed,
          wobbleAmp: cfg.wobbleAmp,
          phase: cfg.phase,
          setX,
          setY,
        });
      });
    }
  }

  /**
   * Attaches SVG elements dynamically if instantiated after construction.
   */
  public attachElements(options: {
    arrowEl?: HTMLElement | SVGElement | null;
    flaskEl?: HTMLElement | SVGElement | null;
    liquidEl?: HTMLElement | SVGElement | null;
    shockwaveEl?: HTMLElement | null;
    starEls?: (HTMLElement | SVGElement)[] | null;
    bubbleEls?: (HTMLElement | SVGElement)[] | null;
  }): void {
    if (options.arrowEl) {
      this.arrowEl = options.arrowEl;
      gsap.set(this.arrowEl, { scale: 1, autoAlpha: 1, transformOrigin: '2px 2px' });
    }
    if (options.flaskEl) {
      this.flaskEl = options.flaskEl;
      gsap.set(this.flaskEl, { scale: 0.4, autoAlpha: 0, transformOrigin: '22px 28px' });
      this.flaskRotTo = gsap.quickTo(this.flaskEl, 'rotation', {
        duration: 0.4,
        ease: 'elastic.out(1, 0.35)',
      });
    }
    if (options.liquidEl) {
      this.liquidEl = options.liquidEl;
      gsap.set(this.liquidEl, { transformOrigin: '22px 28px' });
      this.liquidSloshTo = gsap.quickTo(this.liquidEl, 'rotation', {
        duration: 0.55,
        ease: 'elastic.out(1, 0.25)',
      });
    }
    if (options.shockwaveEl) {
      this.shockwaveEl = options.shockwaveEl;
      gsap.set(this.shockwaveEl, { scale: 0.85, autoAlpha: 0, transformOrigin: 'center center' });
    }

    this.initParticles(options.starEls, options.bubbleEls);
  }

  /**
   * High-frequency pointer and mouse move handler.
   * STRICT ZERO-ALLOCATION INVARIANT:
   * Never invokes gsap.to() or gsap.set() directly inside pointermove/mousemove.
   * Invokes pre-allocated quickTo setters directly and updates normalized shader uniforms.
   */
  public handlePointerMove = (e: MouseEvent | PointerEvent): void => {
    // Deduplicate identical sequential events (e.g. pointermove followed by mousemove at same coord)
    if (e.clientX === this.lastProcessedX && e.clientY === this.lastProcessedY) {
      return;
    }
    this.lastProcessedX = e.clientX;
    this.lastProcessedY = e.clientY;

    // Dynamic self-healing: bind rows if DOM became available after controller construction
    if (this.rowListeners.length === 0 && this.rowsSelector) {
      this.bindProjectRows(this.rowsSelector);
    }

    // Zero-allocation pointer tracking
    this.xTo(e.clientX);
    this.yTo(e.clientY);

    // Compute normalized viewport coordinates [0.0, 1.0]
    const width = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 1080;

    const normX = width > 0 ? Math.max(0, Math.min(1, e.clientX / width)) : 0.5;
    const normY = height > 0 ? Math.max(0, Math.min(1, e.clientY / height)) : 0.5;

    // Frame-to-frame delta for Three.js shader uniforms (vec2)
    const velX = normX - this.prevMouse.x;
    const velY = normY - this.prevMouse.y;

    this.uMouseVelocity.x = velX;
    this.uMouseVelocity.y = velY;
    this.prevMouse.x = normX;
    this.prevMouse.y = normY;

    this.uMouse.x = normX;
    this.uMouse.y = normY;

    // Update shared global state
    cursorState.uMouse.x = normX;
    cursorState.uMouse.y = normY;
    cursorState.uMouseVelocity.x = velX;
    cursorState.uMouseVelocity.y = velY;
    cursorState.raw.x = e.clientX;
    cursorState.raw.y = e.clientY;

    // Zero-allocation horizontal velocity & counter-slosh liquid rotation
    const prevClientX = this.hasPrevClientX ? this.prevClientX : e.clientX;
    this.hasPrevClientX = true;
    this.prevClientX = e.clientX;

    const vx = gsap.utils.clamp(-26, 26, e.clientX - prevClientX);

    if (this.flaskRotTo) {
      this.flaskRotTo(vx * 0.85);
    }
    if (this.liquidSloshTo) {
      this.liquidSloshTo(-vx * 0.65);
    }

    this.movedThisFrame = true;
    this.isMoving = true;
  };

  public handleMouseMove = this.handlePointerMove;

  /**
   * Ticker callback: settles flask tilt & liquid slosh back to 0deg when stopped,
   * and drifts micro-stars & bubbles upward continuously when flask is active.
   */
  private handleTicker = (): void => {
    // 1. Counter-slosh physics settle back to 0deg when pointer movement stops
    if (this.movedThisFrame) {
      this.movedThisFrame = false;
    } else if (this.isMoving) {
      if (this.flaskRotTo) {
        this.flaskRotTo(0);
      }
      if (this.liquidSloshTo) {
        this.liquidSloshTo(0);
      }
      this.isMoving = false;
    }

    // 2. Cosmic Constellation & Rising Bubbles upward drift
    // Preserves CPU / RAF cycles by pausing calculations when flask is hidden
    if (this.particles.length > 0 && (this.isFlaskActive || !this.flaskEl)) {
      this.particleTime += 0.025;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.currentY -= p.speed;
        if (p.currentY < p.minY) {
          p.currentY = p.maxY;
        }
        const offsetX = Math.sin(this.particleTime * p.wobbleSpeed + p.phase) * p.wobbleAmp;
        p.setX(p.baseX + offsetX);
        p.setY(p.currentY);
      }
    }
  };

  /**
   * Pointer down handler: compresses cursor and emits subtle terracotta shockwave ring.
   */
  private handlePointerDown = (): void => {
    if (this.cursorEl) {
      gsap.to(this.cursorEl, {
        scale: 0.85,
        duration: 0.1,
        overwrite: 'auto',
      });
    }
    if (this.shockwaveEl) {
      gsap.killTweensOf(this.shockwaveEl);
      gsap.fromTo(
        this.shockwaveEl,
        { scale: 0.85, autoAlpha: 0.8 },
        { scale: 1.8, autoAlpha: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  };

  /**
   * Pointer up handler: restores cursor scale.
   */
  private handlePointerUp = (): void => {
    if (this.cursorEl) {
      gsap.to(this.cursorEl, {
        scale: 1.0,
        duration: 0.15,
        ease: 'back.out(2)',
        overwrite: 'auto',
      });
    }
  };

  /**
   * Plays the horological escapement hover tick via audioEngine with horizontal spatial pan.
   */
  private playHoverAudio = (e?: MouseEvent | PointerEvent): void => {
    if (this.audioEngine && typeof this.audioEngine.playHoverTick === 'function') {
      const clientX = e ? e.clientX : (this.hasPrevClientX ? this.prevClientX : 0);
      const width = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1920;
      const normalizedX = width > 0 ? (clientX / width) * 2 - 1 : 0;
      const clampedX = Math.max(-1, Math.min(1, normalizedX));
      this.audioEngine.playHoverTick(clampedX);
    }
  };

  /**
   * Transitions cursor state to Tuned Galaxy Flask (State 2) with back.out(1.7) easing
   * and plays the spatial hover tick via audioEngine.
   */
  public transitionToFlask = (e?: MouseEvent | PointerEvent): void => {
    this.playHoverAudio(e);

    if (this.isFlaskActive) return;
    this.isFlaskActive = true;

    if (this.flaskEl) {
      gsap.to(this.flaskEl, {
        scale: 1.0,
        autoAlpha: 1,
        duration: 0.28,
        ease: 'back.out(1.7)',
        overwrite: 'auto',
      });
    }
    if (this.arrowEl) {
      gsap.to(this.arrowEl, {
        scale: 0.4,
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }
  };

  /**
   * Transitions cursor state back to Cosmic Sentinel Arrow (State 1).
   */
  public transitionToArrow = (): void => {
    if (!this.isFlaskActive) return;
    this.isFlaskActive = false;

    if (this.flaskEl) {
      gsap.to(this.flaskEl, {
        scale: 0.4,
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }
    if (this.arrowEl) {
      gsap.to(this.arrowEl, {
        scale: 1.0,
        autoAlpha: 1,
        duration: 0.28,
        ease: 'back.out(1.7)',
        overwrite: 'auto',
      });
    }
  };

  /**
   * Delegated hover tracker for interactive targets.
   * Accurately fires audio feedback across adjacent interactive elements.
   */
  private handleMouseOver = (e: MouseEvent): void => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const interactive =
      typeof target.closest === 'function'
        ? target.closest<HTMLElement>(this.interactiveSelector)
        : null;

    if (interactive) {
      if (this.currentInteractive !== interactive) {
        this.currentInteractive = interactive;
        this.isInteractiveHovered = true;
        this.transitionToFlask(e);
      }
    } else {
      if (this.currentInteractive !== null || this.isInteractiveHovered) {
        this.currentInteractive = null;
        this.isInteractiveHovered = false;
        if (!this.activeRow) {
          this.transitionToArrow();
        }
      }
    }
  };

  private handleWindowLeave = (): void => {
    this.hasPrevClientX = false;
    this.lastProcessedX = -99999;
    this.lastProcessedY = -99999;
    this.isMoving = false;
    this.movedThisFrame = false;

    if (this.flaskRotTo) {
      this.flaskRotTo(0);
    }
    if (this.liquidSloshTo) {
      this.liquidSloshTo(0);
    }

    if (this.cursorEl) {
      gsap.to(this.cursorEl, {
        scale: 1.0,
        autoAlpha: 0,
        duration: 0.2,
        overwrite: 'auto',
      });
    }

    this.currentInteractive = null;
    this.isInteractiveHovered = false;
    if (!this.activeRow) {
      this.transitionToArrow();
    }
  };

  private handleWindowEnter = (): void => {
    if (this.cursorEl) {
      gsap.to(this.cursorEl, {
        autoAlpha: 1,
        duration: 0.2,
        overwrite: 'auto',
      });
    }
  };

  public getIsFlaskActive(): boolean {
    return this.isFlaskActive;
  }

  /**
   * Manually specify or override the target preview images.
   */
  public setPreviewImages(images: HTMLImageElement[]): void {
    this.customImages = images;
  }

  /**
   * Resolves img[data-image] elements within the preview container or global document.
   */
  private getPreviewImages(): HTMLImageElement[] {
    if (this.customImages && this.customImages.length > 0) {
      return this.customImages;
    }
    const container = this.previewContainer || this.cursorEl;
    let images: HTMLImageElement[] = [];
    if (container && typeof container.querySelectorAll === 'function') {
      images = Array.from(container.querySelectorAll<HTMLImageElement>('img[data-image]'));
    }
    if (images.length === 0 && typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      images = Array.from(document.querySelectorAll<HTMLImageElement>('img[data-image]'));
    }
    return images;
  }

  /**
   * Binds mouseenter and mouseleave listeners to project row elements.
   * Supports CSS selector string, HTMLElement array, or NodeList.
   */
  public bindProjectRows(rows: string | NodeListOf<HTMLElement> | HTMLElement[]): void {
    this.unbindProjectRows();

    let elements: HTMLElement[] = [];
    if (typeof rows === 'string') {
      if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
        elements = Array.from(document.querySelectorAll<HTMLElement>(rows));
      }
    } else if (Array.isArray(rows)) {
      elements = rows;
    } else if (rows) {
      elements = Array.from(rows);
    }

    elements.forEach((row, index) => {
      const enter = () => this.handleRowEnter(row, index);
      const leave = () => this.handleRowLeave(row, index);

      row.addEventListener('mouseenter', enter);
      row.addEventListener('mouseleave', leave);
      this.rowListeners.push({ row, enter, leave });
    });
  }

  /**
   * Unbinds active project row hover listeners.
   */
  public unbindProjectRows(): void {
    this.rowListeners.forEach(({ row, enter, leave }) => {
      row.removeEventListener('mouseenter', enter);
      row.removeEventListener('mouseleave', leave);
    });
    this.rowListeners = [];
    this.activeRow = null;
  }

  /**
   * Handles row mouseenter: scales preview container up and cross-fades img[data-image]
   * layers with a 50ms stagger (stagger: 0.05) and dynamic zIndex elevation using overwrite: 'auto'.
   */
  public handleRowEnter(row: HTMLElement, index: number): void {
    this.activeRow = row;
    this.transitionToFlask();

    const rowId =
      row.getAttribute('data-project-id') ||
      row.getAttribute('data-project') ||
      row.getAttribute('data-image') ||
      String(index);

    // Dynamic zIndex elevation: increment layer stack depth
    this.currentZIndex += 1;

    // Scale floating preview container using overwrite: 'auto'
    gsap.to(this.previewContainer, {
      scale: 1,
      autoAlpha: 1,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    if (this.previewContainer !== this.cursorEl) {
      gsap.to(this.cursorEl, {
        scale: 1,
        autoAlpha: 1,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }

    const images = this.getPreviewImages();
    if (images.length > 0) {
      let targetImg = images.find((img) => {
        const imgId =
          img.getAttribute('data-image') ||
          img.getAttribute('data-project-id') ||
          img.getAttribute('data-project');
        return imgId === rowId;
      });

      if (!targetImg) {
        targetImg = images[index % images.length];
      }

      // Elevate active image zIndex above siblings
      if (targetImg) {
        targetImg.style.zIndex = String(this.currentZIndex);
      }

      // Cross-fade images with 50ms stagger (stagger: 0.05) and overwrite: 'auto'
      gsap.to(images, {
        autoAlpha: (_i, el) => (el === targetImg ? 1 : 0),
        stagger: 0.05,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  }

  /**
   * Handles row mouseleave: scales preview container back to 0 using overwrite: 'auto'.
   * Guards against stale leave events when cursor has transitioned directly into an adjacent row.
   */
  public handleRowLeave(row: HTMLElement, _index: number): void {
    // If activeRow has already moved to another row, ignore the stale leave
    if (this.activeRow !== row) {
      return;
    }
    this.activeRow = null;

    if (!this.isInteractiveHovered) {
      this.transitionToArrow();
    }

    // Scale preview container back to scale: 0 using overwrite: 'auto'
    gsap.to(this.previewContainer, {
      scale: 0,
      duration: 0.28,
      ease: 'power2.in',
      overwrite: 'auto',
    });

    if (this.previewContainer !== this.cursorEl) {
      gsap.to(this.cursorEl, {
        scale: 0,
        duration: 0.28,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }

    const images = this.getPreviewImages();
    if (images.length > 0) {
      gsap.to(images, {
        autoAlpha: 0,
        stagger: 0.05,
        duration: 0.2,
        ease: 'power2.in',
        overwrite: 'auto',
      });
    }
  }

  /**
   * Three.js shader uniforms bridge for watchknightProjectPlane GLSL programs.
   */
  public getShaderUniforms(): ShaderUniformsBridge {
    return {
      uMouse: { value: this.uMouse },
      uMouseVelocity: { value: this.uMouseVelocity },
    };
  }

  public getCurrentZIndex(): number {
    return this.currentZIndex;
  }

  public getActiveRow(): HTMLElement | null {
    return this.activeRow;
  }

  /**
   * Teardown & memory cleanup. Reverts tweens and removes all event listeners.
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('pointerdown', this.handlePointerDown);
      window.removeEventListener('pointerup', this.handlePointerUp);
      window.removeEventListener('mouseover', this.handleMouseOver);
    }

    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('mouseleave', this.handleWindowLeave);
      document.removeEventListener('mouseenter', this.handleWindowEnter);
    }

    gsap.ticker.remove(this.tickerBound);

    this.unbindProjectRows();

    if (this.cursorEl) {
      gsap.killTweensOf(this.cursorEl);
    }
    if (this.previewContainer && this.previewContainer !== this.cursorEl) {
      gsap.killTweensOf(this.previewContainer);
    }
    if (this.flaskEl) {
      gsap.killTweensOf(this.flaskEl);
    }
    if (this.arrowEl) {
      gsap.killTweensOf(this.arrowEl);
    }
    if (this.liquidEl) {
      gsap.killTweensOf(this.liquidEl);
    }
    if (this.shockwaveEl) {
      gsap.killTweensOf(this.shockwaveEl);
    }

    const images = this.getPreviewImages();
    images.forEach((img) => gsap.killTweensOf(img));
  }
}

/**
 * Factory helper for initializing CursorController.
 */
export function initCursorController(options: CursorControllerOptions): CursorController {
  return new CursorController(options);
}

export default CursorController;
