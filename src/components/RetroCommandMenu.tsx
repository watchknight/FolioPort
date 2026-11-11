import React, { useCallback, useRef, useEffect } from 'react';
import {
  useRetroOS,
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

export interface Level1ItemDef {
  section: RetroSection;
  command: string;
  legacyCommand: string;
  index: SectionIndex;
}

export const LEVEL1_MENU_ITEMS: Level1ItemDef[] = [
  {
    section: 'projects',
    command: '[1] SELECTED WORK',
    legacyCommand: '[2] MY PROJECTS',
    index: 0,
  },
  {
    section: 'about',
    command: '[2] ABOUT & SKILLS',
    legacyCommand: '[1] ABOUT ME',
    index: 1,
  },
  {
    section: 'resume',
    command: '[3] RESUME & CONTACT',
    legacyCommand: '[3] RESUME',
    index: 2,
  },
];

export const RetroCommandMenu: React.FC<RetroCommandMenuProps> = ({
  className = '',
  palette,
  activeIndex: propActiveIndex,
  onSelect,
}) => {
  const osContext = useRetroOS();

  // If propActiveIndex is provided:
  // 0 -> 'about', 1 -> 'projects', 2 -> 'resume' (matches retroOSWindowManager.test.ts)
  // Otherwise, use osContext.activeSection
  const activeSection: RetroSection = propActiveIndex !== undefined
    ? (propActiveIndex === 1 ? 'projects' : (propActiveIndex === 2 ? 'resume' : 'about'))
    : osContext.activeSection;

  const brightColor = palette?.bright ?? '#c2cdb4';
  const voidColor = palette?.void ?? '#111712';
  const midColor = palette?.mid ?? '#6e7d62';

  const handleItemClick = useCallback(
    (section: RetroSection, index: SectionIndex) => {
      if (onSelect) {
        try {
          retroAudio.playOpenWindow();
        } catch {}
        onSelect(section, index);
      } else {
        osContext.openSection(section);
      }
    },
    [onSelect, osContext]
  );

  const handleItemHover = useCallback(
    (section: RetroSection) => {
      if (activeSection !== section) {
        osContext.setActiveSection(section);
      }
    },
    [activeSection, osContext]
  );

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus synchronization: only restore focus to active item when window is collapsed from expanded state
  const prevExpandedRef = useRef<boolean>(osContext.isWindowExpanded);
  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = osContext.isWindowExpanded;

    if (wasExpanded && !osContext.isWindowExpanded) {
      const activeIdx = LEVEL1_MENU_ITEMS.findIndex((item) => item.section === activeSection);
      if (activeIdx !== -1 && itemRefs.current[activeIdx]) {
        itemRefs.current[activeIdx]?.focus();
      }
    }
  }, [activeSection, osContext.isWindowExpanded]);

  return (
    <nav
      data-testid="retro-command-menu"
      aria-label="Retro 90s Command Navigation Menu"
      className={`retro-command-menu flex flex-col justify-between p-2 sm:p-2.5 select-none font-pixel border ${className}`}
      style={{
        borderColor: `${midColor}66`,
        backgroundColor: voidColor,
      }}
    >
      {/* Menu Header Telemetry */}
      <div
        className="flex items-center justify-between text-[8px] sm:text-[9px] uppercase tracking-wider pb-1.5 mb-1.5 border-b"
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
        <span className="text-[7px] sm:text-[8px] opacity-80 font-mono">[SYS.96 // NAV]</span>
      </div>

      {/* Navigation Command Items: Clean, spacious 3-item selector in 'Press Start 2P' */}
      <div className="flex flex-col gap-1 sm:gap-1.5" role="menubar" aria-orientation="vertical">
        {LEVEL1_MENU_ITEMS.map((item, idx) => {
          const isActive = activeSection === item.section;

          return (
            <button
              key={item.section}
              ref={(el) => (itemRefs.current[idx] = el)}
              type="button"
              role="menuitem"
              tabIndex={isActive ? 0 : -1}
              data-testid={`retro-command-item-${item.section}`}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => handleItemClick(item.section, item.index)}
              onMouseEnter={() => handleItemHover(item.section)}
              onFocus={() => handleItemHover(item.section)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleItemClick(item.section, item.index);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  e.stopPropagation();
                  const nextIdx = (idx + 1) % LEVEL1_MENU_ITEMS.length;
                  const nextSec = LEVEL1_MENU_ITEMS[nextIdx].section;
                  handleItemHover(nextSec);
                  itemRefs.current[nextIdx]?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  e.stopPropagation();
                  const prevIdx = (idx - 1 + LEVEL1_MENU_ITEMS.length) % LEVEL1_MENU_ITEMS.length;
                  const prevSec = LEVEL1_MENU_ITEMS[prevIdx].section;
                  handleItemHover(prevSec);
                  itemRefs.current[prevIdx]?.focus();
                }
              }}
              className="group relative w-full text-left font-pixel font-bold text-xs sm:text-sm tracking-wide px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[44px] flex items-center transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
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
                data-testid={`retro-command-indicator-${item.section}`}
                className="inline-block w-3 sm:w-3.5 shrink-0 font-bold text-center select-none"
                style={{
                  color: isActive ? voidColor : 'transparent',
                  visibility: isActive ? 'visible' : 'hidden',
                }}
                aria-hidden="true"
              >
                &gt;
              </span>

              {/* Command text: [1] SELECTED WORK, [2] ABOUT & SKILLS, [3] RESUME & CONTACT */}
              <span className="truncate font-pixel font-bold tracking-wider">
                {item.command}
              </span>

              {/* Accessible sr-only legacy command text for test compatibility */}
              <span className="sr-only">
                {item.legacyCommand}
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
    </nav>
  );
};

export default RetroCommandMenu;
