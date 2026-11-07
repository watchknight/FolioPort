// src/utils/sectionTransitions.ts
// @watchknight Awwwards SOTY Multi-Layer Spatial Section Transition Engine
// Coordinates 3D WebGL Camera Waypoints, Shader Morphing, CRT H-Sync Laser Dividers & Holographic Viewport Portals

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { chiptuneAudio } from './chiptuneAudio';

gsap.registerPlugin(ScrollTrigger);

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface SpatialWaypoint {
  id: string;
  sectorIndex: number;
  sectorCode: string;
  name: string;
  cameraPosition: Vector3D;
  cameraRotation: Vector3D;
  gridDensity: number;
  troughColor: string;
  crestColor: string;
  accentColor: string;
  amplitude: number;
}

export interface InterpolatedWaypoint {
  cameraPosition: Vector3D;
  cameraRotation: Vector3D;
  gridDensity: number;
  troughColor: RGBColor;
  crestColor: RGBColor;
  accentColor: RGBColor;
  amplitude: number;
  paletteMorph: number;
  isSector5: boolean;
  activeSectorIndex: number;
}

/**
 * 5 SPATIAL WAYPOINTS (WATCHKNIGHT_OS // SYS.96)
 * Sector 01 (Hero): Angled horizon view (0, -2.8, 5.2), cyan #00F0FF troughs with magenta #FF2A85 crests.
 * Sector 02 (Flagship Systems & 3D Deck): Camera dives forward and banks diagonally (2.0, -1.2, 3.6, rotZ=0.08), increasing wireframe grid density.
 * Sector 03 (Chrome Extension Studio): Clean top-down cyber-grid perspective (0, 0, 5.8), electric cyan and amber #FFCC00.
 * Sector 04 (Motherboard, Architecture & GitHub ROMs): Isometric architectural schematic view (-1.8, 1.8, 4.5), phosphor green #4AF626.
 * Sector 05 (Terminal Arcade & Satellite Uplink): Infinite synthwave horizon (0, -3.5, 6.0), wave amplitude gently breathes.
 */
export const SPATIAL_WAYPOINTS: SpatialWaypoint[] = [
  {
    id: 'sector-01',
    sectorIndex: 0,
    sectorCode: '01',
    name: 'HERO_HORIZON',
    cameraPosition: { x: 0, y: -2.8, z: 5.2 },
    cameraRotation: { x: 0.45, y: 0, z: 0 },
    gridDensity: 1.0,
    troughColor: '#00F0FF',
    crestColor: '#FF2A85',
    accentColor: '#FFCC00',
    amplitude: 0.8,
  },
  {
    id: 'sector-02',
    sectorIndex: 1,
    sectorCode: '02',
    name: 'FLAGSHIP_SYSTEMS_3D_DECK',
    cameraPosition: { x: 2.0, y: -1.2, z: 3.6 },
    cameraRotation: { x: 0.25, y: -0.12, z: 0.08 },
    gridDensity: 1.6,
    troughColor: '#00F0FF',
    crestColor: '#FF2A85',
    accentColor: '#FFCC00',
    amplitude: 0.85,
  },
  {
    id: 'sector-03',
    sectorIndex: 2,
    sectorCode: '03',
    name: 'BROWSER_EXTENSION_STUDIO',
    cameraPosition: { x: 0, y: 0, z: 5.8 },
    cameraRotation: { x: 0, y: 0, z: 0 },
    gridDensity: 1.2,
    troughColor: '#00F0FF',
    crestColor: '#FFCC00',
    accentColor: '#FFCC00',
    amplitude: 0.75,
  },
  {
    id: 'sector-04',
    sectorIndex: 3,
    sectorCode: '04',
    name: 'ARCHITECTURE_GITHUB_ROMS',
    cameraPosition: { x: -1.8, y: 1.8, z: 4.5 },
    cameraRotation: { x: -0.32, y: 0.25, z: -0.06 },
    gridDensity: 1.4,
    troughColor: '#4AF626',
    crestColor: '#00F0FF',
    accentColor: '#4AF626',
    amplitude: 0.8,
  },
  {
    id: 'sector-05',
    sectorIndex: 4,
    sectorCode: '05',
    name: 'TERMINAL_ARCADE_SATELLITE',
    cameraPosition: { x: 0, y: -3.5, z: 6.0 },
    cameraRotation: { x: 0.52, y: 0, z: 0 },
    gridDensity: 1.0,
    troughColor: '#00F0FF',
    crestColor: '#FF2A85',
    accentColor: '#FFCC00',
    amplitude: 0.9,
  },
];

/**
 * Fast hexadecimal color string parser
 */
export function hexToRgb(hex: string): RGBColor {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
    return { r, g, b };
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Linear color interpolation in RGB space
 */
export function lerpColor(hexA: string, hexB: string, t: number): RGBColor {
  const colA = hexToRgb(hexA);
  const colB = hexToRgb(hexB);
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    r: colA.r + (colB.r - colA.r) * clampedT,
    g: colA.g + (colB.g - colA.g) * clampedT,
    b: colA.b + (colB.b - colA.b) * clampedT,
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculates smooth interpolated 3D camera waypoints and shader uniforms across global progress [0, 1].
 */
export function interpolateSpatialWaypoints(progress: number): InterpolatedWaypoint {
  const p = Math.max(0, Math.min(1, progress));
  const waypointCount = SPATIAL_WAYPOINTS.length;
  const segments = waypointCount - 1; // 4 intervals

  const scaled = p * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const rawT = scaled - index;

  // Smoothstep ease for fluid waypoint blending
  const t = rawT * rawT * (3 - 2 * rawT);

  const wpA = SPATIAL_WAYPOINTS[index];
  const wpB = SPATIAL_WAYPOINTS[index + 1];

  const cameraPosition: Vector3D = {
    x: lerp(wpA.cameraPosition.x, wpB.cameraPosition.x, t),
    y: lerp(wpA.cameraPosition.y, wpB.cameraPosition.y, t),
    z: lerp(wpA.cameraPosition.z, wpB.cameraPosition.z, t),
  };

  const cameraRotation: Vector3D = {
    x: lerp(wpA.cameraRotation.x, wpB.cameraRotation.x, t),
    y: lerp(wpA.cameraRotation.y, wpB.cameraRotation.y, t),
    z: lerp(wpA.cameraRotation.z, wpB.cameraRotation.z, t),
  };

  const gridDensity = lerp(wpA.gridDensity, wpB.gridDensity, t);
  const amplitude = lerp(wpA.amplitude, wpB.amplitude, t);
  const troughColor = lerpColor(wpA.troughColor, wpB.troughColor, t);
  const crestColor = lerpColor(wpA.crestColor, wpB.crestColor, t);
  const accentColor = lerpColor(wpA.accentColor, wpB.accentColor, t);

  // Palette morphing weight: 0 at pure Hero, ramping to 1.0 across Sectors 02 - 04
  const paletteMorph = p < 0.05 ? p * 20 : 1.0;
  const isSector5 = p >= 0.82;

  return {
    cameraPosition,
    cameraRotation,
    gridDensity,
    troughColor,
    crestColor,
    accentColor,
    amplitude,
    paletteMorph,
    isSector5,
    activeSectorIndex: Math.round(scaled),
  };
}

/**
 * Dynamic Monospace HUD Telemetry Decryption Text Generator:
 * Progressively reveals decoded characters from left to right as the CRT laser beam passes,
 * scrambling trailing characters with authentic 90s cyberdeck glyphs.
 */
const SCRAMBLE_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_#<>!/[*]-+~';

export function decodeTelemetryText(targetText: string, progress: number, seed: number = 0): string {
  if (progress <= 0) {
    // Masked initial bracket telemetry
    return targetText.replace(/[A-Za-z0-9_]/g, '░');
  }
  if (progress >= 1) {
    return targetText;
  }

  const length = targetText.length;
  const revealedCount = Math.floor(progress * length);
  let result = '';

  for (let i = 0; i < length; i++) {
    const char = targetText[i];
    // Keep structural brackets, slashes and whitespace stable
    if (char === '[' || char === ']' || char === '/' || char === ' ') {
      result += char;
    } else if (i < revealedCount) {
      result += char;
    } else {
      const hash = Math.abs(Math.sin((i + 1) * 31337 + seed * 997 + progress * 71)) * 10000;
      const glyphIndex = Math.floor(hash) % SCRAMBLE_CHARSET.length;
      result += SCRAMBLE_CHARSET[glyphIndex];
    }
  }

  return result;
}

/**
 * Standardized HUD Telemetry Tag Formatter:
 * Produces format: `[ SECTOR_02 // EXTENSION_STUDIO // SYNC_LOCKED ]`
 */
export function formatSectorTag(sectionId: string, title: string): string {
  const paddedId = sectionId.padStart(2, '0');
  const cleanTitle = title.toUpperCase().replace(/\s+/g, '_');
  return `[ SECTOR_${paddedId} // ${cleanTitle} // SYNC_LOCKED ]`;
}

/**
 * Section Transition Controller for interactive CRT H-Sync laser dividers
 * and 3D depth holographic viewport portals with full gsap.matchMedia support.
 */
export interface SectionPortalOptions {
  container: HTMLElement;
  beamElement?: HTMLElement | null;
  hudTagElement?: HTMLElement | null;
  contentElement?: HTMLElement | null;
  sectionId?: string;
  title?: string;
  isFirstSector?: boolean;
  onTextUpdate?: (text: string) => void;
  playAudio?: boolean;
}

export class SectionPortalController {
  private container: HTMLElement;
  private beam: HTMLElement | null;
  private hudTag: HTMLElement | null;
  private content: HTMLElement | null;
  private sectionId: string;
  private title: string;
  private fullTag: string;
  private isFirstSector: boolean;
  private onTextUpdate?: (text: string) => void;
  private playAudio: boolean;
  private mm: gsap.MatchMedia | null = null;
  private hasHummed: boolean = false;
  private isDisposed: boolean = false;

  constructor(options: SectionPortalOptions) {
    this.container = options.container;
    this.beam = options.beamElement || null;
    this.hudTag = options.hudTagElement || null;
    this.content = options.contentElement || null;
    this.sectionId = options.sectionId || '02';
    this.title = options.title || 'SECTION';
    this.fullTag = formatSectorTag(this.sectionId, this.title);
    this.isFirstSector =
      options.isFirstSector ??
      (this.sectionId === '01' || this.sectionId === '1' || this.sectionId === 'sector-01');
    this.onTextUpdate = options.onTextUpdate;
    this.playAudio = options.playAudio ?? true;

    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    this.mm = gsap.matchMedia();

    this.mm.add(
      {
        isDesktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        isMobileOrReduced: '(max-width: 1023px), (prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop } = context.conditions as {
          isDesktop: boolean;
          isMobileOrReduced: boolean;
        };

        const isReduced =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

        // 1. CRT H-Sync Laser Divider Animation (scrub: 0.6, start: top 85%, end: top 30%)
        if (this.beam) {
          if (isReduced) {
            gsap.set(this.beam, { scaleX: 1, transformOrigin: 'left center' });
            if (this.hudTag) {
              this.hudTag.textContent = this.fullTag;
            }
          } else {
            gsap.set(this.beam, { scaleX: 0, transformOrigin: 'left center' });

            gsap.to(this.beam, {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: this.container,
                start: 'top 85%',
                end: 'top 30%',
                scrub: 0.6,
                onUpdate: (self) => {
                  const text = decodeTelemetryText(this.fullTag, self.progress);
                  if (this.onTextUpdate) {
                    this.onTextUpdate(text);
                  }
                  if (this.hudTag) {
                    this.hudTag.textContent = text;
                  }

                  // CRT Flyback Electron Sync Hum (forward entry only)
                  if (self.direction === 1 && self.progress > 0.12 && !this.hasHummed) {
                    if (this.playAudio) {
                      watchknightAudio.playCrtSyncHum(0.2);
                    }
                    this.hasHummed = true;
                  } else if (self.progress <= 0.05) {
                    this.hasHummed = false;
                  }
                },
              },
            });
          }
        }

        // 2. Section Viewport Portal Depth Scaling
        if (this.content) {
          if (isDesktop && !isReduced) {
            // Desktop: 3D holographic depth scaling
            if (!this.isFirstSector) {
              // Incoming: scale: 0.95, y: 40, autoAlpha: 0 -> scale: 1, y: 0, autoAlpha: 1 (scrub: 0.6)
              gsap.fromTo(
                this.content,
                {
                  scale: 0.95,
                  y: 40,
                  autoAlpha: 0,
                },
                {
                  scale: 1,
                  y: 0,
                  autoAlpha: 1,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: this.container,
                    start: 'top 85%',
                    end: 'top 30%',
                    scrub: 0.6,
                  },
                }
              );
            } else {
              // Initial Sector 01 (Hero): locked at scale 1, y 0, autoAlpha 1 to eliminate mount flicker
              gsap.set(this.content, { scale: 1, y: 0, autoAlpha: 1 });
            }

            // Outgoing: gently fade and recess (scale: 0.96, autoAlpha: 0.2)
            gsap.to(this.content, {
              scale: 0.96,
              autoAlpha: 0.2,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: this.container,
                start: 'bottom 65%',
                end: 'bottom 10%',
                scrub: 0.6,
              },
            });
          } else {
            // Mobile or Reduced Motion: Performant 250ms autoAlpha crossfades, NO depth scaling or rotation
            if (!this.isFirstSector) {
              gsap.fromTo(
                this.content,
                {
                  autoAlpha: 0,
                  scale: 1,
                  y: 0,
                },
                {
                  autoAlpha: 1,
                  scale: 1,
                  y: 0,
                  duration: 0.25,
                  ease: 'power1.out',
                  scrollTrigger: {
                    trigger: this.container,
                    start: 'top 85%',
                    toggleActions: 'play reverse play reverse',
                  },
                }
              );
            } else {
              gsap.set(this.content, { scale: 1, y: 0, autoAlpha: 1 });
            }
          }
        }
      }
    );
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    if (this.mm) {
      this.mm.revert();
      this.mm = null;
    }
    this.beam = null;
    this.hudTag = null;
    this.content = null;
  }
}

/**
 * =========================================================================
 * LAYERED CYBER-SHUTTER (SHOP-SHUTTER ROLL-UP) DECK CONTROLLER
 * Awwwards Motion Architecture for 90s Cyberdeck Workstation (SYS.96)
 * Handles tall-section-safe unstacking, 5-slat 3D articulation,
 * sub-layer light uncover, and procedural ratchet audio tick feedback.
 * =========================================================================
 */
export interface ShutterLayerElements {
  container: HTMLElement;
  inner: HTMLElement;
  slats?: HTMLElement[];
  slatsContainer?: HTMLElement | null;
  bottomBar?: HTMLElement | null;
  uncoverBeam?: HTMLElement | null;
  leds?: HTMLElement[];
  revealTargets?: HTMLElement[];
  index: number;
  total: number;
  title: string;
}

export interface ShutterDeckOptions {
  layers: ShutterLayerElements[];
  playAudio?: boolean;
}

export class ShutterDeckController {
  private layers: ShutterLayerElements[];
  private playAudio: boolean;
  private mm: gsap.MatchMedia | null = null;
  private isDisposed: boolean = false;

  constructor(options: ShutterDeckOptions) {
    this.layers = options.layers;
    this.playAudio = options.playAudio ?? true;
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined' || this.layers.length < 2) return;

    this.mm = gsap.matchMedia();

    this.mm.add(
      {
        isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        isReduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, isReduced } = context.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
          isReduced: boolean;
        };

        // 1. Accessibility guardrail: strictly zero unexpected viewport translation for reduced motion
        if (isReduced) {
          for (let i = 0; i < this.layers.length - 1; i++) {
            const topLayer = this.layers[i];
            const bottomLayer = this.layers[i + 1];
            if (topLayer.inner) gsap.set(topLayer.inner, { yPercent: 0 });
            if (bottomLayer.inner) {
              gsap.set(bottomLayer.inner, {
                yPercent: 0,
                scale: 1,
                filter: 'none',
                autoAlpha: 1,
              });
            }
            if (bottomLayer.revealTargets && bottomLayer.revealTargets.length > 0) {
              gsap.set(bottomLayer.revealTargets, { y: 0, autoAlpha: 1 });
            }
          }
          return;
        }

        for (let i = 0; i < this.layers.length - 1; i++) {
          const topLayer = this.layers[i];
          const bottomLayer = this.layers[i + 1];

          if (!topLayer.container || !bottomLayer.container) continue;

          if (isDesktop) {
            // TALL-SECTION-SAFE GSAP SCROLLTRIGGER TIMELINE
            // Trigger: topLayer.container, start: 'bottom bottom', end: '+=85%', scrub: 0.65
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: topLayer.container,
                start: 'bottom bottom',
                end: '+=85%',
                scrub: 0.65,
                onUpdate: (self) => {
                  // 1. Procedural ratchet SFX when actively lifting and velocity exceeds 150px/s
                  if (this.playAudio && self.isActive) {
                    const velocity = self.getVelocity();
                    if (Math.abs(velocity) > 150) {
                      chiptuneAudio.playShutterRollTick(velocity);
                    }
                  }

                  // 2. Dual green/amber lock LEDs: LOCKED [●] -> OPENING [▲]
                  // Guarded against redundant attribute setting to eliminate 60 FPS MutationObserver thrashing
                  const isOpening = self.progress > 0.05 && self.progress < 0.98;
                  const newStatus = isOpening ? 'OPENING' : 'LOCKED';
                  if (topLayer.leds) {
                    topLayer.leds.forEach((led) => {
                      if (led.getAttribute('data-status') !== newStatus) {
                        led.setAttribute('data-status', newStatus);
                        if (isOpening) {
                          led.classList.add('is-opening');
                        } else {
                          led.classList.remove('is-opening');
                        }
                      }
                    });
                  }

                  // 3. Moving horizontal CRT scanline uncover beam
                  if (topLayer.uncoverBeam) {
                    topLayer.uncoverBeam.style.opacity = isOpening ? '1' : '0.5';
                  }
                },
              },
            });

            // Top shutter accelerates upward: yPercent: 0 -> -15
            if (topLayer.inner) {
              tl.to(
                topLayer.inner,
                {
                  yPercent: -15,
                  ease: 'none',
                  duration: 1,
                },
                0
              );
            }

            // 5 metallic louver slats fold & compress: scaleY: 1 -> 0.15, rotateX: 0deg -> -65deg, stagger: 0.04 (bottom slat to top slat)
            if (topLayer.slats && topLayer.slats.length > 0) {
              const reversedSlats = [...topLayer.slats].reverse();
              tl.to(
                reversedSlats,
                {
                  scaleY: 0.15,
                  rotateX: -65,
                  transformOrigin: 'top center',
                  stagger: 0.04,
                  ease: 'none',
                  duration: 0.8,
                },
                0
              );
            }

            // Underlying layer: pinned/tucked directly underneath
            // yPercent: -28 -> 0, scale: 0.93 -> 1.0, filter: brightness(0.35) -> brightness(1.0)
            if (bottomLayer.inner) {
              tl.fromTo(
                bottomLayer.inner,
                {
                  yPercent: -28,
                  scale: 0.93,
                  transformOrigin: 'center top',
                  filter: 'brightness(0.35)',
                },
                {
                  yPercent: 0,
                  scale: 1.0,
                  transformOrigin: 'center top',
                  filter: 'brightness(1.0)',
                  ease: 'none',
                  duration: 1,
                },
                0
              );
            }

            // Stagger internal cards/headers once shutter clears 40% (start at 0.40 progress in timeline)
            if (bottomLayer.revealTargets && bottomLayer.revealTargets.length > 0) {
              tl.fromTo(
                bottomLayer.revealTargets,
                {
                  y: 24,
                  autoAlpha: 0.2,
                },
                {
                  y: 0,
                  autoAlpha: 1,
                  stagger: 0.05,
                  ease: 'power2.out',
                  duration: 0.45,
                },
                0.4
              );
            }
          } else {
            // Mobile: lightweight vertical shutter slide to maintain 60 FPS while preserving LED and uncover telemetry
            if (topLayer.inner) {
              gsap.to(topLayer.inner, {
                yPercent: -10,
                ease: 'none',
                scrollTrigger: {
                  trigger: topLayer.container,
                  start: 'bottom bottom',
                  end: '+=60%',
                  scrub: 0.4,
                  onUpdate: (self) => {
                    if (this.playAudio && self.isActive) {
                      const velocity = self.getVelocity();
                      if (Math.abs(velocity) > 150) {
                        chiptuneAudio.playShutterRollTick(velocity);
                      }
                    }

                    const isOpening = self.progress > 0.05 && self.progress < 0.98;
                    const newStatus = isOpening ? 'OPENING' : 'LOCKED';
                    if (topLayer.leds) {
                      topLayer.leds.forEach((led) => {
                        if (led.getAttribute('data-status') !== newStatus) {
                          led.setAttribute('data-status', newStatus);
                          if (isOpening) {
                            led.classList.add('is-opening');
                          } else {
                            led.classList.remove('is-opening');
                          }
                        }
                      });
                    }

                    if (topLayer.uncoverBeam) {
                      topLayer.uncoverBeam.style.opacity = isOpening ? '1' : '0.5';
                    }
                  },
                },
              });
            }

            if (bottomLayer.inner) {
              gsap.fromTo(
                bottomLayer.inner,
                {
                  yPercent: -12,
                  autoAlpha: 0.7,
                },
                {
                  yPercent: 0,
                  autoAlpha: 1,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: topLayer.container,
                    start: 'bottom bottom',
                    end: '+=60%',
                    scrub: 0.4,
                  },
                }
              );
            }
          }
        }
      }
    );
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    if (this.mm) {
      this.mm.revert();
      this.mm = null;
    }
    this.layers = [];
  }
}

export function initShutterDeckTransitions(options: ShutterDeckOptions): ShutterDeckController {
  return new ShutterDeckController(options);
}

