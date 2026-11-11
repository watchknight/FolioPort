import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Preloader, GREETINGS } from '../../components/Preloader';
import { NotFoundPage } from '../../pages/404';
import { get3MovePuzzle, isValidKnightMove, findShortestPath } from '../knightsTour';

describe('SOTY Components Verification: Preloader & 404 Micro-World', () => {
  describe('Dennis Snellenberg / Colombel Preloader Sequence (@src/components/Preloader.tsx)', () => {
    it('contains all 9 required international greetings including Bengali স্বাগতম', () => {
      expect(GREETINGS).toHaveLength(9);

      const languages = GREETINGS.map((g) => g.lang);
      expect(languages).toContain('BN'); // Bengali
      expect(languages).toContain('EN'); // English
      expect(languages).toContain('JA'); // Japanese
      expect(languages).toContain('FR'); // French
      expect(languages).toContain('AR'); // Arabic
      expect(languages).toContain('ES'); // Spanish
      expect(languages).toContain('DE'); // German
      expect(languages).toContain('ZH'); // Mandarin
      expect(languages).toContain('NL'); // Dutch

      const bengaliGreeting = GREETINGS.find((g) => g.lang === 'BN');
      expect(bengaliGreeting?.text).toBe('স্বাগতম');
    });

    it('renders cleanly via SSR with precision horological attributes', () => {
      const html = renderToString(React.createElement(Preloader));

      // Precision horological counter start at 000
      expect(html).toContain('000');
      expect(html).toContain('%');

      // Accessibility progressbar attributes
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuemin="0"');
      expect(html).toContain('aria-valuemax="100"');
      expect(html).toContain('aria-valuenow="0"');

      // First greeting presence
      expect(html).toContain('স্বাগতম');

      // SVG clip-path and curved curtain path presence with active clipping layer
      expect(html).toContain('clipPath id="preloader-curtain-clip"');
      expect(html).toContain('d="M 0 0 L 1000 0 L 1000 1000 Q 500 1000 0 1000 Z"');
      expect(html).toContain('clip-path="url(#preloader-curtain-clip)"');
    });
  });

  describe('Tom Barrow-Inspired 404 Chessboard Micro-World (@src/pages/404.tsx)', () => {
    it('renders the 5x5 Knight’s Tour grid with all 25 squares and semantic tags', () => {
      const html = renderToString(React.createElement(NotFoundPage));

      // Title & Sector Header
      expect(html).toContain('Node 404: Unreachable Sector in the Watchtower');
      expect(html).toContain('Sector Fault • 404');
      expect(html).toContain('Knight Graph Jumps');

      // Ambient WebGL Broken Chronometer Canvas presence
      expect(html).toContain('<canvas');
      expect(html).toContain('aria-hidden="true"');

      // 5x5 Grid role & 25 interactive squares
      expect(html).toContain('role="grid"');
      expect(html).toContain('aria-label="5 by 5 Knight&#x27;s Tour Chessboard"');

      // 25 buttons (one for each square A1 through E5)
      const squareMatches = html.match(/Square [A-E][1-5]/g);
      expect(squareMatches).not.toBeNull();
      expect(squareMatches!.length).toBeGreaterThanOrEqual(25);

      // Status HUD showing 3-move objective
      expect(html).toContain('0 / 3');

      // Control buttons: Undo Step, Reset Path, Bypass
      expect(html).toContain('Undo Step');
      expect(html).toContain('Reset Path');
      expect(html).toContain('Bypass to Home Route');

      // Origin and Target coordinates
      const p = get3MovePuzzle(0);
      expect(p.minMoves).toBe(3);
    });

    it('solves in exactly 3 moves along valid knight graph edges', () => {
      const puzzle = get3MovePuzzle(0);
      const path = findShortestPath(puzzle.start, puzzle.target, 5);

      expect(path).not.toBeNull();
      expect(path!.length).toBe(4); // 4 nodes = 3 transitions

      // Validate each jump
      for (let i = 1; i < path!.length; i++) {
        expect(isValidKnightMove(path![i - 1], path![i], 5)).toBe(true);
      }
    });

    it('contains full semantic text and flagship project links underneath the interactive board for SEO & crawlers', () => {
      const html = renderToString(React.createElement(NotFoundPage));

      // SEO & Screen Reader content
      expect(html).toContain('sr-only');
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('East West University • CSE Department');
      expect(html).toContain('23.7644° N, 90.4252° E');
      expect(html).toContain('@watchknight • 2026');

      // Full semantic flagship directory presence
      expect(html).toContain('Mental Defrag');
      expect(html).toContain('DocLensBD');
      expect(html).toContain('Trash Trail &amp; Aether-GL');
      expect(html).toContain('Rannabanna &amp; Neon Vanguard');
    });
  });
});
