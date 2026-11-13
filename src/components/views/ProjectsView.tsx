import React, { useState, useEffect, useRef } from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { useRetroOS } from '../../context/RetroOSContext';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';
import {
  FLAGSHIP_PROJECTS,
  MORE_DEPLOYED_APPS,
  FALLBACK_REPOSITORIES,
  type FlagshipProject,
  type HeroMetric,
  type GitHubRepoItem,
  type DeployedApp,
} from '../../data/projects';

// Re-export data and types for backwards compatibility
export {
  FLAGSHIP_PROJECTS,
  MORE_DEPLOYED_APPS,
  FALLBACK_REPOSITORIES,
  type FlagshipProject,
  type HeroMetric,
  type GitHubRepoItem,
  type DeployedApp,
};

export type FeaturedProject = FlagshipProject;
export const FEATURED_PROJECTS = FLAGSHIP_PROJECTS;

// Tech stack captions displayed under each 16:9 CRT photo demo thumbnail
const FLAGSHIP_STACK_CAPTIONS: Record<string, string> = {
  '01_BITFORGE': 'React • TypeScript • Canvas',
  '02_FOCUSLAB': 'React • IndexedDB • Web Audio',
  '03_RANNABANNA': 'Vite • React • Bilingual UI',
  '04_DOCLENS_BD': 'React • 3D Try-On • Cloud',
};

export interface ProjectsViewProps {
  palette?: PhosphorColorTokens;
  initialSelectedProjectId?: string;
}

// ----------------------------------------------------------------------------
// CRT PHOTO DEMO COMPONENT (16:9 Frame with CRT Phosphor Filter & Color Toggle)
// ----------------------------------------------------------------------------
interface CRTPhotoDemoProps {
  screenshot: string;
  title: string;
  category: string;
  isCardHovered?: boolean;
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
  className?: string;
  showColorToggle?: boolean;
}

const CRTPhotoDemo: React.FC<CRTPhotoDemoProps> = ({
  screenshot,
  title,
  category,
  isCardHovered = false,
  bright,
  mid,
  dim,
  voidCol,
  className = '',
  showColorToggle = true,
}) => {
  const [explicitMode, setExplicitMode] = useState<'color' | 'mono' | null>(null);
  const [isFrameHovered, setIsFrameHovered] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const isFullColor =
    explicitMode !== null
      ? explicitMode === 'color'
      : isCardHovered || isFrameHovered;
  const showFallback = !screenshot || imgError;

  return (
    <div
      data-testid="crt-photo-frame"
      onMouseEnter={() => setIsFrameHovered(true)}
      onMouseLeave={() => {
        setIsFrameHovered(false);
        setExplicitMode(null);
      }}
      className={`relative w-full aspect-video overflow-hidden border select-none group ${className}`}
      style={{
        borderColor: isFullColor ? bright : `${mid}80`,
        backgroundColor: voidCol,
      }}
    >
      {/* Fallback preview if image fails or is missing */}
      {showFallback ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center font-mono gap-1"
          style={{ backgroundColor: `${dim}40`, color: bright }}
        >
          <div className="text-[8px] uppercase tracking-widest" style={{ color: mid }}>
            [ CRT PHOTO DEMO ]
          </div>
          <div className="font-pixel text-[11px] font-bold">{title}</div>
          <div className="text-[8px]" style={{ color: `${bright}aa` }}>
            {category}
          </div>
        </div>
      ) : (
        <img
          src={screenshot}
          alt={`${title} CRT Photo Demo`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-top"
          style={{
            filter: isFullColor
              ? 'none'
              : 'grayscale(100%) contrast(115%) sepia(25%) hue-rotate(55deg)',
            transition: 'filter 0.3s ease',
          }}
        />
      )}

      {/* Subtle CRT scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Retro CRT corner brackets */}
      <span className="pointer-events-none absolute top-1 left-1.5 font-mono text-[8px] opacity-70" style={{ color: bright }}>
        +
      </span>
      <span className="pointer-events-none absolute top-1 right-1.5 font-mono text-[8px] opacity-70" style={{ color: bright }}>
        +
      </span>
      <span className="pointer-events-none absolute bottom-1 left-1.5 font-mono text-[8px] opacity-70" style={{ color: bright }}>
        +
      </span>
      <span className="pointer-events-none absolute bottom-1 right-1.5 font-mono text-[8px] opacity-70" style={{ color: bright }}>
        +
      </span>

      {/* "View Original Color" / CRT toggle button */}
      {showColorToggle && (
        <div
          className="absolute bottom-1.5 right-1.5 flex items-center gap-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            data-testid="btn-toggle-photo-color"
            onClick={() => {
              try {
                watchknightAudio.play8BitBlip(720);
              } catch {}
              setExplicitMode((prev) =>
                prev === 'color' || (prev === null && isFullColor) ? 'mono' : 'color'
              );
            }}
            title={isFullColor ? 'Switch to Phosphor CRT Filter' : 'View Original Color'}
            className="px-1.5 py-0.5 border font-mono text-[7px] sm:text-[7.5px] uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
            style={{
              backgroundColor: isFullColor ? bright : `${voidCol}d9`,
              color: isFullColor ? voidCol : bright,
              borderColor: isFullColor ? bright : mid,
            }}
          >
            {isFullColor ? 'CRT Filter' : 'View Original Color'}
          </button>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// MICRO-SANDBOX 1: BitForge — Forge Lab Array Sort
// ----------------------------------------------------------------------------
export interface SortStepState {
  array: number[];
  comparing: [number, number] | null;
  swapping: boolean;
  sortedIndices: number[];
  stepCount: number;
  comparisons: number;
  swaps: number;
  status: string;
}

export const INITIAL_SORT_ARRAY = [38, 14, 62, 19, 85, 29, 76, 48];

export function buildBubbleSortSequence(initial: number[]): SortStepState[] {
  const steps: SortStepState[] = [];
  const arr = [...initial];
  const n = arr.length;
  let comparisons = 0;
  let swaps = 0;
  const sorted: number[] = [];

  // Step 0: Initial
  steps.push({
    array: [...arr],
    comparing: null,
    swapping: false,
    sortedIndices: [],
    stepCount: 0,
    comparisons: 0,
    swaps: 0,
    status: 'READY: 8 UNSORTED ARRAY BARS',
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      // Comparing state
      steps.push({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: false,
        sortedIndices: [...sorted],
        stepCount: steps.length,
        comparisons,
        swaps,
        status: `COMPARING arr[${j}]=${arr[j]} AND arr[${j + 1}]=${arr[j + 1]}`,
      });

      if (arr[j] > arr[j + 1]) {
        swaps++;
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;

        // Swapped state
        steps.push({
          array: [...arr],
          comparing: [j, j + 1],
          swapping: true,
          sortedIndices: [...sorted],
          stepCount: steps.length,
          comparisons,
          swaps,
          status: `SWAPPED: ${arr[j + 1]} <-> ${arr[j]} (INVERSION RESOLVED)`,
        });
      }
    }
    sorted.unshift(n - 1 - i);
  }
  sorted.unshift(0);

  // Final complete state
  steps.push({
    array: [...arr],
    comparing: null,
    swapping: false,
    sortedIndices: Array.from({ length: n }, (_, idx) => idx),
    stepCount: steps.length,
    comparisons,
    swaps,
    status: 'ARRAY FULLY SORTED IN O(n²) TIME',
  });

  return steps;
}

const BitForgeSortSandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const stepsRef = useRef<SortStepState[]>(buildBubbleSortSequence(INITIAL_SORT_ARRAY));
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isAutoSorting, setIsAutoSorting] = useState<boolean>(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = stepsRef.current[currentStepIdx] || stepsRef.current[0];

  const handleStep = () => {
    // If auto-sorting is actively running, clear timer and pause cleanly on manual step
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isAutoSorting) {
      setIsAutoSorting(false);
    }
    if (currentStepIdx < stepsRef.current.length - 1) {
      const nextIdx = currentStepIdx + 1;
      const nextStep = stepsRef.current[nextIdx];
      try {
        const toneFreq = nextStep.swapping ? 780 : 540;
        watchknightAudio.play8BitBlip(toneFreq);
      } catch {}
      setCurrentStepIdx(nextIdx);
    }
  };

  const handleToggleAuto = () => {
    try {
      watchknightAudio.play8BitBlip(isAutoSorting ? 440 : 880);
    } catch {}

    if (isAutoSorting) {
      setIsAutoSorting(false);
    } else {
      // If already at end, reset to start first
      if (currentStepIdx >= stepsRef.current.length - 1) {
        setCurrentStepIdx(0);
      }
      setIsAutoSorting(true);
    }
  };

  useEffect(() => {
    if (!isAutoSorting) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= stepsRef.current.length - 1) {
          return prev;
        }
        const nextIdx = prev + 1;
        const nextStep = stepsRef.current[nextIdx];
        try {
          const toneFreq = nextStep.swapping ? 820 : 580;
          watchknightAudio.play8BitBlip(toneFreq);
        } catch {}
        return nextIdx;
      });
    }, 260);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoSorting]);

  // Cleanly deactivate auto-sorting state when reaching the final step
  useEffect(() => {
    if (currentStepIdx >= stepsRef.current.length - 1 && isAutoSorting) {
      setIsAutoSorting(false);
    }
  }, [currentStepIdx, isAutoSorting]);

  const handleReset = () => {
    try {
      watchknightAudio.play8BitBlip(380);
    } catch {}
    setIsAutoSorting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentStepIdx(0);
  };

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2.5 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div
        className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1.5 border-b"
        style={{ borderColor: `${mid}40` }}
      >
        <span className="font-bold uppercase" style={{ color: bright }}>
          Forge Lab Array Sort (8 Elements • [38, 14, 62, 19, 85, 29, 76, 48])
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="btn-step-sort"
            onClick={handleStep}
            disabled={currentStepIdx >= stepsRef.current.length - 1}
            className="px-2 py-0.5 border text-[7.5px] sm:text-[8px] font-mono font-bold cursor-pointer transition-none outline-none focus-visible:outline-dashed disabled:opacity-40"
            style={{ backgroundColor: dim, borderColor: bright, color: bright }}
          >
            Step ↗
          </button>
          <button
            type="button"
            data-testid="btn-auto-sort"
            onClick={handleToggleAuto}
            className="px-2 py-0.5 border text-[7.5px] sm:text-[8px] font-mono font-bold cursor-pointer transition-none outline-none focus-visible:outline-dashed"
            style={{
              backgroundColor: isAutoSorting ? bright : dim,
              borderColor: bright,
              color: isAutoSorting ? voidCol : bright,
            }}
          >
            {isAutoSorting ? 'Pause' : 'Auto-Sort'}
          </button>
          <button
            type="button"
            data-testid="btn-reset-sort"
            onClick={handleReset}
            className="px-2 py-0.5 border text-[7.5px] sm:text-[8px] font-mono cursor-pointer transition-none outline-none focus-visible:outline-dashed"
            style={{ backgroundColor: `${voidCol}cc`, borderColor: mid, color: bright }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* 8 Array Bars Visualization */}
      <div
        className="relative w-full h-[180px] sm:h-[200px] border flex items-end justify-between px-3 sm:px-6 pt-4 pb-2"
        style={{ backgroundColor: voidCol, borderColor: `${mid}50` }}
      >
        {current.array.map((val, idx) => {
          const isComparing = current.comparing?.includes(idx);
          const isSwapping = isComparing && current.swapping;
          const isSorted = current.sortedIndices.includes(idx);

          let barBg = `${dim}bb`;
          let barBorder = mid;
          let textColor = `${bright}bb`;

          if (isSwapping) {
            barBg = '#FF2A85'; // crest magenta for swap
            barBorder = '#FF2A85';
            textColor = '#FFFFFF';
          } else if (isComparing) {
            barBg = '#00F0FF'; // wave cyan for comparison
            barBorder = '#00F0FF';
            textColor = voidCol;
          } else if (isSorted) {
            barBg = bright;
            barBorder = bright;
            textColor = voidCol;
          }

          const heightPercent = Math.max(16, (val / 85) * 85);

          return (
            <div
              key={`sort-bar-${val}`}
              data-testid={`sort-bar-${idx}`}
              className="flex flex-col items-center justify-end h-full flex-1 max-w-[34px] sm:max-w-[44px] mx-1 transition-all duration-150"
            >
              <span
                className="font-mono text-[7px] sm:text-[8px] font-bold mb-1"
                style={{ color: isComparing ? '#00F0FF' : textColor }}
              >
                {val}
              </span>
              <div
                className="w-full border transition-all duration-150"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: barBg,
                  borderColor: barBorder,
                }}
              />
              <span className="font-mono text-[6.5px] sm:text-[7px] mt-1" style={{ color: mid }}>
                [{idx}]
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Telemetry Readout */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[7px] sm:text-[8px] font-mono gap-1 pt-1 border-t"
        style={{ borderColor: `${mid}40`, color: mid }}
      >
        <div className="flex items-center gap-3">
          <span>
            STEP: <strong style={{ color: bright }}>{current.stepCount}</strong> /{' '}
            {stepsRef.current.length - 1}
          </span>
          <span>
            COMPARISONS: <strong style={{ color: bright }}>{current.comparisons}</strong>
          </span>
          <span>
            SWAPS: <strong style={{ color: bright }}>{current.swaps}</strong>
          </span>
        </div>
        <span className="font-bold truncate" style={{ color: current.swapping ? '#FF2A85' : bright }}>
          {current.status}
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MICRO-SANDBOX 2: FocusLab — Aperture Reflex Check
// ----------------------------------------------------------------------------
type ReflexState = 'IDLE' | 'ARMED' | 'FLASHING' | 'MEASURED' | 'TOO_EARLY';

const FocusLabReflexSandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const [state, setState] = useState<ReflexState>('IDLE');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashStartTimeRef = useRef<number>(0);

  const startReflexTest = () => {
    try {
      watchknightAudio.play8BitBlip(640);
    } catch {}
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    setReactionTime(null);
    setState('ARMED');

    // Random delay between 1200ms and 2800ms
    const delay = Math.floor(Math.random() * 1600) + 1200;
    flashTimerRef.current = setTimeout(() => {
      flashStartTimeRef.current = performance.now();
      setState('FLASHING');
      try {
        watchknightAudio.play8BitBlip(920);
      } catch {}
    }, delay);
  };

  const handleRingClick = () => {
    if (state === 'ARMED') {
      // Clicked too early
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setState('TOO_EARLY');
      try {
        watchknightAudio.play8BitBlip(180);
      } catch {}
    } else if (state === 'FLASHING') {
      const rt = Math.round(performance.now() - flashStartTimeRef.current);
      setReactionTime(rt);
      setState('MEASURED');
      try {
        watchknightAudio.play8BitBlip(760);
      } catch {}
    } else if (state === 'IDLE' || state === 'TOO_EARLY' || state === 'MEASURED') {
      startReflexTest();
    }
  };

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const sampleMedian = 287;
  const delta = reactionTime !== null ? sampleMedian - reactionTime : null;

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2.5 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div
        className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1.5 border-b"
        style={{ borderColor: `${mid}40` }}
      >
        <span className="font-bold uppercase" style={{ color: bright }}>
          Aperture Reflex Check (3-Minute Visual Reaction Studio)
        </span>
        <button
          type="button"
          data-testid="btn-start-reflex"
          onClick={handleRingClick}
          className="px-2 py-0.5 border text-[7.5px] sm:text-[8px] font-mono font-bold cursor-pointer transition-none outline-none focus-visible:outline-dashed"
          style={{ backgroundColor: dim, borderColor: bright, color: bright }}
        >
          {state === 'ARMED'
            ? 'Armed (Wait...)'
            : state === 'FLASHING'
            ? 'CLICK FLASH NOW!'
            : 'Start Reflex Check'}
        </button>
      </div>

      {/* Interactive Aperture Ring */}
      <div
        data-testid="aperture-reflex-ring"
        onClick={handleRingClick}
        className="relative w-full h-[180px] sm:h-[200px] border flex flex-col items-center justify-center cursor-pointer transition-colors"
        style={{
          backgroundColor: state === 'FLASHING' ? `${bright}25` : voidCol,
          borderColor: state === 'FLASHING' ? bright : `${mid}50`,
        }}
      >
        <div
          className={`relative rounded-full flex flex-col items-center justify-center border-2 transition-all ${
            state === 'FLASHING' ? 'scale-110 shadow-lg' : ''
          }`}
          style={{
            width: '130px',
            height: '130px',
            borderColor:
              state === 'FLASHING'
                ? '#00F0FF'
                : state === 'TOO_EARLY'
                ? '#FF2A85'
                : state === 'MEASURED'
                ? bright
                : mid,
            backgroundColor:
              state === 'FLASHING'
                ? '#00F0FF20'
                : state === 'TOO_EARLY'
                ? '#FF2A8520'
                : `${dim}40`,
            boxShadow:
              state === 'FLASHING' ? '0 0 25px rgba(0, 240, 255, 0.6)' : 'none',
          }}
        >
          {/* Inner concentric ring */}
          <div
            className="absolute rounded-full border border-dashed pointer-events-none"
            style={{ width: '84px', height: '84px', borderColor: `${mid}80` }}
          />

          {/* Aperture Center Status */}
          {state === 'IDLE' && (
            <div className="text-center font-mono text-[8px] p-2" style={{ color: bright }}>
              CLICK TO
              <br />
              <strong style={{ color: '#00F0FF' }}>PRIME APERTURE</strong>
            </div>
          )}
          {state === 'ARMED' && (
            <div className="text-center font-mono text-[7.5px] animate-pulse p-2" style={{ color: mid }}>
              WAIT FOR FLASH...
              <br />
              (DO NOT CLICK)
            </div>
          )}
          {state === 'FLASHING' && (
            <div className="text-center font-mono text-[10px] font-bold p-2" style={{ color: '#00F0FF' }}>
              CLICK NOW!
            </div>
          )}
          {state === 'TOO_EARLY' && (
            <div className="text-center font-mono text-[7.5px] p-2" style={{ color: '#FF2A85' }}>
              Too early! Wait for flash
              <br />
              (Click to retry)
            </div>
          )}
          {state === 'MEASURED' && reactionTime !== null && (
            <div className="text-center font-mono p-1">
              <span className="font-pixel text-base font-bold" style={{ color: bright }}>
                {reactionTime} ms
              </span>
              <div
                className="text-[6.5px] sm:text-[7px]"
                style={{
                  color:
                    delta !== null && delta > 0
                      ? '#4AF626'
                      : delta === 0
                      ? bright
                      : '#FFCC00',
                }}
              >
                {delta !== null && delta > 0
                  ? `+${delta} ms faster than median`
                  : delta === 0
                  ? `Matches sample median (${sampleMedian} ms)`
                  : `${Math.abs(delta!)} ms slower than median`}
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 text-[7px] font-mono" style={{ color: mid }}>
          {state === 'ARMED' ? 'APERTURE SENSOR ARMED' : 'CLICK APERTURE RING TO TEST'}
        </div>
      </div>

      {/* Telemetry Footer */}
      <div
        className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono pt-1 border-t"
        style={{ borderColor: `${mid}40`, color: mid }}
      >
        <span>
          SAMPLE MEDIAN: <strong style={{ color: bright }}>{sampleMedian} ms</strong>
        </span>
        <span>
          YOUR REACTION:{' '}
          <strong style={{ color: reactionTime ? bright : mid }}>
            {reactionTime ? `${reactionTime} ms` : '--'}
          </strong>
        </span>
        <span>PRECISION: SUB-MS HIGH-RES TIMER</span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MICRO-SANDBOX 3: Rannabanna — Kitchen Staples Matchmaker
// ----------------------------------------------------------------------------
export interface PantryRecipe {
  id: string;
  name: string;
  bengaliName: string;
  cuisine: string;
  prepTime: string;
  ingredients: string[];
}

export const PANTRY_STAPLES = [
  'Red Onion',
  'Garlic',
  'Ginger',
  'Egg',
  'Basmati Rice',
  'Chicken Breast',
];

export const PANTRY_RECIPES: PantryRecipe[] = [
  {
    id: 'dim-bhuna',
    name: 'Bengali Dim Bhuna',
    bengaliName: 'ডিম ভুনা',
    cuisine: 'Bengali Traditional',
    prepTime: '25 min',
    ingredients: ['Egg', 'Red Onion', 'Garlic', 'Ginger'],
  },
  {
    id: 'chicken-biryani',
    name: 'Basmati Chicken Biryani',
    bengaliName: 'চিকেন বিরিয়ানি',
    cuisine: 'South Asian Heritage',
    prepTime: '45 min',
    ingredients: ['Chicken Breast', 'Basmati Rice', 'Red Onion', 'Ginger', 'Garlic'],
  },
  {
    id: 'egg-fried-rice',
    name: 'Garlic Egg Fried Rice',
    bengaliName: 'গার্লিক এগ ফ্রাইড রাইস',
    cuisine: 'Pan-Asian Wok',
    prepTime: '15 min',
    ingredients: ['Egg', 'Basmati Rice', 'Garlic', 'Red Onion'],
  },
  {
    id: 'ginger-chicken',
    name: 'Ginger Glazed Chicken',
    bengaliName: 'জিঞ্জার চিকেন',
    cuisine: 'Global Stir-Fry',
    prepTime: '20 min',
    ingredients: ['Chicken Breast', 'Ginger', 'Garlic', 'Red Onion'],
  },
  {
    id: 'dhaka-morog-polao',
    name: 'Dhaka Morog Polao',
    bengaliName: 'মোরগ পোলাও',
    cuisine: 'Old Dhaka Heritage',
    prepTime: '40 min',
    ingredients: ['Chicken Breast', 'Basmati Rice', 'Red Onion', 'Ginger', 'Garlic'],
  },
];

const RannabannaPantrySandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const [selectedStaples, setSelectedStaples] = useState<string[]>([
    'Red Onion',
    'Garlic',
    'Egg',
  ]);

  const toggleStaple = (item: string) => {
    try {
      watchknightAudio.play8BitBlip(selectedStaples.includes(item) ? 460 : 780);
    } catch {}

    setSelectedStaples((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Score recipes by matched ingredient count
  const scoredRecipes = PANTRY_RECIPES.map((recipe) => {
    const matched = recipe.ingredients.filter((ing) => selectedStaples.includes(ing));
    const percent = Math.round((matched.length / recipe.ingredients.length) * 100);
    return {
      ...recipe,
      matchedCount: matched.length,
      matchPercent: percent,
    };
  }).sort((a, b) => b.matchPercent - a.matchPercent);

  // Truly filter to only recipes that match at least 1 selected staple
  const filteredRecipes = scoredRecipes.filter((r) => r.matchedCount > 0);

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2.5 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div
        className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1.5 border-b"
        style={{ borderColor: `${mid}40` }}
      >
        <span className="font-bold uppercase" style={{ color: bright }}>
          Kitchen Staples Matchmaker (Tap staples to filter recipes in real time)
        </span>
        <button
          type="button"
          data-testid="btn-toggle-all-staples"
          onClick={() => {
            try {
              watchknightAudio.play8BitBlip(520);
            } catch {}
            setSelectedStaples(
              selectedStaples.length === PANTRY_STAPLES.length ? [] : [...PANTRY_STAPLES]
            );
          }}
          className="px-1.5 py-0.5 border text-[7px] font-mono cursor-pointer transition-none outline-none focus-visible:outline-dashed"
          style={{ backgroundColor: dim, borderColor: bright, color: bright }}
        >
          {selectedStaples.length === PANTRY_STAPLES.length ? 'Clear All' : 'Select All'}
        </button>
      </div>

      {/* Ingredient Pills Bar */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {PANTRY_STAPLES.map((staple) => {
          const isSelected = selectedStaples.includes(staple);
          return (
            <button
              key={staple}
              type="button"
              data-testid={`staple-pill-${staple.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => toggleStaple(staple)}
              className="px-2 py-1 border font-mono text-[7.5px] sm:text-[8px] font-bold cursor-pointer transition-none outline-none focus-visible:outline-dashed flex items-center gap-1"
              style={{
                backgroundColor: isSelected ? bright : `${dim}40`,
                color: isSelected ? voidCol : bright,
                borderColor: isSelected ? bright : mid,
              }}
            >
              <span>{isSelected ? '[✓]' : '[ ]'}</span>
              <span>{staple}</span>
            </button>
          );
        })}
      </div>

      {/* Real-time Filtered Recipe Cards */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              data-testid={`pantry-recipe-card-${recipe.id}`}
              className="p-2 border flex flex-col justify-between gap-1 transition-none"
              style={{
                backgroundColor: `${voidCol}95`,
                borderColor: recipe.matchPercent === 100 ? bright : `${mid}60`,
              }}
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <span className="font-mono text-[7px] font-bold" style={{ color: mid }}>
                    {recipe.cuisine} • {recipe.prepTime}
                  </span>
                  <h4 className="font-bold text-[8.5px] sm:text-[9px]" style={{ color: bright }}>
                    {recipe.name}{' '}
                    <span className="font-normal text-[7.5px]" style={{ color: `${bright}aa` }}>
                      ({recipe.bengaliName})
                    </span>
                  </h4>
                </div>
                <span
                  className="px-1 py-0.5 border text-[7px] font-mono font-bold whitespace-nowrap"
                  style={{
                    backgroundColor: recipe.matchPercent === 100 ? bright : `${dim}60`,
                    color: recipe.matchPercent === 100 ? voidCol : bright,
                    borderColor: bright,
                  }}
                >
                  {recipe.matchPercent}% Match
                </span>
              </div>

              <div className="flex flex-wrap gap-1 text-[6.5px] font-mono mt-0.5">
                {recipe.ingredients.map((ing) => {
                  const hasItem = selectedStaples.includes(ing);
                  return (
                    <span
                      key={ing}
                      className="px-1 py-0.2 border"
                      style={{
                        borderColor: hasItem ? `${bright}80` : `${mid}40`,
                        color: hasItem ? bright : `${mid}99`,
                        backgroundColor: hasItem ? `${dim}50` : 'transparent',
                      }}
                    >
                      {hasItem ? '● ' : '○ '}
                      {ing}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="p-4 border text-center font-mono text-[8px] flex flex-col items-center justify-center gap-1"
          style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}80`, color: mid }}
        >
          <span style={{ color: bright }}>NO MATCHING RECIPES</span>
          <span>
            {selectedStaples.length === 0
              ? 'No pantry staples selected. Tap ingredients above to filter recipes.'
              : 'Select additional staples to find matching dishes.'}
          </span>
        </div>
      )}

      <div
        className="flex items-center justify-between text-[7px] font-mono pt-1 border-t"
        style={{ borderColor: `${mid}40`, color: mid }}
      >
        <span>
          MATCHED RECIPES:{' '}
          <strong style={{ color: bright }}>
            {filteredRecipes.length} / {PANTRY_RECIPES.length}
          </strong>
        </span>
        <span>LATENCY: &lt;15ms CLIENT-SIDE INDEXED QUERY</span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MICRO-SANDBOX 4: DocLensBD — 3D Eyewear Frame & Lens Configurator
// ----------------------------------------------------------------------------
const EYEWEAR_FRAMES = [
  { id: 'aviator', name: 'Titanium Aviator', style: 'Teardrop Double-Bridge' },
  { id: 'wayfarer', name: 'Matte Wayfarer', style: 'Trapezoid Bold Acetate' },
  { id: 'hexagon', name: 'Cyber Hexagon', style: 'Slim Geometric Wireframe' },
  { id: 'round', name: 'Round Tortoise', style: 'Classic Pantoscopic Round' },
];

const LENS_TINTS = [
  { id: 'clear', name: 'Clear Optical', hex: 'rgba(255, 255, 255, 0.15)' },
  { id: 'blu', name: 'Amber BLU Filter', hex: 'rgba(255, 204, 0, 0.35)' },
  { id: 'green', name: 'Cyber Green Polarized', hex: 'rgba(74, 246, 38, 0.35)' },
  { id: 'smoke', name: 'Dark Smoke UV400', hex: 'rgba(10, 10, 10, 0.65)' },
];

const DocLensTryOnSandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const [activeFrameId, setActiveFrameId] = useState<string>('aviator');
  const [activeTintId, setActiveTintId] = useState<string>('blu');
  const [pupilDistance, setPupilDistance] = useState<number>(63);

  const activeFrame =
    EYEWEAR_FRAMES.find((f) => f.id === activeFrameId) || EYEWEAR_FRAMES[0];
  const activeTint =
    LENS_TINTS.find((t) => t.id === activeTintId) || LENS_TINTS[0];

  // Scale pupillary distance (56mm - 74mm, median 63mm) to SVG face mesh coordinates (center 160, eye centers 122 & 198)
  const halfPdSvg = (pupilDistance * 38) / 63;
  const leftEyeX = 160 - halfPdSvg;
  const rightEyeX = 160 + halfPdSvg;

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2.5 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div
        className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1.5 border-b"
        style={{ borderColor: `${mid}40` }}
      >
        <span className="font-bold uppercase" style={{ color: bright }}>
          3D Eyewear Frame &amp; Lens Configurator (Real-Time Mesh Preview)
        </span>
        <div className="flex items-center gap-1 font-mono text-[7px]" style={{ color: mid }}>
          <span>PD:</span>
          <button
            type="button"
            onClick={() => {
              try { watchknightAudio.play8BitBlip(540); } catch {}
              setPupilDistance((prev) => Math.max(56, prev - 1));
            }}
            className="px-1 border cursor-pointer font-bold"
            style={{ borderColor: mid, color: bright, backgroundColor: dim }}
          >
            -
          </button>
          <span className="font-bold px-1" style={{ color: bright }}>
            {pupilDistance} mm
          </span>
          <button
            type="button"
            onClick={() => {
              try { watchknightAudio.play8BitBlip(620); } catch {}
              setPupilDistance((prev) => Math.min(74, prev + 1));
            }}
            className="px-1 border cursor-pointer font-bold"
            style={{ borderColor: mid, color: bright, backgroundColor: dim }}
          >
            +
          </button>
        </div>
      </div>

      {/* Frame & Tint Selector Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-wrap gap-1 items-center">
          <span className="font-mono text-[7px] uppercase" style={{ color: mid }}>
            Frame:
          </span>
          {EYEWEAR_FRAMES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                try {
                  watchknightAudio.play8BitBlip(680);
                } catch {}
                setActiveFrameId(f.id);
              }}
              className="px-1.5 py-0.5 border font-mono text-[7px] cursor-pointer transition-none outline-none focus-visible:outline-dashed"
              style={{
                backgroundColor: activeFrameId === f.id ? bright : `${dim}40`,
                color: activeFrameId === f.id ? voidCol : bright,
                borderColor: activeFrameId === f.id ? bright : mid,
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 items-center">
          <span className="font-mono text-[7px] uppercase" style={{ color: mid }}>
            Tint:
          </span>
          {LENS_TINTS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                try {
                  watchknightAudio.play8BitBlip(840);
                } catch {}
                setActiveTintId(t.id);
              }}
              className="px-1.5 py-0.5 border font-mono text-[7px] cursor-pointer transition-none outline-none focus-visible:outline-dashed"
              style={{
                backgroundColor: activeTintId === t.id ? bright : `${dim}40`,
                color: activeTintId === t.id ? voidCol : bright,
                borderColor: activeTintId === t.id ? bright : mid,
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Wireframe / Landmark Simulation Stage */}
      <div
        className="relative w-full h-[180px] sm:h-[200px] border flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: voidCol, borderColor: `${mid}50` }}
      >
        <svg
          viewBox="0 0 320 180"
          className="w-full h-full max-w-[400px] max-h-[190px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Face Silhouette Outline */}
          <path
            d="M 90 60 C 90 20 230 20 230 60 C 230 110 210 160 160 170 C 110 160 90 110 90 60 Z"
            stroke={`${mid}40`}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Facial Landmark Points */}
          <circle cx="160" cy="50" r="2" fill={`${mid}60`} />
          <circle cx="160" cy="95" r="2" fill={`${mid}60`} />
          <circle cx="160" cy="135" r="2" fill={`${mid}60`} />
          <circle cx="130" cy="115" r="2" fill={`${mid}40`} />
          <circle cx="190" cy="115" r="2" fill={`${mid}40`} />

          {/* Pupil Distance Alignment Axis Line */}
          <line
            x1={leftEyeX}
            y1="75"
            x2={rightEyeX}
            y2="75"
            stroke="#00F0FF"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            opacity="0.6"
          />

          {/* Left Pupil Reticle */}
          <circle cx={leftEyeX} cy="75" r="3" stroke="#00F0FF" strokeWidth="1" />
          <circle cx={leftEyeX} cy="75" r="1" fill="#00F0FF" />
          <line
            x1={leftEyeX - 6}
            y1="75"
            x2={leftEyeX + 6}
            y2="75"
            stroke="#00F0FF"
            strokeWidth="0.8"
          />
          <line
            x1={leftEyeX}
            y1="69"
            x2={leftEyeX}
            y2="81"
            stroke="#00F0FF"
            strokeWidth="0.8"
          />

          {/* Right Pupil Reticle */}
          <circle cx={rightEyeX} cy="75" r="3" stroke="#00F0FF" strokeWidth="1" />
          <circle cx={rightEyeX} cy="75" r="1" fill="#00F0FF" />
          <line
            x1={rightEyeX - 6}
            y1="75"
            x2={rightEyeX + 6}
            y2="75"
            stroke="#00F0FF"
            strokeWidth="0.8"
          />
          <line
            x1={rightEyeX}
            y1="69"
            x2={rightEyeX}
            y2="81"
            stroke="#00F0FF"
            strokeWidth="0.8"
          />

          {/* Real-time PD Readout Indicator */}
          <text
            x="160"
            y="52"
            textAnchor="middle"
            fill="#00F0FF"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            PD: {pupilDistance}mm
          </text>

          {/* Eyewear Frame Rendering based on activeFrameId */}
          {activeFrameId === 'aviator' && (
            <g>
              {/* Left Lens */}
              <path
                d="M 100 60 C 120 58 145 60 148 75 C 145 96 115 100 100 85 C 92 75 92 65 100 60 Z"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="2"
              />
              {/* Right Lens */}
              <path
                d="M 220 60 C 200 58 175 60 172 75 C 175 96 205 100 220 85 C 228 75 228 65 220 60 Z"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="2"
              />
              {/* Double Bridge */}
              <line x1="148" y1="65" x2="172" y2="65" stroke={bright} strokeWidth="1.5" />
              <line x1="146" y1="72" x2="174" y2="72" stroke={bright} strokeWidth="1.5" />
              {/* Temples */}
              <line x1="94" y1="65" x2="72" y2="60" stroke={bright} strokeWidth="1.5" />
              <line x1="226" y1="65" x2="248" y2="60" stroke={bright} strokeWidth="1.5" />
            </g>
          )}

          {activeFrameId === 'wayfarer' && (
            <g>
              {/* Left Trapezoid */}
              <polygon
                points="95,58 150,60 144,92 105,90"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="3.5"
              />
              {/* Right Trapezoid */}
              <polygon
                points="225,58 170,60 176,92 215,90"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="3.5"
              />
              <line x1="150" y1="64" x2="170" y2="64" stroke={bright} strokeWidth="3" />
              <line x1="95" y1="62" x2="70" y2="60" stroke={bright} strokeWidth="2.5" />
              <line x1="225" y1="62" x2="250" y2="60" stroke={bright} strokeWidth="2.5" />
            </g>
          )}

          {activeFrameId === 'hexagon' && (
            <g>
              {/* Left Hexagon */}
              <polygon
                points="95,72 110,58 140,58 150,72 140,88 110,88"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="2"
              />
              {/* Right Hexagon */}
              <polygon
                points="225,72 210,58 180,58 170,72 180,88 210,88"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="2"
              />
              <line x1="150" y1="72" x2="170" y2="72" stroke={bright} strokeWidth="1.5" />
              <line x1="95" y1="72" x2="70" y2="68" stroke={bright} strokeWidth="1.5" />
              <line x1="225" y1="72" x2="250" y2="68" stroke={bright} strokeWidth="1.5" />
            </g>
          )}

          {activeFrameId === 'round' && (
            <g>
              {/* Left Round */}
              <circle
                cx="122"
                cy="75"
                r="24"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="2"
              />
              {/* Right Round */}
              <circle
                cx="198"
                cy="75"
                r="24"
                fill={activeTint.hex}
                stroke={bright}
                strokeWidth="2"
              />
              <path d="M 146 72 Q 160 67 174 72" stroke={bright} strokeWidth="1.5" fill="none" />
              <line x1="98" y1="74" x2="72" y2="70" stroke={bright} strokeWidth="1.5" />
              <line x1="222" y1="74" x2="248" y2="70" stroke={bright} strokeWidth="1.5" />
            </g>
          )}
        </svg>

        <div className="absolute bottom-2 left-2 font-mono text-[7px]" style={{ color: mid }}>
          ACTIVE: {activeFrame.name} • {activeTint.name}
        </div>
      </div>

      <div
        className="flex items-center justify-between text-[7px] font-mono pt-1 border-t"
        style={{ borderColor: `${mid}40`, color: mid }}
      >
        <span>CATALOG: 198+ PRECISION FRAMES</span>
        <span>FACE TRACKING: 468 MESH LANDMARKS • 60 FPS</span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MAIN VIEW COMPONENT: ProjectsView
// ----------------------------------------------------------------------------
export const ProjectsView: React.FC<ProjectsViewProps> = ({ palette, initialSelectedProjectId }) => {
  const os = useRetroOS();

  const bright = palette?.bright ?? (os.phosphorMode === 'amber' ? '#d4a359' : '#c2cdb4');
  const voidCol = palette?.void ?? (os.phosphorMode === 'amber' ? '#140f07' : '#111712');
  const mid = palette?.mid ?? (os.phosphorMode === 'amber' ? '#8c6830' : '#6e7d62');
  const dim = palette?.dim ?? (os.phosphorMode === 'amber' ? '#3d2b12' : '#2e3b2b');

  const effectiveTargetId = initialSelectedProjectId ?? os.selectedProjectId;

  // 1. Single Selected Project for Unfolding Case Study Reader View (null = 2x2 Grid view)
  const [selectedProject, setSelectedProject] = useState<FlagshipProject | null>(() => {
    if (effectiveTargetId) {
      return (
        FLAGSHIP_PROJECTS.find(
          (p) =>
            p.id === effectiveTargetId ||
            p.index === effectiveTargetId ||
            p.id.toLowerCase().includes(effectiveTargetId.toLowerCase()) ||
            p.title.toLowerCase() === effectiveTargetId.toLowerCase()
        ) ?? null
      );
    }
    return null;
  });

  // Sync selected project whenever initialSelectedProjectId prop or os.selectedProjectId updates
  useEffect(() => {
    const targetId = initialSelectedProjectId ?? os.selectedProjectId;
    if (targetId) {
      const match = FLAGSHIP_PROJECTS.find(
        (p) =>
          p.id === targetId ||
          p.index === targetId ||
          p.id.toLowerCase().includes(targetId.toLowerCase()) ||
          p.title.toLowerCase() === targetId.toLowerCase()
      );
      if (match) {
        setSelectedProject(match);
      }
    }
  }, [initialSelectedProjectId, os.selectedProjectId]);

  // 2. Interactive Sandbox toggle state inside Case Study Detail View (live by default)
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Audio blip helper
  const playClickSound = (freq: number = 640) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {}
  };

  // Transition into Case Study Detail View with Bayer Dither
  const handleOpenDetailView = (proj: FlagshipProject) => {
    playClickSound(880);
    setIsSandboxOpen(true);

    const perform = () => {
      setSelectedProject(proj);
      const viewport = document.querySelector('[data-testid="retro-window-content-viewport"]');
      if (viewport) {
        viewport.scrollTop = 0;
      }
    };

    if (os.triggerDitherTransition) {
      os.triggerDitherTransition(perform);
    } else {
      perform();
    }
  };

  // Transition back to 2x2 Flagship Project Grid with Bayer Dither
  const handleBackToGrid = () => {
    playClickSound(640);
    setIsSandboxOpen(false);

    const perform = () => {
      setSelectedProject(null);
      if (os.setSelectedProjectId) {
        os.setSelectedProjectId(null);
      }
      const viewport = typeof document !== 'undefined' ? document.querySelector('[data-testid="retro-window-content-viewport"]') : null;
      if (viewport) {
        viewport.scrollTop = 0;
      }
    };

    if (os.triggerDitherTransition) {
      os.triggerDitherTransition(perform);
    } else {
      perform();
    }
  };

  return (
    <article
      data-testid="retro-content-projects"
      className="flex flex-col gap-5 font-pixel select-text"
      style={{ color: bright }}
    >
      {/* ============================================================== */}
      {/* TIER 1: CURATED 2x2 FLAGSHIP PROJECT GRID (DEFAULT WORK VIEW)  */}
      {/* ============================================================== */}
      {selectedProject === null ? (
        <>
          {/* SECTION HEADER: Clean title + Right-aligned GitHub Link */}
          <header
            className="pb-2 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 font-bold uppercase tracking-wide"
            style={{ borderColor: mid }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs tracking-wider" style={{ color: bright }}>
                Selected Engineering Work
              </span>
            </div>
            <a
              href="https://github.com/watchknight?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClickSound(800)}
              className="font-mono text-xs hover:underline self-start sm:self-auto outline-none focus-visible:outline-dashed"
              style={{ color: bright }}
            >
              View All on GitHub (@watchknight)
            </a>
          </header>

          {/* SPACIOUS 2x2 FLAGSHIP PROJECT GRID (1 col mobile, 2 col desktop, 20px gap) */}
          <section
            data-testid="flagship-projects-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-[20px]"
            style={{ padding: '20px', border: `1px solid ${mid}` }}
          >
            {FLAGSHIP_PROJECTS.map((project) => {
              const isHovered = hoveredCardId === project.id;
              return (
                <div
                  key={project.id}
                  data-testid={`flagship-card-${project.index}`}
                  onMouseEnter={() => setHoveredCardId(project.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="flex flex-col lg:flex-row gap-4 justify-between transition-colors cursor-pointer"
                  style={{
                    padding: '20px',
                    border: `1px solid ${isHovered ? bright : mid}`,
                    backgroundColor: isHovered ? `${dim}55` : `${dim}28`,
                  }}
                  onClick={() => handleOpenDetailView(project)}
                >
                  {/* Left Column (42% width): 16:9 CRT Phosphor Photo Demo Thumbnail */}
                  <div className="w-full lg:w-[42%] shrink-0 flex flex-col justify-between gap-2.5">
                    {/* Top Row: Index and Category Tag */}
                    <div className="flex items-center justify-between font-mono text-xs font-bold tracking-wider">
                      <span style={{ color: bright }}>{project.index}</span>
                      <span
                        className="px-1.5 py-0.5 border text-[10px]"
                        style={{
                          borderColor: `${mid}80`,
                          backgroundColor: `${voidCol}80`,
                          color: bright,
                        }}
                      >
                        {project.category}
                      </span>
                    </div>

                    {/* 16:9 CRT Photo Demo Frame */}
                    <CRTPhotoDemo
                      screenshot={project.screenshot}
                      title={project.title}
                      category={project.category}
                      isCardHovered={isHovered}
                      bright={bright}
                      mid={mid}
                      dim={dim}
                      voidCol={voidCol}
                      showColorToggle={true}
                    />

                    <div className="flex items-center justify-between font-mono text-[9px]" style={{ color: mid }}>
                      <span>{FLAGSHIP_STACK_CAPTIONS[project.id] ?? 'React • TypeScript'}</span>
                      <span className="hidden lg:inline">{project.year}</span>
                    </div>
                  </div>

                  {/* Right Column (58% width): Title, Tagline/Summary, Key Metrics Badge, Action Row */}
                  <div className="w-full lg:w-[58%] flex flex-col justify-between gap-3 min-w-0">
                    <div className="flex flex-col gap-2">
                      {/* Title + 1-sentence high-impact summary in Plus Jakarta Sans */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h2
                            className="font-bold text-sm sm:text-base tracking-wide"
                            style={{ color: bright }}
                          >
                            {project.title}
                          </h2>
                          <span className="lg:hidden font-mono text-[9px]" style={{ color: mid }}>
                            {project.year}
                          </span>
                        </div>
                        {project.tagline && (
                          <div
                            className="font-mono text-xs font-semibold tracking-wide"
                            style={{ color: mid }}
                          >
                            {project.tagline}
                          </div>
                        )}
                        <p
                          className="font-body leading-relaxed"
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '15.5px',
                            lineHeight: 1.65,
                            color: bright,
                          }}
                        >
                          {project.summary}
                        </p>
                      </div>

                      {/* Single key quantified outcome / metrics badge */}
                      <div
                        className="p-2 border text-center font-mono text-xs font-bold tracking-tight"
                        style={{
                          backgroundColor: `${voidCol}95`,
                          borderColor: isHovered ? bright : `${mid}70`,
                          color: bright,
                        }}
                      >
                        {project.outcomeBadge}
                      </div>
                    </div>

                    {/* Bottom action row: Read Case Study, Live Demo, GitHub */}
                    <div
                      className="flex items-center justify-between gap-2 pt-3 mt-2 border-t flex-wrap"
                      style={{ borderColor: `${mid}40` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        data-testid={`retro-btn-read-case-study-${project.index}`}
                        onClick={() => handleOpenDetailView(project)}
                        className="px-2.5 py-1.5 min-h-[44px] flex items-center justify-center border font-mono font-bold text-xs uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
                        style={{
                          backgroundColor: bright,
                          color: voidCol,
                          borderColor: bright,
                        }}
                      >
                        Read Case Study
                      </button>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playClickSound(760)}
                          className="px-2.5 py-1.5 min-h-[44px] flex items-center justify-center border hover:underline outline-none focus-visible:outline-dashed"
                          style={{ borderColor: mid, color: bright }}
                        >
                          Live Demo
                        </a>

                        <a
                          href={project.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playClickSound(720)}
                          className="px-2.5 py-1.5 min-h-[44px] flex items-center justify-center border hover:underline outline-none focus-visible:outline-dashed"
                          style={{ borderColor: mid, color: bright }}
                        >
                          GitHub
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* ============================================================== */}
          {/* SECTION: MORE LIVE DEPLOYED WEB APPS (3 RENDER APPLICATIONS)   */}
          {/* ============================================================== */}
          <section
            data-testid="more-live-deployed-apps"
            className="flex flex-col gap-3 pt-2 border-t"
            style={{ borderColor: `${mid}60` }}
          >
            <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wide">
              <span style={{ color: bright }}>More Live Deployed Web Apps</span>
              <span className="font-mono text-[9px]" style={{ color: mid }}>
                Render Deployments
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MORE_DEPLOYED_APPS.map((app) => (
                <div
                  key={app.id}
                  data-testid={`deployed-app-card-${app.id}`}
                  className="p-3 border flex flex-col justify-between gap-3 transition-colors"
                  style={{
                    backgroundColor: `${dim}20`,
                    borderColor: `${mid}60`,
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-bold text-sm tracking-wide" style={{ color: bright }}>
                      {app.title}
                    </h3>
                    <p
                      className="font-body text-xs leading-relaxed"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: `${bright}cc`,
                        lineHeight: 1.5,
                      }}
                    >
                      {app.tagline}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t font-mono text-xs" style={{ borderColor: `${mid}30` }}>
                    <a
                      href={app.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playClickSound(760)}
                      className="flex-1 text-center px-2 py-1.5 border font-bold hover:underline outline-none focus-visible:outline-dashed"
                      style={{
                        backgroundColor: bright,
                        color: voidCol,
                        borderColor: bright,
                      }}
                    >
                      Live App ↗
                    </a>
                    <a
                      href={app.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playClickSound(720)}
                      className="flex-1 text-center px-2 py-1.5 border hover:underline outline-none focus-visible:outline-dashed"
                      style={{
                        borderColor: mid,
                        color: bright,
                        backgroundColor: `${voidCol}80`,
                      }}
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* ============================================================== */
        /* TIER 2: UNFOLDING CASE STUDY DETAIL VIEW (READER VIEW)         */
        /* ============================================================== */
        <section
          data-testid="case-study-detail-view"
          className="flex flex-col gap-4 font-pixel select-text"
        >
          {/* TOP NAVIGATION: Back to All Projects, Live Demo, GitHub */}
          <div
            className="flex items-center justify-between pb-2 border-b flex-wrap gap-2"
            style={{ borderColor: mid }}
          >
            <button
              type="button"
              data-testid="btn-back-to-projects"
              onClick={handleBackToGrid}
              className="px-3 py-1.5 border font-mono font-bold text-xs uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
              style={{
                backgroundColor: dim,
                borderColor: bright,
                color: bright,
              }}
            >
              Back to All Projects
            </button>

            <div className="flex items-center gap-2 font-mono text-xs">
              <a
                href={selectedProject.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="case-study-live-demo-btn"
                onClick={() => playClickSound(840)}
                className="px-3 py-1.5 border font-bold hover:underline outline-none focus-visible:outline-dashed"
                style={{ backgroundColor: bright, color: voidCol, borderColor: bright }}
              >
                Live Demo ↗
              </a>
              <a
                href={selectedProject.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="case-study-github-btn"
                onClick={() => playClickSound(740)}
                className="px-3 py-1.5 border font-bold hover:underline outline-none focus-visible:outline-dashed"
                style={{ borderColor: bright, color: bright }}
              >
                GitHub
              </a>
            </div>
          </div>

          {/* WIDESCREEN 2-COLUMN CASE STUDY DASHBOARD LAYOUT (grid-template-columns: 1fr 1fr; gap: 32px;) */}
          <div
            data-testid="case-study-widescreen-dashboard"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start"
            style={{
              gap: '32px',
            }}
          >
            {/* 1. PROJECT HEADER & KEY METRICS (Row 1 Col 1 on Desktop, 1st on Mobile) */}
            <div className="lg:col-start-1 lg:row-start-1 flex flex-col gap-3.5 min-w-0">
              {/* PROJECT HEADER: Title, Category, Role, Year */}
              <div
                className="p-3 sm:p-4 border flex flex-col gap-3"
                style={{ backgroundColor: `${dim}35`, borderColor: mid }}
              >
                <div>
                  <span className="font-mono text-[9px] font-bold" style={{ color: mid }}>
                    {selectedProject.index} • {selectedProject.category}
                  </span>
                  <h1
                    className="font-bold text-base sm:text-xl tracking-wide mt-0.5"
                    style={{ color: bright }}
                  >
                    {selectedProject.title}
                  </h1>
                </div>

                <div
                  className="flex items-center gap-4 text-xs font-mono"
                  style={{ color: `${bright}cc` }}
                >
                  <span>
                    ROLE: <strong style={{ color: bright }}>{selectedProject.role}</strong>
                  </span>
                  <span>
                    YEAR: <strong style={{ color: bright }}>{selectedProject.year}</strong>
                  </span>
                </div>
              </div>

              {/* KEY METRICS ROW: 3 HERO METRIC BOXES IN HORIZONTAL ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {selectedProject.heroMetrics.map((metric, idx) => (
                  <div
                    key={`${metric.label}-${idx}`}
                    className="p-3 border flex flex-col items-center justify-center text-center gap-1"
                    style={{ backgroundColor: `${voidCol}90`, borderColor: mid }}
                  >
                    <span
                      className="font-pixel text-base sm:text-lg font-bold"
                      style={{ color: bright }}
                    >
                      {metric.value}
                    </span>
                    <span
                      className="font-mono text-[9px] sm:text-[10px] uppercase font-bold"
                      style={{ color: mid }}
                    >
                      {metric.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CRT PHOTO DEMO VIEWER (Row 1 Col 2 on Desktop, 2nd on Mobile) */}
            <div className="lg:col-start-2 lg:row-start-1 flex flex-col gap-1.5 min-w-0">
              <div
                className="px-2 py-1 border flex items-center justify-between text-[10px] font-mono font-bold uppercase"
                style={{ backgroundColor: `${dim}40`, borderColor: mid, color: bright }}
              >
                <span>CRT Photo Demo Viewer</span>
                <span className="text-[9px]" style={{ color: mid }}>16:9 Phosphor Display</span>
              </div>
              <CRTPhotoDemo
                screenshot={selectedProject.screenshot}
                title={selectedProject.title}
                category={selectedProject.category}
                bright={bright}
                mid={mid}
                dim={dim}
                voidCol={voidCol}
                showColorToggle={true}
              />
            </div>

            {/* 3. INTERACTIVE MICRO-SANDBOX (Row 2 Col 2 on Desktop, 3rd on Mobile) */}
            <div className="lg:col-start-2 lg:row-start-2 flex flex-col gap-2 min-w-0">
              {selectedProject.hasSandbox && (
                <div className="flex flex-col gap-2">
                  <div
                    className="p-2 border flex items-center justify-between text-xs font-mono font-bold uppercase"
                    style={{ backgroundColor: `${dim}40`, borderColor: mid, color: bright }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 inline-block border" style={{ backgroundColor: bright, borderColor: voidCol }} />
                      Interactive Micro-Sandbox
                    </span>
                    <button
                      type="button"
                      data-testid="btn-toggle-sandbox"
                      onClick={() => {
                        playClickSound(isSandboxOpen ? 580 : 880);
                        setIsSandboxOpen((prev) => !prev);
                      }}
                      className="px-2 py-0.5 border text-[9px] uppercase cursor-pointer outline-none focus-visible:outline-dashed"
                      style={{
                        backgroundColor: isSandboxOpen ? bright : dim,
                        color: isSandboxOpen ? voidCol : bright,
                        borderColor: bright,
                      }}
                    >
                      {isSandboxOpen ? 'Hide Sandbox' : 'Show Sandbox'}
                    </button>
                  </div>

                  {isSandboxOpen && (
                    <>
                      {selectedProject.sandboxType === 'bitforge-sort' && (
                        <BitForgeSortSandbox
                          bright={bright}
                          mid={mid}
                          dim={dim}
                          voidCol={voidCol}
                        />
                      )}
                      {selectedProject.sandboxType === 'focuslab-reflex' && (
                        <FocusLabReflexSandbox
                          bright={bright}
                          mid={mid}
                          dim={dim}
                          voidCol={voidCol}
                        />
                      )}
                      {selectedProject.sandboxType === 'rannabanna-pantry' && (
                        <RannabannaPantrySandbox
                          bright={bright}
                          mid={mid}
                          dim={dim}
                          voidCol={voidCol}
                        />
                      )}
                      {selectedProject.sandboxType === 'doclens-tryon' && (
                        <DocLensTryOnSandbox
                          bright={bright}
                          mid={mid}
                          dim={dim}
                          voidCol={voidCol}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 4. CONCISE BREAKDOWN: Problem, How It Works, and Key Results (Row 2 Col 1 on Desktop, 4th on Mobile) */}
            <div className="lg:col-start-1 lg:row-start-2 flex flex-col gap-3.5 min-w-0">
              <div className="flex flex-col gap-3.5">
                {/* 1. Problem */}
                <div
                  className="p-3.5 border flex flex-col gap-1.5"
                  style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}
                >
                  <div
                    className="font-pixel text-xs font-bold uppercase tracking-wide"
                    style={{ color: bright }}
                  >
                    Problem
                  </div>
                  <p
                    className="font-body leading-relaxed"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      lineHeight: 1.65,
                      color: bright,
                    }}
                  >
                    {selectedProject.problem}
                  </p>
                </div>

                {/* 2. How It Works */}
                <div
                  className="p-3.5 border flex flex-col gap-1.5"
                  style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}
                >
                  <div
                    className="font-pixel text-xs font-bold uppercase tracking-wide"
                    style={{ color: bright }}
                  >
                    How It Works
                  </div>
                  <p
                    className="font-body leading-relaxed"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      lineHeight: 1.65,
                      color: bright,
                    }}
                  >
                    {selectedProject.howItWorks}
                  </p>
                </div>

                {/* 3. Key Results */}
                <div
                  className="p-3.5 border flex flex-col gap-1.5"
                  style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}
                >
                  <div
                    className="font-pixel text-xs font-bold uppercase tracking-wide"
                    style={{ color: bright }}
                  >
                    Key Results
                  </div>
                  <p
                    className="font-body leading-relaxed"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      lineHeight: 1.65,
                      color: bright,
                    }}
                  >
                    {selectedProject.keyResults}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </article>
  );
};

export default ProjectsView;
