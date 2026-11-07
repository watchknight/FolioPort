import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Hero } from '../../components/Hero';
import { ProjectsShowcase } from '../../components/ProjectsShowcase';
import { ContactFooter } from '../../components/ContactFooter';
import { TransitionProvider } from '../../context/TransitionContext';

describe('Layout Overlap & Viewport Integrity Verification', () => {
  describe('Hero Single-Page 100vh Viewport Integrity', () => {
    it('enforces h-screen and max-h-screen container with overflow-hidden', () => {
      const html = renderToString(React.createElement(Hero));

      // Hero section container must strictly fit within 100vh on desktop
      expect(html).toContain('h-screen');
      expect(html).toContain('max-h-screen');
      expect(html).toContain('overflow-hidden');

      // Inner grid container must flex-1 and remain overflow-hidden
      expect(html).toContain('flex-1');
      expect(html).toContain('lg:grid-cols-12');

      // Marquee docked cleanly at bottom with shrink-0
      expect(html).toContain('hero-marquee-wrap');
      expect(html).toContain('shrink-0');
    });

    it('scales headline typography responsively without oversized fluid clipping', () => {
      const html = renderToString(React.createElement(Hero));

      // Uses balanced font sizing instead of overflowing text-fluid-hero
      expect(html).toContain('text-2xl sm:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl');
      expect(html).toContain('ENGINEERING');
      expect(html).toContain('LOW-LEVEL');
      expect(html).toContain('SYSTEMS');
      expect(html).toContain('EXPERIENCES.');
    });
  });

  describe('Work Section Ledger Mode Grid Layout (Zero Overlap)', () => {
    it('renders ledger mode with strict 12-column grid layout across rows', () => {
      const html = renderToString(
        React.createElement(
          TransitionProvider,
          null,
          React.createElement(ProjectsShowcase)
        )
      );

      // Row grid container
      expect(html).toContain('grid grid-cols-1 sm:grid-cols-12 items-center');

      // Distinct non-overlapping column spans
      expect(html).toContain('sm:col-span-12 lg:col-span-5'); // Index + Title
      expect(html).toContain('sm:col-span-4 lg:col-span-3');  // Role
      expect(html).toContain('md:col-span-4 lg:col-span-2');  // Services / Stack
      expect(html).toContain('sm:col-span-2 md:col-span-2 lg:col-span-1'); // Year

      // Flagship projects present
      expect(html).toContain('Mental Defrag');
      expect(html).toContain('DocLensBD');
      expect(html).toContain('Rannabanna');
      expect(html).toContain('Trash Trail');
      expect(html).toContain('Neon Vanguard 2D &amp; OS Kernel Labs');
    });
  });

  describe('ContactFooter Word-Break Safety', () => {
    it('uses break-normal and hyphens-none to prevent awkward word splitting', () => {
      const html = renderToString(React.createElement(ContactFooter));

      expect(html).toContain('break-normal hyphens-none');
      expect(html).toContain('Ready to build something');
      expect(html).toContain('unforgettable?');
    });
  });
});
