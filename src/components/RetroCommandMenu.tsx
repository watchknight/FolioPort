import React, { useCallback } from 'react';
import {
  useRetroOS,
  RETRO_SECTIONS,
  SECTION_METADATA,
  type RetroSection,
  type SectionIndex,
} from '../context/RetroOSContext';
import { retroAudio } from '../utils/retroAudio';

export interface PhosphorColorTokens {
  void?: string;
  dim?: string;
  mid?: string;
  bright?: string;
}

export interface RetroCommandMenuProps {
  className?: string;
  palette?: PhosphorColorTokens;
  activeIndex?: SectionIndex;
  onSelect?: (section: RetroSection, index: SectionIndex) => void;
}

export const RetroCommandMenu: React.FC<RetroCommandMenuProps> = ({
  className = '',
  palette,
  activeIndex: propActiveIndex,
  onSelect,
}) => {
  const osContext = useRetroOS();

  const currentActiveIndex = propActiveIndex !== undefined ? propActiveIndex : osContext.activeIndex;

  const brightColor = palette?.bright ?? '#c2cdb4';
  const voidColor = palette?.void ?? '#111712';
  const midColor = palette?.mid ?? '#6e7d62';

  const handleItemClick = useCallback(
    (index: SectionIndex, section: RetroSection) => {
      if (onSelect) {
        try {
          retroAudio.playOpenWindow();
        } catch {}
        onSelect(section, index);
      } else {
        osContext.openIndex(index);
      }
    },
    [onSelect, osContext]
  );

  const handleItemHover = useCallback(
    (index: SectionIndex) => {
      if (currentActiveIndex !== index) {
        osContext.setActiveIndex(index);
      }
    },
    [currentActiveIndex, osContext]
  );

  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Focus synchronization: when active index changes or window collapses, synchronize focus to active item
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!osContext.isWindowExpanded) {
      const activeEl = itemRefs.current[currentActiveIndex];
      if (activeEl) {
        activeEl.focus();
      }
    }
  }, [currentActiveIndex, osContext.isWindowExpanded]);

  return (
    <nav
      data-testid="retro-command-menu"
      aria-label="Retro 90s Command Navigation Menu"
      className={`retro-command-menu flex flex-col justify-between p-3 select-none font-pixel border border-[${midColor}]/40 bg-[${voidColor}]/60 ${className}`}
      style={{
        borderColor: `${midColor}66`,
        backgroundColor: `${voidColor}99`,
      }}
    >
      {/* Menu Header Telemetry */}
      <div
        className="flex items-center justify-between text-[8px] sm:text-[9px] uppercase tracking-wider pb-1.5 mb-2 border-b"
        style={{
          borderColor: `${midColor}4d`,
          color: midColor,
        }}
      >
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className="inline-block w-1.5 h-1.5"
            style={{ backgroundColor: brightColor }}
            aria-hidden="true"
          />
          <span>&gt; COMMAND MENU</span>
        </div>
        <span className="text-[7px] sm:text-[8px] opacity-80">[SYS.96 // NAV]</span>
      </div>

      {/* Navigation Command Items */}
      <div className="flex flex-col gap-1.5" role="menubar" aria-orientation="vertical">
        {RETRO_SECTIONS.map((sectionKey, index) => {
          const sectionIdx = index as SectionIndex;
          const meta = SECTION_METADATA[sectionKey];
          const isActive = currentActiveIndex === sectionIdx;

          return (
            <button
              key={sectionKey}
              ref={(el) => (itemRefs.current[index] = el)}
              type="button"
              role="menuitem"
              tabIndex={isActive ? 0 : -1}
              data-testid={`retro-command-item-${sectionKey}`}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => handleItemClick(sectionIdx, sectionKey)}
              onMouseEnter={() => handleItemHover(sectionIdx)}
              onFocus={() => handleItemHover(sectionIdx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(sectionIdx, sectionKey);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  osContext.selectNext();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  osContext.selectPrev();
                }
              }}
              className="group relative w-full text-left font-pixel font-bold text-xs sm:text-sm tracking-wide px-2.5 py-2 min-h-[44px] flex items-center transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={
                isActive
                  ? {
                      backgroundColor: brightColor,
                      color: voidColor,
                      boxShadow: `1px 1px 0px 0px ${voidColor}`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: brightColor,
                    }
              }
            >
              {/* Leading > Pixel Arrow Indicator */}
              <span
                data-testid={`retro-command-indicator-${sectionKey}`}
                className="inline-block w-3 sm:w-3.5 shrink-0 font-bold text-center select-none"
                style={{
                  color: isActive ? voidColor : 'transparent',
                  visibility: isActive ? 'visible' : 'hidden',
                }}
                aria-hidden="true"
              >
                &gt;
              </span>

              {/* Command text e.g. [1] ABOUT ME */}
              <span className="truncate font-pixel font-bold tracking-wider">
                {meta.command}
              </span>

              {/* Status pill tag for active item */}
              {isActive && (
                <span
                  className="ml-auto text-[7px] uppercase font-mono px-1 py-0.5 border"
                  style={{
                    backgroundColor: voidColor,
                    color: brightColor,
                    borderColor: voidColor,
                  }}
                >
                  ACTIVE
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keyboard Shortcut Footer Guidance */}
      <div
        className="flex items-center justify-between text-[7px] sm:text-[8px] uppercase tracking-wide pt-2 mt-2 border-t"
        style={{
          borderColor: `${midColor}33`,
          color: midColor,
        }}
      >
        <span>KEYS: [1] [2] [3]</span>
        <span>↑↓ ROVE • ENTER EXPAND</span>
      </div>
    </nav>
  );
};

export default RetroCommandMenu;
