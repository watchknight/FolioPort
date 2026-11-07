import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { CursorController } from '../../motion/CursorController';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

const PROJECT_PREVIEWS = [
  {
    id: 'chronos-guard',
    title: 'Chronos-Guard',
    subtitle: 'Tamper-Evident SHA-256 Ledger',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" fill="%23090A0D"><rect width="320" height="200" fill="%23090A0D"/><rect x="1" y="1" width="318" height="198" fill="none" stroke="%237A808C" stroke-width="1" stroke-opacity="0.3"/><path d="M40 100 L120 60 L200 60 L280 100 L200 140 L120 140 Z" fill="none" stroke="%234E9A7F" stroke-width="1.5"/><circle cx="120" cy="60" r="6" fill="%234E9A7F"/><circle cx="200" cy="60" r="6" fill="%234E9A7F"/><circle cx="280" cy="100" r="6" fill="%23B84A27"/><circle cx="200" cy="140" r="6" fill="%234E9A7F"/><circle cx="120" cy="140" r="6" fill="%234E9A7F"/><circle cx="40" cy="100" r="6" fill="%234E9A7F"/><text x="160" y="105" fill="%23F2EFE9" font-family="monospace" font-size="11" text-anchor="middle" font-weight="bold">SHA-256 MERKLE ROOT</text><text x="160" y="175" fill="%237A808C" font-family="monospace" font-size="9" text-anchor="middle">18.5k evt/s • POSIX IPC Lock-Free</text></svg>`,
  },
  {
    id: 'hypergraph-ewu',
    title: 'HyperGraph-EWU',
    subtitle: '3D Knights Tour & Dijkstra Visualizer',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" fill="%23090A0D"><rect width="320" height="200" fill="%23090A0D"/><rect x="1" y="1" width="318" height="198" fill="none" stroke="%237A808C" stroke-width="1" stroke-opacity="0.3"/><line x1="60" y1="50" x2="160" y2="150" stroke="%237A808C" stroke-width="1" stroke-dasharray="3,3"/><line x1="160" y1="150" x2="260" y2="70" stroke="%234E9A7F" stroke-width="2"/><line x1="260" y1="70" x2="200" y2="30" stroke="%23B84A27" stroke-width="2"/><circle cx="60" cy="50" r="8" fill="%2312151C" stroke="%237A808C" stroke-width="2"/><circle cx="160" cy="150" r="8" fill="%2312151C" stroke="%234E9A7F" stroke-width="2"/><circle cx="260" cy="70" r="10" fill="%23B84A27"/><circle cx="200" cy="30" r="7" fill="%2312151C" stroke="%23B84A27" stroke-width="2"/><text x="160" y="178" fill="%23F2EFE9" font-family="monospace" font-size="10" text-anchor="middle" font-weight="bold">WARNSDORFF O(V) • 2.4ms p99</text></svg>`,
  },
  {
    id: 'aether-gl',
    title: 'Aether-GL',
    subtitle: 'Audio-Reactive Fluid Shader Studio',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" fill="%23090A0D"><rect width="320" height="200" fill="%23090A0D"/><rect x="1" y="1" width="318" height="198" fill="none" stroke="%23B84A27" stroke-width="1.5"/><path d="M20 120 Q 80 40 160 110 T 300 80" fill="none" stroke="%23B84A27" stroke-width="2.5"/><path d="M20 130 Q 80 50 160 120 T 300 90" fill="none" stroke="%234E9A7F" stroke-width="1.5" stroke-opacity="0.6"/><circle cx="160" cy="110" r="28" fill="none" stroke="%23B84A27" stroke-width="1" stroke-dasharray="2,4"/><text x="160" y="45" fill="%23F2EFE9" font-family="monospace" font-size="11" text-anchor="middle" font-weight="bold">NAVIER-STOKES WEBGPU</text><text x="160" y="175" fill="%23B84A27" font-family="monospace" font-size="9" text-anchor="middle">1024x1024 • 1.42ms GPU PASS</text></svg>`,
  },
  {
    id: 'perceptron-core',
    title: 'Perceptron-Core',
    subtitle: 'Neural Socket Telemetry & SIMD Inference',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" fill="%23090A0D"><rect width="320" height="200" fill="%23090A0D"/><rect x="1" y="1" width="318" height="198" fill="none" stroke="%237A808C" stroke-width="1" stroke-opacity="0.3"/><rect x="40" y="40" width="40" height="120" fill="%2312151C" stroke="%234E9A7F" stroke-width="1"/><rect x="140" y="30" width="40" height="140" fill="%2312151C" stroke="%23B84A27" stroke-width="1"/><rect x="240" y="50" width="40" height="100" fill="%2312151C" stroke="%23F2EFE9" stroke-width="1"/><text x="160" y="185" fill="%23F2EFE9" font-family="monospace" font-size="10" text-anchor="middle" font-weight="bold">WASM SIMD • 11.8ms p99</text></svg>`,
  },
];

export const CustomCursor: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<SVGSVGElement | null>(null);
  const flaskRef = useRef<SVGSVGElement | null>(null);
  const liquidRef = useRef<SVGGElement | null>(null);
  const shockwaveRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const portal = portalRef.current;
    if (!portal) return;

    // Wrap custom cursor lifecycle cleanly in gsap.matchMedia()
    const mm = gsap.matchMedia();

    mm.add(
      {
        isFineDesktop: '(hover: hover) and (pointer: fine)',
        isReducedMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isFineDesktop, isReducedMotion } = context.conditions as {
          isFineDesktop: boolean;
          isReducedMotion: boolean;
        };

        // Cleanly bypass custom cursor and preserve native pointer behavior on touch/reduced motion
        if (!isFineDesktop || isReducedMotion) {
          setIsActive(false);
          document.body.classList.remove('cursor-active');
          return;
        }

        setIsActive(true);
        document.body.classList.add('cursor-active');

        // Extract rising micro-star and bubble elements from liquid group
        const starEls = Array.from(portal.querySelectorAll<SVGElement>('[data-star]'));
        const bubbleEls = Array.from(portal.querySelectorAll<SVGElement>('[data-bubble]'));

        // Initialize CursorController with tuned duration 0.14 and zero-offset portal alignment
        const controller = new CursorController({
          cursorEl: portal,
          previewContainer: previewRef.current,
          duration: 0.14,
          initialScale: 1,
          xPercent: 0,
          yPercent: 0,
          arrowEl: arrowRef.current,
          flaskEl: flaskRef.current,
          liquidEl: liquidRef.current,
          shockwaveEl: shockwaveRef.current,
          starEls,
          bubbleEls,
          audioEngine: watchknightAudio,
          projectRows: '.wk-project-row',
        });

        return () => {
          controller.destroy();
          document.body.classList.remove('cursor-active');
          setIsActive(false);
        };
      }
    );

    return () => {
      mm.revert();
      document.body.classList.remove('cursor-active');
    };
  }, [mounted]);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={portalRef}
      className={`custom-cursor-container fixed top-0 left-0 pointer-events-none z-[9999] ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {/* Subtle Terracotta Shockwave Ring emitted on pointerdown */}
      <div
        ref={shockwaveRef}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 44,
          height: 44,
          top: -22,
          left: -22,
          border: '1.5px solid #B84A27',
          opacity: 0,
          transformOrigin: 'center center',
          boxShadow: '0 0 14px rgba(184, 74, 39, 0.45)',
        }}
      />

      {/* Floating Project Image Hover Preview Stack managed by CursorController */}
      <div
        ref={previewRef}
        className="pointer-events-none absolute top-6 left-6 w-72 h-44 rounded-lg overflow-hidden border border-wk-ash-muted/30 bg-wk-slate-surface shadow-2xl z-[9990]"
        style={{ willChange: 'transform, opacity' }}
      >
        {PROJECT_PREVIEWS.map((proj) => (
          <img
            key={proj.id}
            data-image={proj.id}
            src={proj.svg}
            alt={proj.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0 }}
          />
        ))}
      </div>

      {/* STATE 1: DEFAULT — Cosmic Sentinel Arrow (28x28px, hotspot at (2, 2)) */}
      <svg
        ref={arrowRef}
        width="28"
        height="28"
        viewBox="0 0 28 28"
        className="absolute pointer-events-none"
        style={{
          top: -2,
          left: -2,
          transformOrigin: '2px 2px',
          overflow: 'visible',
          willChange: 'transform, opacity',
        }}
      >
        <defs>
          <linearGradient id="cosmic-arrow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#090A0D" />
            <stop offset="100%" stopColor="#12151C" />
          </linearGradient>
          <filter id="terracotta-core-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Precision geometric arrow body with 1.25px #F2EFE9 stroke to prevent chromostereopsis */}
        <path
          d="M 2 2 L 2 22 L 7.5 17 L 12 25.5 L 15.2 24 L 10.7 15.5 L 18.5 15.5 Z"
          fill="url(#cosmic-arrow-grad)"
          stroke="#F2EFE9"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Glowing --wk-terracotta-pulse core dot */}
        <circle
          cx="7.5"
          cy="11.5"
          r="3.2"
          fill="#B84A27"
          opacity="0.35"
          filter="url(#terracotta-core-glow)"
        />
        <circle
          cx="7.5"
          cy="11.5"
          r="1.8"
          fill="#B84A27"
        />
        <circle
          cx="7.5"
          cy="11.5"
          r="0.7"
          fill="#F2EFE9"
        />

        {/* Two tiny --wk-alabaster-ink four-point star sparkles */}
        <path
          d="M 5.5 5 Q 5.5 6.5 7 6.5 Q 5.5 6.5 5.5 8 Q 5.5 6.5 4 6.5 Q 5.5 6.5 5.5 5 Z"
          fill="#F2EFE9"
        />
        <path
          d="M 12 13 Q 12 14.2 13.2 14.2 Q 12 14.2 12 15.4 Q 12 14.2 10.8 14.2 Q 12 14.2 12 13 Z"
          fill="#F2EFE9"
        />
      </svg>

      {/* STATE 2: INTERACTIVE HOVER — Tuned Galaxy Flask (44x44px) */}
      <svg
        ref={flaskRef}
        width="44"
        height="44"
        viewBox="0 0 44 44"
        className="absolute pointer-events-none"
        style={{
          top: -22,
          left: -22,
          transformOrigin: '22px 28px',
          overflow: 'visible',
          willChange: 'transform, opacity',
        }}
      >
        <defs>
          {/* Clip path masking the inner cosmic liquid to lower 65% of bulb */}
          <clipPath id="flask-interior">
            <path d="M 18.5 10.5 L 18.5 17 C 15 19 10.5 23.5 10.5 29 C 10.5 35.35 15.65 40.5 22 40.5 C 28.35 40.5 33.5 35.35 33.5 29 C 33.5 23.5 29 19 25.5 17 L 25.5 10.5 Z" />
          </clipPath>

          {/* Layered cosmic gradient: #090A0D -> #B84A27 terracotta nebula -> #4E9A7F verdigris crest */}
          <linearGradient id="cosmic-liquid-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#090A0D" />
            <stop offset="55%" stopColor="#B84A27" />
            <stop offset="100%" stopColor="#4E9A7F" />
          </linearGradient>

          <filter id="verdigris-bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Translucent #12151C glass backdrop */}
        <path
          d="M 18 10 L 18 17 C 14.5 19 9.5 23.5 9.5 29 C 9.5 35.9 15.1 41.5 22 41.5 C 28.9 41.5 34.5 35.9 34.5 29 C 34.5 23.5 29.5 19 26 17 L 26 10 Z"
          fill="#12151C"
          fillOpacity="0.82"
        />

        {/* Counter-slosh liquid layer inside clip-path */}
        <g id="flask-liquid" ref={liquidRef} clipPath="url(#flask-interior)" style={{ transformOrigin: '22px 28px' }}>
          {/* Lower 65% cosmic gradient liquid body */}
          <path
            d="M -10 24.5 Q 6 23 22 24.5 T 54 24.5 L 54 46 L -10 46 Z"
            fill="url(#cosmic-liquid-grad)"
          />
          {/* Verdigris surface crest */}
          <path
            d="M 9 25 Q 15.5 23.8 22 25 T 35 25"
            stroke="#4E9A7F"
            strokeWidth="1.2"
            fill="none"
            opacity="0.95"
          />

          {/* Internal Constellation: 4 micro-stars (#F2EFE9) */}
          <g>
            <path
              data-star="0"
              d="M 0 -2.2 Q 0 0 2.2 0 Q 0 0 0 2.2 Q 0 0 -2.2 0 Q 0 0 0 -2.2 Z"
              fill="#F2EFE9"
            />
            <path
              data-star="1"
              d="M 0 -1.8 Q 0 0 1.8 0 Q 0 0 0 1.8 Q 0 0 -1.8 0 Q 0 0 0 -1.8 Z"
              fill="#F2EFE9"
            />
            <path
              data-star="2"
              d="M 0 -2.0 Q 0 0 2.0 0 Q 0 0 0 2.0 Q 0 0 -2.0 0 Q 0 0 0 -2.0 Z"
              fill="#F2EFE9"
            />
            <path
              data-star="3"
              d="M 0 -1.6 Q 0 0 1.6 0 Q 0 0 0 1.6 Q 0 0 -1.6 0 Q 0 0 0 -1.6 Z"
              fill="#F2EFE9"
            />
          </g>

          {/* 2 verdigris alchemical bubbles (#4E9A7F) */}
          <g>
            <circle
              data-bubble="0"
              cx="0"
              cy="0"
              r="1.4"
              fill="#4E9A7F"
              filter="url(#verdigris-bubble-glow)"
              opacity="0.85"
            />
            <circle
              data-bubble="1"
              cx="0"
              cy="0"
              r="1.0"
              fill="#4E9A7F"
              filter="url(#verdigris-bubble-glow)"
              opacity="0.85"
            />
          </g>
        </g>

        {/* Flask Glass Outline: 1.5px --wk-alabaster-ink (#F2EFE9) stroke */}
        <path
          d="M 18 10 L 18 17 C 14.5 19 9.5 23.5 9.5 29 C 9.5 35.9 15.1 41.5 22 41.5 C 28.9 41.5 34.5 35.9 34.5 29 C 34.5 23.5 29.5 19 26 17 L 26 10 Z"
          stroke="#F2EFE9"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        {/* Diagonal specular glass highlight along left curve */}
        <path
          d="M 13 23 C 11.2 26 11.2 31 13.5 34"
          stroke="#F2EFE9"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.65"
        />
        <path
          d="M 19 12 L 19 15"
          stroke="#F2EFE9"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />

        {/* Geometric cork/collar accented in --wk-terracotta-pulse (#B84A27) */}
        <path
          d="M 19 7 L 19.5 3.5 L 24.5 3.5 L 25 7 Z"
          fill="#B84A27"
          stroke="#F2EFE9"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <rect
          x="17"
          y="7"
          width="10"
          height="3"
          rx="1.5"
          fill="#12151C"
          stroke="#F2EFE9"
          strokeWidth="1.5"
        />
      </svg>
    </div>,
    document.body
  );
};

export default CustomCursor;
