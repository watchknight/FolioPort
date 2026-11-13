import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { ProjectsView } from '../../components/views/ProjectsView';
import { AboutMeView } from '../../components/views/AboutMeView';
import { ResumeView } from '../../components/views/ResumeView';

describe('Widescreen Full-Glass CRT OS Window & Interior Views Refactor', () => {
  describe('1. FULL-GLASS EXPANDED OS WINDOW (RetroOSWindow.tsx)', () => {
    it('positions the expanded window to fill full CRT glass with clean 16px inset and flex column layout', () => {
      const html = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(html).toContain('data-testid="retro-os-window"');
      expect(html).toContain('position:absolute');
      expect(html).toContain('inset:16px');
      expect(html).toContain('display:flex');
      expect(html).toContain('flex-direction:column');
      expect(html).toContain('z-index:30');
      expect(html).toContain('background-color:#111712');
    });

    it('spans internal content container across full widescreen with width: 100% and clamp(24px, 3vw, 44px) padding', () => {
      const html = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(html).toContain('data-testid="retro-window-content-viewport"');
      expect(html).toContain('padding:clamp(24px, 3vw, 44px)');
      expect(html).toContain('data-testid="retro-window-expanded-mode"');
      expect(html).toContain('width:100%');
    });
  });

  describe('2. WIDESCREEN 2-COLUMN CASE STUDY & GRID LAYOUT (ProjectsView.tsx)', () => {
    it('renders flagship cards with horizontal split: 42% CRT thumbnail left and 58% content right', () => {
      const html = renderToString(React.createElement(ProjectsView));

      expect(html).toContain('data-testid="flagship-projects-grid"');
      expect(html).toContain('lg:w-[42%]');
      expect(html).toContain('lg:w-[58%]');

      // All 4 flagship cards present with action row and taglines
      for (let i = 1; i <= 4; i++) {
        expect(html).toContain(`data-testid="flagship-card-0${i}"`);
        expect(html).toContain(`data-testid="retro-btn-read-case-study-0${i}"`);
      }
      expect(html).toContain('Interactive DSA &amp; Visual Intuition Engine');
      expect(html).toContain('Live Demo');
      expect(html).toContain('GitHub');
    });

    it('renders Case Study Detail View in a 2-column dashboard layout with gap: 32px', () => {
      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '01_BITFORGE' })
      );

      expect(html).toContain('data-testid="case-study-widescreen-dashboard"');
      expect(html).toContain('grid-cols-1 lg:grid-cols-2');
      expect(html).toContain('gap:32px');

      // Left column: Project Header, Key Metrics Row, Problem, and How It Works in 16px 'Plus Jakarta Sans'
      expect(html).toContain('BitForge');
      expect(html).toContain('Visual Algorithm Lab');
      expect(html).toContain('Problem');
      expect(html).toContain('How It Works');
      expect(html).toContain('Key Results');
      expect(html).toContain('font-size:16px');
      expect(html).toContain('Plus Jakarta Sans');

      // Right column: Large 16:9 CRT Photo Demo Viewer and live Interactive Micro-Sandbox
      expect(html).toContain('CRT Photo Demo Viewer');
      expect(html).toContain('Interactive Micro-Sandbox');
      expect(html).toContain('READY: 8 UNSORTED ARRAY BARS');
      expect(html).toContain('data-testid="interactive-demo-sandbox"');
    });

    it('renders FocusLab Reflex tester micro-sandbox live in Case Study Detail View', () => {
      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '02_FOCUSLAB' })
      );

      expect(html).toContain('data-testid="case-study-widescreen-dashboard"');
      expect(html).toContain('FocusLab');
      expect(html).toContain('Interactive Micro-Sandbox');
      expect(html).toContain('data-testid="interactive-demo-sandbox"');
      expect(html).toContain('Aperture Reflex Check (3-Minute Visual Reaction Studio)');
    });

    it('renders Rannabanna Pantry Matchmaker micro-sandbox live in Case Study Detail View', () => {
      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '03_RANNABANNA' })
      );

      expect(html).toContain('data-testid="case-study-widescreen-dashboard"');
      expect(html).toContain('Rannabanna');
      expect(html).toContain('Interactive Micro-Sandbox');
      expect(html).toContain('data-testid="interactive-demo-sandbox"');
      expect(html).toContain('Kitchen Staples Matchmaker');
    });
  });

  describe('3. WIDESCREEN ABOUT DASHBOARD (AboutMeView.tsx)', () => {
    it('places Identity Card and Biography in left column (5fr) and 3-category Skills in right column (7fr)', () => {
      const html = renderToString(React.createElement(AboutMeView));

      expect(html).toContain('data-testid="about-widescreen-dashboard"');
      expect(html).toContain('lg:grid-cols-12');
      expect(html).toContain('lg:col-span-5');
      expect(html).toContain('lg:col-span-7');

      // Left column components
      expect(html).toContain('data-testid="about-identity-card"');
      expect(html).toContain('data-testid="about-biography-section"');

      // Right column components
      expect(html).toContain('data-testid="skills-capability-grid"');
      expect(html).toContain('Core Competencies:');
    });

    it('renders crisp biography in Plus Jakarta Sans with max-width: 62ch', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('max-width:62ch');
      expect(html).toContain('Plus Jakarta Sans');
    });
  });

  describe('4. WIDESCREEN RESUME DASHBOARD (ResumeView.tsx)', () => {
    it('places 4 contact buttons across the top row with Education on left and Terminal on right', () => {
      const html = renderToString(React.createElement(ResumeView));

      // Top action row
      expect(html).toContain('data-testid="retro-resume-action-bar"');
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('data-testid="retro-link-linkedin"');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('data-testid="retro-resume-download-btn"');
      expect(html).toContain('Copy Email');
      expect(html).toContain('LinkedIn Profile');
      expect(html).toContain('GitHub');
      expect(html).toContain('Download Resume PDF');

      // Widescreen 2-column body
      expect(html).toContain('data-testid="resume-widescreen-dashboard"');
      expect(html).toContain('grid-cols-1 lg:grid-cols-2');

      // Left column: Education & Coursework card + Skills table
      expect(html).toContain('data-testid="academic-coursework-card"');
      expect(html).toContain('Education &amp; Coursework');
      expect(html).toContain('East West University (EWU), Dhaka, Bangladesh');

      // Right column: Interactive Terminal Panel
      expect(html).toContain('Interactive Terminal');
      expect(html).toContain('data-testid="btn-toggle-linux-cli"');
      expect(html).toContain('Open Interactive Terminal');
    });
  });

  describe('5. MULTI-VIEWPORT RESPONSIVENESS (1920x1080, 1440x900, 375x812)', () => {
    it('verifies 1920x1080 and 1440x900 widescreen classes are properly structured on all components', () => {
      const osHtml = renderToString(React.createElement(RetroOSWindow, { isExpanded: true }));
      const projectsHtml = renderToString(React.createElement(ProjectsView));
      const aboutHtml = renderToString(React.createElement(AboutMeView));
      const resumeHtml = renderToString(React.createElement(ResumeView));

      // 100% widescreen container utilization
      expect(osHtml).toContain('inset:16px');
      expect(osHtml).toContain('padding:clamp(24px, 3vw, 44px)');

      // Projects: 42% / 58% split
      expect(projectsHtml).toContain('lg:w-[42%]');
      expect(projectsHtml).toContain('lg:w-[58%]');

      // About: 5fr / 7fr split (12 columns)
      expect(aboutHtml).toContain('lg:grid-cols-12');
      expect(aboutHtml).toContain('lg:col-span-5');
      expect(aboutHtml).toContain('lg:col-span-7');

      // Resume: 2-column split (1fr 1fr)
      expect(resumeHtml).toContain('lg:grid-cols-2');
    });

    it('verifies 375x812 mobile ergonomics: flex-col and single column fallbacks prevent horizontal overflow', () => {
      const projectsHtml = renderToString(React.createElement(ProjectsView));
      const aboutHtml = renderToString(React.createElement(AboutMeView));
      const resumeHtml = renderToString(React.createElement(ResumeView));

      // Mobile stacks vertically
      expect(projectsHtml).toContain('flex-col lg:flex-row');
      expect(aboutHtml).toContain('grid-cols-1 lg:grid-cols-12');
      expect(resumeHtml).toContain('grid-cols-1 lg:grid-cols-2');
    });
  });
});
