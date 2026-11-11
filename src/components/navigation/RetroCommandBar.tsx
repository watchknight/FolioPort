import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLenis } from '../../hooks/useLenis';
import { useTheme } from '../../context/ThemeContext';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../../utils/chiptuneAudio';
import { Menu, X } from 'lucide-react';

export type RenderPassMode = 'beauty' | 'uv' | 'lattice';
export type RenderMode = '3D VECTOR' | '3D PIXEL_ART' | 'CRT ANALOG';

interface RetroNavItem {
  id: string;
  num: string;
  label: string;
  subtitle: string;
}

const COMMAND_NAV_ITEMS: RetroNavItem[] = [
  { id: '#work', num: '01', label: 'Work', subtitle: 'Selected Projects' },
  { id: '#extensions', num: '02', label: 'Extensions', subtitle: 'Browser Extension Studio' },
  { id: '#systems', num: '03', label: 'Skills', subtitle: 'Systems & Architecture' },
  { id: '#lab', num: '04', label: 'GitHub', subtitle: 'Open Source Repositories' },
  { id: '#terminal', num: '05', label: 'Terminal', subtitle: 'Interactive Shell' },
  { id: '#contact', num: '06', label: 'Contact', subtitle: 'Get in Touch' },
];

export const RetroCommandBar: React.FC = () => {
  const { lenis, scrollTo } = useLenis();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('');
  const [renderMode, setRenderModeState] = useState<RenderMode>('3D VECTOR');
  const [dhakaTime, setDhakaTime] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChiptuneOn, setIsChiptuneOn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 1. Live Dhaka (UTC+6) chronometer
  useEffect(() => {
    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setDhakaTime(formatter.format(new Date()));
      } catch {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const dhaka = new Date(utc + 6 * 3600000);
        setDhakaTime(dhaka.toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Active section tracking synced with scroll
  useEffect(() => {
    const updateActiveAnchor = (currentScrollY: number) => {
      setScrolled(currentScrollY > 20);

      if (
        typeof document !== 'undefined' &&
        window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 100
      ) {
        setActiveSection('#contact');
        return;
      }

      const sections = ['#contact', '#terminal', '#lab', '#systems', '#extensions', '#work'];
      for (const id of sections) {
        const el = document.querySelector(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + currentScrollY;
          const bottom = top + rect.height;
          const probe = currentScrollY + window.innerHeight * 0.35;
          if (probe >= top && probe <= bottom) {
            setActiveSection(id);
            return;
          }
        }
      }

      if (currentScrollY < 250) {
        setActiveSection('');
      }
    };

    const onScroll = () => updateActiveAnchor(window.scrollY);
    const onLenisScroll = (e: { scroll: number } | any) => {
      const scrollVal = typeof e?.scroll === 'number' ? e.scroll : window.scrollY;
      updateActiveAnchor(scrollVal);
    };

    if (lenis) lenis.on('scroll', onLenisScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (lenis) lenis.off('scroll', onLenisScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [lenis]);

  // 3. Audio & Click handlers
  const handleNavClick = useCallback(
    (id: string, e?: React.MouseEvent) => {
      setActiveSection(id);
      const normX = e && typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
      watchknightAudio.playSpatialClick(normX, 0, -1);
      chiptuneAudio.playCoinSFX();

      const offset = id === '#work' ? 0 : -85;
      scrollTo(id, { offset });
      setMobileMenuOpen(false);
    },
    [scrollTo]
  );

  const handleToggle8BitAudio = useCallback(() => {
    const isNowPlaying = chiptuneAudio.toggleChiptuneBGM();
    setIsChiptuneOn(isNowPlaying);
    if (isNowPlaying) {
      chiptuneAudio.playPowerUpSFX();
    } else {
      chiptuneAudio.playPixelTick();
    }
  }, []);

  const handleRenderModeSelect = useCallback((mode: RenderMode, e?: React.MouseEvent) => {
    setRenderModeState(mode);
    const passMode: RenderPassMode =
      mode === '3D VECTOR' ? 'beauty' : mode === '3D PIXEL_ART' ? 'uv' : 'lattice';

    const normX = e && typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
    watchknightAudio.playSpatialClick(normX, 0, -1);
    chiptuneAudio.playPowerUpSFX();

    const modeIndex = mode === '3D VECTOR' ? 0 : mode === '3D PIXEL_ART' ? 1 : 2;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wk-render-mode-change', {
          detail: { mode, modeIndex },
        })
      );
      window.dispatchEvent(
        new CustomEvent('wk-render-pass-change', {
          detail: { mode: passMode, modeIndex, renderMode: mode },
        })
      );
      document.documentElement.setAttribute('data-render-mode', mode);
      document.documentElement.setAttribute('data-render-pass', passMode);
    }
  }, []);

  useEffect(() => {
    const handleExternalPassChange = (e: Event) => {
      const detail = (e as CustomEvent<{ mode?: string; modeIndex?: number; renderMode?: RenderMode }>).detail;
      if (detail?.renderMode) {
        setRenderModeState(detail.renderMode);
      } else if (detail?.mode) {
        if (detail.mode === 'beauty' || detail.mode === '3D VECTOR') {
          setRenderModeState('3D VECTOR');
        } else if (detail.mode === 'uv' || detail.mode === '3D PIXEL_ART') {
          setRenderModeState('3D PIXEL_ART');
        } else if (detail.mode === 'lattice' || detail.mode === 'CRT ANALOG') {
          setRenderModeState('CRT ANALOG');
        }
      }
    };

    window.addEventListener('wk-render-pass-change', handleExternalPassChange);
    window.addEventListener('wk-render-mode-change', handleExternalPassChange);

    const handleBgmStateChange = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail;
      if (typeof detail?.active === 'boolean') {
        setIsChiptuneOn(detail.active);
      }
    };
    window.addEventListener('wk-chiptune-bgm-change', handleBgmStateChange);

    return () => {
      window.removeEventListener('wk-render-pass-change', handleExternalPassChange);
      window.removeEventListener('wk-render-mode-change', handleExternalPassChange);
      window.removeEventListener('wk-chiptune-bgm-change', handleBgmStateChange);
    };
  }, []);

  return (
    <header
      className={`retro-command-bar fixed top-0 left-0 right-0 z-[9997] pointer-events-auto select-none overflow-x-clip transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.85)]' : ''
      }`}
      style={{
        height: '52px',
        background: theme === 'light' ? 'var(--crt-glass-surface, rgba(242, 239, 233, 0.88))' : 'rgba(7, 8, 20, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: theme === 'light' ? '1px solid var(--border-hairline, rgba(17, 19, 26, 0.18))' : '1px solid rgba(0, 240, 255, 0.25)',
      }}
    >
      <div className="retro-command-inner w-full h-full px-2 sm:px-3 lg:px-4 2xl:px-6 flex items-center justify-between gap-1 sm:gap-2">
        {/* Left: @watchknight + blinking green indicator EWU CSE • Dhaka (UTC+6) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => {
              scrollTo(0);
              setActiveSection('');
              watchknightAudio.play8BitBlip(980);
            }}
            className={`group flex items-center gap-1 px-1.5 py-0.5 transition-all shrink-0 border ${
              theme === 'light'
                ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[1px_1px_0_0_#C8C1B4]'
                : 'bg-[#131629] border-[#2D3645] hover:border-[#00F0FF] shadow-[1px_1px_0_0_#070814]'
            }`}
            aria-label="Apex Home Sentinel"
          >
            <span className={`font-pixel text-[8.5px] sm:text-[9px] tracking-wider ${
              theme === 'light' ? 'text-[#11131A]' : 'text-[#F0EFE6]'
            }`}>
              @watchknight
            </span>
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
              theme === 'light'
                ? 'bg-[#007A33] shadow-[0_0_6px_#007A33]'
                : 'bg-[#4AF626] shadow-[0_0_6px_#4AF626]'
            }`} />
            <span className={`font-pixel text-[7px] sm:text-[7.5px] xl:text-[8px] tracking-wider hidden sm:inline whitespace-nowrap ${
              theme === 'light' ? 'text-[#3F4654]' : 'text-[#D6CFC2]'
            }`}>
              EWU CSE • Dhaka {dhakaTime ? `${dhakaTime} ` : ''}(UTC+6)
            </span>
            <span className={`font-pixel text-[6.5px] tracking-wider sm:hidden whitespace-nowrap ${
              theme === 'light' ? 'text-[#3F4654]' : 'text-[#D6CFC2]'
            }`}>
              EWU CSE • Dhaka (UTC+6)
            </span>
          </div>
        </div>

        {/* Center: > [01] SYSTEMS | > [02] EXTENSIONS | > [03] ARCHITECTURE | > [04] GITHUB_ROM | > [05] TERMINAL | > [06] CONTACT */}
        <nav
          className="hidden xl:flex items-center font-pixel text-[7px] xl:text-[7.5px] 2xl:text-[8px] tracking-wider shrink-0"
          aria-label="WATCHKNIGHT_OS Navigation"
        >
          {COMMAND_NAV_ITEMS.map((item, idx) => {
            const isActive = activeSection === item.id;
            return (
              <React.Fragment key={item.id}>
                {idx > 0 && <span className={`${theme === 'light' ? 'text-[#1A1D24]/20' : 'text-[#2D3645]'} select-none mx-0.5 text-[7px]`}>|</span>}
                <button
                  type="button"
                  onClick={(e) => handleNavClick(item.id, e)}
                  onMouseEnter={() => chiptuneAudio.playPixelTick()}
                  className={`flex items-center gap-1 px-1 sm:px-1.5 py-0.5 transition-all rounded-none border whitespace-nowrap ${
                    isActive
                      ? (theme === 'light'
                          ? 'bg-[#E5DFD3] text-[#0052FF] border-[#1A1D24] shadow-[1px_1px_0_0_#C8C1B4]'
                          : 'bg-[#0C2430] text-[#00F0FF] border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.35)]')
                      : (theme === 'light'
                          ? 'bg-transparent text-[#3F4654] border-transparent hover:text-[#0052FF] hover:bg-black/5'
                          : 'bg-transparent text-[#D6CFC2] border-transparent hover:text-[#00F0FF] hover:bg-white/5')
                  }`}
                  title={item.subtitle}
                  aria-label={`Jump to ${item.label}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={theme === 'light' ? 'text-[#3F4654]/70' : 'text-[#8E98AA]'}>{item.num}.</span>
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right: [RENDER: 3D / PIXEL / CRT] mode toggle + [♫ 8-BIT AUDIO] toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* [RENDER: 3D / PIXEL / CRT] Mode Toggle */}
          <div
            className={`flex items-center px-1 py-0.5 text-[7px] sm:text-[7.5px] font-pixel select-none shrink-0 border ${
              theme === 'light' ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[1px_1px_0_0_#C8C1B4]' : 'bg-[#131629] border-[#2D3645]'
            }`}
            role="radiogroup"
            aria-label="3D Render Mode"
          >
            <span className={`mr-0.5 hidden sm:inline ${theme === 'light' ? 'text-[#3F4654]' : 'text-[#8E98AA]'}`}>RENDER:</span>
            <button
              type="button"
              role="radio"
              aria-checked={renderMode === '3D VECTOR'}
              onClick={(e) => handleRenderModeSelect('3D VECTOR', e)}
              className={`px-1 py-0.5 transition-colors ${
                renderMode === '3D VECTOR'
                  ? (theme === 'light' ? 'bg-[#0052FF] text-[#FFFFFF] font-bold shadow-[0_0_6px_rgba(0,82,255,0.4)]' : 'bg-[#00F0FF] text-[#070814] font-bold shadow-[0_0_6px_rgba(0,240,255,0.4)]')
                  : (theme === 'light' ? 'text-[#3F4654] hover:text-[#11131A]' : 'text-[#8E98AA] hover:text-[#F0EFE6]')
              }`}
              title="3D Vector Mode"
            >
              3D
            </button>
            <span className={`${theme === 'light' ? 'text-[#1A1D24]/30' : 'text-[#2D3645]'} mx-0.5`}>/</span>
            <button
              type="button"
              role="radio"
              aria-checked={renderMode === '3D PIXEL_ART'}
              onClick={(e) => handleRenderModeSelect('3D PIXEL_ART', e)}
              className={`px-1 py-0.5 transition-colors ${
                renderMode === '3D PIXEL_ART'
                  ? (theme === 'light' ? 'bg-[#0052FF] text-[#FFFFFF] font-bold shadow-[0_0_6px_rgba(0,82,255,0.4)]' : 'bg-[#00F0FF] text-[#070814] font-bold shadow-[0_0_6px_rgba(0,240,255,0.4)]')
                  : (theme === 'light' ? 'text-[#3F4654] hover:text-[#11131A]' : 'text-[#8E98AA] hover:text-[#F0EFE6]')
              }`}
              title="Pixel Art Mode"
            >
              PIXEL
            </button>
            <span className={`${theme === 'light' ? 'text-[#1A1D24]/30' : 'text-[#2D3645]'} mx-0.5`}>/</span>
            <button
              type="button"
              role="radio"
              aria-checked={renderMode === 'CRT ANALOG'}
              onClick={(e) => handleRenderModeSelect('CRT ANALOG', e)}
              className={`px-1 py-0.5 transition-colors ${
                renderMode === 'CRT ANALOG'
                  ? (theme === 'light' ? 'bg-[#D90452] text-[#FFFFFF] font-bold shadow-[0_0_6px_rgba(217,4,82,0.4)]' : 'bg-[#FF2A85] text-[#070814] font-bold shadow-[0_0_6px_rgba(255,42,133,0.4)]')
                  : (theme === 'light' ? 'text-[#3F4654] hover:text-[#11131A]' : 'text-[#8E98AA] hover:text-[#F0EFE6]')
              }`}
              title="CRT Analog Mode"
            >
              CRT
            </button>
          </div>

          {/* [ ☀ DAYLIGHT_CAD | ☾ NIGHT_CRT ] Tactile Hardware Rocker Switch */}
          <div
            className={`flex items-center px-1 py-0.5 text-[7px] sm:text-[7.5px] font-pixel select-none shrink-0 border ${
              theme === 'light' ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[1px_1px_0_0_#C8C1B4]' : 'bg-[#131629] border-[#2D3645]'
            }`}
            role="radiogroup"
            aria-label="Theme Hardware Rocker Switch"
          >
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'light'}
              onClick={() => {
                if (theme !== 'light') toggleTheme();
              }}
              onMouseEnter={() => chiptuneAudio.playPixelTick()}
              className={`px-1 py-0.5 transition-colors flex items-center gap-1 ${
                theme === 'light'
                  ? 'bg-[#0052FF] text-[#FFFFFF] font-bold shadow-[0_0_6px_rgba(0,82,255,0.4)]'
                  : 'text-[#8E98AA] hover:text-[#F0EFE6]'
              }`}
              title="Switch to Daylight Theme"
            >
              <span>☀</span>
              <span className="hidden sm:inline">Daylight</span>
              <span className="sm:hidden">Day</span>
            </button>
            <span className={`${theme === 'light' ? 'text-[#1A1D24]/30' : 'text-[#2D3645]'} mx-0.5`}>|</span>
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'dark'}
              onClick={() => {
                if (theme !== 'dark') toggleTheme();
              }}
              onMouseEnter={() => chiptuneAudio.playPixelTick()}
              className={`px-1 py-0.5 transition-colors flex items-center gap-1 ${
                theme === 'dark'
                  ? 'bg-[#00F0FF] text-[#070814] font-bold shadow-[0_0_6px_rgba(0,240,255,0.4)]'
                  : (theme === 'light' ? 'text-[#3F4654] hover:text-[#11131A]' : 'text-[#8E98AA] hover:text-[#F0EFE6]')
              }`}
              title="Switch to Night Theme"
            >
              <span>☾</span>
              <span className="hidden sm:inline">Night</span>
              <span className="sm:hidden">Night</span>
            </button>
          </div>

          {/* [♫ 8-BIT AUDIO] Toggle */}
          <button
            type="button"
            onClick={handleToggle8BitAudio}
            onMouseEnter={() => chiptuneAudio.playPixelTick()}
            title={isChiptuneOn ? '8-Bit Audio Playing • Click to Mute' : 'Click to Play 8-Bit Audio'}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[7px] sm:text-[7.5px] font-pixel border transition-all select-none shrink-0 ${
              isChiptuneOn
                ? (theme === 'light'
                    ? 'bg-[#D90452]/15 text-[#D90452] border-[#D90452] shadow-[0_0_8px_rgba(217,4,82,0.4)]'
                    : 'bg-[#300E1F] text-[#FF2A85] border-[#FF2A85] shadow-[0_0_8px_rgba(255,42,133,0.5)]')
                : (theme === 'light'
                    ? 'bg-[#FFFFFF] text-[#11131A] border-[#1A1D24] hover:border-[#0052FF] hover:text-[#0052FF] shadow-[1px_1px_0_0_#C8C1B4]'
                    : 'bg-[#131629] text-[#D6CFC2] border-[#2D3645] hover:border-[#FFCC00] hover:text-[#FFCC00]')
            }`}
            aria-pressed={isChiptuneOn}
          >
            <span>♫</span>
            <span className="hidden sm:inline">8-BIT AUDIO: {isChiptuneOn ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">{isChiptuneOn ? 'ON' : 'OFF'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isChiptuneOn
                  ? (theme === 'light' ? 'bg-[#D90452] animate-ping' : 'bg-[#FF2A85] animate-ping')
                  : (theme === 'light' ? 'bg-[#3F4654]' : 'bg-[#8E98AA]')
              }`}
            />
          </button>

          {/* Mobile Menu Hamburger (Visible on screens < xl) */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              watchknightAudio.play8BitBlip(640);
            }}
            className="xl:hidden p-1.5 bg-[#131629] border border-[#2D3645] text-[#00F0FF] hover:border-[#00F0FF] focus:outline-none"
            aria-label="Toggle Command Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay via Portal to prevent containment by header's backdrop-filter */}
      {mobileMenuOpen && (typeof document !== 'undefined' ? (
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-[#070814]/98 backdrop-blur-2xl xl:hidden flex flex-col justify-center px-4 transition-all duration-200 pointer-events-auto border-b-2 border-[#00F0FF]">
            <div className="w-full max-w-md mx-auto bg-[#131629] border-2 border-[#00F0FF] p-5 shadow-[0_0_30px_rgba(0,240,255,0.25)] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#2D3645] pb-3">
                <span className="font-pixel text-xs text-[#00F0FF]">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="retro-btn-box"
                >
                  x
                </button>
              </div>

              {/* Mobile Nav Links */}
              <div className="space-y-2">
                {COMMAND_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 font-pixel text-xs border-2 text-left transition-all ${
                      activeSection === item.id
                        ? 'bg-[#0C2430] border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-[#0D1512] border-[#2D3645] text-[#F0EFE6] hover:border-[#00F0FF]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#8E98AA]">{item.num}.</span>
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#8E98AA]">{item.subtitle}</span>
                  </button>
                ))}
              </div>

              {/* Mobile 3D Render Mode Controls */}
              <div className="pt-2 border-t-2 border-[#2D3645] space-y-1.5">
                <div className="font-pixel text-[9px] text-[#8E98AA]">3D Render Engine:</div>
                <div className="grid grid-cols-3 gap-1">
                  {(['3D VECTOR', '3D PIXEL_ART', 'CRT ANALOG'] as RenderMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={(e) => handleRenderModeSelect(mode, e)}
                      className={`px-1.5 py-1 text-[8px] font-pixel border text-center transition-colors ${
                        renderMode === mode
                          ? mode === 'CRT ANALOG'
                            ? 'bg-[#FF2A85] text-[#070814] font-bold border-[#FF2A85]'
                            : 'bg-[#00F0FF] text-[#070814] font-bold border-[#00F0FF]'
                          : 'bg-[#0D1512] text-[#8E98AA] border-[#2D3645] hover:text-[#F0EFE6]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="pt-2 border-t-2 border-[#2D3645] space-y-1.5">
                <div className="font-pixel text-[9px] text-[#8E98AA]">&gt; THEME SYSTEM:</div>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'light') toggleTheme();
                    }}
                    className={`px-2 py-1 text-[8px] font-pixel border text-center transition-colors ${
                      theme === 'light'
                        ? 'bg-[#0052FF] text-[#FFFFFF] font-bold border-[#0052FF]'
                        : 'bg-[#0D1512] text-[#8E98AA] border-[#2D3645]'
                    }`}
                  >
                    ☀ DAYLIGHT_CAD
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (theme !== 'dark') toggleTheme();
                    }}
                    className={`px-2 py-1 text-[8px] font-pixel border text-center transition-colors ${
                      theme === 'dark'
                        ? 'bg-[#00F0FF] text-[#070814] font-bold border-[#00F0FF]'
                        : 'bg-[#0D1512] text-[#8E98AA] border-[#2D3645]'
                    }`}
                  >
                    ☾ NIGHT_CRT
                  </button>
                </div>
              </div>

              {/* Mobile 8-Bit Audio and Render Pass Controls */}
              <div className="pt-2 border-t-2 border-[#2D3645] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleToggle8BitAudio}
                  onMouseEnter={() => chiptuneAudio.playPixelTick()}
                  className="flex items-center gap-2 px-3 py-2 bg-[#0D1512] border-2 border-[#2D3645] font-pixel text-[10px] text-[#FF2A85]"
                >
                  <span>[ ♫ 8-BIT AUDIO: {isChiptuneOn ? 'ON' : 'OFF'} ]</span>
                </button>

                <div className="text-[10px] font-mono text-[#8E98AA]">
                  EWU DHAKA (UTC+6)
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      ) : null)}
    </header>
  );
};

export default RetroCommandBar;
