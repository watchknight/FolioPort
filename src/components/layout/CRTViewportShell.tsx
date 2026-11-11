import React, { useState, useEffect, useCallback } from 'react';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export type CrtFxMode = 'FULL' | 'LITE' | 'OFF';

interface CRTViewportShellProps {
  children: React.ReactNode;
}

export const CRTViewportShell: React.FC<CRTViewportShellProps> = ({ children }) => {
  const [fxMode, setFxMode] = useState<CrtFxMode>(() => {
    if (typeof window === 'undefined') return 'FULL';
    // Accessibility check: default to OFF if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return 'OFF';

    const saved = localStorage.getItem('wk_crt_fx_mode') as CrtFxMode | null;
    return saved === 'FULL' || saved === 'LITE' || saved === 'OFF' ? saved : 'FULL';
  });

  const [isDegaussing, setIsDegaussing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('wk_crt_fx_mode', fxMode);
      document.documentElement.setAttribute('data-crt-fx', fxMode);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wk-crt-fx-change', { detail: { mode: fxMode } }));
      }
    } catch {
      // Safe fallback if localStorage is disabled
    }
  }, [fxMode]);

  const cycleFxMode = useCallback(() => {
    setFxMode((prev) => {
      const next: CrtFxMode = prev === 'FULL' ? 'LITE' : prev === 'LITE' ? 'OFF' : 'FULL';
      watchknightAudio.play8BitBlip(next === 'FULL' ? 980 : next === 'LITE' ? 660 : 440);
      return next;
    });
  }, []);

  const triggerDegauss = useCallback(() => {
    if (isDegaussing) return;
    setIsDegaussing(true);
    watchknightAudio.play8BitBlip(220);
    watchknightAudio.playTransitionSwoosh(0.5);

    setTimeout(() => {
      setIsDegaussing(false);
    }, 450);
  }, [isDegaussing]);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--crt-void-bg, #070814)' }}
    >
      {/* Sleek 4px Hardware Bezel framing the entire viewport */}
      <div
        className="fixed inset-0 pointer-events-none z-[9998] border-4 border-[#131629] select-none transition-colors duration-300"
        style={{ borderColor: 'var(--crt-panel-slate, #131629)' }}
        aria-hidden="true"
      />

      {/* Main Inner CRT Viewport Container */}
      <div
        className={`relative flex-1 flex flex-col overflow-x-hidden transition-all duration-300 ${
          fxMode === 'FULL'
            ? 'crt-screen-curved shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]'
            : ''
        } ${isDegaussing ? 'animate-pulse filter hue-rotate-90 brightness-125' : ''}`}
        style={{
          backgroundColor: 'var(--crt-void-bg, #070814)',
        }}
      >
        {/* Soft Repeating Scanline Overlay:
            strictly capped between 0.04 and 0.08 opacity for optical safety & accessibility */}
        {fxMode !== 'OFF' && (
          <div
            className="fixed inset-0 pointer-events-none z-[9995] select-none crt-scanlines transition-opacity duration-300"
            style={{
              opacity: fxMode === 'FULL' ? 0.065 : 0.04,
            }}
            aria-hidden="true"
          />
        )}

        {/* CRT Cathode Glass Vignette & Corner Phosphor Bloom */}
        {fxMode === 'FULL' && (
          <div
            className="fixed inset-0 pointer-events-none z-[9994] select-none transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 65%, rgba(0, 0, 0, 0.45) 90%, rgba(0, 0, 0, 0.8) 100%)',
            }}
            aria-hidden="true"
          />
        )}

        {/* Subtle Curved Inner Screen Border (Accessibility Safe Barrel Distortion <= 0.04) */}
        {fxMode === 'FULL' && (
          <div
            className="fixed inset-0 pointer-events-none z-[9993] border-4 border-[#2D3645]/30 rounded-[18px] shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] select-none"
            aria-hidden="true"
          />
        )}

        {/* Screen Content Wrapper with 52px top and 28px bottom clearances */}
        <div className="relative z-10 flex-1 flex flex-col pt-[52px] pb-[28px]">
          {children}
        </div>
      </div>

      {/* Ultra-slim 90s Monitor Bottom Hardware Chin (height: 28px) */}
      <aside
        className="fixed bottom-0 left-0 right-0 h-[28px] z-[9996] pointer-events-auto border-t px-3 sm:px-6 flex items-center justify-between gap-3 text-xs font-mono select-none transition-colors duration-300"
        style={{
          backgroundColor: 'var(--crt-panel-slate, #131629)',
          borderColor: 'var(--crt-bezel-shadow, #2D3645)',
        }}
        aria-label="90s CRT Monitor Hardware Control Panel"
      >
        {/* Left: WATCHKNIGHT MULTISYNC 17" */}
        <div className="flex items-center gap-2">
          <span
            className="font-pixel text-[9px] sm:text-[10px] font-bold tracking-wider"
            style={{ color: 'var(--pixel-ivory-text, #F0EFE6)' }}
          >
            WATCHKNIGHT
          </span>
          <span
            className="px-1.5 py-0.5 text-[8px] font-pixel tracking-tight"
            style={{
              backgroundColor: 'var(--crt-phosphor-dark, #0D1512)',
              color: 'var(--tech-cyan-wave, #00F0FF)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            MULTISYNC 17"
          </span>
        </div>

        {/* Center: [ DEGAUSS ] */}
        <button
          type="button"
          onClick={triggerDegauss}
          disabled={isDegaussing}
          className="px-2 py-0.5 text-[8px] font-pixel border active:scale-95 transition-all"
          style={{
            backgroundColor: 'var(--crt-phosphor-dark, #0D1512)',
            color: 'var(--tech-cyan-wave, #00F0FF)',
            borderColor: 'var(--crt-bezel-shadow, #2D3645)',
          }}
          title="Degauss CRT Electron Guns"
        >
          Degauss
        </button>

        {/* Right: CRT FX: FULL / LITE / OFF & Glowing Power LED */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cycleFxMode}
            className="flex items-center gap-1 px-2 py-0.5 font-pixel text-[8px] uppercase transition-all border"
            style={{
              backgroundColor: 'var(--crt-phosphor-dark, #0D1512)',
              color:
                fxMode === 'FULL'
                  ? 'var(--tech-cyan-wave, #00F0FF)'
                  : fxMode === 'LITE'
                  ? 'var(--pixel-amber-gold, #FFCC00)'
                  : 'var(--text-secondary, #8E98AA)',
              borderColor:
                fxMode === 'FULL'
                  ? 'var(--tech-cyan-wave, #00F0FF)'
                  : fxMode === 'LITE'
                  ? 'var(--pixel-amber-gold, #FFCC00)'
                  : 'var(--crt-bezel-shadow, #2D3645)',
              boxShadow: fxMode === 'FULL' ? '0 0 6px rgba(var(--tech-cyan-wave-rgb), 0.4)' : 'none',
            }}
            title="Toggle CRT Scanlines & Curvature"
            aria-label={`Current CRT mode is ${fxMode}. Click to toggle.`}
          >
            <span>CRT FX: {fxMode}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shadow-[0_0_8px_var(--pixel-phosphor-green)] animate-pulse"
              style={{ backgroundColor: 'var(--pixel-phosphor-green, #4AF626)' }}
            />
            <span
              className="font-pixel text-[8px] font-bold"
              style={{ color: 'var(--pixel-phosphor-green, #4AF626)' }}
            >
              Power
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CRTViewportShell;
