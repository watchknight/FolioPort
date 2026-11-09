import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTheme } from '../context/ThemeContext';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { useLenis } from '../hooks/useLenis';
import { Magnetic } from './ui/Magnetic';
import { MagneticButton } from './ui/MagneticButton';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { GithubIcon, LinkedinIcon, TwitterIcon } from './ui/Icons';
import {
  Mail,
  Copy,
  Check,
  ArrowUpRight,
  ArrowUp,
  MapPin,
  Send,
  Download,
  Clock,
  Sparkles,
  FileText,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  Briefcase,
  GraduationCap,
  Code2,
  AlertCircle
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Helper to format live Dhaka (UTC+6) time
const getDhakaTime = (): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const dhaka = new Date(utc + 6 * 3600000);
    return dhaka.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }
};

interface VisitorTelemetry {
  time: string;
  timeZone: string;
  shortTz: string;
  diffSummary: string;
}

const getVisitorTime = (): VisitorTelemetry => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const now = new Date();
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(now);

    const parts = timeZone.split('/');
    const shortTz = parts[parts.length - 1].replace(/_/g, ' ');

    const visitorMinutes = -now.getTimezoneOffset();
    const dhakaMinutes = 6 * 60;
    const diffHours = (dhakaMinutes - visitorMinutes) / 60;
    const diffSummary =
      diffHours === 0
        ? 'Same Timezone'
        : diffHours > 0
        ? `Dhaka +${diffHours % 1 === 0 ? diffHours : diffHours.toFixed(1)}h ahead`
        : `Dhaka -${Math.abs(diffHours % 1 === 0 ? diffHours : Number(diffHours.toFixed(1)))}h behind`;

    return { time, timeZone, shortTz, diffSummary };
  } catch {
    return {
      time: new Date().toLocaleTimeString(),
      timeZone: 'Visitor Local',
      shortTz: 'Visitor',
      diffSummary: 'Synchronized',
    };
  }
};

export const ContactFooter: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { scrollTo } = useLenis();

  // Local Dhaka Time Clock (UTC+6) in JetBrains Mono, initialized immediately to prevent layout shift
  const [dhakaTime, setDhakaTime] = useState<string>(getDhakaTime);
  // Visitor Local Time comparison
  const [visitorInfo, setVisitorInfo] = useState<VisitorTelemetry>(getVisitorTime);

  // Email copy state & Toast confirmation
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  // Resume Modal state
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

  // Contact form state & validation
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formErrors, setFormErrors] = useState<{ email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);
  const [isPrefillGlow, setIsPrefillGlow] = useState(false);

  // Refs
  const sectionRef = useRef<HTMLElement | null>(null);
  const footerInnerRef = useRef<HTMLDivElement | null>(null);
  const dispatchCardRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const glowTimerRef = useRef<number | null>(null);
  const modalCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const credentialsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  // 1. Live Dhaka (UTC+6) & Visitor Local clock updating every second in JetBrains Mono
  useEffect(() => {
    const updateClocks = () => {
      setDhakaTime(getDhakaTime());
      setVisitorInfo(getVisitorTime());
    };

    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Listen for terminal prefill-contact triggers (e.g. from 'sudo hire moayed')
  useEffect(() => {
    const handlePrefill = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const msg =
        customEvent.detail?.message ||
        "Hi Abdur Rahman Moayed, I executed 'sudo hire moayed' in your Systems & Terminal Lab! I'm impressed by your low-level systems & full-stack work and would love to discuss an engineering role with our team.";
      setFormData((prev) => ({ ...prev, message: msg }));
      setFormErrors({});
      setIsPrefillGlow(true);

      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
      if (glowTimerRef.current) window.clearTimeout(glowTimerRef.current);

      // On mobile/tablet where columns stack vertically, scroll down to the dispatch card so prefilled text is in view
      focusTimerRef.current = window.setTimeout(() => {
        messageInputRef.current?.focus({ preventScroll: true });
        if (window.innerWidth < 1024 && dispatchCardRef.current) {
          scrollTo(dispatchCardRef.current, { offset: -90, duration: 1.0 });
        }
      }, 750);

      glowTimerRef.current = window.setTimeout(() => {
        setIsPrefillGlow(false);
      }, 4500);
    };

    window.addEventListener('prefill-contact', handlePrefill);
    return () => {
      window.removeEventListener('prefill-contact', handlePrefill);
      if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
      if (glowTimerRef.current) window.clearTimeout(glowTimerRef.current);
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, [scrollTo]);

  // 3. Fixed-Reveal Parallax Pattern & GSAP Stagger Reveal with matchMedia prefers-reduced-motion resilience
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // ScrollTrigger uncover tween from yPercent: -30 to 0 tucked beneath main content wrapper
      if (footerInnerRef.current && sectionRef.current) {
        gsap.fromTo(
          footerInnerRef.current,
          { yPercent: -30 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom bottom',
              scrub: true,
            },
          }
        );
      }

      // Staggered character reveal on giant full-width "LET'S BUILD SOMETHING ICONIC"
      const chars = sectionRef.current?.querySelectorAll('.iconic-char');
      if (chars && chars.length > 0) {
        gsap.fromTo(
          chars,
          { autoAlpha: 0, y: 55, rotateX: -55, force3D: true },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.02,
            duration: 0.85,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      gsap.fromTo(
        '.footer-anim',
        { autoAlpha: 0, y: 30, force3D: true },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
          },
        }
      );
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('.footer-anim', { autoAlpha: 1, y: 0 });
      if (footerInnerRef.current) gsap.set(footerInnerRef.current, { yPercent: 0 });
      gsap.set('.iconic-char', { autoAlpha: 1, y: 0, rotateX: 0 });
    });

    return () => mm.revert();
  }, []);

  // 4. One-Click Copy Email Magnetic Button with Instant Toast Confirmation
  const handleCopyEmail = async () => {
    chiptuneAudio.playCoinSFX();
    const emailToCopy = PORTFOLIO_DATA.meta.email;
    let copiedSuccess = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(emailToCopy);
        copiedSuccess = true;
      }
    } catch {
      // Fallback below
    }

    if (!copiedSuccess) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = emailToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copiedSuccess = true;
      } catch (err) {
        console.warn('Clipboard copy fallback failed:', err);
      }
    }

    setCopied(true);
    setShowToast(true);

    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      setCopied(false);
    }, 3200);
  };

  // 5. Handle Form Submit with Accessible Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; message?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Electronic mail coordinates are required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid electronic mail address.';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Dispatch payload/message cannot be empty.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    chiptuneAudio.playPowerUpSFX();
    setFormErrors({});
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4500);
  };

  // 6. Accessible Modal Management: Scroll Locking, Tab Trapping, and Focus Restoration
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const openResumeModal = () => {
    triggerElementRef.current = (document.activeElement as HTMLElement) || credentialsTriggerRef.current;
    setResumeModalOpen(true);
  };

  const closeResumeModal = useCallback(() => {
    setResumeModalOpen(false);
    const target = credentialsTriggerRef.current || triggerElementRef.current || document.querySelector<HTMLElement>('button[aria-label="View interactive credentials modal"]');
    if (target) {
      target.focus();
    }
    setTimeout(() => {
      target?.focus();
    }, 50);
  }, []);

  useEffect(() => {
    if (!resumeModalOpen) return;

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button initially
    const timer = setTimeout(() => {
      modalCloseBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeResumeModal();
        return;
      }

      // Tab trap
      if (e.key === 'Tab' && modalContentRef.current) {
        const focusableElements = modalContentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        const target = credentialsTriggerRef.current || triggerElementRef.current || document.querySelector<HTMLElement>('button[aria-label="View interactive credentials modal"]');
        target?.focus();
      }, 50);
    };
  }, [resumeModalOpen, closeResumeModal]);

  return (
    <>
      <section
        ref={sectionRef}
        id="contact"
        className="relative z-[1] min-h-[85vh] lg:min-h-[90vh] pt-28 sm:pt-36 md:pt-40 pb-16 md:pb-20 bg-obsidian-darker/95 overflow-hidden border-t border-white/10"
        style={{
          backgroundColor: 'var(--crt-void-bg, #070814)',
          color: 'var(--pixel-ivory-text, #F0EFE6)',
        }}
        aria-label="Contact and conversion footer"
      >
        <div ref={footerInnerRef} className="w-full h-full">
        {/* Ambient background glow accents */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-accent/10 to-transparent blur-[120px] rounded-full"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 right-10 w-[450px] h-[250px] bg-gradient-to-t from-accent/5 to-transparent blur-[100px] rounded-full"
          aria-hidden="true"
        />

        {/* =========================================================================
            FLOATING TOAST NOTIFICATION: Instant confirmation for recruiters
            Eliminates mailto friction with zero reliance on local mail clients
           ========================================================================= */}
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 max-w-[calc(100vw-2rem)] sm:max-w-md z-50 transition-all duration-300 transform ${
            showToast
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0D1512] border-2 border-[#4AF626] shadow-[2px_2px_0_0_#070814] text-[#F0EFE6]">
            <div className="w-8 h-8 bg-[#131629] border border-[#4AF626] flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-[#4AF626]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-pixel text-[10px] text-[#4AF626] tracking-wider uppercase">
                [ COPIED TO CLIPBOARD // ACK ]
              </div>
              <div className="font-mono text-fluid-micro text-[#D6CFC2] break-all leading-tight mt-0.5">
                {PORTFOLIO_DATA.meta.email} • Ready to paste
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="ml-2 w-6 h-6 bg-[#131629] border border-[#2D3645] hover:border-[#FF2A85] text-[#D6CFC2] hover:text-[#FF2A85] font-pixel text-[9px] flex items-center justify-center transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">

          {/* =========================================================================
              90s CYBERDECK SATELLITE UPLINK CONSOLE HARDWARE TITLEBAR & STATUS BADGES
             ========================================================================= */}
          <div className="footer-anim w-full mb-8 border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#131629] shadow-[2px_2px_0_0_#070814]">
            <div className="flex items-center justify-between px-3 py-2 bg-[#D6CFC2] text-[#070814] font-bold text-xs select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#4AF626] border border-[#070814] inline-block animate-pulse" />
                <span className="font-pixel text-[10px] sm:text-[11px] uppercase tracking-wider">
                  [ SYS.96 // SATELLITE UPLINK CONSOLE // STATION DHAKA ]
                </span>
              </div>
              <div className="flex items-center gap-1 font-pixel text-[9px]">
                <span className="px-1.5 py-0.5 bg-[#070814] text-[#00F0FF] border border-[#2D3645]">
                  GEO-SYNC: 23.7644° N, 90.4252° E
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#070814] text-[#4AF626] border border-[#2D3645]">
                  CARRIER: LOCKED
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <span className="w-3.5 h-3.5 bg-[#070814] text-[#D6CFC2] flex items-center justify-center border border-[#2D3645] cursor-pointer hover:bg-white/10">-</span>
                  <span className="w-3.5 h-3.5 bg-[#070814] text-[#D6CFC2] flex items-center justify-center border border-[#2D3645] cursor-pointer hover:bg-white/10">+</span>
                  <span className="w-3.5 h-3.5 bg-[#070814] text-[#FF2A85] flex items-center justify-center border border-[#2D3645] cursor-pointer hover:bg-white/10">x</span>
                </div>
              </div>
            </div>

            {/* Pixel-art status badges */}
            <div className="px-3 sm:px-4 py-2.5 bg-[#0D1512] border-t-2 border-[#2D3645] flex flex-wrap items-center justify-between gap-2 text-[10px] font-pixel select-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 bg-[#131629] border border-[#4AF626] text-[#4AF626] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#4AF626] animate-pulse" />
                  <span>[ 🛰️ UPLINK: READY ]</span>
                </span>
                <span className="px-2 py-1 bg-[#131629] border border-[#00F0FF] text-[#00F0FF]">
                  [ 📡 FREQ: 142.850 MHz ]
                </span>
                <span className="px-2 py-1 bg-[#131629] border border-[#FFCC00] text-[#FFCC00]">
                  [ 🔒 ENCRYPTION: 128-BIT POSIX ]
                </span>
                <span className="hidden md:inline-flex px-2 py-1 bg-[#131629] border border-[#2D3645] text-[#D6CFC2]">
                  [ 🌐 ORBIT: GEO-SYNC // DHAKA ]
                </span>
                <span className="hidden lg:inline-flex px-2 py-1 bg-[#131629] border border-[#2D3645] text-[#4AF626]">
                  [ ⚡ PACKET LOSS: 0.0% ]
                </span>
                <span className="hidden xl:inline-flex px-2 py-1 bg-[#131629] border border-[#2D3645] text-[#00F0FF]">
                  [ 📶 SIGNAL: 99.8% ]
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                <span className="text-[#FFCC00] font-bold">UTC+6 TELEMETRY</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              THEATRICAL GIANT FULL-WIDTH CALL-TO-ACTION WITH STAGGERED CHARACTERS
             ========================================================================= */}
          <div 
            className="footer-anim mb-8 sm:mb-12 text-center max-w-6xl mx-auto overflow-visible select-none pt-8"
            style={{ overflow: 'visible', paddingTop: '2rem' }}
          >
            <div className="font-mono text-fluid-micro text-[#FF2A85] uppercase tracking-widest mb-3">
              THEATRICAL FINALE // AWWWARDS CAPSTONE
            </div>
            <h2
              className={`font-display uppercase ${isLight ? 'text-[#11131A]' : 'text-transparent bg-clip-text bg-gradient-to-b from-white via-alabaster to-white/40'} flex flex-wrap justify-center gap-x-2 sm:gap-x-4 md:gap-x-6 py-2`}
              style={{
                fontFamily: "'Space Grotesk', 'Syne', sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.035em',
                fontSize: 'clamp(1.85rem, 4vw, 3.25rem)',
                lineHeight: 1.05,
                overflow: 'visible',
              }}
              aria-label="LET'S BUILD SOMETHING ICONIC"
            >
              {["LET'S", "BUILD", "SOMETHING", "ICONIC"].map((word, wIdx) => (
                <span key={wIdx} className="inline-flex overflow-visible">
                  {word.split('').map((char, cIdx) => (
                    <span
                      key={cIdx}
                      className="iconic-char inline-block transform-gpu"
                    >
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </h2>
          </div>

          {/* Availability Status Ribbon */}
          <div className="footer-anim mb-10 flex justify-center">
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 ${isLight ? 'bg-white border-2 border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#131629] border-2 border-[#2D3645] shadow-[2px_2px_0_0_#070814]'} backdrop-blur-xl`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLight ? 'bg-[#007A33]' : 'bg-[#4AF626]'} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLight ? 'bg-[#007A33]' : 'bg-[#4AF626]'}`} />
              </span>
              <span className={`font-mono text-fluid-xs ${isLight ? 'text-[#11131A]' : 'text-[#F0EFE6]'} font-medium`}>
                Available for Systems &amp; Full-Stack Engineering Roles
              </span>
              <span className={`${isLight ? 'text-[#1A1D24]/30' : 'text-white/20'} hidden sm:inline`}>•</span>
              <span className={`font-mono text-fluid-xs ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} hidden sm:inline font-semibold`}>
                Dhaka, BD (UTC+6)
              </span>
            </div>
          </div>

          {/* =========================================================================
              ZERO-FRICTION CONVERSION HERO CALLOUT
             ========================================================================= */}
          <div className="footer-anim text-center max-w-4xl mx-auto mb-16 space-y-6">
            <div className={`font-pixel text-[10px] ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} tracking-widest uppercase mb-1`}>
              &gt; SYS.96 // SATELLITE_UPLINK_INITIALIZED // TRANSCEIVER_ONLINE
            </div>
            <h2 
              className={`tracking-tight ${isLight ? 'text-[#11131A]' : 'text-white'} uppercase leading-snug break-normal hyphens-none`}
              style={{
                fontFamily: "'Space Grotesk', 'Syne', sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.035em',
                fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)',
                lineHeight: 1.1,
              }}
            >
              <span className="block">
                Ready to build something
              </span>
              <span className="block text-[#FF2A85] pt-1">
                unforgettable?
              </span>
            </h2>

            <p className="font-body text-fluid-lead text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Whether architecting deterministic POSIX systems in C/Linux, orchestrating real-time cloud data pipelines, or designing 120 FPS web platforms — let’s engineer something exceptional together.
            </p>

            {/* HIGH-CONVERSION PRIMARY ACTION ROW */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              
              {/* One-Click Magnetic Copy Email Button (Triggers playCoinSFX) */}
              <MagneticButton
                onClick={handleCopyEmail}
                onMouseEnter={() => chiptuneAudio.playPixelTick()}
                strength={0.35}
                innerStrength={0.2}
                className="group px-7 py-4 bg-[#FF2A85] hover:bg-[#00F0FF] hover:text-[#070814] text-[#F0EFE6] font-pixel text-xs tracking-wider uppercase border-2 border-white shadow-[2px_2px_0_0_#070814] active:translate-y-0.5 transition-all"
                aria-label={`Copy email address ${PORTFOLIO_DATA.meta.email} to clipboard`}
              >
                <span className="flex items-center gap-2.5">
                  {copied ? (
                    <Check className="w-5 h-5 text-current animate-bounce" />
                  ) : (
                    <Copy className="w-5 h-5 text-current transition-transform group-hover:scale-110" />
                  )}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Address'}</span>
                  <span className="font-pixel text-[9px] px-2 py-0.5 bg-black/40 border border-white/20 hidden sm:inline">
                    {PORTFOLIO_DATA.meta.email}
                  </span>
                </span>
              </MagneticButton>

              {/* Download / View Resume CTA */}
              <div className="flex items-center gap-2">
                <Magnetic>
                  <a
                    href="/resume.pdf"
                    download="Abdur_Rahman_Moayed_Resume.pdf"
                    onClick={() => chiptuneAudio.playCoinSFX()}
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    className="px-6 py-4 bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] hover:border-[#FFCC00] text-[#F0EFE6] font-pixel text-xs flex items-center gap-2 transition-all shadow-[2px_2px_0_0_#070814] active:translate-y-0.5"
                    aria-label="Download Abdur Rahman Moayed's Resume PDF"
                  >
                    <Download className="w-4 h-4 text-[#FFCC00]" />
                    <span>Resume (PDF)</span>
                  </a>
                </Magnetic>

                <Magnetic>
                  <button
                    ref={credentialsTriggerRef}
                    type="button"
                    onClick={() => {
                      chiptuneAudio.playPixelTick();
                      openResumeModal();
                    }}
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    className="px-4 py-4 bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#D6CFC2] hover:text-[#00F0FF] font-pixel text-[10px] flex items-center gap-1.5 transition-all shadow-[2px_2px_0_0_#070814]"
                    title="View Curated Credentials Modal"
                    aria-label="View interactive credentials modal"
                  >
                    <FileText className="w-4 h-4 text-[#00F0FF]" />
                    <span className="hidden md:inline">Credentials</span>
                  </button>
                </Magnetic>
              </div>

            </div>

            {/* Direct mail client fallback note */}
            <div className="text-center font-mono text-fluid-micro text-slate-500 pt-1">
              Broken mail client? Just click above to copy directly, or{' '}
              <a
                href={`mailto:${PORTFOLIO_DATA.meta.email}`}
                className="text-[#00F0FF] hover:underline font-medium"
              >
                open native mailto:
              </a>
            </div>

          </div>

          {/* =========================================================================
              LIVE LOCAL TIME VS. VISITOR TIME COMPARISON & OPERATIONAL TELEMETRY
             ========================================================================= */}
          <div className="footer-anim mb-14 max-w-5xl mx-auto">
            <div className="border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#131629] shadow-[2px_2px_0_0_#070814] overflow-hidden">
              {/* Retro OSD Titlebar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#D6CFC2] text-[#070814] font-bold text-xs select-none">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#4AF626] animate-pulse inline-block" />
                  <span className="font-pixel text-[9px] uppercase tracking-wider">
                    SYS.96 // SATELLITE_TELEMETRY_CHRONOMETER
                  </span>
                </div>
                <div className="flex items-center gap-1 font-pixel text-[8px]">
                  <span className="w-3.5 h-3.5 bg-[#070814] text-[#D6CFC2] flex items-center justify-center border border-[#2D3645] cursor-pointer hover:bg-white/10">-</span>
                  <span className="w-3.5 h-3.5 bg-[#070814] text-[#D6CFC2] flex items-center justify-center border border-[#2D3645] cursor-pointer hover:bg-white/10">+</span>
                  <span className="w-3.5 h-3.5 bg-[#070814] text-[#FF2A85] flex items-center justify-center border border-[#2D3645] cursor-pointer hover:bg-white/10">x</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Clocks Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                  {/* Dhaka Time */}
                  <div className="flex items-center gap-3 p-3.5 bg-[#0D1512] border-2 border-[#2D3645]">
                    <div className="w-10 h-10 bg-[#131629] border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#00F0FF]" />
                    </div>
                    <div>
                      <div className="font-pixel text-[8px] text-[#8E98AA] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <span>GROUND STATION: DHAKA, BD</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-none bg-[#4AF626] animate-ping" />
                      </div>
                      <div className="font-mono font-bold text-lg sm:text-xl text-white tracking-wider flex items-center gap-2">
                        <span id="dhaka-clock" aria-label="Local operational time in Dhaka, Bangladesh" className="text-[#00F0FF]">
                          {dhakaTime || 'Loading UTC+6...'}
                        </span>
                        <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-[#131629] border border-[#2D3645] text-[#FFCC00] font-normal">
                          UTC+6
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visitor Local Time */}
                  <div className="flex items-center gap-3 p-3.5 bg-[#0D1512] border-2 border-[#2D3645]">
                    <div className="w-10 h-10 bg-[#131629] border border-[#FFCC00]/40 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-[#FFCC00]" />
                    </div>
                    <div>
                      <div className="font-pixel text-[8px] text-[#8E98AA] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <span>TRANSCEIVER: {visitorInfo.shortTz || 'LOCAL'}</span>
                        <span className="inline-block w-1.5 h-1.5 rounded-none bg-[#00F0FF] animate-pulse" />
                      </div>
                      <div className="font-mono font-bold text-lg sm:text-xl text-white tracking-wider flex items-center gap-2">
                        <span id="visitor-clock" aria-label="Visitor local time" className="text-[#FFCC00]">
                          {visitorInfo.time || 'Local Sync...'}
                        </span>
                        <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-[#131629] border border-[#2D3645] text-[#00F0FF] font-normal">
                          {visitorInfo.diffSummary}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Global Overlap & SLA Telemetry */}
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 text-[10px] font-pixel text-[#8E98AA]">
                  <span className="px-3 py-2 bg-[#0D1512] border border-[#2D3645] text-[#4AF626] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-none bg-[#4AF626] animate-pulse" />
                    <span>SLA: &lt; 24H</span>
                  </span>
                  <span className="px-3 py-2 bg-[#0D1512] border border-[#2D3645] text-[#D6CFC2]">
                    GLOBAL UTC OVERLAP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              TWO-COLUMN DISPATCH & COORDINATES GRID (90s CYBERDECK MODULES)
             ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            
            {/* Left Column: Direct Coordinates Card */}
            <div className="footer-anim lg:col-span-5 space-y-6">
              <div className={`border-2 ${isLight ? 'border-[#1A1D24] bg-white shadow-[2px_2px_0_0_#C8C1B4]' : 'border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#131629] shadow-[2px_2px_0_0_#070814]'} overflow-hidden`}>
                {/* Titlebar */}
                <div className={`flex items-center justify-between px-3 py-1.5 ${isLight ? 'bg-[#D8D2C5] text-[#11131A] border-b border-[#1A1D24]/20' : 'bg-[#D6CFC2] text-[#070814]'} font-bold text-xs select-none`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${isLight ? 'bg-[#0052FF]' : 'bg-[#00F0FF]'} inline-block`} />
                    <span className="font-pixel text-[9px] uppercase tracking-wider">
                      DHAKA_HQ // SATELLITE_COORDINATES
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-pixel text-[8px]">
                    <span className={`w-3.5 h-3.5 ${isLight ? 'bg-white text-[#11131A] border border-[#1A1D24]/30' : 'bg-[#070814] text-[#D6CFC2] border border-[#2D3645]'} flex items-center justify-center cursor-pointer hover:bg-white/10`}>-</span>
                    <span className={`w-3.5 h-3.5 ${isLight ? 'bg-white text-[#11131A] border border-[#1A1D24]/30' : 'bg-[#070814] text-[#D6CFC2] border border-[#2D3645]'} flex items-center justify-center cursor-pointer hover:bg-white/10`}>+</span>
                    <span className={`w-3.5 h-3.5 ${isLight ? 'bg-[#D90452] text-white border border-[#D90452]' : 'bg-[#070814] text-[#FF2A85] border border-[#2D3645]'} flex items-center justify-center cursor-pointer hover:bg-white/10`}>x</span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className={`flex items-center gap-2 mb-2 font-pixel text-[9px] ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} uppercase tracking-wider`}>
                    <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`} />
                    <span>Direct Coordinates</span>
                  </div>

                  <h3 className={`font-display font-bold text-base sm:text-lg ${isLight ? 'text-[#11131A]' : 'text-white'} mb-2`}>
                    Dhaka Headquarters
                  </h3>

                  <p className={`font-mono text-fluid-sm ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} mb-6 leading-relaxed`}>
                    Undergraduate in Computer Science &amp; Engineering at East West University, Dhaka. 
                    Synchronized with global distributed engineering teams across APAC, EMEA, and North America.
                  </p>

                  <div className="space-y-3.5">
                    {/* Email row with quick copy */}
                    <div className={`p-3.5 ${isLight ? 'bg-[#F2EFE9] border-[#1A1D24]/20' : 'bg-[#0D1512] border-[#2D3645]'} border-2 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${isLight ? 'bg-white border-[#0052FF]/40' : 'bg-[#131629] border-[#00F0FF]/40'} flex items-center justify-center`}>
                          <Mail className={`w-4 h-4 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`} />
                        </div>
                        <div>
                          <div className={`font-pixel text-[8px] ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} uppercase`}>Primary Channel</div>
                          <div className={`font-mono text-fluid-sm ${isLight ? 'text-[#11131A]' : 'text-white'} font-medium select-all`}>
                            {PORTFOLIO_DATA.meta.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        onMouseEnter={() => chiptuneAudio.playPixelTick()}
                        className={`p-2 ${isLight ? 'bg-white hover:bg-[#0052FF]/10 text-[#11131A] hover:text-[#0052FF] border-[#1A1D24]/30' : 'bg-[#131629] hover:bg-[#00F0FF]/20 text-[#D6CFC2] hover:text-[#00F0FF] border-[#2D3645]'} border transition-colors`}
                        title="Copy Email"
                        aria-label="Copy primary email"
                      >
                        {copied ? <Check className={`w-4 h-4 ${isLight ? 'text-[#007A33]' : 'text-[#4AF626]'}`} /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Academic Anchor & Coordinates */}
                    <div className={`p-3.5 ${isLight ? 'bg-[#F2EFE9] border-[#1A1D24]/20' : 'bg-[#0D1512] border-[#2D3645]'} border-2 flex items-center gap-3`}>
                      <div className={`w-8 h-8 ${isLight ? 'bg-white border-[#C85A00]/40' : 'bg-[#131629] border-[#FFCC00]/40'} flex items-center justify-center`}>
                        <GraduationCap className={`w-4 h-4 ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`} />
                      </div>
                      <div>
                        <div className={`font-pixel text-[8px] ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} uppercase`}>Academic Anchor</div>
                        <div className={`font-mono text-fluid-sm ${isLight ? 'text-[#11131A]' : 'text-white'} font-medium`}>
                          East West University — Dhaka, BD
                        </div>
                        <div className={`font-mono text-fluid-micro ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} flex items-center gap-1`}>
                          <MapPin className={`w-3 h-3 ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]/80'}`} />
                          <span>23.7644° N, 90.4252° E • CSE Department</span>
                        </div>
                      </div>
                    </div>

                    {/* Systems Specialism */}
                    <div className={`p-3.5 ${isLight ? 'bg-[#F2EFE9] border-[#1A1D24]/20' : 'bg-[#0D1512] border-[#2D3645]'} border-2 flex items-center gap-3`}>
                      <div className={`w-8 h-8 ${isLight ? 'bg-white border-[#007A33]/40' : 'bg-[#131629] border-[#4AF626]/40'} flex items-center justify-center`}>
                        <Code2 className={`w-4 h-4 ${isLight ? 'text-[#007A33]' : 'text-[#4AF626]'}`} />
                      </div>
                      <div>
                        <div className={`font-pixel text-[8px] ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} uppercase`}>Core Engineering Specialisms</div>
                        <div className={`font-mono text-fluid-sm ${isLight ? 'text-[#11131A]' : 'text-slate-200'}`}>
                          C/C++, POSIX IPC, Linux Syscalls, React 18 &amp; GSAP
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Direct Profiles & Verified Links */}
                  <div className={`mt-8 pt-6 border-t ${isLight ? 'border-[#1A1D24]/20' : 'border-[#2D3645]'}`}>
                    <div className={`font-pixel text-[8px] ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} uppercase tracking-widest mb-3`}>
                      Verified Profiles &amp; Commits
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* GitHub */}
                      <Magnetic>
                        <a
                          href={PORTFOLIO_DATA.meta.github}
                          target="_blank"
                          rel="noreferrer"
                          onMouseEnter={() => chiptuneAudio.playPixelTick()}
                          onClick={() => chiptuneAudio.playCoinSFX()}
                          className={`flex items-center gap-2 px-3.5 py-2 ${isLight ? 'bg-[#F2EFE9] hover:bg-[#EAE5DB] border-2 border-[#1A1D24]/30 text-[#11131A] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] text-[#F0EFE6] shadow-[2px_2px_0_0_#070814]'} hover:border-[#0052FF] transition-all font-pixel text-[10px] group`}
                          aria-label="View Abdur Rahman Moayed's GitHub profile (@watchknight)"
                        >
                          <GithubIcon className={`w-3.5 h-3.5 ${isLight ? 'text-[#11131A] group-hover:text-[#0052FF]' : 'text-slate-300 group-hover:text-[#00F0FF]'} transition-colors`} />
                          <span>GitHub</span>
                          <ArrowUpRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#3F4654] group-hover:text-[#0052FF]' : 'text-slate-400 group-hover:text-[#00F0FF]'} transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
                        </a>
                      </Magnetic>

                      {/* LinkedIn */}
                      <Magnetic>
                        <a
                          href={PORTFOLIO_DATA.meta.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          onMouseEnter={() => chiptuneAudio.playPixelTick()}
                          onClick={() => chiptuneAudio.playCoinSFX()}
                          className={`flex items-center gap-2 px-3.5 py-2 ${isLight ? 'bg-[#F2EFE9] hover:bg-[#EAE5DB] border-2 border-[#1A1D24]/30 text-[#11131A] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] text-[#F0EFE6] shadow-[2px_2px_0_0_#070814]'} hover:border-[#C85A00] transition-all font-pixel text-[10px] group`}
                          aria-label="View Abdur Rahman Moayed's LinkedIn profile"
                        >
                          <LinkedinIcon className={`w-3.5 h-3.5 ${isLight ? 'text-[#11131A] group-hover:text-[#C85A00]' : 'text-slate-300 group-hover:text-[#FFCC00]'} transition-colors`} />
                          <span>LinkedIn</span>
                          <ArrowUpRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#3F4654] group-hover:text-[#C85A00]' : 'text-slate-400 group-hover:text-[#FFCC00]'} transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
                        </a>
                      </Magnetic>

                      {/* Twitter/X */}
                      <Magnetic>
                        <a
                          href={PORTFOLIO_DATA.meta.twitter}
                          target="_blank"
                          rel="noreferrer"
                          onMouseEnter={() => chiptuneAudio.playPixelTick()}
                          onClick={() => chiptuneAudio.playCoinSFX()}
                          className={`flex items-center gap-2 px-3.5 py-2 ${isLight ? 'bg-[#F2EFE9] hover:bg-[#EAE5DB] border-2 border-[#1A1D24]/30 text-[#11131A] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] text-[#F0EFE6] shadow-[2px_2px_0_0_#070814]'} hover:border-[#D90452] transition-all font-pixel text-[10px] group`}
                          aria-label="View Abdur Rahman Moayed's Twitter / X profile"
                        >
                          <TwitterIcon className={`w-3.5 h-3.5 ${isLight ? 'text-[#11131A] group-hover:text-[#D90452]' : 'text-slate-300 group-hover:text-[#FF2A85]'} transition-colors`} />
                          <span>Twitter / X</span>
                          <ArrowUpRight className={`w-3.5 h-3.5 ${isLight ? 'text-[#3F4654] group-hover:text-[#D90452]' : 'text-slate-400 group-hover:text-[#FF2A85]'} transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
                        </a>
                      </Magnetic>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Send Direct Dispatch Form */}
            <div ref={dispatchCardRef} id="dispatch-form-card" className="footer-anim lg:col-span-7">
              <div className={`border-2 ${isLight ? 'border-[#1A1D24] bg-white shadow-[2px_2px_0_0_#C8C1B4]' : 'border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#131629] shadow-[2px_2px_0_0_#070814]'} overflow-hidden`}>
                {/* Titlebar */}
                <div className={`flex items-center justify-between px-3 py-1.5 ${isLight ? 'bg-[#D8D2C5] text-[#11131A] border-b border-[#1A1D24]/20' : 'bg-[#D6CFC2] text-[#070814]'} font-bold text-xs select-none`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${isLight ? 'bg-[#D90452]' : 'bg-[#FF2A85]'} inline-block animate-pulse`} />
                    <span className="font-pixel text-[9px] uppercase tracking-wider">
                      DISPATCH_UPLINK // PACKET_BUFFER
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-pixel text-[8px]">
                    <span className={`w-3.5 h-3.5 ${isLight ? 'bg-white text-[#11131A] border border-[#1A1D24]/30' : 'bg-[#070814] text-[#D6CFC2] border border-[#2D3645]'} flex items-center justify-center cursor-pointer hover:bg-white/10`}>-</span>
                    <span className={`w-3.5 h-3.5 ${isLight ? 'bg-white text-[#11131A] border border-[#1A1D24]/30' : 'bg-[#070814] text-[#D6CFC2] border border-[#2D3645]'} flex items-center justify-center cursor-pointer hover:bg-white/10`}>+</span>
                    <span className={`w-3.5 h-3.5 ${isLight ? 'bg-[#D90452] text-white border border-[#D90452]' : 'bg-[#070814] text-[#FF2A85] border border-[#2D3645]'} flex items-center justify-center cursor-pointer hover:bg-white/10`}>x</span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className={`flex items-center gap-2 mb-2 font-pixel text-[9px] ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'} uppercase tracking-wider`}>
                    <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`} />
                    <span>Encrypted Satellite Channel</span>
                  </div>

                  <h3 className={`font-display font-bold text-base sm:text-lg ${isLight ? 'text-[#11131A]' : 'text-white'} mb-2`}>
                    Send Direct Dispatch
                  </h3>

                  <p className={`font-mono text-fluid-sm ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} mb-6 leading-relaxed`}>
                    Transmit an engineering proposal, role inquiry, or architectural collaboration payload directly to my inbox.
                  </p>

                  {sent ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className={`p-8 ${isLight ? 'bg-[#F2EFE9] border-[#007A33]' : 'bg-[#0D1512] border-[#4AF626]'} border-2 text-center space-y-3 animate-in fade-in shadow-[0_0_15px_rgba(74,246,38,0.2)]`}
                    >
                      <div className={`w-12 h-12 ${isLight ? 'bg-white border-[#007A33]/40 text-[#007A33]' : 'bg-[#131629] border-[#4AF626]/40 text-[#4AF626]'} border flex items-center justify-center mx-auto`}>
                        <Check className="w-6 h-6" />
                      </div>
                      <div className={`font-pixel font-bold text-sm sm:text-base ${isLight ? 'text-[#11131A]' : 'text-white'}`}>
                        [ TRANSMISSION PACKET QUEUED // ACK RECEIVED ]
                      </div>
                      <p className={`font-mono text-fluid-sm ${isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'} max-w-md mx-auto`}>
                        Thank you. Your message packet has been routed to Abdur Rahman Moayed.
                        Guaranteed response within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <div>
                        <label
                          htmlFor="dispatch-name"
                          className={`block font-pixel text-[9px] ${isLight ? 'text-[#3F4654]' : 'text-slate-300'} uppercase tracking-wider mb-1.5`}
                        >
                          Your Name / Organization
                        </label>
                        <input
                          id="dispatch-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                          }}
                          onKeyDown={() => chiptuneAudio.playNoiseTap()}
                          placeholder="e.g. Satoshi Nakamoto / DeepMind Systems"
                          className={`w-full px-4 py-3 ${isLight ? 'bg-white border-2 border-[#1A1D24]/30 text-[#11131A] placeholder:text-[#3F4654]/60 focus:border-[#0052FF]' : 'bg-[#0D1512] border-2 border-[#2D3645] text-[#F0EFE6] placeholder:text-[#8E98AA] focus:border-[#00F0FF]'} focus:outline-none transition-colors font-mono text-xs`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="dispatch-email"
                          className={`block font-pixel text-[9px] ${isLight ? 'text-[#3F4654]' : 'text-slate-300'} uppercase tracking-wider mb-1.5`}
                        >
                          Electronic Mail Coordinates <span className={`${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`}>*</span>
                        </label>
                        <input
                          id="dispatch-email"
                          type="email"
                          required
                          aria-required="true"
                          aria-invalid={!!formErrors.email}
                          aria-describedby={formErrors.email ? 'dispatch-email-error' : undefined}
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                          }}
                          onKeyDown={() => chiptuneAudio.playNoiseTap()}
                          placeholder="recruiter@engineering.com"
                          className={`w-full px-4 py-3 ${isLight ? 'bg-white text-[#11131A] placeholder:text-[#3F4654]/60' : 'bg-[#0D1512] text-[#F0EFE6] placeholder:text-[#8E98AA]'} border-2 focus:outline-none transition-colors font-mono text-xs ${
                            formErrors.email
                              ? 'border-rose-500/80 focus:border-rose-400'
                              : isLight ? 'border-[#1A1D24]/30 focus:border-[#0052FF]' : 'border-[#2D3645] focus:border-[#00F0FF]'
                          }`}
                        />
                        {formErrors.email && (
                          <div id="dispatch-email-error" role="alert" className="flex items-center gap-1.5 mt-1 text-rose-400 font-mono text-fluid-micro">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.email}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="dispatch-message"
                            className={`font-pixel text-[9px] ${isLight ? 'text-[#3F4654]' : 'text-slate-300'} uppercase tracking-wider`}
                          >
                            Dispatch Payload / Message <span className={`${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`}>*</span>
                          </label>
                          {isPrefillGlow && (
                            <span className={`font-pixel text-[8px] ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} animate-pulse font-semibold`}>
                              ⚡ Auto-populated by terminal
                            </span>
                          )}
                        </div>
                        <textarea
                          id="dispatch-message"
                          ref={messageInputRef}
                          required
                          aria-required="true"
                          aria-invalid={!!formErrors.message}
                          aria-describedby={formErrors.message ? 'dispatch-message-error' : undefined}
                          rows={4}
                          value={formData.message}
                          onChange={(e) => {
                            setFormData({ ...formData, message: e.target.value });
                            if (formErrors.message) setFormErrors({ ...formErrors, message: undefined });
                          }}
                          onKeyDown={() => chiptuneAudio.playNoiseTap()}
                          placeholder="Outline project parameters, systems requirements, or role details..."
                          className={`w-full px-4 py-3 ${isLight ? 'bg-white text-[#11131A] placeholder:text-[#3F4654]/60' : 'bg-[#0D1512] text-[#F0EFE6] placeholder:text-[#8E98AA]'} border-2 focus:outline-none transition-all duration-300 font-mono text-xs resize-none ${
                            formErrors.message
                              ? 'border-rose-500/80 focus:border-rose-400'
                              : isPrefillGlow
                              ? (isLight ? 'border-[#0052FF] ring-1 ring-[#0052FF]/50 shadow-[0_0_10px_rgba(0,82,255,0.3)]' : 'border-[#00F0FF] ring-1 ring-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]')
                              : (isLight ? 'border-[#1A1D24]/30 focus:border-[#0052FF]' : 'border-[#2D3645] focus:border-[#00F0FF]')
                          }`}
                        />
                        {formErrors.message && (
                          <div id="dispatch-message-error" role="alert" className="flex items-center gap-1.5 mt-1 text-rose-400 font-mono text-fluid-micro">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.message}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        onMouseEnter={() => chiptuneAudio.playPixelTick()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#00F0FF] text-[#070814] font-pixel text-xs tracking-wider uppercase border-2 border-white shadow-[2px_2px_0_0_#070814] hover:bg-[#FF2A85] hover:text-white active:translate-y-0.5 transition-all"
                        aria-label="Transmit message packet"
                      >
                        <span>Transmit Message Packet</span>
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* =========================================================================
              GLOBAL ARCHITECTURAL STACK & TELEMETRY FOOTER
             ========================================================================= */}
          <footer className="pt-10 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left: Brand Monogram & Core Mission */}
              <div className="flex items-center gap-3">
                <Magnetic>
                  <button
                    type="button"
                    onClick={() => scrollTo(0)}
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    className="w-9 h-9 bg-[#131629] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#00F0FF] flex items-center justify-center transition-colors group shadow-[2px_2px_0_0_#070814]"
                    aria-label="Back to top"
                  >
                    <span className="font-pixel text-[10px] text-[#00F0FF] group-hover:scale-110 transition-transform">
                      FP
                    </span>
                  </button>
                </Magnetic>
                <div>
                  <div className="font-pixel font-bold text-xs text-white">
                    WATCHKNIGHT<span className="text-[#FF2A85]">_OS</span> // SYS.96
                  </div>
                  <div className="font-mono text-fluid-micro text-[#8E98AA]">
                    Full-Stack Web Architect &amp; Systems Engineer • East West University, Dhaka
                  </div>
                </div>
              </div>

              {/* Center: Architectural Telemetry Stack */}
              <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-fluid-micro text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#00F0FF]" />
                  <span>Vite 6 + React 18</span>
                </span>
                <span className="text-white/20">•</span>
                <span>GSAP + Lenis Inertia</span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#4AF626]" />
                  <span>Tailwind CSS</span>
                </span>
              </div>

              {/* Right: Back to Apex scroll CTA */}
              <div>
                <Magnetic>
                  <button
                    type="button"
                    onClick={() => scrollTo(0, { duration: 1.4 })}
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    className="group flex items-center gap-2 px-4 py-2.5 bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#D6CFC2] hover:text-[#00F0FF] transition-all font-pixel text-[10px] shadow-[2px_2px_0_0_#070814]"
                    aria-label="Back to apex"
                  >
                    <span>&gt; BACK TO APEX</span>
                    <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 text-[#00F0FF]" />
                  </button>
                </Magnetic>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-fluid-micro text-slate-500 text-center sm:text-left">
              <div>
                © {new Date().getFullYear()} WATCHKNIGHT_OS // SYS.96. Architected by Abdur Rahman Moayed (@watchknight).
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-none bg-[#4AF626] animate-pulse" />
                <span>All systems operational • Zero memory leaks</span>
              </div>
            </div>
          </footer>

        </div>
        </div>
      </section>

      {/* =========================================================================
          ACCESSIBLE RESUME & CREDENTIALS PREVIEW MODAL
         ========================================================================= */}
      {resumeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-2xl animate-in fade-in duration-200"
          onClick={closeResumeModal}
        >
          <div
            ref={modalContentRef}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain border-2 ${
              isLight
                ? 'bg-[#F2EFE9] border-[#1A1D24] shadow-[4px_4px_0_0_#C8C1B4] text-[#11131A]'
                : 'bg-[#131629] border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] shadow-[0_0_30px_rgba(0,240,255,0.35),4px_4px_0_0_#070814] text-[#F0EFE6]'
            }`}
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            {/* 90s Retro-OS Window Chrome Hardware Titlebar */}
            <div className={`flex items-center justify-between px-3 py-2 font-bold text-xs select-none ${
              isLight ? 'bg-[#D6CFC2] text-[#11131A] border-b border-[#1A1D24]/20' : 'bg-[#D6CFC2] text-[#070814]'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 border inline-block animate-pulse ${
                  isLight ? 'bg-[#007A33] border-[#1A1D24]' : 'bg-[#4AF626] border-[#070814]'
                }`} />
                <span className="font-pixel text-[10px] uppercase tracking-wider">
                  SYS.96 // CREDENTIALS &amp; SYSTEMS DOSSIER
                </span>
              </div>
              <div className="flex items-center gap-1 font-pixel text-[9px]">
                <button
                  ref={modalCloseBtnRef}
                  type="button"
                  onClick={closeResumeModal}
                  className={`w-4 h-4 flex items-center justify-center border font-pixel text-[9px] ${
                    isLight
                      ? 'bg-[#E5DFD3] text-[#11131A] border-[#1A1D24] hover:bg-[#D8D2C5]'
                      : 'bg-[#070814] text-[#FF2A85] border-[#2D3645] hover:bg-white/10'
                  }`}
                  aria-label="Close credentials modal"
                >
                  x
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Modal Header */}
              <div className={`border-b pb-4 ${isLight ? 'border-[#1A1D24]/20' : 'border-[#2D3645]'}`}>
                <span className={`font-pixel text-[9px] uppercase tracking-widest block mb-1 ${
                  isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'
                }`}>
                  &gt; VERIFIED ENGINEER CREDENTIALS // SATELLITE TRANSCEIVER
                </span>
                <h3
                  id="resume-modal-title"
                  className={`font-pixel font-bold text-lg sm:text-xl ${isLight ? 'text-[#11131A]' : 'text-white'}`}
                >
                  {PORTFOLIO_DATA.meta.name}
                </h3>
                <p className={`font-mono text-fluid-micro mt-1 ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'}`}>
                  CSE Undergraduate @ East West University, Dhaka • Full-Stack Architect &amp; Systems Engineer
                </p>
              </div>

              {/* Modal Content Sections */}
              <div className="space-y-6 text-fluid-sm">
                
                {/* Education */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-pixel text-[10px] uppercase tracking-wider ${
                    isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'
                  }`}>
                    <GraduationCap className={`w-4 h-4 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`} />
                    <span>Academic Anchor</span>
                  </div>
                  <div className={`p-4 border-2 ${
                    isLight ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#0D1512] border-2 border-[#2D3645]'
                  }`}>
                    <div className={`font-pixel text-xs ${isLight ? 'text-[#11131A]' : 'text-white'}`}>East West University, Dhaka, Bangladesh</div>
                    <div className={`font-mono text-fluid-micro mt-1 ${isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'}`}>Bachelor of Science in Computer Science and Engineering (CSE)</div>
                    <p className={`text-fluid-micro mt-1 font-mono ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'}`}>
                      Specialized coursework: Operating Systems (POSIX IPC, process scheduling), Algorithms, Computer Networks, Distributed Computing, Database Management Systems.
                    </p>
                  </div>
                </div>

                {/* Technical Capabilities Matrix */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-pixel text-[10px] uppercase tracking-wider ${
                    isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'
                  }`}>
                    <Code2 className={`w-4 h-4 ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`} />
                    <span>Verified Competencies &amp; Systems Stack</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`p-3.5 border-2 ${
                      isLight ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#0D1512] border-[#2D3645]'
                    }`}>
                      <div className={`font-pixel text-[9px] font-bold uppercase mb-1 ${
                        isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'
                      }`}>
                        Systems &amp; Low-Level
                      </div>
                      <p className={`text-fluid-micro leading-relaxed font-mono ${
                        isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'
                      }`}>
                        C, C++, POSIX Shared Memory (shmget/shmat), Linux IPC Pipes, fork() hierarchies, Valgrind memory leak audits, Linux Ubuntu tooling.
                      </p>
                    </div>
                    <div className={`p-3.5 border-2 ${
                      isLight ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#0D1512] border-[#2D3645]'
                    }`}>
                      <div className={`font-pixel text-[9px] font-bold uppercase mb-1 ${
                        isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'
                      }`}>
                        Frontend &amp; Creative
                      </div>
                      <p className={`text-fluid-micro leading-relaxed font-mono ${
                        isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'
                      }`}>
                        React 18, TypeScript strict generics, GSAP 3 (ScrollTrigger pinning), Lenis smooth inertial scrolling, Tailwind CSS, HTML5 2D Canvas.
                      </p>
                    </div>
                    <div className={`p-3.5 border-2 ${
                      isLight ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#0D1512] border-[#2D3645]'
                    }`}>
                      <div className={`font-pixel text-[9px] font-bold uppercase mb-1 ${
                        isLight ? 'text-[#007A33]' : 'text-[#4AF626]'
                      }`}>
                        Data Fabric &amp; Cloud
                      </div>
                      <p className={`text-fluid-micro leading-relaxed font-mono ${
                        isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'
                      }`}>
                        Cloud Firestore real-time snapshot listeners, PostgreSQL, MongoDB, IndexedDB offline persistence, Firebase Auth.
                      </p>
                    </div>
                    <div className={`p-3.5 border-2 ${
                      isLight ? 'bg-[#FFFFFF] border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'bg-[#0D1512] border-[#2D3645]'
                    }`}>
                      <div className={`font-pixel text-[9px] font-bold uppercase mb-1 ${
                        isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'
                      }`}>
                        DevOps &amp; Infrastructure
                      </div>
                      <p className={`text-fluid-micro leading-relaxed font-mono ${
                        isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'
                      }`}>
                        GitHub Actions automated CI/CD test workflows, Docker containerization, Vite micro-bundling, Git version control.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flagship Architectures Summary */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 font-pixel text-[10px] uppercase tracking-wider ${
                    isLight ? 'text-[#007A33]' : 'text-[#4AF626]'
                  }`}>
                    <Briefcase className={`w-4 h-4 ${isLight ? 'text-[#007A33]' : 'text-[#4AF626]'}`} />
                    <span>Flagship Production Repositories</span>
                  </div>
                  <div className="space-y-2 font-mono text-fluid-micro">
                    {[
                      { name: 'Mental Defrag', repo: 'https://github.com/watchknight/Mental-Defrag', tech: 'TypeScript, Matter.js Physics, Vector Embeddings' },
                      { name: 'DocLensBD', repo: 'https://github.com/watchknight/DocLensBD', tech: 'Cloud Firestore, React, GitHub Actions CI/CD' },
                      { name: 'Rannabanna', repo: 'https://github.com/watchknight/Rannabanna', tech: 'Vite, Bengali NLP Glyph Optimization, Cloud Sync' },
                      { name: 'Trash Trail', repo: 'https://github.com/watchknight/TrashTrail', tech: 'GSAP Pinned ScrollTrigger Narrative' },
                      { name: 'Neon Vanguard & OS Labs', repo: 'https://github.com/watchknight/BitForge', tech: 'HTML5 2D Canvas & Linux C POSIX Shared Memory' },
                    ].map((item) => (
                      <div key={item.name} className={`p-2.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isLight ? 'bg-[#FFFFFF] border-[#1A1D24]/20 shadow-[1px_1px_0_0_#C8C1B4]' : 'bg-[#0D1512] border-[#2D3645]'
                      }`}>
                        <div className="min-w-0 flex-1">
                          <span className={`font-bold ${isLight ? 'text-[#11131A]' : 'text-white'}`}>{item.name}</span>
                          <span className={`${isLight ? 'text-[#1A1D24]/40' : 'text-slate-500'} mx-2 hidden sm:inline`}>—</span>
                          <span className={`${isLight ? 'text-[#3F4654]' : 'text-slate-400'} block sm:inline`}>{item.tech}</span>
                        </div>
                        <a
                          href={item.repo}
                          target="_blank"
                          rel="noreferrer"
                          onMouseEnter={() => chiptuneAudio.playPixelTick()}
                          onClick={() => chiptuneAudio.playCoinSFX()}
                          className={`hover:underline font-bold flex items-center gap-1 shrink-0 self-start sm:self-center font-pixel text-[9px] ${
                            isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'
                          }`}
                          aria-label={`View repository for ${item.name}`}
                        >
                          <span>[ REPO ]</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'border-[#1A1D24]/20' : 'border-[#2D3645]'
              }`}>
                <div className={`font-mono text-fluid-micro ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'}`}>
                  Direct Channel: <strong className={isLight ? 'text-[#11131A]' : 'text-white'}>{PORTFOLIO_DATA.meta.email}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      chiptuneAudio.playPixelTick();
                      closeResumeModal();
                    }}
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    className={`px-4 py-2 font-pixel text-[9px] border transition-colors ${
                      isLight
                        ? 'bg-[#E5DFD3] hover:bg-[#D8D2C5] text-[#11131A] border-[#1A1D24]'
                        : 'bg-[#0D1512] hover:bg-white/10 text-[#D6CFC2] border-[#2D3645]'
                    }`}
                  >
                    [ CLOSE DOSSIER ]
                  </button>
                  <a
                    href="/resume.pdf"
                    download="Abdur_Rahman_Moayed_Resume.pdf"
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    onClick={() => chiptuneAudio.playCoinSFX()}
                    className={`px-5 py-2.5 font-pixel text-[10px] uppercase font-bold flex items-center gap-2 border-2 transition-colors ${
                      isLight
                        ? 'bg-[#0052FF] text-white border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4] hover:bg-[#D90452]'
                        : 'bg-[#00F0FF] text-[#070814] border-white shadow-[2px_2px_0_0_#070814] hover:bg-[#FF2A85] hover:text-white'
                    }`}
                    aria-label="Download Abdur Rahman Moayed's Resume PDF document"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Document</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactFooter;
