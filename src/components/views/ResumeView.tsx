import React, { useState, useRef, useEffect } from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
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
 * Pure evaluator for Linux CLI Easter egg commands
 * Supports: help, whoami, skills, projects, sudo hire moayed, clear, exit, ls, cat
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
        '  • whoami             - Developer identity, handle & university',
        '  • skills             - Engineering capabilities & core tech stack',
        '  • projects           - Flagship systems & interactive web labs',
        '  • sudo hire moayed   - Fast-track interview & contact dispatch',
        '  • clear              - Reset terminal history buffer',
        '  • exit               - Close interactive terminal session',
      ];
      break;

    case 'whoami':
      response = [
        'Abdur Rahman Moayed (@watchknight)',
        'B.Sc. in Computer Science & Engineering @ East West University (EWU), Dhaka',
        'Systems & Full-Stack Engineer | Coordinates: 23.7644° N, 90.4252° E (UTC+6)',
        'Email: moayed.cse@gmail.com | Portfolio: WATCHKNIGHT_OS SYS.96',
      ];
      break;

    case 'skills':
      response = [
        '[Systems & Core CSE]: C, C++, Ubuntu Linux, POSIX Shared Memory & IPC, Bash, Valgrind, GDB',
        '[Frontend & Web]:     TypeScript, React 18, Next.js, Tailwind CSS, HTML5 Canvas, GSAP',
        '[Backend & Cloud]:    Node.js, Express, PostgreSQL, MongoDB, Cloud Firestore, Docker',
      ];
      break;

    case 'projects':
      response = [
        '01. Mental Defrag        — Zero-gravity spatial cognitive workspace (Obsidian AST / WebGL)',
        '02. FocusGuard           — High-efficiency distraction interceptor (Manifest V3 / React)',
        '03. Neon Vanguard & POSIX— Real-time deterministic IPC arcade engine (C / POSIX SHM)',
        '04. DocLensBD            — Bilingual clinical transcription system (Next.js / Cloud Firestore)',
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
        'Dispatched contact ping to moayed.cse@gmail.com. Ready for internships & engineering roles.',
      ];
      break;

    case 'clear':
      return { command: trimmed, output: [], isClear: true };

    case 'exit':
    case 'quit':
      return { command: trimmed, output: ['Closing terminal session...'], isExit: true };

    case 'ls':
    case 'dir':
      response = [
        '-rw-r--r-- 1 moayed ewu  482K resume.pdf',
        '-rw-r--r-- 1 moayed ewu  2.4K about_me.txt',
        '-rwxr-xr-x 1 moayed ewu   512 hire_moayed.sh',
        '-rw-r--r-- 1 moayed ewu  1.8K projects.log',
      ];
      break;

    case 'cat resume':
    case 'cat resume.pdf':
    case 'cat resume.txt':
      response = [
        'Abdur Rahman Moayed — B.Sc. in CSE @ East West University, Dhaka (2022–2026)',
        'Click the [Download Resume (PDF)] action button above for the full PDF dossier.',
      ];
      break;

    case 'cat about':
    case 'cat about_me.txt':
      response = [
        'Abdur Rahman Moayed (@watchknight) — Systems & Full-Stack Engineer.',
        'View the [2] ABOUT & SKILLS tab for the full biography and capability grid.',
      ];
      break;

    default:
      response = [
        `bash: ${trimmed}: command not found. Type 'help' for available commands.`,
      ];
      break;
  }

  return { command: trimmed, output: response };
}

export const ResumeView: React.FC<ResumeViewProps> = ({ palette }) => {
  const bright = palette?.bright ?? '#c2cdb4';
  const voidCol = palette?.void ?? '#111712';
  const mid = palette?.mid ?? '#6e7d62';
  const dim = palette?.dim ?? '#2e3b2b';

  // Email copy confirmation state
  const [isEmailCopied, setIsEmailCopied] = useState<boolean>(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Download resume progress bar state
  const [downloadStep, setDownloadStep] = useState<number | null>(null);
  const downloadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interactive Linux CLI state (hidden by default)
  const [isCliOpen, setIsCliOpen] = useState<boolean>(false);
  const [cliInput, setCliInput] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [cliHistory, setCliHistory] = useState<CliHistoryItem[]>([
    {
      command: 'uname -a',
      output: [
        'Linux ewu-cse 6.8.0-generic #24-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
        'Type "help" for interactive commands, or select a command below:',
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
    };
  }, []);

  // Auto-scroll terminal history to bottom
  useEffect(() => {
    if (cliScrollRef.current) {
      cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
    }
  }, [cliHistory]);

  const playClickSound = (freq: number = 720) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {
      // Safe audio trigger
    }
  };

  // Copy email address to clipboard with instant feedback and robust fallback
  const handleCopyEmail = async () => {
    const email = 'moayed.cse@gmail.com';
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
    }, 3500);
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

  // Execute an interactive Linux CLI command
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

    setCliHistory((prev) => [...prev, { command: result.command, output: result.output }].slice(-6));
    setCliInput('');
  };

  const handleCliFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCliCommand(cliInput);
  };

  const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      playClickSound(500);
      setIsCliOpen(false);
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
        <span>=== [3] RESUME // RESUME_CV.DOC ===</span>
        <span
          className="text-[7.5px] px-1 py-0.2 border"
          style={{ backgroundColor: dim, borderColor: mid, color: bright }}
        >
          DOSSIER_v4.96
        </span>
      </div>

      {/* 2. HIGH-CONVERSION TOP ACTION BAR: THREE LARGE, TACTILE PIXEL-BORDERED ACTION BUTTONS */}
      {/* Decisions-critical actions are placed at the very top so they are never hidden */}
      <div
        data-testid="retro-resume-action-bar"
        className="p-2 sm:p-2.5 border flex flex-col gap-2"
        style={{ backgroundColor: `${dim}33`, borderColor: mid }}
      >
        <div
          className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-bold uppercase pb-1 border-b"
          style={{ borderColor: `${mid}50`, color: bright }}
        >
          <span>&gt; DIRECT ACTIONS // ZERO-FRICTION CONTACT</span>
          <span className="font-mono text-[7px]" style={{ color: mid }}>PRIMARY_DISPATCH</span>
        </div>

        {/* Tactile Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Button 1: [Download Resume (PDF)] */}
          <a
            href="/resume.pdf"
            download="Abdur_Rahman_Moayed_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="[↓ DOWNLOAD RESUME.PDF]"
            data-testid="retro-resume-download-btn"
            onClick={handleStartDownload}
            className="min-h-[44px] px-3 py-2 font-mono font-bold text-[11px] sm:text-[12px] border-2 uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2"
            style={{
              backgroundColor: bright,
              color: voidCol,
              borderColor: bright,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>[Download Resume (PDF)]</span>
          </a>

          {/* Button 2: [Copy Email Address] */}
          <button
            type="button"
            title="[COPY_EMAIL.EXE]"
            data-testid="retro-resume-copy-email-btn"
            onClick={handleCopyEmail}
            className="min-h-[44px] px-3 py-2 font-mono font-bold text-[11px] sm:text-[12px] border-2 uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2"
            style={{
              backgroundColor: isEmailCopied ? bright : `${dim}80`,
              color: isEmailCopied ? voidCol : bright,
              borderColor: bright,
              boxShadow: `2px 2px 0px 0px ${voidCol}`,
            }}
          >
            <span>{isEmailCopied ? '[✓ Copied to Clipboard!]' : '[Copy Email Address]'}</span>
          </button>

          {/* Button 3: [GitHub: @watchknight] plus [LinkedIn] */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://github.com/watchknight"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="retro-link-github"
              onClick={() => playClickSound(760)}
              className="min-h-[44px] px-2 py-2 font-mono font-bold text-[10px] sm:text-[11px] border-2 uppercase cursor-pointer flex items-center justify-center text-center transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2"
              style={{
                backgroundColor: `${dim}60`,
                color: bright,
                borderColor: mid,
                boxShadow: `2px 2px 0px 0px ${voidCol}`,
              }}
            >
              <span>[GitHub: @watchknight]</span>
            </a>

            <a
              href="https://linkedin.com/in/watchknight"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="retro-link-linkedin"
              onClick={() => playClickSound(760)}
              className="min-h-[44px] px-2 py-2 font-mono font-bold text-[10px] sm:text-[11px] border-2 uppercase cursor-pointer flex items-center justify-center text-center transition-none active:translate-x-[1px] active:translate-y-[1px] outline-none focus-visible:outline-dashed focus-visible:outline-2"
              style={{
                backgroundColor: `${dim}60`,
                color: bright,
                borderColor: mid,
                boxShadow: `2px 2px 0px 0px ${voidCol}`,
              }}
            >
              <span>[LinkedIn]</span>
            </a>
          </div>
        </div>

        {/* INSTANT COPIED EMAIL CONFIRMATION BANNER */}
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
            <span>[Copied to Clipboard!] moayed.cse@gmail.com</span>
            <span className="text-[7.5px] uppercase font-mono">[READY TO PASTE]</span>
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

      {/* 3. ACADEMIC & COURSEWORK CARD */}
      <div
        data-testid="academic-coursework-card"
        className="p-3 sm:p-3.5 border flex flex-col gap-2"
        style={{ backgroundColor: `${dim}33`, borderColor: mid }}
      >
        <div
          className="flex items-center justify-between border-b pb-1 font-pixel text-[8.5px] sm:text-[9.5px] font-bold uppercase"
          style={{ borderColor: `${mid}60`, color: bright }}
        >
          <span>ACADEMIC PROFILE // ACADEMIC LEDGER</span>
          <span className="font-mono text-[8px]" style={{ color: mid }}>RECORD_ID #EWU-CSE-2026</span>
        </div>

        <div
          className="flex flex-col gap-2 font-body leading-relaxed"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14.5px', lineHeight: 1.65 }}
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
            • <strong className="font-mono text-sm" style={{ color: mid }}>Core Systems Coursework:</strong>{' '}
            <span style={{ color: `${bright}dd` }}>
              Operating Systems, Systems Programming, Data Structures &amp; Algorithms, Database Systems, Software Engineering,
              Computer Architecture, Object-Oriented Programming (C++/Java), and Computer Networks.
            </span>
          </div>
        </div>
      </div>

      {/* 4. TECHNICAL MATRIX (CATEGORIZED MONOCHROME PIXEL TABLE) */}
      <div
        className="p-3 sm:p-3.5 border flex flex-col gap-2"
        style={{ backgroundColor: `${dim}40`, borderColor: mid }}
      >
        <div
          className="flex items-center justify-between border-b pb-1 font-pixel text-[8.5px] sm:text-[9.5px] font-bold uppercase"
          style={{ borderColor: `${mid}60`, color: bright }}
        >
          <span>TECHNICAL SKILLS BREAKDOWN // TECHNICAL MATRIX</span>
          <span className="font-mono text-[8px]" style={{ color: mid }}>BYTECODE MATRIX</span>
        </div>

        {/* Retro Pixel Table */}
        <div className="flex flex-col border font-mono text-[11px] sm:text-[12px]" style={{ borderColor: `${mid}50` }}>
          {/* Row 1: Languages */}
          <div className="flex flex-col sm:flex-row border-b" style={{ borderColor: `${mid}40` }}>
            <div
              className="sm:w-44 p-2 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r font-mono"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              LANGUAGES
            </div>
            <div className="p-2 flex-1 font-mono" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              C, C++, TypeScript, JavaScript, Python, Go, Rust, SQL, Bash (Linux)
            </div>
          </div>

          {/* Row 2: Frameworks & Libs */}
          <div className="flex flex-col sm:flex-row border-b" style={{ borderColor: `${mid}40` }}>
            <div
              className="sm:w-44 p-2 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r font-mono"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              FRAMEWORKS &amp; LIBS
            </div>
            <div className="p-2 flex-1 font-mono" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              React 18, Next.js, Vite, Tailwind CSS, Three.js, GSAP ScrollTrigger
            </div>
          </div>

          {/* Row 3: Databases & Cloud */}
          <div className="flex flex-col sm:flex-row border-b" style={{ borderColor: `${mid}40` }}>
            <div
              className="sm:w-44 p-2 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r font-mono"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              DATABASES &amp; CLOUD
            </div>
            <div className="p-2 flex-1 font-mono" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              PostgreSQL, MongoDB, Cloud Firestore, Firebase Auth, IndexedDB, Redis
            </div>
          </div>

          {/* Row 4: Linux & Tooling */}
          <div className="flex flex-col sm:flex-row">
            <div
              className="sm:w-44 p-2 font-bold uppercase shrink-0 border-b sm:border-b-0 sm:border-r font-mono"
              style={{ backgroundColor: `${dim}60`, borderColor: `${mid}40`, color: bright }}
            >
              LINUX &amp; TOOLING
            </div>
            <div className="p-2 flex-1 font-mono" style={{ backgroundColor: `${voidCol}60`, color: `${bright}dd` }}>
              Ubuntu Linux, POSIX Shared Memory &amp; Pipes, Git, GitHub Actions CI/CD
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE LINUX CLI TOGGLE & 6-LINE TERMINAL (Hidden by default) */}
      <div className="pt-1 flex flex-col gap-2">
        {/* Toggle Button */}
        <button
          type="button"
          data-testid="btn-toggle-linux-cli"
          onClick={() => {
            playClickSound(780);
            setIsCliOpen((prev) => !prev);
            setTimeout(() => {
              if (cliInputRef.current) cliInputRef.current.focus();
            }, 50);
          }}
          className="w-full py-2 px-3 border border-dashed font-mono text-[8.5px] sm:text-[9.5px] text-left cursor-pointer flex items-center justify-between transition-none outline-none focus-visible:outline-dashed focus-visible:outline-2"
          style={{
            backgroundColor: isCliOpen ? `${dim}60` : `${dim}20`,
            borderColor: isCliOpen ? bright : mid,
            color: bright,
          }}
        >
          <span className="font-bold">[Launch Interactive Linux CLI (moayed@ewu-cse)]</span>
          <span className="text-[7.5px] font-mono" style={{ color: mid }}>
            {isCliOpen ? '[− HIDE CLI]' : '[+ EXPAND CLI]'}
          </span>
        </button>

        {/* 6-Line Self-Contained Interactive Command Prompt (Visible only when expanded) */}
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
              <span>moayed@ewu-cse:~ (bash 5.2.21) [6-LINE TTY]</span>
              <button
                type="button"
                onClick={() => {
                  playClickSound(500);
                  setIsCliOpen(false);
                }}
                className="cursor-pointer hover:underline uppercase transition-none"
                style={{ color: bright }}
              >
                ESC / [X] CLOSE
              </button>
            </div>

            {/* Terminal History Display (Bounded to 6 entries with auto-scroll) */}
            <div
              ref={cliScrollRef}
              className="flex flex-col gap-1.5 overflow-y-auto max-h-[140px] pr-1"
              style={{ color: `${bright}dd` }}
            >
              {cliHistory.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 font-bold" style={{ color: bright }}>
                    <span style={{ color: mid }}>moayed@ewu-cse:~$</span>
                    <span>{item.command}</span>
                  </div>
                  {item.output.map((outLine, lineIdx) => (
                    <div key={lineIdx} className="pl-2 font-mono text-[8.5px] sm:text-[9.5px] leading-tight" style={{ color: `${bright}cc` }}>
                      {outLine}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Quick Command Action Chips for Instant One-Click Execution */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t" style={{ borderColor: `${mid}40` }}>
              <span className="text-[7.5px] uppercase" style={{ color: mid }}>EXECUTE:</span>
              {(['help', 'whoami', 'skills', 'projects', 'sudo hire moayed', 'clear'] as const).map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  data-testid={`cli-chip-${cmd.replace(/\s+/g, '-')}`}
                  onClick={() => executeCliCommand(cmd)}
                  className="px-1.5 py-0.5 border text-[7.5px] sm:text-[8px] font-mono cursor-pointer transition-none active:translate-y-[1px]"
                  style={{
                    backgroundColor: `${dim}60`,
                    borderColor: `${mid}70`,
                    color: bright,
                  }}
                >
                  [{cmd}]
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
                placeholder="type 'help', 'skills', 'sudo hire moayed'..."
                data-testid="cli-terminal-input"
                className="flex-1 bg-transparent border-none outline-none font-mono text-[9px] sm:text-[10px] text-current p-0 placeholder:opacity-40"
                style={{ color: bright }}
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
                ENTER ↵
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

export default ResumeView;
