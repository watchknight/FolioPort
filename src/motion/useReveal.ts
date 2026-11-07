import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { refreshVelocityTargets } from './ScrollEngine';

gsap.registerPlugin(ScrollTrigger, SplitText);

export interface UseRevealOptions {
  triggerOnce?: boolean;
  start?: string;
  refreshPriority?: number;
}

/**
 * Declarative Scroll-Reveal Hook (Unified Motion Engine)
 *
 * Scopes a container ref and automatically binds GSAP ScrollTrigger animations to any descendant
 * carrying declarative data attributes:
 * - data-anim: autoAlpha + y rise (autoAlpha: 0, y: 32 -> autoAlpha: 1, y: 0)
 * - data-mask: clip-path wipe reveal (clipPath: 'inset(0 0 100% 0)' -> 'inset(0 0 0% 0)')
 * - data-draw: SVG stroke-dashoffset rule draw-in & divider line expansion
 * - data-stagger: SplitText character/line reveal & child element stagger
 * - data-parallax: scrub-linked vertical parallax based on speed multiplier
 * - data-counter: scroll-triggered numeric stat counters
 *
 * All motion is governed by gsap.matchMedia() ensuring desktop motion (min-width: 800px) and
 * (prefers-reduced-motion: no-preference) are strictly respected, with clean reversion on unmount.
 */
function queryWithSelf<E extends HTMLElement = HTMLElement>(
  root: HTMLElement,
  selector: string
): E[] {
  const matches = Array.from(root.querySelectorAll<E>(selector));
  if (root.matches(selector)) {
    matches.unshift(root as unknown as E);
  }
  return matches;
}

export function useReveal<T extends HTMLElement = HTMLElement>(
  externalRef?: React.RefObject<T>,
  options?: UseRevealOptions
): React.RefObject<T> {
  const internalRef = useRef<T | null>(null);
  const containerRef = externalRef || internalRef;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    // Refresh velocity target bindings if container contains .wk-velocity-item
    if (container.querySelector('.wk-velocity-item') || container.classList.contains('wk-velocity-item')) {
      refreshVelocityTargets();
    }

    // Use gsap.matchMedia to encapsulate responsive conditions & automatic lifecycle reversion
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktopMotion: '(min-width: 800px) and (prefers-reduced-motion: no-preference)',
        isReducedOrMobile: '(max-width: 799px), (prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktopMotion } = context.conditions as {
          isDesktopMotion: boolean;
          isReducedOrMobile: boolean;
        };

        const splitInstances: SplitText[] = [];

        // -------------------------------------------------------------
        // REDUCED MOTION / MOBILE FALLBACK: Instant Revealed Resting State
        // -------------------------------------------------------------
        if (!isDesktopMotion) {
          const animNodes = queryWithSelf(container, '[data-anim], .batch-item');
          if (animNodes.length > 0) {
            gsap.set(animNodes, {
              autoAlpha: 1,
              y: 0,
              clearProps: 'transform',
            });
          }

          const maskNodes = queryWithSelf(container, '[data-mask]');
          if (maskNodes.length > 0) {
            gsap.set(maskNodes, {
              clipPath: 'inset(0 0 0% 0)',
            });
          }

          // SVG & Divider Draw resting state
          const drawElements = queryWithSelf<HTMLElement>(container, '[data-draw]');
          drawElements.forEach((el) => {
            const svgPaths = el.querySelectorAll<SVGGeometryElement>(
              'path, line, polyline, polygon, circle, rect'
            );
            if (svgPaths.length > 0) {
              svgPaths.forEach((path) => gsap.set(path, { strokeDashoffset: 0 }));
            } else if (typeof (el as unknown as SVGGeometryElement).getTotalLength === 'function') {
              gsap.set(el, { strokeDashoffset: 0 });
            } else {
              gsap.set(el, { scaleX: 1, transformOrigin: 'left' });
            }
          });

          // Stagger parents & children resting state
          const staggerParents = queryWithSelf<HTMLElement>(container, '[data-stagger]');
          staggerParents.forEach((parent) => {
            gsap.set(parent.children, { autoAlpha: 1, y: 0, clearProps: 'transform' });
          });

          // Stat counters resting state
          const counters = queryWithSelf<HTMLElement>(container, '[data-counter]');
          counters.forEach((el) => {
            const target =
              el.dataset.counterTarget || el.dataset.counter || el.textContent || '0';
            el.textContent = target;
          });

          return;
        }

        // -------------------------------------------------------------
        // DESKTOP FULL-MOTION: Hardware-Accelerated ScrollTrigger Revelations
        // -------------------------------------------------------------
        const toggleActions =
          options?.triggerOnce === false
            ? 'play reverse play reverse'
            : 'play none none none';

        // 1. data-anim & .batch-item: Batched ScrollTrigger Entrances
        const batchItems = queryWithSelf<HTMLElement>(container, '.batch-item');
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
            ...(options?.triggerOnce === false
              ? {
                  onLeaveBack: (els) =>
                    gsap.to(els, {
                      autoAlpha: 0,
                      y: 32,
                      stagger: 0.04,
                      duration: 0.5,
                      overwrite: true,
                    }),
                }
              : {}),
            start: options?.start || 'top 88%',
          });
        }

        const animElements = queryWithSelf<HTMLElement>(container, '[data-anim]').filter(
          (el) =>
            !el.parentElement?.hasAttribute('data-stagger') &&
            !el.classList.contains('batch-item')
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
            ...(options?.triggerOnce === false
              ? {
                  onLeaveBack: (els) =>
                    gsap.to(els, {
                      autoAlpha: 0,
                      y: 32,
                      stagger: 0.04,
                      duration: 0.5,
                      overwrite: true,
                    }),
                }
              : {}),
            start: options?.start || 'top 88%',
          });
        }

        // 2. data-mask: Clip-path wipe reveal
        const maskElements = queryWithSelf<HTMLElement>(container, '[data-mask]');
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

        // 3. data-draw: SVG stroke-dashoffset rule draw-in & divider line expansion
        const drawElements = queryWithSelf<HTMLElement>(container, '[data-draw]');
        drawElements.forEach((el) => {
          const duration = parseFloat(el.dataset.duration || '1.0') || 1.0;
          const origin = el.dataset.origin || 'left';

          // Check if el contains SVG stroke paths or is an SVG geometry element itself
          const paths = el.querySelectorAll<SVGGeometryElement>(
            'path, line, polyline, polygon, circle, rect'
          );
          const svgPaths =
            paths.length > 0
              ? Array.from(paths)
              : typeof (el as unknown as SVGGeometryElement).getTotalLength === 'function'
              ? [el as unknown as SVGGeometryElement]
              : [];

          if (svgPaths.length > 0) {
            svgPaths.forEach((path) => {
              const length =
                typeof path.getTotalLength === 'function'
                  ? path.getTotalLength()
                  : 1000;
              gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });

              gsap.to(path, {
                strokeDashoffset: 0,
                duration,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: el,
                  start: options?.start || 'top 90%',
                  toggleActions,
                  refreshPriority: options?.refreshPriority,
                },
              });
            });
          } else {
            // HTML divider lines (scaleX: 0 -> 1)
            gsap.set(el, { scaleX: 0, transformOrigin: origin, force3D: true });

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
          }
        });

        // 4. data-stagger: SplitText character/line reveal & child element stagger
        const staggerContainers = queryWithSelf<HTMLElement>(container, '[data-stagger]');
        staggerContainers.forEach((parent) => {
          const staggerSpeed = parseFloat(parent.dataset.stagger || '0.08') || 0.08;
          const splitConfig = parent.dataset.split;

          // If the element has split configuration or is a text block without child elements
          if (
            splitConfig ||
            (parent.children.length === 0 && (parent.textContent || '').trim().length > 0)
          ) {
            try {
              const splitType = splitConfig || 'lines,chars';
              const split = new SplitText(parent, {
                type: splitType,
                linesClass: 'wk-split-line',
                wordsClass: 'wk-split-word',
                charsClass: 'wk-split-char',
              });
              splitInstances.push(split);

              const targets =
                split.chars.length > 0
                  ? split.chars
                  : split.words.length > 0
                  ? split.words
                  : split.lines;

              gsap.set(targets, { autoAlpha: 0, y: 16, force3D: true });

              gsap.to(targets, {
                autoAlpha: 1,
                y: 0,
                duration: 0.6,
                stagger: splitConfig ? staggerSpeed : 0.03,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: parent,
                  start: options?.start || 'top 85%',
                  toggleActions,
                  refreshPriority: options?.refreshPriority,
                },
              });
            } catch {
              // Fallback if SplitText cannot parse element (e.g. headless/mock env)
              gsap.set(parent, { autoAlpha: 1, y: 0 });
            }
          } else {
            // Container with child elements
            const children = Array.from(parent.children) as HTMLElement[];
            if (children.length > 0) {
              gsap.set(children, { autoAlpha: 0, y: 32, force3D: true });

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
            }
          }
        });

        // 5. data-parallax: Scrub-linked vertical parallax based on speed multiplier
        const parallaxElements = queryWithSelf<HTMLElement>(container, '[data-parallax]');
        parallaxElements.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.15') || 0.15;
          const viewportH = window.innerHeight || 800;
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

        // 6. data-counter: Scroll-triggered numeric stat counters
        const counterElements = queryWithSelf<HTMLElement>(container, '[data-counter]');
        counterElements.forEach((el) => {
          const rawTarget =
            el.dataset.counterTarget || el.dataset.counter || el.textContent || '0';

          const match = rawTarget.match(/^([^0-9.]*)([0-9.]+)(.*)$/);
          const prefix = match ? match[1] : '';
          const numStr = match ? match[2] : '0';
          const suffix = match ? match[3] : '';
          const targetNumber = parseFloat(numStr) || 0;
          const isDecimal = numStr.includes('.');
          const decimals = isDecimal ? numStr.split('.')[1].length : 0;

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
              el.textContent = `${prefix}${
                isDecimal
                  ? counterState.val.toFixed(decimals)
                  : Math.round(counterState.val)
              }${suffix}`;
            },
          });
        });

        // Cleanup callback: cleanly reverts all SplitText instances when breakpoint matches change or mm reverts
        return () => {
          splitInstances.forEach((split) => {
            try {
              split.revert();
            } catch {
              // ignore
            }
          });
        };
      },
      container
    );

    return () => {
      mm.revert();
    };
  }, [containerRef, options?.start, options?.triggerOnce, options?.refreshPriority]);

  return containerRef as React.RefObject<T>;
}

export default useReveal;
