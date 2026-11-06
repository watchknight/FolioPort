import { useRef, useImperativeHandle, forwardRef } from 'react';
import gsap from 'gsap';

export interface SvgCurtainHandle {
  wipe: (onCovered: () => void, onComplete?: () => void) => void;
}

export const SvgCurtain = forwardRef<SvgCurtainHandle, {}>((_props, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const isAnimatingRef = useRef(false);

  // SVG paths for Bézier wipe transition:
  // Starts flat at bottom: M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z
  // Curves upward: M 0 100 Q 50 0 100 100 L 100 100 L 0 100 Z
  // Covers screen: M 0 0 Q 50 0 100 0 L 100 100 L 0 100 Z
  // Exits to top: M 0 0 Q 50 0 100 0 L 100 0 L 0 0 Z

  const wipe = (onCovered: () => void, onComplete?: () => void) => {
    if (isAnimatingRef.current) return;
    const path = pathRef.current;
    const container = containerRef.current;
    if (!path || !container) {
      onCovered();
      if (onComplete) onComplete();
      return;
    }

    isAnimatingRef.current = true;
    container.style.pointerEvents = 'auto';

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.to(container, {
        autoAlpha: 1,
        duration: 0.2,
        onComplete: () => {
          onCovered();
          gsap.to(container, {
            autoAlpha: 0,
            duration: 0.2,
            delay: 0.1,
            onComplete: () => {
              isAnimatingRef.current = false;
              container.style.pointerEvents = 'none';
              if (onComplete) onComplete();
            },
          });
        },
      });
      return;
    }

    // GSAP Flip paired timeline duration: 0.75s, power4.inOut
    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        container.style.pointerEvents = 'none';
        if (onComplete) onComplete();
      },
    });

    // Mathematically continuous SVG Bézier paths with identical command structure
    // Step 0: Flat bottom
    const flatBottom = 'M 0 100 L 100 100 L 100 100 Q 50 100 0 100 Z';
    // Step 1: Upward rising curve
    const curveIn = 'M 0 100 L 100 100 L 100 50 Q 50 -20 0 50 Z';
    // Step 2: Full screen coverage
    const flatFullBottomPinned = 'M 0 100 L 100 100 L 100 0 Q 50 0 0 0 Z';
    const flatFullTopPinned = 'M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z';
    // Step 3: Upward lifting bottom curve
    const curveOut = 'M 0 0 L 100 0 L 100 50 Q 50 -20 0 50 Z';
    // Step 4: Flat top exit
    const flatTop = 'M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z';

    // Step 1: Wipe in from bottom (0.35s)
    tl.set(path, { attr: { d: flatBottom } })
      .to(path, {
        attr: { d: curveIn },
        duration: 0.22,
        ease: 'power4.in',
      })
      .to(path, {
        attr: { d: flatFullBottomPinned },
        duration: 0.15,
        ease: 'power4.out',
        onComplete: () => {
          // Switch to top-pinned equivalent at peak full-screen coverage
          gsap.set(path, { attr: { d: flatFullTopPinned } });
          // View swap at peak coverage
          onCovered();
        },
      })
      // Step 2: Wipe out to top (0.38s)
      .to(path, {
        attr: { d: curveOut },
        duration: 0.22,
        ease: 'power3.in',
        delay: 0.05,
      })
      .to(path, {
        attr: { d: flatTop },
        duration: 0.16,
        ease: 'power4.out',
      });
  };

  useImperativeHandle(ref, () => ({
    wipe,
  }));

  return (
    <div
      ref={containerRef}
      className="svg-wipe-curtain fixed inset-0 z-[100] pointer-events-none w-screen h-screen overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="curtainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-rust, #A74024)" />
            <stop offset="100%" stopColor="var(--bg-obsidian, #0A0A0A)" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          fill="url(#curtainGrad)"
          d="M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z"
        />
      </svg>
    </div>
  );
});

SvgCurtain.displayName = 'SvgCurtain';
