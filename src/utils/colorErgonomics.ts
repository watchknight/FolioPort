/**
 * @watchknight Color Ergonomics & Neuroaesthetic Token Engine
 * 
 * Implements WCAG 2.1 relative luminance, CIE L* lightness stops,
 * and Chromostereopsis safety verification for the @watchknight portfolio.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export const WK_TOKENS = {
  OBSIDIAN_VOID: '#090A0D',
  SLATE_SURFACE: '#12151C',
  ALABASTER_INK: '#F2EFE9',
  ASH_MUTED: '#7A808C',
  TERRACOTTA_PULSE: '#B84A27',
  VERDIGRIS_SIGNAL: '#4E9A7F',
} as const;

export type WkTokenKey = keyof typeof WK_TOKENS;

/**
 * Parses hex color strings (#RGB, #RRGGBB) to 0..255 sRGB components.
 */
export function hexToRgb(hex: string): RgbColor {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return { r, g, b };
}

/**
 * Converts sRGB channel [0..255] to linear light space per WCAG 2.1 specification.
 */
function sRgbToLinear(c255: number): number {
  const s = c255 / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Computes WCAG 2.1 relative luminance for sRGB color.
 * Returns float in range [0, 1].
 */
export function relativeLuminance(color: string | RgbColor): number {
  const rgb = typeof color === 'string' ? hexToRgb(color) : color;
  const rLin = sRgbToLinear(rgb.r);
  const gLin = sRgbToLinear(rgb.g);
  const bLin = sRgbToLinear(rgb.b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Computes WCAG 2.1 contrast ratio between two colors: (L1 + 0.05) / (L2 + 0.05).
 * Always returns a value >= 1.0.
 */
export function contrastRatio(colorA: string | RgbColor, colorB: string | RgbColor): number {
  const l1 = relativeLuminance(colorA);
  const l2 = relativeLuminance(colorB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Computes CIE 1976 L* lightness from relative luminance Y (assuming D65 normalized Y_n = 1.0).
 * Standard CIE formula:
 * f(t) = t > (6/29)^3 ? t^(1/3) : (t / (3*(6/29)^2)) + 4/29
 * L* = 116 * f(Y) - 16
 * Returns float in range [0, 100].
 */
export function cielabLightness(color: string | RgbColor): number {
  const y = relativeLuminance(color);
  const delta = 6 / 29;
  const delta3 = delta * delta * delta; // ~0.00885645167

  const f = y > delta3 ? Math.cbrt(y) : y / (3 * delta * delta) + 4 / 29;
  return Math.max(0, Math.min(100, 116 * f - 16));
}

/**
 * Computes absolute perceptual lightness delta (|L1* - L2*|) between two colors.
 */
export function lightnessDelta(colorA: string | RgbColor, colorB: string | RgbColor): number {
  return Math.abs(cielabLightness(colorA) - cielabLightness(colorB));
}

/**
 * Checks whether a given color hex is one of the verified neutral buffers:
 * #090A0D (--wk-obsidian-void) or #F2EFE9 (--wk-alabaster-ink).
 */
export function isNeutralBuffer(hex: string): boolean {
  const clean = hex.trim().toUpperCase().replace(/^#/, '');
  const obsidian = WK_TOKENS.OBSIDIAN_VOID.replace(/^#/, '').toUpperCase();
  const alabaster = WK_TOKENS.ALABASTER_INK.replace(/^#/, '').toUpperCase();
  return clean === obsidian || clean === alabaster;
}

/**
 * Asserts that --wk-alabaster-ink maintains >= 14:1 contrast ratio over --wk-obsidian-void.
 * WCAG AAA requires >= 7:1; @watchknight Neuroaesthetic specification mandates >= 14:1.
 */
export function assertAlabasterContrast(): {
  pass: boolean;
  ratio: number;
  minRequired: number;
  message: string;
} {
  const ratio = contrastRatio(WK_TOKENS.ALABASTER_INK, WK_TOKENS.OBSIDIAN_VOID);
  const minRequired = 14.0;
  const pass = ratio >= minRequired;
  return {
    pass,
    ratio: Math.round(ratio * 100) / 100,
    minRequired,
    message: pass
      ? `PASS: Alabaster Ink over Obsidian Void achieves ${ratio.toFixed(2)}:1 contrast (>= ${minRequired}:1 required).`
      : `FAIL: Alabaster Ink contrast ${ratio.toFixed(2)}:1 is below required ${minRequired}:1.`
  };
}

/**
 * Validates Chromostereopsis safety when warm accents (--wk-terracotta-pulse)
 * are placed in proximity to cool/dark surfaces.
 * 
 * Rules:
 * 1. Warm focal accents must either maintain >= 35 L* lightness delta, OR
 * 2. Be buffered by neutral borders (#090A0D or #F2EFE9).
 */
export function validateChromostereopsisSafety(
  warmHex: string,
  coolHex: string,
  options: { hasNeutralBuffer?: boolean } = {}
): {
  isSafe: boolean;
  deltaL: number;
  minRequiredDelta: number;
  buffered: boolean;
  reason: string;
} {
  const deltaL = lightnessDelta(warmHex, coolHex);
  const minRequiredDelta = 35.0;
  const isLightnessSafe = deltaL >= minRequiredDelta;
  const isNeutralBuffered = !!options.hasNeutralBuffer || isNeutralBuffer(coolHex);

  const isSafe = isLightnessSafe || isNeutralBuffered;

  let reason = '';
  if (isLightnessSafe) {
    reason = `SAFE: Lightness delta ΔL* = ${deltaL.toFixed(2)} meets or exceeds ${minRequiredDelta} stop threshold.`;
  } else if (isNeutralBuffered) {
    reason = `SAFE: Lightness delta ΔL* = ${deltaL.toFixed(2)} (< ${minRequiredDelta}), but protected by neutral buffer (${options.hasNeutralBuffer ? 'explicit border' : coolHex}).`;
  } else {
    reason = `HAZARD: Warm accent (${warmHex}) adjacent to cool surface (${coolHex}) with ΔL* = ${deltaL.toFixed(2)} (< ${minRequiredDelta}) without neutral border buffer. High chromostereopsis fatigue risk.`;
  }

  return {
    isSafe,
    deltaL: Math.round(deltaL * 100) / 100,
    minRequiredDelta,
    buffered: isNeutralBuffered,
    reason,
  };
}

/**
 * Master Neuroaesthetic System Verification Suite.
 * Asserts all palette invariants defined in @GEMINI.md:
 * - Alabaster on Obsidian contrast >= 14:1
 * - Terracotta on Obsidian lightness delta >= 35
 * - Terracotta on Slate Surface lightness delta >= 35
 * - Terracotta on Alabaster lightness delta >= 35
 * - Cool hue boundary buffer compliance
 */
export function verifyNeuroaestheticSystem(): {
  passed: boolean;
  assertions: Array<{ name: string; pass: boolean; details: string }>;
} {
  const assertions: Array<{ name: string; pass: boolean; details: string }> = [];

  // Assertion 1: Alabaster AAA Contrast
  const alabasterCheck = assertAlabasterContrast();
  assertions.push({
    name: 'Alabaster-on-Obsidian Contrast (>= 14:1)',
    pass: alabasterCheck.pass,
    details: alabasterCheck.message,
  });

  // Assertion 2: Terracotta on Obsidian Void Lightness Delta
  const terracottaObsidian = validateChromostereopsisSafety(
    WK_TOKENS.TERRACOTTA_PULSE,
    WK_TOKENS.OBSIDIAN_VOID
  );
  assertions.push({
    name: 'Terracotta-on-Obsidian Void Lightness Delta (>= 35 L*)',
    pass: terracottaObsidian.isSafe && terracottaObsidian.deltaL >= 35,
    details: `ΔL* = ${terracottaObsidian.deltaL} (L* Terracotta: ${cielabLightness(WK_TOKENS.TERRACOTTA_PULSE).toFixed(2)}, L* Obsidian: ${cielabLightness(WK_TOKENS.OBSIDIAN_VOID).toFixed(2)})`,
  });

  // Assertion 3: Terracotta on Slate Surface Lightness Delta
  const terracottaSlate = validateChromostereopsisSafety(
    WK_TOKENS.TERRACOTTA_PULSE,
    WK_TOKENS.SLATE_SURFACE
  );
  assertions.push({
    name: 'Terracotta-on-Slate Surface Lightness Delta (>= 35 L*)',
    pass: terracottaSlate.isSafe && terracottaSlate.deltaL >= 35,
    details: `ΔL* = ${terracottaSlate.deltaL} (L* Terracotta: ${cielabLightness(WK_TOKENS.TERRACOTTA_PULSE).toFixed(2)}, L* Slate: ${cielabLightness(WK_TOKENS.SLATE_SURFACE).toFixed(2)})`,
  });

  // Assertion 4: Terracotta on Alabaster Lightness Delta
  const terracottaAlabaster = validateChromostereopsisSafety(
    WK_TOKENS.TERRACOTTA_PULSE,
    WK_TOKENS.ALABASTER_INK
  );
  assertions.push({
    name: 'Terracotta-on-Alabaster Lightness Delta (>= 35 L*)',
    pass: terracottaAlabaster.isSafe && terracottaAlabaster.deltaL >= 35,
    details: `ΔL* = ${terracottaAlabaster.deltaL} (L* Terracotta: ${cielabLightness(WK_TOKENS.TERRACOTTA_PULSE).toFixed(2)}, L* Alabaster: ${cielabLightness(WK_TOKENS.ALABASTER_INK).toFixed(2)})`,
  });

  // Assertion 5: Neutral Buffer Verification
  const bufferTestPass = isNeutralBuffer(WK_TOKENS.OBSIDIAN_VOID) && isNeutralBuffer(WK_TOKENS.ALABASTER_INK);
  assertions.push({
    name: 'Neutral Buffer Token Verification',
    pass: bufferTestPass,
    details: 'Both Obsidian Void (#090A0D) and Alabaster Ink (#F2EFE9) registered as valid neutral buffers.',
  });

  // Assertion 6: Saturated Blue Hazard Protection
  // Simulate saturated blue (#0044FF) with delta L* < 35 against terracotta
  const saturatedBlue = '#0044FF';
  const unbufferedBlueCheck = validateChromostereopsisSafety(
    WK_TOKENS.TERRACOTTA_PULSE,
    saturatedBlue,
    { hasNeutralBuffer: false }
  );
  const bufferedBlueCheck = validateChromostereopsisSafety(
    WK_TOKENS.TERRACOTTA_PULSE,
    saturatedBlue,
    { hasNeutralBuffer: true }
  );
  const bufferEnforcementWorks = !unbufferedBlueCheck.isSafe && bufferedBlueCheck.isSafe;
  assertions.push({
    name: 'Chromostereopsis Hazard Detection & Neutral Buffer Protection',
    pass: bufferEnforcementWorks,
    details: bufferEnforcementWorks
      ? 'Correctly flags unbuffered saturated blue as chromostereopsis hazard and approves neutral-buffered boundary.'
      : 'Chromostereopsis guard did not correctly distinguish unbuffered vs buffered conditions.',
  });

  const passed = assertions.every((a) => a.pass);
  return { passed, assertions };
}

/**
 * Asserts all neuroaesthetic design system invariants and throws an Error
 * if any assertion fails. Designed for build-time and CI verification pipelines.
 */
export function assertDesignSystemInvariants(): void {
  const result = verifyNeuroaestheticSystem();
  if (!result.passed) {
    const failures = result.assertions
      .filter((a) => !a.pass)
      .map((a) => `[${a.name}]: ${a.details}`)
      .join('\n');
    throw new Error(
      `@watchknight Neuroaesthetic Design System Violation(s):\n${failures}`
    );
  }
}

