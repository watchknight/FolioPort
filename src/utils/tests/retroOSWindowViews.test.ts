import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AboutMeView, CAPABILITY_COLUMNS } from '../../components/views/AboutMeView';
import {
  ProjectsView,
  FLAGSHIP_PROJECTS,
  FEATURED_PROJECTS,
  FALLBACK_REPOSITORIES,
} from '../../components/views/ProjectsView';
import { ResumeView, processCliCommand } from '../../components/views/ResumeView';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { AMBER_PALETTE } from '../../components/CRTDioramaStage';

describe('Retro 90s OS Window View Modules (Strict 4-Color Pixel UI)', () => {
  describe('MODULE [2] ABOUT & SKILLS (ABOUT_ME.TXT — STREAMLINED ENGINEERING PROFILE)', () => {
    it('renders authentic 90s terminal header with testid="retro-content-about"', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('data-testid="retro-content-about"');
      expect(html).toContain('=== [2] ABOUT &amp; SKILLS // ABOUT_ME.TXT ===');
      expect(html).toContain('title="=== [2] ABOUT &amp; SKILLS // ABOUT_ME.TXT ==="');
      expect(html).toContain('SYS.96 // PROFILE');
    });

    it('renders 16x16 2bpp pixel portrait SVG with pixelated rendering', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('Pixel Portrait of Abdur Rahman Moayed (@watchknight)');
      expect(html).toContain('image-rendering:pixelated');
      expect(html).toContain('[16x16 2BPP PHOSPHOR]');
      expect(html).toContain('viewBox="0 0 16 16"');
    });

    it('displays identity header with name, handle, institution, and UTC+6 coordinates', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('ABDUR RAHMAN MOAYED');
      expect(html).toContain('@watchknight');
      expect(html).toContain('B.Sc. in Computer Science &amp; Engineering at East West University, Dhaka');
      expect(html).toContain('Dhaka, BD (23°N, 90°E)');
      expect(html).toContain('UTC+6');
    });

    it('renders pulsing availability badge for software engineering internships & systems roles', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('data-testid="pulsing-availability-badge"');
      expect(html).toContain('Available for Software Engineering Internships &amp; Full-Stack / Systems Roles');
      expect(html).toContain('animate-pulse');
    });

    it('strictly eliminates all RPG filler stats (CYBERDECK PALADIN, LVL 96, HP, EXP, Aesthetic Paradigm)', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).not.toContain('CYBERDECK PALADIN');
      expect(html).not.toContain('LVL 96');
      expect(html).not.toContain('100/100');
      expect(html).not.toContain('2026/2026');
      expect(html).not.toContain('Aesthetic Paradigm: WATCHKNIGHT_OS');
    });

    it('renders concise 2-paragraph engineering biography in readable Plus Jakarta Sans (max-width: 62ch)', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('data-testid="about-biography-section"');
      expect(html).toContain('SYSTEM MANIFEST // ENGINEERING BIOGRAPHY:');
      expect(html).toContain('Plus Jakarta Sans');
      expect(html).toContain('max-width:62ch');
      expect(html).toContain('C/C++ Operating Systems engineering');
      expect(html).toContain('POSIX shared memory');
      expect(html).toContain('process trees');
      expect(html).toContain('Linux systems programming');
      expect(html).toContain('TypeScript, React, and interactive web applications');
    });

    it('replaces giant progress bars with clean 3-column capability grid (Frontend, Backend, Systems)', () => {
      const html = renderToString(React.createElement(AboutMeView));

      expect(html).toContain('data-testid="skills-capability-grid"');
      expect(html).toContain('grid-cols-1 md:grid-cols-3');
      expect(html).not.toContain('role="progressbar"');
      expect(html).not.toContain('FRONTEND_SYS [9/10]');

      // Column 1: Frontend & Interactive
      expect(html).toContain('Frontend &amp; Interactive');
      expect(html).toContain('TypeScript');
      expect(html).toContain('React 18');
      expect(html).toContain('Next.js');
      expect(html).toContain('Tailwind CSS');
      expect(html).toContain('HTML5 Canvas');
      expect(html).toContain('GSAP');

      // Column 2: Backend & Cloud
      expect(html).toContain('Backend &amp; Cloud');
      expect(html).toContain('Node.js');
      expect(html).toContain('Express');
      expect(html).toContain('PostgreSQL');
      expect(html).toContain('MongoDB');
      expect(html).toContain('Cloud Firestore');
      expect(html).toContain('Docker');

      // Column 3: Systems & Core CSE
      expect(html).toContain('Systems &amp; Core CSE');
      expect(html).toContain('Ubuntu Linux');
      expect(html).toContain('POSIX Shared Memory &amp; IPC');
      expect(html).toContain('Bash');
      expect(html).toContain('Valgrind/GDB');
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

    it('exports verified 3-column capability matrix with exact required tech stacks', () => {
      expect(CAPABILITY_COLUMNS).toHaveLength(3);
      expect(CAPABILITY_COLUMNS[0].title).toBe('Frontend & Interactive');
      expect(CAPABILITY_COLUMNS[0].skills).toEqual([
        'TypeScript',
        'React 18',
        'Next.js',
        'Tailwind CSS',
        'HTML5 Canvas',
        'GSAP',
      ]);

      expect(CAPABILITY_COLUMNS[1].title).toBe('Backend & Cloud');
      expect(CAPABILITY_COLUMNS[1].skills).toEqual([
        'Node.js',
        'Express',
        'PostgreSQL',
        'MongoDB',
        'Cloud Firestore',
        'Docker',
      ]);

      expect(CAPABILITY_COLUMNS[2].title).toBe('Systems & Core CSE');
      expect(CAPABILITY_COLUMNS[2].skills).toEqual([
        'C',
        'C++',
        'Ubuntu Linux',
        'POSIX Shared Memory & IPC',
        'Bash',
        'Valgrind/GDB',
      ]);
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

  describe('MODULE [2] SELECTED WORK (4-PROJECT SHOWCASE & TWO-TIER PROGRESSIVE DISCLOSURE)', () => {
    it('renders clean section header "SELECTED ENGINEERING WORK (4 FLAGSHIP CASE STUDIES)" and right-aligned link "[All 14 Repos on GitHub @watchknight]"', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-content-projects"');
      expect(html).toContain('SELECTED ENGINEERING WORK (4 FLAGSHIP CASE STUDIES)');
      expect(html).toContain('[All 14 Repos on GitHub @watchknight]');
      expect(html).toContain('href="https://github.com/watchknight"');
    });

    it('renders spacious 2x2 Flagship Project Grid with 20px gap, 20px padding, and 1px border', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="flagship-projects-grid"');
      expect(html).toContain('grid-cols-1 md:grid-cols-2');
      expect(html).toContain('gap-[20px]');
      expect(html).toContain('padding:20px');
      expect(html).toContain('border:1px solid #6e7d62');
    });

    it('contains only the 4 flagship projects: Mental Defrag, FocusGuard, Neon Vanguard & POSIX, DocLensBD & Rannabanna', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="flagship-card-01"');
      expect(html).toContain('data-testid="flagship-card-02"');
      expect(html).toContain('data-testid="flagship-card-03"');
      expect(html).toContain('data-testid="flagship-card-04"');

      expect(html).toContain('Mental Defrag');
      expect(html).toContain('FocusGuard');
      expect(html).toContain('Neon Vanguard &amp; POSIX');
      expect(html).toContain('DocLensBD &amp; Rannabanna');
    });

    it('renders all 4 scannable elements per card: index/tag, title/summary, outcome badge, and action row', () => {
      const html = renderToString(React.createElement(ProjectsView));

      // 1. Top row monospace index and category tags
      expect(html).toContain('01');
      expect(html).toContain('SPATIAL WEB');
      expect(html).toContain('02');
      expect(html).toContain('CHROME MV3');
      expect(html).toContain('03');
      expect(html).toContain('SYSTEMS &amp; 2D ENGINE');
      expect(html).toContain('04');
      expect(html).toContain('CLOUD PLATFORM');

      // 2. High impact 1-sentence summaries in Plus Jakarta Sans
      expect(html).toContain('Zero-gravity spatial cognitive workspace built with Matter.js');
      expect(html).toContain('Manifest V3 browser productivity daemon engineered');
      expect(html).toContain('Deterministic 120 FPS HTML5 canvas combat engine');
      expect(html).toContain('Cloud-backed medical diagnostic intelligence platform');

      // 3. Key outcome badges
      expect(html).toContain('60 FPS • 200+ Physics Nodes • Obsidian AST Sync');
      expect(html).toContain('-58% RAM Reclaimed • &lt;12 MB Heap • Manifest V3');
      expect(html).toContain('120 FPS Zero-Alloc Canvas • &lt;1.2µs POSIX IPC');
      expect(html).toContain('Cloud Firestore • Real-Time Sync • CI/CD');

      // 4. Action row with [Read Case Study], [Live Demo], and [GitHub]
      expect(html).toContain('[Read Case Study]');
      expect(html).toContain('[Live Demo]');
      expect(html).toContain('[GitHub]');
    });

    it('renders all 4 quantified outcome badges exactly as specified', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('60 FPS • 200+ Physics Nodes • Obsidian AST Sync');
      expect(html).toContain('-58% RAM Reclaimed • &lt;12 MB Heap • Manifest V3');
      expect(html).toContain('120 FPS Zero-Alloc Canvas • &lt;1.2µs POSIX IPC');
      expect(html).toContain('Cloud Firestore • Real-Time Sync • CI/CD');
    });

    it('renders bottom action row with [Read Case Study], [Live Demo], and [GitHub] for every card', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-btn-read-case-study-01"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-02"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-03"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-04"');
    });

    it('exports 4 verified flagship case studies with 3 hero metrics and 3-part breakdown', () => {
      expect(FLAGSHIP_PROJECTS).toHaveLength(4);
      expect(FEATURED_PROJECTS).toHaveLength(4);
      const titles = FLAGSHIP_PROJECTS.map((p) => p.title);
      expect(titles).toEqual([
        'Mental Defrag',
        'FocusGuard',
        'Neon Vanguard & POSIX',
        'DocLensBD & Rannabanna',
      ]);

      FLAGSHIP_PROJECTS.forEach((p) => {
        expect(p.heroMetrics).toHaveLength(3);
        expect(p.problem.length).toBeGreaterThan(20);
        expect(p.architecture.length).toBeGreaterThan(20);
        expect(p.impact.length).toBeGreaterThan(20);
        expect(p.demoUrl).toContain('https://github.com/watchknight');
        expect(p.sourceUrl).toContain('https://github.com/watchknight');
      });
    });

    it('renders compact GitHub archive accordion bar "[+ View Additional Open-Source Labs & C/C++ Repos (8)]"', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="btn-toggle-github-accordion"');
      expect(html).toContain('[+ View Additional Open-Source Labs &amp; C/C++ Repos (8)]');
    });

    it('exports resilient static fallback array of at least 12 GitHub repositories including required labs', () => {
      expect(FALLBACK_REPOSITORIES.length).toBeGreaterThanOrEqual(12);
      const names = FALLBACK_REPOSITORIES.map((r) => r.name);
      expect(names).toContain('BitForge');
      expect(names).toContain('simd-json-stream');
      expect(names).toContain('posix-shm-kernel-lab');
      expect(names).toContain('TrashTrail');
      expect(names).toContain('POSHRA');
      expect(names).toContain('PureFeed');
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

    it('renders prominent top action bar with large, tactile pixel-bordered buttons: [Download Resume (PDF)], [Copy Email Address], [GitHub: @watchknight], and [LinkedIn]', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-action-bar"');
      expect(html).toContain('grid-cols-1 md:grid-cols-3');
      expect(html).toContain('[Download Resume (PDF)]');
      expect(html).toContain('[Copy Email Address]');
      expect(html).toContain('[GitHub: @watchknight]');
      expect(html).toContain('[LinkedIn]');
      expect(html).toContain('data-testid="retro-resume-download-btn"');
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('data-testid="retro-link-linkedin"');
    });

    it('renders Academic Ledger with EWU CSE credentials and core coursework', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="academic-coursework-card"');
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
      expect(html).toContain('title="[↓ DOWNLOAD RESUME.PDF]"');
      expect(html).toContain('[Download Resume (PDF)]');
      expect(html).toContain('download="Abdur_Rahman_Moayed_Resume.pdf"');
    });

    it('renders [COPY_EMAIL.EXE] button and social terminal links', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('title="[COPY_EMAIL.EXE]"');
      expect(html).toContain('[Copy Email Address]');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('https://github.com/watchknight');
      expect(html).toContain('@watchknight');
      expect(html).toContain('data-testid="retro-link-linkedin"');
      expect(html).toContain('https://linkedin.com/in/watchknight');
    });

    it('renders interactive Linux CLI toggle [Launch Interactive Linux CLI (moayed@ewu-cse)] and keeps it hidden by default', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="btn-toggle-linux-cli"');
      expect(html).toContain('[Launch Interactive Linux CLI (moayed@ewu-cse)]');
      // Verify CLI is completely hidden by default
      expect(html).not.toContain('data-testid="interactive-linux-cli"');
    });

    it('processes all interactive Linux CLI commands: help, whoami, skills, projects, sudo hire moayed, clear, exit, ls, cat', () => {
      // Empty input
      expect(processCliCommand('')).toBeNull();
      expect(processCliCommand('   ')).toBeNull();

      // help
      const helpRes = processCliCommand('help');
      expect(helpRes?.output.join(' ')).toContain('Available interactive commands:');
      expect(helpRes?.output.join(' ')).toContain('sudo hire moayed');
      expect(helpRes?.output.join(' ')).toContain('exit');

      // whoami (case insensitive)
      const whoamiRes = processCliCommand('WHOAMI');
      expect(whoamiRes?.output.join(' ')).toContain('Abdur Rahman Moayed (@watchknight)');
      expect(whoamiRes?.output.join(' ')).toContain('East West University (EWU), Dhaka');

      // skills
      const skillsRes = processCliCommand('skills');
      expect(skillsRes?.output.join(' ')).toContain('Systems & Core CSE');
      expect(skillsRes?.output.join(' ')).toContain('POSIX Shared Memory');
      expect(skillsRes?.output.join(' ')).toContain('Frontend & Web');
      expect(skillsRes?.output.join(' ')).toContain('Backend & Cloud');

      // projects
      const projectsRes = processCliCommand('projects');
      expect(projectsRes?.output.join(' ')).toContain('Mental Defrag');
      expect(projectsRes?.output.join(' ')).toContain('FocusGuard');
      expect(projectsRes?.output.join(' ')).toContain('Neon Vanguard & POSIX');
      expect(projectsRes?.output.join(' ')).toContain('DocLensBD');

      // sudo hire moayed (with variations & whitespace handling)
      const hireRes = processCliCommand('sudo hire moayed');
      expect(hireRes?.output.join(' ')).toContain('[AUTH GRANTED]');
      expect(hireRes?.output.join(' ')).toContain('moayed.cse@gmail.com');

      const hireRes2 = processCliCommand('  sudo   hire  moayed!  ');
      expect(hireRes2?.output.join(' ')).toContain('[AUTH GRANTED]');

      const hireRes3 = processCliCommand('./hire_moayed.sh');
      expect(hireRes3?.output.join(' ')).toContain('[AUTH GRANTED]');

      // clear
      const clearRes = processCliCommand('clear');
      expect(clearRes?.isClear).toBe(true);

      // exit / quit
      const exitRes = processCliCommand('exit');
      expect(exitRes?.isExit).toBe(true);
      const quitRes = processCliCommand('quit');
      expect(quitRes?.isExit).toBe(true);

      // ls / dir
      const lsRes = processCliCommand('ls');
      expect(lsRes?.output.join(' ')).toContain('resume.pdf');
      expect(lsRes?.output.join(' ')).toContain('about_me.txt');

      // cat resume.pdf
      const catRes = processCliCommand('cat resume.pdf');
      expect(catRes?.output.join(' ')).toContain('Download Resume (PDF)');

      // cat about_me.txt
      const catAboutRes = processCliCommand('cat about_me.txt');
      expect(catAboutRes?.output.join(' ')).toContain('ABOUT & SKILLS');

      // Unknown command
      const unknownRes = processCliCommand('invalid_command_xyz');
      expect(unknownRes?.output.join(' ')).toContain('bash: invalid_command_xyz: command not found');
    });
  });

  describe('INTEGRATION: RetroOSWindow Integration & GEMINI.md Invariants', () => {
    it('seamlessly renders AboutMeView in expanded mode when activeSection is about', () => {
      const htmlAbout = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );
      expect(htmlAbout).toContain('data-testid="retro-content-about"');
      expect(htmlAbout).toContain('ABDUR RAHMAN MOAYED');
      expect(htmlAbout).toContain('data-testid="skills-capability-grid"');
      expect(htmlAbout).toContain('Frontend &amp; Interactive');
      expect(htmlAbout).toContain('process trees');
    });

    it('seamlessly renders ProjectsView in expanded mode when activeSection is projects', () => {
      const htmlProjects = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );
      expect(htmlProjects).toContain('data-testid="retro-content-projects"');
      expect(htmlProjects).toContain('SELECTED ENGINEERING WORK (4 FLAGSHIP CASE STUDIES)');
      expect(htmlProjects).toContain('data-testid="flagship-projects-grid"');
      expect(htmlProjects).toContain('[Read Case Study]');
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
