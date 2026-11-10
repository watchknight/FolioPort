import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getOrInitLenis } from '../hooks/useLenis';
import { watchknightAudio as audioEngine } from '../audio/WatchknightAudioEngine';

export interface PreloaderProps {
  onCurtainLifting?: () => void;
  onComplete?: () => void;
}

/**
 * 9 Multilingual Greetings for Dennis Snellenberg / Colombel Choreography
 * Strictly includes: Bengali (স্বাগতম), English, Japanese, French, Arabic, Spanish, German, Mandarin, and Dutch.
 */
export const GREETINGS = [
  { text: 'স্বাগতম', lang: 'BN', sub: 'DHAKA, BD // 23.7644° N, 90.4252° E' },
  { text: 'Hello', lang: 'EN', sub: 'CHRONOMETRIC SENTINEL // TIMEBASE 1000HZ' },
  { text: 'こんにちは', lang: 'JA', sub: 'TOKYO SECTOR // SPATIAL CANVASES' },
  { text: 'Bonjour', lang: 'FR', sub: 'ATELIER NUMÉRIQUE // ESTHÉTIQUE HORLOGÈRE' },
  { text: 'مرحباً', lang: 'AR', sub: 'ALGORITHMIC LATTICE // ZERO-GRAVITY' },
  { text: 'Hola', lang: 'ES', sub: 'ARQUITECTURA ESPACIAL // ESTADO VERIFICADO' },
  { text: 'Guten Tag', lang: 'DE', sub: 'HOROLOGISCHE PRÄZISION // SYSTEME' },
  { text: '你好', lang: 'ZH', sub: 'GRAPH TRAVERSAL // SENTINEL CORE' },
  { text: 'Welkom', lang: 'NL', sub: 'AMSTERDAM REEF // VITAL SIGNS NOMINAL' },
];

export const Preloader: React.FC<PreloaderProps> = ({ onCurtainLifting, onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const clipPathRef = useRef<SVGPathElement | null>(null);
  const counterTextRef = useRef<HTMLSpanElement | null>(null);
  const [greetingIdx, setGreetingIdx] = useState<number>(0);
  const [counterValue, setCounterValue] = useState<string>('000');
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    // 1. Lock smooth scroll immediately on boot
    const lenis = getOrInitLenis();
    if (lenis) {
      lenis.stop();
    }
    if (window.__lenis) {
      window.__lenis.stop();
    }
    document.body.style.overflow = 'hidden';

    // 2. Reduced motion bypass
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (window.__lenis) window.__lenis.start();
      document.body.style.overflow = '';
      if (containerRef.current) {
        gsap.set(containerRef.current, { autoAlpha: 0, pointerEvents: 'none' });
      }
      setIsFinished(true);
      onCurtainLifting?.();
      window.dispatchEvent(new CustomEvent('hero-reveal'));
      onComplete?.();
      return;
    }

    const container = containerRef.current;
    const svgPath = pathRef.current;
    const clipPath = clipPathRef.current;
    if (!container || !svgPath) return;

    // 4. GSAP Master Orchestration Timeline
    let lastIdx = 0;
    const progressObj = { count: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(container, { autoAlpha: 0, pointerEvents: 'none' });
        setIsFinished(true);
        if (window.__lenis) {
          window.__lenis.start();
        }
        document.body.style.overflow = '';
        onComplete?.();
      },
    });

    // Step A1: Precision Horological Counter (000 -> 099%) & 9 Greetings
    tl.to(progressObj, {
      count: 99,
      duration: 1.55,
      ease: 'power3.inOut',
      onUpdate: () => {
        const val = Math.min(99, Math.round(progressObj.count));
        const formatted = String(val).padStart(3, '0');
        if (counterTextRef.current) {
          counterTextRef.current.innerText = formatted;
        }
        if (container) {
          container.setAttribute('aria-valuenow', String(val));
        }

        // Advance through 9 greetings
        const currentIdx = Math.min(8, Math.floor((val / 100) * GREETINGS.length));
        if (currentIdx !== lastIdx) {
          lastIdx = currentIdx;
          setGreetingIdx(currentIdx);

          // Subtle horological click tick if audio engine is unlocked
          if (audioEngine.isEngineUnlocked()) {
            audioEngine.playHoverTick(0);
          }
        }
      },
    });

    // Step A3: Complete horological calibration to 100%
    tl.to(progressObj, {
      count: 100,
      duration: 0.22,
      ease: 'power2.out',
      onUpdate: () => {
        const val = Math.min(100, Math.round(progressObj.count));
        const formatted = String(val).padStart(3, '0');
        if (counterTextRef.current) {
          counterTextRef.current.innerText = formatted;
        }
        if (container) {
          container.setAttribute('aria-valuenow', String(val));
        }
        setCounterValue(formatted);
      },
    });

    // Brief dwell at 100%
    tl.to({}, { duration: 0.12 });

    // Step B: Fade out textual layer prior to curtain reveal
    tl.to('.preloader-content', {
      autoAlpha: 0,
      y: -24,
      duration: 0.28,
      ease: 'power3.out',
    });

    // Step C: Trigger audio transition swoosh when curtain lifts (if audio engine is unlocked)
    tl.add(() => {
      if (audioEngine.isEngineUnlocked()) {
        audioEngine.playTransitionSwoosh(0.55);
      }
    });

    // Step D: Animate SVG clip-path and curved curtain upward with power4.inOut
    const curveState = { progress: 0 };
    tl.to(
      curveState,
      {
        progress: 1,
        duration: 1.1,
        ease: 'power4.inOut',
        onUpdate: () => {
          const p = curveState.progress;
          // y-coordinate of bottom edge translates from 1000 down to 0
          const y = (1 - p) * 1000;
          // Dynamic Bézier arch apex reaches peak mid-motion
          const arch = Math.sin(p * Math.PI) * 440;
          const d = `M 0 0 L 1000 0 L 1000 ${y} Q 500 ${y - arch} 0 ${y} Z`;

          svgPath.setAttribute('d', d);
          if (clipPath) {
            clipPath.setAttribute('d', d);
          }
        },
      },
      '-=0.06'
    );

    // Step E: Stagger Hero entrance 0.3s before preloader curtain finishes lifting
    tl.add(() => {
      onCurtainLifting?.();
      window.dispatchEvent(new CustomEvent('hero-reveal'));
    }, '-=0.3');

    // Final cleanup at timeline end
    tl.set(container, { autoAlpha: 0, pointerEvents: 'none' });
    tl.call(() => {
      if (window.__lenis) {
        window.__lenis.start();
      }
      document.body.style.overflow = '';
      setIsFinished(true);
      onComplete?.();
    });

    return () => {
      tl.kill();

      if (window.__lenis) {
        window.__lenis.start();
      }
      document.body.style.overflow = '';
    };
  }, [onCurtainLifting, onComplete]);

  return (
    <div
      ref={containerRef}
      onPointerDown={() => {
        if (!audioEngine.isEngineUnlocked()) {
          audioEngine.initContext();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: isFinished ? 'none' : 'all',
      }}
      className="flex flex-col justify-between overflow-hidden select-none bg-transparent"
      aria-label="Portfolio Horological Calibration Curtain"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={parseInt(counterValue, 10)}
    >
      {/* Curved SVG Curtain with clipPath definition */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="preloader-curtain-clip" clipPathUnits="userSpaceOnUse">
            <path
              ref={clipPathRef}
              d="M 0 0 L 1000 0 L 1000 1000 Q 500 1000 0 1000 Z"
            />
          </clipPath>
        </defs>
        <g clipPath="url(#preloader-curtain-clip)">
          <rect width="1000" height="1000" fill="#090A0D" />
        </g>
        <path
          ref={pathRef}
          fill="#090A0D"
          d="M 0 0 L 1000 0 L 1000 1000 Q 500 1000 0 1000 Z"
        />
      </svg>

      {/* Preloader Horological Content Overlay */}
      <div className="preloader-content relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10 md:p-14">
        {/* Top Header Telemetry Strip */}
        <div className="flex items-center justify-between text-muted font-mono text-fluid-micro uppercase tracking-widest border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--pixel-phosphor-green, #4AF626)' }}
            />
            <span className="text-alabaster font-bold tracking-wider">
              WATCHKNIGHT // ARCHITECTURE ATELIER
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="text-[#8E98AA]">CHRONOMETRIC CALIBRATION</span>
            <span className="text-white/20">|</span>
            <span className="text-alabaster font-semibold">1000 Hz TIMEBASE</span>
          </div>
        </div>

        {/* Center: Dynamic Multilingual Greeting Sequence */}
        <div className="my-auto text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-3 sm:gap-5">
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-glow-accent animate-ping"
              style={{
                backgroundColor: 'var(--tech-magenta-crest, #FF2A85)',
                animationDuration: '2.5s',
              }}
            />
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl md:text-8xl tracking-tight text-alabaster">
              {GREETINGS[greetingIdx]?.text}
            </h1>
          </div>
          <p className="mt-4 font-mono text-fluid-micro uppercase tracking-widest text-[#8E98AA]">
            [{GREETINGS[greetingIdx]?.lang}] • {GREETINGS[greetingIdx]?.sub}
          </p>
        </div>

        {/* Bottom Coordinates & Precision Horological Counter (000 -> 100%) */}
        <div className="flex items-end justify-between border-t border-white/10 pt-4 sm:pt-6">
          <div className="font-mono text-fluid-micro text-[#8E98AA] flex flex-col gap-1">
            <span className="text-alabaster font-semibold tracking-wider">
              EAST WEST UNIVERSITY // CSE DEPT
            </span>
            <span>DHAKA, BANGLADESH • 23.7644° N, 90.4252° E • UTC+6</span>
          </div>

          {/* Precision Horological Counter (000 -> 100%) */}
          <div className="font-mono font-black text-5xl sm:text-6xl md:text-7xl text-alabaster tracking-tighter leading-none flex items-baseline tabular-nums">
            <span ref={counterTextRef}>{counterValue}</span>
            <span
              className="text-2xl sm:text-3xl ml-1 font-bold"
              style={{ color: 'var(--tech-magenta-crest, #FF2A85)' }}
            >
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
