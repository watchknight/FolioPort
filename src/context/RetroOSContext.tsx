import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { retroAudio } from '../utils/retroAudio';

export type RetroSection = 'about' | 'projects' | 'resume';
export type SectionIndex = 0 | 1 | 2;

export const RETRO_SECTIONS: readonly RetroSection[] = ['about', 'projects', 'resume'] as const;
export const LEVEL1_ORDER: readonly RetroSection[] = ['projects', 'about', 'resume'] as const;

export interface SectionMetadata {
  index: SectionIndex;
  section: RetroSection;
  command: string;
  label: string;
  fileName: string;
  status: string;
  tagline: string;
}

export const SECTION_METADATA: Record<RetroSection, SectionMetadata> = {
  about: {
    index: 0,
    section: 'about',
    command: '2. About',
    label: 'About',
    fileName: 'About',
    status: 'East West University • CSE',
    tagline: 'Systems architecture, low-level graphics & procedural audio',
  },
  projects: {
    index: 1,
    section: 'projects',
    command: '1. Work',
    label: 'Selected Work',
    fileName: 'Selected Work',
    status: '4 Systems Online',
    tagline: 'Spatial web, cloud platforms & interactive storytelling',
  },
  resume: {
    index: 2,
    section: 'resume',
    command: '3. Resume',
    label: 'Resume & Contact',
    fileName: 'Resume & Contact',
    status: 'Resume & Contact Ready',
    tagline: 'Technical curriculum vitae & verified PDF export',
  },
};

export type PhosphorMode = 'sage' | 'amber';

export interface RetroOSContextValue {
  isInsideProvider?: boolean;
  activeSection: RetroSection;
  activeIndex: SectionIndex;
  isWindowExpanded: boolean;
  wasWindowClosed?: boolean;
  soundEnabled: boolean;
  isBooting: boolean;
  phosphorMode: PhosphorMode;
  selectedProjectId?: string | null;
  setIsBooting: (booting: boolean) => void;
  setActiveSection: (section: RetroSection) => void;
  setActiveIndex: (index: SectionIndex) => void;
  setIsWindowExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  setSoundEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  setPhosphorMode: (mode: PhosphorMode | ((prev: PhosphorMode) => PhosphorMode)) => void;
  setSelectedProjectId?: (id: string | null) => void;
  openCaseStudy?: (projectId: string) => void;
  togglePhosphorMode: () => void;
  openSection: (section: RetroSection) => void;
  openIndex: (index: SectionIndex) => void;
  toggleExpand: () => void;
  expandWindow: () => void;
  collapseWindow: () => void;
  selectNext: () => void;
  selectPrev: () => void;
  isDitherTransitioning?: boolean;
  registerDitherTransition?: (
    handler: (swapFn: () => void, completeCb?: () => void) => void
  ) => () => void;
  triggerDitherTransition?: (swapFn: () => void, completeCb?: () => void) => void;
}

export const defaultRetroOSContextValue: RetroOSContextValue = {
  isInsideProvider: false,
  activeSection: 'about',
  activeIndex: 0,
  isWindowExpanded: false,
  wasWindowClosed: false,
  soundEnabled: true,
  isBooting: false,
  phosphorMode: 'sage',
  selectedProjectId: null,
  setIsBooting: () => {},
  setActiveSection: () => {},
  setActiveIndex: () => {},
  setIsWindowExpanded: () => {},
  setSoundEnabled: () => {},
  setPhosphorMode: () => {},
  setSelectedProjectId: () => {},
  openCaseStudy: () => {},
  togglePhosphorMode: () => {},
  openSection: () => {},
  openIndex: () => {},
  toggleExpand: () => {},
  expandWindow: () => {},
  collapseWindow: () => {},
  selectNext: () => {},
  selectPrev: () => {},
  isDitherTransitioning: false,
  registerDitherTransition: () => () => {},
  triggerDitherTransition: (swapFn, completeCb) => {
    swapFn();
    completeCb?.();
  },
};

export const RetroOSContext = createContext<RetroOSContextValue>(defaultRetroOSContextValue);

export interface RetroOSProviderProps {
  children?: ReactNode;
  initialSection?: RetroSection;
  initialExpanded?: boolean;
  initialClosed?: boolean;
  initialSoundEnabled?: boolean;
  initialBooting?: boolean;
  initialPhosphor?: PhosphorMode;
  initialSelectedProjectId?: string | null;
}

export interface RetroOSKeyEvaluationResult {
  handled: boolean;
  action?: 'open_1' | 'open_2' | 'open_3' | 'prev' | 'next' | 'expand' | 'collapse';
}

/**
 * Pure evaluation helper for Retro OS global keyboard events.
 * Enables deterministic testing across SSR, Node, and browser environments.
 */
export function evaluateRetroOSKeyEvent(
  e: {
    key: string;
    code?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    targetTagName?: string;
    targetRole?: string;
    targetIsContentEditable?: boolean;
    hasExternalModal?: boolean;
  },
  isWindowExpanded: boolean
): RetroOSKeyEvaluationResult {
  const targetTag = e.targetTagName?.toUpperCase();
  const targetRole = e.targetRole?.toLowerCase();
  if (
    targetTag === 'INPUT' ||
    targetTag === 'TEXTAREA' ||
    targetTag === 'SELECT' ||
    e.targetIsContentEditable
  ) {
    return { handled: false };
  }

  if (e.ctrlKey || e.metaKey || e.altKey) {
    return { handled: false };
  }

  if (e.hasExternalModal) {
    return { handled: false };
  }

  // Keys 1, 2, 3 immediately select [1], [2], or [3] and open the OS view
  // Strictly require !e.shiftKey so Shift+1 (!), Shift+2 (@), Shift+3 (#) never accidentally trigger
  const isKey1 = !e.shiftKey && (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1');
  const isKey2 = !e.shiftKey && (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2');
  const isKey3 = !e.shiftKey && (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3');

  if (isKey1) return { handled: true, action: 'open_1' };
  if (isKey2) return { handled: true, action: 'open_2' };
  if (isKey3) return { handled: true, action: 'open_3' };

  // ArrowUp and ArrowDown cycle through [1], [2], and [3] with roving focus
  if (e.key === 'ArrowUp') return { handled: true, action: 'prev' };
  if (e.key === 'ArrowDown') return { handled: true, action: 'next' };

  // Enter or Space expands the active section inside the 90s OS Window
  if (e.key === 'Enter' || e.key === ' ') {
    // If user is focused on a button, link, or role="button", let the element handle it
    if (targetTag === 'BUTTON' || targetTag === 'A' || targetRole === 'button') {
      return { handled: false };
    }
    if (!isWindowExpanded) {
      return { handled: true, action: 'expand' };
    }
    return { handled: false };
  }

  // Escape collapses the expanded OS window back to the default diorama overview screen
  if (e.key === 'Escape') {
    if (isWindowExpanded) {
      return { handled: true, action: 'collapse' };
    }
    return { handled: false };
  }

  return { handled: false };
}

export const RetroOSProvider: React.FC<RetroOSProviderProps> = ({
  children,
  initialSection = 'about',
  initialExpanded = false,
  initialClosed = false,
  initialSoundEnabled = true,
  initialBooting = false,
  initialPhosphor = 'sage',
  initialSelectedProjectId = null,
}) => {
  const [activeSection, setActiveSectionState] = useState<RetroSection>(initialSection);
  const [activeIndex, setActiveIndexState] = useState<SectionIndex>(() => {
    return SECTION_METADATA[initialSection]?.index ?? 0;
  });
  const [isWindowExpanded, setIsWindowExpandedState] = useState<boolean>(initialExpanded);
  const [wasWindowClosed, setWasWindowClosed] = useState<boolean>(initialClosed);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(initialSoundEnabled);
  const [isBooting, setIsBootingState] = useState<boolean>(initialBooting);
  const [phosphorMode, setPhosphorModeState] = useState<PhosphorMode>(initialPhosphor);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(initialSelectedProjectId);
  const [isDitherTransitioning, setIsDitherTransitioning] = useState<boolean>(false);

  const ditherHandlerRef = useRef<((swapFn: () => void, completeCb?: () => void) => void) | null>(null);
  const activeTransitionsRef = useRef<number>(0);

  const registerDitherTransition = useCallback(
    (handler: (swapFn: () => void, completeCb?: () => void) => void) => {
      ditherHandlerRef.current = handler;
      return () => {
        if (ditherHandlerRef.current === handler) {
          ditherHandlerRef.current = null;
        }
      };
    },
    []
  );

  const triggerDitherTransition = useCallback(
    (swapFn: () => void, completeCb?: () => void) => {
      if (ditherHandlerRef.current) {
        activeTransitionsRef.current += 1;
        setIsDitherTransitioning(true);
        ditherHandlerRef.current(swapFn, () => {
          activeTransitionsRef.current = Math.max(0, activeTransitionsRef.current - 1);
          if (activeTransitionsRef.current === 0) {
            setIsDitherTransitioning(false);
          }
          completeCb?.();
        });
      } else {
        swapFn();
        completeCb?.();
      }
    },
    []
  );

  const setPhosphorMode = useCallback((mode: PhosphorMode | ((prev: PhosphorMode) => PhosphorMode)) => {
    setPhosphorModeState(mode);
  }, []);

  const togglePhosphorMode = useCallback(() => {
    setPhosphorModeState((prev) => (prev === 'sage' ? 'amber' : 'sage'));
  }, []);

  const setIsBooting = useCallback((booting: boolean) => {
    setIsBootingState(booting);
  }, []);

  const setActiveSection = useCallback(
    (section: RetroSection) => {
      const meta = SECTION_METADATA[section];
      if (meta) {
        if (soundEnabled) {
          try {
            retroAudio.playBlip();
          } catch {}
        }
        const perform = () => {
          setActiveSectionState(section);
          setActiveIndexState(meta.index);
          setWasWindowClosed(false);
        };
        // When expanded, switching modules triggers 340ms dither transition with swap at 170ms
        if (ditherHandlerRef.current && isWindowExpanded && activeSection !== section) {
          triggerDitherTransition(perform);
        } else {
          perform();
        }
      }
    },
    [soundEnabled, isWindowExpanded, activeSection, triggerDitherTransition]
  );

  const setActiveIndex = useCallback(
    (index: SectionIndex) => {
      const clampedIndex = (index >= 0 && index <= 2 ? index : 0) as SectionIndex;
      setActiveSection(RETRO_SECTIONS[clampedIndex]);
    },
    [setActiveSection]
  );

  const setIsWindowExpanded = useCallback((expanded: boolean | ((prev: boolean) => boolean)) => {
    setIsWindowExpandedState(expanded);
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean | ((prev: boolean) => boolean)) => {
    setSoundEnabledState((prev) => {
      const next = typeof enabled === 'function' ? enabled(prev) : enabled;
      retroAudio.setMuted(!next);
      return next;
    });
  }, []);

  const setSelectedProjectId = useCallback((id: string | null) => {
    setSelectedProjectIdState(id);
  }, []);

  const openCaseStudy = useCallback(
    (projectId: string) => {
      if (soundEnabled) {
        try {
          retroAudio.playOpenWindow();
        } catch {}
      }
      const perform = () => {
        setActiveSectionState('projects');
        setActiveIndexState(SECTION_METADATA.projects.index);
        setSelectedProjectIdState(projectId);
        setIsWindowExpandedState(true);
        setWasWindowClosed(false);
      };
      if (ditherHandlerRef.current && (!isWindowExpanded || activeSection !== 'projects')) {
        triggerDitherTransition(perform);
      } else {
        perform();
      }
    },
    [soundEnabled, isWindowExpanded, activeSection, triggerDitherTransition]
  );

  const openSection = useCallback(
    (section: RetroSection) => {
      const meta = SECTION_METADATA[section];
      if (meta) {
        if (soundEnabled) {
          try {
            retroAudio.playOpenWindow();
          } catch {}
        }
        const perform = () => {
          setActiveSectionState(section);
          setActiveIndexState(meta.index);
          setSelectedProjectIdState(null);
          setIsWindowExpandedState(true);
          setWasWindowClosed(false);
        };
        // Opening Level 2 window or switching modules triggers 340ms dither transition with swap at 170ms
        if (ditherHandlerRef.current && (!isWindowExpanded || activeSection !== section)) {
          triggerDitherTransition(perform);
        } else {
          perform();
        }
      }
    },
    [soundEnabled, isWindowExpanded, activeSection, triggerDitherTransition]
  );

  const openIndex = useCallback(
    (index: SectionIndex) => {
      const clampedIndex = (index >= 0 && index <= 2 ? index : 0) as SectionIndex;
      openSection(RETRO_SECTIONS[clampedIndex]);
    },
    [openSection]
  );

  const expandWindow = useCallback(() => {
    if (soundEnabled) {
      try {
        retroAudio.playOpenWindow();
      } catch {}
    }
    const perform = () => {
      setIsWindowExpandedState(true);
      setWasWindowClosed(false);
    };
    if (ditherHandlerRef.current && !isWindowExpanded) {
      triggerDitherTransition(perform);
    } else {
      perform();
    }
  }, [soundEnabled, isWindowExpanded, triggerDitherTransition]);

  const collapseWindow = useCallback(() => {
    if (soundEnabled) {
      try {
        retroAudio.playBlip();
      } catch {}
    }
    const perform = () => {
      setIsWindowExpandedState(false);
      setWasWindowClosed(true);
    };
    // Closing window back to Level 1 triggers 340ms dither transition with swap at 170ms
    if (ditherHandlerRef.current && isWindowExpanded) {
      triggerDitherTransition(perform);
    } else {
      perform();
    }
  }, [soundEnabled, isWindowExpanded, triggerDitherTransition]);

  const toggleExpand = useCallback(() => {
    if (isWindowExpanded) {
      collapseWindow();
    } else {
      expandWindow();
    }
  }, [isWindowExpanded, collapseWindow, expandWindow]);

  const selectNext = useCallback(() => {
    setActiveSectionState((currentSec) => {
      const curIdx = LEVEL1_ORDER.indexOf(currentSec);
      const nextIdx = (curIdx + 1) % LEVEL1_ORDER.length;
      const nextSec = LEVEL1_ORDER[nextIdx];
      const meta = SECTION_METADATA[nextSec];
      if (meta) {
        setActiveIndexState(meta.index);
      }
      setWasWindowClosed(false);
      if (soundEnabled) {
        try {
          retroAudio.playBlip();
        } catch {}
      }
      return nextSec;
    });
  }, [soundEnabled]);

  const selectPrev = useCallback(() => {
    setActiveSectionState((currentSec) => {
      const curIdx = LEVEL1_ORDER.indexOf(currentSec);
      const prevIdx = (curIdx - 1 + LEVEL1_ORDER.length) % LEVEL1_ORDER.length;
      const prevSec = LEVEL1_ORDER[prevIdx];
      const meta = SECTION_METADATA[prevSec];
      if (meta) {
        setActiveIndexState(meta.index);
      }
      setWasWindowClosed(false);
      if (soundEnabled) {
        try {
          retroAudio.playBlip();
        } catch {}
      }
      return prevSec;
    });
  }, [soundEnabled]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as Element | null;
      const targetTag = target?.tagName?.toUpperCase();
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const activeTag = activeEl?.tagName?.toUpperCase();

      // Automatically disable global shortcuts whenever user is typing in an input/textarea/editable element
      if (
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA' ||
        targetTag === 'SELECT' ||
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT'
      ) {
        return;
      }

      let hasExternalModal = false;

      if (typeof document !== 'undefined') {
        const modalDialog = document.querySelector(
          '[role="dialog"]:not([data-testid="retro-os-window"]):not([data-testid="rpg-speech-bubble"])'
        );
        hasExternalModal = Boolean(modalDialog || document.querySelector('.easter-egg-modal'));
      }

      const targetRole =
        target && typeof target.getAttribute === 'function'
          ? target.getAttribute('role') || undefined
          : undefined;

      const targetIsContentEditable =
        target && 'isContentEditable' in target
          ? (target as HTMLElement).isContentEditable
          : false;

      const evalResult = evaluateRetroOSKeyEvent(
        {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          targetTagName: target?.tagName,
          targetRole,
          targetIsContentEditable,
          hasExternalModal,
        },
        isWindowExpanded
      );

      if (!evalResult.handled) {
        return;
      }

      // Space scroll jump prevention
      if (e.key === ' ') {
        e.preventDefault();
      }

      switch (evalResult.action) {
        case 'open_1':
          e.preventDefault();
          openSection('projects');
          break;
        case 'open_2':
          e.preventDefault();
          openSection('about');
          break;
        case 'open_3':
          e.preventDefault();
          openSection('resume');
          break;
        case 'prev':
          e.preventDefault();
          selectPrev();
          break;
        case 'next':
          e.preventDefault();
          selectNext();
          break;
        case 'expand':
          e.preventDefault();
          expandWindow();
          break;
        case 'collapse':
          e.preventDefault();
          collapseWindow();
          break;
      }
    };

    const handleOpenEvent = (e: Event) => {
      const section = (e as CustomEvent<RetroSection>).detail;
      if (section && RETRO_SECTIONS.includes(section)) {
        openSection(section);
      }
    };
    const handleCollapseEvent = () => {
      collapseWindow();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('retro-os-open', handleOpenEvent);
      window.addEventListener('retro-os-collapse', handleCollapseEvent);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('retro-os-open', handleOpenEvent);
        window.removeEventListener('retro-os-collapse', handleCollapseEvent);
      };
    }
  }, [openIndex, openSection, selectNext, selectPrev, expandWindow, collapseWindow, isWindowExpanded]);

  const value = useMemo<RetroOSContextValue>(
    () => ({
      isInsideProvider: true,
      activeSection,
      activeIndex,
      isWindowExpanded,
      wasWindowClosed,
      soundEnabled,
      isBooting,
      phosphorMode,
      selectedProjectId,
      setIsBooting,
      setActiveSection,
      setActiveIndex,
      setIsWindowExpanded,
      setSoundEnabled,
      setPhosphorMode,
      setSelectedProjectId,
      openCaseStudy,
      togglePhosphorMode,
      openSection,
      openIndex,
      toggleExpand,
      expandWindow,
      collapseWindow,
      selectNext,
      selectPrev,
      isDitherTransitioning,
      registerDitherTransition,
      triggerDitherTransition,
    }),
    [
      activeSection,
      activeIndex,
      isWindowExpanded,
      wasWindowClosed,
      soundEnabled,
      isBooting,
      phosphorMode,
      selectedProjectId,
      setIsBooting,
      setActiveSection,
      setActiveIndex,
      setIsWindowExpanded,
      setSoundEnabled,
      setPhosphorMode,
      setSelectedProjectId,
      openCaseStudy,
      togglePhosphorMode,
      openSection,
      openIndex,
      toggleExpand,
      expandWindow,
      collapseWindow,
      selectNext,
      selectPrev,
      isDitherTransitioning,
      registerDitherTransition,
      triggerDitherTransition,
    ]
  );

  return <RetroOSContext.Provider value={value}>{children}</RetroOSContext.Provider>;
};

export const useRetroOS = (): RetroOSContextValue => {
  const context = useContext(RetroOSContext);
  return context ?? defaultRetroOSContextValue;
};

export default RetroOSContext;
