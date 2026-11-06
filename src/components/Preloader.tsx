import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { getOrInitLenis } from '../hooks/useLenis';

export interface PreloaderProps {
  onCurtainLifting?: () => void;
  onComplete?: () => void;
}

const GREETINGS = [
  { text: 'Hello', lang: 'EN' },
  { text: 'Bonjour', lang: 'FR' },
  { text: 'Hola', lang: 'ES' },
  { text: 'Ciao', lang: 'IT' },
  { text: 'Olá', lang: 'PT' },
  { text: 'Hallå', lang: 'SE' },
  { text: 'Guten Tag', lang: 'DE' },
  { text: '안녕하세요', lang: 'KR' },
  { text: 'こんにちは', lang: 'JP' },
];

export const Preloader: React.FC<PreloaderProps> = ({ onCurtainLifting, onComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const counterTextRef = useRef<HTMLSpanElement | null>(null);
  const [greetingIdx, setGreetingIdx] = useState<number>(0);
  const [counterValue, setCounterValue] = useState<string>('00');
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    // Ensure Lenis instance exists and lock smooth-scroll immediately
    const lenis = getOrInitLenis();
    if (lenis) {
      lenis.stop();
    }
    if (window.__lenis) {
      window.__lenis.stop();
    }
    document.body.style.overflow = 'hidden';

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
    if (!container || !svgPath) return;

    let lastIdx = 0;

    // Timeline for counter, multilingual greetings, and curtain lift
    const tl = gsap.timeline({
      onComplete: () => {
        // Complete preloader lifecycle: autoAlpha 0 and resume smooth scroll
        gsap.set(container, { autoAlpha: 0, pointerEvents: 'none' });
        setIsFinished(true);
        if (window.__lenis) {
          window.__lenis.start();
        }
        document.body.style.overflow = '';
        onComplete?.();
      },
    });

    const progressObj = { count: 0 };

    // 1. Rapid Sequence of 9 International Greetings & Counter (00 to 100)
    tl.to(progressObj, {
      count: 100,
      duration: 1.85,
      ease: 'power4.inOut',
      onUpdate: () => {
        const val = Math.round(progressObj.count);
        const formatted = String(val).padStart(2, '0');
        if (counterTextRef.current) {
          counterTextRef.current.innerText = formatted;
        }
        setCounterValue(formatted);

        // Advance through 9 greetings
        const currentIdx = Math.min(8, Math.floor((val / 100) * GREETINGS.length));
        if (currentIdx !== lastIdx) {
          lastIdx = currentIdx;
          setGreetingIdx(currentIdx);
        }
      },
    });

    // Brief pause at 100%
    tl.to({}, { duration: 0.12 });

    // 2. Fade out text elements prior to curtain lift with autoAlpha: 0
    tl.to('.preloader-content', {
      autoAlpha: 0,
      y: -20,
      duration: 0.28,
      ease: 'power3.out',
    });

    // 3. Animate SVG <path> bottom curve upward with custom cubic-bezier (power4.inOut)
    const curveState = { progress: 0 };
    tl.to(
      curveState,
      {
        progress: 1,
        duration: 1.1,
        ease: 'power4.inOut',
        onUpdate: () => {
          const p = curveState.progress;
          // y coordinates of bottom edge moves from 1000 to 0
          const y = (1 - p) * 1000;
          // arch height reaches its apex mid-transition, producing a dramatic curved upward scoop
          const arch = Math.sin(p * Math.PI) * 440;
          const d = `M 0 0 L 1000 0 L 1000 ${y} Q 500 ${y - arch} 0 ${y} Z`;
          svgPath.setAttribute('d', d);
        },
      },
      '-=0.08'
    );

    // 4. Stagger Hero vertical entrance starting 0.3s before preloader curtain finishes lifting
    tl.add(() => {
      onCurtainLifting?.();
      window.dispatchEvent(new CustomEvent('hero-reveal'));
    }, '-=0.3');

    // AutoAlpha 0 at timeline end so pointer events pass through cleanly
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: isFinished ? 'none' : 'all',
      }}
      className="flex flex-col justify-between overflow-hidden select-none bg-transparent"
      aria-label="Portfolio Loading Curtain"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={parseInt(counterValue, 10)}
    >
      {/* Curved SVG Curtain Canvas */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          fill="#0A0A0A"
          d="M 0 0 L 1000 0 L 1000 1000 Q 500 1000 0 1000 Z"
        />
      </svg>

      {/* Preloader Content Overlay */}
      <div className="preloader-content relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10 md:p-14">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between text-muted font-mono text-fluid-micro uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-alabaster font-bold">FOLIO // 2026</span>
          </div>
          <div className="hidden sm:block">
            <span>Systems & Spatial Web Architecture</span>
          </div>
        </div>

        {/* Center: Dynamic Multilingual Greeting */}
        <div className="my-auto text-center flex flex-col items-center justify-center">
          <div className="inline-flex items-center gap-3 sm:gap-4">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-accent shrink-0 shadow-glow-accent" />
            <h1 className="font-display font-extrabold text-5xl sm:text-7xl md:text-8xl tracking-tight text-alabaster">
              {GREETINGS[greetingIdx]?.text}
            </h1>
          </div>
          <p className="mt-4 font-mono text-fluid-micro uppercase tracking-widest text-muted">
            {GREETINGS[greetingIdx]?.lang} • Loading Interactive Runtime
          </p>
        </div>

        {/* Bottom Coordinates & Numeric Counter */}
        <div className="flex items-end justify-between border-t border-white/10 pt-4 sm:pt-6">
          <div className="font-mono text-fluid-micro text-muted flex flex-col gap-1">
            <span className="text-alabaster font-semibold">DHAKA, BANGLADESH</span>
            <span>23°48'N 90°25'E • UTC+6</span>
          </div>

          {/* Bottom-right Numeric Progress Counter (00 to 100) */}
          <div className="font-mono font-black text-5xl sm:text-6xl md:text-7xl text-alabaster tracking-tighter leading-none flex items-baseline">
            <span ref={counterTextRef}>{counterValue}</span>
            <span className="text-accent text-2xl sm:text-3xl ml-1 font-bold">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
