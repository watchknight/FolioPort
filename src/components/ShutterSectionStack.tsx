// src/components/ShutterSectionStack.tsx
// @watchknight Awwwards Motion Architecture // SYS.96
// Layered Cyber-Shutter (Shop-Shutter Roll-Up) Deck & 3D Articulated Louver Slats

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import {
  decodeTelemetryText,
  formatSectorTag,
  ShutterLayerElements,
  ShutterDeckController,
} from '../utils/sectionTransitions';

gsap.registerPlugin(ScrollTrigger);

interface ShutterDeckContextValue {
  registerLayer: (elements: ShutterLayerElements) => void;
  unregisterLayer: (index: number) => void;
  totalLayers: number;
}

const ShutterDeckContext = createContext<ShutterDeckContextValue | null>(null);

export interface ShutterLayerProps {
  index: number;
  total?: number;
  title: string;
  sectorCode?: string;
  id?: string;
  nextSectionId?: string;
  prevSectionId?: string;
  showDivider?: boolean;
  playAudio?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Tactical 90s Cyberdeck Articulated Louver Slat & Quick-Lift Bottom Bar
 */
const ShutterBottomBar: React.FC<{
  index: number;
  total: number;
  title: string;
  nextSectionId?: string;
  prevSectionId?: string;
  slatsRef: React.MutableRefObject<HTMLElement[]>;
  slatsContainerRef: React.RefObject<HTMLDivElement>;
  barRef: React.RefObject<HTMLDivElement>;
  uncoverBeamRef: React.RefObject<HTMLDivElement>;
  ledsRef: React.MutableRefObject<HTMLElement[]>;
  containerRef: React.RefObject<HTMLElement>;
}> = ({
  index,
  total,
  title,
  nextSectionId,
  prevSectionId,
  slatsRef,
  slatsContainerRef,
  barRef,
  uncoverBeamRef,
  ledsRef,
  containerRef,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Monitor status attribute mutations from GSAP ScrollTrigger updates
  useEffect(() => {
    const primaryLed = ledsRef.current[0];
    if (!primaryLed) return;

    const observer = new MutationObserver(() => {
      const status = primaryLed.getAttribute('data-status');
      setIsOpening(status === 'OPENING');
    });

    observer.observe(primaryLed, { attributes: true, attributeFilter: ['data-status'] });
    return () => observer.disconnect();
  }, [ledsRef]);

  const handleHoverStart = useCallback(() => {
    setIsHovered(true);
    chiptuneAudio.playPixelTick();
    if (slatsContainerRef.current) {
      slatsContainerRef.current.style.transform = 'translateY(-3px)';
    }
  }, [slatsContainerRef]);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
    if (slatsContainerRef.current) {
      slatsContainerRef.current.style.transform = 'translateY(0)';
    }
  }, [slatsContainerRef]);

  const resolveTargetElement = useCallback(
    (targetId?: string, isNext: boolean = true): HTMLElement | null => {
      if (typeof document === 'undefined') return null;

      // 1. First priority: Target the exact consecutive ShutterLayer by data-shutter-index
      const targetIndex = isNext ? index + 1 : index - 1;
      const layerByData = document.querySelector<HTMLElement>(
        `[data-shutter-index="${targetIndex}"]`
      );
      if (layerByData) return layerByData;

      // 2. Next: explicit target anchor/id
      if (targetId) {
        const cleanId = targetId.startsWith('#') ? targetId : `#${targetId}`;
        const el = document.querySelector<HTMLElement>(cleanId);
        if (el) return el;
      }

      // 3. Fallback: sibling elements
      if (containerRef.current) {
        return (
          isNext
            ? (containerRef.current.nextElementSibling as HTMLElement)
            : (containerRef.current.previousElementSibling as HTMLElement)
        ) || null;
      }

      return null;
    },
    [index, containerRef]
  );

  const handleLiftShutter = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();

      // Trigger pneumatic release + mechanical ratchet sound
      chiptuneAudio.playPowerUpSFX();
      chiptuneAudio.playShutterRollTick(200);

      const isLast = index >= total - 1;
      const nextEl = isLast ? null : resolveTargetElement(nextSectionId, true);

      if (typeof window !== 'undefined') {
        const lenis = window.__lenis;
        if (isLast) {
          // Return to top of deck
          if (lenis) {
            lenis.scrollTo(0, {
              offset: 0,
              duration: 1.35,
              easing: (t: number) => 1 - Math.pow(1 - t, 4),
            });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else if (nextEl) {
          if (lenis) {
            lenis.scrollTo(nextEl, {
              offset: -64,
              duration: 1.35,
              easing: (t: number) => 1 - Math.pow(1 - t, 4),
            });
          } else {
            nextEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    },
    [index, total, nextSectionId, resolveTargetElement]
  );

  const handlePrevBay = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();
      chiptuneAudio.playPixelTick();

      const prevEl = resolveTargetElement(prevSectionId, false);
      if (typeof window !== 'undefined') {
        const lenis = window.__lenis;
        if (prevEl) {
          if (lenis) {
            lenis.scrollTo(prevEl, {
              offset: -64,
              duration: 1.2,
              easing: (t: number) => 1 - Math.pow(1 - t, 4),
            });
          } else {
            prevEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    },
    [prevSectionId, resolveTargetElement]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
        e.preventDefault();
        handleLiftShutter(e);
      }
    },
    [handleLiftShutter]
  );

  const bayNumber = String(index + 1).padStart(2, '0');
  const nextBayNumber = String(index + 2).padStart(2, '0');

  return (
    <div
      ref={barRef}
      className="shutter-bottom-bar relative w-full select-none z-30"
      style={{ height: '48px', minHeight: '48px' }}
    >
      {/* 1. Five Horizontal Metallic Louver Slats (Height: 6px each, true 3D perspective folding) */}
      <div
        ref={slatsContainerRef}
        className="shutter-slats-wrap flex flex-col w-full overflow-visible transition-transform duration-150"
        style={{
          perspective: '800px',
          transformStyle: 'preserve-3d',
        }}
      >
        {[0, 1, 2, 3, 4].map((slatIdx) => (
          <div
            key={slatIdx}
            ref={(el) => {
              if (el) slatsRef.current[slatIdx] = el;
            }}
            className="shutter-slat w-full transform-gpu"
            style={{
              height: '6px',
              backgroundColor: '#131629',
              borderTop: '1px solid rgba(0, 240, 255, 0.3)',
              borderBottom: '1px solid #070814',
              transformOrigin: 'top center',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          />
        ))}
      </div>

      {/* 2. Reinforced Bottom Locking Bar */}
      <div
        className="shutter-lock-bar w-full h-[36px] px-3 sm:px-6 flex items-center justify-between border-t-2 border-b-2 border-[#2D3645] bg-[#0D1512] transition-colors"
        style={{
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.85)',
        }}
      >
        {/* Left LED & Lock Status */}
        <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px]">
          <span
            ref={(el) => {
              if (el) ledsRef.current[0] = el;
            }}
            data-status="LOCKED"
            className={`w-2 h-2 rounded-full transition-colors ${
              isOpening
                ? 'bg-[#FFCC00] shadow-[0_0_8px_#FFCC00] animate-pulse'
                : 'bg-[#4AF626] shadow-[0_0_8px_#4AF626]'
            }`}
          />
          <span className={isOpening ? 'text-[#FFCC00] font-bold' : 'text-[#4AF626]'}>
            {isOpening ? 'OPENING [▲]' : 'LOCKED [●]'}
          </span>
          <span className="hidden md:inline text-white/35 font-pixel text-[8px]">
            {`// BAY_${bayNumber} // ${title.toUpperCase().replace(/\s+/g, '_')}`}
          </span>
        </div>

        {/* Center: Interactive Manual Quick-Lift Handle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Secondary [ ▼ PREV BAY ] button on sections 02–06 */}
          {index > 0 && (
            <button
              type="button"
              onClick={handlePrevBay}
              onMouseEnter={() => chiptuneAudio.playPixelTick()}
              className="prev-bay-btn px-2.5 py-1 bg-[#131629] border border-[#2D3645] hover:border-[#00F0FF] text-[#D6CFC2] hover:text-[#00F0FF] font-pixel text-[8px] sm:text-[9px] transition-all flex items-center gap-1 active:translate-y-0.5"
              aria-label="Scroll back to previous bay"
            >
              <span>[ ▼ PREV BAY ]</span>
            </button>
          )}

          {/* Primary Quick-Lift Handle: [ ▲ LIFT SHUTTER // UNLOCK BAY_0{i+1} ▲ ] */}
          <button
            type="button"
            onClick={handleLiftShutter}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
            onFocus={handleHoverStart}
            onBlur={handleHoverEnd}
            className="quick-lift-btn relative px-3 sm:px-4 py-1.5 bg-[#131629] border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] text-[#00F0FF] hover:text-[#FFCC00] font-pixel text-[9px] sm:text-[10px] tracking-wider transition-all duration-150 active:translate-y-0.5 shadow-[2px_2px_0_0_#070814] flex items-center gap-2 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00F0FF]"
            aria-label={
              index < total - 1
                ? `Lift shutter and unlock Bay ${nextBayNumber}`
                : 'Return to top of deck'
            }
          >
            <span className="text-[#4AF626] group-hover:text-[#FFCC00] transition-colors">▲</span>
            <span>
              {index < total - 1
                ? `[ ▲ LIFT SHUTTER // UNLOCK BAY_${nextBayNumber} ▲ ]`
                : '[ ▲ RETURN TO SYS.96 // BAY_01 ▲ ]'}
            </span>
          </button>
        </div>

        {/* Right: Cyber-Hazard Diagonal Stripes & Right LED */}
        <div className="flex items-center gap-3">
          <div
            className="hazard-stripes hidden sm:block w-20 md:w-32 h-3.5 border border-[#2D3645] transition-all"
            style={{
              background: isHovered
                ? 'repeating-linear-gradient(-45deg, #FFCC00, #FFCC00 6px, #070814 6px, #070814 12px)'
                : 'repeating-linear-gradient(-45deg, #00F0FF, #00F0FF 6px, #070814 6px, #070814 12px)',
            }}
          />
          <div className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px]">
            <span className={`hidden sm:inline ${isOpening ? 'text-[#FFCC00] font-bold' : 'text-[#4AF626]'}`}>
              {isOpening ? 'OPENING [▲]' : 'LOCKED [●]'}
            </span>
            <span
              ref={(el) => {
                if (el) ledsRef.current[1] = el;
              }}
              data-status="LOCKED"
              className={`w-2 h-2 rounded-full transition-colors ${
                isOpening
                  ? 'bg-[#FFCC00] shadow-[0_0_8px_#FFCC00] animate-pulse'
                  : 'bg-[#4AF626] shadow-[0_0_8px_#4AF626]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 3. Glowing Horizontal Cyan/Magenta CRT Scanline Uncover Beam Along Shutter Edge */}
      <div
        ref={uncoverBeamRef}
        className="shutter-uncover-beam w-full h-[2px] pointer-events-none transform-gpu"
        style={{
          background: 'linear-gradient(90deg, #00F0FF 0%, #FF2A85 50%, #4AF626 100%)',
          boxShadow:
            '0 0 15px #00F0FF, 0 0 30px #FF2A85, 0 0 45px #4AF626, inset 0 0 4px #FFFFFF',
          opacity: isOpening ? 1 : 0.5,
          transition: 'opacity 0.2s',
        }}
      />
    </div>
  );
};

/**
 * ShutterLayer
 * Renders an individual section in the Shop-Shutter deck with managed stacking context,
 * dark translucent cyber-phosphor backdrop, CRT H-Sync laser divider, and articulated bottom bar.
 */
export const ShutterLayer: React.FC<ShutterLayerProps> = ({
  index,
  total = 6,
  title,
  sectorCode,
  id,
  nextSectionId,
  prevSectionId,
  showDivider,
  playAudio = true,
  className = '',
  style,
  children,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const slatsContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomBarRef = useRef<HTMLDivElement | null>(null);
  const uncoverBeamRef = useRef<HTMLDivElement | null>(null);
  const slatsRef = useRef<HTMLElement[]>([]);
  const ledsRef = useRef<HTMLElement[]>([]);

  // CRT H-Sync laser divider refs
  const beamRef = useRef<HTMLDivElement | null>(null);
  const hudTagRef = useRef<HTMLDivElement | null>(null);

  const context = useContext(ShutterDeckContext);
  const activeSectorCode = sectorCode || String(index + 1).padStart(2, '0');
  const fullTag = formatSectorTag(activeSectorCode, title);
  const isFirstSector = index === 0;
  const shouldRenderDivider = showDivider ?? !isFirstSector;

  const [initialTelemetry] = useState<string>(() => decodeTelemetryText(fullTag, 0));

  // Register elements with ShutterDeckContext
  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const revealTargets = Array.from(
      inner.querySelectorAll<HTMLElement>(
        '.shutter-reveal-target, .project-card, .spec-card, .matrix-cell, h2, h3, .hud-card'
      )
    ).slice(0, 8);

    const layerElements: ShutterLayerElements = {
      container,
      inner,
      slats: slatsRef.current,
      slatsContainer: slatsContainerRef.current,
      bottomBar: bottomBarRef.current,
      uncoverBeam: uncoverBeamRef.current,
      leds: ledsRef.current,
      revealTargets,
      index,
      total,
      title,
    };

    if (context) {
      context.registerLayer(layerElements);
      return () => {
        context.unregisterLayer(index);
      };
    }
  }, [context, index, total, title]);

  // CRT H-Sync Laser Divider ScrollTrigger Animation
  useEffect(() => {
    const beam = beamRef.current;
    const container = containerRef.current;
    if (!beam || !container || !shouldRenderDivider) return;

    let hasHummed = false;
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (isReduced) {
      gsap.set(beam, { scaleX: 1, transformOrigin: 'left center' });
      if (hudTagRef.current) hudTagRef.current.textContent = fullTag;
      return;
    }

    gsap.set(beam, { scaleX: 0, transformOrigin: 'left center' });

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top 85%',
      end: 'top 30%',
      scrub: 0.6,
      onUpdate: (self) => {
        const text = decodeTelemetryText(fullTag, self.progress);
        if (hudTagRef.current) {
          hudTagRef.current.textContent = text;
        }
        gsap.set(beam, { scaleX: self.progress });

        if (self.direction === 1 && self.progress > 0.12 && !hasHummed) {
          if (playAudio) {
            watchknightAudio.playCrtSyncHum(0.2);
          }
          hasHummed = true;
        } else if (self.progress <= 0.05) {
          hasHummed = false;
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [shouldRenderDivider, fullTag, playAudio]);

  // Managed Stacking Context: Higher index sits beneath lower index
  const zIndex = (total - index) * 10;

  return (
    <section
      ref={containerRef}
      id={id}
      data-shutter-index={index}
      data-shutter-layer={`bay-0${index + 1}`}
      data-sector-id={activeSectorCode}
      data-sector-title={title}
      aria-label={`Sector ${activeSectorCode}: ${title}`}
      className={`shutter-layer relative w-full ${className}`}
      style={{
        zIndex,
        ...style,
      }}
    >
      {/* Heavy bottom mechanical shadow + dark translucent cyber-phosphor surface */}
      <div
        ref={innerRef}
        className="shutter-inner w-full transform-gpu relative flex flex-col"
        style={{
          boxShadow:
            '0 36px 70px rgba(0, 0, 0, 0.95), 0 4px 20px rgba(0, 240, 255, 0.18)',
          background:
            'linear-gradient(180deg, rgba(7, 8, 20, 0.90) 0%, rgba(13, 21, 18, 0.94) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {/* CRT Horizontal-Sync (H-Sync) Laser Divider at Top of Layer */}
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
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#0D1512]/95 border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.25)] text-[#00F0FF] font-mono tracking-wider font-semibold backdrop-blur-md">
                <span className="w-1.5 h-1.5 bg-[#4AF626] rounded-full animate-pulse shrink-0" />
                <span ref={hudTagRef}>{initialTelemetry}</span>
              </div>

              <div className="text-[#FF2A85] font-pixel text-[8px] tracking-tight hidden sm:flex items-center gap-1.5 opacity-80">
                <span className="w-1.5 h-1.5 bg-[#FF2A85] rounded-full animate-ping" />
                <span>H-SYNC: 15.734 kHz // ELECTRON_BEAM_ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Layer Content */}
        <div className="shutter-content w-full flex-1">{children}</div>

        {/* Tactile Articulated Shutter Bottom Bar */}
        <ShutterBottomBar
          index={index}
          total={total}
          title={title}
          nextSectionId={nextSectionId}
          prevSectionId={prevSectionId}
          slatsRef={slatsRef}
          slatsContainerRef={slatsContainerRef}
          barRef={bottomBarRef}
          uncoverBeamRef={uncoverBeamRef}
          ledsRef={ledsRef}
          containerRef={containerRef}
        />
      </div>
    </section>
  );
};

export interface ShutterSectionStackProps {
  total?: number;
  playAudio?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * ShutterSectionStack
 * Top-level Orchestrator for the Layered Cyber-Shutter Shop-Shutter Deck.
 * Automatically synchronizes ScrollTrigger unstacking, 5-slat 3D folding,
 * and procedural Web Audio ratchet pulse feedback.
 */
export const ShutterSectionStack: React.FC<ShutterSectionStackProps> = ({
  total = 6,
  playAudio = true,
  className = '',
  children,
}) => {
  const [layersMap, setLayersMap] = useState<Map<number, ShutterLayerElements>>(
    () => new Map()
  );
  const controllerRef = useRef<ShutterDeckController | null>(null);

  const registerLayer = useCallback((elements: ShutterLayerElements) => {
    setLayersMap((prev) => {
      const next = new Map(prev);
      next.set(elements.index, elements);
      return next;
    });
  }, []);

  const unregisterLayer = useCallback((index: number) => {
    setLayersMap((prev) => {
      const next = new Map(prev);
      next.delete(index);
      return next;
    });
  }, []);

  // Initialize ShutterDeckController when all layers are registered
  useEffect(() => {
    const sortedLayers = Array.from(layersMap.values()).sort(
      (a, b) => a.index - b.index
    );

    if (sortedLayers.length < 2) return;

    let isCancelled = false;
    const initController = () => {
      if (isCancelled) return;
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }

      const controller = new ShutterDeckController({
        layers: sortedLayers,
        playAudio,
      });
      controllerRef.current = controller;
    };

    // If all total layers are already registered, init immediately.
    // Otherwise wait for the sibling layers to finish registering within the current macrotask.
    if (sortedLayers.length >= total) {
      initController();
    } else {
      const timer = setTimeout(initController, 25);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
        if (controllerRef.current) {
          controllerRef.current.dispose();
          controllerRef.current = null;
        }
      };
    }

    return () => {
      isCancelled = true;
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }
    };
  }, [layersMap, playAudio, total]);

  const contextValue = useMemo<ShutterDeckContextValue>(
    () => ({
      registerLayer,
      unregisterLayer,
      totalLayers: total,
    }),
    [registerLayer, unregisterLayer, total]
  );

  return (
    <ShutterDeckContext.Provider value={contextValue}>
      <div
        className={`shutter-section-stack relative w-full flex flex-col ${className}`}
        data-shutter-deck="SYS.96"
      >
        {children}
      </div>
    </ShutterDeckContext.Provider>
  );
};

export default ShutterSectionStack;
