import React, { useRef, useEffect, forwardRef } from 'react';
import gsap from 'gsap';

export interface MagneticProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  textStrength?: number;
  as?: React.ElementType;
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

/**
 * Magnetic vector physics wrapper component for navigation links, social pills, and primary CTAs.
 * Pipes pointer offset from element center into gsap.quickTo setters (duration: 0.4, ease: 'power3.out').
 * Springs elastically back to (0, 0) on mouseleave using elastic.out(1, 0.3).
 */
export const Magnetic = forwardRef<HTMLElement, MagneticProps>(({
  children,
  className = '',
  strength = 0.35,
  textStrength = 0.15,
  as: Component = 'div',
  disabled = false,
  onMouseMove,
  onMouseLeave,
  ...props
}, forwardedRef) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);

  const quickX = useRef<gsap.QuickToFunc | null>(null);
  const quickY = useRef<gsap.QuickToFunc | null>(null);
  const textQuickX = useRef<gsap.QuickToFunc | null>(null);
  const textQuickY = useRef<gsap.QuickToFunc | null>(null);

  // Track active spring tweens to prevent fighting quickTo on mouse re-entry
  const springRef = useRef<gsap.core.Tween | null>(null);
  const textSpringRef = useRef<gsap.core.Tween | null>(null);

  const setElementRef = (node: HTMLElement | null) => {
    elementRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Initialize gsap.quickTo setters with duration: 0.4, ease: 'power3.out', force3D: true
    quickX.current = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out', force3D: true });
    quickY.current = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out', force3D: true });

    if (textRef.current) {
      textQuickX.current = gsap.quickTo(textRef.current, 'x', { duration: 0.4, ease: 'power3.out', force3D: true });
      textQuickY.current = gsap.quickTo(textRef.current, 'y', { duration: 0.4, ease: 'power3.out', force3D: true });
    }

    return () => {
      springRef.current?.kill();
      textSpringRef.current?.kill();
      gsap.killTweensOf(el);
      if (textRef.current) {
        gsap.killTweensOf(textRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    if (typeof window !== 'undefined') {
      const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isTouchOnly || prefersReducedMotion) {
        onMouseMove?.(e);
        return;
      }
    }

    const el = elementRef.current;
    if (!el) return;

    // Kill any active spring tween from previous mouseleave so it doesn't fight quickTo
    if (springRef.current) {
      springRef.current.kill();
      springRef.current = null;
    }
    if (textSpringRef.current) {
      textSpringRef.current.kill();
      textSpringRef.current = null;
    }

    // Calculate pointer offset from element stationary center
    const rect = el.getBoundingClientRect();
    const currentX = Number(gsap.getProperty(el, 'x')) || 0;
    const currentY = Number(gsap.getProperty(el, 'y')) || 0;
    const left = rect.left - currentX;
    const top = rect.top - currentY;
    const deltaX = e.clientX - (left + rect.width / 2);
    const deltaY = e.clientY - (top + rect.height / 2);

    // Pipe deltaX * 0.35 and deltaY * 0.35 into quickTo setters
    quickX.current?.(deltaX * strength);
    quickY.current?.(deltaY * strength);

    // Inner text span parallax
    if (textRef.current) {
      textQuickX.current?.(deltaX * textStrength);
      textQuickY.current?.(deltaY * textStrength);
    }

    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    const el = elementRef.current;
    if (!el) return;

    // Spring element and inner text span back to (0, 0) using elastic.out(1, 0.3)
    springRef.current = gsap.to(el, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.3)',
      overwrite: 'auto',
    });

    if (textRef.current) {
      textSpringRef.current = gsap.to(textRef.current, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.3)',
        overwrite: 'auto',
      });
    }

    onMouseLeave?.(e);
  };

  return (
    <Component
      ref={setElementRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center justify-center will-change-transform ${className}`}
      {...props}
    >
      <span ref={textRef} className="inline-flex items-center gap-1.5 will-change-transform pointer-events-none w-full justify-center">
        {children}
      </span>
    </Component>
  );
});

Magnetic.displayName = 'Magnetic';

export default Magnetic;
