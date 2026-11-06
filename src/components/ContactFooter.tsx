import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { useLenis } from '../hooks/useLenis';
import { LiquidGlassCard } from './ui/LiquidGlassCard';
import { Magnetic } from './ui/Magnetic';
import { MagneticButton } from './ui/MagneticButton';
import { audio } from '../utils/audio';
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
  X,
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

    setFormErrors({});
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4500);
  };

  // 6. Accessible Modal Management: Scroll Locking, Tab Trapping, and Focus Restoration
  const openResumeModal = () => {
    setResumeModalOpen(true);
  };

  const closeResumeModal = useCallback(() => {
    setResumeModalOpen(false);
    // Restore focus to triggering button
    setTimeout(() => {
      credentialsTriggerRef.current?.focus();
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
    };
  }, [resumeModalOpen, closeResumeModal]);

  return (
    <>
      <section
        ref={sectionRef}
        id="contact"
        className="relative z-[1] min-h-[85vh] lg:min-h-[90vh] pt-16 pb-16 md:pt-24 md:pb-20 bg-obsidian-darker/95 overflow-hidden border-t border-white/10"
        aria-label="Contact and conversion footer"
      >
        <div ref={footerInnerRef} className="w-full h-full will-change-transform">
        {/* Ambient background glow accents */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-mint/10 to-transparent blur-[120px] rounded-full"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 right-10 w-[450px] h-[250px] bg-gradient-to-t from-amber-warm/5 to-transparent blur-[100px] rounded-full"
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
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-2xl bg-carbon-surface/95 border border-cyan-mint/40 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(0,245,212,0.25)] backdrop-blur-2xl text-slate-100">
            <div className="w-8 h-8 rounded-xl bg-cyan-mint/15 border border-cyan-mint/40 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-cyan-mint" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-sm text-white">
                Copied to clipboard!
              </div>
              <div className="font-mono text-fluid-micro text-slate-400 truncate">
                {PORTFOLIO_DATA.meta.email} • Ready to paste into your mail app
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">

          {/* =========================================================================
              THEATRICAL GIANT FULL-WIDTH CALL-TO-ACTION WITH STAGGERED CHARACTERS
             ========================================================================= */}
          <div className="footer-anim mb-8 sm:mb-12 text-center max-w-6xl mx-auto overflow-hidden select-none">
            <div className="font-mono text-fluid-micro text-accent-coral uppercase tracking-widest mb-3">
              THEATRICAL FINALE // AWWWARDS CAPSTONE
            </div>
            <div
              className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-alabaster to-white/40 flex flex-wrap justify-center gap-x-2 sm:gap-x-4 md:gap-x-6 leading-none py-1"
              aria-label="LET'S BUILD SOMETHING ICONIC"
            >
              {["LET'S", "BUILD", "SOMETHING", "ICONIC"].map((word, wIdx) => (
                <span key={wIdx} className="inline-flex overflow-hidden">
                  {word.split('').map((char, cIdx) => (
                    <span
                      key={cIdx}
                      className="iconic-char inline-block will-change-transform transform-gpu"
                    >
                      {char}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          {/* Availability Status Ribbon */}
          <div className="footer-anim mb-10 flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-obsidian-card/90 border border-white/10 shadow-editorial-card backdrop-blur-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
              </span>
              <span className="font-mono text-fluid-xs text-alabaster font-medium">
                Available for Systems &amp; Full-Stack Engineering Roles
              </span>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="font-mono text-fluid-xs text-cyan-mint hidden sm:inline font-semibold">
                Dhaka, BD (UTC+6)
              </span>
            </div>
          </div>

          {/* =========================================================================
              ZERO-FRICTION CONVERSION HERO CALLOUT
             ========================================================================= */}
          <div className="footer-anim text-center max-w-4xl mx-auto mb-16 space-y-6">
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-fluid-h1 lg:text-fluid-hero tracking-tight text-white uppercase break-words">
              Ready to build something{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-mint via-white to-amber-warm drop-shadow-[0_0_35px_rgba(0,245,212,0.35)]">
                unforgettable?
              </span>
            </h2>

            <p className="font-body text-fluid-lead text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Whether architecting deterministic POSIX systems in C/Linux, orchestrating real-time cloud data pipelines, or designing 120 FPS web platforms — let’s engineer something exceptional together.
            </p>

            {/* HIGH-CONVERSION PRIMARY ACTION ROW */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              
              {/* One-Click Magnetic Copy Email Button */}
              <MagneticButton
                onClick={handleCopyEmail}
                strength={0.35}
                innerStrength={0.2}
                className="group px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-mint via-[#25ffdb] to-cyan-dim text-obsidian font-display font-black text-sm sm:text-base tracking-wide shadow-[0_0_30px_rgba(0,245,212,0.45)] hover:shadow-[0_0_45px_rgba(0,245,212,0.7)] active:scale-95 transition-all"
                aria-label={`Copy email address ${PORTFOLIO_DATA.meta.email} to clipboard`}
              >
                <span className="flex items-center gap-2.5">
                  {copied ? (
                    <Check className="w-5 h-5 text-obsidian animate-bounce" />
                  ) : (
                    <Copy className="w-5 h-5 text-obsidian transition-transform group-hover:scale-110" />
                  )}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Address'}</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-obsidian/15 border border-obsidian/20 hidden sm:inline">
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
                    onMouseEnter={() => audio.playTick()}
                    className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-amber-warm/50 text-slate-100 hover:text-white font-display font-bold text-sm sm:text-base flex items-center gap-2 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(255,183,3,0.25)]"
                    aria-label="Download Abdur Rahman Moayed's Resume PDF"
                  >
                    <Download className="w-4 h-4 text-amber-warm" />
                    <span>Download Resume (PDF)</span>
                  </a>
                </Magnetic>

                <Magnetic>
                  <button
                    ref={credentialsTriggerRef}
                    type="button"
                    onClick={openResumeModal}
                    onMouseEnter={() => audio.playTick()}
                    className="px-4 py-4 rounded-2xl bg-carbon-surface/90 hover:bg-carbon-elevated border border-white/10 hover:border-cyan-mint/40 text-slate-300 hover:text-cyan-mint font-mono text-fluid-xs flex items-center gap-1.5 transition-all"
                    title="View Curated Credentials Modal"
                    aria-label="View interactive credentials modal"
                  >
                    <FileText className="w-4 h-4 text-cyan-mint" />
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
                className="text-cyan-mint hover:underline font-medium"
              >
                open native mailto:
              </a>
            </div>

          </div>

          {/* =========================================================================
              LIVE LOCAL TIME VS. VISITOR TIME COMPARISON & OPERATIONAL TELEMETRY
             ========================================================================= */}
          <div className="footer-anim mb-14 max-w-5xl mx-auto">
            <div className="p-4 sm:p-6 rounded-2xl bg-obsidian-surface/85 border border-white/10 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* Clocks Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                {/* Dhaka Time */}
                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-mint/10 border border-cyan-mint/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-cyan-mint" />
                  </div>
                  <div>
                    <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>HQ: Dhaka, Bangladesh</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <div className="font-mono font-bold text-lg sm:text-xl text-white tracking-wider flex items-center gap-2">
                      <span id="dhaka-clock" aria-label="Local operational time in Dhaka, Bangladesh" className="text-cyan-mint">
                        {dhakaTime || 'Loading UTC+6...'}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-amber-warm font-normal">
                        UTC+6
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visitor Local Time */}
                <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-amber-warm/10 border border-amber-warm/30 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-amber-warm" />
                  </div>
                  <div>
                    <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Your Timezone: {visitorInfo.shortTz || 'Local'}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-mint animate-pulse" />
                    </div>
                    <div className="font-mono font-bold text-lg sm:text-xl text-white tracking-wider flex items-center gap-2">
                      <span id="visitor-clock" aria-label="Visitor local time" className="text-amber-warm">
                        {visitorInfo.time || 'Local Sync...'}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-mint font-normal">
                        {visitorInfo.diffSummary}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global Overlap & SLA Telemetry */}
              <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 text-fluid-micro font-mono text-slate-400">
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Response SLA: &lt; 24h</span>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                  Global UTC Overlap Guaranteed
                </span>
              </div>

            </div>
          </div>

          {/* =========================================================================
              TWO-COLUMN DISPATCH & COORDINATES GRID
             ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            
            {/* Left Column: Direct Coordinates Card */}
            <div className="footer-anim lg:col-span-5 space-y-6">
              <LiquidGlassCard spotlightColor="cyan" className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2 font-mono text-fluid-micro text-cyan-mint uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-cyan-mint" />
                  <span>Direct Coordinates</span>
                </div>

                <h3 className="font-display font-bold text-fluid-h3 text-white mb-2">
                  Dhaka Headquarters
                </h3>

                <p className="font-body text-fluid-sm text-slate-400 mb-6 leading-relaxed">
                  Undergraduate in Computer Science &amp; Engineering at East West University, Dhaka. 
                  Synchronized with global distributed engineering teams across APAC, EMEA, and North America.
                </p>

                <div className="space-y-3.5">
                  
                  {/* Email row with quick copy */}
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/85 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-mint/10 border border-cyan-mint/20 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-cyan-mint" />
                      </div>
                      <div>
                        <div className="font-mono text-fluid-micro text-slate-400">Primary Channel</div>
                        <div className="font-mono text-fluid-sm text-white font-medium select-all">
                          {PORTFOLIO_DATA.meta.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="p-2 rounded-lg bg-white/5 hover:bg-cyan-mint/20 text-slate-300 hover:text-cyan-mint transition-colors"
                      title="Copy Email"
                      aria-label="Copy primary email"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Academic Anchor & Coordinates */}
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/85 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-warm/10 border border-amber-warm/20 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-amber-warm" />
                    </div>
                    <div>
                      <div className="font-mono text-fluid-micro text-slate-400">Academic Anchor</div>
                      <div className="font-display text-fluid-sm text-white font-medium">
                        East West University — Dhaka, BD
                      </div>
                      <div className="font-mono text-fluid-micro text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-warm/80" />
                        <span>23.8103° N, 90.4125° E • CSE Department</span>
                      </div>
                    </div>
                  </div>

                  {/* Systems Specialism */}
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/85 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-mono text-fluid-micro text-slate-400">Core Engineering Specialisms</div>
                      <div className="font-body text-fluid-sm text-slate-200">
                        C/C++, POSIX IPC, Linux Syscalls, React 18 &amp; GSAP
                      </div>
                    </div>
                  </div>

                </div>

                {/* Direct Profiles & Verified Links */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="font-mono text-fluid-micro text-slate-400 uppercase tracking-widest mb-3">
                    Verified Profiles &amp; Commits
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    
                    {/* GitHub */}
                    <Magnetic>
                      <a
                        href={PORTFOLIO_DATA.meta.github}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={() => audio.playTick()}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-mint/40 text-slate-200 hover:text-white transition-all font-mono text-fluid-sm group"
                        aria-label="View Abdur Rahman Moayed's GitHub profile (@watchknight)"
                      >
                        <GithubIcon className="w-4 h-4 text-slate-300 group-hover:text-cyan-mint transition-colors" />
                        <span>GitHub</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-mint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Magnetic>

                    {/* LinkedIn */}
                    <Magnetic>
                      <a
                        href={PORTFOLIO_DATA.meta.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={() => audio.playTick()}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-warm/40 text-slate-200 hover:text-white transition-all font-mono text-fluid-sm group"
                        aria-label="View Abdur Rahman Moayed's LinkedIn profile"
                      >
                        <LinkedinIcon className="w-4 h-4 text-slate-300 group-hover:text-amber-warm transition-colors" />
                        <span>LinkedIn</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-warm transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Magnetic>

                    {/* Twitter/X */}
                    <Magnetic>
                      <a
                        href={PORTFOLIO_DATA.meta.twitter}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={() => audio.playTick()}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-slate-200 hover:text-white transition-all font-mono text-fluid-sm group"
                        aria-label="View Abdur Rahman Moayed's Twitter / X profile"
                      >
                        <TwitterIcon className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                        <span>Twitter / X</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Magnetic>

                  </div>
                </div>

              </LiquidGlassCard>
            </div>

            {/* Right Column: Send Direct Dispatch Form */}
            <div ref={dispatchCardRef} id="dispatch-form-card" className="footer-anim lg:col-span-7">
              <LiquidGlassCard spotlightColor="amber" className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-2 font-mono text-fluid-micro text-amber-warm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-warm" />
                  <span>Encrypted Channel</span>
                </div>

                <h3 className="font-display font-bold text-fluid-h3 text-white mb-2">
                  Send Direct Dispatch
                </h3>

                <p className="font-body text-fluid-sm text-slate-400 mb-6 leading-relaxed">
                  Transmit an engineering proposal, role inquiry, or architectural collaboration payload directly to my inbox.
                </p>

                {sent ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in fade-in"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="font-display font-bold text-xl text-white">
                      Transmission Packet Queued!
                    </div>
                    <p className="font-body text-fluid-sm text-slate-300 max-w-md mx-auto">
                      Thank you. Your message has been routed to Abdur Rahman Moayed.
                      Guaranteed response within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                      <label
                        htmlFor="dispatch-name"
                        className="block font-mono text-fluid-micro text-slate-300 uppercase tracking-wider mb-1.5"
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
                        placeholder="e.g. Satoshi Nakamoto / DeepMind Systems"
                        className="w-full px-4 py-3 rounded-xl bg-obsidian-surface/90 border border-white/10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-mint transition-colors font-body text-fluid-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="dispatch-email"
                        className="block font-mono text-fluid-micro text-slate-300 uppercase tracking-wider mb-1.5"
                      >
                        Electronic Mail Coordinates <span className="text-amber-warm">*</span>
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
                        placeholder="recruiter@engineering.com"
                        className={`w-full px-4 py-3 rounded-xl bg-obsidian-surface/90 border text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors font-body text-fluid-sm ${
                          formErrors.email
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : 'border-white/10 focus:border-cyan-mint'
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
                          className="font-mono text-fluid-micro text-slate-300 uppercase tracking-wider"
                        >
                          Dispatch Payload / Message <span className="text-amber-warm">*</span>
                        </label>
                        {isPrefillGlow && (
                          <span className="font-mono text-[11px] text-cyan-mint animate-pulse font-semibold">
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
                        placeholder="Outline project parameters, systems requirements, or role details..."
                        className={`w-full px-4 py-3 rounded-xl bg-obsidian-surface/90 border text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all duration-300 font-body text-fluid-sm resize-none ${
                          formErrors.message
                            ? 'border-rose-500/80 focus:border-rose-400'
                            : isPrefillGlow
                            ? 'border-cyan-mint ring-2 ring-cyan-mint/50 shadow-[0_0_25px_rgba(0,245,212,0.4)]'
                            : 'border-white/10 focus:border-cyan-mint'
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
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-cyan-mint text-obsidian font-display font-bold text-sm tracking-wide shadow-glow-cyan hover:bg-[#20ffdf] active:scale-[0.99] transition-all"
                      aria-label="Transmit message packet"
                    >
                      <span>Transmit Message Packet</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </LiquidGlassCard>
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
                    onMouseEnter={() => audio.playTick()}
                    className="w-9 h-9 rounded-full bg-cyan-mint/10 border border-cyan-mint/30 flex items-center justify-center hover:border-cyan-mint transition-colors group"
                    aria-label="Back to top"
                  >
                    <span className="font-display font-black text-xs text-cyan-mint group-hover:scale-110 transition-transform">
                      FP
                    </span>
                  </button>
                </Magnetic>
                <div>
                  <div className="font-display font-bold text-sm text-white">
                    FOLIO<span className="text-amber-warm">PORT</span> • {PORTFOLIO_DATA.meta.name}
                  </div>
                  <div className="font-mono text-fluid-micro text-slate-500">
                    Full-Stack Web Architect &amp; Systems Engineer • East West University, Dhaka
                  </div>
                </div>
              </div>

              {/* Center: Architectural Telemetry Stack */}
              <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-fluid-micro text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-mint" />
                  <span>Vite 6 + React 18</span>
                </span>
                <span className="text-white/20">•</span>
                <span>GSAP + Lenis Inertia</span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Tailwind CSS</span>
                </span>
              </div>

              {/* Right: Back to Apex scroll CTA */}
              <div>
                <Magnetic>
                  <button
                    type="button"
                    onClick={() => scrollTo(0, { duration: 1.4 })}
                    onMouseEnter={() => audio.playTick()}
                    className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-carbon-surface/80 hover:bg-carbon-elevated border border-white/10 hover:border-cyan-mint/40 text-slate-300 hover:text-cyan-mint transition-all font-mono text-fluid-micro shadow-sm"
                    aria-label="Back to apex"
                  >
                    <span>Back to Apex</span>
                    <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                  </button>
                </Magnetic>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-fluid-micro text-slate-500 text-center sm:text-left">
              <div>
                © {new Date().getFullYear()} FolioPort Core Engine. Architected by Abdur Rahman Moayed (@watchknight).
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-carbon/95 border border-white/15 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-slate-100 space-y-6"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="font-mono text-fluid-micro text-cyan-mint uppercase tracking-widest block mb-1">
                  Curated Credentials &amp; Systems Dossier
                </span>
                <h3
                  id="resume-modal-title"
                  className="font-display font-bold text-2xl text-white"
                >
                  {PORTFOLIO_DATA.meta.name}
                </h3>
                <p className="font-mono text-fluid-micro text-slate-400 mt-0.5">
                  CSE Undergraduate @ East West University, Dhaka • Full-Stack Architect &amp; Systems Engineer
                </p>
              </div>

              <button
                ref={modalCloseBtnRef}
                type="button"
                onClick={closeResumeModal}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Close credentials modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-6 text-fluid-sm">
              
              {/* Education */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-white uppercase tracking-wider text-fluid-micro text-cyan-mint">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Anchor</span>
                </div>
                <div className="p-4 rounded-xl bg-obsidian-surface/80 border border-white/5">
                  <div className="font-display font-bold text-white">East West University, Dhaka, Bangladesh</div>
                  <div className="font-mono text-fluid-micro text-slate-300">Bachelor of Science in Computer Science and Engineering (CSE)</div>
                  <p className="text-slate-400 text-fluid-micro mt-1">
                    Specialized coursework: Operating Systems (POSIX IPC, process scheduling), Algorithms, Computer Networks, Distributed Computing, Database Management Systems.
                  </p>
                </div>
              </div>

              {/* Technical Capabilities Matrix */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-white uppercase tracking-wider text-fluid-micro text-amber-warm">
                  <Code2 className="w-4 h-4" />
                  <span>Verified Competencies &amp; Systems Stack</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/80 border border-white/5">
                    <div className="font-mono text-fluid-micro text-cyan-mint font-bold uppercase mb-1">
                      Systems &amp; Low-Level
                    </div>
                    <p className="text-slate-300 text-fluid-micro leading-relaxed">
                      C, C++, POSIX Shared Memory (shmget/shmat), Linux IPC Pipes, fork() hierarchies, Valgrind memory leak audits, Linux Ubuntu tooling.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/80 border border-white/5">
                    <div className="font-mono text-fluid-micro text-amber-warm font-bold uppercase mb-1">
                      Frontend &amp; Creative
                    </div>
                    <p className="text-slate-300 text-fluid-micro leading-relaxed">
                      React 18, TypeScript strict generics, GSAP 3 (ScrollTrigger pinning), Lenis smooth inertial scrolling, Tailwind CSS, HTML5 2D Canvas.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/80 border border-white/5">
                    <div className="font-mono text-fluid-micro text-emerald-400 font-bold uppercase mb-1">
                      Data Fabric &amp; Cloud
                    </div>
                    <p className="text-slate-300 text-fluid-micro leading-relaxed">
                      Cloud Firestore real-time snapshot listeners, PostgreSQL, MongoDB, IndexedDB offline persistence, Firebase Auth.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-obsidian-surface/80 border border-white/5">
                    <div className="font-mono text-fluid-micro text-sky-400 font-bold uppercase mb-1">
                      DevOps &amp; Infrastructure
                    </div>
                    <p className="text-slate-300 text-fluid-micro leading-relaxed">
                      GitHub Actions automated CI/CD test workflows, Docker containerization, Vite micro-bundling, Git version control.
                    </p>
                  </div>
                </div>
              </div>

              {/* Flagship Architectures Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-white uppercase tracking-wider text-fluid-micro text-emerald-400">
                  <Briefcase className="w-4 h-4" />
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
                    <div key={item.name} className="p-2.5 rounded-lg bg-obsidian-surface/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-slate-500 mx-2 hidden sm:inline">—</span>
                        <span className="text-slate-400 block sm:inline">{item.tech}</span>
                      </div>
                      <a
                        href={item.repo}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-mint hover:underline font-bold flex items-center gap-1 shrink-0 self-start sm:self-center"
                        aria-label={`View repository for ${item.name}`}
                      >
                        <span>Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-fluid-micro text-slate-400">
                Direct Contact: <strong className="text-white">{PORTFOLIO_DATA.meta.email}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeResumeModal}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-fluid-micro"
                >
                  Close Dossier
                </button>
                <a
                  href="/resume.pdf"
                  download="Abdur_Rahman_Moayed_Resume.pdf"
                  className="px-5 py-2.5 rounded-xl bg-cyan-mint text-obsidian font-display font-bold text-xs flex items-center gap-2 shadow-glow-cyan"
                  aria-label="Download Abdur Rahman Moayed's Resume PDF document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Document</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ContactFooter;
