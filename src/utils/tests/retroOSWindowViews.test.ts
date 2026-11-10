import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AboutMeView } from '../../components/views/AboutMeView';
import {
  ProjectsView,
  FEATURED_PROJECTS,
  FALLBACK_REPOSITORIES,
} from '../../components/views/ProjectsView';
import { ResumeView } from '../../components/views/ResumeView';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { AMBER_PALETTE } from '../../components/CRTDioramaStage';

describe('Retro 90s OS Window View Modules (Strict 4-Color Pixel UI)', () => {
  describe('MODULE [1] ABOUT ME (ABOUT_ME.TXT — RPG / SYSTEM PROFILE)', () => {
    it('renders authentic 90s terminal & RPG character sheet with testid="retro-content-about"', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('data-testid="retro-content-about"');
      expect(html).toContain('=== [1] ABOUT ME // ABOUT_ME.TXT ===');
      expect(html).toContain('SYS.96 // CHAR_SHEET');
    });

    it('renders 16x16 2bpp pixel portrait SVG with pixelated rendering', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('Pixel Portrait of Abdur Rahman Moayed (@watchknight)');
      expect(html).toContain('image-rendering:pixelated');
      expect(html).toContain('[16x16 2BPP PHOSPHOR]');
      expect(html).toContain('viewBox="0 0 16 16"');
    });

    it('displays identity header with name, handle, institution, status, and UTC+6 coordinates', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('ABDUR RAHMAN MOAYED');
      expect(html).toContain('@watchknight');
      expect(html).toContain('B.Sc. in CSE @ East West University, Dhaka, Bangladesh');
      expect(html).toContain('East West University, Dhaka');
      expect(html).toContain('ONLINE // OPEN FOR INTERNSHIPS &amp; ENGINEERING ROLES');
      expect(html).toContain('Dhaka, BD (23°N, 90°E)');
      expect(html).toContain('UTC+6');
    });

    it('displays RPG stats (Class, Level, HP, EXP)', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('CYBERDECK PALADIN');
      expect(html).toContain('LVL 96');
      expect(html).toContain('100/100');
      expect(html).toContain('2026/2026');
    });

    it('includes engineering biography explaining C/C++ OS architecture and modern TypeScript web applications', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('SYSTEM MANIFEST // ENGINEERING BIOGRAPHY:');
      expect(html).toContain('C/C++ Operating Systems architecture');
      expect(html).toContain('POSIX shared memory');
      expect(html).toContain('process trees');
      expect(html).toContain('Linux bash pipelines');
      expect(html).toContain('TypeScript, React, Next.js');
      expect(html).toContain('WATCHKNIGHT_OS SYS.96');
    });

    it('renders stepped 10-block ASCII and segmented pixel gauges for FRONTEND_SYS, BACKEND_DATA, and LOW_LEVEL_OS', () => {
      const html = renderToString(React.createElement(AboutMeView));

      // FRONTEND_SYS: React, TypeScript, Next.js, Tailwind CSS, HTML5 Canvas
      expect(html).toContain('FRONTEND_SYS [9/10]');
      expect(html).toContain('█████████░ [90%]');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-label="FRONTEND_SYS 90% Stepped 10-Block Pixel Gauge"');
      expect(html).toContain('React, TypeScript, Next.js, Tailwind CSS, HTML5 Canvas');

      // BACKEND_DATA: Node.js, Express, PostgreSQL, MongoDB, Cloud Firestore
      expect(html).toContain('BACKEND_DATA [8/10]');
      expect(html).toContain('████████░░ [80%]');
      expect(html).toContain('aria-label="BACKEND_DATA 80% Stepped 10-Block Pixel Gauge"');
      expect(html).toContain('Node.js, Express, PostgreSQL, MongoDB, Cloud Firestore');

      // LOW_LEVEL_OS: C, C++, Ubuntu Linux, Bash Scripting, POSIX IPC
      expect(html).toContain('LOW_LEVEL_OS [9/10]');
      expect(html).toContain('█████████░ [90%]');
      expect(html).toContain('aria-label="LOW_LEVEL_OS 90% Stepped 10-Block Pixel Gauge"');
      expect(html).toContain('C, C++, Ubuntu Linux, Bash Scripting, POSIX IPC');
    });

    it('renders core competencies list', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('CORE COMPETENCIES:');
      expect(html).toContain('• C++ / C Systems');
      expect(html).toContain('• TypeScript &amp; React');
      expect(html).toContain('• WebGL &amp; GLSL Shaders');
      expect(html).toContain('• Three.js Volumetrics');
      expect(html).toContain('• Native Web Audio API');
      expect(html).toContain('• Linux &amp; POSIX SHM');
    });

    it('adapts to custom palette tokens (Amber mode) with zero hardcoded default color overrides', () => {
      const htmlAmber = renderToString(
        React.createElement(AboutMeView, { palette: AMBER_PALETTE })
      );
      expect(htmlAmber).toContain(AMBER_PALETTE.bright);
      // Ensure name header does not hardcode old phosphor green
      expect(htmlAmber).not.toContain('text-[#c2cdb4]');
    });
  });

  describe('MODULE [2] MY PROJECTS (MY_PROJECTS.EXE — CARTRIDGE ARCHIVE & LIVE GITHUB SYNC)', () => {
    it('renders 90s dual-pane file commander header and mode tabs', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-content-projects"');
      expect(html).toContain('=== [2] MY PROJECTS // MY_PROJECTS.EXE ===');
      expect(html).toContain('DUAL-PANE COMMANDER');
      expect(html).toContain('data-testid="retro-projects-tab-dual"');
      expect(html).toContain('[☷ DUAL_PANES.EXE]');
      expect(html).toContain('data-testid="retro-projects-tab-featured"');
      expect(html).toContain('[★ FEATURED_ARCHIVE.EXE]');
      expect(html).toContain('data-testid="retro-projects-tab-github"');
      expect(html).toContain('[⇄ LIVE_GITHUB.FEED]');
    });

    it('renders true Norton Commander dual-pane layout with both Featured and GitHub panes in DOM', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-projects-pane-featured"');
      expect(html).toContain('data-testid="retro-projects-pane-github"');
      expect(html).toContain('VOLUME: ARCHIVE_C:\\FEATURED\\');
      expect(html).toContain('VOLUME: GITHUB_D:\\LIVE_FEED\\');
    });

    it('contains all 5 curated flagship case studies with Problem, Architecture, and Impact', () => {
      const html = renderToString(React.createElement(ProjectsView));

      // 01_MENTAL_DEFRAG.EXE
      expect(html).toContain('01_MENTAL_DEFRAG.EXE');
      expect(html).toContain('Zero-gravity spatial cognitive workspace');

      // 02_DOCLENS_BD.EXE
      expect(html).toContain('02_DOCLENS_BD.EXE');

      // 03_RANNABANNA.EXE
      expect(html).toContain('03_RANNABANNA.EXE');

      // 04_TRASH_TRAIL.EXE
      expect(html).toContain('04_TRASH_TRAIL.EXE');

      // 05_NEON_VANGUARD_OS.EXE
      expect(html).toContain('05_NEON_VANGUARD_OS.EXE');

      // Check breakdown headers
      expect(html).toContain('[PROBLEM STATEMENT]:');
      expect(html).toContain('[SYSTEM ARCHITECTURE]:');
      expect(html).toContain('[ENGINEERING IMPACT &amp; METRICS]:');
    });

    it('renders [RUN_DEMO.EXE] and [SOURCE_CODE] direct links for featured project', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-btn-run-demo"');
      expect(html).toContain('[RUN_DEMO.EXE]');
      expect(html).toContain('data-testid="retro-btn-source-code"');
      expect(html).toContain('[SOURCE_CODE]');
      expect(html).toContain('https://github.com/watchknight/Mental-Defrag');
    });

    it('renders live GitHub feed filter tabs in DOM: [ALL_FILES], [TS_WEB], [C_CPP_OS], [CANVAS_LABS]', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-repo-filter-ALL_FILES"');
      expect(html).toContain('data-testid="retro-repo-filter-TS_WEB"');
      expect(html).toContain('data-testid="retro-repo-filter-C_CPP_OS"');
      expect(html).toContain('data-testid="retro-repo-filter-CANVAS_LABS"');
    });

    it('renders each repository as an inspectable .PRG directory row showing repo name, description, language tag, star count, last updated date, and direct link', () => {
      const html = renderToString(React.createElement(ProjectsView));

      // Inspectable row container
      expect(html).toContain('data-testid="retro-github-repo-row-Mental-Defrag"');
      expect(html).toContain('Mental-Defrag.PRG');

      // Description
      expect(html).toContain('Zero-gravity spatial cognitive workspace built with Vite, TypeScript');

      // Language tag
      expect(html).toContain('[TypeScript]');

      // Star count
      expect(html).toContain('★ 24');

      // Last updated date
      expect(html).toContain('UPD: 2026-11-04');

      // Direct link to https://github.com/watchknight/
      expect(html).toContain('data-testid="retro-github-link-Mental-Defrag"');
      expect(html).toContain('https://github.com/watchknight/Mental-Defrag');
    });

    it('exports 5 verified featured projects matching specifications', () => {
      expect(FEATURED_PROJECTS).toHaveLength(5);
      const ids = FEATURED_PROJECTS.map((p) => p.fileCode);
      expect(ids).toEqual([
        '01_MENTAL_DEFRAG.EXE',
        '02_DOCLENS_BD.EXE',
        '03_RANNABANNA.EXE',
        '04_TRASH_TRAIL.EXE',
        '05_NEON_VANGUARD_OS.EXE',
      ]);

      // Verify each project has non-empty problem, architecture, impact, and demo/source links
      FEATURED_PROJECTS.forEach((p) => {
        expect(p.problem.length).toBeGreaterThan(20);
        expect(p.architecture.length).toBeGreaterThan(20);
        expect(p.impact.length).toBeGreaterThan(20);
        expect(p.demoUrl).toContain('https://github.com/watchknight');
        expect(p.sourceUrl).toContain('https://github.com/watchknight');
      });
    });

    it('exports resilient static fallback array of at least 12 GitHub repositories with valid direct URLs', () => {
      expect(FALLBACK_REPOSITORIES.length).toBeGreaterThanOrEqual(12);
      const names = FALLBACK_REPOSITORIES.map((r) => r.name);
      expect(names).toContain('Mental-Defrag');
      expect(names).toContain('DocLensBD');
      expect(names).toContain('Rannabanna');
      expect(names).toContain('TrashTrail');
      expect(names).toContain('BitForge');
      expect(names).toContain('hyperdeck-3d-particles');

      FALLBACK_REPOSITORIES.forEach((repo) => {
        expect(repo.html_url).toContain(`https://github.com/watchknight/${repo.name}`);
      });
    });

    it('includes backwards-compatible systems subsystems & architectural labs', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('HYPERDECK 3D PARTICLE ENGINE');
      expect(html).toContain('RETRO 90S OS WINDOW MANAGER');
      expect(html).toContain('PROCEDURAL CHIPTUNE AUDIO ENGINE');
      expect(html).toContain('DEDICATED BROWSER EXTENSION STUDIO');
    });
  });

  describe('MODULE [3] RESUME (RESUME_CV.DOC — INTERACTIVE DOSSIER & ZERO-FRICTION CONTACT)', () => {
    it('renders scannable retro document viewer with testid="retro-content-resume"', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-content-resume"');
      expect(html).toContain('=== [3] RESUME // RESUME_CV.DOC ===');
      expect(html).toContain('DOSSIER_v4.96');
    });

    it('renders Academic Ledger with EWU CSE credentials and core coursework', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('ACADEMIC PROFILE // ACADEMIC LEDGER');
      expect(html).toContain('B.Sc. in Computer Science &amp; Engineering (2022–2026)');
      expect(html).toContain('East West University (EWU), Dhaka, Bangladesh');
      expect(html).toContain('Operating Systems');
      expect(html).toContain('Data Structures &amp; Algorithms');
      expect(html).toContain('Database Systems');
      expect(html).toContain('Software Engineering');
    });

    it('renders Technical Matrix table with categorized monochrome skill sets', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('TECHNICAL SKILLS BREAKDOWN // TECHNICAL MATRIX');
      expect(html).toContain('LANGUAGES');
      expect(html).toContain('C, C++, TypeScript, JavaScript, Python, Go, Rust, SQL, Bash (Linux)');
      expect(html).toContain('FRAMEWORKS &amp; LIBS');
      expect(html).toContain('React 18, Next.js, Vite, Tailwind CSS, Three.js, GSAP ScrollTrigger');
      expect(html).toContain('DATABASES &amp; CLOUD');
      expect(html).toContain('PostgreSQL, MongoDB, Cloud Firestore, Firebase Auth, IndexedDB, Redis');
      expect(html).toContain('LINUX &amp; TOOLING');
      expect(html).toContain('Ubuntu Linux, POSIX Shared Memory &amp; Pipes, Git, GitHub Actions CI/CD');
    });

    it('renders [DOWNLOAD_RESUME.PDF] button with link to /resume.pdf', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-download-btn"');
      expect(html).toContain('href="/resume.pdf"');
      expect(html).toContain('[↓ DOWNLOAD RESUME.PDF]');
      expect(html).toContain('download="Abdur_Rahman_Moayed_Resume.pdf"');
    });

    it('renders [COPY_EMAIL.EXE] button and social terminal links', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('[COPY_EMAIL.EXE]');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('https://github.com/watchknight');
      expect(html).toContain('@watchknight');
      expect(html).toContain('data-testid="retro-link-linkedin"');
      expect(html).toContain('https://linkedin.com/in/watchknight');
    });
  });

  describe('INTEGRATION: RetroOSWindow Integration & GEMINI.md Invariants', () => {
    it('seamlessly renders AboutMeView in expanded mode when activeSection is about', () => {
      const htmlAbout = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );
      expect(htmlAbout).toContain('data-testid="retro-content-about"');
      expect(htmlAbout).toContain('ABDUR RAHMAN MOAYED');
      expect(htmlAbout).toContain('FRONTEND_SYS [9/10]');
      expect(htmlAbout).toContain('process trees');
    });

    it('seamlessly renders ProjectsView in expanded mode when activeSection is projects', () => {
      const htmlProjects = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );
      expect(htmlProjects).toContain('data-testid="retro-content-projects"');
      expect(htmlProjects).toContain('01_MENTAL_DEFRAG.EXE');
      expect(htmlProjects).toContain('[RUN_DEMO.EXE]');
      expect(htmlProjects).toContain('data-testid="retro-projects-pane-featured"');
      expect(htmlProjects).toContain('data-testid="retro-projects-pane-github"');
    });

    it('seamlessly renders ResumeView in expanded mode when activeSection is resume', () => {
      const htmlResume = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'resume' })
      );
      expect(htmlResume).toContain('data-testid="retro-content-resume"');
      expect(htmlResume).toContain('data-testid="retro-resume-download-btn"');
      expect(htmlResume).toContain('[COPY_EMAIL.EXE]');
    });

    it('strictly complies with GEMINI.md: zero banned legacy color hex codes in all views', () => {
      const htmlAbout = renderToString(React.createElement(AboutMeView));
      const htmlProjects = renderToString(React.createElement(ProjectsView));
      const htmlResume = renderToString(React.createElement(ResumeView));

      const combined = (htmlAbout + htmlProjects + htmlResume).toLowerCase();
      expect(combined).not.toContain('#d9532f');
      expect(combined).not.toContain('#a74024');
      expect(combined).not.toContain('#ff4d1c');
      expect(combined).not.toContain('#4e9a7f');
    });
  });
});
