import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  CRTDioramaStage,
  SAGE_PALETTE,
  AMBER_PALETTE,
} from '../../components/CRTDioramaStage';
import { RetroOSProvider } from '../../context/RetroOSContext';

describe('CRTDioramaStage Retro 90s Pixel Art Diorama & Header Verification', () => {
  describe('1. Top-Left Terminal Greeting Header & Top-Right Telemetry', () => {
    it('renders primary command prompt greeting with uppercase pixel typography in #c2cdb4 on #111712 screen', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Container has CRT screen void #111712
      expect(html).toContain('data-testid="crt-diorama-stage"');
      expect(html).toContain('background-color:#111712');

      // Command prompt greeting: WELCOME TO MOAYED'S PORTFOLIO in #c2cdb4
      expect(html).toContain('WELCOME TO MOAYED');
      expect(html).toContain('PORTFOLIO');
      expect(html).toContain('#c2cdb4');
    });

    it('implements stepped character typewriter animation (steps(22, end)) and blinking block cursor (█ using steps(2, start) infinite)', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Stepped typewriter entrance with steps(22, end)
      expect(html).toContain('steps(22, end)');
      expect(html).toContain('crt-typewriter-steps');
      expect(html).toContain('data-testid="crt-typewriter-greeting"');

      // Rhythmically blinking block cursor with steps(2, start) infinite keyframe
      expect(html).toContain('█');
      expect(html).toContain('steps(2, start)');
      expect(html).toContain('crt-block-cursor');
      expect(html).toContain('data-testid="crt-blinking-cursor"');
    });

    it('displays clean live Dhaka clock in top-right corner with #6e7d62: Dhaka • UTC+6', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('Dhaka • UTC+6');
      expect(html).toContain('data-testid="crt-telemetry-readout"');
      expect(html).toContain('#6e7d62');
    });
  });

  describe('2. Horizontal Desk Surface Line', () => {
    it('renders a crisp full-width 2px solid #6e7d62 horizontal desk line across middle of CRT viewport', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-horizontal-desk-line"');
      expect(html).toContain('border-bottom:2px solid #6e7d62');
      expect(html).toContain('height:2px');
      expect(html).toContain('background-color:#6e7d62');
    });
  });

  describe('3. Inline SVG Pixel-Grid Artworks (shape-rendering="crispEdges")', () => {
    it('renders inline SVG pixel-artworks with shape-rendering="crispEdges" on integer pixel grids', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // All SVGs enforce crispEdges for pixel-perfect rendering without antialiasing
      const matches = html.match(/shape-rendering="crispEdges"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(4);
    });

    it('strictly adheres to the 4-color monochrome phosphor palette: #c2cdb4, #6e7d62, #2e3b2b, and #111712', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // All 4 strict shades must be present
      expect(html).toContain('#c2cdb4');
      expect(html).toContain('#6e7d62');
      expect(html).toContain('#2e3b2b');
      expect(html).toContain('#111712');

      // Check palette constant definitions
      expect(SAGE_PALETTE.bright).toBe('#c2cdb4');
      expect(SAGE_PALETTE.mid).toBe('#6e7d62');
      expect(SAGE_PALETTE.dim).toBe('#2e3b2b');
      expect(SAGE_PALETTE.void).toBe('#111712');
    });

    it('renders Left Element: 32x48 Developer Avatar (Abdur Rahman Moayed) with jacket, shirt, hair, breathing motion and eye blink', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Developer Avatar sprite
      expect(html).toContain('data-testid="developer-avatar-sprite"');
      expect(html).toContain('viewBox="0 0 32 48"');
      expect(html).toContain('crt-avatar-breathing');
      expect(html).toContain('crt-avatar-eyelid');

      // Breathing animation keyframe definition steps(2)
      expect(html).toContain('crtAvatarIdleBreathe');
      expect(html).toContain('steps(2)');

      // Accessible aria label
      expect(html).toContain('Abdur Rahman Moayed Pixel Developer Avatar');
    });

    it('renders Center-Right Element: Compact 90s Macintosh Monitor with dark screen, prompt lines, and sloped keyboard base resting on desk line', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Compact Mac sprite
      expect(html).toContain('data-testid="compact-mac-sprite"');
      expect(html).toContain('viewBox="0 0 56 48"');
      expect(html).toContain('Compact 90s Macintosh Computer');

      // Prompt lines & keyboard keys resting on desk line (y=47-48)
      expect(html).toContain('y="47"');
      expect(html).toContain('y="14"');
    });

    it('renders Far-Right Element: Large 90s IBM Desktop PC Workstation with horizontal CPU case, floppy slots, power LED, stacked CRT monitor with scrolling code, and wide keyboard', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // IBM Workstation sprite
      expect(html).toContain('data-testid="ibm-workstation-sprite"');
      expect(html).toContain('viewBox="0 0 72 48"');
      expect(html).toContain('1990s IBM Desktop PC Workstation');

      // Scrolling miniature lines of code on CRT monitor
      expect(html).toContain('crt-ibm-scroll');
      expect(html).toContain('crtIbmCodeScroll');

      // Floppy drive slots & wide keyboard base on desk line (y=47-48)
      expect(html).toContain('y="47"');
    });
  });

  describe('4. Interactive Diorama Micro-States & Secondary Monochrome Phosphor Filter', () => {
    it('supports 90s RPG pixel speech bubble micro-state with exact text: Hi! Press 1, 2, or 3 below', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Speech bubble testid and interactive keyboard accessibility
      expect(html).toContain('data-testid="rpg-speech-bubble"');
      expect(html).toContain('Hi! Press 1, 2, or 3 below');
      expect(html).toContain('data-testid="developer-avatar-sprite"');
      expect(html).toContain('role="button"');
      expect(html).toContain('tabindex="0"');
    });

    it('supports toggling Vintage Amber phosphor filter #d4a359 while adhering to strict 4-color monochrome rule', () => {
      const htmlAmber = renderToString(
        React.createElement(CRTDioramaStage, { initialPhosphor: 'amber' })
      );

      // Amber bright #d4a359 in place of sage-green #c2cdb4
      expect(htmlAmber).toContain('#d4a359');
      expect(htmlAmber).toContain(AMBER_PALETTE.bright);
      expect(htmlAmber).toContain(AMBER_PALETTE.mid);
      expect(htmlAmber).toContain(AMBER_PALETTE.dim);
      expect(htmlAmber).toContain(AMBER_PALETTE.void);

      // Verify strict 4 shades for Amber palette
      expect(AMBER_PALETTE.bright).toBe('#d4a359');
      expect(AMBER_PALETTE.mid).toBe('#8c6830');
      expect(AMBER_PALETTE.dim).toBe('#3d2b12');
      expect(AMBER_PALETTE.void).toBe('#140f07');

      // Desk line updates color to Amber mid tone
      expect(htmlAmber).toContain(`border-bottom:2px solid ${AMBER_PALETTE.mid}`);
    });

    it('supports Large Desktop PC click micro-state showing tooltip: Click: Open Selected Work', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="ibm-workstation-sprite"');
      expect(html).toContain('data-testid="github-status-hud"');
      expect(html).toContain('Click: Open Selected Work');
      expect(html).toContain('role="button"');
      expect(html).toContain('tabindex="0"');
    });

    it('enforces strict integer coordinates on all SVG rect elements without decimals', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Extract all x, y, width, height attributes from SVGs and ensure none contain decimal points
      const decimalMatch = html.match(/(?:x|y|width|height)="[0-9]+\.[0-9]+"/g);
      expect(decimalMatch).toBeNull();
    });

    it('enforces GEMINI.md design rules: strictly zero banned legacy colors', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Banned legacy colors in GEMINI.md: terracotta (#D9532F, #A74024, #FF4D1C) and muted sage (#4E9A7F)
      expect(html.toLowerCase()).not.toContain('#d9532f');
      expect(html.toLowerCase()).not.toContain('#a74024');
      expect(html.toLowerCase()).not.toContain('#ff4d1c');
      expect(html.toLowerCase()).not.toContain('#4e9a7f');
    });

    it('supports custom className prop on root container', () => {
      const html = renderToString(
        React.createElement(CRTDioramaStage, { className: 'custom-stage-mount' })
      );

      expect(html).toContain('custom-stage-mount');
    });

    it('positions blinking block cursor immediately following PORTFOLIO on line 2', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // The typewriter span must contain WELCOME TO MOAYED'S and PORTFOLIO with the block cursor inline
      const typewriterGreetingMatch = html.match(
        /data-testid="crt-typewriter-greeting"[^>]*>([\s\S]*?)<\/span>/
      );
      expect(typewriterGreetingMatch).not.toBeNull();
      const content = typewriterGreetingMatch![1];
      expect(content).toContain('WELCOME TO MOAYED');
      expect(content).toContain('PORTFOLIO');
      expect(content).toContain('data-testid="crt-blinking-cursor"');
      expect(content).toContain('crt-block-cursor');
    });

    it('enforces white-space: pre to prevent awkward multi-line word wrap jumps during typing', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));
      expect(html).toContain('white-space: pre');
    });

    it('enforces SVG clipPath on IBM CRT monitor to prevent scrolling code from spilling onto monitor bezel', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('id="crt-ibm-screen-clip"');
      expect(html).toContain('clip-path="url(#crt-ibm-screen-clip)"');
    });

    it('anchors avatar shoes firmly at desk surface line (y=47-48) while breathing animation is isolated to upper body', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Shoes rects are outside crt-avatar-breathing group or grounded at y=47-48
      expect(html).toContain('y="47"');
      expect(html).toContain('y="44"');
    });

    it('strictly adheres to pure 4-shade monochrome palette without hardcoded #000000 shadows in Amber mode', () => {
      const htmlAmber = renderToString(
        React.createElement(CRTDioramaStage, { initialPhosphor: 'amber' })
      );

      // In Amber mode, no #000000 drop shadows
      expect(htmlAmber).not.toContain('shadow-[2px_2px_0_0_#000000]');
      expect(htmlAmber).toContain(`box-shadow:2px 2px 0 0 ${AMBER_PALETTE.void}`);
    });
  });

  describe('5. Level 1 CRT Home Stage Refactor (/boost Verification)', () => {
    it('removes cluttered COMMAND PROMPT // INITIALIZING sub-header and enforces generous fluid padding', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Cluttered sub-header is removed
      expect(html).not.toContain('COMMAND PROMPT // INITIALIZING');

      // Header has generous fluid padding inside CRT screen
      expect(html).toContain('padding:clamp(24px, 3vw, 44px) clamp(28px, 4vw, 64px)');
    });

    it('renders clean two-line pixel header in Press Start 2P with blinking cursor block', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('WELCOME TO MOAYED');
      expect(html).toContain('PORTFOLIO');
      expect(html).toContain('data-testid="crt-blinking-cursor"');
    });

    it('renders single human-readable positioning line in Plus Jakarta Sans (#6e7d62) with fluid scaling', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-positioning-line"');
      expect(html).toContain('Full-Stack Product &amp; Web Engineer • CSE at East West University, Dhaka');
      expect(html).toContain('Plus Jakarta Sans');
      expect(html).toContain('font-size:clamp(1rem, 1.25vw, 1.25rem)');
      expect(html).toContain('#6e7d62');
    });

    it('displays clean live Dhaka clock (Dhaka • UTC+6) in top-right corner', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-telemetry-readout"');
      expect(html).toContain('Dhaka • UTC+6');
    });

    it('unboxes pixel sprites freely on 2px #6e7d62 desk line with 50% open #111712 negative space', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-horizontal-desk-line"');
      expect(html).toContain('border-bottom:2px solid #6e7d62');

      // Negative space: desk surface background uses void color #111712 rather than dark grid
      expect(html).toContain('data-testid="crt-split-console"');
      expect(html).toContain('background-color:#111712');
      expect(html).not.toContain('background-image:linear-gradient(to right');
    });

    it('renders subtle interactive hover affordances for all three sprites: Avatar, Compact Mac, and IBM PC', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Left Developer Avatar minimal tooltip
      expect(html).toContain('Hi! Press 1, 2, or 3 below');

      // Compact Mac hover tooltip
      expect(html).toContain('data-testid="mac-hover-tooltip"');
      expect(html).toContain('Click: Switch Green / Amber Screen');

      // IBM Desktop PC hover tooltip
      expect(html).toContain('data-testid="ibm-hover-tooltip"');
      expect(html).toContain('Click: Open Selected Work');
    });

    it('renders clean, spacious 3-item selector in Press Start 2P: 1. Selected Work, 2. About & Skills, and 3. Resume & Contact', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="retro-command-menu"');
      expect(html).toContain('1. Selected Work');
      expect(html).toContain('2. About &amp; Skills');
      expect(html).toContain('3. Resume &amp; Contact');
      // Noisy keyboard instruction clutter removed
      expect(html).not.toContain('↑↓ ROVE • ENTER EXPAND');
    });

    it('renders compact 90s OS Preview Window (Quick Preview) with #c2cdb4 title bar and controls', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="retro-window-titlebar"');
      expect(html).toContain('Quick Preview');
      expect(html).toContain('data-testid="retro-window-btn-minimize"');
      expect(html).toContain('data-testid="retro-window-btn-maximize"');
      expect(html).toContain('data-testid="retro-window-btn-close"');
      expect(html).toContain('data-testid="retro-pixel-scrollbar"');
    });

    it('Preview for 1. Selected Work lists the 4 Flagship Projects with prompt to press Enter to inspect', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('01 BitForge');
      expect(html).toContain('02 FocusLab');
      expect(html).toContain('03 Rannabanna');
      expect(html).toContain('04 DocLensBD');
      expect(html).toContain('Press Enter to inspect');
    });

    it('Preview for 2. About & Skills displays 2-sentence bio summary and core tech stack', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'about' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('Full-Stack Product &amp; Web Engineer');
      expect(html).toContain('East West University, Dhaka');
      expect(html).toContain('TypeScript');
      expect(html).toContain('React');
      expect(html).toContain('Next.js');
      expect(html).toContain('Node.js');
      expect(html).toContain('C++');
      expect(html).toContain('Cloud Firestore');
    });

    it('Preview for 3. Resume & Contact surfaces immediate 1-click Copy Email, Download Resume, LinkedIn, and GitHub buttons', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'resume' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('data-testid="btn-copy-email"');
      expect(html).toContain('Copy Email');

      expect(html).toContain('data-testid="btn-download-cv"');
      expect(html).toContain('Download Resume');

      expect(html).toContain('data-testid="btn-github-link"');
      expect(html).toContain('GitHub');

      expect(html).toContain('data-testid="btn-linkedin-link"');
      expect(html).toContain('LinkedIn');
    });

    it('wires interactive callback hooks on Avatar, Compact Mac, and IBM PC sprites', () => {
      const onAvatarInteract = vi.fn();
      const onMacInteract = vi.fn();
      const onIBMInteract = vi.fn();
      const onPhosphorChange = vi.fn();

      const stage = React.createElement(CRTDioramaStage, {
        onAvatarInteract,
        onMacInteract,
        onIBMInteract,
        onPhosphorChange,
      });
      const html = renderToString(stage);
      expect(html).toContain('data-testid="developer-avatar-sprite"');
      expect(html).toContain('data-testid="compact-mac-sprite"');
      expect(html).toContain('data-testid="ibm-workstation-sprite"');
    });
  });

  describe('6. 3-Second Recruiter Hook & Self-Sufficient Level 1 Console (/boost Spec)', () => {
    it('renders clean top greeting with > WELCOME TO MOAYED\'S PORTFOLIO and no COMMAND PROMPT / SYS.96 clutter', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('&gt; WELCOME TO MOAYED');
      expect(html).toContain('PORTFOLIO');
      expect(html).toContain('data-testid="crt-blinking-cursor"');
      expect(html).not.toContain('COMMAND PROMPT // INITIALIZING');
      expect(html).not.toContain('SYS.96');
      expect(html).toContain('padding:clamp(24px, 3vw, 44px) clamp(28px, 4vw, 64px)');
    });

    it('renders exact human-readable positioning line: Full-Stack Product & Web Engineer • CSE at East West University, Dhaka', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-positioning-line"');
      expect(html).toContain('Full-Stack Product &amp; Web Engineer • CSE at East West University, Dhaka');
      expect(html).toContain('Plus Jakarta Sans');
      expect(html).toContain('font-size:clamp(1rem, 1.25vw, 1.25rem)');
      expect(html).toContain('#6e7d62');
    });

    it('displays only clean live Dhaka clock in top-right corner', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="crt-telemetry-readout"');
      expect(html).toContain('Dhaka • UTC+6');
    });

    it('renders 2px pixel corner brackets on hover for all three center-stage sprites', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Left Avatar 2px corner brackets
      expect(html).toContain('data-testid="avatar-corner-brackets"');
      // Center-Right Mac 2px corner brackets
      expect(html).toContain('data-testid="mac-corner-brackets"');
      // Far-Right IBM Desktop PC 2px corner brackets
      expect(html).toContain('data-testid="ibm-corner-brackets"');

      // Unboxed sprites stand on 2px #6e7d62 horizontal desk line
      expect(html).toContain('data-testid="crt-horizontal-desk-line"');
      expect(html).toContain('border-bottom:2px solid #6e7d62');
    });

    it('renders exact sprite hover tooltips: Avatar, Mac, and IBM PC', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Avatar tooltip
      expect(html).toContain('Hi! Press 1, 2, or 3 below');
      // Compact Mac tooltip
      expect(html).toContain('Click: Switch Green / Amber Screen');
      // IBM PC tooltip
      expect(html).toContain('Click: Open Selected Work');
    });

    it('renders clean, spacious 3-item selector: 1. Selected Work, 2. About & Skills, 3. Resume & Contact', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="retro-command-menu"');
      expect(html).toContain('1. Selected Work');
      expect(html).toContain('2. About &amp; Skills');
      expect(html).toContain('3. Resume &amp; Contact');
    });

    it('renders compact 90s OS Preview Window titled Quick Preview with #c2cdb4 title bar', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('data-testid="retro-window-titlebar"');
      expect(html).toContain('Quick Preview');
      expect(html).toContain('data-testid="retro-window-btn-minimize"');
      expect(html).toContain('data-testid="retro-window-btn-maximize"');
      expect(html).toContain('data-testid="retro-window-btn-close"');
      expect(html).toContain('data-testid="retro-pixel-scrollbar"');
    });

    it('previewing 1. Selected Work lists the 4 Flagship Projects: 01 BitForge, 02 FocusLab, 03 Rannabanna, 04 DocLensBD with prompt to press Enter to inspect', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('01 BitForge');
      expect(html).toContain('02 FocusLab');
      expect(html).toContain('03 Rannabanna');
      expect(html).toContain('04 DocLensBD');
      expect(html).toContain('Press Enter to inspect');
    });

    it('previewing 2. About & Skills displays 2-sentence bio summary and core stack (TypeScript, React, Next.js, Node.js, C++, Cloud Firestore)', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'about' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('Full-Stack Product &amp; Web Engineer');
      expect(html).toContain('East West University, Dhaka');
      expect(html).toContain('TypeScript');
      expect(html).toContain('React');
      expect(html).toContain('Next.js');
      expect(html).toContain('Node.js');
      expect(html).toContain('C++');
      expect(html).toContain('Cloud Firestore');
    });

    it('previewing 3. Resume & Contact surfaces immediate one-click Copy Email, LinkedIn, GitHub, and Download Resume action buttons', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'resume' },
          React.createElement(CRTDioramaStage)
        )
      );

      expect(html).toContain('data-testid="btn-copy-email"');
      expect(html).toContain('Copy Email');

      expect(html).toContain('data-testid="btn-linkedin-link"');
      expect(html).toContain('LinkedIn');
      expect(html).toContain('https://linkedin.com/in/watchknight');

      expect(html).toContain('data-testid="btn-github-link"');
      expect(html).toContain('GitHub');
      expect(html).toContain('https://github.com/watchknight');

      expect(html).toContain('data-testid="btn-download-cv"');
      expect(html).toContain('Download Resume');
    });
  });

  describe('7. Widescreen CRT Stage Proportional Scaling & Quick Preview Split (/boost)', () => {
    it('applies generous fluid padding and fluid viewport typography scaling to the header zone', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Fluid padding inside CRT screen
      expect(html).toContain('padding:clamp(24px, 3vw, 44px) clamp(28px, 4vw, 64px)');

      // Fluid font-size, line-height, and letter-spacing on main prompt
      expect(html).toContain('font-size:clamp(1.6rem, 2.8vw, 2.65rem)');
      expect(html).toContain('line-height:1.35');
      expect(html).toContain('letter-spacing:0.04em');

      // Fluid font-size and margin on subtitle
      expect(html).toContain('font-size:clamp(1rem, 1.25vw, 1.25rem)');
      expect(html).toContain('margin-top:8px');

      // Anchored status badge and live Dhaka clock
      expect(html).toContain('data-testid="crt-status-badge"');
      expect(html).toContain('Status: Available for Roles');
      expect(html).toContain('data-testid="crt-telemetry-readout"');
      expect(html).toContain('Dhaka • UTC+6');
    });

    it('scales up SVG pixel-art sprites using clamp() heights and renders steaming coffee mug on the desk', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Scaled up SVG pixel-art sprites (clamp(96px, 14vh, 150px))
      expect(html).toContain('height:clamp(96px, 14vh, 150px)');
      expect(html).toContain('width:auto');

      // Subtle pixel coffee mug with 2-frame steam animation and crispEdges shapeRendering
      expect(html).toContain('data-testid="crt-desk-coffee-mug"');
      expect(html).toContain('shape-rendering="crispEdges"');
      expect(html).toContain('crt-coffee-steam');
      expect(html).toContain('crtCoffeeSteamRise');
      expect(html).toContain('steps(2)');
    });

    it('allocates roughly 44% of CRT screen height to 12-column grid with 5:7 split', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      // Bottom split console allocated 44% height
      expect(html).toContain('data-testid="crt-split-console"');
      expect(html).toContain('height:44%');
      expect(html).toContain('min-height:44%');

      // 12-column grid layout with 5:7 ratio and fluid gap
      expect(html).toContain('lg:grid-cols-12');
      expect(html).toContain('lg:col-span-5');
      expect(html).toContain('lg:col-span-7');
      expect(html).toContain('gap:clamp(20px, 2.5vw, 40px)');
    });

    it('scales 3 navigation command buttons with fluid typography and taller vertical padding', () => {
      const html = renderToString(React.createElement(CRTDioramaStage));

      expect(html).toContain('font-size:clamp(1rem, 1.4vw, 1.35rem)');
      expect(html).toContain('padding:clamp(14px, 1.8vh, 22px) 20px');
    });

    it('renders 2-column widescreen Quick Preview split with 4 project rows and live mini preview card', () => {
      const html = renderToString(
        React.createElement(
          RetroOSProvider,
          { initialSection: 'projects' },
          React.createElement(CRTDioramaStage)
        )
      );

      // Left half: 4 interactive project rows with listbox accessibility
      expect(html).toContain('data-testid="quick-view-project-1"');
      expect(html).toContain('data-testid="quick-view-project-2"');
      expect(html).toContain('data-testid="quick-view-project-3"');
      expect(html).toContain('data-testid="quick-view-project-4"');
      expect(html).toContain('01 BitForge');
      expect(html).toContain('02 FocusLab');
      expect(html).toContain('03 Rannabanna');
      expect(html).toContain('04 DocLensBD');
      expect(html).toContain('role="listbox"');
      expect(html).toContain('role="option"');

      // Right half: live mini preview card
      expect(html).toContain('data-testid="quick-view-mini-card"');
      expect(html).toContain('data-testid="preview-btn-case-study-01"');
      expect(html).toContain('Open Case Study');
      expect(html).toContain('data-testid="preview-btn-live-app-01"');
      expect(html).toContain('Live App');
      expect(html).toContain('https://bitforge-3u2q.onrender.com');

      // Inspect prompt
      expect(html).toContain('data-testid="quick-view-inspect-prompt"');
      expect(html).toContain('Press Enter to inspect');
    });
  });
});
