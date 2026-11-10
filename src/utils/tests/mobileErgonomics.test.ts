import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CRTMonitorShell } from '../../components/CRTMonitorShell';
import { RetroCommandMenu } from '../../components/RetroCommandMenu';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { CRTBootSequence } from '../../components/CRTBootSequence';

describe('RESPONSIVE MOBILE CRT & TOUCH ERGONOMICS', () => {
  describe('1. Mobile Viewport 100dvh Adaptation & Crisp Pixel Borders', () => {
    it('adapts cleanly to fill 100dvh without horizontal overflow on mobile viewports (< 768px)', () => {
      const html = renderToString(
        React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'MOBILE_WORKSPACE'))
      );

      // Room and casing fill 100dvh and prevent horizontal overflow
      expect(html).toContain('h-[100dvh]');
      expect(html).toContain('overflow-x-hidden');
      expect(html).toContain('data-testid="crt-monitor-casing"');
    });

    it('preserves crisp integer pixel borders on monitor casing across all viewports', () => {
      const html = renderToString(
        React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'MOBILE_WORKSPACE'))
      );

      // Integer 8px and 12px 3D bevel borders
      expect(html).toContain('border-t-[8px]');
      expect(html).toContain('border-l-[8px]');
      expect(html).toContain('border-b-[12px]');
      expect(html).toContain('border-r-[12px]');
    });
  });

  describe('2. Touch-Friendly Large Tap Targets (min-height: 44px)', () => {
    it('RetroCommandMenu: enforces min-height: 44px on [1] ABOUT ME, [2] MY PROJECTS, and [3] RESUME', () => {
      const html = renderToString(React.createElement(RetroCommandMenu));

      // Items 1, 2, 3 have min-h-[44px]
      expect(html).toContain('data-testid="retro-command-item-about"');
      expect(html).toContain('data-testid="retro-command-item-projects"');
      expect(html).toContain('data-testid="retro-command-item-resume"');
      expect(html).toContain('min-h-[44px]');

      // All 3 navigation buttons contain min-h-[44px]
      const matches = html.match(/min-h-\[44px\]/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    it('RetroOSWindow Overview Mode: enforces touch-friendly min-h-[44px] on directory buttons', () => {
      const htmlOverview = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'about' })
      );

      expect(htmlOverview).toContain('data-testid="retro-overview-row-about"');
      expect(htmlOverview).toContain('data-testid="retro-overview-row-projects"');
      expect(htmlOverview).toContain('data-testid="retro-overview-row-resume"');
      expect(htmlOverview).toContain('min-h-[44px]');
    });

    it('RetroOSWindow Expanded Mode: enforces min-h-[44px] on navigation tabs and close controls', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlExpanded).toContain('data-testid="retro-window-tab-about"');
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-projects"');
      expect(htmlExpanded).toContain('data-testid="retro-window-tab-resume"');
      expect(htmlExpanded).toContain('data-testid="retro-window-footer-close"');
      expect(htmlExpanded).toContain('min-h-[44px]');
    });
    it('CRTBootSequence: enforces touch-friendly min-h-[44px] on skip button', () => {
      const html = renderToString(React.createElement(CRTBootSequence));

      expect(html).toContain('data-testid="crt-boot-skip-btn"');
      expect(html).toContain('min-h-[44px]');
    });
  });

  describe('3. Smooth Touch Swipe & Scrollbar Button Ergonomics', () => {
    it('configures touch swipe styles on RetroOSWindow content viewport', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-window-content-viewport"');
      expect(html).toContain('touch-action:pan-y');
      expect(html).toContain('overscroll-behavior-y:contain');
    });

    it('provides touch-manipulation and responsive tap heights for pixel scrollbar buttons [▲] / [▼] and thumb', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-scrollbar-btn-up"');
      expect(html).toContain('data-testid="retro-scrollbar-btn-down"');
      expect(html).toContain('data-testid="retro-scrollbar-thumb"');
      expect(html).toContain('touch-action:manipulation');
      expect(html).toContain('min-h-[28px]');
    });
  });
});
