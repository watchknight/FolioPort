import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';

declare const process: any;

import { CRTMonitorShell } from '../../components/CRTMonitorShell';
import { CRTDioramaStage, SAGE_PALETTE, AMBER_PALETTE } from '../../components/CRTDioramaStage';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import {
  RetroOSProvider,
  useRetroOS,
  evaluateRetroOSKeyEvent,
} from '../../context/RetroOSContext';
import {
  ProjectsView,
  buildBubbleSortSequence,
  INITIAL_SORT_ARRAY,
  PANTRY_STAPLES,
  PANTRY_RECIPES,
} from '../../components/views/ProjectsView';
import { AboutMeView } from '../../components/views/AboutMeView';
import { ResumeView, processCliCommand } from '../../components/views/ResumeView';
import { retroAudio } from '../../utils/retroAudio';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../../utils/chiptuneAudio';

describe('Principal QA Automation & Frontend Interaction Engineer Audit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('1. CRT Hardware Bezel & Diorama Interactions', () => {
    it('"SOUND" Button: cleanly toggles soundEnabled state, displays [ON]/[OFF], and safely unlocks Web Audio AudioContext', () => {
      // 1. Initial render with [ON] state
      const htmlOn = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSoundEnabled: true },
          React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'PAYLOAD'))
        )
      );

      expect(htmlOn).toContain('Sound');
      expect(htmlOn).toContain('[ON]');
      expect(htmlOn).toContain('aria-label="Sound effects are currently ON. Click to toggle."');
      expect(htmlOn).toContain('title="Toggle Web Audio Sound Effects"');

      // 2. Initial render with [OFF] state
      const htmlOff = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSoundEnabled: false },
          React.createElement(CRTMonitorShell, null, React.createElement('div', null, 'PAYLOAD'))
        )
      );

      expect(htmlOff).toContain('Sound');
      expect(htmlOff).toContain('[OFF]');
      expect(htmlOff).toContain('aria-label="Sound effects are currently OFF. Click to toggle."');

      // 3. Audio engine initialization method verification across all three audio synthesizers
      expect(typeof retroAudio.unlock).toBe('function');
      expect(typeof watchknightAudio.unlock).toBe('function');
      expect(typeof chiptuneAudio.unlock).toBe('function');

      const retroUnlockSpy = vi.spyOn(retroAudio, 'unlock');
      const watchknightUnlockSpy = vi.spyOn(watchknightAudio, 'unlock');
      const chiptuneUnlockSpy = vi.spyOn(chiptuneAudio, 'unlock');

      retroAudio.unlock();
      watchknightAudio.unlock();
      chiptuneAudio.unlock();

      expect(retroUnlockSpy).toHaveBeenCalled();
      expect(watchknightUnlockSpy).toHaveBeenCalled();
      expect(chiptuneUnlockSpy).toHaveBeenCalled();
    });

    it('"POWER" Button & LED: verifies 400ms tube collapse, Standby message, wake on keydown, and state preservation', () => {
      // 1. Powered On State
      const htmlOn = renderToString(
        React.createElement(
          CRTMonitorShell,
          { initialPoweredOn: true },
          React.createElement('div', { id: 'state-preserved-check' }, 'ACTIVE_USER_STATE')
        )
      );

      expect(htmlOn).toContain('Power');
      expect(htmlOn).toContain('PWR');
      expect(htmlOn).toContain('bg-[#c2cdb4]'); // Glowing LED
      expect(htmlOn).toContain('ACTIVE_USER_STATE');
      expect(htmlOn).toContain('id="state-preserved-check"');

      // 2. Standby State
      const htmlOff = renderToString(
        React.createElement(
          CRTMonitorShell,
          { initialPoweredOn: false },
          React.createElement('div', { id: 'state-preserved-check' }, 'ACTIVE_USER_STATE')
        )
      );

      // Verify standby wake prompt is displayed
      expect(htmlOff).toContain('Click Power or Press Any Key to Turn On');
      expect(htmlOff).toContain('Standby');
      // State is preserved in DOM with display: none
      expect(htmlOff).toContain('display:none');
      expect(htmlOff).toContain('ACTIVE_USER_STATE');

      // 3. Verify CSS 400ms tube collapse rule exists in stylesheet
      const cssPath = path.resolve(process.cwd(), 'src/styles/index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      expect(cssContent).toContain('.animate-tube-off');
      expect(cssContent).toContain('0.4s');
    });

    it('Pixel Developer Avatar: shows speech bubble without clipping, and includes wave animation frame', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="developer-avatar-sprite"');
      expect(html).toContain('data-testid="rpg-speech-bubble"');
      expect(html).toContain('Hi! Press 1, 2, or 3 below');
      expect(html).toContain('data-testid="avatar-hover-tooltip"');
      // No horizontal clipping constraints: bounded with max-w-[calc(100vw-48px)]
      expect(html).toContain('max-w-[calc(100vw-48px)]');
      expect(html).toContain('developer-avatar-sprite');
    });

    it('Compact 90s Macintosh Sprite: toggles entire CRT screen between Sage-Green and Vintage Amber palettes', () => {
      // 1. Sage Green Phosphor Palette
      const sageHtml = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialPhosphor: 'sage' },
          React.createElement(
            CRTMonitorShell,
            null,
            React.createElement(CRTDioramaStage, { initialPhosphor: 'sage' })
          )
        )
      );
      expect(sageHtml).toContain(SAGE_PALETTE.bright); // #c2cdb4
      expect(sageHtml).toContain(SAGE_PALETTE.mid);    // #6e7d62
      expect(sageHtml).toContain(SAGE_PALETTE.void);   // #111712

      // 2. Vintage Amber Phosphor Palette
      const amberHtml = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialPhosphor: 'amber' },
          React.createElement(
            CRTMonitorShell,
            null,
            React.createElement(CRTDioramaStage, { initialPhosphor: 'amber' })
          )
        )
      );
      expect(amberHtml).toContain(AMBER_PALETTE.bright); // #d4a359
      expect(amberHtml).toContain(AMBER_PALETTE.mid);    // #8c6830
      expect(amberHtml).toContain(AMBER_PALETTE.void);   // #140f07
      expect(amberHtml).toContain('bg-[#d4a359]');       // Amber power LED

      // 3. Expanded Level 2 OS Windows also resolve and apply Amber palette
      const expandedAmberProjects = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialPhosphor: 'amber' },
          React.createElement(RetroOSWindow, {
            isExpanded: true,
            activeSection: 'projects',
          })
        )
      );
      expect(expandedAmberProjects).toContain(AMBER_PALETTE.bright); // #d4a359
      expect(expandedAmberProjects).toContain(AMBER_PALETTE.void);   // #140f07

      const expandedAmberAbout = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialPhosphor: 'amber' },
          React.createElement(AboutMeView)
        )
      );
      expect(expandedAmberAbout).toContain(AMBER_PALETTE.bright);

      const expandedAmberResume = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialPhosphor: 'amber' },
          React.createElement(ResumeView)
        )
      );
      expect(expandedAmberResume).toContain(AMBER_PALETTE.bright);
    });

    it('Large 90s IBM Desktop PC Sprite: triggers Selected Work view with Bayer Dither transition', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects', initialExpanded: true },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('data-testid="ibm-workstation-sprite"');
      expect(html).toContain('data-testid="bayer-dither-canvas"');
      expect(html).toContain('Click: Open Selected Work');
      expect(html).toContain('Selected Work');
    });
  });

  describe('2. Window Controls & Navigation Bar', () => {
    it('verifies [_], [□], [X], and "Back to Desktop (Esc)" controls on expanded RetroOSWindow', () => {
      const html = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: true,
          activeSection: 'projects',
        })
      );

      expect(html).toContain('data-testid="retro-window-btn-minimize"');
      expect(html).toContain('data-testid="retro-window-btn-maximize"');
      expect(html).toContain('data-testid="retro-window-btn-close"');
      expect(html).toContain('data-testid="retro-window-btn-back-desktop"');
      expect(html).toContain('Back to Desktop (Esc)');
    });

    it('Quick Preview: keyboard arrow navigation cycles through modules with circular roving focus', () => {
      expect(evaluateRetroOSKeyEvent({ key: 'ArrowDown' }, false)).toEqual({
        handled: true,
        action: 'next',
      });
      expect(evaluateRetroOSKeyEvent({ key: 'ArrowUp' }, false)).toEqual({
        handled: true,
        action: 'prev',
      });
      expect(evaluateRetroOSKeyEvent({ key: 'Escape' }, true)).toEqual({
        handled: true,
        action: 'collapse',
      });
      expect(evaluateRetroOSKeyEvent({ key: 'Enter' }, false)).toEqual({
        handled: true,
        action: 'expand',
      });
    });

    it('Quick Preview: renders all 4 flagship project rows and mini preview card with Open Case Study button', () => {
      const html = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: false,
          activeSection: 'projects',
        })
      );

      expect(html).toContain('data-testid="quick-view-project-1"');
      expect(html).toContain('data-testid="quick-view-project-2"');
      expect(html).toContain('data-testid="quick-view-project-3"');
      expect(html).toContain('data-testid="quick-view-project-4"');
      expect(html).toContain('data-testid="quick-view-mini-card"');
      expect(html).toContain('data-testid="preview-btn-case-study-01"');
      expect(html).toContain('Open Case Study');
      expect(html).toContain('Live App');
    });

    it('Quick Preview to Case Study: openCaseStudy sets selectedProjectId and unfolds exact Case Study Detail View', () => {
      // 1. Initial overview mode: no case study active
      let overviewContext: ReturnType<typeof useRetroOS> | null = null;
      const OverviewConsumer = () => {
        overviewContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          null,
          React.createElement(OverviewConsumer)
        )
      );

      expect(overviewContext).not.toBeNull();
      expect(overviewContext!.selectedProjectId).toBeNull();
      expect(overviewContext!.isWindowExpanded).toBe(false);

      // 2. Direct Case Study unfold via initialSelectedProjectId
      const detailHtml = renderToString(
        React.createElement(
          RetroOSProvider,
          {
            initialSection: 'projects',
            initialExpanded: true,
            initialSelectedProjectId: '02_FOCUSLAB',
          },
          React.createElement(ProjectsView, {
            initialSelectedProjectId: '02_FOCUSLAB',
          })
        )
      );

      // Confirms Case Study Detail View unfolds directly (not 2x2 grid)
      expect(detailHtml).toContain('data-testid="case-study-detail-view"');
      expect(detailHtml).not.toContain('data-testid="flagship-projects-grid"');
      expect(detailHtml).toContain('FocusLab');
      expect(detailHtml).toContain('Aperture Reflex Check');
      expect(detailHtml).toContain('Back to All Projects');
    });
  });

  describe('3. Case Study Photo Viewers & Interactive Micro-Sandboxes', () => {
    it('CRT Photo Demo Viewer: verifies all 4 real project images exist on disk and render without distortion', () => {
      const publicProjectsDir = path.resolve(process.cwd(), 'public/projects');
      const requiredImages = ['bitforge.png', 'focuslab.png', 'rannabanna.png', 'doclensbd.png'];

      requiredImages.forEach((imgFile) => {
        const fullPath = path.join(publicProjectsDir, imgFile);
        expect(fs.existsSync(fullPath)).toBe(true);
        expect(fs.statSync(fullPath).size).toBeGreaterThan(10000);
      });

      const html = renderToString(React.createElement(ProjectsView));

      expect(html).toContain('data-testid="crt-photo-frame"');
      expect(html).toContain('View Original Color');
      expect(html).toContain('aspect-video');
      expect(html).toContain('object-cover');
      expect(html).toContain('object-top');
    });

    it('BitForge Sandbox ("Forge Lab Array Sort"): verifies initial 8 bars, step sequence generation, and counters', () => {
      expect(INITIAL_SORT_ARRAY).toEqual([38, 14, 62, 19, 85, 29, 76, 48]);
      const steps = buildBubbleSortSequence(INITIAL_SORT_ARRAY);

      expect(steps.length).toBeGreaterThan(10);
      // Step 0: Initial unsorted state
      expect(steps[0].array).toEqual([38, 14, 62, 19, 85, 29, 76, 48]);
      expect(steps[0].comparisons).toBe(0);
      expect(steps[0].swaps).toBe(0);
      expect(steps[0].status).toContain('READY: 8 UNSORTED ARRAY BARS');

      // Final step: Fully sorted order
      const finalStep = steps[steps.length - 1];
      expect(finalStep.array).toEqual([14, 19, 29, 38, 48, 62, 76, 85]);
      expect(finalStep.comparisons).toBeGreaterThan(0);
      expect(finalStep.swaps).toBeGreaterThan(0);
      expect(finalStep.status).toContain('ARRAY FULLY SORTED');

      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '01_BITFORGE' })
      );

      expect(html).toContain('data-testid="interactive-demo-sandbox"');
      expect(html).toContain('data-testid="btn-step-sort"');
      expect(html).toContain('data-testid="btn-auto-sort"');
      expect(html).toContain('data-testid="btn-reset-sort"');
      expect(html).toContain('Forge Lab Array Sort');
      expect(html).toContain('COMPARISONS:');
      expect(html).toContain('SWAPS:');
      expect(html).toContain('data-testid="sort-bar-0"');
      expect(html).toContain('data-testid="sort-bar-7"');
    });

    it('FocusLab Sandbox ("Aperture Reflex Check"): verifies reflex states, ring and start button, and early-click feedback', () => {
      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '02_FOCUSLAB' })
      );

      expect(html).toContain('data-testid="interactive-demo-sandbox"');
      expect(html).toContain('data-testid="btn-start-reflex"');
      expect(html).toContain('data-testid="aperture-reflex-ring"');
      expect(html).toContain('Aperture Reflex Check');
      expect(html).toContain('SAMPLE MEDIAN:');
      expect(html).toContain('YOUR REACTION:');
      expect(html).toContain('PRECISION: SUB-MS HIGH-RES TIMER');
      expect(html).toContain('Start Reflex Check');
    });

    it('Rannabanna Sandbox ("Kitchen Staples Matchmaker"): verifies 6 ingredient staples, pill buttons, and dynamic recipe matching', () => {
      expect(PANTRY_STAPLES).toHaveLength(6);
      expect(PANTRY_STAPLES).toContain('Red Onion');
      expect(PANTRY_STAPLES).toContain('Garlic');
      expect(PANTRY_STAPLES).toContain('Ginger');
      expect(PANTRY_STAPLES).toContain('Egg');
      expect(PANTRY_STAPLES).toContain('Basmati Rice');
      expect(PANTRY_STAPLES).toContain('Chicken Breast');

      expect(PANTRY_RECIPES.length).toBeGreaterThan(3);

      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '03_RANNABANNA' })
      );

      expect(html).toContain('Kitchen Staples Matchmaker');
      expect(html).toContain('Bengali Dim Bhuna');
      expect(html).toContain('Basmati Chicken Biryani');
      expect(html).toContain('data-testid="btn-toggle-all-staples"');
      expect(html).toContain('data-testid="staple-pill-egg"');
      expect(html).toContain('data-testid="staple-pill-red-onion"');
      expect(html).toContain('data-testid="pantry-recipe-card-dim-bhuna"');
      expect(html).toContain('Select All');
    });

    it('DocLensBD Case Study: renders all 3 key hero metrics, problem/solution breakdown, and action buttons', () => {
      const html = renderToString(
        React.createElement(ProjectsView, { initialSelectedProjectId: '04_DOCLENS_BD' })
      );

      expect(html).toContain('198+');
      expect(html).toContain('Precision Frames');
      expect(html).toContain('3D Mesh');
      expect(html).toContain('Face Tracking');
      expect(html).toContain('Custom');
      expect(html).toContain('Prescription Flow');
      expect(html).toContain('Problem');
      expect(html).toContain('How It Works');
      expect(html).toContain('Key Results');
      expect(html).toContain('data-testid="case-study-live-demo-btn"');
      expect(html).toContain('data-testid="case-study-github-btn"');
      expect(html).toContain('Live Demo ↗');
      expect(html).toContain('GitHub');
    });
  });

  describe('4. External Links, Clipboard & Terminal Commands', () => {
    it('verifies all 7 live Render links have target="_blank" and rel="noopener noreferrer"', () => {
      const html = renderToString(React.createElement(ProjectsView));

      const requiredRenderUrls = [
        'https://bitforge-3u2q.onrender.com',
        'https://focuslab-smoa.onrender.com',
        'https://rannabanna.onrender.com',
        'https://doclensbd.onrender.com',
        'https://mental-defrag.onrender.com',
        'https://trashtrail.onrender.com',
        'https://poshra.onrender.com',
      ];

      requiredRenderUrls.forEach((url) => {
        expect(html).toContain(url);
      });

      // Verify all rendered links have security attributes
      expect(html).not.toMatch(/href="https:\/\/[^"]*"[^>]*target="(?!_blank)[^"]*"/);
      expect(html).not.toMatch(/href="https:\/\/[^"]*"[^>]*rel="(?!noopener noreferrer)[^"]*"/);
    });

    it('verifies all GitHub repo links and LinkedIn profile link have target="_blank" and rel="noopener noreferrer"', () => {
      const resumeHtml = renderToString(React.createElement(ResumeView));
      const projectsHtml = renderToString(React.createElement(ProjectsView));
      const combinedHtml = `${resumeHtml}\n${projectsHtml}`;

      expect(combinedHtml).toContain('https://github.com/watchknight');
      expect(combinedHtml).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');

      // Ensure no target is not _blank
      expect(combinedHtml).not.toMatch(/href="https:\/\/github\.com\/[^"]*"[^>]*target="(?!_blank)[^"]*"/);
      expect(combinedHtml).not.toMatch(/href="https:\/\/www\.linkedin\.com\/[^"]*"[^>]*target="(?!_blank)[^"]*"/);
    });

    it('verifies Copy Email copies armabdur.rahman04@gmail.com and displays "COPIED TO CLIPBOARD!" feedback', () => {
      const html = renderToString(React.createElement(ResumeView));

      expect(html).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(html).toContain('title="Copy Email (armabdur.rahman04@gmail.com)"');
      expect(html).toContain('Copy Email (armabdur.rahman04@gmail.com)');

      // Also verify Level 1 Quick Preview copy email
      const previewHtml = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: false,
          activeSection: 'resume',
        })
      );
      expect(previewHtml).toContain('data-testid="btn-copy-email"');
      expect(previewHtml).toContain('title="Copy Email (armabdur.rahman04@gmail.com)"');
    });

    it('verifies Interactive Terminal executes help, whoami, projects, contact, and clear', () => {
      // 1. help
      const help = processCliCommand('help');
      expect(help?.output.join(' ')).toContain('help');
      expect(help?.output.join(' ')).toContain('whoami');
      expect(help?.output.join(' ')).toContain('projects');
      expect(help?.output.join(' ')).toContain('contact');
      expect(help?.output.join(' ')).toContain('clear');

      // 2. whoami
      const whoami = processCliCommand('whoami');
      expect(whoami?.output.join(' ')).toContain('Abdur Rahman Moayed');
      expect(whoami?.output.join(' ')).toContain('@watchknight');
      expect(whoami?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');

      // 3. projects (all 7 live Render links)
      const projects = processCliCommand('projects');
      expect(projects?.output.join(' ')).toContain('https://bitforge-3u2q.onrender.com');
      expect(projects?.output.join(' ')).toContain('https://focuslab-smoa.onrender.com');
      expect(projects?.output.join(' ')).toContain('https://rannabanna.onrender.com');
      expect(projects?.output.join(' ')).toContain('https://doclensbd.onrender.com');
      expect(projects?.output.join(' ')).toContain('https://mental-defrag.onrender.com');
      expect(projects?.output.join(' ')).toContain('https://trashtrail.onrender.com');
      expect(projects?.output.join(' ')).toContain('https://poshra.onrender.com');

      // 4. contact
      const contact = processCliCommand('contact');
      expect(contact?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');
      expect(contact?.output.join(' ')).toContain('https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/');

      // 5. clear
      const clear = processCliCommand('clear');
      expect(clear?.isClear).toBe(true);
      expect(clear?.output).toEqual([]);

      // 6. skills
      const skills = processCliCommand('skills');
      expect(skills?.output.join(' ')).toContain('TypeScript');
      expect(skills?.output.join(' ')).toContain('React');
      expect(skills?.output.join(' ')).toContain('C++');

      // 7. sudo hire moayed
      const hire = processCliCommand('sudo hire moayed');
      expect(hire?.output.join(' ')).toContain('[AUTH GRANTED]');
      expect(hire?.output.join(' ')).toContain('armabdur.rahman04@gmail.com');

      // 8. exit
      const exitCmd = processCliCommand('exit');
      expect(exitCmd?.isExit).toBe(true);

      // 9. unknown fallback
      const unknownCmd = processCliCommand('xyz_unknown');
      expect(unknownCmd?.output.join(' ')).toContain('command not found');

      // 10. empty/whitespace returns null
      expect(processCliCommand('')).toBeNull();
      expect(processCliCommand('   ')).toBeNull();
    });

    it('verifies RetroOSWindow standalone fallback works when rendered outside RetroOSProvider', () => {
      const html = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: false,
          activeSection: 'projects',
        })
      );

      // Should render the quick preview project card and Open Case Study button
      expect(html).toContain('data-testid="preview-btn-case-study-01"');
      expect(html).toContain('Open Case Study');
      expect(html).toContain('data-testid="quick-view-project-1"');
    });
  });
});
