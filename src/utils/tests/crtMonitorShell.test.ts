import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CRTMonitorShell } from '../../components/CRTMonitorShell';
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';

declare const process: any;

describe('SYS.96 Retro 90s CRT Monitor Shell & Phosphor Engine Verification', () => {
  describe('1. CRTMonitorShell Hardware Architecture (src/components/CRTMonitorShell.tsx)', () => {
    it('renders the centered 90s CRT monitor hardware frame with 4:3 desktop aspect ratio and #0a0e0b room background', () => {
      const html = renderToString(
        React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'TERMINAL_SESSION_ACTIVE'))
      );

      // #0a0e0b dark outer room background
      expect(html).toContain('bg-[#0a0e0b]');
      expect(html).toContain('data-testid="crt-monitor-room"');

      // 980px max width and 4/3 aspect ratio on desktop with full viewport adaptive frame on mobile
      expect(html).toContain('max-w-[980px]');
      expect(html).toContain('md:aspect-[4/3]');
      expect(html).toContain('min-h-screen md:min-h-0');
      expect(html).toContain('data-testid="crt-monitor-casing"');
    });

    it('sculpts thick #c8c2ab plastic bezel with 3D bevel borders, recessed seams, and deep inner shadow lip #3b3a32', () => {
      const html = renderToString(
        React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'TERMINAL_SESSION_ACTIVE'))
      );

      // Beige plastic casing
      expect(html).toContain('bg-[#c8c2ab]');

      // Pure CSS 3D bevel borders
      expect(html).toContain('border-t-[#ded8c1]');
      expect(html).toContain('border-l-[#ded8c1]');
      expect(html).toContain('border-b-[#8f8973]');
      expect(html).toContain('border-r-[#8f8973]');

      // Deep recessed inner screen frame lip
      expect(html).toContain('bg-[#3b3a32]');
      expect(html).toContain('data-testid="crt-bezel-lip"');
    });

    it('frames the curved CRT glass screen with 28px border radius, 65px inset shadow, and dark green background #111712', () => {
      const html = renderToString(
        React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'TERMINAL_SESSION_ACTIVE'))
      );

      // Curved CRT glass screen
      expect(html).toContain('bg-[#111712]');
      expect(html).toContain('rounded-[28px]');
      expect(html).toContain('shadow-[inset_0_0_65px_rgba(0,0,0,0.75)]');
      expect(html).toContain('crt-glass-screen');
      expect(html).toContain('data-lenis-prevent');
      expect(html).toContain('TERMINAL_SESSION_ACTIVE');
    });

    it('renders tactile hardware controls along bottom-right bezel: clickable Power button with glowing pixel LED and [SFX: ON/OFF] toggle', () => {
      const html = renderToString(
        React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'TERMINAL_SESSION_ACTIVE'))
      );

      // Power button and PWR pixel LED
      expect(html).toContain('[POWER]');
      expect(html).toContain('PWR');
      expect(html).toContain('bg-[#c2cdb4]'); // Active glowing pixel LED

      // [SFX: ON/OFF] hardware toggle switch
      expect(html).toContain('[SFX: ON]');

      // Debossed manufacturer branding
      expect(html).toContain('WATCHKNIGHT');
      expect(html).toContain('SYS.96 CRT');
    });
  });

  describe('2. Strict 4-Color Monochrome Phosphor Tokens & Tailwind Config (tailwind.config.js)', () => {
    it('verifies custom Tailwind theme colors and spacing tokens in tailwind.config.js', () => {
      const configPath = path.resolve(process.cwd(), 'tailwind.config.js');
      const configContent = fs.readFileSync(configPath, 'utf8');

      // Required custom colors
      expect(configContent).toContain("'retro-void': '#0a0e0b'");
      expect(configContent).toContain("'bezel-base': '#c8c2ab'");
      expect(configContent).toContain("'bezel-light': '#ded8c1'");
      expect(configContent).toContain("'bezel-shadow': '#8f8973'");
      expect(configContent).toContain("'bezel-lip': '#3b3a32'");
      expect(configContent).toContain("'crt-bg': '#111712'");
      expect(configContent).toContain("'pixel-dim': '#2e3b2b'");
      expect(configContent).toContain("'pixel-mid': '#6e7d62'");
      expect(configContent).toContain("'pixel-bright': '#c2cdb4'");

      // Pixel spacing tokens
      expect(configContent).toContain("'px-1': '4px'");
      expect(configContent).toContain("'px-2': '8px'");
      expect(configContent).toContain("'px-4': '16px'");
      expect(configContent).toContain("'px-8': '32px'");
    });
  });

  describe('3. Pixel Typography & Optics Invariants (src/styles/index.css & tokens.css)', () => {
    it('defines .pixel-border-bright and .pixel-border-mid with 4px integer box-shadow offsets', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('.pixel-border-bright');
      expect(cssContent).toContain('0 -4px 0 0 #c2cdb4');
      expect(cssContent).toContain('0 4px 0 0 #c2cdb4');
      expect(cssContent).toContain('-4px 0 0 0 #c2cdb4');
      expect(cssContent).toContain('4px 0 0 0 #c2cdb4');

      expect(cssContent).toContain('.pixel-border-mid');
      expect(cssContent).toContain('0 -4px 0 0 #6e7d62');
      expect(cssContent).toContain('0 4px 0 0 #6e7d62');
      expect(cssContent).toContain('-4px 0 0 0 #6e7d62');
      expect(cssContent).toContain('4px 0 0 0 #6e7d62');
    });

    it('enforces crt-glass-screen ::after pseudo-element scanline gradient with 0.04 opacity', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('.crt-glass-screen::after');
      expect(cssContent).toContain('pointer-events: none;');
      expect(cssContent).toContain('z-index: 40;');
      expect(cssContent).toContain('repeating-linear-gradient');
      expect(cssContent).toContain('rgba(0, 0, 0, 0.22) 0px');
      expect(cssContent).toContain('rgba(0, 0, 0, 0.22) 1px');
      expect(cssContent).toContain('opacity: 0.04;');
    });

    it('declares crtTubeCollapse and crtTubeExpand horizontal line collapse keyframes', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('@keyframes crtTubeCollapse');
      expect(cssContent).toContain('@keyframes crtTubeExpand');
      expect(cssContent).toContain('.animate-tube-off');
      expect(cssContent).toContain('.animate-tube-on');
    });

    it('enforces pixelated rendering rules and font smoothing suppression', () => {
      const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('image-rendering: pixelated;');
      expect(cssContent).toContain('image-rendering: crisp-edges;');
      expect(cssContent).toContain('-webkit-font-smoothing: none;');
      expect(cssContent).toContain('font-smooth: never;');
    });
  });
});
