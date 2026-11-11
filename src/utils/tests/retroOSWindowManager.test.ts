import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  RetroOSProvider,
  useRetroOS,
  RETRO_SECTIONS,
  SECTION_METADATA,
  evaluateRetroOSKeyEvent,
} from '../../context/RetroOSContext';
import { RetroCommandMenu } from '../../components/RetroCommandMenu';
import { RetroOSWindow } from '../../components/RetroOSWindow';
import { CRTDioramaStage, AMBER_PALETTE } from '../../components/CRTDioramaStage';

describe('Retro 90s OS Window Manager & Split-Console Verification', () => {
  describe('1. Global Retro OS State & Metadata (RetroOSContext.tsx)', () => {
    it('initializes default state with activeSection=about, activeIndex=0, isWindowExpanded=false, soundEnabled=true', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      const TestConsumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          null,
          React.createElement(TestConsumer)
        )
      );

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.activeSection).toBe('about');
      expect(capturedContext!.activeIndex).toBe(0);
      expect(capturedContext!.isWindowExpanded).toBe(false);
      expect(capturedContext!.soundEnabled).toBe(true);
      expect(capturedContext!.isInsideProvider).toBe(true);
    });

    it('maps index 0 to ABOUT ME, 1 to MY PROJECTS, and 2 to RESUME with corresponding directory paths', () => {
      expect(RETRO_SECTIONS).toEqual(['about', 'projects', 'resume']);

      expect(SECTION_METADATA.about.index).toBe(0);
      expect(SECTION_METADATA.about.command).toBe('2. About');
      expect(SECTION_METADATA.about.fileName).toBe('About');

      expect(SECTION_METADATA.projects.index).toBe(1);
      expect(SECTION_METADATA.projects.command).toBe('1. Work');
      expect(SECTION_METADATA.projects.fileName).toBe('Selected Work');

      expect(SECTION_METADATA.resume.index).toBe(2);
      expect(SECTION_METADATA.resume.command).toBe('3. Resume');
      expect(SECTION_METADATA.resume.fileName).toBe('Resume & Contact');
    });

    it('supports custom initialSection and initialExpanded props in RetroOSProvider', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      const TestConsumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects', initialExpanded: true },
          React.createElement(TestConsumer)
        )
      );

      expect(capturedContext!.activeSection).toBe('projects');
      expect(capturedContext!.activeIndex).toBe(1);
      expect(capturedContext!.isWindowExpanded).toBe(true);
    });
  });

  describe('2. Bottom-Left Numbered Command Menu (RetroCommandMenu.tsx)', () => {
    it('renders all three primary navigation commands in bold #c2cdb4 pixel typography', () => {
      const html = renderToString(React.createElement(RetroCommandMenu));

      expect(html).toContain('data-testid="retro-command-menu"');
      expect(html).toContain('1. Work');
      expect(html).toContain('2. About');
      expect(html).toContain('3. Resume');
      expect(html).toContain('font-pixel');
    });

    it('styles the currently focused/active item with an inverted phosphor selection bar and leading > arrow', () => {
      const htmlAboutActive = renderToString(
        React.createElement(RetroCommandMenu, { activeIndex: 0 })
      );

      // Active item [1] ABOUT ME has background-color: #c2cdb4 and color: #111712
      expect(htmlAboutActive).toContain('data-testid="retro-command-item-about"');
      expect(htmlAboutActive).toContain('background-color:#c2cdb4');
      expect(htmlAboutActive).toContain('color:#111712');

      // Leading indicator visible on active item
      expect(htmlAboutActive).toContain('data-testid="retro-command-indicator-about"');
      expect(htmlAboutActive).toContain('•');

      // Inactive items have transparent background and #c2cdb4 text
      expect(htmlAboutActive).toContain('data-testid="retro-command-item-projects"');
      expect(htmlAboutActive).toContain('background-color:transparent');
      expect(htmlAboutActive).toContain('color:#c2cdb4');
    });

    it('switches inverted phosphor bar when activeIndex is changed to 1 or 2', () => {
      const htmlProjectsActive = renderToString(
        React.createElement(RetroCommandMenu, { activeIndex: 1 })
      );

      // Projects is active
      expect(htmlProjectsActive).toContain('data-testid="retro-command-item-projects"');
      expect(htmlProjectsActive).toContain('Active');

      const htmlResumeActive = renderToString(
        React.createElement(RetroCommandMenu, { activeIndex: 2 })
      );

      // Resume is active
      expect(htmlResumeActive).toContain('data-testid="retro-command-item-resume"');
      expect(htmlResumeActive).toContain('Active');
    });

    it('adapts color tokens when custom palette is provided (Amber mode)', () => {
      const htmlAmber = renderToString(
        React.createElement(RetroCommandMenu, {
          palette: AMBER_PALETTE,
          activeIndex: 0,
        })
      );

      expect(htmlAmber).toContain(AMBER_PALETTE.bright);
      expect(htmlAmber).toContain(AMBER_PALETTE.void);
    });
  });

  describe('3. Bottom-Right 90s OS Scrollable Window (RetroOSWindow.tsx)', () => {
    it('renders crisp 2px #c2cdb4 and #6e7d62 pixel borders', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-os-window"');
      expect(html).toContain('border:2px solid #6e7d62');
      expect(html).toContain('outline:2px solid #c2cdb4');
    });

    it('renders solid #c2cdb4 title bar with dark #111712 pixel text Preview', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-window-titlebar"');
      expect(html).toContain('background-color:#c2cdb4');
      expect(html).toContain('color:#111712');
      expect(html).toContain('Preview');
      expect(html).toContain('data-testid="retro-window-title-text"');
    });

    it('provides three clickable pixel-art window controls: Minimize [_], Maximize [□], and Close [X]', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-window-btn-minimize"');
      expect(html).toContain('_');

      expect(html).toContain('data-testid="retro-window-btn-maximize"');
      expect(html).toContain('□');

      expect(html).toContain('data-testid="retro-window-btn-close"');
      expect(html).toContain('X');
    });

    it('builds authentic retro pixel vertical scrollbar with top [▲], bottom [▼], patterned track and thumb block', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-pixel-scrollbar"');
      expect(html).toContain('data-testid="retro-scrollbar-btn-up"');
      expect(html).toContain('▲');

      expect(html).toContain('data-testid="retro-scrollbar-btn-down"');
      expect(html).toContain('▼');

      expect(html).toContain('data-testid="retro-scrollbar-track"');
      expect(html).toContain('retro-scrollbar-track-pattern');

      expect(html).toContain('data-testid="retro-scrollbar-thumb"');
    });

    it('Overview Mode: compactly mirrors selectable directory and displays highlighted item summary', () => {
      const htmlOverview = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'about' })
      );

      expect(htmlOverview).toContain('data-testid="retro-window-overview-mode"');
      expect(htmlOverview).toContain('2. About');
      expect(htmlOverview).toContain('1. Work');
      expect(htmlOverview).toContain('3. Resume');
      expect(htmlOverview).toContain('East West University • CSE');
      expect(htmlOverview).toContain('Press Enter to expand');
    });

    it('Expanded Mode: renders stepped CSS wipe-up transition and full section content with persistent command bars', () => {
      const htmlExpandedAbout = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      // Stepped clip-path wipe animation
      expect(htmlExpandedAbout).toContain('retro-window-expanded-wipe');
      expect(htmlExpandedAbout).toContain('@keyframes retroWindowWipeUp');
      expect(htmlExpandedAbout).toContain('steps(6, end)');

      // Persistent top navigation tabs
      expect(htmlExpandedAbout).toContain('data-testid="retro-window-persistent-nav"');
      expect(htmlExpandedAbout).toContain('data-testid="retro-window-tab-about"');
      expect(htmlExpandedAbout).toContain('data-testid="retro-window-tab-projects"');
      expect(htmlExpandedAbout).toContain('data-testid="retro-window-tab-resume"');

      // Full content for About
      expect(htmlExpandedAbout).toContain('data-testid="retro-content-about"');
      expect(htmlExpandedAbout).toContain('ABDUR RAHMAN MOAYED');
      expect(htmlExpandedAbout).toContain('@watchknight');
      expect(htmlExpandedAbout).toContain('East West University, Dhaka');
      expect(htmlExpandedAbout).toContain('23°N, 90°E');

      // Persistent bottom command bar
      expect(htmlExpandedAbout).toContain('data-testid="retro-window-persistent-footer"');
      expect(htmlExpandedAbout).toContain('data-testid="retro-window-footer-close"');
      expect(htmlExpandedAbout).toContain('Esc to close');
    });

    it('Expanded Mode: displays project systems and technical stack for [2] MY PROJECTS', () => {
      const htmlExpandedProjects = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlExpandedProjects).toContain('data-testid="retro-content-projects"');
      expect(htmlExpandedProjects).toContain('Mental Defrag');
      expect(htmlExpandedProjects).toContain('FocusGuard');
      expect(htmlExpandedProjects).toContain('Neon Vanguard &amp; POSIX');
      expect(htmlExpandedProjects).toContain('DocLensBD');
    });

    it('Expanded Mode: displays academic credentials and verified PDF export link for [3] RESUME', () => {
      const htmlExpandedResume = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'resume' })
      );

      expect(htmlExpandedResume).toContain('data-testid="retro-content-resume"');
      expect(htmlExpandedResume).toContain('B.Sc. in Computer Science &amp; Engineering');
      expect(htmlExpandedResume).toContain('data-testid="retro-resume-download-btn"');
      expect(htmlExpandedResume).toContain('href="/resume.pdf"');
      expect(htmlExpandedResume).toContain('Download Resume (PDF)');
    });
  });

  describe('3b. WCAG 2.1 AAA Accessibility: Screen Reader Live Region (aria-live="polite")', () => {
    it('renders aria-live="polite" screen reader region with role="status", aria-atomic="true", and sr-only', () => {
      const html = renderToString(React.createElement(RetroOSWindow));

      expect(html).toContain('data-testid="retro-window-aria-live"');
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-atomic="true"');
      expect(html).toContain('sr-only');
    });

    it('announces [1] ABOUT ME view opened and tagline when opened in expanded mode', () => {
      const htmlAbout = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlAbout).toContain('data-testid="retro-window-aria-live"');
      expect(htmlAbout).toContain('2. About view opened. Systems architecture, low-level graphics &amp; procedural audio');
    });

    it('announces [2] MY PROJECTS view opened and tagline when opened in expanded mode', () => {
      const htmlProjects = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'projects' })
      );

      expect(htmlProjects).toContain('data-testid="retro-window-aria-live"');
      expect(htmlProjects).toContain('1. Work view opened. HyperDeck 3D, Sentinel HUD, Audio Synth &amp; Extension Studio');
    });

    it('announces [3] RESUME view opened and tagline when opened in expanded mode', () => {
      const htmlResume = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'resume' })
      );

      expect(htmlResume).toContain('data-testid="retro-window-aria-live"');
      expect(htmlResume).toContain('3. Resume view opened. Technical curriculum vitae &amp; verified PDF export');
    });

    it('announces directory overview selection when window is in overview mode', () => {
      const htmlOverviewAbout = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'about' })
      );
      expect(htmlOverviewAbout).toContain('2. About selected in overview.');

      const htmlOverviewProjects = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'projects' })
      );
      expect(htmlOverviewProjects).toContain('1. Work selected in overview.');

      const htmlOverviewResume = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'resume' })
      );
      expect(htmlOverviewResume).toContain('3. Resume selected in overview.');
    });

    it('announces window closed when isClosed is true', () => {
      const htmlClosed = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: false,
          isClosed: true,
          activeSection: 'about',
        })
      );

      expect(htmlClosed).toContain('data-testid="retro-window-aria-live"');
      expect(htmlClosed).toContain('Window closed. 2. About selected in overview.');
    });

    it('supports custom accessible announcement override via announcement prop', () => {
      const htmlCustom = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: false,
          announcement: 'SYSTEM ALERT: All 4 CRT monitors online.',
        })
      );

      expect(htmlCustom).toContain('data-testid="retro-window-aria-live"');
      expect(htmlCustom).toContain('SYSTEM ALERT: All 4 CRT monitors online.');
    });

    it('initializes default wasWindowClosed state and supports initialClosed prop in RetroOSProvider', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      const TestConsumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          { initialExpanded: false, initialClosed: true },
          React.createElement(TestConsumer)
        )
      );

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.isWindowExpanded).toBe(false);
      expect(capturedContext!.wasWindowClosed).toBe(true);
      expect(() => capturedContext!.collapseWindow()).not.toThrow();
      expect(() => capturedContext!.openIndex(1)).not.toThrow();
      expect(() => capturedContext!.selectNext()).not.toThrow();
      expect(() => capturedContext!.selectPrev()).not.toThrow();
    });

    it('full diorama integration: announces section when opened inside CRTDioramaStage', () => {
      const htmlExpandedDiorama = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialExpanded: true, initialSection: 'projects' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(htmlExpandedDiorama).toContain('data-testid="retro-window-aria-live"');
      expect(htmlExpandedDiorama).toContain('role="status"');
      expect(htmlExpandedDiorama).toContain('aria-live="polite"');
      expect(htmlExpandedDiorama).toContain('1. Work view opened.');
    });

    it('full diorama integration: announces window closed when initialClosed is true inside CRTDioramaStage', () => {
      const htmlClosedDiorama = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialExpanded: false, initialClosed: true, initialSection: 'about' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(htmlClosedDiorama).toContain('data-testid="retro-window-aria-live"');
      expect(htmlClosedDiorama).toContain('Window closed. 2. About selected in overview.');
    });
  });

  describe('4. Full Integration Below Horizontal Desk Line in CRTDioramaStage', () => {
    it('renders split-console directly below horizontal desk line with RetroCommandMenu and RetroOSWindow', () => {
      const htmlStage = renderToString(React.createElement(CRTDioramaStage));

      // Horizontal desk line is present
      expect(htmlStage).toContain('data-testid="crt-horizontal-desk-line"');
      expect(htmlStage).toContain('height:2px');
      expect(htmlStage).toContain('background-color:#6e7d62');

      // Split console container directly below
      expect(htmlStage).toContain('data-testid="crt-split-console"');

      // Bottom-Left Command Menu
      expect(htmlStage).toContain('data-testid="retro-command-menu"');
      expect(htmlStage).toContain('1. Work');
      expect(htmlStage).toContain('2. About');
      expect(htmlStage).toContain('3. Resume');

      // Bottom-Right 90s OS Window in Overview Mode
      expect(htmlStage).toContain('data-testid="retro-os-window"');
      expect(htmlStage).toContain('data-testid="retro-window-overview-mode"');
      expect(htmlStage).toContain('Preview');
    });

    it('enforces GEMINI.md design rules: zero banned legacy colors in Retro OS components', () => {
      const htmlStage = renderToString(React.createElement(CRTDioramaStage));

      expect(htmlStage.toLowerCase()).not.toContain('#d9532f');
      expect(htmlStage.toLowerCase()).not.toContain('#a74024');
      expect(htmlStage.toLowerCase()).not.toContain('#ff4d1c');
      expect(htmlStage.toLowerCase()).not.toContain('#4e9a7f');
    });
  });

  describe('5. Edge Cases, Boundary Values & Fallback States', () => {
    it('gracefully handles missing context outside RetroOSProvider without throwing errors', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      const StandaloneConsumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      // Rendering outside provider should return default safe context
      expect(() => {
        renderToString(React.createElement(StandaloneConsumer));
      }).not.toThrow();

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.activeSection).toBe('about');
      expect(capturedContext!.activeIndex).toBe(0);
      expect(capturedContext!.isWindowExpanded).toBe(false);
      expect(capturedContext!.soundEnabled).toBe(true);
      expect(capturedContext!.isInsideProvider).toBe(false);

      // Verify no-op handlers do not throw
      expect(() => capturedContext!.setActiveSection('projects')).not.toThrow();
      expect(() => capturedContext!.setActiveIndex(1)).not.toThrow();
      expect(() => capturedContext!.toggleExpand()).not.toThrow();
      expect(() => capturedContext!.expandWindow()).not.toThrow();
      expect(() => capturedContext!.collapseWindow()).not.toThrow();
      expect(() => capturedContext!.selectNext()).not.toThrow();
      expect(() => capturedContext!.selectPrev()).not.toThrow();
    });

    it('clamps or guards out-of-bound indices gracefully in SECTION_METADATA', () => {
      expect(SECTION_METADATA['about'].index).toBe(0);
      expect(SECTION_METADATA['projects'].index).toBe(1);
      expect(SECTION_METADATA['resume'].index).toBe(2);

      // Verify each section metadata has non-empty command, fileName, and tagline
      RETRO_SECTIONS.forEach((sec) => {
        const meta = SECTION_METADATA[sec];
        expect(meta.command).toMatch(/^[1-3]\./);
        expect(meta.fileName.length).toBeGreaterThan(0);
        expect(meta.status.length).toBeGreaterThan(0);
        expect(meta.tagline.length).toBeGreaterThan(0);
      });
    });

    it('correctly respects soundEnabled=false by muting without throwing', () => {
      let capturedContext: ReturnType<typeof useRetroOS> | null = null;
      const TestConsumer = () => {
        capturedContext = useRetroOS();
        return null;
      };

      renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSoundEnabled: false },
          React.createElement(TestConsumer)
        )
      );

      expect(capturedContext!.soundEnabled).toBe(false);
    });

    it('renders RetroCommandMenu cleanly with empty or partial props', () => {
      const html = renderToString(
        React.createElement(RetroCommandMenu, {
          palette: {},
          activeIndex: 0,
        })
      );

      expect(html).toContain('data-testid="retro-command-menu"');
      expect(html).toContain('2. About');
    });

    it('renders RetroOSWindow cleanly with explicit onClose and onToggleExpand callbacks', () => {
      const onCloseMock = vi.fn();
      const onToggleExpandMock = vi.fn();

      const html = renderToString(
        React.createElement(RetroOSWindow, {
          isExpanded: false,
          onClose: onCloseMock,
          onToggleExpand: onToggleExpandMock,
        })
      );

      expect(html).toContain('data-testid="retro-os-window"');
      expect(html).toContain('data-testid="retro-window-btn-minimize"');
      expect(html).toContain('data-testid="retro-window-btn-maximize"');
      expect(html).toContain('data-testid="retro-window-btn-close"');
    });

    it('provides accessible interactive directory buttons in overview mode', () => {
      const htmlOverview = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: false, activeSection: 'about' })
      );

      expect(htmlOverview).toContain('data-testid="retro-overview-row-about"');
      expect(htmlOverview).toContain('data-testid="retro-overview-row-projects"');
      expect(htmlOverview).toContain('data-testid="retro-overview-row-resume"');
      expect(htmlOverview).toContain('role="menuitem"');
    });

    it('enforces prefers-reduced-motion fallback for stepped clip-path wipe animation', () => {
      const htmlExpanded = renderToString(
        React.createElement(RetroOSWindow, { isExpanded: true, activeSection: 'about' })
      );

      expect(htmlExpanded).toContain('@media (prefers-reduced-motion: reduce)');
      expect(htmlExpanded).toContain('animation: none !important');
      expect(htmlExpanded).toContain('clip-path: none !important');
    });

    it('guarantees strictly ONE RetroOSWindow instance rendered in CRTDioramaStage when expanded', () => {
      const htmlExpandedStage = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialExpanded: true },
          React.createElement(CRTDioramaStage)
        )
      );

      const matches = htmlExpandedStage.match(/data-testid="retro-os-window"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(1);

      // Verify the expanded mode view is active
      expect(htmlExpandedStage).toContain('data-testid="retro-window-expanded-mode"');
      expect(htmlExpandedStage).toContain('Back to Desktop');
    });
  });

  describe('6. Roving Keyboard Navigation & Global Event Logic (evaluateRetroOSKeyEvent)', () => {

    it('immediately handles keys 1, 2, and 3 to open respective OS views', () => {
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

      // Works via standard Digit and Numpad codes
      expect(evaluateRetroOSKeyEvent({ key: '', code: 'Digit1' }, false)).toEqual({
        handled: true,
        action: 'open_1',
      });
      expect(evaluateRetroOSKeyEvent({ key: '', code: 'Numpad2' }, false)).toEqual({
        handled: true,
        action: 'open_2',
      });
      expect(evaluateRetroOSKeyEvent({ key: '', code: 'Digit3' }, false)).toEqual({
        handled: true,
        action: 'open_3',
      });
    });

    it('guards against Shift modifier so Shift+1 (!), Shift+2 (@), Shift+3 (#) never accidentally trigger', () => {
      expect(
        evaluateRetroOSKeyEvent({ key: '!', code: 'Digit1', shiftKey: true }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '@', code: 'Digit2', shiftKey: true }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '#', code: 'Digit3', shiftKey: true }, false)
      ).toEqual({ handled: false });
    });

    it('bypasses numeric keys when browser modifier keys (Ctrl, Meta, Alt) are active', () => {
      expect(evaluateRetroOSKeyEvent({ key: '1', ctrlKey: true }, false)).toEqual({
        handled: false,
      });
      expect(evaluateRetroOSKeyEvent({ key: '2', metaKey: true }, false)).toEqual({
        handled: false,
      });
      expect(evaluateRetroOSKeyEvent({ key: '3', altKey: true }, false)).toEqual({
        handled: false,
      });
    });

    it('bypasses global keyboard listeners when user is typing in form inputs or contenteditable', () => {
      expect(
        evaluateRetroOSKeyEvent({ key: '1', targetTagName: 'INPUT' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '2', targetTagName: 'TEXTAREA' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '3', targetTagName: 'SELECT' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: '1', targetIsContentEditable: true }, false)
      ).toEqual({ handled: false });
    });

    it('handles ArrowUp and ArrowDown for circular roving focus', () => {
      expect(evaluateRetroOSKeyEvent({ key: 'ArrowUp' }, false)).toEqual({
        handled: true,
        action: 'prev',
      });
      expect(evaluateRetroOSKeyEvent({ key: 'ArrowDown' }, false)).toEqual({
        handled: true,
        action: 'next',
      });
    });

    it('handles Enter and Space to expand window when collapsed, but allows button/link activation', () => {
      // In overview mode, Enter and Space expand the window
      expect(evaluateRetroOSKeyEvent({ key: 'Enter' }, false)).toEqual({
        handled: true,
        action: 'expand',
      });
      expect(evaluateRetroOSKeyEvent({ key: ' ' }, false)).toEqual({
        handled: true,
        action: 'expand',
      });

      // When already expanded, global Enter/Space do not re-expand
      expect(evaluateRetroOSKeyEvent({ key: 'Enter' }, true)).toEqual({
        handled: false,
      });
      expect(evaluateRetroOSKeyEvent({ key: ' ' }, true)).toEqual({
        handled: false,
      });

      // When user focuses a native button or anchor link, global listener does not swallow it
      expect(
        evaluateRetroOSKeyEvent({ key: 'Enter', targetTagName: 'BUTTON' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: ' ', targetTagName: 'BUTTON' }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: 'Enter', targetTagName: 'A' }, false)
      ).toEqual({ handled: false });
    });

    it('handles Escape to collapse window when expanded, but ignores when already collapsed', () => {
      expect(evaluateRetroOSKeyEvent({ key: 'Escape' }, true)).toEqual({
        handled: true,
        action: 'collapse',
      });
      expect(evaluateRetroOSKeyEvent({ key: 'Escape' }, false)).toEqual({
        handled: false,
      });
    });

    it('bypasses global keyboard listeners when an external modal is open', () => {
      expect(
        evaluateRetroOSKeyEvent({ key: '1', hasExternalModal: true }, false)
      ).toEqual({ handled: false });
      expect(
        evaluateRetroOSKeyEvent({ key: 'Escape', hasExternalModal: true }, true)
      ).toEqual({ handled: false });
    });
  });
});
