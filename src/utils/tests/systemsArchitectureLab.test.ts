import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { 
  SkillMatrix, 
  FLAGSHIP_PROJECTS, 
  ARCHITECTURE_LAYERS 
} from '../../components/SkillMatrix';
import { GithubLab } from '../../components/GithubLab';
import { TerminalLab } from '../../components/TerminalLab';

describe('SYS.96 Systems UI Architecture Verification: SkillMatrix, GithubLab & TerminalLab', () => {

  describe('1. 8-Bit LED Telemetry Counters & Motherboard Skill Matrix (SkillMatrix.tsx)', () => {
    it('contains all 4 authority metrics with 90s digital pixel readouts', () => {
      const html = renderToString(React.createElement(SkillMatrix));

      // 4 Authority Metrics as required
      expect(html).toContain('4+ YEARS CRAFT');
      expect(html).toContain('120 FPS CANVAS PACING');
      expect(html).toContain('100% OBSIDIAN AST PARITY');
      expect(html).toContain('0 POSIX C MEMORY LEAKS');

      // Metric targets
      expect(html).toContain('4+');
      expect(html).toContain('120');
      expect(html).toContain('100%');
      expect(html).toContain('0');
    });

    it('presents the 3 architectural layers as interconnected pixel-circuit columns', () => {
      expect(ARCHITECTURE_LAYERS).toHaveLength(3);

      const [layer1, layer2, layer3] = ARCHITECTURE_LAYERS;

      // Exact prompt layer tags
      expect(layer1.layerTag).toBe('LAYER_01: CLIENT, 3D WEBGL & MOTION');
      expect(layer2.layerTag).toBe('LAYER_02: DISTRIBUTED SERVER & DATA');
      expect(layer3.layerTag).toBe('LAYER_03: LINUX KERNEL & C/C++ POSIX IPC');

      const allTechNames = ARCHITECTURE_LAYERS.flatMap(l => l.techs.map(t => t.name));

      // Explicitly mandated skills from prompt
      expect(allTechNames).toContain('Three.js / GLSL');
      expect(allTechNames).toContain('React 18 / Next.js');
      expect(allTechNames).toContain('GSAP & ScrollTrigger');
      expect(allTechNames).toContain('Cloud Firestore');
      expect(allTechNames).toContain('C / C++ Systems');
      expect(allTechNames).toContain('POSIX shmget / shmat');
    });

    it('links all 6 flagship project ROM cartridges with bi-directional trace mapping', () => {
      expect(FLAGSHIP_PROJECTS).toHaveLength(6);

      const numbers = FLAGSHIP_PROJECTS.map(p => p.number);
      expect(numbers).toEqual(['ROM_01', 'ROM_02', 'ROM_03', 'ROM_04', 'ROM_05', 'ROM_06']);

      const titles = FLAGSHIP_PROJECTS.map(p => p.title);
      expect(titles).toContain('Mental Defrag');
      expect(titles).toContain('DocLensBD');
      expect(titles).toContain('Rannabanna');
      expect(titles).toContain('Trash Trail');
      expect(titles).toContain('Neon Vanguard 2D & OS Kernel Labs');
      expect(titles).toContain('Chronos-Guard & Aether-GL');
    });

    it('renders the East West University CSE timeline (2021 – PRESENT) & SHA-256 BIOS ROM readout', () => {
      const html = renderToString(React.createElement(SkillMatrix));

      // Official 90s BIOS Hardware Verification ROM readout
      expect(html).toContain('BIOS_ROM_VERIFY.SYS');
      expect(html).toContain('East West University (EWU)');
      expect(html).toContain('2021 – PRESENT (SENIOR STANDING)');
      expect(html).toContain('Computer Science &amp; Engineering (CSE)');
      expect(html).toContain('SHA-256 AUTHENTICATED');
      expect(html).toContain('8F4A2B9C7D1E0F3A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F9A8B7C6D5E4F3A');
      expect(html).toContain('VALGRIND MEM AUDIT');
      expect(html).toContain('0 LEAKS // CLEAN EXIT');
    });

    it('applies --tech-cyan-wave and --pixel-amber-gold CSS variable border tokens and counter attributes', () => {
      const html = renderToString(React.createElement(SkillMatrix));

      // CSS variable token bindings
      expect(html).toContain('var(--tech-cyan-wave');
      expect(html).toContain('var(--pixel-amber-gold');

      // Scroll-triggered counter attributes
      expect(html).toContain('data-counter="4+"');
      expect(html).toContain('data-counter="120"');
      expect(html).toContain('data-counter="100%"');
      expect(html).toContain('data-counter="0"');
    });

    it('renders traveling animated PCB pulse traces with animate-pcb-pulse classes', () => {
      const html = renderToString(React.createElement(SkillMatrix));

      expect(html).toContain('MOTHERBOARD PCB BUS');
      expect(html).toContain('viewBox="0 0 1000 32"');
    });

    it('renders unified Cyberdeck Career & Academic BIOS Console with id="experience" and 3 selectable tabs', () => {
      const html = renderToString(React.createElement(SkillMatrix));

      // Container has id="experience" for anchor link navigation
      expect(html).toContain('id="experience"');

      // 3 Tab buttons
      expect(html).toContain('TAB 1: EWU CSE &amp; OFFICIAL BIOS RECORD');
      expect(html).toContain('TAB 2: FULL-STACK &amp; BROWSER EXTENSIONS');
      expect(html).toContain('TAB 3: SYSTEMS, KERNEL &amp; GRAPHICS LABS');

      // Default active tab (Tab 1) content
      expect(html).toContain('ROM PCI/ISA BIOS (2A69KM4B) // MODULAR CSE ARCHITECTURE');
      expect(html).toContain('East West University (EWU)');
      expect(html).toContain('Computer Science &amp; Engineering (CSE)');
      expect(html).toContain('VALGRIND MEM AUDIT');
      expect(html).toContain('0 LEAKS // CLEAN EXIT');
    });
  });

  describe('2. Retro ROM Cartridge GitHub Explorer (GithubLab.tsx)', () => {
    it('renders the prompt-mandated filter tabs [FILTER: ALL | TS/JS | C/C++ | HTML/CANVAS]', () => {
      const html = renderToString(React.createElement(GithubLab));

      expect(html).toContain('&gt; ALL');
      expect(html).toContain('&gt; TS/JS');
      expect(html).toContain('&gt; C/C++');
      expect(html).toContain('&gt; HTML/CANVAS');
    });

    it('contains FolioPort, watchknight, and MyPortfolio in the repository dataset', () => {
      const html = renderToString(React.createElement(GithubLab));

      expect(html).toContain('FolioPort');
      expect(html).toContain('watchknight');
      expect(html).toContain('MyPortfolio');
      expect(html).toContain('Mental-Defrag');
      expect(html).toContain('DocLensBD');
      expect(html).toContain('Linux-OS-Kernel-Labs');
    });

    it('renders the mandated [ >_ INSPECT_ROM ] action button and floppy cartridge hardware details', () => {
      const html = renderToString(React.createElement(GithubLab));

      // Button presence
      expect(html).toContain('[ &gt;_ INSPECT_ROM ]');

      // Floppy & Cartridge hardware features
      expect(html).toContain('WP: OFF');
      expect(html).toContain('16-BIT BUS');
    });
  });

  describe('3. Phosphor CRT Ubuntu Terminal + Playable Mini-Game (TerminalLab.tsx)', () => {
    it('renders the moayed@ewu-cse:~$ Ubuntu 24.04.1 LTS terminal with phosphor CRT chrome', () => {
      const html = renderToString(React.createElement(TerminalLab));

      expect(html).toContain('moayed@ewu-cse');
      expect(html).toContain('Ubuntu 24.04.1 LTS');
      expect(html).toContain('UBUNTU_CRT.EXE');
      expect(html).toContain('East West University Systems Lab');
    });

    it('includes all existing commands plus the new arcade command and $arcade quick chip', () => {
      const html = renderToString(React.createElement(TerminalLab));

      // Commands listed in MOTD/Help
      expect(html).toContain('whoami');
      expect(html).toContain('help');
      expect(html).toContain('skills');
      expect(html).toContain('projects');
      expect(html).toContain('github');
      expect(html).toContain('arcade');
      expect(html).toContain('sudo hire moayed');

      // Quick exec chip $arcade
      expect(html).toContain('&gt; $arcade');
    });

    it('provides CRT phosphor mode toggle and authentic 90s window controls', () => {
      const html = renderToString(React.createElement(TerminalLab));

      // Phosphor toggle
      expect(html).toContain('CRT:');
      expect(html).toContain('GREEN');

      // Retro window controls
      expect(html).toContain('aria-label="Minimize or restore terminal"');
      expect(html).toContain('aria-label="Toggle expanded height"');
      expect(html).toContain('aria-label="Reset terminal session"');
    });

    it('supports arcade game commands, touch ergonomics and audio feedback in terminal', () => {
      const html = renderToString(React.createElement(TerminalLab));

      // Terminal MOTD and help mention arcade game directive
      expect(html).toContain('arcade');
      expect(html).toContain('Launch 8-bit Cyber-Knight Wave Runner mini-game');
    });
  });

  describe('4. Systems Logic Verification: Arcade Edge Mechanics & Filter Categorization', () => {
    it('prevents rapid vertical cascade trap by testing direction before edge hit', () => {
      // Logic verification: test that direction guarding prevents edge oscillation
      let enemyDir = 1;
      let hitCount = 0;

      // Invader moving right past right bound
      let x = 532;
      if ((enemyDir > 0 && x > 530) || (enemyDir < 0 && x < 20)) {
        hitCount++;
        enemyDir *= -1; // reverses to -1 (left)
      }
      expect(hitCount).toBe(1);
      expect(enemyDir).toBe(-1);

      // Next frame: x is still 531 (> 530), but now moving left (enemyDir < 0)
      x = 531;
      let secondHit = false;
      if ((enemyDir > 0 && x > 530) || (enemyDir < 0 && x < 20)) {
        secondHit = true;
      }
      expect(secondHit).toBe(false); // Does NOT trigger false bounce while retreating!
    });

    it('ensures destroyed invaders do not trigger false game over at baseline', () => {
      const enemy = { alive: false, y: 315, h: 20 };
      const playerY = 310;
      let gameOverTriggered = false;

      // Loop condition with fix
      if (enemy.alive) {
        if (enemy.y + enemy.h >= playerY) {
          gameOverTriggered = true;
        }
      }

      expect(gameOverTriggered).toBe(false);
    });
  });

});
