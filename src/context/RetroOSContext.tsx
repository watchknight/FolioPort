import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { retroAudio } from '../utils/retroAudio';

export type RetroSection = 'about' | 'projects' | 'resume';
export type SectionIndex = 0 | 1 | 2;

export const RETRO_SECTIONS: readonly RetroSection[] = ['about', 'projects', 'resume'] as const;

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
    command: '[1] ABOUT ME',
    label: 'ABOUT ME',
    fileName: 'C:\\MOAYED\\ABOUT.TXT',
    status: 'ACTIVE CANDIDATE // CSE @ EWU',
    tagline: 'Systems architecture, low-level graphics & procedural audio',
  },
  projects: {
    index: 1,
    section: 'projects',
    command: '[2] MY PROJECTS',
    label: 'MY PROJECTS',
    fileName: 'C:\\MOAYED\\PROJECTS.LST',
    status: '4 SYSTEMS ONLINE',
    tagline: 'HyperDeck 3D, Sentinel HUD, Audio Synth & Extension Studio',
  },
  resume: {
    index: 2,
    section: 'resume',
    command: '[3] RESUME',
    label: 'RESUME',
    fileName: 'C:\\MOAYED\\RESUME.DAT',
    status: 'DOSSIER LOADED // READY FOR EXPORT',
    tagline: 'Technical curriculum vitae & verified PDF export',
  },
};

export interface RetroOSContextValue {
  isInsideProvider?: boolean;
  activeSection: RetroSection;
  activeIndex: SectionIndex;
  isWindowExpanded: boolean;
  wasWindowClosed?: boolean;
  soundEnabled: boolean;
  isBooting: boolean;
  setIsBooting: (booting: boolean) => void;
  setActiveSection: (section: RetroSection) => void;
  setActiveIndex: (index: SectionIndex) => void;
  setIsWindowExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  setSoundEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  openSection: (section: RetroSection) => void;
  openIndex: (index: SectionIndex) => void;
  toggleExpand: () => void;
  expandWindow: () => void;
  collapseWindow: () => void;
  selectNext: () => void;
  selectPrev: () => void;
}

export const defaultRetroOSContextValue: RetroOSContextValue = {
  isInsideProvider: false,
  activeSection: 'about',
  activeIndex: 0,
  isWindowExpanded: false,
  wasWindowClosed: false,
  soundEnabled: true,
  isBooting: false,
  setIsBooting: () => {},
  setActiveSection: () => {},
  setActiveIndex: () => {},
  setIsWindowExpanded: () => {},
  setSoundEnabled: () => {},
  openSection: () => {},
  openIndex: () => {},
  toggleExpand: () => {},
  expandWindow: () => {},
  collapseWindow: () => {},
  selectNext: () => {},
  selectPrev: () => {},
};

export const RetroOSContext = createContext<RetroOSContextValue>(defaultRetroOSContextValue);

export interface RetroOSProviderProps {
  children?: ReactNode;
  initialSection?: RetroSection;
  initialExpanded?: boolean;
  initialClosed?: boolean;
  initialSoundEnabled?: boolean;
  initialBooting?: boolean;
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
    targetIsContentEditable?: boolean;
    hasExternalModal?: boolean;
  },
  isWindowExpanded: boolean
): RetroOSKeyEvaluationResult {
  const targetTag = e.targetTagName?.toUpperCase();
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
    // If user is focused on a button or link, let the browser activate that element
    if (targetTag === 'BUTTON' || targetTag === 'A') {
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
}) => {
  const [activeSection, setActiveSectionState] = useState<RetroSection>(initialSection);
  const [activeIndex, setActiveIndexState] = useState<SectionIndex>(() => {
    return SECTION_METADATA[initialSection]?.index ?? 0;
  });
  const [isWindowExpanded, setIsWindowExpandedState] = useState<boolean>(initialExpanded);
  const [wasWindowClosed, setWasWindowClosed] = useState<boolean>(initialClosed);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(initialSoundEnabled);
  const [isBooting, setIsBootingState] = useState<boolean>(initialBooting);

  const setIsBooting = useCallback((booting: boolean) => {
    setIsBootingState(booting);
  }, []);

  const setActiveSection = useCallback(
    (section: RetroSection) => {
      const meta = SECTION_METADATA[section];
      if (meta) {
        setActiveSectionState(section);
        setActiveIndexState(meta.index);
        setWasWindowClosed(false);
        if (soundEnabled) {
          try {
            retroAudio.playBlip();
          } catch {}
        }
      }
    },
    [soundEnabled]
  );

  const setActiveIndex = useCallback(
    (index: SectionIndex) => {
      const clampedIndex = (index >= 0 && index <= 2 ? index : 0) as SectionIndex;
      setActiveIndexState(clampedIndex);
      setActiveSectionState(RETRO_SECTIONS[clampedIndex]);
      setWasWindowClosed(false);
      if (soundEnabled) {
        try {
          retroAudio.playBlip();
        } catch {}
      }
    },
    [soundEnabled]
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

  const openSection = useCallback(
    (section: RetroSection) => {
      const meta = SECTION_METADATA[section];
      if (meta) {
        setActiveSectionState(section);
        setActiveIndexState(meta.index);
        setIsWindowExpandedState(true);
        setWasWindowClosed(false);
        if (soundEnabled) {
          try {
            retroAudio.playOpenWindow();
          } catch {}
        }
      }
    },
    [soundEnabled]
  );

  const openIndex = useCallback(
    (index: SectionIndex) => {
      const clampedIndex = (index >= 0 && index <= 2 ? index : 0) as SectionIndex;
      setActiveIndexState(clampedIndex);
      setActiveSectionState(RETRO_SECTIONS[clampedIndex]);
      setIsWindowExpandedState(true);
      setWasWindowClosed(false);
      if (soundEnabled) {
        try {
          retroAudio.playOpenWindow();
        } catch {}
      }
    },
    [soundEnabled]
  );

  const expandWindow = useCallback(() => {
    setIsWindowExpandedState(true);
    setWasWindowClosed(false);
    if (soundEnabled) {
      try {
        retroAudio.playOpenWindow();
      } catch {}
    }
  }, [soundEnabled]);

  const collapseWindow = useCallback(() => {
    setIsWindowExpandedState(false);
    setWasWindowClosed(true);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsWindowExpandedState((prev) => {
      const next = !prev;
      setWasWindowClosed(!next);
      if (next && soundEnabled) {
        try {
          retroAudio.playOpenWindow();
        } catch {}
      }
      return next;
    });
  }, [soundEnabled]);

  const selectNext = useCallback(() => {
    setActiveIndexState((prev) => {
      const nextIdx = ((prev + 1) % 3) as SectionIndex;
      setActiveSectionState(RETRO_SECTIONS[nextIdx]);
      setWasWindowClosed(false);
      if (soundEnabled) {
        try {
          retroAudio.playBlip();
        } catch {}
      }
      return nextIdx;
    });
  }, [soundEnabled]);

  const selectPrev = useCallback(() => {
    setActiveIndexState((prev) => {
      const prevIdx = ((prev - 1 + 3) % 3) as SectionIndex;
      setActiveSectionState(RETRO_SECTIONS[prevIdx]);
      setWasWindowClosed(false);
      if (soundEnabled) {
        try {
          retroAudio.playBlip();
        } catch {}
      }
      return prevIdx;
    });
  }, [soundEnabled]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      let hasExternalModal = false;

      if (typeof document !== 'undefined') {
        const modalDialog = document.querySelector(
          '[role="dialog"]:not([data-testid="retro-os-window"]):not([data-testid="rpg-speech-bubble"])'
        );
        hasExternalModal = Boolean(modalDialog || document.querySelector('.easter-egg-modal'));
      }

      const evalResult = evaluateRetroOSKeyEvent(
        {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          targetTagName: target?.tagName,
          targetIsContentEditable: target?.isContentEditable,
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
          openIndex(0);
          break;
        case 'open_2':
          e.preventDefault();
          openIndex(1);
          break;
        case 'open_3':
          e.preventDefault();
          openIndex(2);
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

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [openIndex, selectNext, selectPrev, expandWindow, collapseWindow, isWindowExpanded]);

  const value = useMemo<RetroOSContextValue>(
    () => ({
      isInsideProvider: true,
      activeSection,
      activeIndex,
      isWindowExpanded,
      wasWindowClosed,
      soundEnabled,
      isBooting,
      setIsBooting,
      setActiveSection,
      setActiveIndex,
      setIsWindowExpanded,
      setSoundEnabled,
      openSection,
      openIndex,
      toggleExpand,
      expandWindow,
      collapseWindow,
      selectNext,
      selectPrev,
    }),
    [
      activeSection,
      activeIndex,
      isWindowExpanded,
      wasWindowClosed,
      soundEnabled,
      isBooting,
      setIsBooting,
      setActiveSection,
      setActiveIndex,
      setIsWindowExpanded,
      setSoundEnabled,
      openSection,
      openIndex,
      toggleExpand,
      expandWindow,
      collapseWindow,
      selectNext,
      selectPrev,
    ]
  );

  return <RetroOSContext.Provider value={value}>{children}</RetroOSContext.Provider>;
};

export const useRetroOS = (): RetroOSContextValue => {
  const context = useContext(RetroOSContext);
  return context ?? defaultRetroOSContextValue;
};

export default RetroOSContext;
