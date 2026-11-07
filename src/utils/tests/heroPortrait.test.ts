import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Hero, HeroPortrait } from '../../components/Hero';

describe('Hero & HeroPortrait Architectural Verification', () => {
  describe('HeroPortrait Component (@src/components/hero/HeroPortrait.tsx)', () => {
    it('renders the double-layered container with background card and foreground image', () => {
      const html = renderToString(React.createElement(HeroPortrait));

      // Container testid
      expect(html).toContain('data-testid="hero-portrait"');

      // Aspect ratio aspect-[3/4]
      expect(html).toContain('aspect-[3/4]');

      // Double-layered container structure
      // 1. Background layer (#12151C rich textured card)
      expect(html).toContain('hero-portrait-bg');
      expect(html).toContain('bg-[#12151C]');

      // 2. Foreground layer (image mask with bottom-up clipPath)
      expect(html).toContain('hero-portrait-img-mask');
      expect(html).toContain('clip-path:inset(100% 0 0 0)');

      // Image source
      expect(html).toContain('src="/image_0.png"');
      expect(html).toContain('Abdur Rahman Moayed');
      expect(html).toContain('@watchknight');
    });

    it('renders the 4 structural corner crosshairs (+ brackets) outside overflow-hidden inner frame to prevent optical clipping', () => {
      const html = renderToString(React.createElement(HeroPortrait));

      // Outer wrapper hosts the crosshairs
      expect(html).toContain('hero-portrait-frame-wrapper');

      // Exposed 1px border on the inner card frame
      expect(html).toContain('border-white/[0.08]');

      // 4 Corner Crosshairs
      expect(html).toContain('data-corner="top-left"');
      expect(html).toContain('data-corner="top-right"');
      expect(html).toContain('data-corner="bottom-left"');
      expect(html).toContain('data-corner="bottom-right"');

      // Corner crosshair SVG lines
      const lineMatches = html.match(/<line/g);
      expect(lineMatches).not.toBeNull();
      // 4 crosshairs * 2 lines each = 8 lines
      expect(lineMatches!.length).toBeGreaterThanOrEqual(8);

      // Verify crosshairs appear BEFORE the inner overflow-hidden frame in DOM order
      const crosshairIdx = html.indexOf('data-corner="top-left"');
      const overflowFrameIdx = html.indexOf('hero-portrait-frame wk-velocity-item');
      expect(crosshairIdx).toBeLessThan(overflowFrameIdx);
    });

    it('renders metadata coordinates and station telemetry with coordinated dividers and brand tokens', () => {
      const html = renderToString(React.createElement(HeroPortrait));

      // Geographic coordinates
      expect(html).toContain('23.7644° N, 90.4252° E');

      // City / Country marker
      expect(html).toContain('Dhaka, BD');

      // Sentinel verification status with neuroaesthetic verdigris signal token
      expect(html).toContain('SYS.CALIBRATED');
      expect(html).toContain('text-wk-verdigris-signal');

      // Stagger markers and coordinated dividers
      expect(html).toContain('hero-portrait-meta-marker');
      expect(html).toContain('hero-portrait-meta-divider');
    });
  });

  describe('Hero 2-Column Swiss-Grid Layout (@src/components/Hero.tsx)', () => {
    it('renders the strict 2-column asymmetrical desktop grid (Col 1-7 vs Col 8-12) with self-stretch', () => {
      const html = renderToString(React.createElement(Hero));

      // 12-column grid layout
      expect(html).toContain('lg:grid-cols-12');

      // Left Column (Col 1-7) with self-stretch to cleanly anchor top and bottom HUDs
      expect(html).toContain('lg:col-span-7');
      expect(html).toContain('self-stretch lg:self-stretch');

      // Right Column (Col 8-12) with grid alignment
      expect(html).toContain('lg:col-span-5');
      expect(html).toContain('lg:items-end');

      // Right column contains HeroPortrait
      expect(html).toContain('data-testid="hero-portrait"');
    });

    it('anchors the typographic display stack with deep expansive tracking in Col 1-7', () => {
      const html = renderToString(React.createElement(Hero));

      // Primary visual typographic stack
      expect(html).toContain('ENGINEERING');
      expect(html).toContain('WHERE');
      expect(html).toContain('LOW-LEVEL');
      expect(html).toContain('SYSTEMS');
      expect(html).toContain('MEET');
      expect(html).toContain('SPATIAL');
      expect(html).toContain('WEB');
      expect(html).toContain('EXPERIENCES.');

      // Expansive tracking per Swiss-grid typography spec
      expect(html).toContain('tracking-[0.04em] lg:tracking-[0.06em]');

      // Terracotta pulse accent on LOW-LEVEL SYSTEMS
      expect(html).toContain('text-wk-terracotta-pulse');

      // Top Status HUD (Availability badge & Coordinates)
      expect(html).toContain('hero-anchor-badge');
      expect(html).toContain('East West University, Bangladesh');
      expect(html).toContain('Available for Systems &amp; Full-Stack Roles');

      // Bottom Telemetry Bar (4 authority metrics)
      expect(html).toContain('hero-telemetry-bar');
      expect(html).toContain('Full-Stack &amp; OS Systems');
      expect(html).toContain('East West University, Dhaka');
      expect(html).toContain('@watchknight');
      expect(html).toContain('Ubuntu Linux / Vite / C++');
    });

    it('renders CTAs, interactive terminal launcher, and full-bleed marquee', () => {
      const html = renderToString(React.createElement(Hero));

      // CTAs
      expect(html).toContain('Explore Flagship Case Studies');
      expect(html).toContain('Launch Interactive Terminal');
      expect(html).toContain('Ctrl + ~');
      expect(html).toContain('Resume (PDF)');

      // Giant full-bleed marquee
      expect(html).toContain('hero-marquee-wrap');
      expect(html).toContain('ABDUR RAHMAN MOAYED');
      expect(html).toContain('FULL-STACK ARCHITECT');
      expect(html).toContain('SYSTEMS ENGINEER');
    });
  });

  describe('HeroPortrait WebGL Fluid Displacement & Shader Invariants', () => {
    it('renders the interactive WebGL canvas inside hero-portrait-img-mask alongside semantic image fallback', () => {
      const html = renderToString(React.createElement(HeroPortrait));

      // Canvas element present for WebGL fluid displacement
      expect(html).toContain('data-testid="hero-portrait-canvas"');
      expect(html).toContain('aria-hidden="true"');

      // Both canvas and accessible fallback image are rendered inside img-mask
      const maskIdx = html.indexOf('hero-portrait-img-mask');
      const canvasIdx = html.indexOf('data-testid="hero-portrait-canvas"');
      const imgIdx = html.indexOf('<img');

      expect(maskIdx).toBeGreaterThan(0);
      expect(canvasIdx).toBeGreaterThan(maskIdx);
      expect(imgIdx).toBeGreaterThan(maskIdx);
    });

    it('verifies custom GLSL shaders enforce fluid displacement, chromatic aberration, audio-reactive pulses, and 0.04 lens noise', async () => {
      // Import GLSL shader code
      const vertShader = (await import('../../shaders/heroPortrait.vert.glsl?raw')).default;
      const fragShader = (await import('../../shaders/heroPortrait.frag.glsl?raw')).default;

      // Vertex shader essentials
      expect(vertShader).toContain('varying vec2 vUv;');
      expect(vertShader).toContain('gl_Position');

      // Fragment shader: Fluid displacement uniforms
      expect(fragShader).toContain('uniform sampler2D uTexture;');
      expect(fragShader).toContain('uniform vec2 uPlaneResolution;');
      expect(fragShader).toContain('uniform vec2 uImageResolution;');
      expect(fragShader).toContain('uniform vec2 uMouse;');
      expect(fragShader).toContain('uniform vec2 uMouseVelocity;');
      expect(fragShader).toContain('uniform float uVelocityMag;');
      expect(fragShader).toContain('uniform float uHover;');

      // Fragment shader: Spatial audio reactivity
      expect(fragShader).toContain('uniform float uBeatPulse;');
      expect(fragShader).toContain('uniform float uAudioBass;');

      // 1. Fluid Mouse Ripple Displacement with uMouseVelocity & Type-Safe Simplex Noise
      expect(fragShader).toContain('rippleWave');
      expect(fragShader).toContain('snoise'); // 2D Simplex noise for fluid flow
      expect(fragShader).toContain('uMouseVelocity *'); // uMouseVelocity explicitly integrated into fluid flow
      // GLSL ES 1.0 type-safety: vec2 + vec2 (no invalid vec2 + float implicit cast)
      expect(fragShader).not.toMatch(/snoise\(vUv \* 4\.5 \+ uTime/);
      expect(fragShader).toContain('vec2(uTime * 0.45)');

      // Fluid displacement fades out when mouse is at rest (no permanent uHover wobble)
      expect(fragShader).not.toMatch(/fluidIntensity\s*=\s*[^;]*uHover/);

      // 2. Focus Chromatic Aberration near edges (splitting red vs cyan)
      expect(fragShader).toContain('chromaStrength');
      expect(fragShader).toContain('chromaOffset');
      expect(fragShader).toContain('texture2D(uTexture, uvR)');
      expect(fragShader).toContain('texture2D(uTexture, uvB)');

      // 3. Audio-reactive concentric wave distortion
      expect(fragShader).toContain('beatWave');
      expect(fragShader).toContain('beatDisplacement');

      // 4. Analog camera lens noise / film grain at low 0.04 opacity (GLSL 1.0 type-safe)
      expect(fragShader).toContain('0.04');
      expect(fragShader).toContain('grainNoise');
      expect(fragShader).toContain('vec2(fract(uTime');

      // 5. Neuroaesthetic Palette Alignment & Edge Vignette
      expect(fragShader).toContain('C_OBSIDIAN_VOID');
      expect(fragShader).toContain('C_TERRACOTTA');
      expect(fragShader).toContain('getCoverUv'); // object-cover object-[center_20%] mapping
    });

    it('enforces mobile parallax scale fallback and zero-allocation setter architecture', async () => {
      const tsCode = (await import('../../components/hero/HeroPortrait.tsx?raw')).default;

      // Zero-allocation pointer tracking: No gsap.to inside handlePointerMove
      const handlePointerMoveBody = tsCode.substring(
        tsCode.indexOf('handlePointerMove ='),
        tsCode.indexOf('handlePointerLeave =')
      );
      expect(handlePointerMoveBody).not.toContain('gsap.to(');
      expect(handlePointerMoveBody).not.toContain('gsap.set(');
      expect(handlePointerMoveBody).toContain('quickToVelocityMagRef.current?.(0)');

      // Mobile / Touch devices fallback: Clean CSS/GSAP parallax scale
      expect(tsCode).toContain('(max-width: 1023px)');
      expect(tsCode).toContain('scale: 1.04');

      // Outer frame wrapper magnetic tracking
      expect(tsCode).toContain('ref={frameWrapperRef}');
      expect(tsCode).toContain('quickToWrapperX?.');
    });
  });
});
