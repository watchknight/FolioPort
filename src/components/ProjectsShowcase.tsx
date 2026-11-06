import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '../hooks/useLenis';
import { useTransition } from '../context/TransitionContext';
import { LiquidGlassCard } from './ui/LiquidGlassCard';
import { GithubIcon } from './ui/Icons';
import {
  Briefcase,
  ExternalLink,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Terminal as TerminalIcon,
  RotateCcw,
  Play,
  Share2,
  Database,
  Layers,
  LayoutGrid,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// DATA STRUCTURE & 5 FLAGSHIP CASE STUDIES
// ============================================================================

export interface MetricItem {
  label: string;
  value: string;
  detail: string;
}

export interface FlagshipProject {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  client: string;
  role: string;
  coreStack: string;
  year: string;
  accent: 'cyan' | 'amber';
  problem: {
    headline: string;
    description: string;
    bottleneck: string;
  };
  solution: {
    headline: string;
    description: string;
    architecture: string[];
  };
  impact: {
    metrics: MetricItem[];
    summary: string;
  };
  techStack: string[];
  githubUrl: string;
  liveUrl?: string;
  previewType: 'mental-defrag' | 'doclens' | 'rannabanna' | 'trash-trail' | 'neon-vanguard';
}

export const FLAGSHIP_PROJECTS: FlagshipProject[] = [
  {
    id: 'mental-defrag',
    number: '01',
    title: 'Mental Defrag',
    subtitle: 'Zero-Gravity Spatial Cognitive Obsidian Engine',
    category: 'Spatial Web & Physics Systems',
    client: 'East West University Cognition Lab',
    role: 'Lead Spatial Systems Architect',
    coreStack: 'TypeScript • Matter.js • Vectors',
    year: '2024',
    accent: 'cyan',
    problem: {
      headline: 'Cognitive Bottlenecking in Linear Note Systems',
      description: 'Traditional linear notes enforce rigid hierarchical trees, creating cognitive bottlenecks when mapping multi-dimensional system architectures and emergent ideas.',
      bottleneck: 'High mental overhead when traversing interconnected engineering concepts without spatial context.'
    },
    solution: {
      headline: 'Matter.js Zero-G Canvas & Vector Clustering',
      description: 'Engineered a zero-gravity spatial thought workspace using Vite, TypeScript, and Matter.js rigid-body physics. Integrated local vector embeddings for semantic node clustering and native bi-directional Obsidian .canvas JSON parsing.',
      architecture: [
        'Matter.js rigid-body physics loop with zero-gravity friction decay',
        'Local cosine similarity vector clustering for semantic thought repulsion/attraction',
        'Bidirectional Obsidian .canvas JSON AST compiler with lossless sync',
        'Client-side IndexedDB persistence for offline-first zero-latency state'
      ]
    },
    impact: {
      metrics: [
        { label: 'Simulation FPS', value: '60 FPS', detail: 'Solid under 500+ bodies' },
        { label: 'Query Latency', value: '0 ms', detail: 'Local-first IndexedDB' },
        { label: 'Obsidian Parity', value: '100%', detail: 'Bi-directional .canvas format' }
      ],
      summary: 'Empowers engineers to decompose complex distributed systems into non-linear, spatial knowledge constellations with zero server reliance.'
    },
    techStack: ['TypeScript', 'Vite', 'Matter.js', 'Vector Embeddings', 'Obsidian Canvas', 'Canvas 2D', 'IndexedDB'],
    githubUrl: 'https://github.com/watchknight/Mental-Defrag',
    liveUrl: 'https://github.com/watchknight/Mental-Defrag',
    previewType: 'mental-defrag'
  },
  {
    id: 'doclens-bd',
    number: '02',
    title: 'DocLensBD',
    subtitle: 'Cloud-Backed Health Intelligence & Diagnostic Pipeline',
    category: 'Distributed Cloud Architecture',
    client: 'Regional Health Diagnostics BD',
    role: 'Cloud Architect & CI/CD Lead',
    coreStack: 'Cloud Firestore • AES-256 • CI/CD',
    year: '2024',
    accent: 'amber',
    problem: {
      headline: 'Fragmented Medical Diagnostics in Regional Bangladesh',
      description: 'Clinics and diagnostic centers across Bangladesh rely on unstandardized physical papers and fragile siloed databases, causing lost diagnostic records, diagnostic delays, and zero regional interoperability.',
      bottleneck: 'Unreliable bandwidth in semi-urban centers leading to failed cloud sync and corrupted patient data.'
    },
    solution: {
      headline: 'Cloud Firestore Real-Time Stream & Automated CI/CD',
      description: 'Architected a resilient health platform with Cloud Firestore real-time snapshot streams, client-side optimistic UI reconciliations, role-based encryption rules, and an automated GitHub Actions CI/CD staging pipeline.',
      architecture: [
        'Cloud Firestore real-time snapshot listeners with offline persistence',
        'Role-based access control (RBAC) security rules with AES-256 encrypted fields',
        'Automated GitHub Actions CI/CD pipeline running lint, security audit, and deployment',
        'Optimistic UI update reconciler ensuring zero data loss over unstable 3G/4G connections'
      ]
    },
    impact: {
      metrics: [
        { label: 'Regional Sync', value: '< 45 ms', detail: 'p99 snapshot latency' },
        { label: 'Uptime SLA', value: '99.98%', detail: 'High-availability cloud' },
        { label: 'CI/CD Pipeline', value: '14/14', detail: 'Automated test suite passing' }
      ],
      summary: 'Standardizes diagnostic document retrieval across regional health hubs with ironclad cryptographic security and continuous automated testing.'
    },
    techStack: ['Cloud Firestore', 'React', 'TypeScript', 'GitHub Actions', 'Firebase Auth', 'Tailwind CSS', 'PWA'],
    githubUrl: 'https://github.com/watchknight/DocLensBD',
    liveUrl: 'https://github.com/watchknight/DocLensBD',
    previewType: 'doclens'
  },
  {
    id: 'rannabanna',
    number: '03',
    title: 'Rannabanna',
    subtitle: 'Localized Bengali Culinary & Nutrition Engine',
    category: 'Localized Full-Stack Web',
    client: 'Bengali Culinary Open-Source Foundation',
    role: 'Full-Stack Performance Engineer',
    coreStack: 'React • Bengali NLP • PWA',
    year: '2023',
    accent: 'cyan',
    problem: {
      headline: 'Cultural Disconnect & Script Rendering Deficits',
      description: 'Existing culinary platforms do not support native Bengali typography kerning, lack indigenous regional ingredient taxonomies, and ship bloated JavaScript bundles unusable on low-end mobile devices.',
      bottleneck: 'Substandard Unicode text rendering and heavy network payload overhead on constrained mobile networks.'
    },
    solution: {
      headline: 'Vite Optimized Bundle & Real-Time Cloud DB Sync',
      description: 'Engineered a full-stack localized web application featuring specialized Bengali font subsetting, phonetic search indexing, cloud database synchronization, and an offline-first service worker architecture.',
      architecture: [
        'Vite build pipeline with aggressive tree-shaking and dynamic code-splitting',
        'Custom Bengali Unicode glyph subsetting reducing font payload by 78%',
        'Real-time cloud database synchronization with offline IndexedDB fallback',
        'Phonetic phonetic-to-Bengali transliterated search indexing engine'
      ]
    },
    impact: {
      metrics: [
        { label: 'Lighthouse Score', value: '99 / 100', detail: 'Performance & Accessibility' },
        { label: 'Critical Bundle', value: '42 KB', detail: 'Initial compressed payload' },
        { label: 'Search Latency', value: '< 15 ms', detail: 'Client-side phonetic lookup' }
      ],
      summary: 'Brings high-performance culinary knowledge and nutritional telemetry to Bengali speakers globally with instant mobile load times.'
    },
    techStack: ['React', 'Vite', 'Cloud DB Sync', 'Bengali NLP / Localization', 'PWA', 'Tailwind CSS', 'IndexedDB'],
    githubUrl: 'https://github.com/watchknight/Rannabanna',
    liveUrl: 'https://github.com/watchknight/Rannabanna',
    previewType: 'rannabanna'
  },
  {
    id: 'trash-trail',
    number: '04',
    title: 'Trash Trail',
    subtitle: 'Kinetic Scroll-Driven Interactive Storytelling Web Architecture',
    category: 'Creative Motion & Web Performance',
    client: 'Dhaka Waste Ecology Initiative',
    role: 'Creative Technologist',
    coreStack: 'GSAP • ScrollTrigger • Vanilla JS',
    year: '2023',
    accent: 'amber',
    problem: {
      headline: 'Severe User Drop-Off in Public Awareness Narratives',
      description: 'Traditional ecological awareness campaigns face over 82% user drop-off before reaching impact data due to static walls of text, disconnected diagrams, and unengaging visual pacing.',
      bottleneck: 'Static web pages fail to convey the dynamic urgency and geographic trajectory of urban waste dispersion.'
    },
    solution: {
      headline: 'Vanilla JS, GSAP & ScrollTrigger Viewport Scrubbing',
      description: 'Designed a cinematic scroll-driven storytelling web experience with multi-layer pinned parallax scenes, dynamic viewport scrubbing, GPU-accelerated vector illustrations, and reactive audio-visual cues.',
      architecture: [
        'GSAP ScrollTrigger pinned multi-stage viewport narrative choreography',
        'Fixed coordinate aspect-ratio preservation ensuring 0 Cumulative Layout Shift (CLS)',
        'Vanilla JavaScript micro-event orchestrator bypassing virtual DOM overhead',
        'GPU composite layers using will-change transforms for 60 FPS mobile scrubbing'
      ]
    },
    impact: {
      metrics: [
        { label: 'Session Duration', value: '+340%', detail: 'Retention increase vs static' },
        { label: 'Frame Consistency', value: '60 FPS', detail: 'Zero dropped frames on scrub' },
        { label: 'CLS Score', value: '0.00', detail: 'Zero layout shift across screens' }
      ],
      summary: 'Transforms dry ecological data into a visceral, cinematic interactive story that drove exceptional visitor engagement and educational recall.'
    },
    techStack: ['GSAP', 'ScrollTrigger', 'Vanilla JavaScript', 'SVG Kinetic Animation', 'Vite', 'Tailwind CSS'],
    githubUrl: 'https://github.com/watchknight/TrashTrail',
    liveUrl: 'https://github.com/watchknight/TrashTrail',
    previewType: 'trash-trail'
  },
  {
    id: 'neon-vanguard',
    number: '05',
    title: 'Neon Vanguard 2D & OS Kernel Labs',
    subtitle: 'HTML5 2D Canvas Combat Engine & Linux C/C++ OS Kernel Labs',
    category: 'Low-Level Systems & Graphics Engines',
    client: 'Systems Kernel & Graphics Lab',
    role: 'Low-Level Systems & Graphics Engineer',
    coreStack: 'C / C++ • POSIX IPC • 2D Canvas',
    year: '2024',
    accent: 'cyan',
    problem: {
      headline: 'GC Jitter in Particle Combat & Opaque POSIX IPC Telemetry',
      description: 'Web game engines suffer from GC stutter under dense projectile storms, while systems engineering students lack interactive real-time visual telemetry for understanding Linux IPC pipes and POSIX shared memory buffers.',
      bottleneck: 'Garbage collector pauses in JavaScript render loops and silent deadlocks in C multi-process IPC trees.'
    },
    solution: {
      headline: 'Zero-Alloc 2D Canvas Engine & C/C++ POSIX IPC Suite',
      description: 'Engineered an HTML5 2D canvas combat engine utilizing object-pooling for piercing projectiles and recursive chain lightning; alongside a Linux C/C++ Operating Systems suite implementing IPC pipes, fork() process hierarchies, and POSIX shared memory.',
      architecture: [
        'HTML5 2D Canvas render loop with pre-allocated particle pools and raycast piercing',
        'Branching chain-lightning recursive arc generator with dynamic luminescence',
        'Linux C POSIX shared memory (shmget, shmat) with spinlock synchronization',
        'Multi-process fork() hierarchy pipeline communicating via anonymous duplex pipes'
      ]
    },
    impact: {
      metrics: [
        { label: 'Render Pacing', value: '120 FPS', detail: 'Zero GC pause / 1,000+ bullets' },
        { label: 'IPC Latency', value: '< 1.2 μs', detail: 'POSIX shared memory transfer' },
        { label: 'Memory Safety', value: '0 Leaks', detail: '100% clean Valgrind audit' }
      ],
      summary: 'Bridges visual high-performance browser rendering with deterministic low-level Linux systems programming and memory primitives.'
    },
    techStack: ['C / C++', 'Linux POSIX', 'HTML5 Canvas', 'IPC Pipes', 'fork() Processes', 'POSIX Shared Memory', 'TypeScript', 'Valgrind'],
    githubUrl: 'https://github.com/watchknight/BitForge',
    liveUrl: 'https://github.com/watchknight',
    previewType: 'neon-vanguard'
  }
];

// ============================================================================
// INTERACTIVE PREVIEW VISUAL 1: MENTAL DEFRAG (ZERO-G SPATIAL CANVAS)
// ============================================================================

interface PhysicsNode {
  id: number;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const MentalDefragPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pulseCount, setPulseCount] = useState(0);
  const [obsidianSynced, setObsidianSynced] = useState(false);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const initialLabels = ['Obsidian.canvas', 'Matter.js 2D', 'Vector Cluster', 'Semantic Graph', 'IndexedDB', 'Zero-G Buffer'];
    nodesRef.current = initialLabels.map((label, idx) => ({
      id: idx,
      label,
      x: 50 + (idx % 3) * 90 + Math.random() * 20,
      y: 40 + Math.floor(idx / 3) * 75 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      radius: idx === 0 ? 32 : 26,
      color: idx % 2 === 0 ? '#DF6C4F' : '#A74024'
    }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const alpha = (1 - dist / 130) * 0.35;
            ctx.strokeStyle = `rgba(223, 108, 79, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            if (dist < 80) {
              ctx.font = '8px monospace';
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
              ctx.fillText(`${(1 - dist / 130).toFixed(2)} sim`, (nodes[i].x + nodes[j].x) / 2, (nodes[i].y + nodes[j].y) / 2 - 2);
            }
          }
        }
      }

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x - node.radius < 0) {
          node.x = node.radius;
          node.vx *= -1;
        } else if (node.x + node.radius > width) {
          node.x = width - node.radius;
          node.vx *= -1;
        }
        if (node.y - node.radius < 0) {
          node.y = node.radius;
          node.vy *= -1;
        } else if (node.y + node.radius > height) {
          node.y = height - node.radius;
          node.vy *= -1;
        }

        if (mouse.active) {
          const mdx = node.x - mouse.x;
          const mdy = node.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 100 && mdist > 0) {
            const force = (1 - mdist / 100) * 0.8;
            node.vx += (mdx / mdist) * force;
            node.vy += (mdy / mdist) * force;
          }
        }

        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > 2.5) {
          node.vx = (node.vx / speed) * 2.5;
          node.vy = (node.vy / speed) * 2.5;
        }

        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 1.5);
        glow.addColorStop(0, 'rgba(223, 108, 79, 0.25)');
        glow.addColorStop(1, 'rgba(223, 108, 79, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0B0B10';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#F1F5F9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      });
    };

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    if (canvas) visibilityObserver.observe(canvas);

    const tickerRender = () => {
      if (!isVisible) return;
      render();
    };
    gsap.ticker.add(tickerRender);

    return () => {
      visibilityObserver.disconnect();
      gsap.ticker.remove(tickerRender);
    };
  }, []);

  const handlePulse = () => {
    setPulseCount((c) => c + 1);
    nodesRef.current.forEach((n) => {
      n.vx += (Math.random() - 0.5) * 4;
      n.vy += (Math.random() - 0.5) * 4;
    });
  };

  const handleSyncObsidian = () => {
    setObsidianSynced(true);
    setTimeout(() => setObsidianSynced(false), 2000);
  };

  return (
    <div className="flex flex-col h-full justify-between bg-obsidian-darker/90 rounded-xl border border-cyan-mint/20 p-4 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-mint animate-pulse" />
          <span className="font-mono text-fluid-micro text-cyan-mint uppercase tracking-wider">
            Spatial 2D Physics HUD
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
          Matter.js Zero-G
        </span>
      </div>

      <div className="relative flex-1 w-full min-h-[170px] rounded-lg overflow-hidden border border-white/5 bg-carbon/60">
        <canvas
          ref={canvasRef}
          width={340}
          height={180}
          className="w-full h-full block cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) * (340 / rect.width);
            const clickY = (e.clientY - rect.top) * (180 / rect.height);
            nodesRef.current.forEach((n) => {
              const dx = n.x - clickX;
              const dy = n.y - clickY;
              const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              if (dist < 140) {
                const force = (1 - dist / 140) * 6;
                n.vx += (dx / dist) * force;
                n.vy += (dy / dist) * force;
              }
            });
            if (nodesRef.current.length < 9) {
              const extraLabels = ['Vector DB', 'AST Parser', 'Graph Walk', 'Cosine Sim', 'Neural Cache'];
              const label = extraLabels[(nodesRef.current.length - 6) % extraLabels.length];
              nodesRef.current.push({
                id: Date.now(),
                label,
                x: clickX,
                y: clickY,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 25,
                color: '#A74024'
              });
            }
            setPulseCount((c) => c + 1);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            mouseRef.current = {
              x: (e.clientX - rect.left) * (340 / rect.width),
              y: (e.clientY - rect.top) * (180 / rect.height),
              active: true
            };
          }}
          onMouseLeave={() => {
            mouseRef.current.active = false;
          }}
        />

        {obsidianSynced && (
          <div className="absolute inset-0 bg-cyan-mint/20 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-150">
            <span className="font-mono text-fluid-xs font-bold text-obsidian bg-cyan-mint px-3 py-1 rounded shadow-glow-cyan">
              ✓ Obsidian .canvas AST Parsed ({nodesRef.current.length} Nodes Linked)
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePulse}
            aria-label={`Inject physics impulse into zero-G canvas, current count ${pulseCount}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-mint/10 hover:bg-cyan-mint/20 text-cyan-mint border border-cyan-mint/30 font-mono text-[11px] transition-all active:scale-95"
            title="Inject physics impulse into zero-G canvas"
          >
            <Zap className="w-3 h-3" />
            <span>Pulse Field ({pulseCount})</span>
          </button>

          <button
            type="button"
            onClick={handleSyncObsidian}
            aria-label="Simulate Obsidian Canvas JSON sync"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-mono text-[11px] transition-all active:scale-95"
            title="Simulate Obsidian Canvas JSON sync"
          >
            <Share2 className="w-3 h-3 text-cyan-mint" />
            <span>Sync .canvas</span>
          </button>
        </div>

        <div className="font-mono text-[10px] text-slate-400">
          Bodies: <span className="text-cyan-mint font-semibold">{nodesRef.current.length || 6}</span> • 60 FPS
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INTERACTIVE PREVIEW VISUAL 2: DOCLENSBD (CLOUD FIRESTORE & CI/CD PIPELINE)
// ============================================================================

export const DocLensBDPreview: React.FC = () => {
  const [syncStep, setSyncStep] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    'Firestore real-time listener active [Asia-South1]',
    'Security rules evaluated: AES-256 RBAC pass',
    'Pipeline #741: Continuous Delivery verified'
  ]);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const triggerSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStep(1);

    timeoutsRef.current.push(
      window.setTimeout(() => setSyncStep(2), 400),
      window.setTimeout(() => setSyncStep(3), 850),
      window.setTimeout(() => {
        setSyncStep(4);
        setPipelineLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] DX-record sync: 32ms p99 [PASSED]`,
          ...prev.slice(0, 2)
        ]);
        setIsSyncing(false);
      }, 1300)
    );
  };

  return (
    <div className="flex flex-col h-full justify-between bg-obsidian-darker/90 rounded-xl border border-amber-warm/20 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-warm animate-pulse" />
          <span className="font-mono text-fluid-micro text-amber-warm uppercase tracking-wider">
            Cloud Firestore & CI/CD Telemetry
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          99.98% SLA
        </span>
      </div>

      <div className="my-auto py-3 bg-carbon/50 rounded-lg p-3 border border-white/5 space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
          <div className={`p-2 rounded-lg border transition-all ${
            syncStep >= 1 ? 'bg-amber-warm/15 border-amber-warm text-amber-warm scale-105' : 'bg-white/5 border-white/5 text-slate-400'
          }`}>
            <Activity className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">EMR Client</div>
            <div className="text-[9px] text-slate-500">Dhaka Hub</div>
          </div>

          <div className={`p-2 rounded-lg border transition-all ${
            syncStep >= 2 ? 'bg-amber-warm/15 border-amber-warm text-amber-warm scale-105' : 'bg-white/5 border-white/5 text-slate-400'
          }`}>
            <Database className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">Firestore</div>
            <div className="text-[9px] text-slate-500">Stream 24ms</div>
          </div>

          <div className={`p-2 rounded-lg border transition-all ${
            syncStep >= 3 ? 'bg-amber-warm/15 border-amber-warm text-amber-warm scale-105' : 'bg-white/5 border-white/5 text-slate-400'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">CI/CD Guard</div>
            <div className="text-[9px] text-slate-500">14/14 Tests</div>
          </div>

          <div className={`p-2 rounded-lg border transition-all ${
            syncStep >= 4 ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 scale-105' : 'bg-white/5 border-white/5 text-slate-400'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">Sync Vault</div>
            <div className="text-[9px] text-slate-500">Encrypted</div>
          </div>
        </div>

        <div className="w-full h-1.5 bg-obsidian rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-warm to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${(syncStep / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-obsidian rounded p-2 border border-white/5 font-mono text-[9px] text-slate-400 space-y-0.5 max-h-[60px] overflow-hidden">
        {pipelineLogs.map((log, i) => (
          <div key={i} className="truncate">
            <span className="text-amber-warm">❯</span> {log}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing}
          aria-label={isSyncing ? 'Streaming Firestore sync in progress' : 'Trigger Firestore real-time sync simulation'}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-warm text-obsidian font-mono text-[11px] font-bold shadow-glow-amber hover:bg-[#ffc42e] active:scale-95 transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Streaming Realtime Sync...' : 'Trigger Firestore Sync'}</span>
        </button>

        <span className="font-mono text-[10px] text-slate-400">
          p99: <span className="text-amber-warm font-semibold">32ms</span>
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// INTERACTIVE PREVIEW VISUAL 3: RANNABANNA (LOCALIZED BENGALI CULINARY ENGINE)
// ============================================================================

export const RannabannaPreview: React.FC = () => {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeDish, setActiveDish] = useState<number>(0);

  const dishes = [
    {
      nameBn: 'সরিষা ইলিশ',
      nameEn: 'Shorshe Ilish (Mustard Hilsa)',
      taglineBn: 'পদ্মার তাজা ইলিশ ও দেশি সরিষার ঝাঁঝ',
      taglineEn: 'Padma River Hilsa braised in pungent mustard emulsion',
      metrics: { cal: '420 kcal', prep: '25 min', spice: 'ঝাঁঝালো / High' },
      tags: ['ঐতিহ্যবাহী', 'পদ্মার মাছ', 'সরিষা বাটা']
    },
    {
      nameBn: 'কাচ্চি বিরিয়ানি',
      nameEn: 'Dhaka Kacchi Biryani',
      taglineBn: 'পুরান ঢাকার খাঁটি জাফরানি সুবাস ও খাসির মাংস',
      taglineEn: 'Old Dhaka slow-steamed mutton with saffron basmati',
      metrics: { cal: '680 kcal', prep: '90 min', spice: 'সুগন্ধি / Medium' },
      tags: ['পুরান ঢাকা', 'খাসির মাংস', 'দমে রান্না']
    },
    {
      nameBn: 'শিল-পাটার ভর্তা সম্ভার',
      nameEn: 'Artisanal Vorta Platter',
      taglineBn: 'শিল-পাটায় বাটা সরিষা, কালিজিরা ও বেগুন ভর্তা',
      taglineEn: 'Stone-ground kalijira, mustard and charred eggplant mash',
      metrics: { cal: '210 kcal', prep: '15 min', spice: 'তীব্র / Sharp' },
      tags: ['শিল-পাটা', 'দেশি পুষ্টি', 'নিরামিষ']
    }
  ];

  const current = dishes[activeDish];

  return (
    <div className="flex flex-col h-full justify-between bg-obsidian-darker/90 rounded-xl border border-cyan-mint/20 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-mint" />
          <span className="font-mono text-fluid-micro text-cyan-mint uppercase tracking-wider">
            {lang === 'bn' ? 'রান্নাবান্না • ভোজনরসিকদের প্ল্যাটফর্ম' : 'Rannabanna • Bengali Culinary Engine'}
          </span>
        </div>

        <div className="flex items-center p-0.5 rounded-full bg-carbon border border-white/10 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setLang('bn')}
            aria-label="Switch interface language to Bengali (বাংলা)"
            className={`px-2 py-0.5 rounded-full transition-all ${
              lang === 'bn' ? 'bg-cyan-mint text-obsidian font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-label="Switch interface language to English"
            className={`px-2 py-0.5 rounded-full transition-all ${
              lang === 'en' ? 'bg-cyan-mint text-obsidian font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 my-1">
        {dishes.map((dish, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveDish(idx)}
            aria-label={`Select recipe: ${dish.nameEn}`}
            className={`px-2 py-1.5 rounded-lg font-mono text-[11px] truncate transition-all text-center border ${
              activeDish === idx
                ? 'bg-cyan-mint/15 border-cyan-mint text-cyan-mint font-bold'
                : 'bg-carbon/40 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? dish.nameBn : dish.nameEn.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="my-auto p-3 rounded-lg bg-carbon/60 border border-white/5">
        <div className="flex items-baseline justify-between mb-1">
          <h4 className="font-display font-extrabold text-base text-white">
            {lang === 'bn' ? current.nameBn : current.nameEn}
          </h4>
          <span className="font-mono text-[10px] text-cyan-mint bg-cyan-mint/10 px-2 py-0.5 rounded">
            {current.metrics.cal}
          </span>
        </div>

        <p className="font-body text-[12px] text-slate-300 mb-2 leading-relaxed">
          {lang === 'bn' ? current.taglineBn : current.taglineEn}
        </p>

        <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] border-t border-white/5 pt-2">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Time</span>
            <span className="text-white font-semibold">{current.metrics.prep}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Flavor</span>
            <span className="text-cyan-mint font-semibold">{current.metrics.spice}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">Bundle</span>
            <span className="text-amber-warm font-semibold">42 KB</span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-slate-400">
        <span className="text-emerald-400">✓ Lighthouse: 99/100</span>
        <span>UTF-8 Subsetting (22KB)</span>
      </div>
    </div>
  );
};

// ============================================================================
// INTERACTIVE PREVIEW VISUAL 4: TRASH TRAIL (SCROLL-DRIVEN STORYTELLING SIMULATOR)
// ============================================================================

export const TrashTrailPreview: React.FC = () => {
  const [scrubProgress, setScrubProgress] = useState<number>(35);

  const stages = [
    { title: '01. Urban Waste Generation', desc: 'Over 6,500 metric tons of plastic entering Dhaka waterways daily.' },
    { title: '02. Riverway Runoff & Plastic Drift', desc: 'Buriganga & Shitalakshya aquatic channel microplastic density surge.' },
    { title: '03. Microplastic Ecological Toxicity', desc: 'Downstream food web bio-accumulation and aquatic fauna asphyxiation.' },
    { title: '04. Circular Recovery & Remediation', desc: 'Automated kinetic floating booms and localized recycling reclamation.' }
  ];

  const currentStageIndex = Math.min(3, Math.floor((scrubProgress / 100) * 4));
  const currentStage = stages[currentStageIndex];

  const pSky = (scrubProgress - 50) * 0.15;
  const pCity = (scrubProgress - 50) * 0.35;
  const pWater = (scrubProgress - 50) * 0.75;

  return (
    <div className="flex flex-col h-full justify-between bg-obsidian-darker/90 rounded-xl border border-amber-warm/20 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-warm" />
          <span className="font-mono text-fluid-micro text-amber-warm uppercase tracking-wider">
            ScrollTrigger Viewport Scrub Simulator
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
          GSAP Scrub: 0.8s
        </span>
      </div>

      <div className="relative flex-1 w-full min-h-[140px] rounded-lg overflow-hidden border border-white/5 bg-carbon/70 flex flex-col justify-end p-3">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-[#18122B]/60 via-[#101018]/80 to-transparent pointer-events-none transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${pSky}px)` }}
        />

        <div 
          className="absolute inset-x-0 bottom-10 h-16 opacity-35 pointer-events-none transition-transform duration-100 ease-out"
          style={{ transform: `translateX(${-pCity}px)` }}
        >
          <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="w-full h-full fill-amber-warm/30">
            <path d="M0 60 L0 35 L20 35 L20 20 L40 20 L40 45 L65 45 L65 10 L85 10 L85 50 L115 50 L115 30 L140 30 L140 55 L175 55 L175 15 L200 15 L200 45 L235 45 L235 25 L260 25 L260 55 L300 55 L300 20 L330 20 L330 45 L365 45 L365 30 L400 30 L400 60 Z" />
          </svg>
        </div>

        <div 
          className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-cyan-mint/15 to-transparent border-t border-cyan-mint/20 pointer-events-none transition-transform duration-100 ease-out"
          style={{ transform: `translateX(${pWater}px)` }}
        >
          <div className="flex justify-around items-center h-full px-4 text-cyan-mint/60">
            <span className="text-[10px] animate-pulse">● microplastic</span>
            <span className="text-[10px] opacity-40">▲ PET-01</span>
            <span className="text-[10px] text-amber-warm animate-pulse">◆ runoff stream</span>
          </div>
        </div>

        <div className="relative z-10 bg-obsidian/85 backdrop-blur-md p-2 rounded border border-white/10 max-w-[95%]">
          <div className="font-mono text-[10px] text-amber-warm font-bold">{currentStage.title}</div>
          <div className="font-body text-[11px] text-slate-300 leading-tight mt-0.5">{currentStage.desc}</div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-400">Scrub Viewport:</span>
          <span className="text-amber-warm font-bold">{scrubProgress}% / 100%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={scrubProgress}
          aria-label="Scrub viewport narrative progress"
          onChange={(e) => setScrubProgress(Number(e.target.value))}
          data-lenis-prevent
          className="w-full accent-amber-warm h-1.5 bg-obsidian rounded-lg cursor-pointer"
        />
        <div className="flex justify-between font-mono text-[9px]">
          {[
            { label: '01 Urban', val: 12 },
            { label: '02 River', val: 37 },
            { label: '03 Toxicity', val: 62 },
            { label: '04 Circular', val: 87 }
          ].map((stageBtn, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => setScrubProgress(stageBtn.val)}
              aria-label={`Jump to narrative stage: ${stageBtn.label}`}
              className={`hover:text-amber-warm transition-colors ${
                currentStageIndex === sIdx ? 'text-amber-warm font-bold underline underline-offset-2' : 'text-slate-500'
              }`}
            >
              {stageBtn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INTERACTIVE PREVIEW VISUAL 5: NEON VANGUARD 2D & OS KERNEL LABS
// ============================================================================

export const NeonVanguardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'os'>('canvas');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ipcMessageCount, setIpcMessageCount] = useState(1480);
  const [lastIpcLatency, setLastIpcLatency] = useState('0.85 μs');
  const [hits, setHits] = useState(0);
  const [isIpcSyncing, setIsIpcSyncing] = useState(false);
  const cursorRef = useRef<{ x: number; y: number; active: boolean }>({ x: 170, y: 90, active: false });
  const manualLasersRef = useRef<{ x: number; y: number; targetX: number; targetY: number; life: number }[]>([]);

  useEffect(() => {
    if (activeTab !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let projectiles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
    const targets = [
      { x: 260, y: 50, radius: 14, hp: 100 },
      { x: 280, y: 110, radius: 16, hp: 100 },
      { x: 240, y: 150, radius: 12, hp: 100 }
    ];

    const spawnImpact = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color
        });
      }
    };

    const triggerLightningArcs = (originX: number, originY: number) => {
      targets.forEach((t) => {
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        const midX = (originX + t.x) / 2 + (Math.random() - 0.5) * 16;
        const midY = (originY + t.y) / 2 + (Math.random() - 0.5) * 16;
        ctx.lineTo(midX, midY);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = '#A74024';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#A74024';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
        spawnImpact(t.x, t.y, '#A74024');
      });
    };

    const render = () => {
      ctx.fillStyle = 'rgba(7, 7, 9, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.1) {
        projectiles.push({
          x: 20,
          y: 60 + Math.random() * 80,
          vx: 7 + Math.random() * 2,
          vy: (Math.random() - 0.5) * 1.5,
          life: 1
        });
      }

      if (manualLasersRef.current.length > 0) {
        manualLasersRef.current = manualLasersRef.current.filter((beam) => {
          beam.life -= 0.18;
          ctx.beginPath();
          ctx.moveTo(beam.x, beam.y);
          ctx.lineTo(beam.targetX, beam.targetY);
          ctx.strokeStyle = '#DF6C4F';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#DF6C4F';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
          spawnImpact(beam.targetX, beam.targetY, '#DF6C4F');
          triggerLightningArcs(beam.targetX, beam.targetY);
          return beam.life > 0;
        });
      }

      projectiles = projectiles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.moveTo(p.x - 12, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = '#DF6C4F';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#DF6C4F';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        targets.forEach((t) => {
          const dx = p.x - t.x;
          const dy = p.y - t.y;
          if (Math.sqrt(dx * dx + dy * dy) < t.radius) {
            spawnImpact(p.x, p.y, '#DF6C4F');
            triggerLightningArcs(t.x, t.y);
          }
        });

        return p.x < canvas.width;
      });

      targets.forEach((t) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#14141B';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#A74024';
        ctx.stroke();

        ctx.font = '8px monospace';
        ctx.fillStyle = '#A74024';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NODE', t.x, t.y);
      });

      const cur = cursorRef.current;
      if (cur.active) {
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(223, 108, 79, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cur.x - 13, cur.y);
        ctx.lineTo(cur.x + 13, cur.y);
        ctx.moveTo(cur.x, cur.y - 13);
        ctx.lineTo(cur.x, cur.y + 13);
        ctx.strokeStyle = 'rgba(223, 108, 79, 0.4)';
        ctx.stroke();
      }

      particles = particles.filter((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.035;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fill();
        ctx.globalAlpha = 1;

        return pt.life > 0;
      });
    };

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    if (canvas) visibilityObserver.observe(canvas);

    const tickerRender = () => {
      if (!isVisible) return;
      render();
    };
    gsap.ticker.add(tickerRender);

    return () => {
      visibilityObserver.disconnect();
      gsap.ticker.remove(tickerRender);
    };
  }, [activeTab]);

  const triggerIpcBurst = () => {
    setIsIpcSyncing(true);
    setIpcMessageCount((prev) => prev + 128);
    const latency = (0.7 + Math.random() * 0.4).toFixed(2);
    setLastIpcLatency(`${latency} μs`);
    setTimeout(() => setIsIpcSyncing(false), 900);
  };

  return (
    <div className="flex flex-col h-full justify-between bg-obsidian-darker/90 rounded-xl border border-cyan-mint/20 p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-carbon border border-white/10 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            aria-label="Switch simulation mode to 2D Canvas Combat Engine"
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'canvas' ? 'bg-cyan-mint text-obsidian font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ 2D Canvas Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('os')}
            aria-label="Switch simulation mode to Linux POSIX OS Kernel Labs"
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'os' ? 'bg-amber-warm text-obsidian font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            🐧 Linux OS Kernel
          </button>
        </div>

        <span className="font-mono text-[10px] text-cyan-mint">
          {activeTab === 'canvas' ? '120 FPS' : 'POSIX IPC'}
        </span>
      </div>

      {activeTab === 'canvas' ? (
        <div className="relative flex-1 w-full min-h-[160px] rounded-lg overflow-hidden border border-white/5 bg-obsidian">
          <canvas
            ref={canvasRef}
            width={340}
            height={180}
            className="w-full h-full block cursor-crosshair"
            onClick={(e) => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
              const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
              manualLasersRef.current.push(
                { x: 15, y: 70, targetX: clickX, targetY: clickY, life: 1 },
                { x: 15, y: 95, targetX: clickX, targetY: clickY, life: 1 },
                { x: 15, y: 120, targetX: clickX, targetY: clickY, life: 1 }
              );
              setHits((h) => h + 3);
            }}
            onMouseMove={(e) => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              cursorRef.current = {
                x: (e.clientX - rect.left) * (canvas.width / rect.width),
                y: (e.clientY - rect.top) * (canvas.height / rect.height),
                active: true
              };
            }}
            onMouseLeave={() => {
              cursorRef.current.active = false;
            }}
          />
          <div className="absolute top-2 left-2 font-mono text-[9px] text-slate-300 bg-obsidian/85 px-2 py-0.5 rounded border border-white/10 pointer-events-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-mint animate-ping" />
            <span>Click to Fire Lasers & Chain Lightning</span>
          </div>
        </div>
      ) : (
        <div className="my-auto p-3 rounded-lg bg-carbon/60 border border-white/5 font-mono text-[11px] space-y-2">
          <div className="text-amber-warm flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5" />
              <span className="font-bold">PID 1024: master_daemon (Linux 6.1 x86_64)</span>
            </div>
            {isIpcSyncing && (
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">
                SYNCING PIPE...
              </span>
            )}
          </div>

          <div className="pl-4 border-l border-white/10 space-y-1.5 text-slate-300 text-[10px]">
            <div className={`flex items-center justify-between p-1.5 rounded transition-all ${
              isIpcSyncing ? 'bg-cyan-mint/20 border border-cyan-mint/40 text-cyan-mint' : 'bg-white/5'
            }`}>
              <span className="text-cyan-mint font-semibold">├── [PID 1025] shm_producer</span>
              <span className="text-slate-400">shmget(0x7ffd, 4MB) [OK]</span>
            </div>
            <div className={`flex items-center justify-between p-1.5 rounded transition-all ${
              isIpcSyncing ? 'bg-amber-warm/20 border border-amber-warm/40 text-amber-warm' : 'bg-white/5'
            }`}>
              <span className="text-amber-warm font-semibold">└── [PID 1026] pipe_worker</span>
              <span className="text-slate-400">pipe(fd[3]-&gt;fd[4]) [DUPLEX]</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-1">
            <div className="bg-obsidian p-1.5 rounded border border-white/5">
              <span className="text-slate-500 block text-[9px]">TOTAL IPC MSGS</span>
              <span className="text-cyan-mint font-bold">{ipcMessageCount.toLocaleString()}</span>
            </div>
            <div className="bg-obsidian p-1.5 rounded border border-white/5">
              <span className="text-slate-500 block text-[9px]">POSIX SHM LATENCY</span>
              <span className="text-amber-warm font-bold">{lastIpcLatency}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
        {activeTab === 'canvas' ? (
          <span className="font-mono text-[10px] text-slate-400">
            Hits: <span className="text-cyan-mint font-bold">{hits}</span> • Piercing Raycasting
          </span>
        ) : (
          <button
            type="button"
            onClick={triggerIpcBurst}
            disabled={isIpcSyncing}
            aria-label="Trigger Linux fork process tree and POSIX shared memory sync"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-warm/15 hover:bg-amber-warm/25 text-amber-warm border border-amber-warm/30 font-mono text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3 h-3 ${isIpcSyncing ? 'animate-spin' : ''}`} />
            <span>Trigger fork() & IPC Sync</span>
          </button>
        )}

        <span className="font-mono text-[10px] text-emerald-400">
          Valgrind: 0 Leaks
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: ProjectsShowcase (Dennis Snellenberg Dual-Mode Showcase)
// ============================================================================

export const ProjectsShowcase: React.FC = () => {
  const { scrollTo } = useLenis();
  const { openCaseStudy, activeProject: transitionActiveProject } = useTransition();
  const sectionRef = useRef<HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'ledger' | 'cards'>('ledger');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Dennis Snellenberg Floating Preview & Label Cursor Refs
  const previewRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);
  const reelRef = useRef<HTMLDivElement | null>(null);

  // Mount detection for React portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure preview and cursor label are hidden when leaving ledger mode
  useEffect(() => {
    if (viewMode !== 'ledger') {
      handleLedgerLeave();
    }
  }, [viewMode]);

  // Refresh ScrollTrigger when expandable accordion opens/closes
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 320);
    return () => clearTimeout(timer);
  }, [viewMode, transitionActiveProject]);

  // --------------------------------------------------------------------------
  // GSAP 1: Cursor-Bound Floating Media Preview (quickTo Architecture)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const previewEl = previewRef.current;
    const labelEl = labelRef.current;
    if (!previewEl || !labelEl) return;

    // Check if device supports hover and cursor preview
    const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouchOnly || prefersReducedMotion) return;

    // Initialize the container with gsap.set(previewEl, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0, force3D: true })
    gsap.set(previewEl, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0, force3D: true });
    gsap.set(labelEl, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0, force3D: true });

    // Create reusable high-frequency interpolators using quickTo with force3D: true
    const xTo = gsap.quickTo(previewEl, 'x', { duration: 0.35, ease: 'power3.out', force3D: true });
    const yTo = gsap.quickTo(previewEl, 'y', { duration: 0.35, ease: 'power3.out', force3D: true });
    const labelXTo = gsap.quickTo(labelEl, 'x', { duration: 0.2, ease: 'power3.out', force3D: true });
    const labelYTo = gsap.quickTo(labelEl, 'y', { duration: 0.2, ease: 'power3.out', force3D: true });
    const setInitX = gsap.quickSetter([previewEl, labelEl], 'x', 'px');
    const setInitY = gsap.quickSetter([previewEl, labelEl], 'y', 'px');

    let hasPositioned = false;

    // On window mousemove, pipe e.clientX and e.clientY into xTo and yTo without creating new tweens per frame
    const onMouseMove = (e: MouseEvent) => {
      if (!hasPositioned) {
        setInitX(e.clientX);
        setInitY(e.clientY);
        hasPositioned = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
      labelXTo(e.clientX);
      labelYTo(e.clientY);
    };

    // Auto-hide when mouse leaves the browser window
    const onWindowLeave = () => {
      handleLedgerLeave();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onWindowLeave);

    // ScrollTrigger: automatically dismiss floating preview if #work scrolls out of view
    const sectionTrigger = sectionRef.current
      ? ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onLeave: handleLedgerLeave,
          onLeaveBack: handleLedgerLeave,
        })
      : null;

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onWindowLeave);
      sectionTrigger?.kill();
      document.body.classList.remove('ledger-hover-active');
    };
  }, [mounted]);

  // Hover handlers for ledger rows
  const handleRowEnter = (idx: number) => {
    if (viewMode !== 'ledger') return;
    const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouchOnly) return;

    setHoveredIndex(idx);
    document.body.classList.add('ledger-hover-active');

    const previewEl = previewRef.current;
    const labelEl = labelRef.current;
    const reelEl = reelRef.current;

    // Inside floating preview container, translate inner reel to -index * 100% (duration: 0.5, ease: 'power4.inOut')
    if (reelEl) {
      gsap.to(reelEl, {
        yPercent: -idx * 100,
        duration: 0.5,
        ease: 'power4.inOut',
        overwrite: 'auto',
      });
    }

    // Scale the container to 1 (autoAlpha: 1) on mouseenter
    if (previewEl && labelEl) {
      gsap.to([previewEl, labelEl], {
        scale: 1,
        autoAlpha: 1,
        duration: 0.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  };

  const handleLedgerLeave = () => {
    setHoveredIndex(null);
    document.body.classList.remove('ledger-hover-active');

    const previewEl = previewRef.current;
    const labelEl = labelRef.current;

    // Scale back to scale: 0 (autoAlpha: 0) on mouseleave
    if (previewEl && labelEl) {
      gsap.to([previewEl, labelEl], {
        scale: 0,
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power3.in',
        overwrite: 'auto',
      });
    }
  };

  // --------------------------------------------------------------------------
  // GSAP 2: Velocity-Dependent Scroll Skew Engine (.skew-elem)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Global velocity skew controller targeting all project rows and featured media cards (.skew-elem)
    gsap.set('.skew-elem', { transformOrigin: 'right center' });

    const skewProxy = { skew: 0 };
    const skewSetter = gsap.quickSetter('.skew-elem', 'skewY', 'deg');
    const skewTo = gsap.quickTo(skewProxy, 'skew', {
      duration: 0.6,
      ease: 'power3',
      onUpdate: () => {
        skewSetter(skewProxy.skew);
      },
    });

    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const skewTrigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        const rawSkew = velocity / -260;
        const clampedSkew = gsap.utils.clamp(-14, 14, rawSkew);
        skewTo(clampedSkew);

        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          skewTo(0);
        }, 70);
      },
    });

    return () => {
      skewTrigger.kill();
      if (settleTimer) clearTimeout(settleTimer);
      gsap.killTweensOf(skewProxy);
      gsap.set('.skew-elem', { skewY: 0 });
    };
  }, [viewMode]);

  // --------------------------------------------------------------------------
  // GSAP 3: 1px Horizontal Divider Rules ScaleX Entrance Animation (Batched)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (viewMode !== 'ledger') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set('.ledger-divider', { scaleX: 1, transformOrigin: 'left center' });
      return;
    }

    const ctx = gsap.context(() => {
      const dividers = sectionRef.current?.querySelectorAll<HTMLElement>('.ledger-divider');
      if (dividers && dividers.length > 0) {
        gsap.set(dividers, { scaleX: 0, transformOrigin: 'left center', force3D: true });
        ScrollTrigger.batch(dividers, {
          onEnter: (batch) =>
            gsap.to(batch, {
              scaleX: 1,
              duration: 0.85,
              stagger: 0.05,
              ease: 'power3.out',
              overwrite: true,
            }),
          start: 'top 92%',
        });
      }
    }, sectionRef);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [viewMode]);

  const handleJumpToProjectCard = (idx: number) => {
    handleLedgerLeave();
    setActiveCardIndex(idx);
    setViewMode('cards');
    if (sectionRef.current) {
      scrollTo(sectionRef.current, { duration: 0.8, offset: -80 });
    }
  };

  const handleNextCard = () => {
    setActiveCardIndex((prev) => Math.min(FLAGSHIP_PROJECTS.length - 1, prev + 1));
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => Math.max(0, prev - 1));
  };

  const activeProject = FLAGSHIP_PROJECTS[activeCardIndex];

  return (
    <section
      ref={sectionRef}
      className="projects-showcase relative bg-obsidian text-slate-100 overflow-hidden py-16 sm:py-24"
      aria-label="Flagship Engineering Case Studies"
    >
      {/* Container wrapper */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Top Header & Dual-Mode Showcase Switcher */}
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-8 sm:mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-fluid-micro text-accent-coral uppercase tracking-widest mb-1.5">
              <Briefcase className="w-4 h-4 text-accent-coral" />
              <span>Awwwards Dual-Mode Showcase • Kinetic Ledger</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight uppercase">
              Engineered <span className="text-accent-coral">Systems</span> & <span className="text-alabaster">Experiences</span>
            </h2>
          </div>

          {/* Dual-Mode View Switcher Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-full bg-obsidian-surface border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  handleLedgerLeave();
                  setViewMode('ledger');
                }}
                aria-label="Switch to Editorial Project Index Ledger view"
                aria-pressed={viewMode === 'ledger'}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs transition-all duration-200 ${
                  viewMode === 'ledger'
                    ? 'bg-accent-coral text-obsidian font-bold shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Index Ledger</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLedgerLeave();
                  setViewMode('cards');
                }}
                aria-label="Switch to Flagship Interactive Cards view"
                aria-pressed={viewMode === 'cards'}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs transition-all duration-200 ${
                  viewMode === 'cards'
                    ? 'bg-accent-coral text-obsidian font-bold shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Flagship Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MODE 1: EDITORIAL PROJECT INDEX LEDGER (DENNIS SNELLENBERG STYLE)   */}
        {/* ================================================================== */}
        {viewMode === 'ledger' ? (
          <div
            className="w-full flex flex-col relative"
            onMouseLeave={handleLedgerLeave}
            onPointerLeave={handleLedgerLeave}
          >
            {FLAGSHIP_PROJECTS.map((project, idx) => {
              const isHovered = hoveredIndex === idx;
              const isExpanded = transitionActiveProject?.id === project.id;

              return (
                <div
                  key={project.id}
                  className="skew-elem relative w-full group transition-opacity duration-300"
                  style={{
                    opacity: hoveredIndex !== null && !isHovered ? 0.35 : 1,
                  }}
                  onMouseEnter={() => handleRowEnter(idx)}
                  onPointerEnter={() => handleRowEnter(idx)}
                >
                  {/* 1px horizontal divider rule above row */}
                  <div
                    className="ledger-divider w-full h-[1px] border-t border-white/15 block"
                    style={{ transformOrigin: 'left center' }}
                    aria-hidden="true"
                  />

                  {/* Main Ledger Row */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      const isPreviewActive = previewRef.current && 
                        window.getComputedStyle(previewRef.current).display !== 'none' && 
                        hoveredIndex === idx;
                      const source = isPreviewActive ? previewRef.current : (e.currentTarget as HTMLElement);
                      openCaseStudy(project, source);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const isPreviewActive = previewRef.current && 
                          window.getComputedStyle(previewRef.current).display !== 'none' && 
                          hoveredIndex === idx;
                        const source = isPreviewActive ? previewRef.current : (e.currentTarget as HTMLElement);
                        openCaseStudy(project, source);
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-label={`${project.title}: ${project.role}, ${project.year}. Press Enter to open case study.`}
                    className="w-full py-8 sm:py-10 md:py-12 px-2 sm:px-4 lg:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 cursor-pointer select-none focus:outline-none focus:bg-white/5 transition-colors"
                  >
                    {/* Left: Zero-Padded Monospace Index + Title */}
                    <div className="flex items-baseline gap-4 sm:gap-8 flex-1 min-w-0">
                      <span className="font-mono text-fluid-mono sm:text-lg text-accent-coral font-bold shrink-0">
                        {project.number}
                      </span>
                      <h3
                        style={{
                          transform: isHovered ? 'translateX(16px)' : 'translateX(0px)',
                          opacity: isHovered ? 1 : 0.9,
                        }}
                        className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-alabaster tracking-tight group-hover:text-accent-coral transition-all duration-300 ease-out"
                      >
                        {project.title}
                      </h3>
                    </div>

                    {/* Right: Surgical Metadata Columns + Interactive External Arrow Indicator */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 sm:gap-8 lg:gap-10 text-left shrink-0">
                      {/* Role */}
                      <div className="min-w-[150px] hidden sm:block">
                        <span className="block font-mono text-[10px] text-muted-light uppercase tracking-wider">Role</span>
                        <span className="font-mono text-xs sm:text-sm text-alabaster-dim">{project.role}</span>
                      </div>

                      {/* Services / Core Stack */}
                      <div className="min-w-[170px] hidden md:block">
                        <span className="block font-mono text-[10px] text-muted-light uppercase tracking-wider">Services / Stack</span>
                        <span className="font-mono text-xs sm:text-sm text-muted-light">{project.coreStack}</span>
                      </div>

                      {/* Year */}
                      <div className="min-w-[44px]">
                        <span className="block font-mono text-[10px] text-muted-light uppercase tracking-wider">Year</span>
                        <span className="font-mono text-xs sm:text-sm text-alabaster-dim">{project.year}</span>
                      </div>

                      {/* Interactive External Arrow & Action Icons */}
                      <div className="flex items-center gap-2">
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`GitHub repository for ${project.title}`}
                          className="p-2.5 rounded-full bg-white/5 hover:bg-accent-coral/20 text-slate-300 hover:text-accent-coral transition-colors border border-white/10"
                        >
                          <GithubIcon className="w-4 h-4" />
                        </a>

                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Live demo for ${project.title}`}
                            className="p-2.5 rounded-full bg-white/5 hover:bg-accent-coral/20 text-slate-300 hover:text-accent-coral transition-colors border border-white/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <div
                          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-alabaster group-hover:border-accent-coral group-hover:bg-accent-coral group-hover:text-obsidian transition-all duration-300 shrink-0"
                        >
                          <ArrowUpRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Technical Specification Shelf */}
                  <div
                    id={`project-details-${project.id}`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      handleLedgerLeave();
                    }}
                    className={`px-2 sm:px-6 lg:px-8 overflow-hidden transition-all duration-300 border-t border-white/5 bg-carbon/30 ${
                      isExpanded ? 'max-h-[900px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0 pointer-events-none'
                    }`}
                    aria-hidden={!isExpanded}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                      {/* Left: Problem & Solution Details */}
                      <div className="lg:col-span-7 space-y-4">
                        <div>
                          <p className="font-mono text-xs sm:text-sm text-accent-coral font-medium mb-1">
                            {project.subtitle}
                          </p>
                          <p className="font-body text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {project.solution.description}
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="font-mono text-[10px] text-muted-light uppercase tracking-wider block">
                            Architectural Highlights
                          </span>
                          {project.solution.architecture.map((item, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-accent-coral mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {project.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2.5 py-0.5 rounded bg-white/5 font-mono text-[11px] text-slate-300 border border-white/5"
                            >
                              #{tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Metrics & Interactive Simulator Switcher */}
                      <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-muted-light uppercase tracking-wider block">
                            Quantified Impact Telemetry
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {project.impact.metrics.map((m, mIdx) => (
                              <div key={mIdx} className="p-3 rounded-lg bg-obsidian-surface border border-white/5 text-center">
                                <div className="font-mono text-[9px] uppercase tracking-wider text-muted-light">{m.label}</div>
                                <div className="font-mono font-bold text-xs sm:text-sm text-accent-coral my-0.5">{m.value}</div>
                                <div className="font-mono text-[8px] text-slate-500 truncate">{m.detail}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleJumpToProjectCard(idx)}
                            aria-label={`Open interactive sandbox simulator for ${project.title}`}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-coral text-obsidian font-mono text-xs font-bold hover:bg-accent-hover transition-colors shadow-glow-cyan"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Launch Live Simulator</span>
                          </button>

                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-accent-coral hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Source</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1px horizontal divider rule below the last row */}
                  {idx === FLAGSHIP_PROJECTS.length - 1 && (
                    <div
                      className="ledger-divider w-full h-[1px] border-t border-white/15 block"
                      style={{ transformOrigin: 'left center' }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ================================================================== */
          /* MODE 2: FLAGSHIP INTERACTIVE CASE STUDY CARDS VIEW                 */
          /* ================================================================== */
          <div className="w-full flex flex-col gap-6">
            {/* Card Navigator Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-carbon/90 border border-white/10 backdrop-blur-xl">
                {FLAGSHIP_PROJECTS.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveCardIndex(idx)}
                    className={`px-3 py-1 rounded-full font-mono text-xs transition-all ${
                      activeCardIndex === idx
                        ? 'bg-accent-coral text-obsidian font-bold shadow-glow-cyan'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    aria-label={`Jump to project card ${p.title}`}
                  >
                    {p.number}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  disabled={activeCardIndex === 0}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Previous project card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextCard}
                  disabled={activeCardIndex === FLAGSHIP_PROJECTS.length - 1}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Next project card"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Featured Active Project Card */}
            <div
              className="skew-elem w-full cursor-pointer"
              onClick={(e) => openCaseStudy(activeProject, e.currentTarget as HTMLElement)}
            >
              <LiquidGlassCard
                spotlightColor={activeProject.accent}
                spotlightRadius={550}
                spotlightOpacity={0.16}
                className="liquid-glass w-full min-h-[520px] p-5 sm:p-7 flex flex-col justify-between group"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded bg-accent-coral/15 text-accent-coral border border-accent-coral/30">
                      {activeProject.number} / 05
                    </span>
                    <div>
                      <span className="font-mono text-[11px] text-slate-400 uppercase tracking-widest block">
                        {activeProject.category}
                      </span>
                      <h3 className="font-display font-black text-xl sm:text-2xl text-white group-hover:text-accent-coral transition-colors">
                        {activeProject.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all border border-white/10"
                      aria-label={`GitHub repository for ${activeProject.title}`}
                    >
                      <GithubIcon className="w-4 h-4" />
                    </a>
                    {activeProject.liveUrl && (
                      <a
                        href={activeProject.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-accent-coral/20 text-slate-300 hover:text-accent-coral transition-all border border-white/10"
                        aria-label={`Live demo for ${activeProject.title}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Split Content: Recruiter Psychology & Interactive Simulator */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                  {/* Left Column: Problem, Solution, Impact Breakdown */}
                  <div className="lg:col-span-7 flex flex-col justify-between gap-3">
                    <p className="font-mono text-xs text-slate-300 font-medium">
                      {activeProject.subtitle}
                    </p>

                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-rose-400 uppercase tracking-wider mb-1 font-bold">
                        <span>🛑 Problem Diagnosis</span>
                      </div>
                      <p className="font-body text-xs text-slate-300 leading-relaxed">
                        {activeProject.problem.description}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-mint/5 border border-cyan-mint/20">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-mint uppercase tracking-wider mb-1 font-bold">
                        <span>⚡ Architectural Solution</span>
                      </div>
                      <p className="font-body text-xs text-slate-300 leading-relaxed mb-2">
                        {activeProject.solution.description}
                      </p>
                      <div className="space-y-1">
                        {activeProject.solution.architecture.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-cyan-mint mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {activeProject.impact.metrics.map((metric, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-2.5 rounded-lg bg-carbon-surface/90 border border-white/5 text-center"
                        >
                          <div className="font-mono text-[9px] uppercase tracking-wider text-slate-400">
                            {metric.label}
                          </div>
                          <div className="font-mono font-bold text-xs sm:text-sm my-0.5 text-accent-coral">
                            {metric.value}
                          </div>
                          <div className="font-mono text-[8px] text-slate-500 truncate">
                            {metric.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Unique Interactive Preview Simulator */}
                  <div className="lg:col-span-5 flex flex-col min-h-[260px]">
                    {activeProject.previewType === 'mental-defrag' && <MentalDefragPreview />}
                    {activeProject.previewType === 'doclens' && <DocLensBDPreview />}
                    {activeProject.previewType === 'rannabanna' && <RannabannaPreview />}
                    {activeProject.previewType === 'trash-trail' && <TrashTrailPreview />}
                    {activeProject.previewType === 'neon-vanguard' && <NeonVanguardPreview />}
                  </div>
                </div>

                {/* Card Footer: Tech Stack Pills & Direct Inspection */}
                <div className="border-t border-white/10 pt-3 mt-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px] text-slate-300 border border-white/5 hover:border-accent-coral/30 transition-colors"
                      >
                        #{tech}
                      </span>
                    ))}
                  </div>

                  <a
                    href={activeProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-fluid-micro text-accent-coral hover:underline transition-all"
                  >
                    <span>Deep Dive Specification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </LiquidGlassCard>
            </div>
          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* CURSOR-BOUND FLOATING MEDIA PREVIEW PORTAL (DENNIS SNELLENBERG STYLE) */}
      {/* ==================================================================== */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <>
          {/* Root-Level Floating Preview Portal (position: fixed; top: 0; left: 0; width: 380px; aspect-ratio: 16/10; pointer-events: none; z-index: 50; overflow: hidden) */}
          <div
            ref={previewRef}
            data-preview-portal="true"
            className="hidden lg:block fixed top-0 left-0 pointer-events-none overflow-hidden rounded-2xl border border-white/15 bg-obsidian-card shadow-editorial-elevated z-50"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: 380,
              aspectRatio: '16/10',
              pointerEvents: 'none',
              zIndex: 50,
              overflow: 'hidden',
            }}
            aria-hidden="true"
          >
            {/* Inner reel of vertically stacked preview slides translated to -index * 100% */}
            <div
              ref={reelRef}
              data-preview-reel="true"
              className="w-full relative"
              style={{ height: '100%', width: '100%' }}
            >
              {FLAGSHIP_PROJECTS.map((project, idx) => (
                <div
                  key={project.id}
                  className="absolute top-0 left-0 w-full h-full p-5 flex flex-col justify-between overflow-hidden bg-obsidian-darker"
                  style={{
                    transform: `translateY(${idx * 100}%)`,
                  }}
                >
                  {/* Slide 0: Mental Defrag */}
                  {project.previewType === 'mental-defrag' && (
                    <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#0c0c12] via-[#09090c] to-[#140b0a]">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-coral animate-ping" />
                          <span className="font-mono text-[10px] text-accent-coral uppercase tracking-wider font-bold">
                            Spatial Physics 01
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          60 FPS • 0ms
                        </span>
                      </div>

                      <div className="relative my-auto flex items-center justify-center py-2">
                        <svg viewBox="0 0 280 100" className="w-full max-h-[90px] stroke-accent-coral/60 fill-none">
                          <circle cx="140" cy="50" r="42" strokeDasharray="3 3" className="opacity-40" />
                          <circle cx="140" cy="50" r="24" strokeDasharray="2 2" className="opacity-60" />
                          <line x1="80" y1="35" x2="140" y2="50" strokeWidth="1" className="opacity-50" />
                          <line x1="200" y1="35" x2="140" y2="50" strokeWidth="1" className="opacity-50" />
                          <line x1="110" y1="75" x2="140" y2="50" strokeWidth="1" className="opacity-50" />
                          <line x1="170" y1="75" x2="140" y2="50" strokeWidth="1" className="opacity-50" />
                          <circle cx="140" cy="50" r="14" fill="#0A0A0A" stroke="#DF6C4F" strokeWidth="2" />
                          <circle cx="80" cy="35" r="8" fill="#DF6C4F" />
                          <circle cx="200" cy="35" r="8" fill="#A74024" />
                          <circle cx="110" cy="75" r="6" fill="#DF6C4F" />
                          <circle cx="170" cy="75" r="6" fill="#A74024" />
                          <text x="140" y="53" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontFamily="monospace">CANVAS</text>
                          <text x="80" y="24" textAnchor="middle" fill="#DF6C4F" fontSize="6" fontFamily="monospace">Matter.js</text>
                          <text x="200" y="24" textAnchor="middle" fill="#A74024" fontSize="6" fontFamily="monospace">Vectors</text>
                        </svg>
                      </div>

                      <div className="relative z-10 border-t border-white/10 pt-2 flex items-end justify-between">
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">Mental Defrag</h4>
                          <p className="font-mono text-[9px] text-slate-400">Zero-Gravity Spatial Cognitive Obsidian Engine</p>
                        </div>
                        <span className="font-mono text-[9px] text-accent-coral font-bold">#Matter.js</span>
                      </div>
                    </div>
                  )}

                  {/* Slide 1: DocLensBD */}
                  {project.previewType === 'doclens' && (
                    <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#0c0f0a] via-[#090b08] to-[#120a06]">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-warm animate-ping" />
                          <span className="font-mono text-[10px] text-amber-warm uppercase tracking-wider font-bold">
                            Cloud Stream 02
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          99.98% SLA
                        </span>
                      </div>

                      <div className="relative my-auto flex items-center justify-center py-2">
                        <svg viewBox="0 0 280 100" className="w-full max-h-[90px] stroke-amber-warm/60 fill-none">
                          <path d="M 10 50 L 60 50 L 75 25 L 90 75 L 105 35 L 120 65 L 135 50 L 180 50 L 195 20 L 210 80 L 225 50 L 270 50" strokeWidth="1.5" />
                          <rect x="35" y="60" width="45" height="18" rx="3" fill="#0A0A0A" stroke="#A74024" strokeWidth="1" />
                          <text x="57" y="72" textAnchor="middle" fill="#A74024" fontSize="7" fontFamily="monospace">EMR HUB</text>
                          <rect x="195" y="60" width="55" height="18" rx="3" fill="#0A0A0A" stroke="#10B981" strokeWidth="1" />
                          <text x="222" y="72" textAnchor="middle" fill="#10B981" fontSize="7" fontFamily="monospace">FIRESTORE</text>
                        </svg>
                      </div>

                      <div className="relative z-10 border-t border-white/10 pt-2 flex items-end justify-between">
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">DocLensBD</h4>
                          <p className="font-mono text-[9px] text-slate-400">Cloud Health Pipeline & AES-256 Vault</p>
                        </div>
                        <span className="font-mono text-[9px] text-amber-warm font-bold">#CloudFirestore</span>
                      </div>
                    </div>
                  )}

                  {/* Slide 2: Rannabanna */}
                  {project.previewType === 'rannabanna' && (
                    <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#0f0b09] via-[#0b0807] to-[#140b08]">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-coral animate-ping" />
                          <span className="font-mono text-[10px] text-accent-coral uppercase tracking-wider font-bold">
                            Full-Stack NLP 03
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          99/100 Lighthouse
                        </span>
                      </div>

                      <div className="relative my-auto flex items-center justify-center py-1">
                        <div className="text-center">
                          <span className="font-display font-black text-2xl text-accent-coral tracking-wider opacity-85 block">
                            রান্নাবান্না
                          </span>
                          <span className="font-mono text-[10px] text-slate-300 block mt-0.5">
                            সরিষা ইলিশ • কাচ্চি • শিল-পাটার ভর্তা
                          </span>
                          <span className="font-mono text-[8px] text-slate-500 block">
                            UTF-8 Subsetting (22KB) • Phonetic Indexing
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 border-t border-white/10 pt-2 flex items-end justify-between">
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">Rannabanna</h4>
                          <p className="font-mono text-[9px] text-slate-400">Localized Bengali Culinary & Nutrition Engine</p>
                        </div>
                        <span className="font-mono text-[9px] text-accent-coral font-bold">#BengaliNLP</span>
                      </div>
                    </div>
                  )}

                  {/* Slide 3: Trash Trail */}
                  {project.previewType === 'trash-trail' && (
                    <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#0c0a16] via-[#09080f] to-[#12080f]">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-warm animate-ping" />
                          <span className="font-mono text-[10px] text-amber-warm uppercase tracking-wider font-bold">
                            Creative Motion 04
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          GSAP Scrub 0.8s
                        </span>
                      </div>

                      <div className="relative my-auto flex items-center justify-center py-2">
                        <svg viewBox="0 0 280 80" className="w-full max-h-[80px]">
                          <path d="M 0 80 L 0 50 L 25 50 L 25 30 L 45 30 L 45 60 L 70 60 L 70 20 L 95 20 L 95 65 L 130 65 L 130 35 L 160 35 L 160 70 L 195 70 L 195 25 L 225 25 L 225 55 L 255 55 L 255 40 L 280 40 L 280 80 Z" fill="rgba(167, 64, 36, 0.25)" />
                          <line x1="0" y1="70" x2="280" y2="70" stroke="#DF6C4F" strokeWidth="1.5" strokeDasharray="6 3" />
                          <circle cx="80" cy="65" r="3" fill="#DF6C4F" />
                          <circle cx="150" cy="72" r="2.5" fill="#A74024" />
                          <circle cx="210" cy="67" r="3" fill="#DF6C4F" />
                        </svg>
                      </div>

                      <div className="relative z-10 border-t border-white/10 pt-2 flex items-end justify-between">
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">Trash Trail</h4>
                          <p className="font-mono text-[9px] text-slate-400">Kinetic Scroll-Driven Interactive Storytelling</p>
                        </div>
                        <span className="font-mono text-[9px] text-amber-warm font-bold">#ScrollTrigger</span>
                      </div>
                    </div>
                  )}

                  {/* Slide 4: Neon Vanguard */}
                  {project.previewType === 'neon-vanguard' && (
                    <div className="w-full h-full flex flex-col justify-between relative bg-gradient-to-br from-[#08080d] via-[#060609] to-[#0c0812]">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent-coral animate-ping" />
                          <span className="font-mono text-[10px] text-accent-coral uppercase tracking-wider font-bold">
                            Systems & Engine 05
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          120 FPS • 0 Leaks
                        </span>
                      </div>

                      <div className="relative my-auto flex items-center justify-center py-2">
                        <svg viewBox="0 0 280 80" className="w-full max-h-[80px]">
                          <line x1="20" y1="20" x2="240" y2="60" stroke="#DF6C4F" strokeWidth="2" strokeDasharray="8 4" />
                          <line x1="20" y1="60" x2="240" y2="20" stroke="#A74024" strokeWidth="2" />
                          <circle cx="130" cy="40" r="12" fill="#0A0A0A" stroke="#DF6C4F" strokeWidth="1.5" />
                          <text x="130" y="43" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontFamily="monospace">shm_shmget</text>
                          <circle cx="230" cy="22" r="5" fill="#DF6C4F" />
                          <circle cx="230" cy="58" r="5" fill="#A74024" />
                        </svg>
                      </div>

                      <div className="relative z-10 border-t border-white/10 pt-2 flex items-end justify-between">
                        <div>
                          <h4 className="font-display font-extrabold text-sm text-white uppercase tracking-tight">Neon Vanguard</h4>
                          <p className="font-mono text-[9px] text-slate-400">HTML5 2D Canvas & Linux C/C++ OS Kernel Labs</p>
                        </div>
                        <span className="font-mono text-[9px] text-accent-coral font-bold">#LinuxC</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Inner Label Cursor ({ duration: 0.2, ease: 'power3' }) */}
          <div
            ref={labelRef}
            data-cursor-label="view"
            className="hidden lg:flex fixed top-0 left-0 pointer-events-none items-center justify-center rounded-full bg-accent-coral text-obsidian font-mono text-[11px] font-black uppercase tracking-wider shadow-glow-cyan"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: 68,
              height: 68,
              pointerEvents: 'none',
              zIndex: 51,
            }}
            aria-hidden="true"
          >
            <div className="flex items-center gap-0.5">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </>,
        document.body
      )}

    </section>
  );
};

export default ProjectsShowcase;
