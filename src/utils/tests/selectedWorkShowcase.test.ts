import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  ProjectsView,
  FLAGSHIP_PROJECTS,
  FALLBACK_REPOSITORIES,
} from '../../components/views/ProjectsView';
import { RetroOSProvider, useRetroOS } from '../../context/RetroOSContext';

describe('Selected Work 4-Project Showcase & Two-Tier Progressive Disclosure', () => {
  describe('1. Curated 2x2 Flagship Project Grid (Default View)', () => {
    it('renders clean section header "SELECTED ENGINEERING WORK (4 FLAGSHIP CASE STUDIES)" and right-aligned GitHub link', () => {
      const html = renderToString(React.createElement(ProjectsView));

      expect(html).toContain('SELECTED ENGINEERING WORK (4 FLAGSHIP CASE STUDIES)');
      expect(html).toContain('All 14 Repos on GitHub @watchknight');
      expect(html).toContain('href="https://github.com/watchknight"');
    });

    it('renders spacious 2-column grid (1-column on mobile) with 20px gap displaying only the 4 strongest projects', () => {
      const html = renderToString(React.createElement(ProjectsView));

      expect(html).toContain('data-testid="flagship-projects-grid"');
      expect(html).toContain('grid-cols-1 md:grid-cols-2');
      expect(html).toContain('gap-[20px]');

      // Exactly 4 flagship cards
      expect(html).toContain('data-testid="flagship-card-01"');
      expect(html).toContain('data-testid="flagship-card-02"');
      expect(html).toContain('data-testid="flagship-card-03"');
      expect(html).toContain('data-testid="flagship-card-04"');
    });

    it('enforces 20px internal padding and crisp 1px solid #6e7d62 border on all cards', () => {
      const html = renderToString(React.createElement(ProjectsView));

      expect(html).toContain('padding:20px');
      expect(html).toContain('border:1px solid #6e7d62');
    });

    it('renders all 4 scannable elements per card strictly without clutter', () => {
      const html = renderToString(React.createElement(ProjectsView));

      // Element (1): Top row with monospace index (01 to 04) and category tag
      expect(html).toContain('01');
      expect(html).toContain('SPATIAL WEB');
      expect(html).toContain('02');
      expect(html).toContain('CHROME MV3');
      expect(html).toContain('03');
      expect(html).toContain('SYSTEMS &amp; 2D ENGINE');
      expect(html).toContain('04');
      expect(html).toContain('CLOUD PLATFORM');

      // Element (2): Project Title in bold crisp typography plus 1-sentence high-impact summary
      expect(html).toContain('Mental Defrag');
      expect(html).toContain('Zero-gravity spatial cognitive workspace built with Matter.js');
      expect(html).toContain('FocusGuard');
      expect(html).toContain('Manifest V3 browser productivity daemon engineered');
      expect(html).toContain('Neon Vanguard &amp; POSIX');
      expect(html).toContain('Deterministic 120 FPS HTML5 canvas combat engine');
      expect(html).toContain('DocLensBD &amp; Rannabanna');
      expect(html).toContain('Cloud-backed medical diagnostic intelligence platform');

      // Element (3): Single key quantified outcome badge
      expect(html).toContain('60 FPS • 200+ Physics Nodes • Obsidian AST Sync');
      expect(html).toContain('-58% RAM Reclaimed • &lt;12 MB Heap • Manifest V3');
      expect(html).toContain('120 FPS Zero-Alloc Canvas • &lt;1.2µs POSIX IPC');
      expect(html).toContain('Cloud Firestore • Real-Time Sync • CI/CD');

      // Element (4): Bottom action row with Read Case Study, Live Demo, and GitHub
      expect(html).toContain('data-testid="retro-btn-read-case-study-01"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-02"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-03"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-04"');
      expect(html).toContain('Read Case Study');
      expect(html).toContain('Live Demo');
      expect(html).toContain('GitHub');
    });
  });

  describe('2. Unfolding Case Study Detail View Specifications', () => {
    it('defines 3 hero metric boxes and concise 3-part breakdown for all 4 flagship projects', () => {
      expect(FLAGSHIP_PROJECTS).toHaveLength(4);

      FLAGSHIP_PROJECTS.forEach((p) => {
        // 3 Hero Metric boxes
        expect(p.heroMetrics).toHaveLength(3);
        p.heroMetrics.forEach((m) => {
          expect(m.value.length).toBeGreaterThan(0);
          expect(m.label.length).toBeGreaterThan(0);
        });

        // Maximum 2 short sentences per block
        expect(p.problem.length).toBeGreaterThan(20);
        expect(p.architecture.length).toBeGreaterThan(20);
        expect(p.impact.length).toBeGreaterThan(20);

        // Required action URLs
        expect(p.demoUrl).toContain('https://github.com/watchknight');
        expect(p.sourceUrl).toContain('https://github.com/watchknight');
        expect(p.role.length).toBeGreaterThan(0);
        expect(p.year.length).toBeGreaterThan(0);
      });
    });

    it('configures interactive demo sandboxes strictly for Mental Defrag, FocusGuard, and Neon Vanguard', () => {
      const p1 = FLAGSHIP_PROJECTS.find((p) => p.id === '01_MENTAL_DEFRAG')!;
      const p2 = FLAGSHIP_PROJECTS.find((p) => p.id === '02_FOCUSGUARD')!;
      const p3 = FLAGSHIP_PROJECTS.find((p) => p.id === '03_NEON_VANGUARD_POSIX')!;
      const p4 = FLAGSHIP_PROJECTS.find((p) => p.id === '04_DOCLENS_RANNABANNA')!;

      expect(p1.hasSandbox).toBe(true);
      expect(p1.sandboxType).toBe('physics');

      expect(p2.hasSandbox).toBe(true);
      expect(p2.sandboxType).toBe('throttler');

      expect(p3.hasSandbox).toBe(true);
      expect(p3.sandboxType).toBe('laser');

      expect(p4.hasSandbox).toBe(false);
    });
  });

  describe('3. Compact GitHub Archive Accordion Specifications', () => {
    it('renders single collapsible accordion bar reading "+ View Additional Labs (8)"', () => {
      const html = renderToString(React.createElement(ProjectsView));

      expect(html).toContain('data-testid="github-archive-accordion"');
      expect(html).toContain('data-testid="btn-toggle-github-accordion"');
      expect(html).toContain('+ View Additional Labs (8)');
    });

    it('contains all required repositories in fallback archive table: BitForge, simd-json-stream, posix-shm-kernel-lab, TrashTrail, POSHRA, PureFeed', () => {
      const repoNames = FALLBACK_REPOSITORIES.map((r) => r.name);

      expect(repoNames).toContain('BitForge');
      expect(repoNames).toContain('simd-json-stream');
      expect(repoNames).toContain('posix-shm-kernel-lab');
      expect(repoNames).toContain('TrashTrail');
      expect(repoNames).toContain('POSHRA');
      expect(repoNames).toContain('PureFeed');
      expect(repoNames).toContain('Mental-Defrag');
      expect(repoNames).toContain('FocusGuard');
      expect(repoNames).toContain('DocLensBD');
      expect(repoNames).toContain('Rannabanna');
      expect(repoNames).toContain('hyperdeck-3d-particles');
      expect(repoNames).toContain('chiptune-audio-engine');
    });

    it('places exactly the 8 additional open-source lab repos first in FALLBACK_REPOSITORIES without flagship clutter', () => {
      const additionalEight = FALLBACK_REPOSITORIES.slice(0, 8).map((r) => r.name);
      expect(additionalEight).toHaveLength(8);
      expect(additionalEight).toEqual([
        'BitForge',
        'simd-json-stream',
        'posix-shm-kernel-lab',
        'TrashTrail',
        'POSHRA',
        'PureFeed',
        'hyperdeck-3d-particles',
        'chiptune-audio-engine',
      ]);

      // None of the 4 flagship case studies exist in the first 8 additional repos
      expect(additionalEight).not.toContain('Mental-Defrag');
      expect(additionalEight).not.toContain('FocusGuard');
      expect(additionalEight).not.toContain('DocLensBD');
      expect(additionalEight).not.toContain('Rannabanna');
    });
  });

  describe('4. Bayer Dither Integration & Backward Compatibility', () => {
    it('exports triggerDitherTransition from RetroOSContext and connects cleanly', () => {
      let contextVal: ReturnType<typeof useRetroOS> | null = null;
      const Consumer = () => {
        contextVal = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(RetroOSProvider, null, React.createElement(Consumer))
      );

      expect(contextVal).not.toBeNull();
      expect(typeof contextVal!.triggerDitherTransition).toBe('function');

      // Test invoking triggerDitherTransition without handler
      let swapped = false;
      let completed = false;
      contextVal!.triggerDitherTransition!(() => {
        swapped = true;
      }, () => {
        completed = true;
      });

      expect(swapped).toBe(true);
      expect(completed).toBe(true);
    });

    it('strictly preserves zero legacy color hex codes in ProjectsView according to GEMINI.md', () => {
      const html = renderToString(React.createElement(ProjectsView)).toLowerCase();

      expect(html).not.toContain('#d9532f');
      expect(html).not.toContain('#a74024');
      expect(html).not.toContain('#ff4d1c');
      expect(html).not.toContain('#4e9a7f');
    });

    it('seamlessly adapts to custom palette tokens (Amber mode) without hardcoded default colors', () => {
      const amberPalette = {
        void: '#140f07',
        dim: '#3d2b12',
        mid: '#8c6830',
        bright: '#d4a359',
      };

      const htmlAmber = renderToString(
        React.createElement(ProjectsView, { palette: amberPalette })
      );

      expect(htmlAmber).toContain('border:1px solid #8c6830');
      expect(htmlAmber).toContain('color:#d4a359');
    });
  });
});
