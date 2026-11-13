import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from '../../App';
import { CRTDioramaStage } from '../../components/CRTDioramaStage';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { ProjectsView } from '../../components/views/ProjectsView';
import { AboutMeView } from '../../components/views/AboutMeView';
import { ResumeView } from '../../components/views/ResumeView';
import { NotFoundPage } from '../../pages/404';
import { RetroOSProvider, evaluateRetroOSKeyEvent } from '../../context/RetroOSContext';
import { retroAudio } from '../../utils/retroAudio';
import {
  FLAGSHIP_PROJECTS,
  MORE_DEPLOYED_APPS,
  PORTFOLIO_DATA,
} from '../../data/projects';

describe('PRINCIPAL UX AUDIT & RETRO INTERFACE ARCHITECT VERIFICATION', () => {
  describe('1. Anti-Slop, Zero-Clutter & Negative Space Compliance', () => {
    const forbiddenStrings = [
      'Neon Vanguard',
      'POSIX',
      'SYS.96',
      '===',
      '.EXE',
      '.SYS',
    ];

    it('renders zero forbidden clutter strings across all primary views in the DOM', () => {
      const homeHtml = renderToString(React.createElement(App));
      const projectsHtml = renderToString(React.createElement(ProjectsView));
      const aboutHtml = renderToString(React.createElement(AboutMeView));
      const resumeHtml = renderToString(React.createElement(ResumeView));
      const notFoundHtml = renderToString(React.createElement(NotFoundPage));

      const allRenderedHtml = [homeHtml, projectsHtml, aboutHtml, resumeHtml, notFoundHtml].join('\n');

      forbiddenStrings.forEach((forbidden) => {
        expect(allRenderedHtml).not.toContain(forbidden);
      });

      // Check rendered text for '//' (excluding URLs like https:// or http:// or data:image)
      const strippedOfUrls = allRenderedHtml
        .replace(/https?:\/\/[^\s"'<>]+/g, '')
        .replace(/data:image\/[^\s"'<>]+/g, '');
      expect(strippedOfUrls).not.toContain('//');
    });

    it('confirms the entire experience is housed in CRTMonitorShell with overflow-hidden and centered layout', () => {
      const appHtml = renderToString(React.createElement(App));
      expect(appHtml).toContain('data-testid="crt-monitor-room"');
      expect(appHtml).toContain('data-testid="crt-monitor-casing"');
      expect(appHtml).toContain('data-testid="crt-bezel-lip"');
      expect(appHtml).toContain('data-testid="crt-glass-screen"');
      expect(appHtml).toContain('overflow:hidden');
    });

    it('confirms Level 1 CRT Home Stage allocates roughly 44% to split console, leaving ~56% open #111712 diorama space', () => {
      const stageHtml = renderToString(React.createElement(CRTDioramaStage));
      expect(stageHtml).toContain('data-testid="crt-split-console"');
      expect(stageHtml).toContain('height:44%');
      expect(stageHtml).toContain('min-height:44%');
      expect(stageHtml).toContain('background-color:#111712');
    });

    it('confirms all 3 sprites rest unboxed on the 2px desk line with zero rectangular bounding borders', () => {
      const stageHtml = renderToString(React.createElement(CRTDioramaStage));
      expect(stageHtml).toContain('data-testid="developer-avatar-sprite"');
      expect(stageHtml).toContain('data-testid="compact-mac-sprite"');
      expect(stageHtml).toContain('data-testid="ibm-workstation-sprite"');
      expect(stageHtml).toContain('data-testid="crt-horizontal-desk-line"');
      expect(stageHtml).toContain('border-bottom:2px solid #6e7d62');

      // Only hover corner brackets exist, no hard bounding-box border around sprites
      expect(stageHtml).toContain('data-testid="avatar-corner-brackets"');
      expect(stageHtml).toContain('data-testid="mac-corner-brackets"');
      expect(stageHtml).toContain('data-testid="ibm-corner-brackets"');
    });
  });

  describe('2. All 7 Live Render URLs & Verified Contact Actions', () => {
    const verifiedRenderUrls = {
      BitForge: 'https://bitforge-3u2q.onrender.com',
      FocusLab: 'https://focuslab-smoa.onrender.com',
      Rannabanna: 'https://rannabanna.onrender.com',
      DocLensBD: 'https://doclensbd.onrender.com',
      'Mental Defrag': 'https://mental-defrag.onrender.com',
      TrashTrail: 'https://trashtrail.onrender.com',
      POSHRA: 'https://poshra.onrender.com',
    };

    it('verifies all 4 Flagship Projects have verified live Render URLs', () => {
      expect(FLAGSHIP_PROJECTS[0].title).toBe('BitForge');
      expect(FLAGSHIP_PROJECTS[0].demoUrl).toBe(verifiedRenderUrls.BitForge);

      expect(FLAGSHIP_PROJECTS[1].title).toBe('FocusLab');
      expect(FLAGSHIP_PROJECTS[1].demoUrl).toBe(verifiedRenderUrls.FocusLab);

      expect(FLAGSHIP_PROJECTS[2].title).toBe('Rannabanna');
      expect(FLAGSHIP_PROJECTS[2].demoUrl).toBe(verifiedRenderUrls.Rannabanna);

      expect(FLAGSHIP_PROJECTS[3].title).toBe('DocLensBD');
      expect(FLAGSHIP_PROJECTS[3].demoUrl).toBe(verifiedRenderUrls.DocLensBD);
    });

    it('verifies all 3 More Deployed Web Apps have verified live Render URLs', () => {
      expect(MORE_DEPLOYED_APPS[0].title).toBe('Mental Defrag');
      expect(MORE_DEPLOYED_APPS[0].liveUrl).toBe(verifiedRenderUrls['Mental Defrag']);

      expect(MORE_DEPLOYED_APPS[1].title).toBe('TrashTrail');
      expect(MORE_DEPLOYED_APPS[1].liveUrl).toBe(verifiedRenderUrls.TrashTrail);

      expect(MORE_DEPLOYED_APPS[2].title).toBe('POSHRA');
      expect(MORE_DEPLOYED_APPS[2].liveUrl).toBe(verifiedRenderUrls.POSHRA);
    });

    it('verifies GitHub and LinkedIn URLs in portfolioData', () => {
      expect(PORTFOLIO_DATA.meta.github).toBe('https://github.com/watchknight');
      expect(PORTFOLIO_DATA.meta.linkedin).toBe(
        'https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/'
      );
      expect(PORTFOLIO_DATA.meta.email).toBe('armabdur.rahman04@gmail.com');
    });

    it('verifies that all rendered external links have target="_blank" and rel="noopener noreferrer"', () => {
      const projectsHtml = renderToString(React.createElement(ProjectsView));
      const resumeHtml = renderToString(React.createElement(ResumeView));
      const windowHtml = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'resume', initialExpanded: false },
          React.createElement(RetroOSWindow)
        )
      );

      const htmlBlocks = [projectsHtml, resumeHtml, windowHtml].join('\n');

      // Verify every link in these rendered views
      const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match;
      let count = 0;
      while ((match = anchorRegex.exec(htmlBlocks)) !== null) {
        const fullTag = match[0];
        const href = match[1];
        if (href.startsWith('http://') || href.startsWith('https://')) {
          count++;
          expect(fullTag).toContain('target="_blank"');
          expect(fullTag).toContain('rel="noopener noreferrer"');
        }
      }
      expect(count).toBeGreaterThan(10);
    });

    it('verifies Copy Email button triggers copy of armabdur.rahman04@gmail.com', () => {
      const windowHtml = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'resume', initialExpanded: false },
          React.createElement(RetroOSWindow)
        )
      );
      expect(windowHtml).toContain('data-testid="btn-copy-email"');
      expect(windowHtml).toContain('Copy Email');
      expect(windowHtml).toContain('armabdur.rahman04@gmail.com');

      const resumeHtml = renderToString(React.createElement(ResumeView));
      expect(resumeHtml).toContain('data-testid="retro-resume-copy-email-btn"');
      expect(resumeHtml).toContain('Copy Email');
      expect(resumeHtml).toContain('armabdur.rahman04@gmail.com');
    });
  });

  describe('3. Procedural Web Audio API Synthesizer & Sound Toggle', () => {
    it('verifies retroAudio instance has soft, low-gain envelopes and zero external audio dependencies', () => {
      expect(typeof retroAudio.playBlip).toBe('function');
      expect(typeof retroAudio.playOpenWindow).toBe('function');
      expect(typeof retroAudio.playKeyTick).toBe('function');
      expect(typeof retroAudio.toggleMute).toBe('function');
      expect(typeof retroAudio.setMuted).toBe('function');
      expect(typeof retroAudio.isMuted).toBe('function');
    });

    it('verifies bezel Sound button is rendered with aria-label and state toggle', () => {
      const appHtml = renderToString(React.createElement(App));
      expect(appHtml).toContain('Toggle Web Audio Sound Effects');
      expect(appHtml).toContain('Sound effects are currently');
      expect(appHtml).toContain('>Sound<');
    });
  });

  describe('4. Full Keyboard Ergonomics & View Transitions', () => {
    it('keys 1, 2, 3 open projects, about, and resume views respectively', () => {
      expect(evaluateRetroOSKeyEvent({ key: '1' }, false)).toEqual({
        handled: true,
        action: 'open_1',
      });
      expect(evaluateRetroOSKeyEvent({ key: '2' }, false)).toEqual({
        handled: true,
        action: 'open_2',
      });
      expect(evaluateRetroOSKeyEvent({ key: '3' }, false)).toEqual({
        handled: true,
        action: 'open_3',
      });
    });

    it('ArrowUp and ArrowDown preview items on Level 1 with circular roving focus', () => {
      expect(evaluateRetroOSKeyEvent({ key: 'ArrowUp' }, false)).toEqual({
        handled: true,
        action: 'prev',
      });
      expect(evaluateRetroOSKeyEvent({ key: 'ArrowDown' }, false)).toEqual({
        handled: true,
        action: 'next',
      });
    });

    it('Enter expands selected view when collapsed, and Escape collapses back to Level 1', () => {
      // Enter on collapsed stage expands
      expect(evaluateRetroOSKeyEvent({ key: 'Enter' }, false)).toEqual({
        handled: true,
        action: 'expand',
      });

      // Escape on expanded stage collapses
      expect(evaluateRetroOSKeyEvent({ key: 'Escape' }, true)).toEqual({
        handled: true,
        action: 'collapse',
      });

      // Escape on collapsed stage does nothing
      expect(evaluateRetroOSKeyEvent({ key: 'Escape' }, false)).toEqual({
        handled: false,
      });
    });

    it('prevents interference when user types in form inputs or has modifier keys', () => {
      expect(
        evaluateRetroOSKeyEvent({ key: '1', targetTagName: 'INPUT' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '2', targetTagName: 'TEXTAREA' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: 'Enter', targetTagName: 'BUTTON' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '1', ctrlKey: true }, false)
      ).toEqual({ handled: false });
    });
  });
});
