import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  decodeTelemetryText,
  formatSectorTag,
  SectionPortalController,
} from '../utils/sectionTransitions';

gsap.registerPlugin(ScrollTrigger);

export interface SectionTransitionWrapperProps {
  sectionId?: string;
  title?: string;
  sectorTag?: string;
  showDivider?: boolean;
  playAudio?: boolean;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Reusable Section Transition Wrapper & CRT Horizontal-Sync (H-Sync) Laser Divider
 * Implements hardware-accelerated 3D holographic depth scaling, electron beam sync hum,
 * and dynamic monospace HUD telemetry tag decoding.
 */
export const SectionTransitionWrapper: React.FC<SectionTransitionWrapperProps> = ({
  sectionId = '02',
  title = 'SECTION_PORTAL',
  sectorTag,
  showDivider,
  playAudio = true,
  id,
  className = '',
  style,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const beamRef = useRef<HTMLDivElement | null>(null);
  const hudTagRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SectionPortalController | null>(null);

  const finalTag = sectorTag || formatSectorTag(sectionId, title);
  const isFirstSector = sectionId === '01' || sectionId === '1';
  const shouldRenderDivider = showDivider ?? !isFirstSector;

  const [initialTelemetry] = useState<string>(() =>
    decodeTelemetryText(finalTag, 0)
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const controller = new SectionPortalController({
      container,
      beamElement: beamRef.current,
      hudTagElement: hudTagRef.current,
      contentElement: contentRef.current,
      sectionId,
      title,
      isFirstSector,
      playAudio,
    });

    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [sectionId, title, isFirstSector, playAudio]);

  return (
    <section
      ref={containerRef}
      id={id}
      className={`relative w-full section-transition-wrapper ${className}`}
      style={style}
      data-sector-id={sectionId}
      data-sector-title={title}
      aria-label={`Sector ${sectionId}: ${title}`}
    >
      {/* CRT Horizontal-Sync (H-Sync) Laser Divider */}
      {shouldRenderDivider && (
        <div
          className="crt-hsync-divider-container relative w-full overflow-hidden select-none pointer-events-none py-3 px-4 sm:px-8 max-w-[1720px] mx-auto z-20"
          aria-hidden="true"
        >
          {/* 2px glowing cyan/magenta electron beam */}
          <div className="relative w-full h-[2px] bg-[#0D1512] overflow-hidden">
            <div
              ref={beamRef}
              className="crt-hsync-beam h-[2px] w-full transform-gpu bg-gradient-to-r from-[#00F0FF] via-[#FF2A85] to-[#4AF626]"
              style={{
                transformOrigin: 'left center',
                transform: 'scaleX(0)',
                boxShadow:
                  '0 0 10px #00F0FF, 0 0 20px #FF2A85, 0 0 30px #4AF626, inset 0 0 4px #FFFFFF',
              }}
            />
          </div>

          {/* Monospace HUD Telemetry Readout */}
          <div className="crt-hsync-hud mt-2 flex items-center justify-between font-mono text-[9px] sm:text-[10px] tracking-wider text-[#00F0FF]">
            <div
              className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#0D1512]/95 border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.25)] text-[#00F0FF] font-mono tracking-wider font-semibold backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 bg-[#4AF626] rounded-full animate-pulse shrink-0" />
              <span ref={hudTagRef}>{initialTelemetry}</span>
            </div>

            <div className="text-[#FF2A85] font-pixel text-[8px] tracking-tight hidden sm:flex items-center gap-1.5 opacity-80">
              <span className="w-1.5 h-1.5 bg-[#FF2A85] rounded-full animate-ping" />
              <span>H-SYNC: 15.734 kHz • Beam Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Holographic Section Viewport Portal Content */}
      <div
        ref={contentRef}
        className="section-portal-content w-full transform-gpu"
      >
        {children}
      </div>
    </section>
  );
};

export default SectionTransitionWrapper;
