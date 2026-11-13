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
  describe('Module 2: About & Skills', () => {
    it('renders authentic 90s terminal header with testid="retro-content-about"', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('data-testid="retro-content-about"');
      expect(html).toContain('2. About');
      expect(html).toContain('title="About"');
      expect(html).toContain('Profile');
    });

    it('renders 16x16 2bpp pixel portrait SVG with pixelated rendering', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('Pixel Portrait of Abdur Rahman Moayed (@watchknight)');
      expect(html).toContain('image-rendering:pixelated');
      expect(html).toContain('16x16 Pixel Art');
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

    it('renders pulsing availability badge for software engineering internships & full-stack roles', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('data-testid="pulsing-availability-badge"');
      expect(html).toContain('Available for Software Engineering Internships &amp; Full-Stack Roles');
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
      expect(html).toContain('About Me');
      expect(html).toContain('Plus Jakarta Sans');
      expect(html).toContain('max-width:62ch');
      expect(html).toContain('My core engineering discipline combines strong Data Structures &amp; Algorithms fundamentals in C++ and Python with high-performance TypeScript, React, and interactive web applications.');
      expect(html).not.toContain('shared memory');
      expect(html).not.toContain('process trees');
      expect(html).not.toContain('Linux systems programming');
    });

    it('replaces giant progress bars with clean 3-column capability grid (Frontend & Interactive UI, Backend, Data & Cloud, Core CSE & Languages)', () => {
      const html = renderToString(React.createElement(AboutMeView));

      expect(html).toContain('data-testid="skills-capability-grid"');
      expect(html).toContain('grid-cols-1 md:grid-cols-3');
      expect(html).not.toContain('role="progressbar"');
      expect(html).not.toContain('FRONTEND_SYS [9/10]');

      // Column 1: Frontend & Interactive UI
      expect(html).toContain('Frontend &amp; Interactive UI');
      expect(html).toContain('TypeScript');
      expect(html).toContain('React 18');
      expect(html).toContain('Next.js');
      expect(html).toContain('Tailwind CSS');
      expect(html).toContain('GSAP &amp; ScrollTrigger');
      expect(html).toContain('HTML5 Canvas');
      expect(html).toContain('3D Web &amp; Face Tracking');

      // Column 2: Backend, Data & Cloud
      expect(html).toContain('Backend, Data &amp; Cloud');
      expect(html).toContain('Node.js');
      expect(html).toContain('Express');
      expect(html).toContain('PostgreSQL');
      expect(html).toContain('MongoDB');
      expect(html).toContain('Cloud Firestore');
      expect(html).toContain('IndexedDB');
      expect(html).toContain('Render &amp; GitHub Actions CI/CD');

      // Column 3: Core CSE & Languages
      expect(html).toContain('Core CSE &amp; Languages');
      expect(html).toContain('Data Structures &amp; Algorithms');
      expect(html).toContain('C++');
      expect(html).toContain('C');
      expect(html).toContain('Python');
      expect(html).toContain('Java');
      expect(html).toContain('JavaScript');
      expect(html).toContain('Git &amp; Ubuntu Linux Workflow');
    });

    it('renders core competencies list', () => {
      const html = renderToString(React.createElement(AboutMeView));
      expect(html).toContain('Core Competencies:');
      expect(html).toContain('• C++ / C Systems');
      expect(html).toContain('• TypeScript &amp; React 18');
      expect(html).toContain('• WebGL &amp; 3D Web');
      expect(html).toContain('• Cloud Firestore &amp; DBs');
      expect(html).toContain('• Interactive Algorithm Visualization');
      expect(html).not.toContain('• Linux &amp; IPC Pipelines');
      expect(html).toContain('• Native Web Audio API');
    });

    it('exports verified 3-column capability matrix with exact required tech stacks', () => {
      expect(CAPABILITY_COLUMNS).toHaveLength(3);
      expect(CAPABILITY_COLUMNS[0].title).toBe('Frontend & Interactive UI');
      expect(CAPABILITY_COLUMNS[0].skills).toEqual([
        'TypeScript',
        'React 18',
        'Next.js',
        'Tailwind CSS',
        'GSAP & ScrollTrigger',
        'HTML5 Canvas',
        '3D Web & Face Tracking',
      ]);

      expect(CAPABILITY_COLUMNS[1].title).toBe('Backend, Data & Cloud');
      expect(CAPABILITY_COLUMNS[1].skills).toEqual([
        'Node.js',
        'Express',
        'Cloud Firestore',
        'PostgreSQL',
        'MongoDB',
        'IndexedDB',
        'Render & GitHub Actions CI/CD',
      ]);

      expect(CAPABILITY_COLUMNS[2].title).toBe('Core CSE & Languages');
      expect(CAPABILITY_COLUMNS[2].skills).toEqual([
        'Data Structures & Algorithms',
        'C++',
        'C',
        'Python',
        'Java',
        'JavaScript',
        'Git & Ubuntu Linux Workflow',
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
    it('renders clean section header "Selected Engineering Work" and right-aligned link "View All on GitHub (@watchknight)"', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-content-projects"');
      expect(html).toContain('Selected Engineering Work');
      expect(html).toContain('View All on GitHub (@watchknight)');
      expect(html).toContain('href="https://github.com/watchknight?tab=repositories"');
    });

    it('renders spacious 2x2 Flagship Project Grid with 20px gap, 20px padding, and 1px border', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="flagship-projects-grid"');
      expect(html).toContain('grid-cols-1 md:grid-cols-2');
      expect(html).toContain('gap-[20px]');
      expect(html).toContain('padding:20px');
      expect(html).toContain('border:1px solid #6e7d62');
    });

    it('contains only the 4 flagship projects: BitForge, FocusLab, Rannabanna, DocLensBD', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="flagship-card-01"');
      expect(html).toContain('data-testid="flagship-card-02"');
      expect(html).toContain('data-testid="flagship-card-03"');
      expect(html).toContain('data-testid="flagship-card-04"');

      expect(html).toContain('BitForge');
      expect(html).toContain('FocusLab');
      expect(html).toContain('Rannabanna');
      expect(html).toContain('DocLensBD');
    });

    it('renders CRT photo demo frames with 16:9 aspect ratio and subtle CRT monochrome green phosphor filter', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="crt-photo-frame"');
      expect(html).toContain('aspect-video');
      expect(html).toContain('data-testid="btn-toggle-photo-color"');
      expect(html).toContain('View Original Color');
      expect(html).toContain('filter:grayscale(100%) contrast(115%) sepia(25%) hue-rotate(55deg)');
      expect(html).toContain('/projects/bitforge.png');
      expect(html).toContain('/projects/focuslab.png');
      expect(html).toContain('/projects/rannabanna.png');
      expect(html).toContain('/projects/doclensbd.png');
    });

    it('renders all 4 scannable elements per card: index/tag, title/summary, outcome badge, and action row', () => {
      const html = renderToString(React.createElement(ProjectsView));

      // 1. Top row monospace index and category tags
      expect(html).toContain('01');
      expect(html).toContain('Visual Algorithm Lab');
      expect(html).toContain('02');
      expect(html).toContain('Cognitive Performance Web App');
      expect(html).toContain('03');
      expect(html).toContain('Full-Stack Consumer Platform');
      expect(html).toContain('04');
      expect(html).toContain('3D E-Commerce &amp; Computer Vision');

      // 2. High impact 1-sentence summaries in Plus Jakarta Sans
      expect(html).toContain('Stop memorizing code. Watch data move with real-time step-through simulations and synchronized multi-language code.');
      expect(html).toContain('Build focus you can measure with a 3-minute reaction test, guided focus practices, and private local insights.');
      expect(html).toContain('Cook the world with what you have by matching fridge and pantry staples to authentic global and Bengali dishes.');
      expect(html).toContain('Vision meets high fashion with real-time 3D camera frame try-on and custom prescription configuration.');

      // 3. Key outcome badges
      expect(html).toContain('50+ Visualized Algos • 11 Curriculum Stages • C++ / Python / Java / TS');
      expect(html).toContain('3-Minute Reflex Check • Sub-ms Precision • English &amp; বাংলা UI');
      expect(html).toContain('1-Tap Pantry Match • Global &amp; Bengali Cuisines • English &amp; বাংলা UI');
      expect(html).toContain('198+ Precision Frames • 3D Face-Tracking Try-On • Custom Prescription Flow');

      // 4. Action row with Read Case Study, Live Demo, and GitHub
      expect(html).toContain('Read Case Study');
      expect(html).toContain('Live Demo');
      expect(html).toContain('GitHub');
    });

    it('renders all 4 quantified outcome badges exactly as specified', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('50+ Visualized Algos • 11 Curriculum Stages • C++ / Python / Java / TS');
      expect(html).toContain('3-Minute Reflex Check • Sub-ms Precision • English &amp; বাংলা UI');
      expect(html).toContain('1-Tap Pantry Match • Global &amp; Bengali Cuisines • English &amp; বাংলা UI');
      expect(html).toContain('198+ Precision Frames • 3D Face-Tracking Try-On • Custom Prescription Flow');
    });

    it('renders bottom action row with Read Case Study, Live Demo, and GitHub for every card', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="retro-btn-read-case-study-01"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-02"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-03"');
      expect(html).toContain('data-testid="retro-btn-read-case-study-04"');
    });

    it('renders "More Live Deployed Web Apps" section with direct "Live App" and "GitHub" buttons', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="more-live-deployed-apps"');
      expect(html).toContain('More Live Deployed Web Apps');
      expect(html).toContain('Mental Defrag');
      expect(html).toContain('https://mental-defrag.onrender.com');
      expect(html).toContain('TrashTrail');
      expect(html).toContain('https://trashtrail.onrender.com');
      expect(html).toContain('POSHRA');
      expect(html).toContain('https://poshra.onrender.com');
    });

    it('exports 4 verified flagship case studies with 3 hero metrics and 3-part breakdown', () => {
      expect(FLAGSHIP_PROJECTS).toHaveLength(4);
      expect(FEATURED_PROJECTS).toHaveLength(4);
      const titles = FLAGSHIP_PROJECTS.map((p) => p.title);
      expect(titles).toEqual([
        'BitForge',
        'FocusLab',
        'Rannabanna',
        'DocLensBD',
      ]);

      FLAGSHIP_PROJECTS.forEach((p) => {
        expect(p.heroMetrics).toHaveLength(3);
        expect(p.problem.length).toBeGreaterThan(20);
        expect(p.howItWorks.length).toBeGreaterThan(20);
        expect(p.keyResults.length).toBeGreaterThan(20);
        expect(p.demoUrl).toContain('https://');
        expect(p.sourceUrl).toContain('https://github.com/watchknight');
        expect(p.hasSandbox).toBe(true);
      });
    });

    it('ensures Selected Work ends cleanly after More Live Deployed Web Apps without additional labs or architecture labs', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('data-testid="more-live-deployed-apps"');
      expect(html).not.toContain('data-testid="github-archive-accordion"');
      expect(html).not.toContain('+ View Additional Labs (8)');
      expect(html).not.toContain('data-testid="subsystems-labs-archive"');
      expect(html).not.toContain('Architecture Labs');
    });

    it('exports resilient static fallback array of at least 8 GitHub repositories including required labs', () => {
      expect(FALLBACK_REPOSITORIES.length).toBeGreaterThanOrEqual(8);
      const names = FALLBACK_REPOSITORIES.map((r) => r.name);
      expect(names).toContain('BitForge');
      expect(names).toContain('TrashTrail');
      expect(names).toContain('POSHRA');
      expect(names).toContain('PureFeed');
      expect(names).toContain('Mental-Defrag');
      expect(names).toContain('DocLensBD');
    });

    it('renders clean tech stack caption under each 16:9 thumbnail', () => {
      const html = renderToString(React.createElement(ProjectsView));
      expect(html).toContain('React • TypeScript • Canvas');
      expect(html).toContain('React • IndexedDB • Web Audio');
      expect(html).toContain('Vite • React • Bilingual UI');
      expect(html).toContain('React • 3D Try-On • Cloud');
      expect(html).not.toContain('SYS.1996 • 16:9 CRT');
    });
  });

  describe('Resume & Contact (Module 3)', () => {
    it('renders scannable retro document viewer with testid="retro-content-resume"', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-content-resume"');
      expect(html).toContain('3. Resume &amp; Contact');
      expect(html).toContain('Resume');
    });

    it('renders prominent top action bar with four tactile pixel-bordered buttons at the very top: Copy Email, LinkedIn Profile, GitHub (@watchknight), and Download Resume (PDF)', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-action-bar"');
      expect(html).toContain('Download Resume (PDF)');
      expect(html).toContain('Copy Email (armabdur.rahman04@gmail.com)');
      expect(html).toContain('GitHub (@watchknight)');
      expect(html).toContain('LinkedIn Profile');
      expect(html).toContain('data-testid="retro-resume-download-btn"');
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('data-testid="retro-link-linkedin"');
    });

    it('renders Education section with EWU CSE credentials and core coursework', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="academic-coursework-card"');
      expect(html).toContain('Education');
      expect(html).toContain('B.Sc. in Computer Science &amp; Engineering (2022–2026)');
      expect(html).toContain('East West University (EWU), Dhaka, Bangladesh');
      expect(html).toContain('Operating Systems');
      expect(html).toContain('Data Structures &amp; Algorithms');
      expect(html).toContain('Database Systems');
      expect(html).toContain('Software Engineering');
    });

    it('renders Key Engineering Highlights card with 3 concise bullet points', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('KEY ENGINEERING HIGHLIGHTS');
      expect(html).toContain('Architected and deployed 7 live production web applications spanning algorithm visualization (BitForge), cognitive testing (FocusLab), 3D eyewear try-on (DocLensBD), and bilingual recipe matching (Rannabanna).');
      expect(html).toContain('Strong foundation in Data Structures, Algorithms, and Object-Oriented Programming (C++, Python, Java, TypeScript) with a focus on 60 FPS interactive UI performance.');
      expect(html).toContain('Experienced in end-to-end full-stack delivery using React 18, Next.js, Node.js, Cloud Firestore, PostgreSQL, and automated CI/CD deployments.');
    });

    it('renders Download Resume (PDF) button with link to /resume.pdf', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-download-btn"');
      expect(html).toContain('href="/resume.pdf"');
      expect(html).toContain('title="Download Resume (PDF)"');
      expect(html).toContain('Download Resume (PDF)');
      expect(html).toContain('download="Abdur_Rahman_Moayed_Resume.pdf"');
    });

    it('renders Copy Email Address button and social terminal links', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('title="Copy Email (armabdur.rahman04@gmail.com)"');
      expect(html).toContain('armabdur.rahman04@gmail.com');
      expect(html).toContain('data-testid="retro-link-github"');
      expect(html).toContain('https://github.com/watchknight');
      expect(html).toContain('@watchknight');
      expect(html).toContain('data-testid="retro-link-linkedin"');
      expect(html).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');
    });

    it('renders interactive Linux CLI toggle [Open Interactive Terminal] and keeps it hidden by default', () => {
      const html = renderToString(React.createElement(ResumeView));
      expect(html).toContain('data-testid="btn-toggle-linux-cli"');
      expect(html).toContain('Open Interactive Terminal');
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
      expect(helpRes?.output.join(' ')).toContain('whoami');
      expect(helpRes?.output.join(' ')).toContain('projects');
      expect(helpRes?.output.join(' ')).toContain('contact');
      expect(helpRes?.output.join(' ')).toContain('clear');

      // whoami (case insensitive)
      const whoamiRes = processCliCommand('WHOAMI');
      expect(whoamiRes?.output.join(' ')).toContain('Abdur Rahman Moayed (@watchknight)');
      expect(whoamiRes?.output.join(' ')).toContain('East West University (EWU), Dhaka');
      expect(whoamiRes?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');

      // skills
      const skillsRes = processCliCommand('skills');
      expect(skillsRes?.output.join(' ')).toContain('Core CSE');
      expect(skillsRes?.output.join(' ')).toContain('Frontend');
      expect(skillsRes?.output.join(' ')).toContain('Backend');

      // projects: listing all 7 live Render URLs
      const projectsRes = processCliCommand('projects');
      expect(projectsRes?.output.join(' ')).toContain('https://bitforge-3u2q.onrender.com');
      expect(projectsRes?.output.join(' ')).toContain('https://focuslab-smoa.onrender.com');
      expect(projectsRes?.output.join(' ')).toContain('https://rannabanna.onrender.com');
      expect(projectsRes?.output.join(' ')).toContain('https://doclensbd.onrender.com');
      expect(projectsRes?.output.join(' ')).toContain('https://mental-defrag.onrender.com');
      expect(projectsRes?.output.join(' ')).toContain('https://trashtrail.onrender.com');
      expect(projectsRes?.output.join(' ')).toContain('https://poshra.onrender.com');

      // contact: displaying armabdur.rahman04@gmail.com and LinkedIn
      const contactRes = processCliCommand('contact');
      expect(contactRes?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');
      expect(contactRes?.output.join(' ')).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');

      // sudo hire moayed (with variations & whitespace handling)
      const hireRes = processCliCommand('sudo hire moayed');
      expect(hireRes?.output.join(' ')).toContain('[AUTH GRANTED]');
      expect(hireRes?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');

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
      expect(lsRes?.output.join(' ')).toContain('about-me.md');

      // cat resume.pdf
      const catRes = processCliCommand('cat resume.pdf');
      expect(catRes?.output.join(' ')).toContain('Download Resume (PDF)');

      // cat about-me.md and aliases
      const catAboutRes = processCliCommand('cat about-me.md');
      expect(catAboutRes?.output.join(' ')).toContain('2. About');
      const aboutAliasRes = processCliCommand('about');
      expect(aboutAliasRes?.output.join(' ')).toContain('2. About');

      // uname / pwd / cls / aliases
      const unameRes = processCliCommand('uname -a');
      expect(unameRes?.output.join(' ')).toContain('Linux ewu-cse');
      const pwdRes = processCliCommand('pwd');
      expect(pwdRes?.output.join(' ')).toContain('/home/moayed');
      const clsRes = processCliCommand('cls');
      expect(clsRes?.isClear).toBe(true);

      // Singular/plural aliases: project, contacts, who, resume
      const projectSingular = processCliCommand('project');
      expect(projectSingular?.output.join(' ')).toContain('BitForge');
      const contactsPlural = processCliCommand('contacts');
      expect(contactsPlural?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');
      const whoRes = processCliCommand('who');
      expect(whoRes?.output.join(' ')).toContain('Abdur Rahman Moayed');
      const resumeRes = processCliCommand('resume');
      expect(resumeRes?.output.join(' ')).toContain('Download Resume (PDF)');

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
      expect(htmlAbout).toContain('Data Structures &amp; Algorithms fundamentals in C++ and Python');
    });

    it('seamlessly renders ProjectsView in expanded mode when activeSection is projects', () => {
      const htmlProjects = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );
      expect(htmlProjects).toContain('data-testid="retro-content-projects"');
      expect(htmlProjects).toContain('Selected Engineering Work');
      expect(htmlProjects).toContain('data-testid="flagship-projects-grid"');
      expect(htmlProjects).toContain('Read Case Study');
    });

    it('seamlessly renders ResumeView in expanded mode when activeSection is resume', () => {
      const htmlResume = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'resume' })
      );
      expect(htmlResume).toContain('data-testid="retro-content-resume"');
      expect(htmlResume).toContain('data-testid="retro-resume-download-btn"');
      expect(htmlResume).toContain('title="Copy Email (armabdur.rahman04@gmail.com)"');
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

  describe('DEEP VERIFICATION: Clean Engineering Profile & High-Conversion Contact Spec', () => {
    describe('AboutMeView Exact Specification Checks', () => {
      it('identity card contains portrait, name, university, Bangladesh, and exact pulsing availability badge', () => {
        const html = renderToString(React.createElement(AboutMeView));
        expect(html).toContain('data-testid="about-identity-card"');
        expect(html).toContain('Pixel Portrait of Abdur Rahman Moayed (@watchknight)');
        expect(html).toContain('ABDUR RAHMAN MOAYED');
        expect(html).toContain('@watchknight');
        expect(html).toContain('B.Sc. in Computer Science &amp; Engineering at East West University, Dhaka, Bangladesh');
        expect(html).toContain('Available for Software Engineering Internships &amp; Full-Stack Roles');
        expect(html).toContain('data-testid="pulsing-availability-badge"');
        expect(html).toContain('animate-pulse');
      });

      it('biography explicitly references BitForge, FocusLab, Rannabanna, DocLensBD, and Mental Defrag', () => {
        const html = renderToString(React.createElement(AboutMeView));
        expect(html).toContain('data-testid="about-biography-section"');
        expect(html).toContain('BitForge');
        expect(html).toContain('FocusLab');
        expect(html).toContain('Rannabanna');
        expect(html).toContain('DocLensBD');
        expect(html).toContain('Mental Defrag');
        expect(html).toContain('Plus Jakarta Sans');
        expect(html).toContain('max-width:62ch');
      });

      it('ensures zero RPG filler stats in DOM', () => {
        const html = renderToString(React.createElement(AboutMeView));
        const bannedStats = [
          'CLASS: CYBERDECK PALADIN',
          'CYBERDECK PALADIN',
          'LEVEL: LVL 96',
          'LVL 96',
          'HP: 100/100',
          'EXP: 2026/2026',
          'Aesthetic Paradigm: WATCHKNIGHT_OS',
        ];
        bannedStats.forEach((stat) => {
          expect(html).not.toContain(stat);
        });
      });

      it('capability grid has 3 distinct columns with all required skills', () => {
        expect(CAPABILITY_COLUMNS).toHaveLength(3);

        const col1 = CAPABILITY_COLUMNS.find((c) => c.title === 'Frontend & Interactive UI');
        expect(col1).toBeDefined();
        expect(col1?.skills).toContain('TypeScript');
        expect(col1?.skills).toContain('React 18');
        expect(col1?.skills).toContain('Next.js');
        expect(col1?.skills).toContain('Tailwind CSS');
        expect(col1?.skills).toContain('GSAP & ScrollTrigger');
        expect(col1?.skills).toContain('HTML5 Canvas');
        expect(col1?.skills).toContain('3D Web & Face Tracking');

        const col2 = CAPABILITY_COLUMNS.find((c) => c.title === 'Backend, Data & Cloud');
        expect(col2).toBeDefined();
        expect(col2?.skills).toContain('Node.js');
        expect(col2?.skills).toContain('Express');
        expect(col2?.skills).toContain('Cloud Firestore');
        expect(col2?.skills).toContain('PostgreSQL');
        expect(col2?.skills).toContain('MongoDB');
        expect(col2?.skills).toContain('IndexedDB');
        expect(col2?.skills).toContain('Render & GitHub Actions CI/CD');

        const col3 = CAPABILITY_COLUMNS.find((c) => c.title === 'Core CSE & Languages');
        expect(col3).toBeDefined();
        expect(col3?.skills).toContain('Data Structures & Algorithms');
        expect(col3?.skills).toContain('C++');
        expect(col3?.skills).toContain('C');
        expect(col3?.skills).toContain('Python');
        expect(col3?.skills).toContain('Java');
        expect(col3?.skills).toContain('JavaScript');
        expect(col3?.skills).toContain('Git & Ubuntu Linux Workflow');
      });
    });

    describe('ResumeView Exact Specification & Contact Details', () => {
      it('action bar contains 4 tactile action buttons with verified contact info', () => {
        const html = renderToString(React.createElement(ResumeView));
        expect(html).toContain('data-testid="retro-resume-action-bar"');

        // 1. Copy Email
        expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
        expect(html).toContain('Copy Email (armabdur.rahman04@gmail.com)');

        // 2. LinkedIn Profile
        expect(html).toContain('data-testid="retro-link-linkedin"');
        expect(html).toContain('href="https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/"');
        expect(html).toContain('LinkedIn Profile');

        // 3. GitHub (@watchknight)
        expect(html).toContain('data-testid="retro-link-github"');
        expect(html).toContain('href="https://github.com/watchknight"');
        expect(html).toContain('GitHub (@watchknight)');

        // 4. Download Resume (PDF)
        expect(html).toContain('data-testid="retro-resume-download-btn"');
        expect(html).toContain('href="/resume.pdf"');
        expect(html).toContain('Download Resume (PDF)');
      });

      it('renders Education & Coursework card detailing EWU degree and all 5 core subjects', () => {
        const html = renderToString(React.createElement(ResumeView));
        expect(html).toContain('data-testid="academic-coursework-card"');
        expect(html).toContain('East West University (EWU), Dhaka, Bangladesh');
        expect(html).toContain('B.Sc. in Computer Science &amp; Engineering');
        expect(html).toContain('Data Structures &amp; Algorithms');
        expect(html).toContain('Operating Systems');
        expect(html).toContain('Database Systems');
        expect(html).toContain('Software Engineering');
        expect(html).toContain('Object-Oriented Programming');
      });

      it('subtle toggle button reads "Open Interactive Terminal" and terminal is hidden by default', () => {
        const html = renderToString(React.createElement(ResumeView));
        expect(html).toContain('data-testid="btn-toggle-linux-cli"');
        expect(html).toContain('Open Interactive Terminal');
        expect(html).not.toContain('data-testid="interactive-linux-cli"');
      });

      it('CLI contact command outputs armabdur.rahman04@gmail.com and LinkedIn profile URL', () => {
        const contactRes = processCliCommand('contact');
        expect(contactRes).not.toBeNull();
        expect(contactRes?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');
        expect(contactRes?.output.join(' ')).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');
      });

      it('CLI projects command lists all 7 live Render-deployed web app URLs', () => {
        const projectsRes = processCliCommand('projects');
        expect(projectsRes).not.toBeNull();
        const output = projectsRes?.output.join(' ') || '';
        const expectedUrls = [
          'https://bitforge-3u2q.onrender.com',
          'https://focuslab-smoa.onrender.com',
          'https://rannabanna.onrender.com',
          'https://doclensbd.onrender.com',
          'https://mental-defrag.onrender.com',
          'https://trashtrail.onrender.com',
          'https://poshra.onrender.com',
        ];
        expectedUrls.forEach((url) => {
          expect(output).toContain(url);
        });
      });

      it('CLI whoami command outputs verified identity, university, email, and LinkedIn', () => {
        const whoamiRes = processCliCommand('whoami');
        expect(whoamiRes).not.toBeNull();
        const text = whoamiRes?.output.join(' ') || '';
        expect(text).toContain('Abdur Rahman Moayed');
        expect(text).toContain('@watchknight');
        expect(text).toContain('East West University (EWU), Dhaka, Bangladesh');
        expect(text).toContain('armabdur.rahman04@gmail.com');
        expect(text).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');
      });

      it('CLI command evaluator handles case-insensitivity, whitespace, clear, and invalid commands', () => {
        expect(processCliCommand('')).toBeNull();
        expect(processCliCommand('   \t  ')).toBeNull();

        const clearRes = processCliCommand('  CLEAR  ');
        expect(clearRes?.isClear).toBe(true);

        const unknownRes = processCliCommand('random_foo_bar');
        expect(unknownRes?.output.join(' ')).toContain('command not found');
      });

      it('Level 1 Quick Preview in RetroOSWindow presents 4 tactile buttons with verified details', () => {
        const html = renderToString(
          React.createElement(RetroOSWindow, {
            isExpanded: false,
            activeSection: 'resume',
          })
        );
        expect(html).toContain('data-testid="btn-copy-email"');
        expect(html).toContain('armabdur.rahman04@gmail.com');
        expect(html).toContain('data-testid="btn-linkedin-link"');
        expect(html).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');
        expect(html).toContain('data-testid="btn-github-link"');
        expect(html).toContain('https://github.com/watchknight');
        expect(html).toContain('data-testid="btn-download-cv"');
        expect(html).toContain('href="/resume.pdf"');
      });
    });
  });
});
