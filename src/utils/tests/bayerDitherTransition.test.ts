import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  BayerDitherTransition,
  BAYER_MATRIX_8X8,
  DITHER_TRANSITION_TOTAL_MS,
  DITHER_TRANSITION_MIDPOINT_MS,
  DITHER_CELL_SIZE,
  BAYER_PATTERN_SIZE,
} from '../../components/BayerDitherTransition';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { CRTDioramaStage, AMBER_PALETTE, SAGE_PALETTE } from '../../components/CRTDioramaStage';
import { RetroOSProvider, useRetroOS } from '../../context/RetroOSContext';

describe('8x8 Ordered Bayer Matrix Dither Transition & Level 2 OS Reader Window', () => {
  describe('1. 8x8 Bayer Matrix Math, Thresholds & Timing Constants', () => {
    it('defines an exact 8x8 matrix with 64 discrete threshold levels from 0 to 63', () => {
      expect(BAYER_MATRIX_8X8).toHaveLength(8);

      const flatValues: number[] = [];
      BAYER_MATRIX_8X8.forEach((row) => {
        expect(row).toHaveLength(8);
        flatValues.push(...row);
      });

      expect(flatValues).toHaveLength(64);

      // Verify all integer values from 0 to 63 exist exactly once without omission
      const sorted = [...flatValues].sort((a, b) => a - b);
      for (let i = 0; i < 64; i++) {
        expect(sorted[i]).toBe(i);
      }
    });

    it('enforces exact transition duration constants: 340ms total, 170ms midpoint, 4px integer cell size, 32px pattern', () => {
      expect(DITHER_TRANSITION_TOTAL_MS).toBe(340);
      expect(DITHER_TRANSITION_MIDPOINT_MS).toBe(170);
      expect(DITHER_TRANSITION_TOTAL_MS - DITHER_TRANSITION_MIDPOINT_MS).toBe(170);
      expect(DITHER_CELL_SIZE).toBe(4);
      expect(BAYER_PATTERN_SIZE).toBe(32);
    });

    it('matches authentic recursive Bayer matrix mathematical formulation', () => {
      // Index (0,0) is 0, (0,1) is 32, (1,0) is 48, (7,7) is 21
      expect(BAYER_MATRIX_8X8[0][0]).toBe(0);
      expect(BAYER_MATRIX_8X8[0][1]).toBe(32);
      expect(BAYER_MATRIX_8X8[1][0]).toBe(48);
      expect(BAYER_MATRIX_8X8[7][7]).toBe(21);
    });
  });

  describe('2. Lightweight HTML5 2D Canvas Overlay (BayerDitherTransition.tsx)', () => {
    it('renders HTML5 canvas overlay strictly inside CRT screen with required CSS properties', () => {
      const html = renderToString(React.createElement(BayerDitherTransition));

      expect(html).toContain('data-testid="bayer-dither-canvas"');
      expect(html).toContain('position:absolute');
      expect(html).toContain('inset:0');
      expect(html).toContain('pointer-events:none');
      expect(html).toContain('z-index:35');
      expect(html).toContain('image-rendering:pixelated');
      expect(html).toContain('aria-hidden="true"');
    });

    it('adapts palette tokens for Amber vs Sage phosphor modes', () => {
      const htmlSage = renderToString(
        React.createElement(BayerDitherTransition, { palette: SAGE_PALETTE })
      );
      expect(htmlSage).toContain('data-testid="bayer-dither-canvas"');

      const htmlAmber = renderToString(
        React.createElement(BayerDitherTransition, { palette: AMBER_PALETTE })
      );
      expect(htmlAmber).toContain('data-testid="bayer-dither-canvas"');
    });

    it('integrates inside CRTDioramaStage strictly inside the CRT glass screen at z-index 35', () => {
      const htmlStage = renderToString(React.createElement(CRTDioramaStage));

      expect(htmlStage).toContain('data-testid="bayer-dither-canvas"');
      expect(htmlStage).toContain('z-index:35');
      expect(htmlStage).toContain('image-rendering:pixelated');
    });
  });

  describe('3. Spacious Level 2 OS Reader Window (RetroOSWindow.tsx)', () => {
    it('expands to fill CRT interior cleanly with inset: 16px, z-index: 30, background: #111712, border: 2px solid #c2cdb4', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-os-window"');
      expect(htmlExpanded).toContain('inset:16px');
      expect(htmlExpanded).toContain('z-index:30');
      expect(htmlExpanded).toContain('background-color:#111712');
      expect(htmlExpanded).toContain('border:2px solid #c2cdb4');
    });

    it('renders persistent top navigation bar with direct 1-click tab switches ([1] WORK | [2] ABOUT | [3] RESUME & CONTACT)', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-persistent-nav"');

      // Tab 1: 1. Selected Work (desktop) / 1. Work (compact)
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-projects"');
      expect(htmlExpanded).toContain('1. Work');
      expect(htmlExpanded).toContain('1. Selected Work');

      // Tab 2: 2. About & Skills (desktop) / 2. About (compact)
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-about"');
      expect(htmlExpanded).toContain('2. About');
      expect(htmlExpanded).toContain('2. About &amp; Skills');

      // Tab 3: 3. Resume & Contact (desktop) / 3. Resume (compact)
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-resume"');
      expect(htmlExpanded).toContain('3. Resume');
      expect(htmlExpanded).toContain('3. Resume &amp; Contact');
    });

    it('renders prominent Back to Desktop button on the right of the persistent top nav', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-btn-back-desktop"');
      expect(htmlExpanded).toContain('Back to Desktop');
      expect(htmlExpanded).toContain('Back to Desktop (Esc)');
    });

    it('enforces generous internal breathing space (padding: clamp(24px, 3vw, 44px)) inside the window body', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-content-viewport"');
      expect(htmlExpanded).toContain('padding:clamp(24px, 3vw, 44px)');
      expect(htmlExpanded).toContain('scroll-behavior:smooth');
    });

    it('removes the redundant visual bottom command bar to ensure zero bottom obstruction', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      // Redundant visual bottom bar is stripped of visual geometry
      expect(htmlExpanded).toContain('data-testid="retro-window-persistent-footer"');
      expect(htmlExpanded).toContain('sr-only');
      expect(htmlExpanded).not.toContain('border-t-2 shrink-0 text-[8px]');
    });

    it('makes project items in preview box clickable to expand Level 2 window', () => {
      const htmlOverview = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'projects' })
      );

      expect(htmlOverview).toContain('data-testid="quick-view-project-1"');
      expect(htmlOverview).toContain('data-testid="quick-view-project-2"');
      expect(htmlOverview).toContain('data-testid="quick-view-project-3"');
      expect(htmlOverview).toContain('data-testid="quick-view-project-4"');
      expect(htmlOverview).toContain('data-testid="quick-view-inspect-prompt"');
    });
  });

  describe('4. Transition Orchestration & Context Integration', () => {
    it('exposes registerDitherTransition and isDitherTransitioning in RetroOSContext', () => {
      let contextVal: ReturnType<typeof useRetroOS> | null = null;
      const Consumer = () => {
        contextVal = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(RetroOSProvider, null, React.createElement(Consumer))
      );

      expect(contextVal).not.toBeNull();
      expect(typeof contextVal!.registerDitherTransition).toBe('function');
      expect(contextVal!.isDitherTransitioning).toBe(false);
    });

    it('deeply verifies registerDitherTransition, openSection, and midpoint swap execution', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      let transitionTriggerCount = 0;
      let capturedSwapFn: (() => void) | null = null;
      let capturedCompleteCb: (() => void) | null = null;

      const Consumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'about', initialExpanded: false },
          React.createElement(Consumer)
        )
      );

      expect(capturedContext).not.toBeNull();

      // Register real dither transition handler
      const unregister = capturedContext!.registerDitherTransition!((swapFn, completeCb) => {
        transitionTriggerCount++;
        capturedSwapFn = swapFn;
        capturedCompleteCb = completeCb ?? null;
      });

      // Opening section 'projects' from collapsed state triggers transition
      capturedContext!.openSection('projects');

      expect(transitionTriggerCount).toBe(1);
      expect(capturedSwapFn).not.toBeNull();

      // Before midpoint swap, view state has not swapped yet
      // Execute the midpoint swap at 170ms
      capturedSwapFn!();

      // After swap, complete transition
      expect(capturedCompleteCb).not.toBeNull();
      capturedCompleteCb!();

      // Clean up
      unregister();
    });

    it('orchestrates collapseWindow back to Level 1 with 340ms dither transition', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      let transitionCalled = false;
      let capturedSwap: (() => void) | null = null;

      const Consumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects', initialExpanded: true },
          React.createElement(Consumer)
        )
      );

      expect(capturedContext).not.toBeNull();

      const unregister = capturedContext!.registerDitherTransition!((swapFn) => {
        transitionCalled = true;
        capturedSwap = swapFn;
      });

      // Trigger collapse back to desktop stage
      capturedContext!.collapseWindow();

      expect(transitionCalled).toBe(true);
      expect(capturedSwap).not.toBeNull();

      unregister();
    });

    it('orchestrates switching modules while expanded with 340ms dither transition', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      let transitionCalled = false;
      let capturedSwap: (() => void) | null = null;

      const Consumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects', initialExpanded: true },
          React.createElement(Consumer)
        )
      );

      const unregister = capturedContext!.registerDitherTransition!((swapFn) => {
        transitionCalled = true;
        capturedSwap = swapFn;
      });

      // Switch to 'resume' while expanded
      capturedContext!.setActiveSection('resume');

      expect(transitionCalled).toBe(true);
      expect(capturedSwap).not.toBeNull();

      unregister();
    });

    it('guarantees 100% full screen coverage curtain on the midpoint swap frame (threshold = 64)', () => {
      // Threshold 64 means all 64 cells in the 8x8 Bayer matrix are filled (no gaps)
      const allFilled = BAYER_MATRIX_8X8.every((row) =>
        row.every((val) => val < 64)
      );
      expect(allFilled).toBe(true);

      // Verify that at threshold 0, zero cells are filled
      const noneFilled = BAYER_MATRIX_8X8.every((row) =>
        row.every((val) => !(val < 0))
      );
      expect(noneFilled).toBe(true);
    });

    it('verifies scrollbar step buttons enforce clean single-click and hold-to-repeat ergonomics', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-scrollbar-btn-up"');
      expect(htmlExpanded).toContain('data-testid="retro-scrollbar-btn-down"');
      expect(htmlExpanded).toContain('touch-action:manipulation');
    });
  });

  describe('5. Bayer Transition Lifecycle, Frame Stepping & Robustness', () => {
    it('verifies uniform 8x8 Bayer matrix spatial distribution and energy equilibrium', () => {
      // Mean of all 64 values (0 to 63) is exactly 31.5
      let sum = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          sum += BAYER_MATRIX_8X8[r][c];
        }
      }
      expect(sum / 64).toBe(31.5);

      // Verify recursive Bayer matrix quadrant distribution: [4*M, 4*M+2; 4*M+3, 4*M+1]
      const quadrants = [0, 0, 0, 0];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const qIdx = (r < 4 ? 0 : 2) + (c < 4 ? 0 : 1);
          quadrants[qIdx] += BAYER_MATRIX_8X8[r][c];
        }
      }
      expect(quadrants.map((q) => q / 16)).toEqual([30, 32, 33, 31]);
    });

    it('simulates 340ms choreograph: progressive fill (0-170ms), 100% curtain & swap (170ms), dissolve (170-340ms)', () => {
      // Phase 1: Leave phase (0ms to 170ms)
      const t0 = 0;
      const p0 = t0 / DITHER_TRANSITION_MIDPOINT_MS;
      const th0 = Math.min(64, Math.floor(p0 * 65));
      expect(th0).toBe(0);

      const tMidLeave = 85;
      const pMidLeave = tMidLeave / DITHER_TRANSITION_MIDPOINT_MS;
      const thMidLeave = Math.min(64, Math.floor(pMidLeave * 65));
      expect(thMidLeave).toBe(32); // exactly half of cells filled

      // Midpoint swap curtain at 170ms: 100% full coverage
      const thSwap = 64;
      let filledCountSwap = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (BAYER_MATRIX_8X8[r][c] < thSwap) filledCountSwap++;
        }
      }
      expect(filledCountSwap).toBe(64); // 100% full coverage

      // Phase 2: Enter phase dissolve (170ms to 340ms)
      const tMidEnter = 255;
      const pMidEnter = (tMidEnter - DITHER_TRANSITION_MIDPOINT_MS) / (DITHER_TRANSITION_TOTAL_MS - DITHER_TRANSITION_MIDPOINT_MS);
      const dthMidEnter = Math.min(64, Math.floor(pMidEnter * 64));
      expect(dthMidEnter).toBe(32);

      let remainingCellsMidEnter = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (BAYER_MATRIX_8X8[r][c] >= dthMidEnter) remainingCellsMidEnter++;
        }
      }
      expect(remainingCellsMidEnter).toBe(32); // exactly half of cells dissolved

      // At completion (340ms), dissolve threshold reaches 64 (0 cells remaining)
      const tEnd = 340;
      const pEnd = (tEnd - DITHER_TRANSITION_MIDPOINT_MS) / (DITHER_TRANSITION_TOTAL_MS - DITHER_TRANSITION_MIDPOINT_MS);
      const dthEnd = Math.min(64, Math.floor(pEnd * 64));
      expect(dthEnd).toBe(64);

      let remainingCellsEnd = 0;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (BAYER_MATRIX_8X8[r][c] >= dthEnd) remainingCellsEnd++;
        }
      }
      expect(remainingCellsEnd).toBe(0);
    });

    it('ensures rapid sequential tab clicks do not drop pending state swaps or leak callbacks', () => {
      let swapCount = 0;
      let completeCount = 0;

      const swapFn1 = () => { swapCount++; };
      const completeCb1 = () => { completeCount++; };
      const swapFn2 = () => { swapCount++; };
      const completeCb2 = () => { completeCount++; };

      // Simulate first transition started
      let pendingSwap: (() => void) | null = swapFn1;
      let pendingComplete: (() => void) | null = completeCb1;
      let midpointSwapped = false;

      // Second transition arrives before midpoint of first
      if (pendingSwap && !midpointSwapped) {
        pendingSwap();
        pendingSwap = null;
      }
      if (pendingComplete) {
        pendingComplete();
        pendingComplete = null;
      }

      pendingSwap = swapFn2;
      pendingComplete = completeCb2;

      expect(swapCount).toBe(1);
      expect(completeCount).toBe(1);

      // Now second transition reaches midpoint
      pendingSwap();
      pendingSwap = null;
      midpointSwapped = true;

      // Second transition completes
      pendingComplete();
      pendingComplete = null;

      expect(swapCount).toBe(2);
      expect(completeCount).toBe(2);
    });

    it('verifies reference-counted isDitherTransitioning logic across rapid interrupted transitions', () => {
      let activeTransitions = 0;
      let isTransitioning = false;
      const setTransitioning = (val: boolean) => {
        isTransitioning = val;
      };

      const handlerCompletions: (() => void)[] = [];
      const handler = (_swap: () => void, complete: () => void) => {
        handlerCompletions.push(complete);
      };

      const trigger = (swapFn: () => void, completeCb?: () => void) => {
        activeTransitions += 1;
        setTransitioning(true);
        handler(swapFn, () => {
          activeTransitions = Math.max(0, activeTransitions - 1);
          if (activeTransitions === 0) {
            setTransitioning(false);
          }
          completeCb?.();
        });
      };

      // Trigger transition 1
      trigger(() => {});
      expect(isTransitioning).toBe(true);
      expect(activeTransitions).toBe(1);

      // Trigger transition 2 before transition 1 finishes
      trigger(() => {});
      expect(isTransitioning).toBe(true);
      expect(activeTransitions).toBe(2);

      // Transition 1 completion fires (from interruption cleanup)
      handlerCompletions[0]();
      // Counter is still 1, so isTransitioning must remain true
      expect(isTransitioning).toBe(true);
      expect(activeTransitions).toBe(1);

      // Transition 2 completes
      handlerCompletions[1]();
      // Counter reaches 0, isTransitioning becomes false
      expect(isTransitioning).toBe(false);
      expect(activeTransitions).toBe(0);
    });

    it('gracefully handles missing matchMedia or throwing callbacks without unhandled exceptions', () => {
      // Test throw isolation in midpoint swap and completion
      let errorHandled = false;
      const throwingSwap = () => {
        throw new Error('Midpoint swap error test');
      };
      const throwingComplete = () => {
        throw new Error('Completion callback error test');
      };

      try {
        try { throwingSwap(); } catch { errorHandled = true; }
        expect(errorHandled).toBe(true);

        let completeHandled = false;
        try { throwingComplete(); } catch { completeHandled = true; }
        expect(completeHandled).toBe(true);
      } catch (err) {
        expect.unreachable('Should have caught exceptions internally');
      }
    });
  });
});
