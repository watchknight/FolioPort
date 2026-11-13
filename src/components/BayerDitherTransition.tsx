import React, { useRef, useEffect, useCallback } from 'react';
import { useRetroOS } from '../context/RetroOSContext';

export interface PhosphorColorTokens {
  void?: string;
  dim?: string;
  mid?: string;
  bright?: string;
}

export interface BayerDitherTransitionProps {
  className?: string;
  palette?: PhosphorColorTokens;
  triggerKey?: string | number;
  onMidpointSwap?: () => void;
  onComplete?: () => void;
}

/**
 * Standard 8x8 Ordered Bayer Matrix (thresholds 0 to 63).
 * Represents the 64 discrete threshold levels of ordered dithering.
 */
export const BAYER_MATRIX_8X8: readonly (readonly number[])[] = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
] as const;

export const DITHER_TRANSITION_TOTAL_MS = 340;
export const DITHER_TRANSITION_MIDPOINT_MS = 170;
export const DITHER_CELL_SIZE = 4;
export const BAYER_PATTERN_SIZE = 8 * DITHER_CELL_SIZE; // 32px repeating pattern tile

export const BayerDitherTransition: React.FC<BayerDitherTransitionProps> = ({
  className = '',
  palette,
  triggerKey,
  onMidpointSwap,
  onComplete,
}) => {
  const os = useRetroOS();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const voidColor = palette?.void ?? (os.phosphorMode === 'amber' ? '#140f07' : '#111712');
  const dimColor = palette?.dim ?? (os.phosphorMode === 'amber' ? '#3d2b12' : '#2e3b2b');

  const rafIdRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef<boolean>(false);
  const midpointSwappedRef = useRef<boolean>(false);
  const pendingSwapRef = useRef<(() => void) | null>(null);
  const pendingCompleteRef = useRef<(() => void) | null>(null);

  // Lazy-initialize the 32x32 repeating pattern canvas
  const getPatternCanvas = useCallback(() => {
    if (typeof document === 'undefined') return null;
    if (!patternCanvasRef.current) {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = BAYER_PATTERN_SIZE;
      pCanvas.height = BAYER_PATTERN_SIZE;
      patternCanvasRef.current = pCanvas;
    }
    return patternCanvasRef.current;
  }, []);

  const runTransition = useCallback(
    (swapFn: () => void, completeCallback?: () => void) => {
      if (typeof window === 'undefined') {
        swapFn();
        completeCallback?.();
        return;
      }

      // Respect prefers-reduced-motion: instant swap without dither animation
      if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        swapFn();
        completeCallback?.();
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        swapFn();
        completeCallback?.();
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        swapFn();
        completeCallback?.();
        return;
      }

      // If an existing transition was in flight and hasn't swapped, swap immediately now
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (pendingSwapRef.current && !midpointSwappedRef.current) {
        try {
          pendingSwapRef.current();
        } catch {}
      }
      if (pendingCompleteRef.current) {
        try {
          pendingCompleteRef.current();
        } catch {}
        pendingCompleteRef.current = null;
      }

      pendingSwapRef.current = swapFn;
      pendingCompleteRef.current = completeCallback ?? null;
      midpointSwappedRef.current = false;
      activeRef.current = true;

      // Fallback timer: prevents screen from getting stuck mid-transition if tab is backgrounded
      fallbackTimerRef.current = setTimeout(() => {
        if (activeRef.current) {
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          if (!midpointSwappedRef.current && pendingSwapRef.current) {
            midpointSwappedRef.current = true;
            try {
              pendingSwapRef.current();
            } catch {}
            pendingSwapRef.current = null;
          }
          activeRef.current = false;
          if (canvasRef.current) {
            const fCtx = canvasRef.current.getContext('2d');
            if (fCtx) {
              fCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
          if (pendingCompleteRef.current) {
            const cb = pendingCompleteRef.current;
            pendingCompleteRef.current = null;
            try {
              cb();
            } catch {}
          }
        }
      }, DITHER_TRANSITION_TOTAL_MS + 50);

      // Sync canvas dimensions to client bounds
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width || canvas.clientWidth || 800));
      const height = Math.max(1, Math.floor(rect.height || canvas.clientHeight || 600));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.imageSmoothingEnabled = false;

      const patternCanvas = getPatternCanvas();
      const pCtx = patternCanvas ? patternCanvas.getContext('2d') : null;
      if (pCtx) {
        pCtx.imageSmoothingEnabled = false;
      }

      const startTime = performance.now();

      const tick = (now: number) => {
        if (!activeRef.current) return;

        const elapsed = now - startTime;

        // Completion at 340ms: clear canvas, halt RAF loop, 0% CPU consumption
        if (elapsed >= DITHER_TRANSITION_TOTAL_MS) {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
          if (!midpointSwappedRef.current && pendingSwapRef.current) {
            midpointSwappedRef.current = true;
            try {
              pendingSwapRef.current();
            } catch {}
            pendingSwapRef.current = null;
          }
          activeRef.current = false;
          rafIdRef.current = null;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (pendingCompleteRef.current) {
            const cb = pendingCompleteRef.current;
            pendingCompleteRef.current = null;
            try {
              cb();
            } catch {}
          }
          return;
        }

        // Midpoint swap at 170ms: update the active React view state
        let isSwapFrame = false;
        if (elapsed >= DITHER_TRANSITION_MIDPOINT_MS && !midpointSwappedRef.current) {
          midpointSwappedRef.current = true;
          isSwapFrame = true;
          if (pendingSwapRef.current) {
            const swap = pendingSwapRef.current;
            pendingSwapRef.current = null;
            try {
              swap();
            } catch {}
          }
        }

        // Calculate active threshold based on phase:
        // On the exact swap frame (at or just past 170ms), force 100% full coverage (all 64 cells filled)
        // to guarantee zero flicker/DOM gap during the React view substitution.
        const isLeavePhase = elapsed < DITHER_TRANSITION_MIDPOINT_MS;
        let threshold = 0;
        let dissolveThreshold = 0;

        if (isSwapFrame) {
          // Exactly 100% full coverage curtain on the swap frame
          threshold = 64;
        } else if (isLeavePhase) {
          const p = Math.min(1, Math.max(0, elapsed / DITHER_TRANSITION_MIDPOINT_MS));
          // Progressively fill in 0 to 64 discrete threshold levels
          threshold = Math.min(64, Math.floor(p * 65));
        } else {
          const p = Math.min(
            1,
            Math.max(
              0,
              (elapsed - DITHER_TRANSITION_MIDPOINT_MS) /
                (DITHER_TRANSITION_TOTAL_MS - DITHER_TRANSITION_MIDPOINT_MS)
            )
          );
          // Dissolve out 0 to 64 discrete threshold levels smoothly to 0 coverage at p=1.0
          dissolveThreshold = Math.min(64, Math.floor(p * 64));
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // High-Performance 32x32 Pattern Tiling:
        // Because the 8x8 Bayer matrix with 4px cells repeats identically every 32px,
        // we render just 64 cells onto an offscreen 32x32 canvas, then tile the entire screen
        // in a single GPU-accelerated draw call.
        if (pCtx && patternCanvas) {
          pCtx.clearRect(0, 0, BAYER_PATTERN_SIZE, BAYER_PATTERN_SIZE);

          // Pass 1: Primary Void Shade (#111712) on even parity
          pCtx.fillStyle = voidColor;
          pCtx.beginPath();
          for (let r = 0; r < 8; r++) {
            const rowPattern = BAYER_MATRIX_8X8[r];
            const y = r * DITHER_CELL_SIZE;
            for (let c = 0; c < 8; c++) {
              if ((c + r) % 2 === 0) {
                const val = rowPattern[c];
                const visible = isSwapFrame || (isLeavePhase ? val < threshold : val >= dissolveThreshold);
                if (visible) {
                  pCtx.rect(c * DITHER_CELL_SIZE, y, DITHER_CELL_SIZE, DITHER_CELL_SIZE);
                }
              }
            }
          }
          pCtx.fill();

          // Pass 2: Secondary Dim Shade (#2e3b2b) on odd parity
          pCtx.fillStyle = dimColor;
          pCtx.beginPath();
          for (let r = 0; r < 8; r++) {
            const rowPattern = BAYER_MATRIX_8X8[r];
            const y = r * DITHER_CELL_SIZE;
            for (let c = 0; c < 8; c++) {
              if ((c + r) % 2 !== 0) {
                const val = rowPattern[c];
                const visible = isSwapFrame || (isLeavePhase ? val < threshold : val >= dissolveThreshold);
                if (visible) {
                  pCtx.rect(c * DITHER_CELL_SIZE, y, DITHER_CELL_SIZE, DITHER_CELL_SIZE);
                }
              }
            }
          }
          pCtx.fill();

          let patternDrawn = false;
          try {
            const pattern = ctx.createPattern(patternCanvas, 'repeat');
            if (pattern) {
              ctx.fillStyle = pattern;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              patternDrawn = true;
            }
          } catch {}

          if (!patternDrawn) {
            // Fallback to direct rect drawing if pattern creation fails
            fallbackDirectDraw(ctx, width, height, threshold, dissolveThreshold, isLeavePhase, isSwapFrame);
          }
        } else {
          fallbackDirectDraw(ctx, width, height, threshold, dissolveThreshold, isLeavePhase, isSwapFrame);
        }

        rafIdRef.current = requestAnimationFrame(tick);
      };

      const fallbackDirectDraw = (
        targetCtx: CanvasRenderingContext2D,
        w: number,
        h: number,
        th: number,
        dth: number,
        leavePhase: boolean,
        swapFrame: boolean
      ) => {
        const cols = Math.ceil(w / DITHER_CELL_SIZE);
        const rows = Math.ceil(h / DITHER_CELL_SIZE);

        targetCtx.fillStyle = voidColor;
        targetCtx.beginPath();
        for (let r = 0; r < rows; r++) {
          const rowPattern = BAYER_MATRIX_8X8[r % 8];
          const y = r * DITHER_CELL_SIZE;
          for (let c = 0; c < cols; c++) {
            if ((c + r) % 2 === 0) {
              const val = rowPattern[c % 8];
              const visible = swapFrame || (leavePhase ? val < th : val >= dth);
              if (visible) {
                targetCtx.rect(c * DITHER_CELL_SIZE, y, DITHER_CELL_SIZE, DITHER_CELL_SIZE);
              }
            }
          }
        }
        targetCtx.fill();

        targetCtx.fillStyle = dimColor;
        targetCtx.beginPath();
        for (let r = 0; r < rows; r++) {
          const rowPattern = BAYER_MATRIX_8X8[r % 8];
          const y = r * DITHER_CELL_SIZE;
          for (let c = 0; c < cols; c++) {
            if ((c + r) % 2 !== 0) {
              const val = rowPattern[c % 8];
              const visible = swapFrame || (leavePhase ? val < th : val >= dth);
              if (visible) {
                targetCtx.rect(c * DITHER_CELL_SIZE, y, DITHER_CELL_SIZE, DITHER_CELL_SIZE);
              }
            }
          }
        }
        targetCtx.fill();
      };

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [voidColor, dimColor, getPatternCanvas]
  );

  // Register transition handler with RetroOSContext if inside provider
  useEffect(() => {
    if (os.registerDitherTransition) {
      const unregister = os.registerDitherTransition((swapFn, completeCb) => {
        runTransition(swapFn, completeCb);
      });
      return () => {
        unregister();
      };
    }
  }, [os.registerDitherTransition, runTransition]);

  // Support standalone prop-driven trigger
  const prevTriggerKeyRef = useRef(triggerKey);
  useEffect(() => {
    if (triggerKey !== undefined && triggerKey !== prevTriggerKeyRef.current) {
      prevTriggerKeyRef.current = triggerKey;
      runTransition(() => {
        onMidpointSwap?.();
      }, onComplete);
    }
  }, [triggerKey, onMidpointSwap, onComplete, runTransition]);

  // Clean up RAF and release any pending transition on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (pendingSwapRef.current && !midpointSwappedRef.current) {
        try {
          pendingSwapRef.current();
        } catch {}
        pendingSwapRef.current = null;
      }
      activeRef.current = false;
      if (canvasRef.current) {
        const uCtx = canvasRef.current.getContext('2d');
        if (uCtx) {
          uCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      if (pendingCompleteRef.current) {
        const cb = pendingCompleteRef.current;
        pendingCompleteRef.current = null;
        try {
          cb();
        } catch {}
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="bayer-dither-canvas"
      className={`absolute inset-0 pointer-events-none z-[35] w-full h-full ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 35,
        imageRendering: 'pixelated',
      }}
      aria-hidden="true"
    />
  );
};

export default BayerDitherTransition;
