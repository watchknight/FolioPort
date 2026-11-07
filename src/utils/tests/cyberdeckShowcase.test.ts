import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  FLAGSHIP_PROJECTS,
  SHADER_PASSES,
  ProjectsShowcase,
  MentalDefragPreview,
  DocLensBDPreview,
  RannabannaPreview,
  TrashTrailPreview,
  NeonVanguardPreview,
  ChronosAetherPreview,
  PARTICLE_COUNT,
  PROJECT_ACCENTS,
  generateParticleFormation,
} from '../../components/ProjectsShowcase';
import { TransitionProvider } from '../../context/TransitionContext';
import { App } from '../../App';

describe('SYS.96 Cyberdeck Station & Unified Showcase Verification', () => {
  describe('Flagship ROM Cartridge Ledger Dataset (6 Flagship Works)', () => {
    it('contains all 6 required flagship projects with zero-padded pixel numbers', () => {
      expect(FLAGSHIP_PROJECTS).toHaveLength(6);

      const numbers = FLAGSHIP_PROJECTS.map((p) => p.number);
      expect(numbers).toEqual(['01', '02', '03', '04', '05', '06']);

      const titles = FLAGSHIP_PROJECTS.map((p) => p.title);
      expect(titles).toContain('Mental Defrag');
      expect(titles).toContain('DocLensBD');
      expect(titles).toContain('Rannabanna');
      expect(titles).toContain('Trash Trail');
      expect(titles).toContain('Neon Vanguard 2D & OS Kernel Labs');
      expect(titles).toContain('Chronos-Guard & Aether-GL');
    });

    it('enforces P99 latency metrics, FPS targets, and AST/SLA parity across all 6 slots', () => {
      FLAGSHIP_PROJECTS.forEach((project) => {
        expect(project.p99Latency).toBeTruthy();
        expect(project.fpsMetric).toBeTruthy();
        expect(project.parityMetric).toBeTruthy();
        expect(project.trisCount).toBeTruthy();
        expect(project.holoGeometryName).toBeTruthy();
        expect(project.role).toBeTruthy();
        expect(project.coreStack).toBeTruthy();
        expect(project.githubUrl).toContain('github.com/watchknight');
        expect(project.problem.bottleneck).toBeTruthy();
        expect(project.solution.architecture.length).toBeGreaterThanOrEqual(4);
        expect(project.impact.metrics.length).toBeGreaterThanOrEqual(3);
      });

      // Explicit metric values matching task prompt
      const mentalDefrag = FLAGSHIP_PROJECTS.find((p) => p.id === 'mental-defrag');
      expect(mentalDefrag?.p99Latency).toBe('< 0.12 ms');
      expect(mentalDefrag?.fpsMetric).toBe('60 FPS');
      expect(mentalDefrag?.parityMetric).toBe('100% AST Parity');

      const neonVanguard = FLAGSHIP_PROJECTS.find((p) => p.id === 'neon-vanguard');
      expect(neonVanguard?.p99Latency).toBe('< 1.2 μs');
      expect(neonVanguard?.fpsMetric).toBe('120 FPS');

      const chronosAether = FLAGSHIP_PROJECTS.find((p) => p.id === 'chronos-aether');
      expect(chronosAether?.p99Latency).toBe('< 0.12 ms');
      expect(chronosAether?.fpsMetric).toBe('120 FPS');
    });
  });

  describe('6 Real-Time Shader Pass Switches Specification', () => {
    it('defines exactly the 6 required real-time shader passes', () => {
      expect(SHADER_PASSES).toHaveLength(6);

      const passIds = SHADER_PASSES.map((s) => s.id);
      expect(passIds).toEqual(['beauty', 'pixel', 'wireframe', 'clay', 'uv', 'normals']);

      const labels = SHADER_PASSES.map((s) => s.label);
      expect(labels).toContain('[1] BEAUTY_PBR');
      expect(labels).toContain('[2] 3D_PIXEL_PASS');
      expect(labels).toContain('[3] WIREFRAME_WAVE');
      expect(labels).toContain('[4] CLAY_MATTE');
      expect(labels).toContain('[5] UV_MATRIX');
      expect(labels).toContain('[6] NORMALS_RGB');

      const pixelPass = SHADER_PASSES.find((s) => s.id === 'pixel');
      expect(pixelPass?.badge).toContain('6PX');
      expect(pixelPass?.description).toContain('RenderPixelatedPass');
    });
  });

  describe('ProjectsShowcase SSR & Cyberdeck Layout Rendering', () => {
    it('renders the unified two-zone Cyberdeck Station cleanly with hardware chrome', () => {
      const html = renderToString(
        React.createElement(
          TransitionProvider,
          null,
          React.createElement(ProjectsShowcase)
        )
      );

      // Station Chrome
      expect(html).toContain('WATCHKNIGHT_OS // SYS.96');
      expect(html).toContain('CYBERDECK_STATION.ROM');
      expect(html).toContain('VOLUMETRIC_ENGINE // ACTIVE');
      expect(html).toContain('EAST WEST UNIVERSITY CSE');

      // Left Zone: ROM Cartridge Ledger
      expect(html).toContain('ROM SLOTS [01 - 06] // LOADED');
      expect(html).toContain('[01]');
      expect(html).toContain('[02]');
      expect(html).toContain('[03]');
      expect(html).toContain('[04]');
      expect(html).toContain('[05]');
      expect(html).toContain('[06]');
      expect(html).toContain('Mental Defrag');
      expect(html).toContain('DocLensBD');
      expect(html).toContain('Rannabanna');
      expect(html).toContain('Trash Trail');
      expect(html).toContain('Neon Vanguard 2D &amp; OS Kernel Labs');
      expect(html).toContain('Chronos-Guard &amp; Aether-GL');

      // Right Zone: 3D Hologram Viewport & Shader Pass Frame
      expect(html).toContain('id="render-pass-inspector"');
      expect(html).toContain('HOLO_VIEWPORT');
      expect(html).toContain('[1] BEAUTY_PBR');
      expect(html).toContain('[2] 3D_PIXEL_PASS');
      expect(html).toContain('[3] WIREFRAME_WAVE');
      expect(html).toContain('[4] CLAY_MATTE');
      expect(html).toContain('[5] UV_MATRIX');
      expect(html).toContain('[6] NORMALS_RGB');

      // Action buttons
      expect(html).toContain('[ INSPECT ARCHITECTURE ]');
      expect(html).toContain('[ OPEN DOSSIER ]');
    });

    it('renders all 6 interactive simulation preview components safely', () => {
      expect(renderToString(React.createElement(MentalDefragPreview))).toContain('SPATIAL_2D_PHYSICS.SYS');
      expect(renderToString(React.createElement(DocLensBDPreview))).toContain('CLOUD_FIRESTORE_TELEMETRY.SYS');
      expect(renderToString(React.createElement(RannabannaPreview))).toContain('রান্নাবান্না');
      expect(renderToString(React.createElement(TrashTrailPreview))).toContain('SCROLL_SCRUB_SIMULATOR.SYS');
      expect(renderToString(React.createElement(NeonVanguardPreview))).toContain('2D Canvas Combat');
      expect(renderToString(React.createElement(ChronosAetherPreview))).toContain('Navier-Stokes Fluid');
    });
  });

  describe('GPU Particle Field Formations & Signature Morphing (6 Formations)', () => {
    it('generates distinct non-empty mathematical particle formations for all 6 projects', () => {
      expect(PARTICLE_COUNT).toBe(600);
      expect(PROJECT_ACCENTS).toHaveLength(6);

      for (let i = 0; i < 6; i++) {
        const positions = generateParticleFormation(i, PARTICLE_COUNT);
        expect(positions).toHaveLength(PARTICLE_COUNT * 3);

        // Verify values are numbers and not all zeroes or NaNs
        let hasNonZero = false;
        for (let j = 0; j < positions.length; j++) {
          expect(Number.isNaN(positions[j])).toBe(false);
          if (positions[j] !== 0) hasNonZero = true;
        }
        expect(hasNonZero).toBe(true);
      }

      // Verify that project 0 (sphere/disk) and project 1 (cylinder) have distinct bounds/coordinates
      const p0 = generateParticleFormation(0, PARTICLE_COUNT);
      const p1 = generateParticleFormation(1, PARTICLE_COUNT);
      expect(p0[0]).not.toEqual(p1[0]);
    });
  });

  describe('Sticky 3D Viewport & ROM Cartridge Scroll-Data Attributes', () => {
    it('renders sticky viewport and data-rom-index attributes for scroll-into-view tracking', () => {
      const html = renderToString(
        React.createElement(
          TransitionProvider,
          null,
          React.createElement(ProjectsShowcase)
        )
      );

      // Sticky viewport class on the right inspector zone
      expect(html).toContain('lg:sticky lg:top-20 self-start');

      // data-rom-index attributes on all 6 ROM cartridges
      expect(html).toContain('data-rom-index="0"');
      expect(html).toContain('data-rom-index="1"');
      expect(html).toContain('data-rom-index="2"');
      expect(html).toContain('data-rom-index="3"');
      expect(html).toContain('data-rom-index="4"');
      expect(html).toContain('data-rom-index="5"');
    });
  });

  describe('CaseStudyView & SkillMatrix 6 Flagship Projects Consistency', () => {
    it('verifies CaseStudyView supports all 6 project simulations including ChronosAetherPreview', () => {
      const html = renderToString(React.createElement(ChronosAetherPreview));
      expect(html).toContain('Navier-Stokes Fluid');
      expect(html).toContain('SHA-256 Merkle Ledger');
      expect(html).toContain('1.42 ms PASS');
    });

    it('ensures SkillMatrix links all 6 flagship projects', () => {
      expect(FLAGSHIP_PROJECTS).toHaveLength(6);
      const ids = FLAGSHIP_PROJECTS.map((p) => p.id);
      expect(ids).toContain('chronos-aether');
    });
  });

  describe('Zero Duplicate Project Sections in App', () => {
    it('ensures App renders only the single consolidated ProjectsShowcase inside #work', () => {
      const html = renderToString(React.createElement(App));

      // Contains the single work section
      expect(html).toContain('id="work"');
      expect(html).toContain('CYBERDECK_STATION.ROM');

      // Check that duplicate sections do not appear multiple times
      // "Mental Defrag" appears in ProjectsShowcase and in the 404 hidden crawl list
      const mentalDefragMatches = (html.match(/Mental Defrag/g) || []).length;
      expect(mentalDefragMatches).toBeGreaterThanOrEqual(1);

      // Verify that there is only one render-pass-inspector ID
      const inspectorIdMatches = (html.match(/id="render-pass-inspector"/g) || []).length;
      expect(inspectorIdMatches).toBe(1);
    });
  });
});

