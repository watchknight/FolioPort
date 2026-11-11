import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CRTBootSequence } from '../../components/CRTBootSequence';

describe('FAST 90S CRT POWER-ON & BIOS BOOT SEQUENCE (src/components/CRTBootSequence.tsx)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the 350ms CSS clip-path wipe container and central light beam flare (#c2cdb4)', () => {
    const html = renderToString(React.createElement(CRTBootSequence));

    // Outer container with 350ms clip-path wipe class
    expect(html).toContain('data-testid="crt-boot-sequence"');
    expect(html).toContain('crt-boot-beam-wipe');
    expect(html).toContain('@keyframes crtBeamExpandWipe');
    expect(html).toContain('350ms');

    // Central thin horizontal #c2cdb4 light beam
    expect(html).toContain('data-testid="crt-light-beam"');
    expect(html).toContain('bg-[#c2cdb4]');
    expect(html).toContain('h-[2px]');
    expect(html).toContain('crt-center-flare');
  });

  it('renders 90s BIOS memory check with East West University, 640K Base Memory OK, and Loading Portfolio...', () => {
    const html = renderToString(React.createElement(CRTBootSequence));

    expect(html).toContain('data-testid="crt-bios-text"');
    expect(html).toContain('East West University');
    expect(html).toContain('640K Base Memory OK');
    expect(html).toContain('Loading Portfolio...');
  });

  it('provides instant Press any key or click to skip bypass button and banner with touch target >= 44px', () => {
    const html = renderToString(React.createElement(CRTBootSequence));

    expect(html).toContain('data-testid="crt-boot-skip-btn"');
    expect(html).toContain('Press any key or click to skip');
    expect(html).toContain('min-h-[44px]');
  });

  it('respects prefers-reduced-motion CSS fallback', () => {
    const html = renderToString(React.createElement(CRTBootSequence));

    expect(html).toContain('@media (prefers-reduced-motion: reduce)');
    expect(html).toContain('clip-path: none !important');
    expect(html).toContain('animation: none !important');
  });
});
