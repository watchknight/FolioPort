import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  cielabLightness,
  lightnessDelta,
  isNeutralBuffer,
  assertAlabasterContrast,
  validateChromostereopsisSafety,
  verifyNeuroaestheticSystem,
  assertDesignSystemInvariants,
  WK_TOKENS
} from '../colorErgonomics';

describe('@watchknight Color Ergonomics & Neuroaesthetic Token Engine', () => {
  describe('sRGB parsing & WCAG 2.1 Relative Luminance', () => {
    it('parses 3-character and 6-character hex values accurately', () => {
      expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#090A0D')).toEqual({ r: 9, g: 10, b: 13 });
      expect(hexToRgb('B84A27')).toEqual({ r: 184, g: 74, b: 39 });
    });

    it('throws descriptive errors on invalid hex strings', () => {
      expect(() => hexToRgb('invalid')).toThrow();
      expect(() => hexToRgb('#ZZZ')).toThrow();
      expect(() => hexToRgb('#12345')).toThrow();
      expect(() => hexToRgb('#12g456')).toThrow();
      expect(() => hexToRgb('#12345g')).toThrow();
    });

    it('computes correct relative luminance for black, white, and core tokens', () => {
      expect(relativeLuminance('#000000')).toBeCloseTo(0, 4);
      expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 4);

      // --wk-obsidian-void should be ultra-deep black (~0.003)
      const lObsidian = relativeLuminance(WK_TOKENS.OBSIDIAN_VOID);
      expect(lObsidian).toBeGreaterThan(0.002);
      expect(lObsidian).toBeLessThan(0.005);

      // --wk-alabaster-ink should be high-luminance warm paper white (~0.866)
      const lAlabaster = relativeLuminance(WK_TOKENS.ALABASTER_INK);
      expect(lAlabaster).toBeGreaterThan(0.85);
      expect(lAlabaster).toBeLessThan(0.90);
    });
  });

  describe('WCAG 2.1 Contrast Ratios & 14:1 AAA Rule', () => {
    it('computes pure black to pure white contrast as 21:1', () => {
      const ratio = contrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21.0, 1);
    });

    it('asserts that --wk-alabaster-ink over --wk-obsidian-void achieves >= 14:1 contrast', () => {
      const ratio = contrastRatio(WK_TOKENS.ALABASTER_INK, WK_TOKENS.OBSIDIAN_VOID);
      expect(ratio).toBeGreaterThanOrEqual(14.0);
      expect(ratio).toBeCloseTo(17.28, 1);

      const check = assertAlabasterContrast();
      expect(check.pass).toBe(true);
      expect(check.ratio).toBeGreaterThanOrEqual(14.0);
    });

    it('asserts that --wk-ash-muted maintains readable secondary contrast', () => {
      const ratio = contrastRatio(WK_TOKENS.ASH_MUTED, WK_TOKENS.OBSIDIAN_VOID);
      // Ash muted should maintain at least 4.5:1 text readability over dark canvas
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  describe('CIE 1976 L* Lightness Calculation', () => {
    it('maps pure black to L* = 0 and pure white to L* = 100', () => {
      expect(cielabLightness('#000000')).toBeCloseTo(0, 1);
      expect(cielabLightness('#FFFFFF')).toBeCloseTo(100, 1);
    });

    it('computes perceptual lightness stops for all 6 neuroaesthetic tokens', () => {
      const lObsidian = cielabLightness(WK_TOKENS.OBSIDIAN_VOID);
      const lSlate = cielabLightness(WK_TOKENS.SLATE_SURFACE);
      const lAsh = cielabLightness(WK_TOKENS.ASH_MUTED);
      const lTerracotta = cielabLightness(WK_TOKENS.TERRACOTTA_PULSE);
      const lVerdigris = cielabLightness(WK_TOKENS.VERDIGRIS_SIGNAL);
      const lAlabaster = cielabLightness(WK_TOKENS.ALABASTER_INK);

      // Obsidian Void: deep resting zone (L* ~ 2.7)
      expect(lObsidian).toBeLessThan(5);
      // Slate Surface: elevated telemetry HUD (L* ~ 7.3)
      expect(lSlate).toBeGreaterThan(lObsidian);
      expect(lSlate).toBeLessThan(12);
      // Terracotta Pulse: mid-range focal anchor (L* ~ 45.9)
      expect(lTerracotta).toBeGreaterThan(40);
      expect(lTerracotta).toBeLessThan(50);
      // Ash Muted: secondary metadata (L* ~ 53.5)
      expect(lAsh).toBeGreaterThan(50);
      expect(lAsh).toBeLessThan(60);
      // Verdigris Signal: active telemetry status (L* ~ 58.2)
      expect(lVerdigris).toBeGreaterThan(55);
      expect(lVerdigris).toBeLessThan(65);
      // Alabaster Ink: primary typography (L* ~ 94.6)
      expect(lAlabaster).toBeGreaterThan(90);
    });
  });

  describe('Chromostereopsis Safety & >= 35 L* Delta Invariant', () => {
    it('verifies Terracotta Pulse against Obsidian Void maintains >= 35 L* delta', () => {
      const delta = lightnessDelta(WK_TOKENS.TERRACOTTA_PULSE, WK_TOKENS.OBSIDIAN_VOID);
      expect(delta).toBeGreaterThanOrEqual(35.0);
      expect(delta).toBeCloseTo(43.2, 0);

      const safety = validateChromostereopsisSafety(
        WK_TOKENS.TERRACOTTA_PULSE,
        WK_TOKENS.OBSIDIAN_VOID
      );
      expect(safety.isSafe).toBe(true);
      expect(safety.deltaL).toBeGreaterThanOrEqual(35);
    });

    it('verifies Terracotta Pulse against Slate Surface maintains >= 35 L* delta', () => {
      const delta = lightnessDelta(WK_TOKENS.TERRACOTTA_PULSE, WK_TOKENS.SLATE_SURFACE);
      expect(delta).toBeGreaterThanOrEqual(35.0);
      expect(delta).toBeCloseTo(39.2, 0);

      const safety = validateChromostereopsisSafety(
        WK_TOKENS.TERRACOTTA_PULSE,
        WK_TOKENS.SLATE_SURFACE
      );
      expect(safety.isSafe).toBe(true);
      expect(safety.deltaL).toBeGreaterThanOrEqual(35);
    });

    it('verifies Terracotta Pulse against Alabaster Ink maintains >= 35 L* delta', () => {
      const delta = lightnessDelta(WK_TOKENS.TERRACOTTA_PULSE, WK_TOKENS.ALABASTER_INK);
      expect(delta).toBeGreaterThanOrEqual(35.0);
      expect(delta).toBeCloseTo(48.6, 0);

      const safety = validateChromostereopsisSafety(
        WK_TOKENS.TERRACOTTA_PULSE,
        WK_TOKENS.ALABASTER_INK
      );
      expect(safety.isSafe).toBe(true);
      expect(safety.deltaL).toBeGreaterThanOrEqual(35);
    });

    it('identifies neutral buffer tokens correctly', () => {
      expect(isNeutralBuffer('#090A0D')).toBe(true);
      expect(isNeutralBuffer('#090a0d')).toBe(true);
      expect(isNeutralBuffer('#F2EFE9')).toBe(true);
      expect(isNeutralBuffer('#f2efe9')).toBe(true);
      expect(isNeutralBuffer('#B84A27')).toBe(false);
      expect(isNeutralBuffer('#0044FF')).toBe(false);
    });

    it('fails chromostereopsis safety for unbuffered saturated blue touching terracotta', () => {
      // Saturated blue with L* around 30-40 (delta L* < 35 with terracotta L* ~45.9)
      const saturatedBlue = '#0044FF';
      const unbuffered = validateChromostereopsisSafety(
        WK_TOKENS.TERRACOTTA_PULSE,
        saturatedBlue,
        { hasNeutralBuffer: false }
      );
      expect(unbuffered.isSafe).toBe(false);
      expect(unbuffered.deltaL).toBeLessThan(35);
      expect(unbuffered.reason).toContain('HAZARD');
    });

    it('passes chromostereopsis safety when neutral buffering is applied to saturated cool hues', () => {
      const saturatedBlue = '#0044FF';
      const buffered = validateChromostereopsisSafety(
        WK_TOKENS.TERRACOTTA_PULSE,
        saturatedBlue,
        { hasNeutralBuffer: true }
      );
      expect(buffered.isSafe).toBe(true);
      expect(buffered.buffered).toBe(true);
      expect(buffered.reason).toContain('SAFE');
    });
  });

  describe('Full Neuroaesthetic System Verification', () => {
    it('executes master verifyNeuroaestheticSystem and passes all design assertions', () => {
      const result = verifyNeuroaestheticSystem();
      expect(result.passed).toBe(true);
      expect(result.assertions.length).toBeGreaterThanOrEqual(5);

      result.assertions.forEach((assertion) => {
        expect(assertion.pass).toBe(true);
      });
    });

    it('assertDesignSystemInvariants executes cleanly without throwing for valid palette', () => {
      expect(() => assertDesignSystemInvariants()).not.toThrow();
    });
  });
});
