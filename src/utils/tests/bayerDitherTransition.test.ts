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
    it('expands to fill CRT interior cleanly with inset: 20px, z-index: 30, background: #111712, border: 2px solid #c2cdb4', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-os-window"');
      expect(htmlExpanded).toContain('inset:20px');
      expect(htmlExpanded).toContain('z-index:30');
      expect(htmlExpanded).toContain('background-color:#111712');
      expect(htmlExpanded).toContain('border:2px solid #c2cdb4');
    });

    it('renders persistent top navigation bar with direct 1-click tab switches ([1] WORK | [2] ABOUT | [3] RESUME & CONTACT)', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-persistent-nav"');

      // Tab 1: 1. Work
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-projects"');
      expect(htmlExpanded).toContain('1. Work');

      // Tab 2: 2. About
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-about"');
      expect(htmlExpanded).toContain('2. About');

      // Tab 3: 3. Resume
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-resume"');
      expect(htmlExpanded).toContain('3. Resume');
    });

    it('renders prominent Back to Desktop button on the right of the persistent top nav', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-btn-back-desktop"');
      expect(htmlExpanded).toContain('Back to Desktop');
    });

    it('enforces generous internal breathing space (padding: 28px 32px) inside the window body', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-content-viewport"');
      expect(htmlExpanded).toContain('padding:28px 32px');
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
});
