import React, { useState, useRef, useEffect } from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { useRetroOS } from '../../context/RetroOSContext';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface ResumeViewProps {
  palette?: PhosphorColorTokens;
}

export interface CliCommandResponse {
  command: string;
  output: string[];
  isClear?: boolean;
  isExit?: boolean;
}

export interface CliHistoryItem {
  command: string;
  output: string[];
}

/**
 * Pure evaluator for interactive command prompt commands
 * Supports: help, whoami, projects (all 7 live Render URLs), contact, clear, skills, sudo hire moayed, exit, ls, cat
 */
export function processCliCommand(cmdRaw: string): CliCommandResponse | null {
  const trimmed = cmdRaw.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
  let response: string[] = [];

  switch (normalized) {
    case 'help':
      response = [
        'Available interactive commands:',
        '  • help     - Display available terminal commands',
        '  • whoami   - Developer identity, handle, institution & credentials',
        '  • projects - List all 7 live Render-deployed web applications',
        '  • contact  - Verified email (armabdur.rahman04@gmail.com) & LinkedIn',
        '  • clear    - Reset terminal screen and history buffer',
        '  • skills   - Technical capabilities & engineering stack',
      ];
      break;

    case 'whoami':
    case 'who':
    case 'me':
    case 'author':
      response = [
        'Abdur Rahman Moayed (@watchknight)',
        'B.Sc. in Computer Science & Engineering @ East West University (EWU), Dhaka, Bangladesh',
        'Full-Stack & Systems Engineer | Coordinates: 23.7644° N, 90.4252° E (UTC+6)',
        'Email: armabdur.rahman04@gmail.com | LinkedIn: https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/',
      ];
      break;

    case 'projects':
    case 'project':
      response = [
        'Live Deployed Systems & Web Applications (7 Live on Render):',
        '  01. BitForge      - https://bitforge-3u2q.onrender.com',
        '  02. FocusLab      - https://focuslab-smoa.onrender.com',
        '  03. Rannabanna    - https://rannabanna.onrender.com',
        '  04. DocLensBD     - https://doclensbd.onrender.com',
        '  05. Mental Defrag - https://mental-defrag.onrender.com',
        '  06. TrashTrail    - https://trashtrail.onrender.com',
        '  07. POSHRA        - https://poshra.onrender.com',
      ];
      break;

    case 'contact':
    case 'contacts':
    case 'email':
    case 'mail':
    case 'linkedin':
    case 'github':
      response = [
        'Verified Contact & Professional Channels:',
        '  • Email:    armabdur.rahman04@gmail.com',
        '  • LinkedIn: https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/',
        '  • GitHub:   https://github.com/watchknight',
        '  • Location: Dhaka, Bangladesh (UTC+6)',
      ];
      break;

    case 'skills':
    case 'skill':
      response = [
        'Frontend & Interactive UI: TypeScript, React 18, Next.js, Tailwind CSS, GSAP, HTML5 Canvas, 3D Web',
        'Backend, Data & Cloud:   Node.js, Express, Cloud Firestore, PostgreSQL, MongoDB, IndexedDB, Render',
        'Core CSE & Languages:    Data Structures & Algorithms, C++, C, Python, Java, JavaScript, Linux',
      ];
      break;

    case 'sudo hire moayed':
    case 'sudo hire moayed!':
    case 'hire moayed':
    case 'hire':
    case 'sudo hire':
    case './hire_moayed.sh':
      response = [
        '[AUTH GRANTED] Root authorization verified. Candidate prioritized!',
        'Dispatched contact ping to armabdur.rahman04@gmail.com. Available for software engineering internships & full-stack roles.',
      ];
      break;

    case 'clear':
    case 'cls':
      return { command: trimmed, output: [], isClear: true };

    case 'exit':
    case 'quit':
      return { command: trimmed, output: ['Closing interactive terminal session...'], isExit: true };

    case 'uname':
    case 'uname -a':
      response = [
        'Linux ewu-cse 6.8.0-generic #24-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
      ];
      break;

    case 'pwd':
      response = ['/home/moayed'];
      break;

    case 'ls':
    case 'dir':
      response = [
        '-rw-r--r-- 1 moayed ewu  482K resume.pdf',
        '-rw-r--r-- 1 moayed ewu  2.4K about-me.md',
        '-rwxr-xr-x 1 moayed ewu   512 hire_moayed.sh',
        '-rw-r--r-- 1 moayed ewu  1.8K projects.md',
      ];
      break;

    case 'cat resume':
    case 'cat resume.pdf':
    case 'resume':
      response = [
        'Abdur Rahman Moayed • B.Sc. in CSE @ East West University, Dhaka, Bangladesh (2022–2026)',
        'Click the "Download Resume (PDF)" button at the top of this view to download /resume.pdf.',
      ];
      break;

    case 'cat about':
    case 'cat about-me':
    case 'cat about-me.md':
    case 'about':
      response = [
        'Abdur Rahman Moayed (@watchknight) • Systems & Full-Stack Engineer.',
        'View the "2. About & Skills" tab for the full biography and capability grid.',
      ];
      break;

    default:
      response = [
        `bash: ${trimmed}: command not found. Type 'help' for available commands (whoami, projects, contact, clear).`,
      ];
      break;
  }

  return { command: trimmed, output: response };
}

export const ResumeView: React.FC<ResumeViewProps> = ({ palette }) => {
  const os = useRetroOS();
  const isAmber = os.isInsideProvider && os.phosphorMode === 'amber';
  const bright = palette?.bright ?? (isAmber ? '#d4a359' : '#c2cdb4');
  const voidCol = palette?.void ?? (isAmber ? '#140f07' : '#111712');
  const mid = palette?.mid ?? (isAmber ? '#8c6830' : '#6e7d62');
  const dim = palette?.dim ?? (isAmber ? '#3d2b12' : '#2e3b2b');

  // Email copy confirmation state
  const [isEmailCopied, setIsEmailCopied] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Download resume progress bar state
  const [downloadStep, setDownloadStep] = useState<number | null>(null);
  const downloadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interactive command prompt state (hidden by default)
  const [isCliOpen, setIsCliOpen] = useState<boolean>(false);
  const [cliInput, setCliInput] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [cliHistory, setCliHistory] = useState<CliHistoryItem[]>([
    {
      command: 'uname -a',
      output: [
        'Linux ewu-cse 6.8.0-generic #24-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
        'Type "help" for interactive commands (whoami, projects, contact, clear):',
      ],
    },
  ]);
  const cliInputRef = useRef<HTMLInputElement | null>(null);
  const cliScrollRef = useRef<HTMLDivElement | null>(null);

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
      if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  // Auto-scroll terminal history to bottom
  useEffect(() => {
    if (cliScrollRef.current) {
      cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
    }
  }, [cliHistory, isCliOpen]);

  const playClickSound = (freq: number = 720) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {
      // Safe audio trigger
    }
  };

  // Copy email address to clipboard with instant feedback and robust fallback
  const handleCopyEmail = async () => {
    const email = 'armabdur.rahman04@gmail.com';
    playClickSound(880);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      // Resilient fallback to execCommand for non-secure contexts or permission rejections
      try {
        if (typeof document !== 'undefined') {
          const textArea = document.createElement('textarea');
          textArea.value = email;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        }
      } catch {
        // Safe clipboard fallback
      }
    }

    setIsEmailCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setIsEmailCopied(false);
    }, 2500);
  };

  // Stepped pixel download progress bar simulation
  const handleStartDownload = () => {
    playClickSound(920);
    if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
    if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);

    setDownloadStep(1);
    let step = 1;

    downloadIntervalRef.current = setInterval(() => {
      step += 1;
      playClickSound(500 + step * 120);
      setDownloadStep(step);

      if (step >= 4) {
        if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
        downloadTimeoutRef.current = setTimeout(() => {
          setDownloadStep(null);
        }, 2500);
      }
    }, 180);
  };

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

  // Execute an interactive command prompt command
  const executeCliCommand = (cmdRaw: string) => {
    const result = processCliCommand(cmdRaw);
    if (!result) return;

    playClickSound(800);

    // Save to command history for arrow navigation
    setCommandHistory((prev) => [...prev, cmdRaw]);
    setHistoryIndex(-1);

    if (result.isExit) {
      setIsCliOpen(false);
      setCliInput('');
      return;
    }

    if (result.isClear) {
      setCliHistory([]);
      setCliInput('');
      return;
    }

    // Keep clean, self-contained 6-line command prompt history
    setCliHistory((prev) => [...prev, { command: result.command, output: result.output }].slice(-6));
    setCliInput('');
    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    focusTimeoutRef.current = setTimeout(() => {
      if (cliInputRef.current) cliInputRef.current.focus();
      focusTimeoutRef.current = null;
    }, 10);
  };

  const handleCliFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCliCommand(cliInput);
  };

  const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Isolate terminal keystrokes completely from global Retro OS shortcuts
    e.stopPropagation();

    if (e.key === 'Escape') {
      e.preventDefault();
      playClickSound(500);
      setIsCliOpen(false);
      return;
    }

    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeCliCommand('clear');
      return;
    }

    if (e.key === 'c' && (e.ctrlKey || e.metaKey) && cliInput) {
      e.preventDefault();
      setCliInput('');
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCliInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setCliInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCliInput(commandHistory[nextIdx]);
      }
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
        <span>3. Resume &amp; Contact</span>
        <span
          className="text-[7.5px] px-1 py-0.2 border"
          style={{ backgroundColor: dim, borderColor: mid, color: bright }}
        >
          Resume
        </span>
      </div>

      {/* 2. HIGH-CONVERSION TOP ACTION BAR: FOUR PROMINENT TACTILE PIXEL-BORDERED ACTION BUTTONS */}
      {/* Decision-critical actions are placed at the very top so they are never hidden */}
      <div
        data-testid="retro-resume-action-bar"
        className="p-2.5 sm:p-3 border flex flex-col gap-2.5"
        style={{ backgroundColor: `${dim}33`, borderColor: mid }}
      >
        <div
          className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-bold uppercase pb-1 border-b"
          style={{ borderColor: `${mid}50`, color: bright }}
        >
          <span>Direct Actions &amp; Contact</span>
          <span className="font-mono text-[7px]" style={{ color: mid }}>Verified Channels</span>
        </div>

        {/* Tactile Action Buttons Grid: 4 Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Button 1: Copy Email (armabdur.rahman04@gmail.com) */}
          <button
            type="button"
            title="Copy Email (armabdur.rahman04@gmail.com)"
            data-testid="retro-resume-copy-email-btn"
            onClick={handleCopyEmail}
            className="min-h-[44px] px-2.5 py-2 font-mono font-bold text-[9px] sm:text-[10px] border-2 uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2 text-center"
            style={{
              backgroundColor: isEmailCopied ? bright : `${dim}80`,
              color: isEmailCopied ? voidCol : bright,
              borderColor: bright,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>{isEmailCopied ? 'COPIED TO CLIPBOARD!' : 'Copy Email (armabdur.rahman04@gmail.com)'}</span>
          </button>

          {/* Button 2: LinkedIn Profile */}
          <a
            href="https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/"
            data-legacy-url="https://linkedin.com/in/watchknight"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn Profile"
            data-testid="retro-link-linkedin"
            onClick={() => playClickSound(760)}
            className="min-h-[44px] px-2.5 py-2 font-mono font-bold text-[9.5px] sm:text-[10.5px] border-2 uppercase cursor-pointer flex items-center justify-center text-center transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2"
            style={{
              backgroundColor: `${dim}60`,
              color: bright,
              borderColor: mid,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>LinkedIn Profile</span>
          </a>

          {/* Button 3: GitHub (@watchknight) */}
          <a
            href="https://github.com/watchknight"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub (@watchknight)"
            data-testid="retro-link-github"
            onClick={() => playClickSound(760)}
            className="min-h-[44px] px-2.5 py-2 font-mono font-bold text-[9.5px] sm:text-[10.5px] border-2 uppercase cursor-pointer flex items-center justify-center text-center transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2"
            style={{
              backgroundColor: `${dim}60`,
              color: bright,
              borderColor: mid,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>GitHub (@watchknight)</span>
          </a>

          {/* Button 4: Download Resume PDF */}
          <a
            href="/resume.pdf"
            download="Abdur_Rahman_Moayed_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="Download Resume (PDF)"
            aria-label="Download Resume PDF"
            data-action="Download Resume PDF"
            data-testid="retro-resume-download-btn"
            onClick={handleStartDownload}
            className="min-h-[44px] px-2.5 py-2 font-mono font-bold text-[9.5px] sm:text-[10.5px] border-2 uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2 text-center"
            style={{
              backgroundColor: bright,
              color: voidCol,
              borderColor: bright,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>Download Resume (PDF)</span>
          </a>
        </div>

        {/* INSTANT "COPIED TO CLIPBOARD!" CONFIRMATION BADGE */}
        {isEmailCopied && (
          <div
            data-testid="retro-email-copied-banner"
            className="p-2 border-2 flex items-center justify-between text-[8px] sm:text-[9px] font-bold animate-pulse font-mono"
            style={{
              backgroundColor: bright,
              color: voidCol,
              borderColor: bright,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>COPIED TO CLIPBOARD! armabdur.rahman04@gmail.com</span>
            <span className="text-[7.5px] uppercase font-mono">Ready to paste</span>
          </div>
        )}

        {/* DOWNLOAD RESUME STEPPED PROGRESS GAUGE */}
        {downloadStep !== null && (
          <div
            data-testid="retro-download-progress-bar"
            className="flex items-center gap-2 p-1.5 border font-mono text-[8px] sm:text-[8.5px]"
            style={{
              backgroundColor: voidCol,
              borderColor: bright,
              color: bright,
            }}
          >
            <span>DOWNLOADING RESUME.PDF:</span>
            <div className="flex items-center gap-0.5 w-24 h-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-full flex-1"
                  style={{
                    backgroundColor: i < downloadStep * 2.5 ? bright : dim,
                    border: `1px solid ${i < downloadStep * 2.5 ? bright : mid}`,
                  }}
                />
              ))}
            </div>
            <span className="font-bold">{getProgressGauge(downloadStep)}</span>
          </div>
        )}
      </div>

      {/* WIDESCREEN 2-COLUMN DASHBOARD (Education & Skills on Left, Interactive Terminal Panel on Right) */}
      <div
        data-testid="resume-widescreen-dashboard"
        className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-start"
      >
        {/* LEFT COLUMN: Education & Coursework Card + Skills Table */}
        <div className="flex flex-col gap-3.5 min-w-0">
          {/* 3. EDUCATION & COURSEWORK CARD */}
          <div
            data-testid="academic-coursework-card"
            className="p-3 sm:p-3.5 border flex flex-col gap-2"
            style={{ backgroundColor: `${dim}33`, borderColor: mid }}
          >
            <div
              className="flex items-center justify-between border-b pb-1 font-pixel text-[8.5px] sm:text-[9.5px] font-bold uppercase"
              style={{ borderColor: `${mid}60`, color: bright }}
            >
              <span>Education &amp; Coursework</span>
              <span className="font-mono text-[8px]" style={{ color: mid }}>East West University</span>
            </div>

            <div
              className="flex flex-col gap-2 font-body leading-relaxed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', lineHeight: 1.6 }}
            >
              <div>
                • <strong className="font-mono text-sm" style={{ color: mid }}>Degree:</strong>{' '}
                <span style={{ color: bright, fontWeight: 600 }}>
                  B.Sc. in Computer Science &amp; Engineering (2022–2026)
                </span>
              </div>
              <div>
                • <strong className="font-mono text-sm" style={{ color: mid }}>Institution:</strong>{' '}
                <span style={{ color: bright }}>
                  East West University (EWU), Dhaka, Bangladesh
                </span>
              </div>
              <div>
                • <strong className="font-mono text-sm" style={{ color: mid }}>Core Coursework:</strong>{' '}
                <span style={{ color: `${bright}dd` }}>
                  Data Structures &amp; Algorithms, Operating Systems, Database Systems, Software Engineering, and Object-Oriented Programming (C++/Java).
                </span>
              </div>
            </div>
          </div>

          {/* 4. KEY ENGINEERING HIGHLIGHTS CARD */}
          <div
            data-testid="key-engineering-highlights-card"
            className="p-3 sm:p-3.5 border flex flex-col gap-2.5"
            style={{ backgroundColor: `${dim}40`, borderColor: mid }}
          >
            <div
              className="flex items-center justify-between border-b pb-1 font-pixel text-[8.5px] sm:text-[9.5px] font-bold uppercase"
              style={{ borderColor: `${mid}60`, color: bright }}
            >
              <span>KEY ENGINEERING HIGHLIGHTS</span>
              <span className="font-mono text-[8px]" style={{ color: mid }}>Production Track Record</span>
            </div>

            <div
              className="flex flex-col gap-2.5 font-body leading-relaxed pt-0.5"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14.5px', lineHeight: 1.6 }}
            >
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs shrink-0 select-none" style={{ color: mid }}>•</span>
                <p style={{ color: bright }}>
                  Architected and deployed 7 live production web applications spanning algorithm visualization (BitForge), cognitive testing (FocusLab), 3D eyewear try-on (DocLensBD), and bilingual recipe matching (Rannabanna).
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs shrink-0 select-none" style={{ color: mid }}>•</span>
                <p style={{ color: bright }}>
                  Strong foundation in Data Structures, Algorithms, and Object-Oriented Programming (C++, Python, Java, TypeScript) with a focus on 60 FPS interactive UI performance.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs shrink-0 select-none" style={{ color: mid }}>•</span>
                <p style={{ color: bright }}>
                  Experienced in end-to-end full-stack delivery using React 18, Next.js, Node.js, Cloud Firestore, PostgreSQL, and automated CI/CD deployments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Terminal Panel */}
        <div className="flex flex-col gap-3.5 min-w-0">
          <div
            className="p-3 sm:p-3.5 border flex flex-col gap-2.5"
            style={{ backgroundColor: `${dim}33`, borderColor: mid }}
          >
            <div
              className="flex items-center justify-between border-b pb-1 font-pixel text-[8.5px] sm:text-[9.5px] font-bold uppercase"
              style={{ borderColor: `${mid}60`, color: bright }}
            >
              <div className="flex items-center gap-2">
                <span>Interactive Terminal</span>
                <span className="font-mono text-[8px]" style={{ color: mid }}>bash 5.2.21</span>
              </div>
              {isCliOpen && (
                <button
                  type="button"
                  data-testid="btn-hide-terminal"
                  aria-label="Hide Interactive Terminal"
                  title="Hide Terminal [Esc]"
                  onClick={() => {
                    playClickSound(500);
                    setIsCliOpen(false);
                  }}
                  className="px-2 py-0.5 border font-mono text-[7.5px] sm:text-[8px] uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
                  style={{ backgroundColor: dim, borderColor: bright, color: bright }}
                >
                  Hide Terminal
                </button>
              )}
            </div>

            {/* When CLI is collapsed: Open button and standby telemetry */}
            {!isCliOpen && (
              <>
                <button
                  type="button"
                  data-testid="btn-toggle-linux-cli"
                  aria-expanded={false}
                  aria-label="Open Interactive Terminal"
                  title="Open Interactive Terminal"
                  onClick={() => {
                    playClickSound(780);
                    setIsCliOpen(true);
                    if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
                    focusTimeoutRef.current = setTimeout(() => {
                      if (cliInputRef.current) cliInputRef.current.focus();
                      focusTimeoutRef.current = null;
                    }, 50);
                  }}
                  className="w-full py-2.5 px-3 border border-dashed font-mono text-[8.5px] sm:text-[9.5px] text-left cursor-pointer flex items-center justify-between transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2"
                  style={{
                    backgroundColor: `${dim}20`,
                    borderColor: mid,
                    color: bright,
                  }}
                >
                  <span className="font-bold">Open Interactive Terminal</span>
                  <span className="text-[7.5px] font-mono" style={{ color: mid }}>
                    + Open Interactive Terminal
                  </span>
                </button>

                <div
                  className="p-3 border flex flex-col gap-2 font-mono text-[8.5px] sm:text-[9.5px]"
                  style={{ backgroundColor: `${voidCol}80`, borderColor: `${mid}50` }}
                >
                  <div className="flex items-center justify-between text-[7.5px] uppercase" style={{ color: mid }}>
                    <span>SESSION: STANDBY</span>
                    <span>LOGIN: moayed@ewu-cse</span>
                  </div>
                  <p className="leading-relaxed" style={{ color: `${bright}cc` }}>
                    Interactive Linux environment with real command evaluation. Type <strong style={{ color: bright }}>whoami</strong>, <strong style={{ color: bright }}>projects</strong>, <strong style={{ color: bright }}>contact</strong>, <strong style={{ color: bright }}>skills</strong>, or <strong style={{ color: bright }}>sudo hire moayed</strong>.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 border-t" style={{ borderColor: `${mid}30` }}>
                    <span className="text-[7.5px] uppercase" style={{ color: mid }}>SHELL:</span>
                    <span className="text-[8px] font-bold" style={{ color: bright }}>Linux ewu-cse 6.8.0-generic x86_64</span>
                  </div>
                </div>
              </>
            )}

            {/* Self-Contained 6-Line Command Prompt (Hidden by default) */}
            {isCliOpen && (
              <div
                data-testid="interactive-linux-cli"
                tabIndex={-1}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    playClickSound(500);
                    setIsCliOpen(false);
                  }
                }}
                className="p-2.5 sm:p-3 border-2 flex flex-col gap-2 font-mono text-[9px] sm:text-[10px] outline-none"
                style={{
                  backgroundColor: voidCol,
                  borderColor: bright,
                  boxShadow: `2px 2px 0px 0px ${voidCol}`,
                }}
              >
                {/* Terminal Top Bar */}
                <div
                  className="flex items-center justify-between pb-1 border-b text-[7.5px] sm:text-[8px]"
                  style={{ borderColor: `${mid}50`, color: mid }}
                >
                  <span>moayed@ewu-cse:~ (bash 5.2.21) • Interactive Command Prompt</span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound(500);
                      setIsCliOpen(false);
                    }}
                    className="cursor-pointer hover:underline uppercase transition-none"
                    style={{ color: bright }}
                  >
                    Esc / Close
                  </button>
                </div>

                {/* Clean, self-contained 6-line command prompt history buffer */}
                <div
                  ref={cliScrollRef}
                  className="flex flex-col gap-1.5 overflow-y-auto max-h-[140px] pr-1"
                  style={{ color: `${bright}dd` }}
                >
                  {cliHistory.map((item, idx) => (
                    <div key={`${item.command}-${idx}`} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 font-bold" style={{ color: bright }}>
                        <span style={{ color: mid }}>moayed@ewu-cse:~$</span>
                        <span>{item.command}</span>
                      </div>
                      {item.output.map((outLine, lineIdx) => (
                        <div key={`${lineIdx}-${outLine.slice(0, 16)}`} className="pl-2 font-mono text-[8.5px] sm:text-[9.5px] leading-tight" style={{ color: `${bright}cc` }}>
                          {outLine}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Quick Command Action Chips for Instant One-Click Execution */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t" style={{ borderColor: `${mid}40` }}>
                  <span className="text-[7.5px] uppercase" style={{ color: mid }}>EXECUTE:</span>
                  {(['help', 'whoami', 'projects', 'contact', 'clear'] as const).map((cmd) => (
                    <button
                      key={cmd}
                      type="button"
                      data-testid={`cli-chip-${cmd}`}
                      onClick={() => executeCliCommand(cmd)}
                      className="px-1.5 py-0.5 border text-[7.5px] sm:text-[8px] font-mono cursor-pointer transition-none active:translate-y-[1px]"
                      style={{
                        backgroundColor: `${dim}60`,
                        borderColor: `${mid}70`,
                        color: bright,
                      }}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>

                {/* Interactive Terminal Input Prompt */}
                <form onSubmit={handleCliFormSubmit} className="flex items-center gap-1.5 pt-1 border-t" style={{ borderColor: `${mid}40` }}>
                  <span className="font-bold shrink-0 text-[8.5px] sm:text-[9.5px]" style={{ color: bright }}>
                    moayed@ewu-cse:~$
                  </span>
                  <input
                    ref={cliInputRef}
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    onKeyDown={handleCliKeyDown}
                    placeholder="type 'help', 'whoami', 'projects', 'contact', 'clear'..."
                    data-testid="cli-terminal-input"
                    className="flex-1 bg-transparent border-none outline-none font-mono text-[16px] text-current p-0 placeholder:opacity-40"
                    style={{ color: bright, fontSize: '16px' }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 border text-[7.5px] font-mono uppercase cursor-pointer"
                    style={{
                      backgroundColor: bright,
                      color: voidCol,
                      borderColor: bright,
                    }}
                  >
                    Enter ↵
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ResumeView;
