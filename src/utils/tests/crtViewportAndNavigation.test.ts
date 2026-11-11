import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CRTViewportShell } from '../../components/layout/CRTViewportShell';
import { RetroCommandBar } from '../../components/navigation/RetroCommandBar';
import { SkillMatrix } from '../../components/SkillMatrix';
import { About } from '../../components/About';
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';

declare const process: any;

describe('CRT Viewport Shell, Command Bar & Section Decluttering', () => {
  describe('1. Duplicate Sections Purged Verification', () => {
    it('verifies legacy About component renders null (zero DOM footprint)', () => {
      const html = renderToString(React.createElement(About));
      expect(html).toBe('');
    });

    it('verifies legacy duplicate blocks are deleted from SkillMatrix and App', () => {
      const skillMatrixHtml = renderToString(React.createElement(SkillMatrix));

      // Redundant ROM_TRACER / ARCHITECTURAL_PCB_TRACER 6-card row is purged
      expect(skillMatrixHtml).not.toContain('ARCHITECTURAL_PCB_TRACER');
      expect(skillMatrixHtml).not.toContain('ROM_TRACER');
      expect(skillMatrixHtml).not.toContain('PONG_SURF');
      expect(skillMatrixHtml).not.toContain('PILLAR_01');
      expect(skillMatrixHtml).not.toContain('OFFICIAL SYSTEM RECORD // AUDIT TELEMETRY');
      expect(skillMatrixHtml).not.toContain('REF. 01');

      // Superior 8-bit LED readouts and Motherboard PCB bus are retained
      expect(skillMatrixHtml).toContain('Real-Time Metrics');
      expect(skillMatrixHtml).toContain('Systems Verification');
    });
  });

  describe('2. Streamlined CRT Viewport Shell (CRTViewportShell.tsx)', () => {
    it('frames the viewport with a sleek 4px dark anodized bezel (#131629)', () => {
      const html = renderToString(
        React.createElement(CRTViewportShell, null, React.createElement('div', null, 'Content'))
      );

      // Sleek 4px dark anodized bezel
      expect(html).toContain('border-4');
      expect(html).toContain('border-[#131629]');
      expect(html).toContain('fixed inset-0');

      // Reclaimed viewport content clearances
      expect(html).toContain('pt-[52px]');
      expect(html).toContain('pb-[28px]');
    });

    it('renders the ultra-slim 28px bottom chin with MULTISYNC 17", Degauss, CRT FX and Power LED', () => {
      const html = renderToString(
        React.createElement(CRTViewportShell, null, React.createElement('div', null, 'Content'))
      );

      // 28px bottom chin
      expect(html).toContain('h-[28px]');
      expect(html).toContain('WATCHKNIGHT');
      expect(html).toContain('MULTISYNC 17');
      expect(html).toContain('Degauss');
      expect(html).toContain('CRT FX:');
      expect(html).toContain('FULL');
      expect(html).toContain('Power');
    });
  });

  describe('3. Compact Glass-Phosphor Command Bar (RetroCommandBar.tsx)', () => {
    it('renders the 52px height command bar with glass-phosphor styling', () => {
      const html = renderToString(React.createElement(RetroCommandBar));

      expect(html).toContain('height:52px');
      expect(html).toContain('rgba(7, 8, 20, 0.94)');
      expect(html).toContain('backdrop-filter:blur(12px)');
      expect(html).toContain('border-bottom:1px solid rgba(0, 240, 255, 0.25)');
    });

    it('contains left developer credentials & blinking green indicator EWU CSE • Dhaka (UTC+6)', () => {
      const html = renderToString(React.createElement(RetroCommandBar));

      expect(html).toContain('@watchknight');
      expect(html).toContain('EWU CSE • Dhaka');
      expect(html).toContain('(UTC+6)');
    });

    it('contains all 6 required center navigation items', () => {
      const html = renderToString(React.createElement(RetroCommandBar));

      expect(html).toContain('01');
      expect(html).toContain('Work');
      expect(html).toContain('02');
      expect(html).toContain('Extensions');
      expect(html).toContain('03');
      expect(html).toContain('Skills');
      expect(html).toContain('04');
      expect(html).toContain('GitHub');
      expect(html).toContain('05');
      expect(html).toContain('Terminal');
      expect(html).toContain('06');
      expect(html).toContain('Contact');
    });

    it('contains the [RENDER: 3D / PIXEL / CRT] mode toggle and [♫ 8-BIT AUDIO] toggle', () => {
      const html = renderToString(React.createElement(RetroCommandBar));

      expect(html).toContain('RENDER:');
      expect(html).toContain('3D');
      expect(html).toContain('PIXEL');
      expect(html).toContain('CRT');
      expect(html).toContain('8-BIT AUDIO:');
    });
  });

  describe('4. Dual-Register Cyber-CRT Color Palette in src/index.css', () => {
    it('enforces the exact 8 color tokens in src/index.css :root', () => {
      const cssPath = path.resolve(process.cwd(), 'src/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');

      expect(cssContent).toContain('--crt-void-bg: #070814');
      expect(cssContent).toContain('--crt-phosphor-dark: #0D1512');
      expect(cssContent).toContain('--crt-panel-slate: #131629');
      expect(cssContent).toContain('--tech-cyan-wave: #00F0FF');
      expect(cssContent).toContain('--tech-magenta-crest: #FF2A85');
      expect(cssContent).toContain('--pixel-phosphor-green: #4AF626');
      expect(cssContent).toContain('--pixel-amber-gold: #FFCC00');
      expect(cssContent).toContain('--pixel-ivory-text: #F0EFE6');
    });
  });
});
