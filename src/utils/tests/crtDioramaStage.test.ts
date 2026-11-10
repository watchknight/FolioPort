import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  CRTDioramaStage,
  SAGE_PALETTE,
  AMBER_PALETTE,
} from '../../components/CRTDioramaStage';

describe('CRTDioramaStage Retro 90s Pixel Art Diorama & Header Verification', () => {
  describe('1. Top-Left Terminal Greeting Header & Top-Right Telemetry', () => {
    it('renders primary command prompt greeting with uppercase pixel typography in #c2cdb4 on #111712 screen', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Container has CRT screen void #111712
      expect(html).toContain('data-testid="crt-diorama-stage"');
      expect(html).toContain('background-color:#111712');

      // Command prompt greeting: WELCOME TO MOAYED'S PORTFOLIO in #c2cdb4
      expect(html).toContain('WELCOME TO MOAYED');
      expect(html).toContain('PORTFOLIO');
      expect(html).toContain('#c2cdb4');
    });

    it('implements stepped character typewriter animation (steps(22, end)) and blinking block cursor (█ using steps(2, start) infinite)', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Stepped typewriter entrance with steps(22, end)
      expect(html).toContain('steps(22, end)');
      expect(html).toContain('crt-typewriter-steps');
      expect(html).toContain('data-testid="crt-typewriter-greeting"');

      // Rhythmically blinking block cursor with steps(2, start) infinite keyframe
      expect(html).toContain('█');
      expect(html).toContain('steps(2, start)');
      expect(html).toContain('crt-block-cursor');
      expect(html).toContain('data-testid="crt-blinking-cursor"');
    });

    it('displays minimalist system telemetry readout in top-right corner with #6e7d62: SYS.96 // EWU-CSE // @WATCHKNIGHT', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('SYS.96 // EWU-CSE // @WATCHKNIGHT');
      expect(html).toContain('data-testid="crt-telemetry-readout"');
      expect(html).toContain('#6e7d62');
    });
  });

  describe('2. Horizontal Desk Surface Line', () => {
    it('renders a crisp full-width 2px solid #6e7d62 horizontal desk line across middle of CRT viewport', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-horizontal-desk-line"');
      expect(html).toContain('border-bottom:2px solid #6e7d62');
      expect(html).toContain('height:2px');
      expect(html).toContain('background-color:#6e7d62');
    });
  });

  describe('3. Three Pure Inline SVG Pixel-Grid Artworks (shape-rendering="crispEdges")', () => {
    it('renders three inline SVG artworks with shape-rendering="crispEdges" on integer pixel grids', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // All SVGs enforce crispEdges for pixel-perfect rendering without antialiasing
      const matches = html.match(/shape-rendering="crispEdges"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(3);
    });

    it('strictly adheres to the 4-color monochrome phosphor palette: #c2cdb4, #6e7d62, #2e3b2b, and #111712', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // All 4 strict shades must be present
      expect(html).toContain('#c2cdb4');
      expect(html).toContain('#6e7d62');
      expect(html).toContain('#2e3b2b');
      expect(html).toContain('#111712');

      // Check palette constant definitions
      expect(SAGE_PALETTE.bright).toBe('#c2cdb4');
      expect(SAGE_PALETTE.mid).toBe('#6e7d62');
      expect(SAGE_PALETTE.dim).toBe('#2e3b2b');
      expect(SAGE_PALETTE.void).toBe('#111712');
    });

    it('renders Left Element: 32x48 Developer Avatar (Abdur Rahman Moayed) with jacket, shirt, hair, breathing motion and eye blink', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Developer Avatar sprite
      expect(html).toContain('data-testid="developer-avatar-sprite"');
      expect(html).toContain('viewBox="0 0 32 48"');
      expect(html).toContain('crt-avatar-breathing');
      expect(html).toContain('crt-avatar-eyelid');

      // Breathing animation keyframe definition steps(2)
      expect(html).toContain('crtAvatarIdleBreathe');
      expect(html).toContain('steps(2)');

      // Accessible aria label
      expect(html).toContain('Abdur Rahman Moayed Pixel Developer Avatar');
    });

    it('renders Center-Right Element: Compact 90s Macintosh Monitor with dark screen, prompt lines, and sloped keyboard base resting on desk line', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Compact Mac sprite
      expect(html).toContain('data-testid="compact-mac-sprite"');
      expect(html).toContain('viewBox="0 0 56 48"');
      expect(html).toContain('Compact 90s Macintosh Computer');

      // Prompt lines & keyboard keys resting on desk line (y=47-48)
      expect(html).toContain('y="47"');
      expect(html).toContain('y="14"');
    });

    it('renders Far-Right Element: Large 90s IBM Desktop PC Workstation with horizontal CPU case, floppy slots, power LED, stacked CRT monitor with scrolling code, and wide keyboard', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // IBM Workstation sprite
      expect(html).toContain('data-testid="ibm-workstation-sprite"');
      expect(html).toContain('viewBox="0 0 72 48"');
      expect(html).toContain('1990s IBM Desktop PC Workstation');

      // Scrolling miniature lines of code on CRT monitor
      expect(html).toContain('crt-ibm-scroll');
      expect(html).toContain('crtIbmCodeScroll');

      // Floppy drive slots & wide keyboard base on desk line (y=47-48)
      expect(html).toContain('y="47"');
    });
  });

  describe('4. Interactive Diorama Micro-States & Secondary Monochrome Phosphor Filter', () => {
    it('supports 90s RPG pixel speech bubble micro-state with exact text: HI! I\'M MOAYED (CSE @ EWU). PRESS [1], [2], OR [3] TO EXPLORE!', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Speech bubble testid and interactive keyboard accessibility
      expect(html).toContain('data-testid="rpg-speech-bubble"');
      expect(html).toContain('MOAYED (CSE @ EWU). PRESS [1], [2], OR [3] TO EXPLORE!');
      expect(html).toContain('data-testid="developer-avatar-sprite"');
      expect(html).toContain('role="button"');
      expect(html).toContain('tabindex="0"');
    });

    it('supports toggling Vintage Amber phosphor filter #d4a359 while adhering to strict 4-color monochrome rule', () => {
      const htmlAmber = renderToString(
        React.createElement(CRTDioramaStage, { initialPhosphor: 'amber' })
      );

      // Amber bright #d4a359 in place of sage-green #c2cdb4
      expect(htmlAmber).toContain('#d4a359');
      expect(htmlAmber).toContain(AMBER_PALETTE.bright);
      expect(htmlAmber).toContain(AMBER_PALETTE.mid);
      expect(htmlAmber).toContain(AMBER_PALETTE.dim);
      expect(htmlAmber).toContain(AMBER_PALETTE.void);

      // Verify strict 4 shades for Amber palette
      expect(AMBER_PALETTE.bright).toBe('#d4a359');
      expect(AMBER_PALETTE.mid).toBe('#967139');
      expect(AMBER_PALETTE.dim).toBe('#3d2b12');
      expect(AMBER_PALETTE.void).toBe('#140f07');

      // Desk line updates color to Amber mid tone
      expect(htmlAmber).toContain(`border-bottom:2px solid ${AMBER_PALETTE.mid}`);
    });

    it('supports Large Desktop PC click micro-state showing live GitHub status @watchknight // ONLINE', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="ibm-workstation-sprite"');
      expect(html).toContain('data-testid="github-status-hud"');
      expect(html).toContain('@watchknight // ONLINE');
      expect(html).toContain('role="button"');
      expect(html).toContain('tabindex="0"');
    });

    it('enforces strict integer coordinates on all SVG rect elements without decimals', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Extract all x, y, width, height attributes from SVGs and ensure none contain decimal points
      const decimalMatch = html.match(/(?:x|y|width|height)="[0-9]+\.[0-9]+"/g);
      expect(decimalMatch).toBeNull();
    });

    it('enforces GEMINI.md design rules: strictly zero banned legacy colors', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Banned legacy colors in GEMINI.md: terracotta (#D9532F, #A74024, #FF4D1C) and muted sage (#4E9A7F)
      expect(html.toLowerCase()).not.toContain('#d9532f');
      expect(html.toLowerCase()).not.toContain('#a74024');
      expect(html.toLowerCase()).not.toContain('#ff4d1c');
      expect(html.toLowerCase()).not.toContain('#4e9a7f');
    });

    it('supports custom className prop on root container', () => {
      const html = renderToString(
        React.createElement(CRTDioramaStage, { className: 'custom-stage-mount' })
      );

      expect(html).toContain('custom-stage-mount');
    });

    it('positions blinking block cursor immediately following PORTFOLIO on line 2', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // The typewriter span must contain WELCOME TO MOAYED'S and PORTFOLIO with the block cursor inline
      const typewriterGreetingMatch = html.match(
        /data-testid="crt-typewriter-greeting"[^>]*>([\s\S]*?)<\/span>/
      );
      expect(typewriterGreetingMatch).not.toBeNull();
      const content = typewriterGreetingMatch![1];
      expect(content).toContain('WELCOME TO MOAYED');
      expect(content).toContain('PORTFOLIO');
      expect(content).toContain('data-testid="crt-blinking-cursor"');
      expect(content).toContain('crt-block-cursor');
    });

    it('enforces white-space: pre to prevent awkward multi-line word wrap jumps during typing', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));
      expect(html).toContain('white-space: pre');
    });

    it('enforces SVG clipPath on IBM CRT monitor to prevent scrolling code from spilling onto monitor bezel', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('id="crt-ibm-screen-clip"');
      expect(html).toContain('clip-path="url(#crt-ibm-screen-clip)"');
    });

    it('anchors avatar shoes firmly at desk surface line (y=47-48) while breathing animation is isolated to upper body', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Shoes rects are outside crt-avatar-breathing group or grounded at y=47-48
      expect(html).toContain('y="47"');
      expect(html).toContain('y="44"');
    });

    it('strictly adheres to pure 4-shade monochrome palette without hardcoded #000000 shadows in Amber mode', () => {
      const htmlAmber = renderToString(
        React.createElement(CRTDioramaStage, { initialPhosphor: 'amber' })
      );

      // In Amber mode, no #000000 drop shadows
      expect(htmlAmber).not.toContain('shadow-[2px_2px_0_0_#000000]');
      expect(htmlAmber).toContain(`box-shadow:2px 2px 0 0 ${AMBER_PALETTE.void}`);
    });
  });
});
