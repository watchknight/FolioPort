// src/utils/tests/shutterSectionStack.test.ts
// Unit and Integration Verification for Layered Cyber-Shutter (Shop-Shutter Roll-Up) Deck
// Spec 1: Tall-Section-Safe Layered Unstacking & Phosphor Translucency
// Spec 2: Articulated Horizontal Louver Slats (5 slats, 6px each, 3D compression)
// Spec 3: Interactive Manual Quick-Lift Handle & Lenis Auto-Roll Integration
// Spec 4: Sub-layer Light & H-Sync Scanline Uncover Edge Beam
// Spec 5: Shutter Ratchet SFX & matchMedia Responsive Fallbacks

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ShutterSectionStack, ShutterLayer } from '../../components/ShutterSectionStack';
import { ShutterDeckController } from '../sectionTransitions';
import { App } from '../../App';

declare const process: any;

describe('Layered Cyber-Shutter (Shop-Shutter Roll-Up) Deck (@src/components/ShutterSectionStack.tsx)', () => {
  describe('1. Tall-Section-Safe Layered Unstacking & Mechanical Chassis', () => {
    it('manages stacking context according to total - index formula', () => {
      const html = renderToString(
        React.createElement(
          ShutterSectionStack,
          { total: 6 },
          React.createElement(
            ShutterLayer,
            { index: 0, total: 6, title: 'HERO_HORIZON' },
            React.createElement('div', null, 'Sector 01 Content')
          ),
          React.createElement(
            ShutterLayer,
            { index: 1, total: 6, title: 'FLAGSHIP_SYSTEMS' },
            React.createElement('div', null, 'Sector 02 Content')
          )
        )
      );

      // Layer 0: zIndex = (6 - 0) * 10 = 60
      expect(html).toContain('z-index:60');
      // Layer 1: zIndex = (6 - 1) * 10 = 50
      expect(html).toContain('z-index:50');
      expect(html).toContain('data-shutter-index="0"');
      expect(html).toContain('data-shutter-index="1"');
      expect(html).toContain('data-shutter-layer="bay-01"');
      expect(html).toContain('data-shutter-layer="bay-02"');
    });

    it('enforces heavy bottom mechanical shadow on each shutter layer', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON' },
          React.createElement('div', null, 'Content')
        )
      );

      // Shadow spec: 0 36px 70px rgba(0, 0, 0, 0.95), 0 4px 20px rgba(0, 240, 255, 0.18)
      expect(html).toContain('0 36px 70px rgba(0, 0, 0, 0.95)');
      expect(html).toContain('0 4px 20px rgba(0, 240, 255, 0.18)');
    });

    it('applies dark translucent cyber-phosphor surface for persistent 3D wave visibility', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON' },
          React.createElement('div', null, 'Content')
        )
      );

      // Phosphor surface: linear-gradient(180deg, rgba(7, 8, 20, 0.90) 0%, rgba(13, 21, 18, 0.94) 100%)
      expect(html).toContain('rgba(7, 8, 20, 0.9');
      expect(html).toContain('rgba(13, 21, 18, 0.94');
      expect(html).toContain('backdrop-filter:blur(8px)');
    });
  });

  describe('2. Articulated Horizontal Louver Slats (Bottom Lip Mechanic)', () => {
    it('renders exactly 5 horizontal metallic louver slats with height: 6px each', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON' },
          React.createElement('div', null, 'Content')
        )
      );

      // 5 Louver slats present (word boundary to distinguish from shutter-slats-wrap)
      const slatMatches = html.match(/\bshutter-slat\b/g);
      expect(slatMatches).not.toBeNull();
      expect(slatMatches?.length).toBe(5);

      // Slat styling tokens
      expect(html).toContain('height:6px');
      expect(html).toContain('background-color:#131629');
      expect(html).toContain('border-top:1px solid rgba(0, 240, 255, 0.3)');
      expect(html).toContain('border-bottom:1px solid #070814');

      // 3D perspective wrap - must have overflow-visible to preserve transform-style: preserve-3d
      expect(html).toContain('perspective:800px');
      expect(html).toContain('transform-style:preserve-3d');
      expect(html).toContain('overflow-visible');
    });

    it('renders reinforced locking bar with cyber-hazard diagonal stripes and dual status LEDs', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON' },
          React.createElement('div', null, 'Content')
        )
      );

      // Reinforced bottom bar height: 48px overall
      expect(html).toContain('shutter-bottom-bar');
      expect(html).toContain('height:48px');

      // Hazard striping
      expect(html).toContain('repeating-linear-gradient(-45deg, #00F0FF, #00F0FF 6px, #070814 6px, #070814 12px)');

      // Dual status LEDs initialized to LOCKED
      expect(html).toContain('data-status="LOCKED"');
      expect(html).toContain('LOCKED');
      expect(html).toContain('bg-[#4AF626]');
    });
  });

  describe('3. Interactive Manual Quick-Lift Handle & Secondary Navigation', () => {
    it('mounts centered Quick-Lift handle targeting the next bay', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON' },
          React.createElement('div', null, 'Content')
        )
      );

      expect(html).toContain('quick-lift-btn');
      expect(html).toContain('▲ Next: Bay 02');
      // Section 01 should not render secondary PREV BAY button
      expect(html).not.toContain('▼ Prev Bay');
    });

    it('mounts secondary [ Prev Bay ] button on sections 02–06', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 1, total: 6, title: 'FLAGSHIP_SYSTEMS' },
          React.createElement('div', null, 'Content')
        )
      );

      expect(html).toContain('prev-bay-btn');
      expect(html).toContain('▼ Prev Bay');
      expect(html).toContain('▲ Next: Bay 03');
    });

    it('displays return to top prompt on final section (06)', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 5, total: 6, title: 'CONTACT_SATELLITE_UPLINK' },
          React.createElement('div', null, 'Content')
        )
      );

      expect(html).toContain('▲ Return to Top');
    });
  });

  describe('4. Sub-Layer Light & CRT H-Sync Scanline Uncover Beam', () => {
    it('projects a glowing cyan/magenta CRT scanline beam along the bottom shutter edge', () => {
      const html = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON' },
          React.createElement('div', null, 'Content')
        )
      );

      expect(html).toContain('shutter-uncover-beam');
      expect(html).toContain('linear-gradient(90deg, #00F0FF 0%, #FF2A85 50%, #4AF626 100%)');
      expect(html).toContain('0 0 15px #00F0FF');
      expect(html).toContain('0 0 30px #FF2A85');
    });

    it('renders CRT H-Sync laser divider at top of Sector 02 and suppresses on Sector 01', () => {
      const htmlSector1 = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 0, total: 6, title: 'HERO_HORIZON', showDivider: false },
          React.createElement('div', null, 'Hero Content')
        )
      );
      expect(htmlSector1).not.toContain('crt-hsync-divider-container');

      const htmlSector2 = renderToString(
        React.createElement(
          ShutterLayer,
          { index: 1, total: 6, title: 'FLAGSHIP_SYSTEMS' },
          React.createElement('div', null, 'Systems Content')
        )
      );
      expect(htmlSector2).toContain('crt-hsync-divider-container');
      expect(htmlSector2).toContain('crt-hsync-beam');
      expect(htmlSector2).toContain('H-SYNC: 15.734 kHz');
    });
  });

  describe('5. App 6-Sector Deck Integration & Order Integrity', () => {
    it('renders all 6 major sections in strict sequential deck order', () => {
      const html = renderToString(React.createElement(App));

      // Shutter Section Stack container
      expect(html).toContain('shutter-section-stack');
      expect(html).toContain('data-shutter-deck="deck"');

      // 6 Sector tags & titles
      expect(html).toContain('data-sector-title="Hero Horizon"');
      expect(html).toContain('data-sector-title="Selected Work"');
      expect(html).toContain('data-sector-title="Browser Extension Studio"');
      expect(html).toContain('data-sector-title="Architecture &amp; Skills"');
      expect(html).toContain('data-sector-title="GitHub &amp; Terminal"');
      expect(html).toContain('data-sector-title="Contact &amp; Resume"');

      // Check strict monotonic sequence in DOM
      const heroIdx = html.indexOf('data-sector-title="Hero Horizon"');
      const systemsIdx = html.indexOf('data-sector-title="Selected Work"');
      const extensionIdx = html.indexOf('data-sector-title="Browser Extension Studio"');
      const bioIdx = html.indexOf('data-sector-title="Architecture &amp; Skills"');
      const labIdx = html.indexOf('data-sector-title="GitHub &amp; Terminal"');
      const contactIdx = html.indexOf('data-sector-title="Contact &amp; Resume"');

      expect(heroIdx).toBeGreaterThan(-1);
      expect(systemsIdx).toBeGreaterThan(heroIdx);
      expect(extensionIdx).toBeGreaterThan(systemsIdx);
      expect(bioIdx).toBeGreaterThan(extensionIdx);
      expect(labIdx).toBeGreaterThan(bioIdx);
      expect(contactIdx).toBeGreaterThan(labIdx);

      // Key interactive navigation targets remain wired
      expect(html).toContain('id="work"');
      expect(html).toContain('id="extensions"');
      expect(html).toContain('id="experience"');
      expect(html).toContain('id="systems"');
      expect(html).toContain('id="lab"');
      expect(html).toContain('id="terminal"');
      expect(html).toContain('id="contact"');
    });

    it('initializes and disposes ShutterDeckController cleanly', () => {
      const mockContainer1 = { style: {} } as unknown as HTMLElement;
      const mockInner1 = { style: {} } as unknown as HTMLElement;
      const mockContainer2 = { style: {} } as unknown as HTMLElement;
      const mockInner2 = { style: {} } as unknown as HTMLElement;

      const controller = new ShutterDeckController({
        layers: [
          {
            container: mockContainer1,
            inner: mockInner1,
            slats: [],
            index: 0,
            total: 2,
            title: 'BAY_01',
          },
          {
            container: mockContainer2,
            inner: mockInner2,
            slats: [],
            index: 1,
            total: 2,
            title: 'BAY_02',
          },
        ],
        playAudio: false,
      });

      expect(controller).toBeDefined();
      expect(() => controller.dispose()).not.toThrow();
    });

    it('enforces translucent CSS background overrides for shutter-content children in stylesheet', async () => {
      // @ts-ignore
      const fs = await import('node:fs');
      // @ts-ignore
      const path = await import('node:path');
      const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain('.shutter-content > section');
      expect(cssContent).toContain('background-color: transparent !important');
    });
  });
});
