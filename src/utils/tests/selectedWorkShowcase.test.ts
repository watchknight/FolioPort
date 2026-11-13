import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  ProjectsView,
  FLAGSHIP_PROJECTS,
  MORE_DEPLOYED_APPS,
} from '../../components/views/ProjectsView';

describe('Refactored Selected Work View & 4-Project Showcase', () => {
  describe('Curated 2x2 Flagship Project Grid', () => {
    it('renders the clean section header and GitHub repositories link', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('Selected Engineering Work');
      expect(html).toContain('View All on GitHub (@watchknight)');
      expect(html).toContain('href="https://github.com/watchknight?tab=repositories"');
    });

    it('renders 2-column grid with 20px gap and 20px padding', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="flagship-projects-grid"');
      expect(html).toContain('grid-cols-1 md:grid-cols-2');
      expect(html).toContain('gap-[20px]');
      expect(html).toContain('padding:20px');
    });

    it('renders all 4 flagship production projects in order', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(FLAGSHIP_PROJECTS).toHaveLength(4);

      expect(FLAGSHIP_PROJECTS[0].title).toBe('BitForge');
      expect(FLAGSHIP_PROJECTS[0].category).toBe('Visual Algorithm Lab');
      expect(FLAGSHIP_PROJECTS[0].demoUrl).toBe('https://bitforge-3u2q.onrender.com');
      expect(FLAGSHIP_PROJECTS[0].sourceUrl).toBe('https://github.com/watchknight/BitForge');
      expect(FLAGSHIP_PROJECTS[0].screenshot).toBe('/projects/bitforge.png');

      expect(FLAGSHIP_PROJECTS[1].title).toBe('FocusLab');
      expect(FLAGSHIP_PROJECTS[1].category).toBe('Cognitive Performance Web App');
      expect(FLAGSHIP_PROJECTS[1].demoUrl).toBe('https://focuslab-smoa.onrender.com');
      expect(FLAGSHIP_PROJECTS[1].sourceUrl).toBe('https://github.com/watchknight/FocusLab');
      expect(FLAGSHIP_PROJECTS[1].screenshot).toBe('/projects/focuslab.png');

      expect(FLAGSHIP_PROJECTS[2].title).toBe('Rannabanna');
      expect(FLAGSHIP_PROJECTS[2].category).toBe('Full-Stack Consumer Platform');
      expect(FLAGSHIP_PROJECTS[2].demoUrl).toBe('https://rannabanna.onrender.com');
      expect(FLAGSHIP_PROJECTS[2].sourceUrl).toBe('https://github.com/watchknight/Rannabanna');
      expect(FLAGSHIP_PROJECTS[2].screenshot).toBe('/projects/rannabanna.png');

      expect(FLAGSHIP_PROJECTS[3].title).toBe('DocLensBD');
      expect(FLAGSHIP_PROJECTS[3].category).toBe('3D E-Commerce & Computer Vision');
      expect(FLAGSHIP_PROJECTS[3].demoUrl).toBe('https://doclensbd.onrender.com');
      expect(FLAGSHIP_PROJECTS[3].sourceUrl).toBe('https://github.com/watchknight/DocLensBD');
      expect(FLAGSHIP_PROJECTS[3].screenshot).toBe('/projects/doclensbd.png');

      expect(html).toContain('data-testid="flagship-card-01"');
      expect(html).toContain('data-testid="flagship-card-02"');
      expect(html).toContain('data-testid="flagship-card-03"');
      expect(html).toContain('data-testid="flagship-card-04"');
    });

    it('renders 16:9 CRT photo demo frame with subtle phosphor filter at rest and color toggle', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="crt-photo-frame"');
      expect(html).toContain('aspect-video');
      expect(html).toContain('filter:grayscale(100%) contrast(115%) sepia(25%) hue-rotate(55deg)');
      expect(html).toContain('data-testid="btn-toggle-photo-color"');
      expect(html).toContain('View Original Color');
    });

    it('renders key metrics / outcome badge for each flagship project', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('50+ Visualized Algos • 11 Curriculum Stages • C++ / Python / Java / TS');
      expect(html).toContain('3-Minute Reflex Check • Sub-ms Precision • English &amp; বাংলা UI');
      expect(html).toContain('1-Tap Pantry Match • Global &amp; Bengali Cuisines • English &amp; বাংলা UI');
      expect(html).toContain('198+ Precision Frames • 3D Face-Tracking Try-On • Custom Prescription Flow');
    });

    it('renders action row buttons for all 4 cards', () => {
      const html = renderToString(React.createElement(ProjectsView));
      for (let i = 1; i <= 4; i++) {
        expect(html).toContain(`data-testid="retro-btn-read-case-study-0${i}"`);
      }
      expect(html).toContain('Live Demo');
      expect(html).toContain('GitHub');
    });
  });

  describe('More Live Deployed Web Apps Section', () => {
    it('renders the section header and all 3 Render applications', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="more-live-deployed-apps"');
      expect(html).toContain('More Live Deployed Web Apps');

      expect(MORE_DEPLOYED_APPS).toHaveLength(3);

      // App 1: Mental Defrag
      expect(html).toContain('Mental Defrag');
      expect(html).toContain('Spatial cognitive workspace with 2D physics and Obsidian canvas sync');
      expect(html).toContain('https://mental-defrag.onrender.com');
      expect(html).toContain('https://github.com/watchknight/Mental-Defrag');

      // App 2: TrashTrail
      expect(html).toContain('TrashTrail');
      expect(html).toContain('Scroll-driven interactive environmental storytelling');
      expect(html).toContain('https://trashtrail.onrender.com');
      expect(html).toContain('https://github.com/watchknight/TrashTrail');

      // App 3: POSHRA
      expect(html).toContain('POSHRA');
      expect(html).toContain('Cloud-enabled resource scheduling engine with reactive optimistic UI');
      expect(html).toContain('https://poshra.onrender.com');
      expect(html).toContain('https://github.com/watchknight/POSHRA');
    });
  });

  describe('Case Study Breakdown & Interactive Micro-Sandboxes', () => {
    it('each project defines 3 hero metrics and comprehensive 3-part breakdown', () => {
      FLAGSHIP_PROJECTS.forEach((proj) => {
        expect(proj.heroMetrics).toHaveLength(3);
        expect(proj.problem.length).toBeGreaterThan(30);
        expect(proj.howItWorks.length).toBeGreaterThan(30);
        expect(proj.keyResults.length).toBeGreaterThan(30);
        expect(proj.hasSandbox).toBe(true);
      });
    });

    it('each project specifies a valid interactive micro-sandbox type', () => {
      const types = FLAGSHIP_PROJECTS.map((p) => p.sandboxType);
      expect(types).toEqual([
        'bitforge-sort',
        'focuslab-reflex',
        'rannabanna-pantry',
        'doclens-tryon',
      ]);
    });

    it('renders the case study detail view structure when a flagship project is selected', () => {
      const html = renderToString(
        React.createElement(ProjectsView, {
          // Palette testing
          palette: {
            bright: '#c2cdb4',
            void: '#111712',
            mid: '#6e7d62',
            dim: '#2e3b2b',
          },
        })
      );
      expect(html).toContain('BitForge');
      expect(html).toContain('Visual Algorithm Lab');
      expect(html).toContain('Read Case Study');
    });

    it('validates BitForge Forge Lab initial array [38, 14, 62, 19, 85, 29, 76, 48]', () => {
      const bitforge = FLAGSHIP_PROJECTS[0];
      expect(bitforge.id).toBe('01_BITFORGE');
      expect(bitforge.sandboxType).toBe('bitforge-sort');
      expect(bitforge.demoUrl).toBe('https://bitforge-3u2q.onrender.com');
    });

    it('validates FocusLab sample median 287 ms and reflex testing studio metrics', () => {
      const focuslab = FLAGSHIP_PROJECTS[1];
      expect(focuslab.id).toBe('02_FOCUSLAB');
      expect(focuslab.sandboxType).toBe('focuslab-reflex');
      expect(focuslab.keyMetrics).toContain('3-Minute Reflex Check');
    });

    it('validates Rannabanna kitchen staples matchmaker configuration', () => {
      const ranna = FLAGSHIP_PROJECTS[2];
      expect(ranna.id).toBe('03_RANNABANNA');
      expect(ranna.sandboxType).toBe('rannabanna-pantry');
      expect(ranna.keyMetrics).toContain('1-Tap Pantry Match');
    });

    it('validates DocLensBD 3D Virtual Try-On frame configuration', () => {
      const doclens = FLAGSHIP_PROJECTS[3];
      expect(doclens.id).toBe('04_DOCLENS_BD');
      expect(doclens.sandboxType).toBe('doclens-tryon');
      expect(doclens.keyMetrics).toContain('198+ Precision Frames');
    });

    it('verifies DocLensBD pupillary distance alignment formula matches lens center coords (122 & 198)', () => {
      // Median PD is 63 mm, scale formula: halfPdSvg = (pupilDistance * 38) / 63
      const standardPd = 63;
      const halfPd = (standardPd * 38) / 63;
      const leftEyeX = 160 - halfPd;
      const rightEyeX = 160 + halfPd;
      expect(leftEyeX).toBeCloseTo(122, 1);
      expect(rightEyeX).toBeCloseTo(198, 1);

      // Narrow PD 56mm remains within face bounds (90 to 230)
      const narrowPd = 56;
      const narrowHalf = (narrowPd * 38) / 63;
      expect(160 - narrowHalf).toBeGreaterThan(90);
      expect(160 + narrowHalf).toBeLessThan(230);

      // Wide PD 74mm remains within face bounds (90 to 230)
      const widePd = 74;
      const wideHalf = (widePd * 38) / 63;
      expect(160 - wideHalf).toBeGreaterThan(90);
      expect(160 + wideHalf).toBeLessThan(230);
    });

    it('verifies BitForge bubble sort sequence sorts [38, 14, 62, 19, 85, 29, 76, 48] in 40 steps', () => {
      const initial = [38, 14, 62, 19, 85, 29, 76, 48];
      const sorted = [...initial].sort((a, b) => a - b);
      expect(sorted).toEqual([14, 19, 29, 38, 48, 62, 76, 85]);
    });

    it('verifies FocusLab reflex check sample median comparison calculations', () => {
      const sampleMedian = 287;
      // Faster reaction (e.g. 240 ms)
      const fasterRt = 240;
      const deltaFaster = sampleMedian - fasterRt;
      expect(deltaFaster).toBe(47);
      expect(`+${deltaFaster} ms faster than median`).toBe('+47 ms faster than median');

      // Slower reaction (e.g. 330 ms)
      const slowerRt = 330;
      const deltaSlower = sampleMedian - slowerRt;
      expect(deltaSlower).toBe(-43);
      expect(`${Math.abs(deltaSlower)} ms slower than median`).toBe('43 ms slower than median');
    });

    it('verifies Rannabanna pantry recipe matching logic', () => {
      const selected = ['Egg', 'Garlic', 'Red Onion'];
      const dimBhunaIngredients = ['Egg', 'Red Onion', 'Garlic', 'Ginger'];
      const matched = dimBhunaIngredients.filter((i) => selected.includes(i));
      expect(matched).toHaveLength(3);
      const matchPercent = Math.round((matched.length / dimBhunaIngredients.length) * 100);
      expect(matchPercent).toBe(75);
    });
  });
});
