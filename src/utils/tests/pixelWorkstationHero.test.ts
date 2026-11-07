import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Hero } from '../../components/Hero';
import { PixelWorkstationCRT } from '../../components/hero/PixelWorkstationCRT';

describe('Retro 90s Cyberdeck Hero & PixelWorkstationCRT Verification', () => {
  describe('Left Column Cyberdeck Command Identity & Bracket Menu (@src/components/Hero.tsx)', () => {
    it('renders Abdur Rahman Moayed identity, East West University and Dhaka coordinates', () => {
      const html = renderToString(React.createElement(Hero));

      expect(html).toContain('Abdur Rahman Moayed');
      expect(html).toContain('@watchknight');
      expect(html).toContain('East West University, Bangladesh');
      expect(html).toContain('23°48&#x27;N 90°25&#x27;E');
      expect(html).toContain('DHAKA, BD');
    });

    it('renders crisp pixel display top prompt > WELCOME TO WATCHKNIGHT_OS // PORTFOLIO v1.96', () => {
      const html = renderToString(React.createElement(Hero));

      expect(html).toContain('hero-prompt-bar');
      expect(html).toContain('font-pixel');
      expect(html).toContain('WELCOME TO WATCHKNIGHT_OS // PORTFOLIO v1.96');
      expect(html).toContain('text-[#00F0FF]');
    });

    it('renders updated headline: ENGINEERING WHERE LOW-LEVEL SYSTEMS MEET SPATIAL 3D & PIXEL WORLDS', () => {
      const html = renderToString(React.createElement(Hero));

      expect(html).toContain('ENGINEERING');
      expect(html).toContain('WHERE');
      expect(html).toContain('LOW-LEVEL');
      expect(html).toContain('SYSTEMS');
      expect(html).toContain('MEET');
      expect(html).toContain('SPATIAL');
      expect(html).toContain('3D');
      expect(html).toContain('&amp;');
      expect(html).toContain('PIXEL');
      expect(html).toContain('WORLDS.');
    });

    it('renders the interactive 90s CRT bracket menu with [1] to [4] options', () => {
      const html = renderToString(React.createElement(Hero));

      expect(html).toContain('hero-bracket-menu');
      expect(html).toContain('COMMAND SELECTION // SYS.96 [PRESS 1 - 4]');

      // Menu option [1]
      expect(html).toContain('[1]');
      expect(html).toContain('ABOUT ME &amp; KERNEL ARCHITECTURE');

      // Menu option [2]
      expect(html).toContain('[2]');
      expect(html).toContain('MY PROJECTS &amp; 3D SHADER DECK');

      // Menu option [3]
      expect(html).toContain('[3]');
      expect(html).toContain('GITHUB_ROM &amp; UBUNTU TERMINAL');

      // Menu option [4]
      expect(html).toContain('[4]');
      expect(html).toContain('RESUME.PDF &amp; UPLINK DISPATCH');
    });
  });

  describe('Right Column Sculptural 90s Beveled CRT Monitor Widget (@src/components/hero/PixelWorkstationCRT.tsx)', () => {
    it('renders the sculptural monitor bezel with putty tone #D6CFC2 and inner window chrome', () => {
      const html = renderToString(React.createElement(PixelWorkstationCRT));

      // Root testid
      expect(html).toContain('data-testid="hero-portrait"');

      // #D6CFC2 putty monitor bezel
      expect(html).toContain('bg-[#D6CFC2]');
      expect(html).toContain('WATCHKNIGHT // SYS.96 CRT');

      // Window chrome controls [ - ] [ + ] [ x ]
      expect(html).toContain('DEV_WORKSTATION.EXE');
      expect(html).toContain('bg-[#FF2A85]'); // Close control accent

      // Curved #0D1512 dark phosphor screen
      expect(html).toContain('bg-[#0D1512]');
      expect(html).toContain('aspect-[4/3]');
    });

    it('renders the crisp HTML5 2D canvas with pixelated rendering and native 320x240 dimensions', () => {
      const html = renderToString(React.createElement(PixelWorkstationCRT));

      expect(html).toContain('<canvas');
      expect(html).toContain('width="320"');
      expect(html).toContain('height="240"');
      expect(html).toContain('image-rendering:pixelated');
    });

    it('renders the dual-mode portrait switcher button, degauss button, and hardware LEDs', () => {
      const html = renderToString(React.createElement(PixelWorkstationCRT));

      // Mode toggle button
      expect(html).toContain('PHOTO MODE');
      expect(html).toContain('Toggle between 8-bit character sprite and real CRT portrait photo');
      expect(html).toContain('DUAL-MODE PORTRAIT SWITCHER: [ AVATAR: 8-BIT SPRITE | REAL CRT PHOTO ]');
      expect(html).toContain('[8-BIT SPRITE]');

      // Degauss button
      expect(html).toContain('DEGAUSS');

      // Hardware LEDs
      expect(html).toContain('HDD');
      expect(html).toContain('PWR');
      expect(html).toContain('bg-[#4AF626]'); // Green power LED

      // Initial active mode indicator badge
      expect(html).toContain('8-BIT SPRITE');
    });

    it('renders correctly when initialized in photo mode', () => {
      const html = renderToString(React.createElement(PixelWorkstationCRT, { initialMode: 'photo' }));

      // Mode toggle button shows avatar mode target
      expect(html).toContain('AVATAR MODE');
      expect(html).toContain('[REAL CRT PHOTO]');
      expect(html).toContain('Real CRT Portrait Photo of Abdur Rahman Moayed');
    });

    it('renders with controlled avatarAction prop without error', () => {
      const htmlCoding = renderToString(React.createElement(PixelWorkstationCRT, { avatarAction: 'coding' }));
      expect(htmlCoding).toContain('data-testid="hero-portrait"');

      const htmlSlash = renderToString(React.createElement(PixelWorkstationCRT, { avatarAction: 'slash' }));
      expect(htmlSlash).toContain('data-testid="hero-portrait"');
    });

    it('renders station coordinates beneath the monitor', () => {
      const html = renderToString(React.createElement(PixelWorkstationCRT));

      expect(html).toContain('23.7644° N, 90.4252° E');
      expect(html).toContain('Dhaka, BD (UTC+6)');
      expect(html).toContain('SYS.96_ONLINE');
    });
  });
});
