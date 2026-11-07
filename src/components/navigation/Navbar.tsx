import React, { useState, useEffect } from 'react';
import { useLenis } from '../../hooks/useLenis';
import { useWebAudio } from '../../hooks/useWebAudio';
import { useTheme } from '../../context/ThemeContext';
import { audio } from '../../utils/audio';
import { Magnetic } from '../ui/Magnetic';
import { 
  Briefcase, 
  FlaskConical, 
  Cpu, 
  Terminal as TerminalIcon, 
  Mail, 
  Menu, 
  X, 
  Clock, 
  Compass,
  ArrowUpRight,
  User,
  Calendar,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: '#about', label: 'About', icon: <User className="w-3.5 h-3.5" /> },
  { id: '#work', label: 'Work', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: '#experience', label: 'Experience', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: '#lab', label: 'GitHub Lab', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: '#systems', label: 'Systems', icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: '#terminal', label: 'Terminal', icon: <TerminalIcon className="w-3.5 h-3.5" /> },
  { id: '#contact', label: 'Contact', icon: <Mail className="w-3.5 h-3.5" /> },
];

export const Navbar: React.FC = () => {
  const { lenis, scrollTo } = useLenis();
  const { isEnabled: isSoundEnabled, toggle: toggleSound } = useWebAudio();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dhakaTime, setDhakaTime] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  // Live Dhaka (UTC+6) time generator
  useEffect(() => {
    const updateTime = () => {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
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

  // Track active section and scroll state synchronized with Lenis single-RAF loop
  useEffect(() => {
    const updateActiveSection = (currentScrollY: number) => {
      setScrolled(currentScrollY > 40);

      // If at apex/hero, no section is active
      if (currentScrollY < 200) {
        setActiveSection('');
        return;
      }

      // If reached bottom of document, activate #contact
      if (window.innerHeight + currentScrollY >= document.documentElement.scrollHeight - 60) {
        setActiveSection('#contact');
        return;
      }

      const sections = ['#about', '#work', '#experience', '#lab', '#systems', '#terminal', '#contact'];
      const scrollPosition = currentScrollY + window.innerHeight * 0.35;

      let current = '';
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.querySelector(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + currentScrollY;
          if (scrollPosition >= top) {
            current = sections[i];
            break;
          }
        }
      }
      setActiveSection(current);
    };

    const onLenisScroll = (e: { scroll: number }) => updateActiveSection(e.scroll);
    const onWindowScroll = () => updateActiveSection(window.scrollY);

    if (lenis) {
      lenis.on('scroll', onLenisScroll);
    } else {
      window.addEventListener('scroll', onWindowScroll, { passive: true });
    }

    return () => {
      if (lenis) {
        lenis.off('scroll', onLenisScroll);
      }
      window.removeEventListener('scroll', onWindowScroll);
    };
  }, [lenis]);

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    audio.playChord();
    // Pinned #work showcase has pt-24 internal clearance and requires offset 0 to align with ScrollTrigger 'top top'
    scrollTo(id, { offset: id === '#work' ? 0 : -90 });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center pt-3 md:pt-4 px-3 sm:px-4 transition-all duration-300">
        
        {/* Availability Status Ribbon Pill */}
        <div 
          className={`pointer-events-auto mb-2 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1 rounded-full text-fluid-micro font-mono tracking-tight bg-obsidian-surface/90 border border-white/10 backdrop-blur-xl shadow-editorial-card max-w-[94vw] overflow-hidden transition-all duration-300 ${
            scrolled ? 'opacity-90 scale-95 md:scale-100' : 'opacity-100'
          }`}
        >
          {/* Pulsing Editorial Indicator */}
          <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </div>

          <span className="text-alabaster-dim font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="hidden sm:inline">Available for Internships & Full-Stack / Systems Roles</span>
            <span className="sm:hidden">Available: Systems / Full-Stack Roles</span>
          </span>

          <span className="text-white/30 hidden sm:inline">•</span>

          <span className="text-accent-coral hidden sm:inline-flex items-center gap-1 font-semibold shrink-0">
            Dhaka, BD (UTC+6)
          </span>

          {dhakaTime && (
            <span className="hidden md:inline-flex items-center gap-1 text-muted border-l border-white/10 pl-2 shrink-0">
              <Clock className="w-3 h-3 text-accent-coral/70" />
              <span>{dhakaTime}</span>
            </span>
          )}
        </div>

        {/* Floating Glassmorphic Main Navigation Pill */}
        <nav 
          className="pointer-events-auto flex items-center justify-between gap-1 md:gap-2 px-2.5 py-1.5 rounded-full bg-obsidian-surface/90 backdrop-blur-2xl border border-white/10 shadow-editorial-card transition-all duration-300 hover:border-white/20"
          aria-label="Main Portfolio Navigation"
        >
          {/* Brand Monogram wrapped with Magnetic vector physics */}
          <Magnetic
            as="button"
            onClick={() => {
              scrollTo(0);
              setActiveSection('');
              audio.playChord();
            }}
            onMouseEnter={() => audio.playTick()}
            className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-alabaster hover:text-white transition-colors focus:outline-none"
            aria-label="Return to top of portfolio"
          >
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center shadow-editorial-card group-hover:border-accent transition-colors">
              <span className="font-display font-black text-xs text-accent-coral group-hover:scale-110 transition-transform">FP</span>
            </div>
            <span className="font-display font-bold text-xs tracking-wider uppercase text-alabaster group-hover:text-accent-coral hidden lg:inline">
              FOLIO<span className="text-accent">PORT</span>
            </span>
          </Magnetic>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* Desktop Nav Items wrapped with Magnetic physics */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Magnetic
                  key={item.id}
                  as="button"
                  onClick={() => handleNavClick(item.id)}
                  onMouseEnter={() => audio.playTick()}
                  aria-label={`Navigate to ${item.label} section`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-fluid-mono font-medium transition-all duration-300 group ${
                    isActive
                      ? 'text-accent-coral font-semibold'
                      : 'text-muted hover:text-alabaster hover:bg-white/5'
                  }`}
                >
                  {/* Active highlight glow pill */}
                  {isActive && (
                    <span 
                      className="absolute inset-0 rounded-full bg-accent/10 border border-accent/30 shadow-editorial-card" 
                      aria-hidden="true" 
                    />
                  )}
                  <span className={`relative z-10 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-accent-coral' : 'text-muted group-hover:text-accent-coral'}`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10">{item.label}</span>
                </Magnetic>
              );
            })}
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Persistent Mute/Sound Wave Toggle Button */}
          <Magnetic
            as="button"
            onClick={() => {
              toggleSound();
            }}
            onMouseEnter={() => audio.playTick()}
            aria-label={isSoundEnabled ? 'Mute procedural Web Audio synthesizer' : 'Enable procedural Web Audio synthesizer (opt-in)'}
            title={isSoundEnabled ? 'Sound ON • Click to Mute' : 'Sound OFF • Click to Enable Procedural Synthesizer'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-fluid-micro font-mono transition-all duration-200 ${
              isSoundEnabled
                ? 'bg-accent/20 border-accent/40 text-accent-coral shadow-editorial-card'
                : 'bg-white/5 border-white/10 text-muted hover:text-alabaster hover:bg-white/10'
            }`}
          >
            {isSoundEnabled ? (
              <div className="flex items-center gap-0.5 h-3 px-0.5" aria-hidden="true">
                <span className="w-0.5 bg-accent-coral rounded-full animate-sound-bar-1" />
                <span className="w-0.5 bg-accent-coral rounded-full animate-sound-bar-2" />
                <span className="w-0.5 bg-accent-coral rounded-full animate-sound-bar-3" />
                <span className="w-0.5 bg-accent-coral rounded-full animate-sound-bar-4" />
              </div>
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
            )}
            <span className="hidden xl:inline text-[11px] font-mono tracking-tight">
              {isSoundEnabled ? 'SOUND ON' : 'MUTE'}
            </span>
          </Magnetic>

          {/* Tri-Mode Editorial Color Switcher (Ilja van Eck System) */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10"
            role="radiogroup"
            aria-label="Editorial Color Mode Selector"
          >
            {/* Obsidian & Rust */}
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'obsidian'}
              onClick={() => {
                setTheme('obsidian');
                audio.playTick();
              }}
              onMouseEnter={() => audio.playTick()}
              title="Obsidian & Rust (#0A0A0A / #A74024)"
              aria-label="Obsidian & Rust theme swatch"
              className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all ${
                theme === 'obsidian'
                  ? 'ring-2 ring-accent ring-offset-1 ring-offset-obsidian scale-110'
                  : 'opacity-65 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: '#A74024' }} />
            </button>

            {/* Editorial Alabaster */}
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'alabaster'}
              onClick={() => {
                setTheme('alabaster');
                audio.playTick();
              }}
              onMouseEnter={() => audio.playTick()}
              title="Editorial Alabaster (#F4F3EF / #111111)"
              aria-label="Editorial Alabaster theme swatch"
              className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all ${
                theme === 'alabaster'
                  ? 'ring-2 ring-accent ring-offset-1 ring-offset-obsidian scale-110'
                  : 'opacity-65 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: '#F4F3EF', border: '1px solid rgba(0,0,0,0.2)' }}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: '#111111' }} />
            </button>

            {/* Deep Forest Clay */}
            <button
              type="button"
              role="radio"
              aria-checked={theme === 'forest'}
              onClick={() => {
                setTheme('forest');
                audio.playTick();
              }}
              onMouseEnter={() => audio.playTick()}
              title="Deep Forest Clay (#141E19 / #81C995)"
              aria-label="Deep Forest Clay theme swatch"
              className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all ${
                theme === 'forest'
                  ? 'ring-2 ring-accent ring-offset-1 ring-offset-obsidian scale-110'
                  : 'opacity-65 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: '#141E19', border: '1px solid rgba(129,201,149,0.3)' }}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: '#81C995' }} />
            </button>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Action / Resume Quick Link */}
          <div className="hidden sm:flex items-center gap-1 pl-1">
            <Magnetic
              as="button"
              onClick={() => handleNavClick('#contact')}
              onMouseEnter={() => audio.playTick()}
              aria-label="Connect and jump to contact section"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent text-alabaster font-mono text-fluid-micro font-bold tracking-tight shadow-editorial-card hover:bg-accent-coral active:scale-95 transition-all duration-200"
            >
              <span>Connect</span>
              <ArrowUpRight className="w-3 h-3" />
            </Magnetic>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-alabaster hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-obsidian/95 backdrop-blur-2xl md:hidden flex flex-col justify-center px-6 transition-all duration-300 animate-in fade-in">
          <div className="w-full max-w-sm mx-auto flex flex-col gap-3 py-8">
            <div className="mb-4 text-center">
              <span className="font-mono text-fluid-micro uppercase tracking-widest text-accent-coral/80">Navigation Menu</span>
              <h2 className="font-display font-extrabold text-2xl text-alabaster mt-1">Explore FolioPort</h2>
            </div>

            {/* Mobile Sound Toggle Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
              <span className="font-mono text-xs text-alabaster">Procedural Web Audio</span>
              <button
                onClick={() => toggleSound()}
                aria-label={isSoundEnabled ? 'Mute procedural Web Audio' : 'Enable procedural Web Audio'}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  isSoundEnabled ? 'bg-accent text-white' : 'bg-white/10 text-muted'
                }`}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{isSoundEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Mobile Editorial Color Palette Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
              <span className="font-mono text-xs text-alabaster">Editorial Palette</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('obsidian')}
                  aria-label="Switch to Obsidian & Rust"
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    theme === 'obsidian' ? 'ring-2 ring-accent scale-110' : 'opacity-60'
                  }`}
                  style={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#A74024' }} />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('alabaster')}
                  aria-label="Switch to Editorial Alabaster"
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    theme === 'alabaster' ? 'ring-2 ring-accent scale-110' : 'opacity-60'
                  }`}
                  style={{ backgroundColor: '#F4F3EF', border: '1px solid rgba(0,0,0,0.3)' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#111111' }} />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('forest')}
                  aria-label="Switch to Deep Forest Clay"
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    theme === 'forest' ? 'ring-2 ring-accent scale-110' : 'opacity-60'
                  }`}
                  style={{ backgroundColor: '#141E19', border: '1px solid rgba(129,201,149,0.4)' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#81C995' }} />
                </button>
              </div>
            </div>

            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-label={`Navigate to ${item.label} section`}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  activeSection === item.id
                    ? 'bg-accent/15 border-accent/40 text-accent-coral shadow-editorial-card'
                    : 'bg-obsidian-card/80 border-white/10 text-alabaster hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={activeSection === item.id ? 'text-accent-coral' : 'text-muted'}>
                    {item.icon}
                  </span>
                  <span className="font-display font-semibold text-base">{item.label}</span>
                </div>
                <Compass className="w-4 h-4 text-muted" />
              </button>
            ))}

            <button
              onClick={() => handleNavClick('#contact')}
              aria-label="Initiate Transmission and jump to contact section"
              className="mt-4 flex items-center justify-center gap-2 p-3.5 rounded-xl bg-accent text-alabaster font-display font-bold text-sm tracking-wide shadow-editorial-card hover:bg-accent-coral transition-colors"
            >
              <span>Initiate Transmission / Contact</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
