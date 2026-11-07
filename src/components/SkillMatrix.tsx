import React, { useState, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';
import { audio } from '../utils/audio';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { Magnetic } from './ui/Magnetic';
import { RetroWindow } from './ui/RetroWindow';
import { 
  Layers, 
  Database, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Zap,
  Cpu,
  Activity,
  ShieldCheck,
  Radio,
  Briefcase
} from 'lucide-react';

export interface ArchitectureTech {
  id: string;
  name: string;
  category: 'client' | 'server' | 'systems';
  description: string;
  capabilities: string[];
  projectIds: string[];
  tag: string;
  pinId: string;
}

export interface FlagshipProjectLink {
  id: string;
  title: string;
  number: string;
  tagline: string;
  githubUrl: string;
  accent: 'cyan' | 'amber' | 'phosphor';
  layerBadge: string;
  techTags: string[];
}

// 6 Flagship Projects as defined in portfolio requirements
export const FLAGSHIP_PROJECTS: FlagshipProjectLink[] = [
  {
    id: 'mental-defrag',
    title: 'Mental Defrag',
    number: 'ROM_01',
    tagline: 'Zero-Gravity Spatial Cognitive Obsidian Engine',
    githubUrl: 'https://github.com/watchknight/Mental-Defrag',
    accent: 'cyan',
    layerBadge: 'Spatial Physics & Vector Engine',
    techTags: ['Matter.js', 'Obsidian AST', 'React 18', 'IndexedDB', 'Vectors'],
  },
  {
    id: 'doclens-bd',
    title: 'DocLensBD',
    number: 'ROM_02',
    tagline: 'Cloud-Backed Health Intelligence & Diagnostic Pipeline',
    githubUrl: 'https://github.com/watchknight/DocLensBD',
    accent: 'amber',
    layerBadge: 'Cloud Firestore & Staging CI/CD',
    techTags: ['Cloud Firestore', 'CI/CD Pass', 'React 18', 'Tailwind', 'Firebase'],
  },
  {
    id: 'rannabanna',
    title: 'Rannabanna',
    number: 'ROM_03',
    tagline: 'Localized Bengali Culinary & Nutrition Engine',
    githubUrl: 'https://github.com/watchknight/Rannabanna',
    accent: 'cyan',
    layerBadge: 'Bengali NLP & Cloud DB Sync',
    techTags: ['React 18', 'Cloud DB Sync', 'MongoDB', 'IndexedDB', 'Tailwind'],
  },
  {
    id: 'trash-trail',
    title: 'Trash Trail',
    number: 'ROM_04',
    tagline: 'Kinetic Scroll-Driven Interactive Storytelling Web Architecture',
    githubUrl: 'https://github.com/watchknight/TrashTrail',
    accent: 'amber',
    layerBadge: 'GSAP Inertial Scroll Choreography',
    techTags: ['GSAP Motion', 'Vanilla Micro-DOM', 'WebGL Shaders', 'SVG Kinematics'],
  },
  {
    id: 'neon-vanguard',
    title: 'Neon Vanguard 2D & OS Kernel Labs',
    number: 'ROM_05',
    tagline: 'HTML5 2D Canvas Combat Engine & Linux C/C++ OS Kernel Labs',
    githubUrl: 'https://github.com/watchknight/BitForge',
    accent: 'phosphor',
    layerBadge: 'POSIX IPC Pipes & Shared Memory',
    techTags: ['C/C++ Systems', 'POSIX shmget/shmat', '120 FPS Canvas', 'Valgrind 0 Leaks'],
  },
  {
    id: 'chronos-aether',
    title: 'Chronos-Guard & Aether-GL',
    number: 'ROM_06',
    tagline: 'Cryptographic Merkle Agent Ledger & Audio-Reactive WebGPU Fluid Studio',
    githubUrl: 'https://github.com/watchknight',
    accent: 'cyan',
    layerBadge: 'WebGPU Shaders & Merkle Ledger',
    techTags: ['Three.js/GLSL', 'Merkle Tree', 'Vector Cosine', 'TypeScript AST'],
  },
];

// The 3 Architectural Layers with cross-project associations matching exact prompt requirements
export const ARCHITECTURE_LAYERS: {
  key: 'client' | 'server' | 'systems';
  layerTag: string;
  title: string;
  subtitle: string;
  description: string;
  accent: 'cyan' | 'amber' | 'phosphor';
  busChannel: string;
  icon: React.ComponentType<{ className?: string }>;
  techs: ArchitectureTech[];
}[] = [
  {
    key: 'client',
    layerTag: 'LAYER_01: CLIENT, 3D WEBGL & MOTION',
    title: 'Client, 3D WebGL & Motion',
    subtitle: 'Layer 01 • Reactive DOM, Viewport Kinematics & Physics',
    description: 'Sub-frame 60/120 FPS rendering pipelines, inertial scroll scrubbing, and state machine UI reconciliation.',
    accent: 'cyan',
    busChannel: 'BUS_01 // HIGH-SPEED VIEWPORT DMA',
    icon: Sparkles,
    techs: [
      {
        id: 'tech-three',
        name: 'Three.js / GLSL',
        category: 'client',
        description: 'Custom vertex/fragment shaders, GPU particle wave mathematics, post-processing composer pipelines, and additive bloom buffers.',
        capabilities: ['Custom GLSL Shaders', 'RenderPixelatedPass', 'GPU Wave Physics'],
        projectIds: ['mental-defrag', 'trash-trail', 'chronos-aether'],
        tag: '3D Graphics Kernel',
        pinId: 'PIN_GLSL',
      },
      {
        id: 'tech-react',
        name: 'React 18 / Next.js',
        category: 'client',
        description: 'Concurrent reconciler, server components, optimistic UI mutations, and fluid state machines.',
        capabilities: ['Concurrent Mode', 'Custom Hook Primitives', 'SSR / SSG Pipelines'],
        projectIds: ['mental-defrag', 'doclens-bd', 'rannabanna'],
        tag: 'Framework Core',
        pinId: 'PIN_R18',
      },
      {
        id: 'tech-ts',
        name: 'TypeScript',
        category: 'client',
        description: 'Strict compile-time type verification, abstract syntax tree models, and generic utility algebra.',
        capabilities: ['Strict Type Systems', 'AST Compilation', 'Zero Runtime Overhead'],
        projectIds: ['mental-defrag', 'doclens-bd', 'chronos-aether'],
        tag: 'Type Safety',
        pinId: 'PIN_TS5',
      },
      {
        id: 'tech-gsap',
        name: 'GSAP & ScrollTrigger',
        category: 'client',
        description: 'Hardware-accelerated timeline choreography, pinned multi-stage narrative scrubbers, and bezier easing.',
        capabilities: ['Pinned Viewports', 'Micro-Scrubbing', 'GPU Composite Layers'],
        projectIds: ['trash-trail'],
        tag: 'Kinetic Motion',
        pinId: 'PIN_GSAP',
      },
      {
        id: 'tech-canvas',
        name: 'HTML5 2D Canvas & Shaders',
        category: 'client',
        description: 'Low-overhead 120 FPS render loops, spatial raycasting, pre-allocated particle pools, and luminous arcs.',
        capabilities: ['120 FPS Pacing', 'Raycast Piercing', 'Dynamic Luminescence'],
        projectIds: ['neon-vanguard'],
        tag: 'Graphics Kernel',
        pinId: 'PIN_CNV2D',
      },
      {
        id: 'tech-matter',
        name: 'Matter.js Physics Engine',
        category: 'client',
        description: '2D rigid-body spatial mechanics, zero-gravity damping formulas, and harmonic repulsive vector fields.',
        capabilities: ['Rigid-Body Solver', 'Zero-G Damping', 'Harmonic Clumping'],
        projectIds: ['mental-defrag'],
        tag: 'Physics Loop',
        pinId: 'PIN_PHYS',
      },
      {
        id: 'tech-tailwind',
        name: 'Tailwind CSS & Tokens',
        category: 'client',
        description: 'Fluid mathematical typography formulas, glassmorphic optics, dark mode tokens, and JIT bundling.',
        capabilities: ['Fluid Clamps', 'Optical Glass Realism', 'Custom CSS Shaders'],
        projectIds: ['doclens-bd', 'rannabanna'],
        tag: 'Design System',
        pinId: 'PIN_CSS',
      },
      {
        id: 'tech-vanilla-svg',
        name: 'Vanilla JS & SVG Kinematics',
        category: 'client',
        description: 'Zero virtual-DOM overhead execution, kinetic SVG matrix morphing, and direct requestAnimationFrame tickers.',
        capabilities: ['0 CLS Overhead', 'Direct Event Dispatch', 'Composite Layering'],
        projectIds: ['trash-trail'],
        tag: 'Bare Micro-DOM',
        pinId: 'PIN_DOM',
      },
    ],
  },
  {
    key: 'server',
    layerTag: 'LAYER_02: DISTRIBUTED SERVER & DATA',
    title: 'Distributed Server & Data',
    subtitle: 'Layer 02 • Distributed Storage, Offline First & Pipelines',
    description: 'Event-driven asynchronous services, resilient multi-client sync, continuous integration, and vector semantics.',
    accent: 'amber',
    busChannel: 'BUS_02 // FAULT-TOLERANT CLOUD FABRIC',
    icon: Database,
    techs: [
      {
        id: 'tech-firestore',
        name: 'Cloud Firestore',
        category: 'server',
        description: 'Real-time WebSocket snapshot streams, multi-region fault tolerance, and offline mutation queues.',
        capabilities: ['Realtime Listeners', '< 45ms Sync', 'Offline Write Cache'],
        projectIds: ['doclens-bd'],
        tag: 'Cloud DB',
        pinId: 'PIN_FSTORE',
      },
      {
        id: 'tech-node',
        name: 'Node.js & Express',
        category: 'server',
        description: 'Asynchronous event loop, non-blocking stream processing, REST endpoints, and custom middleware chains.',
        capabilities: ['Non-Blocking IO', 'Streaming Payloads', 'Stateless APIs'],
        projectIds: ['doclens-bd', 'rannabanna'],
        tag: 'Runtime Engine',
        pinId: 'PIN_NODE',
      },
      {
        id: 'tech-postgres',
        name: 'PostgreSQL Relational DB',
        category: 'server',
        description: 'Relational data modeling, ACID transactions, complex JOINs, foreign key constraints, and indexing.',
        capabilities: ['ACID Compliance', 'Relational Schemas', 'Indexing & Queries'],
        projectIds: ['doclens-bd'],
        tag: 'Relational DB',
        pinId: 'PIN_PG',
      },
      {
        id: 'tech-mongo',
        name: 'MongoDB Document Store',
        category: 'server',
        description: 'Document collections, dynamic BSON schemas, aggregation pipelines, and high-concurrency ingestion.',
        capabilities: ['Aggregation Pipeline', 'BSON Documents', 'Dynamic Collections'],
        projectIds: ['rannabanna'],
        tag: 'Document Store',
        pinId: 'PIN_MONGO',
      },
      {
        id: 'tech-auth',
        name: 'Firebase Auth & Security Rules',
        category: 'server',
        description: 'Cryptographic JWT token verification, role-based access control (RBAC), and AES-256 field encryption.',
        capabilities: ['RBAC Security Rules', 'Cryptographic Tokens', 'Field Encryption'],
        projectIds: ['doclens-bd'],
        tag: 'Security & Auth',
        pinId: 'PIN_AUTH',
      },
      {
        id: 'tech-idb',
        name: 'IndexedDB Persistence',
        category: 'server',
        description: 'High-throughput browser-local transactional key-value store powering zero-latency offline experiences.',
        capabilities: ['0ms Local Query', 'Structured Clones', 'Offline-First Fallback'],
        projectIds: ['mental-defrag', 'rannabanna'],
        tag: 'Client Storage',
        pinId: 'PIN_IDB',
      },
      {
        id: 'tech-sync',
        name: 'Cloud DB Realtime Sync',
        category: 'server',
        description: 'Optimistic UI update reconciler ensuring zero data loss and automated conflict resolution over flaky networks.',
        capabilities: ['Conflict Resolution', 'Optimistic UI', 'Packet Reconciliation'],
        projectIds: ['rannabanna', 'doclens-bd'],
        tag: 'Sync Engine',
        pinId: 'PIN_SYNC',
      },
      {
        id: 'tech-cicd',
        name: 'GitHub Actions CI/CD',
        category: 'server',
        description: 'Automated test suite orchestrations, build artifact validation, lint gates, and multi-stage branch staging.',
        capabilities: ['14/14 Automated Pass', 'Multi-Platform Matrix', 'Zero-Downtime Push'],
        projectIds: ['doclens-bd'],
        tag: 'Automation CI',
        pinId: 'PIN_CICD',
      },
      {
        id: 'tech-vectors',
        name: 'Vector Embeddings & Cosine Math',
        category: 'server',
        description: 'Client-side cosine similarity spatial distance matrices enabling semantic thought clumping and node repulsion.',
        capabilities: ['Cosine Similarity', 'Local Dimension Index', 'Dynamic Repulsion'],
        projectIds: ['mental-defrag', 'chronos-aether'],
        tag: 'Semantic Vectors',
        pinId: 'PIN_VEC',
      },
    ],
  },
  {
    key: 'systems',
    layerTag: 'LAYER_03: LINUX KERNEL & C/C++ POSIX IPC',
    title: 'Linux Kernel & C/C++ POSIX IPC',
    subtitle: 'Layer 03 • Ring-0 Syscalls, POSIX IPC & Kernel Primitives',
    description: 'Deterministic memory safety, anonymous pipes, shared memory segments, process trees, and compiler AST parsing.',
    accent: 'phosphor',
    busChannel: 'BUS_03 // RING-0 KERNEL POSIX BUS',
    icon: Terminal,
    techs: [
      {
        id: 'tech-c-cpp',
        name: 'C / C++ Systems',
        category: 'systems',
        description: 'Direct heap/stack pointer management, struct memory alignment, and deterministic lifecycle architectures.',
        capabilities: ['Manual Alloc (malloc/free)', 'Byte Alignment', 'Hardware Locality'],
        projectIds: ['neon-vanguard'],
        tag: 'Low-Level Core',
        pinId: 'PIN_CPP',
      },
      {
        id: 'tech-shm',
        name: 'POSIX shmget / shmat',
        category: 'systems',
        description: 'Zero-copy inter-process memory regions synchronized via atomic spinlocks and POSIX semaphore locks.',
        capabilities: ['shmget & shmat', 'Zero-Copy Ring Buffer', 'Spinlock Safety'],
        projectIds: ['neon-vanguard'],
        tag: 'Kernel Shared RAM',
        pinId: 'PIN_SHM',
      },
      {
        id: 'tech-ipc-pipes',
        name: 'Linux POSIX IPC & Pipes',
        category: 'systems',
        description: 'Anonymous duplex pipe channels, inter-process streaming pipelines, and non-blocking descriptor polling.',
        capabilities: ['Anonymous Pipes', '< 1.2μs IPC Latency', 'Duplex Data Stream'],
        projectIds: ['neon-vanguard'],
        tag: 'Process Streams',
        pinId: 'PIN_PIPES',
      },
      {
        id: 'tech-fork',
        name: 'Process fork() Trees & Hierarchies',
        category: 'systems',
        description: 'Process spawning hierarchies with signal handling (SIGCHLD, SIGKILL), zombie reclamation, and exit code trapping.',
        capabilities: ['fork() Trees', 'Zombie Reaping', 'POSIX Signals'],
        projectIds: ['neon-vanguard'],
        tag: 'Process Lifecycle',
        pinId: 'PIN_FORK',
      },
      {
        id: 'tech-bash',
        name: 'Linux Shell & Bash Automation',
        category: 'systems',
        description: 'POSIX shell toolchains, automated Linux development environments, sysinfo telemetry, and Makefile compilation.',
        capabilities: ['Bash Scripting', 'Syscall Tracing', 'Automated Toolchains'],
        projectIds: ['neon-vanguard'],
        tag: 'Linux Environment',
        pinId: 'PIN_BASH',
      },
      {
        id: 'tech-valgrind',
        name: 'Memory Safety & Valgrind Audits',
        category: 'systems',
        description: 'Zero memory leak verification, cache miss telemetry profiling, buffer boundary audits, and GDB breakpoint analysis.',
        capabilities: ['0 Heap Leaks', 'Cache Boundary Check', 'GDB Telemetry'],
        projectIds: ['neon-vanguard'],
        tag: 'Safety & Profiling',
        pinId: 'PIN_VALG',
      },
      {
        id: 'tech-ast',
        name: 'Obsidian .canvas JSON AST Compilers',
        category: 'systems',
        description: 'Lossless bi-directional Abstract Syntax Tree compiler parsing, validating, and mutating Obsidian .canvas JSON graph schemas.',
        capabilities: ['Lossless AST Sync', 'JSON Graph Compiler', 'Bi-Directional Schema'],
        projectIds: ['mental-defrag'],
        tag: 'AST Compilation',
        pinId: 'PIN_AST',
      },
      {
        id: 'tech-merkle',
        name: 'Cryptographic Merkle Engine',
        category: 'systems',
        description: 'Zero-knowledge verification structures, cryptographic Merkle tree hashes, and deterministic agent ledger state integrity.',
        capabilities: ['SHA-256 Ledger', 'Merkle Proofs', 'Cryptographic Audit'],
        projectIds: ['chronos-aether'],
        tag: 'Merkle Ledger',
        pinId: 'PIN_MRK',
      },
    ],
  },
];

// 4 Authority Metrics as defined in requirements
const AUTHORITY_METRICS = [
  {
    target: '4+',
    label: '4+ YEARS CRAFT',
    sub: 'SYSTEMS & FULL-STACK CRAFT',
    accent: 'cyan',
    chipCode: 'METRIC_01',
    detail: 'Academic & Production Engineering',
  },
  {
    target: '120',
    label: '120 FPS CANVAS PACING',
    sub: 'SUB-FRAME REAL-TIME PACING',
    accent: 'cyan',
    chipCode: 'METRIC_02',
    detail: 'Combat Loop & Collision Raycasting',
  },
  {
    target: '100%',
    label: '100% OBSIDIAN AST PARITY',
    sub: 'BIDIRECTIONAL VECTOR GRAPH',
    accent: 'amber',
    chipCode: 'METRIC_03',
    detail: 'Lossless .canvas JSON Serialization',
  },
  {
    target: '0',
    label: '0 POSIX C MEMORY LEAKS',
    sub: 'VALGRIND AUDITED CLEAN PIPES',
    accent: 'amber',
    chipCode: 'METRIC_04',
    detail: 'Deterministic Shared RAM (shmget)',
  },
];

export const SkillMatrix: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useReveal(sectionRef);

  const [activeTechId, setActiveTechId] = useState<string | null>(null);
  const [lockedMode, setLockedMode] = useState<boolean>(false);
  const [activeMobileLayer, setActiveMobileLayer] = useState<'all' | 'client' | 'server' | 'systems'>('all');
  const [activeBiosTab, setActiveBiosTab] = useState<number>(0);
  const [isBiosWiping, setIsBiosWiping] = useState<boolean>(false);

  const handleBiosTabSwitch = (tabIndex: number) => {
    if (activeBiosTab === tabIndex) return;
    chiptuneAudio.playPixelTick();
    setIsBiosWiping(true);
    setActiveBiosTab(tabIndex);
    setTimeout(() => {
      setIsBiosWiping(false);
    }, 150);
  };

  // Compute active associations
  const activeTech = activeTechId 
    ? ARCHITECTURE_LAYERS.flatMap(l => l.techs).find(t => t.id === activeTechId) 
    : null;

  // Handler for tech selection/hover with procedural Web Audio feedback
  const handleTechHover = (techId: string | null) => {
    if (lockedMode) return;
    setActiveTechId(techId);
    if (techId) {
      audio.playTick();
    }
  };

  const handleTechClick = (techId: string) => {
    audio.playChord();
    if (activeTechId === techId && lockedMode) {
      setLockedMode(false);
      setActiveTechId(null);
    } else {
      setActiveTechId(techId);
      setLockedMode(true);
    }
  };

  const handleReset = () => {
    audio.playChord();
    setActiveTechId(null);
    setLockedMode(false);
  };

  const handleSectionMouseLeave = () => {
    if (lockedMode) return;
    setActiveTechId(null);
  };

  const isTechHighlighted = (tech: ArchitectureTech) => {
    return activeTechId === tech.id;
  };

  const hasAnyFilter = Boolean(activeTechId);

  return (
    <section 
      ref={sectionRef} 
      id="systems" 
      onMouseLeave={handleSectionMouseLeave}
      className="py-24 md:py-32 relative bg-[#070814] text-[#F0EFE6] overflow-hidden border-t-2 border-[#2D3645] scroll-mt-[68px]"
    >
      {/* 90s Cyberdeck Motherboard PCB Ground Grid Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#00F0FF_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF_1px,transparent_1px)] bg-[size:32px_32px] -z-10" 
        aria-hidden="true"
      />

      {/* Ambient Phosphor Flares behind the motherboard */}
      <div data-parallax="0.15" className="pointer-events-none absolute top-1/4 left-1/6 w-96 h-96 bg-[#00F0FF]/5 rounded-full blur-3xl -z-10" />
      <div data-parallax="0.2" className="pointer-events-none absolute bottom-1/4 right-1/6 w-96 h-96 bg-[#FFCC00]/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* ========================================================================= */}
        {/* SECTION HEADER: UNIFIED PHILOSOPHY & MOTHERBOARD ARCHITECTURE MAP        */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div className="max-w-3xl">
            <div data-anim className="flex items-center gap-2 font-pixel text-[10px] text-[#00F0FF] uppercase tracking-widest mb-3">
              <Layers className="w-4 h-4 text-[#00F0FF] animate-pulse" />
              <span>&gt; [03] ARCHITECTURAL PHILOSOPHY // CYBERDECK MOTHERBOARD &amp; SYSTEMS MAP</span>
            </div>
            
            <div className="overflow-visible">
              <h2 
                data-anim 
                className="font-display uppercase text-white"
                style={{
                  fontFamily: "'Space Grotesk', 'Syne', sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  fontSize: 'clamp(1.85rem, 4vw, 3.25rem)',
                  lineHeight: 1.05,
                  overflow: 'visible',
                }}
              >
                <span className="inline-block" style={{ overflowWrap: 'normal', wordBreak: 'keep-all', maxWidth: '100%', overflow: 'visible' }}>MOTHERBOARD</span> &amp; <span className="text-[#00F0FF]">SYSTEMS MATRIX</span>
              </h2>
            </div>
            
            <p data-anim data-delay="0.1" className="font-body text-fluid-body text-[#D6CFC2] mt-3 leading-relaxed">
              Merging core architectural philosophy with an interactive 3-tier competency motherboard. 
              Eliminating abstract skill percentages in favor of verified engineering proofs: from deterministic Linux POSIX shared-memory pipelines 
              to sub-frame 120 FPS WebGL rendering and resilient cloud state fabrics.
            </p>
          </div>

          {/* Interactive Tracer Ribbon & Mode Controls */}
          <div data-anim data-delay="0.15" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="px-3.5 py-2 bg-[#131629] border-2 border-[#2D3645] shadow-[2px_2px_0_0_#070814] flex items-center gap-2 font-pixel text-[9px]">
              <span className="w-2 h-2 rounded-full bg-[#4AF626] animate-ping" />
              <span className="text-[#D6CFC2]">PCB TRACER:</span>
              <span className="text-[#00F0FF] font-bold">
                {lockedMode ? 'PINNED' : activeTech ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>

            {hasAnyFilter && (
              <Magnetic>
                <button
                  onClick={handleReset}
                  aria-label="Reset tracer and clear active project or technology filter"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF2A85] text-white hover:bg-[#ff459b] font-pixel text-[9px] border-2 border-white shadow-[2px_2px_0_0_#070814] active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3 h-3 text-white" />
                  <span>[ RESET TRACE ]</span>
                </button>
              </Magnetic>
            )}
          </div>
        </div>

        {/* Drawn Top PCB Bus Line */}
        <div data-draw className="w-full h-px bg-[#2D3645] mb-10" />

        {/* ========================================================================= */}
        {/* 1. 8-BIT LED TELEMETRY COUNTERS (Glowing 90s Digital Pixel Readouts)       */}
        {/* ========================================================================= */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-pixel text-[10px] text-[#FFCC00] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#FFCC00] animate-pulse" />
              <span>&gt; 8-BIT LED TELEMETRY READOUTS // HARDWARE AUTHORITY SPEC</span>
            </div>
            <span className="font-mono text-[10px] text-[#8E98AA] hidden sm:inline">
              SYS.96 BUS CLOCK // REAL-TIME CALIBRATED
            </span>
          </div>

          <div 
            data-stagger="0.08" 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {AUTHORITY_METRICS.map((metric, idx) => {
              const isCyan = metric.accent === 'cyan';

              const borderGlow = isCyan
                ? 'border-[var(--tech-cyan-wave,#00F0FF)] shadow-[0_0_15px_rgba(0,240,255,0.35),2px_2px_0_0_#070814]'
                : 'border-[var(--pixel-amber-gold,#FFCC00)] shadow-[0_0_15px_rgba(255,204,0,0.35),2px_2px_0_0_#070814]';

              const textGlow = isCyan
                ? 'text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                : idx === 3
                ? 'text-[#4AF626] drop-shadow-[0_0_8px_rgba(74,246,38,0.6)]'
                : 'text-[#FFCC00] drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]';

              return (
                <div
                  key={idx}
                  onMouseEnter={() => audio.playTick()}
                  className={`relative p-4 sm:p-5 bg-[#0D1512] border-2 ${borderGlow} transition-all duration-200 group flex flex-col justify-between`}
                >
                  {/* Subtle LED segment grid background */}
                  <div 
                    className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(#4AF626_1px,transparent_1px)] bg-[size:8px_8px]"
                    aria-hidden="true"
                  />

                  {/* Header: Chip Code & Hardware Status */}
                  <div className="flex items-center justify-between mb-3 border-b border-[#2D3645] pb-2">
                    <span className="font-pixel text-[8px] text-[#8E98AA]">
                      {metric.chipCode}
                    </span>
                    <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-[#131629] border border-[#2D3645] text-[#4AF626] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4AF626] animate-ping" />
                      LIVE
                    </span>
                  </div>

                  {/* Digital Pixel Counter Readout */}
                  <div className="my-2">
                    <div className="flex items-baseline gap-2">
                      <span 
                        data-counter={metric.target}
                        className={`font-pixel text-3xl sm:text-4xl ${textGlow} tracking-wider`}
                      >
                        {metric.target}
                      </span>
                    </div>
                    <div className="font-pixel text-[10px] text-[#F0EFE6] mt-2 tracking-wider leading-tight">
                      {metric.label}
                    </div>
                  </div>

                  {/* Footer detail description */}
                  <div className="pt-2 border-t border-[#2D3645]/80 mt-2 font-mono text-[10px] text-[#D6CFC2] leading-snug">
                    <div className="text-[#8E98AA] text-[9px] uppercase font-pixel tracking-tighter">
                      {metric.sub}
                    </div>
                    <div className="text-[#00F0FF] text-[10px] mt-0.5 font-medium break-words leading-tight">
                      {metric.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Technology Diagnostic Circuit Route Notice */}
        {activeTech && (
          <div className="mb-4 px-4 py-2 bg-[#0D1512] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] flex flex-wrap items-center justify-between gap-3 font-pixel text-[9px] animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[#D6CFC2]">
                Technology <strong className="text-[#00F0FF]">{activeTech.name}</strong> is deployed in:{' '}
                <span className="text-[#FFCC00]">
                  {activeTech.projectIds
                    .map((id) => FLAGSHIP_PROJECTS.find((p) => p.id === id)?.title)
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              </span>
            </div>
            <span className="text-[#8E98AA] text-[8px]">
              CIRCUIT ROUTE ACTIVE
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INTERACTIVE MOTHERBOARD PCB CIRCUIT TRACE BUS (Visual Interconnect)       */}
        {/* ========================================================================= */}
        <div className="mb-6 px-2 hidden md:block">
          <div className="relative py-2 bg-[#0D1512] border-2 border-[#2D3645] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] px-4">
            <div className="flex items-center justify-between font-pixel text-[8px] text-[#8E98AA] mb-1">
              <span>MOTHERBOARD PCB BUS // HIGH-SPEED INTERCONNECT TRACES</span>
              <span className="text-[#4AF626] flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                {hasAnyFilter ? 'PULSE ROUTING: ACTIVE' : 'BUS READY: 120 FPS DMA'}
              </span>
            </div>

            {/* Motherboard Circuit SVG Bus */}
            <svg 
              className="w-full h-8 overflow-visible" 
              viewBox="0 0 1000 32" 
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Ground Circuit Tracks */}
              <line x1="0" y1="8" x2="1000" y2="8" stroke="#1B2236" strokeWidth="2" strokeDasharray="6 4" />
              <line x1="0" y1="16" x2="1000" y2="16" stroke="#1B2236" strokeWidth="2" strokeDasharray="8 4" />
              <line x1="0" y1="24" x2="1000" y2="24" stroke="#1B2236" strokeWidth="2" strokeDasharray="6 4" />

              {/* Dynamic Animated Pulse Line when active */}
              {hasAnyFilter && (
                <>
                  <line 
                    x1="0" 
                    y1="16" 
                    x2="1000" 
                    y2="16" 
                    stroke="var(--tech-cyan-wave, #00F0FF)" 
                    strokeWidth="3" 
                    strokeDasharray="20 15" 
                    className="animate-pcb-pulse"
                  />
                  <line 
                    x1="0" 
                    y1="8" 
                    x2="1000" 
                    y2="8" 
                    stroke="var(--pixel-phosphor-green, #4AF626)" 
                    strokeWidth="2" 
                    strokeDasharray="15 25" 
                    className="animate-pcb-pulse-fast"
                  />
                  <line 
                    x1="0" 
                    y1="24" 
                    x2="1000" 
                    y2="24" 
                    stroke="var(--pixel-amber-gold, #FFCC00)" 
                    strokeWidth="2" 
                    strokeDasharray="18 20" 
                    className="animate-pcb-pulse"
                  />
                </>
              )}

              {/* Solder Joints / Vias */}
              {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map((cx) => (
                <circle 
                  key={cx} 
                  cx={cx} 
                  cy="16" 
                  r="3.5" 
                  fill={hasAnyFilter ? 'var(--tech-cyan-wave, #00F0FF)' : '#2D3645'} 
                  stroke="#070814" 
                  strokeWidth="1.5" 
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Mobile Layer Selector Tabs (Visible on < lg, Hidden on Desktop) */}
        <div className="flex lg:hidden items-center gap-1.5 mb-4 overflow-x-auto pb-1 select-none">
          <span className="font-pixel text-[8px] text-[#8E98AA] mr-1 shrink-0">VIEW LAYER:</span>
          {[
            { key: 'all', label: 'ALL (24)' },
            { key: 'client', label: '01: CLIENT (7)' },
            { key: 'server', label: '02: SERVER (9)' },
            { key: 'systems', label: '03: SYSTEMS (8)' },
          ].map((tab) => {
            const isActive = activeMobileLayer === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  audio.playTick();
                  setActiveMobileLayer(tab.key as any);
                }}
                className={`font-pixel text-[8px] px-2.5 py-1.5 border-2 transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#131629] border-[#00F0FF] text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                    : 'bg-[#070814] border-[#2D3645] text-[#8E98AA] hover:border-[#D6CFC2]'
                }`}
              >
                [ {tab.label} ]
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. 3-COLUMN ARCHITECTURAL LAYERS (Interconnected Pixel-Circuit Columns)   */}
        {/* ========================================================================= */}
        <div data-stagger="0.12" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 items-start">
          {ARCHITECTURE_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isCyan = layer.accent === 'cyan';
            const isAmber = layer.accent === 'amber';

            const accentClass = isCyan ? 'text-[#00F0FF]' : isAmber ? 'text-[#FFCC00]' : 'text-[#4AF626]';
            const badgeBg = isCyan 
              ? 'bg-[#00F0FF]/10 border-[#00F0FF]' 
              : isAmber 
              ? 'bg-[#FFCC00]/10 border-[#FFCC00]' 
              : 'bg-[#4AF626]/10 border-[#4AF626]';

            const isVisibleOnMobile = activeMobileLayer === 'all' || activeMobileLayer === layer.key;

            return (
              <div
                key={layer.key}
                className={`skill-layer-column flex flex-col ${isVisibleOnMobile ? 'flex' : 'hidden lg:flex'}`}
              >
                {/* Column RetroWindow Container */}
                <RetroWindow
                  title={layer.layerTag}
                  tag={layer.key.toUpperCase()}
                  variant={isCyan ? 'cyan' : isAmber ? 'amber' : 'phosphor'}
                  className="h-full flex flex-col justify-between"
                  bodyClassName="p-0 flex flex-col justify-between h-full bg-[#0D1512]/95"
                  statusBar={
                    <div className="flex items-center justify-between w-full font-pixel text-[8px] gap-2">
                      <span className="break-words">{layer.busChannel}</span>
                      <span className={`${accentClass} shrink-0`}>{layer.techs.length} NODES VERIFIED</span>
                    </div>
                  }
                >
                  
                  {/* Layer Header */}
                  <div className="p-3.5 sm:p-4 border-b-2 border-[#2D3645] bg-[#131629]/95 shrink-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 border-2 shrink-0 ${badgeBg}`}>
                          <Icon className={`w-4 h-4 ${accentClass}`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-pixel text-[11px] sm:text-xs text-white leading-tight break-words">
                            {layer.title}
                          </h3>
                          <div className="font-mono text-[9px] text-[#00F0FF] mt-0.5 break-words">
                            {layer.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className={`font-pixel text-[8px] uppercase tracking-wider px-1.5 py-0.5 border-2 shrink-0 ${badgeBg} ${accentClass}`}>
                        {layer.key === 'client' ? 'VIEWPORT' : layer.key === 'server' ? 'FABRIC' : 'RING-0'}
                      </span>
                    </div>

                    <p className="font-body text-[11px] text-[#D6CFC2] leading-snug break-words">
                      {layer.description}
                    </p>
                  </div>

                  {/* Technology Modules List - Scrollable Retro Bay */}
                  <div className="p-2.5 sm:p-3 space-y-2.5 max-h-[390px] overflow-y-auto overscroll-contain crt-scrollbar">
                    {layer.techs.map((tech) => {
                      const highlighted = isTechHighlighted(tech);
                      const isSelected = activeTechId === tech.id;
                      const isDimmed = hasAnyFilter && !highlighted;

                      // Map connected projects for quick display
                      const connectedProjectTitles = tech.projectIds
                        .map((id) => FLAGSHIP_PROJECTS.find((p) => p.id === id)?.title)
                        .filter(Boolean);

                      return (
                        <div
                          key={tech.id}
                          onMouseEnter={() => handleTechHover(tech.id)}
                          onClick={() => handleTechClick(tech.id)}
                          className={`group relative p-2.5 sm:p-3 border-2 transition-all duration-150 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#0C2430] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)] scale-[1.01]'
                              : highlighted
                              ? 'bg-[#171B33] border-[#4AF626] shadow-[0_0_10px_rgba(74,246,38,0.3)]'
                              : isDimmed
                              ? 'opacity-30 bg-[#0D1512] border-[#2D3645]/40 grayscale'
                              : 'bg-[#131629] border-[#2D3645] hover:border-[#00F0FF] hover:bg-[#171B33]'
                          }`}
                        >
                          {/* Card Micro-Header: Pin ID, Tag & ROMs badge */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-pixel text-[7px] text-[#8E98AA] px-1 py-0.5 bg-[#070814] border border-[#2D3645] shrink-0">
                                {tech.pinId}
                              </span>
                              <span className="font-mono text-[8.5px] text-[#8E98AA] uppercase tracking-wider break-words">
                                {tech.tag}
                              </span>
                            </div>
                            <span className="font-pixel text-[7px] px-1.5 py-0.5 bg-[#070814] border border-[#2D3645] text-[#D6CFC2] shrink-0">
                              {tech.projectIds.length} {tech.projectIds.length === 1 ? 'ROM' : 'ROMs'}
                            </span>
                          </div>

                          {/* Tech Title - Clean, prominent, full visibility without truncation */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="font-pixel text-[10px] sm:text-[11px] text-white group-hover:text-[#00F0FF] transition-colors leading-tight break-words">
                              {tech.name}
                            </h4>
                            {highlighted && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4AF626] animate-ping shrink-0" />
                            )}
                          </div>

                          <p className="font-body text-[10.5px] text-[#D6CFC2] mb-2 leading-relaxed break-words">
                            {tech.description}
                          </p>

                          {/* Architectural Capabilities Chips */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tech.capabilities.map((cap, i) => (
                              <span
                                key={i}
                                className="font-mono text-[8px] px-1.5 py-0.5 bg-[#070814] border border-[#2D3645] text-[#8E98AA]"
                              >
                                &gt; {cap}
                              </span>
                            ))}
                          </div>

                          {/* Connected Project Badges */}
                          <div className="pt-1.5 border-t border-[#2D3645]/60 flex flex-wrap items-center gap-1">
                            <span className="font-pixel text-[7px] text-[#8E98AA] uppercase tracking-wider mr-0.5">
                              Traced In:
                            </span>
                            {connectedProjectTitles.map((title, i) => {
                              const isThisProjectActive = isSelected;

                              return (
                                <span
                                  key={i}
                                  className={`font-pixel text-[7px] px-1.5 py-0.5 border transition-colors ${
                                    isThisProjectActive
                                      ? 'bg-[#FF2A85] text-white border-white font-bold shadow-[0_0_8px_rgba(255,42,133,0.5)]'
                                      : 'bg-[#070814] text-[#00F0FF] border-[#2D3645]'
                                  }`}
                                >
                                  {title}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Column Footer */}
                  <div className="p-2.5 sm:p-3 bg-[#131629] border-t-2 border-[#2D3645] flex items-center justify-between font-pixel text-[8px] text-[#8E98AA] shrink-0">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${accentClass} shrink-0`} />
                      <span className="text-[#D6CFC2]">Verified Specs</span>
                    </span>
                    <span className="text-[#00F0FF] flex items-center gap-1 font-mono text-[9px]">
                      <span>{layer.techs.length} NODES</span>
                      <span className="text-[#8E98AA]">(SCROLL)</span>
                    </span>
                  </div>

                </RetroWindow>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 4. FLAGSHIP PROJECT ROM CARTRIDGES // HARDWARE EXECUTION MODULES          */}
        {/* ========================================================================= */}
        <div data-anim className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-pixel text-[10px] text-[#00F0FF] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
              <span>&gt; FLAGSHIP ROM CARTRIDGES // HARDWARE EXECUTION MODULES</span>
            </div>
            <span className="font-mono text-[10px] text-[#8E98AA] hidden sm:inline">
              SYS.96 ROM ARCHIVE // 6 PROOF CORES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FLAGSHIP_PROJECTS.map((project) => {
              const isCyan = project.accent === 'cyan';
              const isAmber = project.accent === 'amber';
              const accentColor = isCyan ? 'text-[#00F0FF]' : isAmber ? 'text-[#FFCC00]' : 'text-[#4AF626]';
              const badgeBg = isCyan ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : isAmber ? 'bg-[#FFCC00]/10 text-[#FFCC00]' : 'bg-[#4AF626]/10 text-[#4AF626]';

              return (
                <div
                  key={project.id}
                  className="bg-[#0D1512] border-2 border-[#2D3645] hover:border-[#00F0FF] transition-all duration-200 p-4 flex flex-col justify-between shadow-[2px_2px_0_0_#070814] group"
                >
                  <div>
                    {/* Cartridge Header */}
                    <div className="flex items-center justify-between border-b border-[#2D3645] pb-2 mb-3">
                      <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-[#131629] border border-[#2D3645] text-[#8E98AA]">
                        {project.number}
                      </span>
                      <span className={`font-pixel text-[8px] uppercase tracking-wider ${accentColor}`}>
                        ROM CARTRIDGE
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-pixel text-xs text-white mb-1.5 leading-snug break-words group-hover:text-[#00F0FF] transition-colors">
                      {project.title}
                    </h4>

                    {/* Tagline */}
                    <p className="font-body text-[11px] text-[#D6CFC2] mb-3 leading-relaxed break-words">
                      {project.tagline}
                    </p>

                    {/* Layer Badge with zero truncation */}
                    <div className="mb-3">
                      <span className={`inline-block font-mono text-[9px] px-2 py-0.5 border border-[#2D3645] ${badgeBg} whitespace-normal break-words`}>
                        &gt; {project.layerBadge}
                      </span>
                    </div>

                    {/* Tech Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.techTags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-mono text-[8px] px-1.5 py-0.5 bg-[#070814] border border-[#2D3645] text-[#8E98AA] whitespace-normal"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cartridge Footer Link */}
                  <div className="pt-2.5 border-t border-[#2D3645] flex items-center justify-between font-pixel text-[8px]">
                    <span className="text-[#8E98AA]">STATUS: VERIFIED</span>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00F0FF] hover:underline flex items-center gap-1"
                    >
                      <span>[ REPO ]</span>
                      <span>&gt;</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. UNIFIED CYBERDECK CAREER & ACADEMIC BIOS CONSOLE (INTERACTIVE TABBED)   */}
        {/* ========================================================================= */}
        <div id="experience" data-anim className="mb-8 scroll-mt-[68px]">
          <RetroWindow
            title="WATCHKNIGHT_OS // BIOS_ROM_VERIFY.SYS (REV 4.51PG)"
            tag="ROM_BIOS"
            variant="phosphor"
            statusBar={
              <div className="flex flex-wrap items-center justify-between w-full font-pixel text-[8px]">
                <span className="text-[#4AF626]">[F1] HELP  [F5] OLD VALUES  [F7] LOAD DEFAULTS  [F10] SAVE &amp; CMOS WRITE</span>
                <span className="text-[#FFCC00]">ALL HARDWARE MODULES PASS POST (100% OK)</span>
              </div>
            }
          >
            {/* Interactive Console Tabs Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4 border-b-2 border-[#2D3645] pb-2.5 select-none">
              <span className="font-pixel text-[8px] text-[#8E98AA] mr-1 shrink-0">SELECT MODULE:</span>
              {[
                { id: 0, label: 'TAB 1: EWU CSE & OFFICIAL BIOS RECORD' },
                { id: 1, label: 'TAB 2: FULL-STACK & BROWSER EXTENSIONS' },
                { id: 2, label: 'TAB 3: SYSTEMS, KERNEL & GRAPHICS LABS' },
              ].map((tab) => {
                const isActive = activeBiosTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleBiosTabSwitch(tab.id)}
                    onMouseEnter={() => chiptuneAudio.playPixelTick()}
                    className={`font-pixel text-[8px] sm:text-[9px] px-3 py-1.5 border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#131629] text-[#4AF626] border-[#4AF626] shadow-[0_0_10px_rgba(74,246,38,0.35)] font-bold'
                        : 'bg-[#070814] text-[#8E98AA] border-[#2D3645] hover:border-[#00F0FF] hover:text-[#00F0FF]'
                    }`}
                  >
                    [ {tab.label} ]
                  </button>
                );
              })}
            </div>

            {/* Relative Content Frame with 150ms CRT Scanline Wipe Overlay */}
            <div className="relative overflow-hidden min-h-[300px]">
              {isBiosWiping && (
                <div 
                  className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-b from-[#00F0FF]/25 via-[#4AF626]/35 to-transparent animate-crt-wipe"
                  style={{ boxShadow: 'inset 0 0 25px rgba(0, 240, 255, 0.4)' }}
                />
              )}

              {/* [TAB 1: EWU CSE & OFFICIAL BIOS RECORD] */}
              {activeBiosTab === 0 && (
                <div>
                  {/* BIOS Setup Header */}
                  <div className="border-b-2 border-[#2D3645] pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-pixel text-[10px] text-[#4AF626]">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#4AF626] animate-pulse" />
                        <span>ROM PCI/ISA BIOS (2A69KM4B) // MODULAR CSE ARCHITECTURE</span>
                      </div>
                      <span className="text-[#FFCC00]">COPYRIGHT (C) 1996-2026 WATCHKNIGHT_OS SYS.96</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#8E98AA] mt-1">
                      HARDWARE PLATFORM: EAST WEST UNIVERSITY CSE SYSTEMS LAB (DHAKA-BD • 23.7644° N, 90.4252° E • UTC+6)
                    </div>
                  </div>

                  {/* BIOS Setup Table Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Academic Timeline & Institutional Verification */}
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="font-pixel text-[9px] text-[#00F0FF] border-b border-[#2D3645] pb-1 uppercase tracking-wider flex items-center justify-between">
                        <span>[ SYSTEM RECORD: ACADEMIC CREDENTIAL ROM ]</span>
                        <span className="text-[#4AF626]">VERIFIED</span>
                      </div>

                      <div className="bg-[#070814] p-3.5 border border-[#2D3645] space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#8E98AA] shrink-0 font-pixel text-[9px]">INSTITUTION:</span>
                          <span className="text-white text-right font-bold">East West University (EWU)</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#8E98AA] shrink-0 font-pixel text-[9px]">DEPARTMENT:</span>
                          <span className="text-[#D6CFC2] text-right">Computer Science &amp; Engineering (CSE)</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#8E98AA] shrink-0 font-pixel text-[9px]">TIMELINE:</span>
                          <span className="text-[#FFCC00] text-right font-pixel text-[10px]">2021 – PRESENT (SENIOR STANDING)</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#8E98AA] shrink-0 font-pixel text-[9px]">LOCATION:</span>
                          <span className="text-[#D6CFC2] text-right">Dhaka, Bangladesh (UTC+6)</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#8E98AA] shrink-0 font-pixel text-[9px]">CURRICULUM:</span>
                          <span className="text-[#00F0FF] text-right text-[10px]">OS Kernel, Algorithms, Distributed DB, Compilers, Physics-II</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[#8E98AA] shrink-0 font-pixel text-[9px]">CREDENTIALS:</span>
                          <span className="text-white text-right text-[10px]">Student ID: @watchknight • Academic Standing: Senior / Final Year</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: SHA-256 Authenticated System Record */}
                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="font-pixel text-[9px] text-[#00F0FF] border-b border-[#2D3645] pb-1 uppercase tracking-wider flex items-center justify-between">
                        <span>[ CRYPTOGRAPHIC ROM TELEMETRY // POST CHECK ]</span>
                        <span className="text-[#4AF626]">POST 000 OK</span>
                      </div>

                      <div className="bg-[#070814] p-3.5 border border-[#2D3645] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#8E98AA] font-pixel text-[9px]">SYSTEM CHECKSUM:</span>
                          <span className="font-pixel text-[9px] text-[#4AF626]">SHA-256 AUTHENTICATED</span>
                        </div>
                        <div className="p-1.5 bg-[#131629] border border-[#2D3645] font-mono text-[9px] text-[#00F0FF] break-all leading-tight">
                          SHA-256: 8F4A2B9C7D1E0F3A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F9A8B7C6D5E4F3A
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#8E98AA] font-pixel text-[9px]">VALGRIND MEM AUDIT:</span>
                          <span className="text-[#4AF626] font-bold">0 LEAKS // CLEAN EXIT (0 BYTES / 0 BLOCKS)</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#8E98AA] font-pixel text-[9px]">CANVAS PACING:</span>
                          <span className="text-[#00F0FF] font-bold">120 FPS STABLE // ZERO JANK</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#8E98AA] font-pixel text-[9px]">OBSIDIAN AST PARITY:</span>
                          <span className="text-[#FFCC00] font-bold">100% BIDIRECTIONAL SCHEMA SYNC</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BIOS Security Notice Footnote */}
                  <div className="mt-4 pt-3 border-t border-[#2D3645] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[10px] text-[#8E98AA]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#4AF626]" />
                      <span>ROM Hardware Hash signed by East West University CSE workstation node (@watchknight).</span>
                    </span>
                    <span className="text-[#4AF626] font-pixel text-[8px]">
                      BOOT SEQUENCE: FLOPPY (A:) → ROM CARTRIDGE (C:) → POSIX RAM
                    </span>
                  </div>
                </div>
              )}

              {/* [TAB 2: FULL-STACK & BROWSER EXTENSIONS] */}
              {activeBiosTab === 1 && (
                <div>
                  {/* Full-Stack & Browser Extensions Header */}
                  <div className="border-b-2 border-[#2D3645] pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-pixel text-[10px] text-[#00F0FF]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#00F0FF] animate-pulse" />
                        <span>FULL-STACK ARCHITECTURE &amp; BROWSER EXTENSIONS // PRODUCTION MILESTONES</span>
                      </div>
                      <span className="text-[#4AF626]">STATUS: PRODUCTION ACTIVE</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#8E98AA] mt-1">
                      INDEPENDENT SYSTEMS &amp; PRODUCTION PLATFORMS (2022 — PRESENT, REMOTE / GLOBAL)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Milestone 1: Mental Defrag */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#00F0FF] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#00F0FF]">01. MENTAL DEFRAG</span>
                        <span className="text-[#8E98AA]">SPATIAL ENGINE</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Zero-gravity spatial cognitive canvas with local vector embeddings and bi-directional Obsidian .canvas JSON AST parsing. Real-time thought clustering with sub-millisecond node physics.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>Matter.js • Obsidian AST • React 18 • Vectors</span>
                      </div>
                    </div>

                    {/* Milestone 2: DocLensBD */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#FFCC00] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#FFCC00]">02. DOCLENSBD</span>
                        <span className="text-[#4AF626]">14/14 CI/CD PASS</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Cloud-backed diagnostic pipeline with real-time Cloud Firestore listeners, automated GitHub Actions staging gates (14/14 automated test suite pass rate), and offline mutation queuing.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>Cloud Firestore • CI/CD Staging • React 18 • Firebase</span>
                      </div>
                    </div>

                    {/* Milestone 3: FocusGuard */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#00F0FF] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#00F0FF]">03. FOCUSGUARD</span>
                        <span className="text-[#00F0FF]">MANIFEST V3</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Manifest V3 browser extension with declarativeNetRequest dynamic interception rules, Shadow DOM injected countdown radial timer, and background service worker memory lifecycle management.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>Chrome MV3 • DNR Rules • Shadow DOM • TypeScript</span>
                      </div>
                    </div>

                    {/* Milestone 4: Rannabanna */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#FF2A85] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#FF2A85]">04. RANNABANNA</span>
                        <span className="text-[#FFCC00]">-78% PAYLOAD</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Localized Bengali culinary &amp; nutrition platform engineered with Unicode font subsetting reducing critical CSS/font payload by 78%, coupled with optimistic Cloud DB sync.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>Bengali NLP • Cloud DB Sync • React 18 • IndexedDB</span>
                      </div>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="pt-3 border-t border-[#2D3645] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[10px] text-[#8E98AA]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-pixel text-[8px] text-[#00F0FF] mr-1">STACK VERIFIED:</span>
                      {['React 18', 'TypeScript', 'Matter.js', 'Cloud Firestore', 'Vite', 'Tailwind CSS', 'Chrome MV3', 'GitHub Actions'].map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#070814] border border-[#2D3645] font-mono text-[9px] text-[#D6CFC2]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[#4AF626] font-pixel text-[8px] shrink-0">
                      14/14 CI/CD PASS • PRODUCTION VERIFIED ✓
                    </span>
                  </div>
                </div>
              )}

              {/* [TAB 3: SYSTEMS, KERNEL & GRAPHICS LABS] */}
              {activeBiosTab === 2 && (
                <div>
                  {/* Systems, Kernel & Graphics Labs Header */}
                  <div className="border-b-2 border-[#2D3645] pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-pixel text-[10px] text-[#4AF626]">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#4AF626] animate-pulse" />
                        <span>LINUX KERNEL, POSIX IPC &amp; WEBGL GRAPHICS LABS // LOW-LEVEL ENGINE</span>
                      </div>
                      <span className="text-[#00F0FF]">RING-0 SYSCALLS // 120 FPS</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#8E98AA] mt-1">
                      BITFORGE &amp; GRAPHICS MICRO-ENGINES (2023 — PRESENT, OPEN SOURCE)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Systems 1: POSIX Shared-Memory IPC */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#4AF626] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#4AF626]">01. POSIX SHARED MEMORY IPC</span>
                        <span className="text-[#00F0FF]">&lt; 1.2μs LATENCY</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Multi-process fork() hierarchies with anonymous duplex pipes and POSIX shared memory (shmget, shmat) synchronized via atomic spinlocks and semaphore barriers. Zero-copy ring buffer throughput.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>C / C++ • shmget/shmat • Anonymous Pipes • Spinlocks</span>
                      </div>
                    </div>

                    {/* Systems 2: Process Lifecycle & fork() Trees */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#00F0FF] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#00F0FF]">02. PROCESS HIERARCHIES &amp; FORK()</span>
                        <span className="text-[#FFCC00]">POSIX SIGNALS</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Deterministic process spawning hierarchies with robust signal handling (SIGCHLD, SIGKILL, SIGSEGV), automated zombie process reclamation, and descriptor polling without resource leaks.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>fork() Trees • Zombie Reaping • Exit Traps • Linux Kernel</span>
                      </div>
                    </div>

                    {/* Systems 3: WebGL Shader Pipelines */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#FF2A85] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#FF2A85]">03. WEBGL SHADER PIPELINES</span>
                        <span className="text-[#00F0FF]">GPU WAVE DISPLACEMENT</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Custom Three.js GLSL vertex &amp; fragment shaders executing real-time 3D wave displacements, additive bloom buffers, cursor ripples, and procedural Web Audio bass energy modulations entirely on the GPU.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>Three.js / GLSL • Additive Bloom • CRT ShaderPass</span>
                      </div>
                    </div>

                    {/* Systems 4: Deterministic Memory Safety & Valgrind */}
                    <div className="bg-[#070814] p-3.5 border border-[#2D3645] hover:border-[#4AF626] transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-pixel text-[9px]">
                        <span className="text-[#4AF626]">04. VALGRIND MEMORY SAFETY</span>
                        <span className="text-[#4AF626]">0 LEAKS // 0 BLOCKS</span>
                      </div>
                      <p className="font-sans text-xs text-[#D6CFC2] leading-relaxed">
                        Deterministic heap/stack lifecycle audits verifying 0 memory leaks across high-throughput IPC pipelines. Neon Vanguard 120 FPS 2D canvas combat engine with raycast projectile piercing.
                      </p>
                      <div className="font-mono text-[9px] text-[#8E98AA] pt-1 border-t border-[#2D3645]/60 flex items-center gap-1.5">
                        <span className="text-[#4AF626]">&gt;</span>
                        <span>Valgrind Audit • GDB Profiling • 120 FPS 2D Canvas</span>
                      </div>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="pt-3 border-t border-[#2D3645] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[10px] text-[#8E98AA]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-pixel text-[8px] text-[#4AF626] mr-1">SYSTEMS STACK:</span>
                      {['C / C++', 'Linux POSIX', 'shmget / shmat', 'fork() Trees', 'Valgrind 0 Leaks', 'Three.js / GLSL', 'HTML5 2D Canvas', 'Web Audio API'].map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-[#070814] border border-[#2D3645] font-mono text-[9px] text-[#D6CFC2]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[#00F0FF] font-pixel text-[8px] shrink-0">
                      VALGRIND VERIFIED: 0 LEAKS (0 BYTES / 0 BLOCKS) ✓
                    </span>
                  </div>
                </div>
              )}
            </div>
          </RetroWindow>
        </div>

        {/* Matrix Philosophy Footer */}
        <div className="mt-10 text-center">
          <p className="font-pixel text-[9px] text-[#8E98AA]">
            WATCHKNIGHT_OS // SYS.96 SYSTEMS ARCHITECTURE • AUDITED ACROSS EWU LABS &amp; PRODUCTION DEPLOYMENTS
          </p>
        </div>

      </div>
    </section>
  );
};

export default SkillMatrix;
