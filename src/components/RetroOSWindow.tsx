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

  // Step scroll button handlers (scroll by 48px)
  const stepScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const startStepUp = useCallback(() => {
    handleStepUp();
    if (stepScrollTimerRef.current) clearInterval(stepScrollTimerRef.current);
    stepScrollTimerRef.current = setInterval(() => {
      handleStepUp();
    }, 120);
  }, [handleStepUp]);

  const startStepDown = useCallback(() => {
    handleStepDown();
    if (stepScrollTimerRef.current) clearInterval(stepScrollTimerRef.current);
    stepScrollTimerRef.current = setInterval(() => {
      handleStepDown();
    }, 120);
  }, [handleStepDown]);

  const stopStep = useCallback(() => {
    if (stepScrollTimerRef.current) {
      clearInterval(stepScrollTimerRef.current);
      stepScrollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stepScrollTimerRef.current) {
        clearInterval(stepScrollTimerRef.current);
        stepScrollTimerRef.current = null;
      }
    };
  }, []);

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
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

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
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchEnd);
      };

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
        className={`retro-os-window font-pixel select-none flex flex-col ${
          isWindowExpanded
            ? 'retro-window-expanded-wipe absolute inset-0 z-40 w-full h-full'
            : 'relative w-full min-h-[170px] sm:min-h-[195px] h-full'
        } ${className}`}
        style={{
          backgroundColor: voidColor,
          color: brightColor,
          border: `2px solid ${midColor}`,
          outline: `2px solid ${brightColor}`,
          boxShadow: `2px 2px 0px 0px ${voidColor}`,
        }}
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
          className="relative w-full h-7 sm:h-8 px-2 flex items-center justify-between shrink-0 select-none border-b-2"
          style={{
            backgroundColor: brightColor,
            color: voidColor,
            borderColor: midColor,
          }}
        >
          {/* Left Title: DIR badge + C:\MOAYED\SYSTEM.DIR */}
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <span className="font-bold text-[8px] sm:text-[9px] bg-[#111712] text-[#c2cdb4] px-1 py-0.2 select-none" aria-hidden="true">
              DIR
            </span>
            <span
              data-testid="retro-window-title-text"
              className="font-pixel font-bold text-[9px] sm:text-[10px] tracking-wider truncate uppercase text-[#111712]"
            >
              C:\MOAYED\SYSTEM.DIR
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
            className="w-full px-2 py-1.5 flex items-center justify-between border-b shrink-0 text-[8px] sm:text-[9px]"
            style={{
              backgroundColor: dimColor,
              borderColor: `${midColor}80`,
              color: brightColor,
            }}
          >
            <div className="flex items-center gap-1 sm:gap-2" role="tablist" aria-label="Operating System Views">
              {RETRO_SECTIONS.map((sec) => {
                const isItemActive = currentActiveSection === sec;
                const meta = SECTION_METADATA[sec];
                return (
                  <button
                    key={sec}
                    ref={(el) => (tabRefs.current[sec] = el)}
                    type="button"
                    role="tab"
                    aria-selected={isItemActive}
                    tabIndex={isItemActive ? 0 : -1}
                    onClick={() => handleSectionSwitch(sec)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextIdx = ((meta.index + 1) % 3) as SectionIndex;
                        handleSectionSwitch(RETRO_SECTIONS[nextIdx]);
                      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        const prevIdx = ((meta.index - 1 + 3) % 3) as SectionIndex;
                        handleSectionSwitch(RETRO_SECTIONS[prevIdx]);
                      }
                    }}
                    data-testid={`retro-window-tab-${sec}`}
                    className="px-2.5 py-1.5 min-h-[44px] flex items-center border font-pixel font-bold uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                    style={
                      isItemActive
                        ? {
                            backgroundColor: brightColor,
                            color: voidColor,
                            borderColor: brightColor,
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: brightColor,
                            borderColor: `${midColor}66`,
                          }
                    }
                  >
                    {isItemActive ? `> ${meta.command}` : meta.command}
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[7px] opacity-75">
              <span>SYS.96 ARCHIVE</span>
              <span>•</span>
              <span>ESC TO RETURN</span>
            </div>
          </div>
        )}

        {/* WINDOW INNER BODY & SCROLLBAR SPLIT */}
        <div className="relative flex-1 flex min-h-0 overflow-hidden">
          {/* MAIN SCROLLABLE CONTENT VIEWPORT */}
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollMetrics}
            data-testid="retro-window-content-viewport"
            className="retro-hidden-scrollbar flex-1 overflow-y-auto p-3 sm:p-4 text-xs font-pixel select-text"
            style={{
              backgroundColor: voidColor,
              color: brightColor,
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehaviorY: 'contain',
            }}
          >
            {/* 1. OVERVIEW MODE (Compact Directory Listing & Highlighted Summary) */}
            {!isWindowExpanded && (
              <div
                data-testid="retro-window-overview-mode"
                onClick={handleMaximize}
                className="flex flex-col gap-2 cursor-pointer h-full justify-between"
                title="Click anywhere to expand window"
              >
                {/* Volume & Directory Header */}
                <div className="flex flex-col text-[7px] sm:text-[8px] uppercase tracking-wider opacity-75 pb-1 border-b border-[#6e7d62]/40">
                  <span>VOLUME IN DRIVE C IS WATCHKNIGHT_OS</span>
                  <span>DIRECTORY OF C:\MOAYED\*.*</span>
                </div>

                {/* Compact Directory Items Table */}
                <div className="flex flex-col gap-1 text-[8px] sm:text-[9px]" role="menu" aria-label="Selectable OS Directory">
                  {RETRO_SECTIONS.map((sec) => {
                    const meta = SECTION_METADATA[sec];
                    const isRowActive = currentActiveSection === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        role="menuitem"
                        tabIndex={isRowActive ? 0 : -1}
                        data-testid={`retro-overview-row-${sec}`}
                        data-active={isRowActive ? 'true' : 'false'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectSection) {
                            try {
                              retroAudio.playOpenWindow();
                            } catch {}
                            onSelectSection(sec);
                          } else {
                            osContext.openSection(sec);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (onSelectSection) {
                              try {
                                retroAudio.playOpenWindow();
                              } catch {}
                              onSelectSection(sec);
                            } else {
                              osContext.openSection(sec);
                            }
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            osContext.selectNext();
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            osContext.selectPrev();
                          }
                        }}
                        onMouseEnter={() => {
                          if (currentActiveSection !== sec) {
                            if (onSelectSection) {
                              try {
                                retroAudio.playBlip();
                              } catch {}
                              onSelectSection(sec);
                            } else {
                              osContext.setActiveSection(sec);
                            }
                          }
                        }}
                        onFocus={() => {
                          if (currentActiveSection !== sec) {
                            if (onSelectSection) {
                              try {
                                retroAudio.playBlip();
                              } catch {}
                              onSelectSection(sec);
                            } else {
                              osContext.setActiveSection(sec);
                            }
                          }
                        }}
                        className="w-full text-left flex items-center justify-between px-2 py-2 min-h-[44px] border cursor-pointer transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                        style={
                          isRowActive
                            ? {
                                backgroundColor: `${dimColor}`,
                                borderColor: brightColor,
                                color: brightColor,
                              }
                            : {
                                backgroundColor: 'transparent',
                                borderColor: 'transparent',
                                color: `${midColor}`,
                              }
                        }
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{isRowActive ? '>' : ' '}</span>
                          <span className="font-bold">{meta.command}</span>
                        </div>
                        <span className="text-[7px] opacity-70 font-mono">&lt;DIR&gt;</span>
                      </button>
                    );
                  })}
                </div>

                {/* Status Summary of Selected Item */}
                <div
                  className="p-1.5 border flex flex-col gap-0.5 text-[7px] sm:text-[8px]"
                  style={{
                    backgroundColor: `${dimColor}66`,
                    borderColor: `${midColor}80`,
                  }}
                >
                  <div className="flex items-center justify-between font-bold text-[#c2cdb4]">
                    <span>{`STATUS: ${activeMeta.status}`}</span>
                  </div>
                  <div className="text-[#6e7d62] truncate">
                    {activeMeta.tagline}
                  </div>
                  <div
                    className="text-[6.5px] sm:text-[7px] pt-0.5"
                    style={{ color: brightColor }}
                  >
                    &gt; PRESS [ENTER] OR CLICK [□] TO EXPAND
                  </div>
                </div>
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
              onClick={handleStepUp}
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
              onClick={handleStepDown}
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

        {/* PERSISTENT BOTTOM COMMAND BAR (Visible in Expanded Mode) */}
        {isWindowExpanded && (
          <div
            data-testid="retro-window-persistent-footer"
            className="w-full px-2 py-1.5 flex items-center justify-between border-t-2 shrink-0 text-[8px] sm:text-[9px]"
            style={{
              backgroundColor: dimColor,
              borderColor: midColor,
              color: brightColor,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[7.5px] opacity-80 uppercase">COMMAND:</span>
              {RETRO_SECTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleSectionSwitch(sec)}
                  className="hover:underline cursor-pointer min-h-[44px] flex items-center px-1 outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                  style={{
                    color: currentActiveSection === sec ? brightColor : midColor,
                    fontWeight: currentActiveSection === sec ? 'bold' : 'normal',
                  }}
                >
                  {SECTION_METADATA[sec].command}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClose}
              data-testid="retro-window-footer-close"
              className="px-2.5 py-1.5 min-h-[44px] flex items-center border font-bold text-[7.5px] sm:text-[8.5px] uppercase cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: brightColor,
                color: voidColor,
                borderColor: brightColor,
              }}
            >
              [X] ESC TO CLOSE
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RetroOSWindow;
