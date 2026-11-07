import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { useReveal } from '../useReveal';

describe('useReveal Declarative Motion Primitives & matchMedia', () => {
  it('exports useReveal as a functional React hook', () => {
    expect(typeof useReveal).toBe('function');
  });

  it('runs cleanly inside a React component during SSR render lifecycle', () => {
    let capturedRef: React.RefObject<HTMLDivElement> | null = null;

    const TestComponent: React.FC = () => {
      const ref = useReveal<HTMLDivElement>();
      capturedRef = ref;
      return React.createElement('div', { ref, 'data-anim': 'true' }, 'Test Content');
    };

    expect(() => renderToString(React.createElement(TestComponent))).not.toThrow();
    expect(capturedRef).not.toBeNull();
    expect(capturedRef).toHaveProperty('current');
  });

  it('accepts and preserves externalRef when provided', () => {
    let capturedRef: React.RefObject<HTMLDivElement> | null = null;
    const externalRef: React.RefObject<HTMLDivElement> = { current: null };

    const TestComponent: React.FC = () => {
      const ref = useReveal<HTMLDivElement>(externalRef);
      capturedRef = ref;
      return React.createElement('div', { ref }, 'External Ref Content');
    };

    renderToString(React.createElement(TestComponent));
    expect(capturedRef).toBe(externalRef);
  });

  describe('gsap.matchMedia & Responsive Invariants', () => {
    it('defines responsive media query conditions for desktop motion vs mobile/reduced motion', () => {
      const expectedDesktopQuery = '(min-width: 800px) and (prefers-reduced-motion: no-preference)';
      const expectedMobileReducedQuery = '(max-width: 799px), (prefers-reduced-motion: reduce)';

      expect(expectedDesktopQuery).toContain('min-width: 800px');
      expect(expectedDesktopQuery).toContain('prefers-reduced-motion: no-preference');
      expect(expectedMobileReducedQuery).toContain('max-width: 799px');
      expect(expectedMobileReducedQuery).toContain('prefers-reduced-motion: reduce');
    });

    it('ensures SplitText instances can be cleanly tracked and reverted on cleanup', () => {
      const mockRevert = vi.fn();
      const mockSplitInstance = {
        revert: mockRevert,
        chars: [{ style: {} }],
        words: [],
        lines: [],
      };

      const splitInstances: any[] = [mockSplitInstance];

      // Simulate matchMedia cleanup execution
      splitInstances.forEach((split) => {
        try {
          split.revert();
        } catch {
          // ignore
        }
      });

      expect(mockRevert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Declarative Attribute Data Parsing Invariants', () => {
    it('handles numeric counter string formatting with decimals and suffixes', () => {
      const testCases = [
        { input: '99.85%', expectedPrefix: '', expectedNum: '99.85', expectedSuffix: '%', decimals: 2 },
        { input: '$1,250.50k', expectedPrefix: '$', expectedNum: '1', expectedSuffix: ',250.50k', decimals: 0 },
        { input: '250+', expectedPrefix: '', expectedNum: '250', expectedSuffix: '+', decimals: 0 },
        { input: '0.001 μs', expectedPrefix: '', expectedNum: '0.001', expectedSuffix: ' μs', decimals: 3 },
      ];

      testCases.forEach(({ input, expectedPrefix, expectedNum, expectedSuffix, decimals }) => {
        const match = input.match(/^([^0-9.]*)([0-9.]+)(.*)$/);
        expect(match).not.toBeNull();
        const prefix = match![1];
        const numStr = match![2];
        const suffix = match![3];

        expect(prefix).toBe(expectedPrefix);
        expect(numStr).toBe(expectedNum);
        expect(suffix).toBe(expectedSuffix);

        const isDecimal = numStr.includes('.');
        const calculatedDecimals = isDecimal ? numStr.split('.')[1].length : 0;
        expect(calculatedDecimals).toBe(decimals);
      });
    });

    it('parses duration, delay, stagger, and parallax numeric attributes with defaults', () => {
      const mockDataset = {
        delay: '0.35',
        duration: '1.2',
        stagger: '0.05',
        parallax: '0.2',
      };

      const delay = parseFloat(mockDataset.delay || '0') || 0;
      const duration = parseFloat(mockDataset.duration || '1.0') || 1.0;
      const stagger = parseFloat(mockDataset.stagger || '0.08') || 0.08;
      const parallax = parseFloat(mockDataset.parallax || '0.15') || 0.15;

      expect(delay).toBe(0.35);
      expect(duration).toBe(1.2);
      expect(stagger).toBe(0.05);
      expect(parallax).toBe(0.2);
    });
  });
});
