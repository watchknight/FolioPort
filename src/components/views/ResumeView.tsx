import React, { useState, useRef } from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface ResumeViewProps {
  palette?: PhosphorColorTokens;
}

export const ResumeView: React.FC<ResumeViewProps> = ({ palette }) => {
  const bright = palette?.bright ?? '#c2cdb4';
  const voidCol = palette?.void ?? '#111712';
  const mid = palette?.mid ?? '#6e7d62';
  const dim = palette?.dim ?? '#2e3b2b';

  // Email copy banner state
  const [isEmailCopied, setIsEmailCopied] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Download resume progress bar state
  const [downloadStep, setDownloadStep] = useState<number | null>(null); // null = idle, 1=25%, 2=50%, 3=75%, 4=100%
  const downloadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playClickSound = (freq: number = 720) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {
      // Safe audio trigger
    }
  };

  // Copy email to clipboard with zero friction
  const handleCopyEmail = async () => {
    const email = 'moayed.cse@gmail.com';
    playClickSound(880);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = email;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
    } catch {
      // Clipboard write fallback
    }

    setIsEmailCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setIsEmailCopied(false);
    }, 3200);
  };

  // Trigger stepped pixel download progress bar
  const handleStartDownload = () => {
    playClickSound(920);
    if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);

    setDownloadStep(1); // 25%
    let step = 1;

    downloadIntervalRef.current = setInterval(() => {
      step += 1;
      playClickSound(500 + step * 120);
      setDownloadStep(step);

      if (step >= 4) {
        if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
        // Automatically reset after 2.5 seconds
        setTimeout(() => {
          setDownloadStep(null);
        }, 2500);
      }
    }, 180);
  };

  // Stepped progress gauge string generator
  const getProgressGauge = (step: number) => {
    switch (step) {
      case 1:
        return '[██░░░░░░░░ 25%]';
      case 2:
        return '[█████░░░░░ 50%]';
      case 3:
        return '[███████░░░ 75%]';
      case 4:
      default:
        return '[██████████ 100% COMPLETE]';
    }
  };

  return (
    <article
      data-testid="retro-content-resume"
      className="flex flex-col gap-3 font-pixel select-text"
      style={{ color: bright }}
    >
      {/* 1. DOCUMENT VIEWER HEADER */}
      <div
        className="pb-1 border-b flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold tracking-wider"
        style={{ borderColor: mid, color: bright }}
      >
        <span>=== [3] RESUME // RESUME_CV.DOC ===</span>
        <span
          className="text-[7.5px] px-1 py-0.2 border"
          style={{ backgroundColor: dim, borderColor: mid, color: bright }}
        >
          DOSSIER_v4.96
        </span>
      </div>

      {/* INSTANT COPIED EMAIL BANNER */}
      {isEmailCopied && (
        <div
          data-testid="retro-email-copied-banner"
          className="p-1.5 border flex items-center justify-between text-[8px] sm:text-[8.5px] font-bold animate-pulse"
          style={{
            backgroundColor: bright,
            color: voidCol,
            borderColor: bright,
            boxShadow: `2px 2px 0px 0px ${voidCol}`,
          }}
        >
          <span>[&gt;&gt; EMAIL COPIED TO BUFFER &lt;&lt;] moayed.cse@gmail.com</span>
          <span className="text-[7px] uppercase font-mono">[READY TO PASTE]</span>
        </div>
      )}

      {/* 2. ACADEMIC LEDGER */}
      <div
        className="p-2 sm:p-2.5 border flex flex-col gap-1.5"
        style={{ backgroundColor: `${dim}33`, borderColor: mid }}
      >
        <div className="flex items-center justify-between border-b pb-1 text-[8.5px] sm:text-[9.5px] font-bold uppercase" style={{ borderColor: `${mid}60` }}>
          <span>ACADEMIC PROFILE // ACADEMIC LEDGER</span>
          <span className="text-[7px]" style={{ color: mid }}>RECORD_ID #EWU-CSE-2026</span>
        </div>

        <div className="flex flex-col gap-1 text-[7.5px] sm:text-[8.5px] leading-relaxed">
          <div>
            • <strong>Degree:</strong>{' '}
            <span style={{ color: bright }}>
              B.Sc. in Computer Science &amp; Engineering (2022–2026)
            </span>
          </div>
          <div>
            • <strong>Institution:</strong>{' '}
            <span style={{ color: bright }}>
              East West University (EWU), Dhaka, Bangladesh
            </span>
          </div>
          <div>
            • <strong>Core Coursework:</strong>{' '}
            <span style={{ color: `${bright}dd` }}>
              Operating Systems, Data Structures &amp; Algorithms, Database Systems, Software Engineering,
              Computer Architecture, Object-Oriented Programming (C++/Java), and Computer Networks.
            </span>
          </div>
        </div>
      </div>

      {/* 3. TECHNICAL MATRIX (CATEGORIZED MONOCHROME PIXEL TABLE) */}
      <div
        className="p-2 sm:p-2.5 border flex flex-col gap-1.5"
        style={{ backgroundColor: `${dim}40`, borderColor: mid }}
      >
        <div className="flex items-center justify-between border-b pb-1 text-[8.5px] sm:text-[9.5px] font-bold uppercase" style={{ borderColor: `${mid}60` }}>
          <span>TECHNICAL SKILLS BREAKDOWN // TECHNICAL MATRIX</span>
          <span className="text-[7px]" style={{ color: mid }}>BYTECODE MATRIX</span>
        </div>

        {/* Retro Pixel Table */}
        <div className="flex flex-col border text-[7px] sm:text-[7.5px]" style={{ borderColor: `${mid}50` }}>
          {/* Row 1: Languages */}
          <div className="flex flex-col sm:flex-row border-b" style={{ borderColor: `${mid}40` }}>
            <div
              className="sm:w-36 p-1.5 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              LANGUAGES
            </div>
            <div className="p-1.5 flex-1" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              C, C++, TypeScript, JavaScript, Python, Go, Rust, SQL, Bash (Linux)
            </div>
          </div>

          {/* Row 2: Frameworks & Web */}
          <div className="flex flex-col sm:flex-row border-b" style={{ borderColor: `${mid}40` }}>
            <div
              className="sm:w-36 p-1.5 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              FRAMEWORKS &amp; LIBS
            </div>
            <div className="p-1.5 flex-1" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              React 18, Next.js, Vite, Tailwind CSS, Three.js, GSAP ScrollTrigger, Express.js
            </div>
          </div>

          {/* Row 3: Databases & Cloud */}
          <div className="flex flex-col sm:flex-row border-b" style={{ borderColor: `${mid}40` }}>
            <div
              className="sm:w-36 p-1.5 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              DATABASES &amp; CLOUD
            </div>
            <div className="p-1.5 flex-1" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              PostgreSQL, MongoDB, Cloud Firestore, Firebase Auth, IndexedDB, Redis
            </div>
          </div>

          {/* Row 4: Linux & Dev Tooling */}
          <div className="flex flex-col sm:flex-row">
            <div
              className="sm:w-36 p-1.5 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              LINUX &amp; TOOLING
            </div>
            <div className="p-1.5 flex-1" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              Ubuntu Linux, POSIX Shared Memory &amp; Pipes, Git, GitHub Actions CI/CD, Docker, GDB, Valgrind
            </div>
          </div>
        </div>
      </div>

      {/* 4. DIRECT COMMAND ACTIONS */}
      <div
        className="p-2 sm:p-2.5 border flex flex-col gap-2"
        style={{ backgroundColor: `${dim}25`, borderColor: mid }}
      >
        <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-bold uppercase pb-0.5 border-b" style={{ borderColor: `${mid}50` }}>
          <span>&gt; DIRECT COMMAND ACTIONS // ZERO-FRICTION CONTACT</span>
          <span style={{ color: mid }}>TERMINAL BUS</span>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: [DOWNLOAD_RESUME.PDF] with Pixel Download Progress Bar Animation */}
          <div className="flex items-center gap-1.5">
            <a
              href="/resume.pdf"
              download="Abdur_Rahman_Moayed_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="retro-resume-download-btn"
              onClick={handleStartDownload}
              className="px-2.5 py-1 font-bold text-[8px] sm:text-[8.5px] border uppercase transition-none cursor-pointer flex items-center gap-1 outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
              style={{
                backgroundColor: bright,
                color: voidCol,
                borderColor: bright,
                boxShadow: `1px 1px 0px 0px ${voidCol}`,
              }}
            >
              <span>[↓ DOWNLOAD RESUME.PDF]</span>
            </a>

            {/* Stepped Progress Bar Indicator with Segmented Pixel Blocks and ASCII Percentage */}
            {downloadStep !== null && (
              <div
                data-testid="retro-download-progress-bar"
                className="flex items-center gap-1.5 px-1.5 py-0.5 border"
                style={{
                  backgroundColor: voidCol,
                  borderColor: bright,
                  color: bright,
                }}
              >
                {/* 10-block segmented pixel progress indicator */}
                <div className="flex items-center gap-0.5 w-16 h-2">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const filledBlocks = downloadStep * 2.5;
                    const isFilled = i < filledBlocks;
                    return (
                      <div
                        key={i}
                        className="h-full flex-1"
                        style={{
                          backgroundColor: isFilled ? bright : dim,
                          border: `1px solid ${isFilled ? bright : mid}`,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-[7px] sm:text-[7.5px] font-mono font-bold">
                  {getProgressGauge(downloadStep)}
                </span>
              </div>
            )}
          </div>

          {/* Button 2: [COPY_EMAIL.EXE] */}
          <button
            type="button"
            data-testid="retro-resume-copy-email-btn"
            onClick={handleCopyEmail}
            className="px-2.5 py-1 font-bold text-[8px] sm:text-[8.5px] border uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
            style={{
              backgroundColor: 'transparent',
              color: bright,
              borderColor: bright,
            }}
          >
            [COPY_EMAIL.EXE]
          </button>
        </div>

        {/* Direct Terminal Social Links */}
        <div className="flex items-center gap-3 pt-1 border-t text-[7px] sm:text-[7.5px]" style={{ borderColor: `${mid}40` }}>
          <span style={{ color: mid }}>TRANSMIT:</span>

          <a
            href="https://github.com/watchknight"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="retro-link-github"
            onClick={() => playClickSound(760)}
            className="hover:underline flex items-center gap-1 cursor-pointer font-bold outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
            style={{ color: bright }}
          >
            &gt; GITHUB (@watchknight)
          </a>

          <a
            href="https://linkedin.com/in/watchknight"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="retro-link-linkedin"
            onClick={() => playClickSound(760)}
            className="hover:underline flex items-center gap-1 cursor-pointer font-bold outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
            style={{ color: bright }}
          >
            &gt; LINKEDIN
          </a>
        </div>
      </div>
    </article>
  );
};

export default ResumeView;
