import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useLenis } from '../hooks/useLenis';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { 
  Terminal as TerminalIcon, 
  Send, 
  CornerDownLeft, 
  RefreshCcw, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface TerminalEntry {
  id: string;
  command: string;
  output: React.ReactNode;
  timestamp: string;
  isError?: boolean;
}

// Particle class for celebratory confetti
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'ribbon';
  alpha: number;
}

const CONFETTI_COLORS = [
  '#DF6C4F', // Burnt coral focal accent
  '#A74024', // Terracotta rust primary accent
  '#F4F3EF', // Alabaster light
  '#575B5F', // Muted slate
  '#C24D2D', // Deep rust
  '#FFFFFF', // White
];

export const TerminalLab: React.FC = () => {
  const { scrollTo } = useLenis();
  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showShaderPulse, setShowShaderPulse] = useState(false);
  const [activeChipAnimation, setActiveChipAnimation] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeTickerFnRef = useRef<((now: number) => void) | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const savedDraftRef = useRef<string>('');
  const tabCycleRef = useRef<{ prefix: string; index: number; matches: string[] }>({
    prefix: '',
    index: 0,
    matches: [],
  });

  // Initial welcome message
  const initialHistory: TerminalEntry[] = [
    {
      id: 'init-1',
      command: 'whoami',
      timestamp: '00:00:01',
      output: (
        <div className="space-y-1 font-mono text-fluid-mono">
          <div className="text-cyan-mint font-semibold">
            Abdur Rahman Moayed — Computer Science & Engineering Undergraduate
          </div>
          <div className="text-slate-300">
            East West University, Dhaka, Bangladesh (UTC+6) • Full-Stack Web Architect & Low-Level Systems Engineer
          </div>
          <div className="text-slate-400 text-fluid-micro">
            Specializing in POSIX shared-memory pipelines, Linux syscall architectures, and 120 FPS kinetic web frontends.
          </div>
        </div>
      ),
    },
    {
      id: 'init-2',
      command: 'help',
      timestamp: '00:00:02',
      output: (
        <div className="text-slate-300 font-mono text-fluid-mono space-y-1">
          <div className="text-amber-warm font-semibold mb-1">AVAILABLE TELEMETRY DIRECTIVES:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-fluid-micro">
            <div><span className="text-cyan-mint font-bold">help</span> — List available terminal commands</div>
            <div><span className="text-cyan-mint font-bold">whoami</span> — Display bio, university & credentials</div>
            <div><span className="text-cyan-mint font-bold">skills</span> — Render ASCII progress bar competency chart</div>
            <div><span className="text-cyan-mint font-bold">projects</span> — List flagship architectures with repo links</div>
            <div><span className="text-cyan-mint font-bold">github</span> — Open GitHub (@watchknight) in new tab</div>
            <div><span className="text-cyan-mint font-bold">clear</span> — Flush terminal history buffer</div>
            <div className="sm:col-span-2 text-amber-warm font-semibold pt-1">
              <span className="text-emerald-400 font-bold">sudo hire moayed</span> — Trigger talent acquisition & transmission
            </div>
          </div>
        </div>
      ),
    },
  ];

  const [history, setHistory] = useState<TerminalEntry[]>(initialHistory);
  const [commandHistory, setCommandHistory] = useState<string[]>(['whoami', 'help']);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  // Auto-scroll to bottom of output on change
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [history]);

  // Global listener for focus-terminal custom event (from Hero.tsx or Ctrl + ~)
  useEffect(() => {
    const handleFocusTerminal = () => {
      setIsMinimized(false);
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 50);
    };
    window.addEventListener('focus-terminal', handleFocusTerminal);
    return () => window.removeEventListener('focus-terminal', handleFocusTerminal);
  }, []);

  // Confetti Particle Burst Animation with high-DPI retina scaling
  const fireConfetti = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: ConfettiParticle[] = [];
    const particleCount = 180;

    // Spawn dual cannons from bottom left and right
    for (let i = 0; i < particleCount; i++) {
      const isLeft = i % 2 === 0;
      const startX = isLeft ? window.innerWidth * 0.2 : window.innerWidth * 0.8;
      const startY = window.innerHeight * 0.85;

      const angle = isLeft 
        ? -Math.PI / 3 + (Math.random() - 0.5) * 0.8
        : -2 * Math.PI / 3 + (Math.random() - 0.5) * 0.8;

      const speed = 14 + Math.random() * 22;

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'ribbon',
        alpha: 1,
      });
    }

    const startTime = performance.now();
    const duration = 3800; // 3.8s celebration

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.48; // gravity
        p.vx *= 0.985; // drag
        p.rotation += p.vRot;

        if (elapsed > 2000) {
          p.alpha = Math.max(0, 1 - (elapsed - 2000) / 1800);
        }

        if (p.alpha > 0 && p.y < window.innerHeight + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size * 0.7, -p.size * 0.25, p.size * 1.4, p.size * 0.4);
          }

          ctx.restore();
        }
      }

      if (!alive || elapsed >= duration) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        gsap.ticker.remove(render);
        activeTickerFnRef.current = null;
      }
    };

    if (activeTickerFnRef.current) {
      gsap.ticker.remove(activeTickerFnRef.current);
    }
    activeTickerFnRef.current = render;
    gsap.ticker.add(render);
  }, []);

  // Clean up canvas animation and pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (activeTickerFnRef.current) {
        gsap.ticker.remove(activeTickerFnRef.current);
        activeTickerFnRef.current = null;
      }
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Format Skills Command Output: ASCII Progress Bar Chart
  const renderSkillsOutput = () => {
    return (
      <div className="font-mono text-fluid-micro leading-relaxed space-y-4 py-1 select-text">
        <div className="text-cyan-mint border-b border-white/10 pb-2">
          ┌──────────────────────────────────────────────────────────────────┐<br />
          │  EAST WEST UNIVERSITY CSE LABS • FULL-SPECTRUM SYSTEMS TELEMETRY  │<br />
          └──────────────────────────────────────────────────────────────────┘
        </div>

        {/* Section 1: Frontend */}
        <div className="space-y-1">
          <div className="text-cyan-mint font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>[ LAYER 01: FRONTEND & MOTION ]</span>
          </div>
          <div className="text-slate-300">
            React                 <span className="text-cyan-mint">[████████████████████]</span> <span className="text-emerald-400 font-bold">96%</span>  • Server Components & Concurrent State
          </div>
          <div className="text-slate-300">
            TypeScript            <span className="text-cyan-mint">[██████████████████░░]</span> <span className="text-emerald-400 font-bold">94%</span>  • Strict Generics, AST Verification
          </div>
          <div className="text-slate-300">
            GSAP                  <span className="text-cyan-mint">[████████████████████]</span> <span className="text-emerald-400 font-bold">96%</span>  • ScrollTrigger Inertial Scrubbing
          </div>
          <div className="text-slate-300">
            Tailwind CSS          <span className="text-cyan-mint">[████████████████████]</span> <span className="text-emerald-400 font-bold">98%</span>  • Fluid Glassmorphic Design Token
          </div>
        </div>

        {/* Section 2: Backend */}
        <div className="space-y-1">
          <div className="text-amber-warm font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>[ LAYER 02: BACKEND & DISTRIBUTED DATA ]</span>
          </div>
          <div className="text-slate-300">
            Node.js               <span className="text-amber-warm">[██████████████████░░]</span> <span className="text-emerald-400 font-bold">92%</span>  • Event Loop, Async Stream Processing
          </div>
          <div className="text-slate-300">
            Express               <span className="text-amber-warm">[██████████████████░░]</span> <span className="text-emerald-400 font-bold">90%</span>  • REST Routing & Middleware Pipelines
          </div>
          <div className="text-slate-300">
            PostgreSQL            <span className="text-amber-warm">[█████████████████░░░]</span> <span className="text-emerald-400 font-bold">88%</span>  • Relational Schemas, ACID & Query Opt
          </div>
          <div className="text-slate-300">
            MongoDB               <span className="text-amber-warm">[█████████████████░░░]</span> <span className="text-emerald-400 font-bold">86%</span>  • Document Stores & Aggregation Pipelines
          </div>
          <div className="text-slate-300">
            Cloud Firestore       <span className="text-amber-warm">[████████████████████]</span> <span className="text-emerald-400 font-bold">94%</span>  • Real-time Snapshot Stream & Security
          </div>
        </div>

        {/* Section 3: Systems */}
        <div className="space-y-1">
          <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>[ LAYER 03: SYSTEMS & LOW-LEVEL CSE ]</span>
          </div>
          <div className="text-slate-300">
            C                     <span className="text-emerald-400">[██████████████████░░]</span> <span className="text-emerald-400 font-bold">92%</span>  • Pointer Arithmetic & Valgrind Audits
          </div>
          <div className="text-slate-300">
            C++                   <span className="text-emerald-400">[██████████████████░░]</span> <span className="text-emerald-400 font-bold">90%</span>  • Low-Latency Algorithms & System Models
          </div>
          <div className="text-slate-300">
            Linux                 <span className="text-emerald-400">[███████████████████░]</span> <span className="text-emerald-400 font-bold">95%</span>  • Ubuntu Toolchains & Syscall Ops
          </div>
          <div className="text-slate-300">
            Bash                  <span className="text-emerald-400">[██████████████████░░]</span> <span className="text-emerald-400 font-bold">92%</span>  • Shell Scripting & Host Automation
          </div>
          <div className="text-slate-300">
            OS IPC                <span className="text-emerald-400">[████████████████████]</span> <span className="text-emerald-400 font-bold">94%</span>  • Pipes, Shared Memory & fork() Trees
          </div>
        </div>

        <div className="text-slate-500 border-t border-white/5 pt-2 text-[11px]">
          [OK] 100% Deterministic Verification • Memory Leaks: 0 • Frame Pacing: 60/120 FPS
        </div>
      </div>
    );
  };

  // Format Projects Command Output
  const renderProjectsOutput = () => {
    return (
      <div className="font-mono text-fluid-micro space-y-3 py-1">
        <div className="text-amber-warm font-semibold border-b border-white/10 pb-1.5 flex items-center justify-between">
          <span>FLAGSHIP ARCHITECTURAL DEPLOYMENTS (Click any title or link):</span>
          <span className="text-slate-400 text-[10px]">5 verified builds</span>
        </div>

        {PORTFOLIO_DATA.projects.map((proj, idx) => (
          <div 
            key={proj.id} 
            className="p-2.5 rounded-lg bg-obsidian-surface/60 border border-white/5 hover:border-cyan-mint/40 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <a
                href={proj.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-mint hover:text-white font-bold flex items-center gap-1.5 text-fluid-mono transition-colors"
              >
                <span>{`0${idx + 1}.`} {proj.title}</span>
                <ExternalLink className="w-3 h-3 text-cyan-mint" />
              </a>
              <span className="text-slate-400 text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5">
                {proj.category}
              </span>
            </div>

            <p className="text-slate-300 text-fluid-micro leading-relaxed mb-1.5">
              {proj.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/5">
              <div className="flex flex-wrap gap-1">
                {proj.tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-slate-400 px-1 rounded bg-black/40">
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href={proj.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-warm hover:text-white text-[11px] font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>View GitHub Repository</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Main Command Execution Handler
  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    // Normalize multiple whitespace sequences: 'sudo   hire   moayed' -> 'sudo hire moayed'
    const normalized = trimmed.replace(/\s+/g, ' ');
    const lower = normalized.toLowerCase();
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Handle 'clear' command
    if (lower === 'clear') {
      setHistory([]);
      setInputVal('');
      setCommandHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
      setHistoryPointer(-1);
      savedDraftRef.current = '';
      return;
    }

    let outputNode: React.ReactNode = null;
    let isError = false;

    // Handle 'sudo hire moayed' command
    if (lower === 'sudo hire moayed') {
      // 1. Visual rewards: Confetti & Screen Shader Pulse
      fireConfetti();
      setShowShaderPulse(true);
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = window.setTimeout(() => setShowShaderPulse(false), 2400);

      // 2. Dispatch custom event to pre-fill ContactSection
      const hireMessage = "Hi Abdur Rahman Moayed, I executed 'sudo hire moayed' in your Systems & Terminal Lab! I'm impressed by your systems and full-stack work and would love to discuss an engineering role with our team.";
      window.dispatchEvent(
        new CustomEvent('prefill-contact', {
          detail: {
            message: hireMessage,
          },
        })
      );

      // 3. Smooth scroll down to #contact with Lenis
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollTo('#contact', { offset: -90 });
      }, 300);

      outputNode = (
        <div className="p-3.5 rounded-xl bg-cyan-mint/10 border border-cyan-mint/30 space-y-2 text-fluid-mono">
          <div className="flex items-center gap-2 text-cyan-mint font-bold">
            <ShieldCheck className="w-4 h-4 text-cyan-mint" />
            <span>[AUTHENTICATION SUCCESSFUL] Elevating process to Ring-0 Root...</span>
          </div>
          <div className="text-white font-semibold">
            🎉 TALENT ACQUISITION PROTOCOL ACTIVATED!
          </div>
          <div className="text-slate-300 text-fluid-micro leading-relaxed">
            Candidate: <strong className="text-cyan-mint">Abdur Rahman Moayed</strong> (CSE @ East West University)<br />
            Status: <span className="text-emerald-400 font-bold">HIRE APPROVED</span> • Firing celebratory confetti & shader pulse.<br />
            Routing encrypted transmission directly to Dhaka HQ (#contact)...
          </div>
          <div className="pt-2 border-t border-cyan-mint/20 flex items-center justify-between text-fluid-micro">
            <span className="text-amber-warm animate-pulse">
              ⚡ Pre-filling transmission dispatch form...
            </span>
            <button
              onClick={() => scrollTo('#contact', { offset: -80 })}
              className="px-2.5 py-1 rounded bg-cyan-mint text-obsidian font-bold text-[11px] hover:bg-white transition-colors"
            >
              Jump to Contact Form ↓
            </button>
          </div>
        </div>
      );
    } 
    // Handle 'help' command
    else if (lower === 'help') {
      outputNode = (
        <div className="text-slate-300 font-mono text-fluid-mono space-y-2 select-text">
          <div className="text-amber-warm font-semibold flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-amber-warm" />
            <span>UBUNTU 24.04 SYSTEMS SHELL DIRECTIVES:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-fluid-micro pl-2">
            <div><code className="text-cyan-mint font-bold">help</code> — Print this directive directory</div>
            <div><code className="text-cyan-mint font-bold">whoami</code> — Print engineer bio & East West University credentials</div>
            <div><code className="text-cyan-mint font-bold">skills</code> — Render ASCII progress bar competency chart</div>
            <div><code className="text-cyan-mint font-bold">projects</code> — Display flagship project cards with repository links</div>
            <div><code className="text-cyan-mint font-bold">github</code> — Open https://github.com/watchknight in new tab</div>
            <div><code className="text-cyan-mint font-bold">clear</code> — Flush terminal output buffer</div>
            <div className="md:col-span-2 pt-1 text-emerald-400 font-semibold">
              <code className="text-emerald-400 font-bold">sudo hire moayed</code> — Trigger celebratory confetti pulse & pre-fill contact form
            </div>
            <div><code className="text-slate-400">dhaka</code> — Live Dhaka (UTC+6) time & coordinates</div>
            <div><code className="text-slate-400">uname -a</code> — Inspect kernel release & host telemetry</div>
            <div><code className="text-slate-400">uptime</code> — Systems uptime & benchmark pacing</div>
            <div><code className="text-slate-400">neofetch</code> — Render system specifications matrix</div>
          </div>

          <div className="text-slate-500 text-[11px] pt-1 border-t border-white/5">
            Tip: Press [Tab] to autocomplete, [↑/↓] for history, or click the quick chips below.
          </div>
        </div>
      );
    } 
    // Handle 'whoami' command
    else if (lower === 'whoami') {
      outputNode = (
        <div className="p-3.5 rounded-xl bg-obsidian-surface/80 border border-white/10 space-y-2 select-text">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="font-display font-bold text-fluid-h3 text-white">
                Abdur Rahman Moayed
              </span>
              <span className="text-cyan-mint font-mono text-fluid-sm ml-2">(@watchknight)</span>
            </div>
            <span className="font-mono text-fluid-micro px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              ● Available for Roles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-fluid-micro font-mono pt-1">
            <div>
              <span className="text-slate-500 uppercase tracking-wider block">Academic Anchor</span>
              <span className="text-slate-200 font-semibold">Computer Science & Engineering (CSE)</span>
              <span className="text-slate-400 block">East West University, Dhaka, Bangladesh</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block">Core Specialism</span>
              <span className="text-slate-200 font-semibold">Full-Stack Web Architect & Systems Engineer</span>
              <span className="text-slate-400 block">C, C++, POSIX IPC, Linux, React & GSAP</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block">Operational Base</span>
              <span className="text-slate-200">Dhaka, Bangladesh (UTC+6 • 23.8103° N, 90.4125° E)</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block">GitHub Coordinates</span>
              <a
                href="https://github.com/watchknight"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-mint hover:underline flex items-center gap-1 font-semibold"
              >
                <span>github.com/watchknight</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-slate-300 text-fluid-sm font-body pt-2 border-t border-white/5 leading-relaxed">
            &ldquo;From POSIX shared-memory pipelines in C and Linux kernel workflows to zero-gravity TypeScript &amp; GSAP web applications.&rdquo;
          </p>
        </div>
      );
    } 
    // Handle 'skills' command
    else if (lower === 'skills') {
      outputNode = renderSkillsOutput();
    } 
    // Handle 'projects' command
    else if (lower === 'projects') {
      outputNode = renderProjectsOutput();
    } 
    // Handle 'github' command
    else if (lower === 'github') {
      try {
        window.open('https://github.com/watchknight', '_blank', 'noopener,noreferrer');
      } catch {
        // Fallback if popup blocker intervenes
      }

      outputNode = (
        <div className="space-y-1 font-mono text-fluid-mono">
          <div className="text-cyan-mint flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Redirecting to GitHub profile (@watchknight) in new tab...</span>
          </div>
          <div className="text-slate-400 text-fluid-micro">
            Direct link: {' '}
            <a
              href="https://github.com/watchknight"
              target="_blank"
              rel="noreferrer"
              className="text-amber-warm hover:underline font-semibold"
            >
              https://github.com/watchknight
            </a>
          </div>
        </div>
      );
    } 
    // Handle 'dhaka' command
    else if (lower === 'dhaka') {
      const dhakaTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        dateStyle: 'full',
        timeStyle: 'medium',
      });
      outputNode = (
        <div className="font-mono text-fluid-mono space-y-1">
          <div className="text-cyan-mint">Operational Hub: Dhaka, Bangladesh (East West University)</div>
          <div className="text-slate-300">Live Telemetry: {dhakaTime} (UTC+6)</div>
          <div className="text-slate-400 text-fluid-micro">
            Global Overlap: UTC+0 London/Europe (afternoon overlap), UTC+5:30 APAC (full overlap), UTC-5 US East (morning overlap).
          </div>
        </div>
      );
    }
    // Handle 'uname' or 'uname -a'
    else if (lower === 'uname' || lower === 'uname -a') {
      outputNode = (
        <div className="font-mono text-fluid-mono text-slate-300">
          Linux ewu-cse 6.8.0-48-generic #48-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux
        </div>
      );
    }
    // Handle 'uptime'
    else if (lower === 'uptime') {
      outputNode = (
        <div className="font-mono text-fluid-mono text-slate-300">
          up 48 days, 14:22, 1 user, load average: 0.08, 0.04, 0.01 (East West University node stable)
        </div>
      );
    }
    // Handle 'neofetch'
    else if (lower === 'neofetch') {
      outputNode = (
        <div className="font-mono text-fluid-micro leading-relaxed text-slate-300 space-y-1">
          <div className="text-cyan-mint font-bold">moayed@ewu-cse</div>
          <div className="text-slate-500">-------------</div>
          <div><strong className="text-amber-warm">OS:</strong> Ubuntu 24.04.1 LTS x86_64</div>
          <div><strong className="text-amber-warm">Host:</strong> East West University CSE Systems Node</div>
          <div><strong className="text-amber-warm">Kernel:</strong> 6.8.0-48-generic</div>
          <div><strong className="text-amber-warm">Uptime:</strong> 48 days, 14 hours</div>
          <div><strong className="text-amber-warm">Shell:</strong> bash 5.2.21</div>
          <div><strong className="text-amber-warm">Terminal:</strong> FolioPort Dark Glass Ubuntu Shell</div>
          <div><strong className="text-amber-warm">CPU:</strong> x86_64 Multiprocessor (POSIX fork enabled)</div>
          <div><strong className="text-amber-warm">Memory:</strong> 0 Leaks / Deterministic Allocation</div>
        </div>
      );
    }
    // Handle 'pwd'
    else if (lower === 'pwd') {
      outputNode = <div className="font-mono text-fluid-mono text-slate-300">/home/moayed</div>;
    }
    // Handle 'ls' or 'dir'
    else if (lower === 'ls' || lower === 'dir') {
      outputNode = (
        <div className="font-mono text-fluid-mono text-slate-300">
          <span className="text-sky-400 font-bold">Mental-Defrag/</span>&nbsp;&nbsp;
          <span className="text-sky-400 font-bold">DocLensBD/</span>&nbsp;&nbsp;
          <span className="text-sky-400 font-bold">Rannabanna/</span>&nbsp;&nbsp;
          <span className="text-sky-400 font-bold">TrashTrail/</span>&nbsp;&nbsp;
          <span className="text-sky-400 font-bold">BitForge-OS-Kernel/</span>&nbsp;&nbsp;
          <span className="text-emerald-400">resume.pdf</span>&nbsp;&nbsp;
          <span className="text-slate-400">architecture-specs.md</span>
        </div>
      );
    }
    // Handle unknown sudo
    else if (lower.startsWith('sudo ')) {
      isError = true;
      outputNode = (
        <div className="font-mono text-fluid-mono text-rose-400">
          sudo: &apos;{trimmed.slice(5)}&apos; is restricted. Did you mean &apos;<span className="text-emerald-400 font-bold underline cursor-pointer" onClick={() => executeCommand('sudo hire moayed')}>sudo hire moayed</span>&apos;?
        </div>
      );
    }
    // Unrecognized command
    else {
      isError = true;
      outputNode = (
        <div className="font-mono text-fluid-mono text-rose-400 space-y-1">
          <div>Command &apos;{trimmed}&apos; not found in ewu-cse environment.</div>
          <div className="text-slate-400 text-fluid-micro">
            Type &apos;<span className="text-cyan-mint font-semibold underline cursor-pointer" onClick={() => executeCommand('help')}>help</span>&apos; to view valid directives or tap the quick chips below.
          </div>
        </div>
      );
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random()}`,
        command: trimmed,
        output: outputNode,
        timestamp,
        isError,
      },
    ]);

    setCommandHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
    setHistoryPointer(-1);
    savedDraftRef.current = '';
    setInputVal('');
  };

  // Keyboard Navigation: Enter, Up, Down, Tab, Ctrl+L, Ctrl+C
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyPointer === -1) {
        savedDraftRef.current = inputVal;
      }
      const newPointer = historyPointer === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyPointer - 1);
      setHistoryPointer(newPointer);
      setInputVal(commandHistory[newPointer]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPointer === -1) return;
      const newPointer = historyPointer + 1;
      if (newPointer >= commandHistory.length) {
        setHistoryPointer(-1);
        setInputVal(savedDraftRef.current);
      } else {
        setHistoryPointer(newPointer);
        setInputVal(commandHistory[newPointer]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const current = inputVal.trim().toLowerCase();
      if (!current) return;

      const candidates = [
        'help',
        'whoami',
        'skills',
        'projects',
        'github',
        'clear',
        'sudo hire moayed',
        'dhaka',
        'uptime',
        'uname -a',
        'neofetch',
        'pwd',
        'ls',
      ];

      // Support cycling through matches on repeated Tab key presses
      if (
        tabCycleRef.current.matches.length > 0 &&
        tabCycleRef.current.matches.includes(current)
      ) {
        const nextIndex = (tabCycleRef.current.index + 1) % tabCycleRef.current.matches.length;
        tabCycleRef.current.index = nextIndex;
        setInputVal(tabCycleRef.current.matches[nextIndex]);
      } else {
        const matches = candidates.filter((c) => c.startsWith(current));
        if (matches.length > 0) {
          tabCycleRef.current = {
            prefix: current,
            index: 0,
            matches,
          };
          setInputVal(matches[0]);
        }
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setHistory([]);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      setInputVal('');
      savedDraftRef.current = '';
    }
  };

  // Quick chips trigger
  const handleChipClick = (cmd: string) => {
    setIsMinimized(false);
    setActiveChipAnimation(cmd);
    setTimeout(() => setActiveChipAnimation(null), 300);
    executeCommand(cmd);
  };

  // Safe window click handler that preserves user text selection and link clicks
  const handleTerminalWindowClick = (e: React.MouseEvent) => {
    // If text was selected by user, don't clear it by focusing input
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    // If click was on an anchor, button, input, or interactive control, let it handle the event
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, textarea')) return;

    if (isMinimized) {
      setIsMinimized(false);
    }
    inputRef.current?.focus();
  };

  // Copy terminal history to clipboard
  const handleCopyHistory = async () => {
    try {
      const text = history
        .map((h) => `moayed@ewu-cse:~$ ${h.command}`)
        .join('\n');
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section 
      id="terminal" 
      className="py-24 md:py-32 relative bg-obsidian-darker/70 overflow-hidden"
    >
      {/* Fullscreen Celebratory Shader Pulse Overlay for 'sudo hire moayed' */}
      <div 
        className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-1000 ${
          showShaderPulse ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(223, 108, 79, 0.25) 0%, rgba(167, 64, 36, 0.15) 40%, rgba(10, 10, 10, 0) 75%)',
        }}
        aria-hidden="true"
      />

      {/* Celebratory Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 font-mono text-fluid-micro text-cyan-mint uppercase tracking-widest mb-3 px-3.5 py-1.5 rounded-full bg-cyan-mint/10 border border-cyan-mint/25 shadow-glow-cyan-sm">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-mint animate-pulse" />
            <span>Interactive Systems &amp; Terminal Lab</span>
          </div>

          <h2 className="font-display font-black text-fluid-h1 text-white tracking-tight uppercase">
            Systems <span className="text-cyan-mint">Terminal</span>
          </h2>

          <p className="font-body text-fluid-body text-slate-400 mt-2 leading-relaxed">
            Authentic dark glass Ubuntu shell connected to the East West University CSE environment. 
            Run live telemetry queries, inspect flagship project repos, or trigger the elevated talent acquisition protocol.
          </p>
        </div>

        {/* Ubuntu Terminal Window Chrome */}
        <div 
          onClick={handleTerminalWindowClick}
          className={`rounded-2xl overflow-hidden border border-white/15 bg-carbon/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300 cursor-text ${
            isExpanded ? 'ring-2 ring-cyan-mint/40 shadow-[0_30px_90px_-15px_rgba(0,245,212,0.15)]' : ''
          }`}
        >
          {/* Authentic Ubuntu Window Titlebar with Traffic Lights */}
          <div className="bg-obsidian-surface/95 px-4 py-3 border-b border-white/10 flex items-center justify-between select-none">
            
            {/* Traffic-light Controls (Ubuntu styling) */}
            <div className="flex items-center gap-2">
              {/* Close / Reset Button (Red) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHistory(initialHistory);
                  setInputVal('');
                  setHistoryPointer(-1);
                }}
                className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center group"
                title="Reset terminal session (Red)"
                aria-label="Reset terminal session"
              >
                <span className="text-[9px] text-[#4d0000] opacity-0 group-hover:opacity-100 font-bold transition-opacity leading-none">
                  ×
                </span>
              </button>

              {/* Minimize Button (Amber) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center group"
                title={isMinimized ? "Restore terminal (Amber)" : "Minimize terminal (Amber)"}
                aria-label="Minimize or restore terminal"
              >
                <span className="text-[9px] text-[#593d00] opacity-0 group-hover:opacity-100 font-bold transition-opacity leading-none">
                  –
                </span>
              </button>

              {/* Maximize Button (Green) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMinimized) {
                    setIsMinimized(false);
                  }
                  setIsExpanded(!isExpanded);
                }}
                className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center group"
                title={isExpanded ? "Standard view (Green)" : "Expand height (Green)"}
                aria-label="Toggle expanded height"
              >
                <span className="text-[8px] text-[#00380e] opacity-0 group-hover:opacity-100 font-bold transition-opacity leading-none">
                  +
                </span>
              </button>

              {/* Window Title with Authentic Ubuntu Prompt */}
              <span className="ml-3 font-mono text-fluid-micro text-slate-300 font-medium hidden sm:inline-flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">moayed@ewu-cse</span>
                <span className="text-slate-500">:</span>
                <span className="text-sky-400">~</span>
                <span className="text-slate-500">— (bash 5.2.21)</span>
              </span>
              <span className="ml-2 font-mono text-fluid-micro text-slate-400 sm:hidden">
                moayed@ewu-cse:~
              </span>
            </div>

            {/* Window Actions: Expand toggle & Copy */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500 px-2 py-0.5 rounded bg-white/5 border border-white/5 hidden md:inline">
                UTF-8 • 80x24
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyHistory();
                }}
                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Copy terminal session"
                aria-label="Copy terminal session"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMinimized) {
                    setIsMinimized(false);
                  }
                  setIsExpanded(!isExpanded);
                }}
                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={isExpanded ? 'Collapse Terminal' : 'Expand Terminal'}
                aria-label="Toggle Expand"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHistory([]);
                }}
                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-mono text-fluid-micro"
                title="Clear screen"
                aria-label="Clear screen"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Minimized Dock Ribbon */}
          {isMinimized && (
            <div
              onClick={() => setIsMinimized(false)}
              className="px-4 py-3 bg-obsidian-surface/60 border-t border-white/5 flex items-center justify-between text-fluid-micro font-mono text-slate-400 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-warm animate-ping" />
                <span className="text-slate-300 font-medium">moayed@ewu-cse:~ • Shell session minimized</span>
              </div>
              <span className="text-cyan-mint hover:underline font-semibold flex items-center gap-1">
                <span>Restore Terminal</span>
                <span>↗</span>
              </span>
            </div>
          )}

          {!isMinimized && (
            <>
              {/* Terminal Output Area with data-lenis-prevent and overscroll-contain */}
              <div
                ref={terminalScrollRef}
                data-lenis-prevent
                className={`p-5 md:p-6 font-mono text-fluid-mono text-slate-200 overflow-y-auto overscroll-contain space-y-4 transition-all duration-300 ${
                  isExpanded ? 'min-h-[520px] max-h-[680px]' : 'min-h-[360px] max-h-[460px]'
                }`}
              >
                {/* Authentic Ubuntu MOTD Banner */}
                <div className="text-slate-400 text-fluid-micro border-b border-white/10 pb-3 leading-relaxed space-y-1">
                  <div className="text-white font-semibold flex items-center gap-2">
                    <span>Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-48-generic x86_64)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                  </div>
                  <div className="text-slate-400">
                    * Node: East West University Systems Lab (Dhaka, BD • UTC+6)<br />
                    * Kernel: Deterministic POSIX IPC &amp; Shared Memory Pipelines<br />
                    * Host: moayed@ewu-cse (Full-Stack Web Architect &amp; Systems Engineer)
                  </div>
                  <div className="text-cyan-mint pt-1">
                    Type &apos;<span className="underline font-bold">help</span>&apos; to view all directives, or tap the quick command chips below.
                  </div>
                </div>

                {/* History Output Stream */}
                {history.map((entry) => (
                  <div key={entry.id} className="space-y-2 animate-in fade-in duration-200">
                    {/* Ubuntu Command Line Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-400 font-bold">moayed@ewu-cse</span>
                      <span className="text-slate-400 font-semibold">:</span>
                      <span className="text-sky-400 font-semibold">~</span>
                      <span className="text-slate-300 font-bold mr-1">$</span>
                      <span className="font-semibold text-white">{entry.command}</span>
                      <span className="text-slate-600 text-fluid-micro ml-auto">[{entry.timestamp}]</span>
                    </div>

                    {/* Command Output Payload */}
                    <div className="pl-3.5 border-l-2 border-cyan-mint/40 py-0.5">
                      {entry.output}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Command Input Line */}
              <div className="p-3.5 bg-obsidian-surface/95 border-t border-white/10 flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-fluid-mono select-none">
                  <span className="text-emerald-400 font-bold">moayed@ewu-cse</span>
                  <span className="text-slate-400">:</span>
                  <span className="text-sky-400 font-semibold">~</span>
                  <span className="text-slate-300 font-bold">$</span>
                </div>

                <input
                  ref={inputRef}
                  id="terminal-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    tabCycleRef.current = { prefix: '', index: 0, matches: [] };
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type 'help', 'skills', 'projects', 'github', or 'sudo hire moayed'..."
                  className="w-full bg-transparent font-mono text-fluid-mono text-cyan-mint focus:outline-none placeholder:text-slate-600 caret-cyan-mint"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label="Terminal command input"
                />

                <button
                  onClick={() => executeCommand(inputVal)}
                  className="p-2 rounded-lg bg-cyan-mint text-obsidian hover:bg-[#20ffdf] active:scale-95 transition-all shrink-0 font-bold flex items-center gap-1 shadow-glow-cyan-sm"
                  aria-label="Execute terminal command"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-fluid-micro font-mono">Run</span>
                </button>
              </div>

              {/* Clickable Quick-Command Chips */}
              <div className="px-4 py-3 bg-carbon/80 border-t border-white/5 flex flex-wrap items-center gap-2 select-none">
                <span className="font-mono text-fluid-micro text-slate-400 flex items-center gap-1 mr-1">
                  <CornerDownLeft className="w-3 h-3 text-cyan-mint" /> Quick exec:
                </span>

                {/* Standard Quick Directives */}
                {[
                  { cmd: 'help', label: 'help', special: false },
                  { cmd: 'whoami', label: 'whoami', special: false },
                  { cmd: 'skills', label: 'skills', special: false },
                  { cmd: 'projects', label: 'projects', special: false },
                  { cmd: 'github', label: 'github', special: false },
                  { cmd: 'clear', label: 'clear', special: false },
                ].map(({ cmd, label }) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleChipClick(cmd)}
                    aria-label={`Execute terminal command: ${cmd}`}
                    className={`font-mono text-fluid-micro px-2.5 py-1 rounded-lg border transition-all duration-200 active:scale-95 ${
                      activeChipAnimation === cmd
                        ? 'bg-cyan-mint text-obsidian font-bold border-cyan-mint'
                        : 'bg-white/5 hover:bg-cyan-mint/20 text-slate-200 hover:text-cyan-mint border-white/10 hover:border-cyan-mint/30'
                    }`}
                  >
                    ${label}
                  </button>
                ))}

                {/* Special Highlight Chip: sudo hire moayed */}
                <button
                  type="button"
                  onClick={() => handleChipClick('sudo hire moayed')}
                  aria-label="Execute terminal command: sudo hire moayed (Trigger talent acquisition protocol)"
                  className={`font-mono text-fluid-micro px-3 py-1 rounded-lg font-bold border transition-all duration-300 flex items-center gap-1.5 active:scale-95 ${
                    activeChipAnimation === 'sudo hire moayed'
                      ? 'bg-accent text-alabaster border-accent shadow-editorial-elevated'
                      : 'bg-accent/10 text-alabaster border-accent/40 hover:border-accent hover:bg-accent/20 hover:shadow-editorial-card'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent-coral animate-pulse" />
                  <span>sudo hire moayed</span>
                  <span className="text-[10px] text-accent-coral px-1 rounded bg-black/40">⚡</span>
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </section>
  );
};

export default TerminalLab;
