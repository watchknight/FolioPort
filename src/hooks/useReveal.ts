import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface UseRevealOptions {
  triggerOnce?: boolean;
  start?: string;
  refreshPriority?: number;
}

/**
 * Declarative Scroll-Reveal Hook (useReveal architecture)
 * 
 * Scopes a container ref and automatically binds GSAP ScrollTrigger animations to any descendant
 * carrying declarative data attributes:
 * - data-anim: fades and rises (autoAlpha: 0, y: 32 to autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out')
 * - data-mask: clip-path wipe reveal (clipPath: 'inset(0 0 100% 0)' to 'inset(0 0 0% 0)', duration: 1.0, ease: 'power4.inOut')
 * - data-stagger: staggers immediate child elements (stagger: 0.08) for matrices and timelines
 * - data-draw: animates SVG or ledger divider lines (scaleX: 0 to 1, transformOrigin: 'left')
 * - data-parallax: applies scrub-linked vertical parallax based on speed multiplier (e.g. data-parallax="0.15")
 * - data-counter: scroll-triggered numeric stat counters (animating from 0 to target integer on scroll enter)
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  externalRef?: React.RefObject<T>,
  options?: UseRevealOptions
): React.RefObject<T> {
  const internalRef = useRef<T | null>(null);
  const containerRef = externalRef || internalRef;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // -------------------------------------------------------------
      // Reduced Motion Mode: Render all elements in revealed state
      // -------------------------------------------------------------
      if (prefersReducedMotion) {
        gsap.set(container.querySelectorAll('[data-anim]'), { autoAlpha: 1, y: 0 });
        gsap.set(container.querySelectorAll('[data-mask]'), { clipPath: 'inset(0 0 0% 0)' });
        gsap.set(container.querySelectorAll('[data-draw]'), { scaleX: 1, transformOrigin: 'left' });

        const staggerParents = container.querySelectorAll<HTMLElement>('[data-stagger]');
        staggerParents.forEach((parent) => {
          gsap.set(parent.children, { autoAlpha: 1, y: 0 });
        });

        const counters = container.querySelectorAll<HTMLElement>('[data-counter]');
        counters.forEach((el) => {
          const target = el.dataset.counterTarget || el.dataset.counter || el.textContent || '0';
          el.textContent = target;
        });

        return;
      }

      const toggleActions = options?.triggerOnce === false ? 'play reverse play reverse' : 'play none none none';

      // -------------------------------------------------------------
      // 1. data-anim & .batch-item: Batched ScrollTrigger Entrances
      // autoAlpha: 0, y: 32 -> autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out'
      // -------------------------------------------------------------
      const batchItems = container.querySelectorAll<HTMLElement>('.batch-item');
      if (batchItems.length > 0) {
        gsap.set(batchItems, { autoAlpha: 0, y: 32, force3D: true });
        ScrollTrigger.batch(batchItems, {
          onEnter: (els) =>
            gsap.to(els, {
              autoAlpha: 1,
              y: 0,
              stagger: 0.08,
              duration: 0.7,
              ease: 'power3.out',
              overwrite: true,
            }),
          start: options?.start || 'top 88%',
        });
      }

      const animElements = Array.from(container.querySelectorAll<HTMLElement>('[data-anim]')).filter(
        (el) => !el.parentElement?.hasAttribute('data-stagger') && !el.classList.contains('batch-item')
      );
      if (animElements.length > 0) {
        gsap.set(animElements, { autoAlpha: 0, y: 32, force3D: true });
        ScrollTrigger.batch(animElements, {
          onEnter: (els) =>
            gsap.to(els, {
              autoAlpha: 1,
              y: 0,
              stagger: 0.08,
              duration: 0.7,
              ease: 'power3.out',
              overwrite: true,
            }),
          start: options?.start || 'top 88%',
        });
      }

      // -------------------------------------------------------------
      // 2. data-mask: Clip-path wipe reveal
      // clipPath: 'inset(0 0 100% 0)' -> 'inset(0 0 0% 0)', duration: 1.0, ease: 'power4.inOut'
      // -------------------------------------------------------------
      const maskElements = container.querySelectorAll<HTMLElement>('[data-mask]');
      maskElements.forEach((el) => {
        const delay = parseFloat(el.dataset.delay || '0') || 0;
        const duration = parseFloat(el.dataset.duration || '1.0') || 1.0;

        gsap.set(el, { clipPath: 'inset(0 0 100% 0)' });

        gsap.to(el, {
          clipPath: 'inset(0 0 0% 0)',
          duration,
          delay,
          ease: 'power4.inOut',
          scrollTrigger: {
            trigger: el,
            start: options?.start || 'top 88%',
            toggleActions,
            refreshPriority: options?.refreshPriority,
          },
        });
      });

      // -------------------------------------------------------------
      // 3. data-stagger: Staggers immediate child elements (stagger: 0.08)
      // for skill matrices, experience timelines, capability columns
      // -------------------------------------------------------------
      const staggerContainers = container.querySelectorAll<HTMLElement>('[data-stagger]');
      staggerContainers.forEach((parent) => {
        const staggerSpeed = parseFloat(parent.dataset.stagger || '0.08') || 0.08;
        const children = Array.from(parent.children) as HTMLElement[];

        gsap.set(children, { autoAlpha: 0, y: 32 });

        gsap.to(children, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: staggerSpeed,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: parent,
            start: options?.start || 'top 85%',
            toggleActions,
            refreshPriority: options?.refreshPriority,
          },
        });
      });

      // -------------------------------------------------------------
      // 4. data-draw: Animates SVG or ledger divider lines
      // scaleX: 0 to 1, transformOrigin: 'left'
      // -------------------------------------------------------------
      const drawElements = container.querySelectorAll<HTMLElement>('[data-draw]');
      drawElements.forEach((el) => {
        const duration = parseFloat(el.dataset.duration || '1.0') || 1.0;
        const origin = el.dataset.origin || 'left';

        gsap.set(el, { scaleX: 0, transformOrigin: origin });

        gsap.to(el, {
          scaleX: 1,
          duration,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: el,
            start: options?.start || 'top 90%',
            toggleActions,
            refreshPriority: options?.refreshPriority,
          },
        });
      });

      // -------------------------------------------------------------
      // 5. data-parallax: Scrub-linked vertical parallax based on speed multiplier
      // (e.g. data-parallax="0.15")
      // -------------------------------------------------------------
      const parallaxElements = container.querySelectorAll<HTMLElement>('[data-parallax]');
      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || '0.15') || 0.15;
        const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const distance = speed * Math.max(viewportH * 0.45, 180);

        gsap.fromTo(
          el,
          { y: distance * 0.5 },
          {
            y: -distance * 0.5,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              refreshPriority: options?.refreshPriority,
            },
          }
        );
      });

      // -------------------------------------------------------------
      // 6. data-counter: Scroll-triggered numeric stat counters
      // Animates from 0 to target integer on scroll enter
      // -------------------------------------------------------------
      const counterElements = container.querySelectorAll<HTMLElement>('[data-counter]');
      counterElements.forEach((el) => {
        const rawTarget = el.dataset.counterTarget || el.dataset.counter || el.textContent || '0';
        
        // Parse leading prefix (e.g. "<", "~", "$"), number, and trailing suffix (e.g. "+", "%", " FPS", " ms")
        const match = rawTarget.match(/^([^0-9.]*)([0-9.]+)(.*)$/);
        const prefix = match ? match[1] : '';
        const numStr = match ? match[2] : '0';
        const suffix = match ? match[3] : '';
        const targetNumber = parseFloat(numStr) || 0;
        const isDecimal = numStr.includes('.');
        const decimals = isDecimal ? numStr.split('.')[1].length : 0;

        // Initialize display to 0 with prefix/suffix
        el.textContent = `${prefix}${isDecimal ? (0).toFixed(decimals) : '0'}${suffix}`;

        const counterState = { val: 0 };

        gsap.to(counterState, {
          val: targetNumber,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: options?.start || 'top 88%',
            toggleActions,
            refreshPriority: options?.refreshPriority,
          },
          onUpdate: () => {
            el.textContent = `${prefix}${isDecimal ? counterState.val.toFixed(decimals) : Math.round(counterState.val)}${suffix}`;
          },
        });
      });
    }, container);

    return () => {
      ctx.revert();
    };
  }, [containerRef, options?.start, options?.triggerOnce]);

  return containerRef as React.RefObject<T>;
}

export default useReveal;
