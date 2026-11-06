import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const interactiveTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Disable custom cursor on genuine touch-only devices or if user prefers reduced motion
    const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouchOnly || prefersReducedMotion) {
      setIsTouch(true);
      return;
    }

    const onTouchStart = () => {
      setIsTouch(true);
      document.body.classList.remove('cursor-active');
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true, once: true });

    document.body.classList.add('cursor-active');

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Center transforms accurately via GSAP so inline matrix includes -50% translation
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    // GSAP quickTo for zero-overhead, buttery-smooth trailing physics
    const setDotX = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'power3.out', force3D: true });
    const setDotY = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'power3.out', force3D: true });

    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.22, ease: 'power3.out', force3D: true });
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.22, ease: 'power3.out', force3D: true });

    const onMouseMove = (e: MouseEvent) => {
      setIsVisible(true);

      // Sharp center dot always tracks pointer coordinates with razor precision
      setDotX(e.clientX);
      setDotY(e.clientY);

      // Check if hovering/dragging a canvas domain node
      const canvasMode = document.body.getAttribute('data-canvas-mode');
      if (canvasMode === 'grab' || canvasMode === 'grabbing') {
        setIsHovered(true);
        interactiveTargetRef.current = null;
        setRingX(e.clientX);
        setRingY(e.clientY);
        return;
      }

      // Trailing ring features magnetic attraction when hovering compact interactive elements
      if (interactiveTargetRef.current) {
        const rect = interactiveTargetRef.current.getBoundingClientRect();
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;

        // Snappy magnetic pull toward the element's center
        const magneticX = targetCenterX + (e.clientX - targetCenterX) * 0.22;
        const magneticY = targetCenterY + (e.clientY - targetCenterY) * 0.22;

        setRingX(magneticX);
        setRingY(magneticY);
      } else {
        setRingX(e.clientX);
        setRingY(e.clientY);
      }
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    // Track hover on interactive elements (links, buttons, inputs, tabs)
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        'a, button, [role="button"], input, textarea, select, [data-cursor="pointer"], [data-lenis-prevent]'
      );

      if (interactive) {
        const rect = interactive.getBoundingClientRect();
        // Only magnetically snap to compact interactive targets (not full-screen canvases or giant wrappers)
        if (rect.width > 0 && rect.width <= 320 && rect.height <= 140) {
          interactiveTargetRef.current = interactive;
        } else {
          interactiveTargetRef.current = null;
        }
        setIsHovered(true);
      } else {
        interactiveTargetRef.current = null;
        const canvasMode = document.body.getAttribute('data-canvas-mode');
        setIsHovered(Boolean(canvasMode));
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.body.classList.remove('cursor-active');
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  if (isTouch) {
    return null;
  }

  return (
    <div
      className={`custom-cursor-container pointer-events-none fixed inset-0 z-[99999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Sharp Center Dot: razor-sharp precision */}
      <div
        ref={dotRef}
        className={`pointer-events-none fixed top-0 left-0 rounded-full transition-all duration-200 ${
          isHovered
            ? 'h-2 w-2 bg-accent-coral shadow-[0_0_10px_rgba(223,108,79,0.5)] scale-125'
            : 'h-1.5 w-1.5 bg-accent shadow-[0_0_8px_rgba(167,64,36,0.5)]'
        }`}
      />

      {/* Smooth Trailing Outer Ring with mix-blend-mode: difference */}
      <div
        ref={ringRef}
        style={{ mixBlendMode: 'difference' }}
        className={`pointer-events-none fixed top-0 left-0 rounded-full transition-all duration-300 ease-out ${
          isHovered
            ? 'h-14 w-14 border border-white/80 bg-white'
            : 'h-8 w-8 border border-accent/60 bg-transparent'
        }`}
      />
    </div>
  );
};
