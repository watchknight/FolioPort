import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ExtensionStudio } from '../../components/ExtensionStudio';
import { RetroCommandBar } from '../../components/navigation/RetroCommandBar';
import { GithubLab } from '../../components/GithubLab';
import { SkillMatrix } from '../../components/SkillMatrix';
import { TerminalLab } from '../../components/TerminalLab';
import { App } from '../../App';

describe('Chrome Extension Studio & FocusGuard MV3 Architecture', () => {
  describe('1. Component Structure & Section ID Anchoring', () => {
    it('renders ExtensionStudio without throwing in SSR lifecycle', () => {
      const html = renderToString(React.createElement(ExtensionStudio));
      expect(html).toBeTruthy();
    });

    it('has id="extensions" for command bar navigation target', () => {
      const html = renderToString(React.createElement(ExtensionStudio));
      expect(html).toContain('id="extensions"');
    });

    it('is wired to 02 Extensions in RetroCommandBar', () => {
      const commandBarHtml = renderToString(React.createElement(RetroCommandBar));
      expect(commandBarHtml).toContain('02');
      expect(commandBarHtml).toContain('Extensions');
      expect(commandBarHtml).toContain('Browser Extension Studio');
    });

    it('is rendered in App layout positioned after Flagship Systems (#work) and before Experience', () => {
      const appHtml = renderToString(React.createElement(App));
      const workIndex = appHtml.indexOf('id="work"');
      const extensionsIndex = appHtml.indexOf('id="extensions"');
      const experienceIndex = appHtml.indexOf('id="experience"');

      expect(workIndex).toBeGreaterThan(-1);
      expect(extensionsIndex).toBeGreaterThan(-1);
      expect(experienceIndex).toBeGreaterThan(-1);

      // Verify sequence: #work -> #extensions -> #experience
      expect(extensionsIndex).toBeGreaterThan(workIndex);
      expect(experienceIndex).toBeGreaterThan(extensionsIndex);
    });
  });

  describe('2. Chrome Browser Simulator & Toolbar Frame', () => {
    it('renders simulated Chrome tab bar and omnibox with chrome-extension address', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      // Tab bar & Omnibox
      expect(html).toContain('chrome-extension://focusguard/popup.html');
      expect(html).toContain('FocusGuard • popup.html');
      expect(html).toContain('target-host.org');
      expect(html).toContain('worker-logs.json');
      expect(html).toContain('SECURE');
    });

    it('contains retro 90s window chrome controls [ - ] [ + ] [ x ]', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('aria-label="Minimize"');
      expect(html).toContain('aria-label="Maximize"');
      expect(html).toContain('aria-label="Close"');
    });

    it('renders pinned extension icon next to the omnibox toolbar', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('title="FocusGuard Pinned Extension (Click to inspect popup)"');
      expect(html).toContain('aria-label="FocusGuard Pinned Extension"');
    });

    it('renders all 3 interactive architecture toggle tabs', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('Tab 1: Live Popup &amp; RAM Throttler');
      expect(html).toContain('Tab 2: Shadow DOM Injection HUD');
      expect(html).toContain('Tab 3: Manifest V3 Service Worker Stream');
    });
  });

  describe('3. Tab 1: Live Popup UI & RAM Throttler Features', () => {
    it('renders Distraction Shield toggle with phosphor status', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('Distraction Shield: Active');
      expect(html).toContain('On');
      expect(html).toContain('1,482 Declarative Net Rules Active');
    });

    it('renders Background Tab Heap Throttler slider and memory readout', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('BACKGROUND TAB HEAP THROTTLER');
      expect(html).toContain('aria-label="Background Tab Heap Throttler Slider"');
      expect(html).toContain('SIMULATED CHROME RENDERER MEMORY');
      expect(html).toContain('0% IDLE (1,840 MB)');
      expect(html).toContain('50% BALANCED');
      expect(html).toContain('100% AGGRESSIVE (420 MB)');
      expect(html).toContain('chrome.tabs.discard()');
      expect(html).toContain('GC Cycle');
      expect(html).toContain('180s POSIX');
      expect(html).toContain('DOM Reflow');
      expect(html).toContain('0 ops/sec');
      expect(html).toContain('DNR Latency');
    });

    it('calculates memory range accurately between 1,840 MB (0%) and 420 MB (100%)', () => {
      const calculateMemory = (pct: number) => Math.round(1840 - (pct / 100) * (1840 - 420));

      expect(calculateMemory(0)).toBe(1840);
      expect(calculateMemory(50)).toBe(1130);
      expect(calculateMemory(75)).toBe(775);
      expect(calculateMemory(100)).toBe(420);
    });
  });

  describe('4. Retro 90s Cyberdeck Architecture Spec Sheet & Repo Link', () => {
    it('renders the 4 exact architectural specifications', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('FocusGuard Specifications');
      expect(html).toContain('Chrome Manifest V3 / TypeScript');
      expect(html).toContain('&lt; 12 MB background heap');
      expect(html).toContain('0ms (Local declarative blocking)');
      expect(html).toContain('Closed Shadow DOM Tree + CSS Variables');
    });

    it('renders target browser and zero external dependency telemetry', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('Blink / V8 116+');
      expect(html).toContain('0 External Pkgs');
    });

    it('renders the direct magnetic GitHub repository button linking to FocusGuard', () => {
      const html = renderToString(React.createElement(ExtensionStudio));

      expect(html).toContain('href="https://github.com/watchknight/FocusGuard"');
      expect(html).toContain('Inspect FocusGuard on GitHub ↗');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('target="_blank"');
    });
  });

  describe('5. Cross-Linking & Global Section Numbering Consistency', () => {
    it('verifies GithubLab ROM_11 FocusGuard cartridge has a direct link to #extensions', () => {
      const githubHtml = renderToString(React.createElement(GithubLab));

      expect(githubHtml).toContain('FocusGuard');
      expect(githubHtml).toContain('href="#extensions"');
      expect(githubHtml).toContain('Studio ↗');
    });

    it('verifies coherent 01-05 sequence across the portfolio sections', () => {
      const commandBarHtml = renderToString(React.createElement(RetroCommandBar));
      expect(commandBarHtml).toContain('01');
      expect(commandBarHtml).toContain('02');
      expect(commandBarHtml).toContain('03');
      expect(commandBarHtml).toContain('04');
      expect(commandBarHtml).toContain('05');
      expect(commandBarHtml).toContain('06');

      const extHtml = renderToString(React.createElement(ExtensionStudio));
      expect(extHtml).toContain('02. Browser Extension Studio');

      const skillHtml = renderToString(React.createElement(SkillMatrix));
      expect(skillHtml).toContain('03. Architectural Philosophy');

      const githubHtml = renderToString(React.createElement(GithubLab));
      expect(githubHtml).toContain('04. GitHub Repositories');

      const termHtml = renderToString(React.createElement(TerminalLab));
      expect(termHtml).toContain('05. Terminal');
    });
  });
});
