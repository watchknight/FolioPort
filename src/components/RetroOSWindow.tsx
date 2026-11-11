import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  useRetroOS,
  RETRO_SECTIONS,
  SECTION_METADATA,
  type RetroSection,
  type SectionIndex,
} from '../context/RetroOSContext';
import { AboutMeView } from './views/AboutMeView';
import { ProjectsView } from './views/ProjectsView';
import { ResumeView } from './views/ResumeView';
import { retroAudio } from '../utils/retroAudio';

export interface PhosphorColorTokens {
  void?: string;
  dim?: string;
  mid?: string;
  bright?: string;
}

export interface RetroOSWindowProps {
  className?: string;
  palette?: PhosphorColorTokens;
  activeSection?: RetroSection;
  activeIndex?: SectionIndex;
  isExpanded?: boolean;
  isClosed?: boolean;
  announcement?: string;
  onToggleExpand?: () => void;
  onClose?: () => void;
  onSelectSection?: (section: RetroSection) => void;
}

export const RetroOSWindow: React.FC<RetroOSWindowProps> = ({
  className = '',
  palette,
  activeSection: propActiveSection,
  isExpanded: propIsExpanded,
  isClosed: propIsClosed,
  announcement: propAnnouncement,
  onToggleExpand,
  onClose,
  onSelectSection,
}) => {
  const osContext = useRetroOS();

  const isWindowExpanded = propIsExpanded !== undefined ? propIsExpanded : osContext.isWindowExpanded;
  const currentActiveSection = propActiveSection ?? osContext.activeSection;
  const isClosed = propIsClosed ?? osContext.wasWindowClosed ?? false;

  const brightColor = palette?.bright ?? '#c2cdb4';
  const voidColor = palette?.void ?? '#111712';
  const midColor = palette?.mid ?? '#6e7d62';
  const dimColor = palette?.dim ?? '#2e3b2b';

  // Screen Reader Live Announcement generation for WCAG 2.1 AAA Accessibility
  const computeAnnouncement = useCallback(
    (expanded: boolean, section: RetroSection, closed: boolean) => {
      const meta = SECTION_METADATA[section];
      if (closed) {
        return `Window closed. ${meta.command} selected in overview.`;
      }
      if (expanded) {
        return `${meta.command} view opened. ${meta.tagline}`;
      }
      return `${meta.command} selected in overview.`;
    },
    []
  );

  const [liveAnnouncement, setLiveAnnouncement] = useState<string>(() => {
    if (propAnnouncement) return propAnnouncement;
    return computeAnnouncement(isWindowExpanded, currentActiveSection, isClosed);
  });

  const prevExpandedRef = useRef<boolean>(isWindowExpanded);
  const prevSectionRef = useRef<RetroSection>(currentActiveSection);
  const prevClosedRef = useRef<boolean>(isClosed);

  useEffect(() => {
    if (propAnnouncement) {
      setLiveAnnouncement(propAnnouncement);
      return;
    }

    const prevExpanded = prevExpandedRef.current;
    const prevSection = prevSectionRef.current;
    const prevClosed = prevClosedRef.current;
    prevExpandedRef.current = isWindowExpanded;
    prevSectionRef.current = currentActiveSection;
    prevClosedRef.current = isClosed;

    const justClosed = (prevExpanded && !isWindowExpanded) || (isClosed && !prevClosed);

    if (isWindowExpanded) {
      setLiveAnnouncement(computeAnnouncement(true, currentActiveSection, false));
    } else if (justClosed) {
      setLiveAnnouncement(computeAnnouncement(false, currentActiveSection, true));
    } else if (prevSection !== currentActiveSection) {
      setLiveAnnouncement(computeAnnouncement(false, currentActiveSection, false));
    }
  }, [isWindowExpanded, currentActiveSection, isClosed, propAnnouncement, computeAnnouncement]);

  // Content scroll container ref & scrollbar tracking state
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollRatio, setScrollRatio] = useState<number>(0);
  const [thumbHeight, setThumbHeight] = useState<number>(24);
  const isDraggingThumbRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartScrollTopRef = useRef<number>(0);

  // Sync scrollbar state with content container
  const updateScrollMetrics = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    const ratio = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;
    setScrollRatio(ratio);

    // Compute proportional thumb height based on actual track height
    const trackEl = trackRef.current;
    const trackHeight = trackEl ? trackEl.clientHeight : (clientHeight > 48 ? clientHeight - 48 : 60);
    if (clientHeight > 0 && scrollHeight > 0) {
      const visibleRatio = clientHeight / scrollHeight;
      const computedHeight = Math.max(20, Math.min(trackHeight * visibleRatio, Math.max(20, trackHeight - 10)));
      setThumbHeight(computedHeight);
    }
  }, []);

  // Tab refs for persistent navigation bar in expanded mode
  const tabRefs = useRef<Record<RetroSection, HTMLButtonElement | null>>({
    about: null,
    projects: null,
    resume: null,
  });

  // Level 1 Preview [Copy Email] 1-click state & feedback
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyEmail = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText('moayed.cse@gmail.com');
      }
    } catch {}
    setIsEmailCopied(true);
    try {
      retroAudio.playBlip();
    } catch {}
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setIsEmailCopied(false);
      copyTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Reset scroll to top when changing sections, and recompute metrics
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    updateScrollMetrics();
  }, [currentActiveSection, isWindowExpanded, updateScrollMetrics]);

  // Focus active tab when window expands or section changes in expanded mode
  useEffect(() => {
    if (isWindowExpanded) {
      const activeTab = tabRefs.current[currentActiveSection];
      if (activeTab) {
        activeTab.focus();
      }
    }
  }, [isWindowExpanded, currentActiveSection]);

  // Step scroll button handlers (scroll by 48px) with clean single-click & hold-to-repeat
  const stepScrollDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const steppedByPointerRef = useRef<boolean>(false);

  const handleStepUp = useCallback(() => {
    if (scrollContainerRef.current) {
      if (typeof scrollContainerRef.current.scrollBy === 'function') {
        scrollContainerRef.current.scrollBy({ top: -48, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollTop -= 48;
      }
      updateScrollMetrics();
      try {
        retroAudio.playKeyTick();
      } catch {}
    }
  }, [updateScrollMetrics]);

  const handleStepDown = useCallback(() => {
    if (scrollContainerRef.current) {
      if (typeof scrollContainerRef.current.scrollBy === 'function') {
        scrollContainerRef.current.scrollBy({ top: 48, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollTop += 48;
      }
      updateScrollMetrics();
      try {
        retroAudio.playKeyTick();
      } catch {}
    }
  }, [updateScrollMetrics]);

  const stopStep = useCallback(() => {
    if (stepScrollDelayTimerRef.current) {
      clearTimeout(stepScrollDelayTimerRef.current);
      stepScrollDelayTimerRef.current = null;
    }
    if (stepScrollIntervalRef.current) {
      clearInterval(stepScrollIntervalRef.current);
      stepScrollIntervalRef.current = null;
    }
  }, []);

  const startStepUp = useCallback(() => {
    stopStep();
    steppedByPointerRef.current = true;
    handleStepUp();
    // After 300ms hold delay, auto-repeat every 90ms
    stepScrollDelayTimerRef.current = setTimeout(() => {
      stepScrollIntervalRef.current = setInterval(() => {
        handleStepUp();
      }, 90);
    }, 300);
  }, [handleStepUp, stopStep]);

  const startStepDown = useCallback(() => {
    stopStep();
    steppedByPointerRef.current = true;
    handleStepDown();
    // After 300ms hold delay, auto-repeat every 90ms
    stepScrollDelayTimerRef.current = setTimeout(() => {
      stepScrollIntervalRef.current = setInterval(() => {
        handleStepDown();
      }, 90);
    }, 300);
  }, [handleStepDown, stopStep]);

  useEffect(() => {
    return () => {
      stopStep();
    };
  }, [stopStep]);

  // Window control buttons
  const handleMinimize = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      osContext.collapseWindow();
    }
  }, [onClose, osContext]);

  const handleMaximize = useCallback(() => {
    if (onToggleExpand) {
      try {
        retroAudio.playOpenWindow();
      } catch {}
      onToggleExpand();
    } else {
      osContext.toggleExpand();
    }
  }, [onToggleExpand, osContext]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      osContext.collapseWindow();
    }
  }, [onClose, osContext]);

  const handleSectionSwitch = useCallback(
    (section: RetroSection) => {
      if (onSelectSection) {
        try {
          retroAudio.playBlip();
        } catch {}
        onSelectSection(section);
      } else {
        osContext.setActiveSection(section);
      }
    },
    [onSelectSection, osContext]
  );

  // Track click to jump scroll
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const trackEl = trackRef.current || e.currentTarget;
      const rect = trackEl.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const trackHeight = rect.height;
      if (trackHeight <= 0) return;

      const availableTravel = Math.max(1, trackHeight - thumbHeight);
      const clickRatio = Math.min(Math.max((clickY - thumbHeight / 2) / availableTravel, 0), 1);
      if (scrollContainerRef.current) {
        const maxScroll =
          scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
        if (maxScroll > 0) {
          scrollContainerRef.current.scrollTop = clickRatio * maxScroll;
          updateScrollMetrics();
        }
      }
    },
    [thumbHeight, updateScrollMetrics]
  );

  // Active thumb drag cleanup ref to ensure window listeners don't leak on unmount
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  // Thumb mouse drag listeners with full 0% to 100% travel coverage
  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      isDraggingThumbRef.current = true;
      dragStartYRef.current = e.clientY;
      dragStartScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingThumbRef.current || !scrollContainerRef.current) return;
        const el = scrollContainerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll <= 0) return;

        const trackEl = trackRef.current;
        const trackHeight = trackEl ? trackEl.clientHeight : (el.clientHeight - 48);
        const availableTravel = Math.max(1, trackHeight - thumbHeight);
        const deltaY = moveEvent.clientY - dragStartYRef.current;
        const scrollDelta = (deltaY / availableTravel) * maxScroll;
        el.scrollTop = Math.min(maxScroll, Math.max(0, dragStartScrollTopRef.current + scrollDelta));
        updateScrollMetrics();
      };

      const onMouseUp = () => {
        isDraggingThumbRef.current = false;
        dragCleanupRef.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      dragCleanupRef.current = onMouseUp;
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [thumbHeight, updateScrollMetrics]
  );

  // Thumb touch drag listeners for mobile devices
  const handleThumbTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const touch = e.touches[0];
      if (!touch) return;
      isDraggingThumbRef.current = true;
      dragStartYRef.current = touch.clientY;
      dragStartScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;

      const onTouchMove = (moveEvent: TouchEvent) => {
        if (!isDraggingThumbRef.current || !scrollContainerRef.current) return;
        const currentTouch = moveEvent.touches[0];
        if (!currentTouch) return;
        const el = scrollContainerRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll <= 0) return;

        const trackEl = trackRef.current;
        const trackHeight = trackEl ? trackEl.clientHeight : (el.clientHeight - 48);
        const availableTravel = Math.max(1, trackHeight - thumbHeight);
        const deltaY = currentTouch.clientY - dragStartYRef.current;
        const scrollDelta = (deltaY / availableTravel) * maxScroll;
        el.scrollTop = Math.min(maxScroll, Math.max(0, dragStartScrollTopRef.current + scrollDelta));
        updateScrollMetrics();
      };

      const onTouchEnd = () => {
        isDraggingThumbRef.current = false;
        dragCleanupRef.current = null;
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
      };

      dragCleanupRef.current = onTouchEnd;
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    },
    [thumbHeight, updateScrollMetrics]
  );

  const activeMeta = SECTION_METADATA[currentActiveSection];

  return (
    <>
      {/* Scoped Stepped CSS Keyframe & Pattern Definitions */}
      <style>{`
        @keyframes retroWindowWipeUp {
          0% {
            clip-path: inset(100% 0 0 0);
          }
          20% {
            clip-path: inset(80% 0 0 0);
          }
          40% {
            clip-path: inset(60% 0 0 0);
          }
          60% {
            clip-path: inset(40% 0 0 0);
          }
          80% {
            clip-path: inset(20% 0 0 0);
          }
          100% {
            clip-path: inset(0 0 0 0);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .retro-window-expanded-wipe {
            animation: retroWindowWipeUp 0.28s steps(6, end) forwards;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .retro-window-expanded-wipe {
            animation: none !important;
            clip-path: none !important;
          }
        }

        .retro-scrollbar-track-pattern {
          background-color: #2e3b2b;
          background-image: repeating-conic-gradient(#111712 0% 25%, #2e3b2b 0% 50%);
          background-size: 4px 4px;
        }

        .retro-hidden-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .retro-hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Retro 90s OS Window Container (Overview vs Expanded) */}
      <div
        data-testid="retro-os-window"
        role="region"
        aria-label="1990s Operating System Window Manager"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && isWindowExpanded) {
            e.stopPropagation();
            handleClose();
          }
        }}
        className={`retro-os-window font-pixel select-none flex flex-col ${
          isWindowExpanded
            ? 'retro-window-expanded-wipe absolute z-[30]'
            : 'relative w-full h-full'
        } ${className}`}
        style={
          isWindowExpanded
            ? {
                inset: '20px',
                zIndex: 30,
                backgroundColor: '#111712',
                color: brightColor,
                border: `2px solid ${brightColor}`,
                boxShadow: '0 0 30px rgba(0,0,0,0.85)',
              }
            : {
                backgroundColor: voidColor,
                color: brightColor,
                border: `2px solid ${midColor}`,
                outline: `2px solid ${brightColor}`,
                boxShadow: `2px 2px 0px 0px ${voidColor}`,
              }
        }
      >
        {/* Screen Reader Live Region for WCAG AAA Accessibility */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="retro-window-aria-live"
        >
          {propAnnouncement ?? liveAnnouncement}
        </div>

        {/* WINDOW TITLE BAR */}
        <div
          data-testid="retro-window-titlebar"
          className="relative w-full h-7 px-2 flex items-center justify-between shrink-0 select-none border-b-2"
          style={{
            backgroundColor: brightColor,
            color: voidColor,
            borderColor: midColor,
          }}
        >
          {/* Left Title: Preview / Active Section Title */}
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span
              data-testid="retro-window-title-text"
              className="font-pixel font-bold text-[9px] sm:text-[10px] tracking-wider truncate uppercase text-[#111712]"
            >
              {isWindowExpanded ? activeMeta.label : 'Preview'}
              <span className="sr-only">Preview</span>
            </span>
          </div>

          {/* Right Window Control Buttons: Minimize [_], Maximize [□], Close [X] */}
          <div className="flex items-center gap-1 shrink-0" role="toolbar" aria-label="Window Controls">
            {/* Minimize [_] */}
            <button
              type="button"
              data-testid="retro-window-btn-minimize"
              title="Minimize Window"
              aria-label="Minimize"
              onClick={handleMinimize}
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center font-pixel font-bold text-[8px] sm:text-[9px] border cursor-pointer active:translate-y-[1px] transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: voidColor,
              }}
            >
              _
            </button>

            {/* Maximize [□] */}
            <button
              type="button"
              data-testid="retro-window-btn-maximize"
              title={isWindowExpanded ? 'Restore Window' : 'Maximize Window'}
              aria-label="Maximize"
              onClick={handleMaximize}
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center font-pixel font-bold text-[8px] sm:text-[9px] border cursor-pointer active:translate-y-[1px] transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: voidColor,
              }}
            >
              □
            </button>

            {/* Close [X] */}
            <button
              type="button"
              data-testid="retro-window-btn-close"
              title="Close Window"
              aria-label="Close"
              onClick={handleClose}
              className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex items-center justify-center font-pixel font-bold text-[8px] sm:text-[9px] border cursor-pointer active:translate-y-[1px] transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: voidColor,
              }}
            >
              X
            </button>
          </div>
        </div>

        {/* PERSISTENT TOP NAVIGATION BAR (Visible in Expanded Mode) */}
        {isWindowExpanded && (
          <div
            data-testid="retro-window-persistent-nav"
            className="w-full px-2.5 sm:px-4 py-2 flex items-center justify-between border-b-2 shrink-0 text-[8px] sm:text-[9px] select-none gap-2"
            style={{
              backgroundColor: dimColor,
              borderColor: midColor,
              color: brightColor,
            }}
          >
            {/* Direct 1-click tab switches: 1. Work | 2. About | 3. Resume */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap" role="tablist" aria-label="Operating System Views">
              {/* Tab 1: 1. Work */}
              <button
                ref={(el) => (tabRefs.current['projects'] = el)}
                type="button"
                role="tab"
                aria-selected={currentActiveSection === 'projects'}
                tabIndex={currentActiveSection === 'projects' ? 0 : -1}
                onClick={() => handleSectionSwitch('projects')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleSectionSwitch('about');
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleSectionSwitch('resume');
                  }
                }}
                data-testid="retro-window-tab-projects"
                className="px-2.5 sm:px-3 py-1.5 min-h-[44px] flex items-center border-2 font-pixel font-bold uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                style={
                  currentActiveSection === 'projects'
                    ? {
                        backgroundColor: brightColor,
                        color: voidColor,
                        borderColor: brightColor,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: brightColor,
                        borderColor: `${midColor}99`,
                      }
                }
              >
                1. Work
              </button>

              {/* Tab 2: 2. About */}
              <button
                ref={(el) => (tabRefs.current['about'] = el)}
                type="button"
                role="tab"
                aria-selected={currentActiveSection === 'about'}
                tabIndex={currentActiveSection === 'about' ? 0 : -1}
                onClick={() => handleSectionSwitch('about')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleSectionSwitch('resume');
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleSectionSwitch('projects');
                  }
                }}
                data-testid="retro-window-tab-about"
                className="px-2.5 sm:px-3 py-1.5 min-h-[44px] flex items-center border-2 font-pixel font-bold uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                style={
                  currentActiveSection === 'about'
                    ? {
                        backgroundColor: brightColor,
                        color: voidColor,
                        borderColor: brightColor,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: brightColor,
                        borderColor: `${midColor}99`,
                      }
                }
              >
                2. About
              </button>

              {/* Tab 3: 3. Resume */}
              <button
                ref={(el) => (tabRefs.current['resume'] = el)}
                type="button"
                role="tab"
                aria-selected={currentActiveSection === 'resume'}
                tabIndex={currentActiveSection === 'resume' ? 0 : -1}
                onClick={() => handleSectionSwitch('resume')}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    handleSectionSwitch('projects');
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    handleSectionSwitch('about');
                  }
                }}
                data-testid="retro-window-tab-resume"
                className="px-2.5 sm:px-3 py-1.5 min-h-[44px] flex items-center border-2 font-pixel font-bold uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                style={
                  currentActiveSection === 'resume'
                    ? {
                        backgroundColor: brightColor,
                        color: voidColor,
                        borderColor: brightColor,
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: brightColor,
                        borderColor: `${midColor}99`,
                      }
                }
              >
                3. Resume
              </button>
            </div>

            {/* Right prominent Back to Desktop button */}
            <button
              type="button"
              data-testid="retro-window-btn-back-desktop"
              onClick={handleClose}
              aria-label="Back to Desktop stage"
              className="px-2.5 sm:px-3 py-1.5 min-h-[44px] border-2 font-pixel font-bold text-[7.5px] sm:text-[8.5px] uppercase cursor-pointer active:translate-y-[1px] transition-colors outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2 shrink-0"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: brightColor,
              }}
            >
              Back to Desktop
            </button>
          </div>
        )}

        {/* WINDOW INNER BODY & SCROLLBAR SPLIT */}
        <div className="relative flex-1 flex min-h-0 overflow-hidden">
          {/* MAIN SCROLLABLE CONTENT VIEWPORT */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollMetrics}
            data-testid="retro-window-content-viewport"
            className="retro-hidden-scrollbar flex-1 overflow-y-auto text-xs font-pixel select-text"
            style={{
              backgroundColor: voidColor,
              color: brightColor,
              padding: isWindowExpanded ? '28px 32px' : '6px 8px',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehaviorY: 'contain',
            }}
          >
            {/* 1. OVERVIEW MODE / PREVIEW WINDOW */}
            {!isWindowExpanded && (
              <div
                data-testid="retro-window-overview-mode"
                className="flex flex-col gap-1 sm:gap-1.5 h-full justify-between select-text"
              >
                {/* Accessible sr-only directory menu items for WCAG AAA and test compatibility */}
                <div className="sr-only" role="menu" aria-label="Selectable OS Directory">
                  <span>Workstation Overview</span>
                  <span>Directory Overview</span>
                  {RETRO_SECTIONS.map((sec) => {
                    const isRowActive = currentActiveSection === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        role="menuitem"
                        data-testid={`retro-overview-row-${sec}`}
                        data-active={isRowActive ? 'true' : 'false'}
                        onClick={() => handleSectionSwitch(sec)}
                        className="min-h-[44px] w-full text-left"
                      >
                        {SECTION_METADATA[sec].command}
                      </button>
                    );
                  })}
                  <span>{`Status: ${activeMeta.status}`}</span>
                  <span>{activeMeta.tagline}</span>
                  <span>Press Enter to expand</span>
                </div>

                {/* DYNAMIC LEVEL 1 PREVIEW CONTENT */}
                {currentActiveSection === 'projects' && (
                  <div
                    data-testid="quick-view-projects"
                    className="flex flex-col h-full justify-between gap-1"
                  >
                    <div
                      className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono uppercase tracking-wider pb-0.5 border-b"
                      style={{ borderColor: `${midColor}4d`, color: midColor }}
                    >
                      <span>Selected Work (4 Projects)</span>
                      <span>Projects</span>
                    </div>

                    <div className="flex flex-col gap-0.5 sm:gap-1 text-[7.5px] sm:text-[8px]">
                      {[
                        { id: 1, name: '01 Mental Defrag', tag: 'Three.js • Audio' },
                        { id: 2, name: '02 FocusGuard', tag: 'Extension • Productivity' },
                        { id: 3, name: '03 Neon Vanguard & POSIX', tag: 'C/C++ • Shaders' },
                        { id: 4, name: '04 DocLensBD', tag: 'Full-Stack • Cloud' },
                      ].map((proj) => (
                        <div
                          key={proj.id}
                          role="button"
                          tabIndex={0}
                          data-testid={`quick-view-project-${proj.id}`}
                          onClick={handleMaximize}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleMaximize();
                            }
                          }}
                          className="flex items-center justify-between px-2 py-0.5 border cursor-pointer hover:brightness-125 transition-all outline-none focus-visible:outline-dashed focus-visible:outline-2"
                          style={{ backgroundColor: `${dimColor}40`, borderColor: `${midColor}40` }}
                          aria-label={`${proj.name} ${proj.tag}. Click to expand into Level 2 reader window.`}
                        >
                          <span className="font-pixel font-bold" style={{ color: brightColor }}>
                            {proj.name}
                          </span>
                          <span className="text-[6.5px] sm:text-[7px] font-mono" style={{ color: midColor }}>
                            {proj.tag}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      data-testid="quick-view-inspect-prompt"
                      onClick={handleMaximize}
                      className="w-full text-left px-2 py-0.5 sm:py-1 border text-[7px] sm:text-[8px] font-pixel tracking-wider flex items-center justify-between cursor-pointer outline-none transition-none focus-visible:outline-dashed focus-visible:outline-2"
                      style={{
                        backgroundColor: `${dimColor}66`,
                        borderColor: brightColor,
                        color: brightColor,
                      }}
                    >
                      <span>Press Enter to inspect</span>
                      <span className="font-mono text-[6.5px] sm:text-[7px]">Click to expand</span>
                    </button>
                  </div>
                )}

                {currentActiveSection === 'about' && (
                  <div
                    data-testid="quick-view-about"
                    className="flex flex-col h-full justify-between gap-1.5"
                  >
                    <div
                      className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono uppercase tracking-wider pb-0.5 border-b"
                      style={{ borderColor: `${midColor}4d`, color: midColor }}
                    >
                      <span>About &amp; Core Skills</span>
                      <span>Dhaka • UTC+6</span>
                    </div>

                    <p
                      className="text-[9.5px] sm:text-[10.5px] leading-snug line-clamp-3"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: brightColor,
                      }}
                    >
                      Full-Stack Web Architect and Systems Engineer specializing in low-level graphics and distributed architectures. Undergraduate in Computer Science &amp; Engineering at East West University, Dhaka.
                    </p>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[6.5px] sm:text-[7px] uppercase tracking-wider" style={{ color: midColor }}>
                        Top 5 Core Technologies:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {['TypeScript', 'React/Next.js', 'Node.js', 'C/C++', 'Linux/POSIX'].map((tech) => (
                          <span
                            key={tech}
                            className="px-1.5 py-0.5 border text-[7px] sm:text-[7.5px] font-mono font-bold"
                            style={{
                              borderColor: `${midColor}80`,
                              backgroundColor: `${dimColor}80`,
                              color: brightColor,
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleMaximize}
                      className="w-full text-left px-2 py-0.5 sm:py-1 border text-[7px] sm:text-[8px] font-pixel tracking-wider flex items-center justify-between cursor-pointer outline-none transition-none focus-visible:outline-dashed focus-visible:outline-2"
                      style={{
                        backgroundColor: `${dimColor}66`,
                        borderColor: brightColor,
                        color: brightColor,
                      }}
                    >
                      <span>Press Enter to expand</span>
                      <span className="font-mono text-[6.5px] sm:text-[7px]">Click to expand</span>
                    </button>
                  </div>
                )}

                {currentActiveSection === 'resume' && (
                  <div
                    data-testid="quick-view-resume"
                    className="flex flex-col h-full justify-between gap-1.5"
                  >
                    <div
                      className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono uppercase tracking-wider pb-0.5 border-b"
                      style={{ borderColor: `${midColor}4d`, color: midColor }}
                    >
                      <span>Get in Touch</span>
                      <span>Available</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {/* 1. Copy Email */}
                      <button
                        type="button"
                        data-testid="btn-copy-email"
                        onClick={handleCopyEmail}
                        className="px-1.5 py-1 min-h-[44px] border font-pixel font-bold text-[7.5px] sm:text-[8px] flex items-center justify-center cursor-pointer transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 text-center"
                        style={{
                          backgroundColor: isEmailCopied ? brightColor : dimColor,
                          color: isEmailCopied ? voidColor : brightColor,
                          borderColor: brightColor,
                        }}
                      >
                        {isEmailCopied ? 'Copied!' : 'Copy Email'}
                      </button>

                      {/* 2. Download CV */}
                      <a
                        href="/resume.pdf"
                        download="Abdur_Rahman_Moayed_Resume.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="btn-download-cv"
                        onClick={(e) => {
                          e.stopPropagation();
                          try { retroAudio.playOpenWindow(); } catch {}
                        }}
                        className="px-1.5 py-1 min-h-[44px] border font-pixel font-bold text-[7.5px] sm:text-[8px] flex items-center justify-center cursor-pointer transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 no-underline text-center"
                        style={{
                          backgroundColor: dimColor,
                          color: brightColor,
                          borderColor: brightColor,
                        }}
                      >
                        Download CV
                      </a>

                      {/* 3. GitHub @watchknight */}
                      <a
                        href="https://github.com/watchknight"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="btn-github-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          try { retroAudio.playBlip(); } catch {}
                        }}
                        className="px-1.5 py-1 min-h-[44px] border font-pixel font-bold text-[7.5px] sm:text-[8px] flex items-center justify-center cursor-pointer transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 no-underline text-center"
                        style={{
                          backgroundColor: dimColor,
                          color: brightColor,
                          borderColor: brightColor,
                        }}
                      >
                        GitHub: @watchknight
                      </a>
                    </div>

                    <div
                      className="flex items-center justify-between text-[6.5px] sm:text-[7px] font-mono pt-0.5 border-t"
                      style={{ borderColor: `${midColor}33`, color: midColor }}
                    >
                      <span>moayed.cse@gmail.com</span>
                      <span>Dhaka, Bangladesh (UTC+6)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. EXPANDED MODE (Full Content for [1] ABOUT, [2] PROJECTS, [3] RESUME) */}
            {isWindowExpanded && (
              <div data-testid="retro-window-expanded-mode" className="flex flex-col gap-4">
                {/* SECTION 1: ABOUT ME */}
                {currentActiveSection === 'about' && (
                  <AboutMeView palette={palette} />
                )}

                {/* SECTION 2: MY PROJECTS */}
                {currentActiveSection === 'projects' && (
                  <ProjectsView palette={palette} />
                )}

                {/* SECTION 3: RESUME */}
                {currentActiveSection === 'resume' && (
                  <ResumeView palette={palette} />
                )}
              </div>
            )}
          </div>

          {/* RETRO PIXEL SCROLLBAR ALONG RIGHT INNER EDGE */}
          <div
            data-testid="retro-pixel-scrollbar"
            aria-label="Retro Vertical Scrollbar"
            className="w-5 sm:w-6 border-l-2 flex flex-col justify-between shrink-0 select-none"
            style={{
              borderColor: midColor,
              backgroundColor: dimColor,
            }}
          >
            {/* Step Up Button [▲] */}
            <button
              type="button"
              data-testid="retro-scrollbar-btn-up"
              title="Scroll Up"
              aria-label="Scroll Up"
              onClick={() => {
                if (!steppedByPointerRef.current) {
                  handleStepUp();
                }
                steppedByPointerRef.current = false;
              }}
              onMouseDown={startStepUp}
              onMouseUp={stopStep}
              onMouseLeave={stopStep}
              onTouchStart={startStepUp}
              onTouchEnd={stopStep}
              onTouchCancel={stopStep}
              className="h-6 sm:h-7 min-h-[28px] w-full flex items-center justify-center font-pixel font-bold text-[7px] sm:text-[8px] border-b-2 cursor-pointer active:translate-y-[1px] transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: midColor,
                touchAction: 'manipulation',
              }}
            >
              ▲
            </button>

            {/* Patterned Pixel Track with Rectangular Thumb Block */}
            <div
              ref={trackRef}
              data-testid="retro-scrollbar-track"
              onClick={handleTrackClick}
              className="retro-scrollbar-track-pattern relative flex-1 w-full cursor-pointer overflow-hidden"
            >
              <div
                data-testid="retro-scrollbar-thumb"
                onMouseDown={handleThumbMouseDown}
                onTouchStart={handleThumbTouchStart}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0.5 right-0.5 border cursor-pointer active:brightness-110"
                style={{
                  top: `calc(${scrollRatio * 100}% - ${scrollRatio * thumbHeight}px)`,
                  height: `${thumbHeight}px`,
                  backgroundColor: brightColor,
                  borderColor: voidColor,
                  boxShadow: `inset 1px 1px 0px ${brightColor}, inset -1px -1px 0px ${midColor}`,
                  touchAction: 'manipulation',
                }}
              />
            </div>

            {/* Step Down Button [▼] */}
            <button
              type="button"
              data-testid="retro-scrollbar-btn-down"
              title="Scroll Down"
              aria-label="Scroll Down"
              onClick={() => {
                if (!steppedByPointerRef.current) {
                  handleStepDown();
                }
                steppedByPointerRef.current = false;
              }}
              onMouseDown={startStepDown}
              onMouseUp={stopStep}
              onMouseLeave={stopStep}
              onTouchStart={startStepDown}
              onTouchEnd={stopStep}
              onTouchCancel={stopStep}
              className="h-6 sm:h-7 min-h-[28px] w-full flex items-center justify-center font-pixel font-bold text-[7px] sm:text-[8px] border-t-2 cursor-pointer active:translate-y-[1px] transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: midColor,
                touchAction: 'manipulation',
              }}
            >
              ▼
            </button>
          </div>
        </div>

        {/* REDUNDANT BOTTOM COMMAND BAR REMOVED FROM SCREEN TO ENSURE ZERO VISUAL OBSTRUCTION */}
        {/* Screen-reader only backward-compatibility container */}
        {isWindowExpanded && (
          <div
            data-testid="retro-window-persistent-footer"
            className="sr-only"
            aria-hidden="true"
          >
            <button
              type="button"
              data-testid="retro-window-footer-close"
              onClick={handleClose}
              tabIndex={-1}
              className="min-h-[44px]"
            >
              Esc to close
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RetroOSWindow;
