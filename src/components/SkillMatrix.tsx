import React, { useState, useRef } from 'react';
import { useReveal } from '../hooks/useReveal';
import { audio } from '../utils/audio';
import { Magnetic } from './ui/Magnetic';
import { 
  Layers, 
  Database, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  ArrowUpRight,
  Zap,
  Boxes
} from 'lucide-react';

export interface ArchitectureTech {
  id: string;
  name: string;
  category: 'client' | 'server' | 'systems';
  description: string;
  capabilities: string[];
  projectIds: string[];
  tag: string;
}

export interface FlagshipProjectLink {
  id: string;
  title: string;
  tagline: string;
  githubUrl: string;
  accent: 'cyan' | 'amber';
  layerBadge: string;
}

// 5 Flagship Projects as defined in portfolio requirements
export const FLAGSHIP_PROJECTS: FlagshipProjectLink[] = [
  {
    id: 'mental-defrag',
    title: 'Mental Defrag',
    tagline: 'Zero-Gravity Spatial Cognitive Obsidian Engine',
    githubUrl: 'https://github.com/watchknight/Mental-Defrag',
    accent: 'cyan',
    layerBadge: 'Spatial Physics & Vector Engine',
  },
  {
    id: 'doclens-bd',
    title: 'DocLensBD',
    tagline: 'Cloud-Backed Health Intelligence & Diagnostic Pipeline',
    githubUrl: 'https://github.com/watchknight/DocLensBD',
    accent: 'amber',
    layerBadge: 'Cloud Firestore & Staging CI/CD',
  },
  {
    id: 'rannabanna',
    title: 'Rannabanna',
    tagline: 'Localized Bengali Culinary & Nutrition Engine',
    githubUrl: 'https://github.com/watchknight/Rannabanna',
    accent: 'cyan',
    layerBadge: 'Bengali NLP & Cloud DB Sync',
  },
  {
    id: 'trash-trail',
    title: 'Trash Trail',
    tagline: 'Kinetic Scroll-Driven Interactive Storytelling Web Architecture',
    githubUrl: 'https://github.com/watchknight/TrashTrail',
    accent: 'amber',
    layerBadge: 'GSAP Inertial Scroll Choreography',
  },
  {
    id: 'neon-vanguard',
    title: 'Neon Vanguard 2D & OS Kernel Labs',
    tagline: 'HTML5 2D Canvas Combat Engine & Linux C/C++ OS Kernel Labs',
    githubUrl: 'https://github.com/watchknight/BitForge',
    accent: 'cyan',
    layerBadge: 'POSIX IPC Pipes & Shared Memory',
  },
];

// The 3 Architectural Layers with cross-project associations
export const ARCHITECTURE_LAYERS: {
  key: 'client' | 'server' | 'systems';
  title: string;
  subtitle: string;
  description: string;
  accent: 'cyan' | 'amber' | 'multi';
  icon: React.ComponentType<{ className?: string }>;
  techs: ArchitectureTech[];
}[] = [
  {
    key: 'client',
    title: 'Client & Motion Layer',
    subtitle: 'Layer 01 • Reactive DOM, Viewport Kinematics & Physics',
    description: 'Sub-frame 60/120 FPS rendering pipelines, inertial scroll scrubbing, and state machine UI reconciliation.',
    accent: 'cyan',
    icon: Sparkles,
    techs: [
      {
        id: 'tech-react',
        name: 'React 18 / Next.js',
        category: 'client',
        description: 'Concurrent reconciler, server components, optimistic UI mutations, and fluid state machines.',
        capabilities: ['Concurrent Mode', 'Custom Hook Primitives', 'SSR / SSG Pipelines'],
        projectIds: ['mental-defrag', 'doclens-bd', 'rannabanna'],
        tag: 'Framework Core',
      },
      {
        id: 'tech-ts',
        name: 'TypeScript',
        category: 'client',
        description: 'Strict compile-time type verification, abstract syntax tree models, and generic utility algebra.',
        capabilities: ['Strict Type Systems', 'AST Compilation', 'Zero Runtime Overhead'],
        projectIds: ['mental-defrag', 'doclens-bd'],
        tag: 'Type Safety',
      },
      {
        id: 'tech-gsap',
        name: 'GSAP & ScrollTrigger',
        category: 'client',
        description: 'Hardware-accelerated timeline choreography, pinned multi-stage narrative scrubbers, and bezier easing.',
        capabilities: ['Pinned Viewports', 'Micro-Scrubbing', 'GPU Composite Layers'],
        projectIds: ['trash-trail'],
        tag: 'Kinetic Motion',
      },
      {
        id: 'tech-tailwind',
        name: 'Tailwind CSS',
        category: 'client',
        description: 'Fluid mathematical typography formulas, glassmorphic optics, dark mode tokens, and JIT bundling.',
        capabilities: ['Fluid Clamps', 'Optical Glass Realism', 'Custom CSS Shaders'],
        projectIds: ['doclens-bd', 'rannabanna'],
        tag: 'Design System',
      },
      {
        id: 'tech-canvas',
        name: 'HTML5 2D Canvas & Shaders',
        category: 'client',
        description: 'Low-overhead 120 FPS render loops, spatial raycasting, pre-allocated particle pools, and luminous arcs.',
        capabilities: ['120 FPS Pacing', 'Raycast Piercing', 'Dynamic Luminescence'],
        projectIds: ['neon-vanguard'],
        tag: 'Graphics Kernel',
      },
      {
        id: 'tech-matter',
        name: 'Matter.js Physics Engine',
        category: 'client',
        description: '2D rigid-body spatial mechanics, zero-gravity damping formulas, and harmonic repulsive vector fields.',
        capabilities: ['Rigid-Body Solver', 'Zero-G Damping', 'Harmonic Clumping'],
        projectIds: ['mental-defrag'],
        tag: 'Physics Loop',
      },
      {
        id: 'tech-vanilla-svg',
        name: 'Vanilla JS & SVG Kinematics',
        category: 'client',
        description: 'Zero virtual-DOM overhead execution, kinetic SVG matrix morphing, and direct requestAnimationFrame tickers.',
        capabilities: ['0 CLS Overhead', 'Direct Event Dispatch', 'Composite Layering'],
        projectIds: ['trash-trail'],
        tag: 'Bare Micro-DOM',
      },
    ],
  },
  {
    key: 'server',
    title: 'Server & Data Layer',
    subtitle: 'Layer 02 • Distributed Storage, Offline First & Pipelines',
    description: 'Event-driven asynchronous services, resilient multi-client sync, continuous integration, and vector semantics.',
    accent: 'amber',
    icon: Database,
    techs: [
      {
        id: 'tech-node',
        name: 'Node.js & Express',
        category: 'server',
        description: 'Asynchronous event loop, non-blocking stream processing, REST endpoints, and custom middleware chains.',
        capabilities: ['Non-Blocking IO', 'Streaming Payloads', 'Stateless APIs'],
        projectIds: ['doclens-bd', 'rannabanna'],
        tag: 'Runtime Engine',
      },
      {
        id: 'tech-postgres',
        name: 'PostgreSQL Relational DB',
        category: 'server',
        description: 'Relational data modeling, ACID transactions, complex JOINs, foreign key constraints, and indexing.',
        capabilities: ['ACID Compliance', 'Relational Schemas', 'Indexing & Queries'],
        projectIds: ['doclens-bd'],
        tag: 'Relational DB',
      },
      {
        id: 'tech-mongo',
        name: 'MongoDB Document Store',
        category: 'server',
        description: 'Document collections, dynamic BSON schemas, aggregation pipelines, and high-concurrency ingestion.',
        capabilities: ['Aggregation Pipeline', 'BSON Documents', 'Dynamic Collections'],
        projectIds: ['rannabanna'],
        tag: 'Document Store',
      },
      {
        id: 'tech-firestore',
        name: 'Cloud Firestore',
        category: 'server',
        description: 'Real-time WebSocket snapshot streams, multi-region fault tolerance, and offline mutation queues.',
        capabilities: ['Realtime Listeners', '< 45ms Sync', 'Offline Write Cache'],
        projectIds: ['doclens-bd'],
        tag: 'Cloud DB',
      },
      {
        id: 'tech-auth',
        name: 'Firebase Auth & Security Rules',
        category: 'server',
        description: 'Cryptographic JWT token verification, role-based access control (RBAC), and AES-256 field encryption.',
        capabilities: ['RBAC Security Rules', 'Cryptographic Tokens', 'Field Encryption'],
        projectIds: ['doclens-bd'],
        tag: 'Security & Auth',
      },
      {
        id: 'tech-idb',
        name: 'IndexedDB Persistence',
        category: 'server',
        description: 'High-throughput browser-local transactional key-value store powering zero-latency offline experiences.',
        capabilities: ['0ms Local Query', 'Structured Clones', 'Offline-First Fallback'],
        projectIds: ['mental-defrag', 'rannabanna'],
        tag: 'Client Storage',
      },
      {
        id: 'tech-sync',
        name: 'Cloud DB Realtime Sync',
        category: 'server',
        description: 'Optimistic UI update reconciler ensuring zero data loss and automated conflict resolution over flaky networks.',
        capabilities: ['Conflict Resolution', 'Optimistic UI', 'Packet Reconciliation'],
        projectIds: ['rannabanna', 'doclens-bd'],
        tag: 'Sync Engine',
      },
      {
        id: 'tech-cicd',
        name: 'GitHub Actions CI/CD',
        category: 'server',
        description: 'Automated test suite orchestrations, build artifact validation, lint gates, and multi-stage branch staging.',
        capabilities: ['14/14 Automated Pass', 'Multi-Platform Matrix', 'Zero-Downtime Push'],
        projectIds: ['doclens-bd'],
        tag: 'Automation CI',
      },
      {
        id: 'tech-vectors',
        name: 'Vector Embeddings & Cosine Math',
        category: 'server',
        description: 'Client-side cosine similarity spatial distance matrices enabling semantic thought clumping and node repulsion.',
        capabilities: ['Cosine Similarity', 'Local Dimension Index', 'Dynamic Repulsion'],
        projectIds: ['mental-defrag'],
        tag: 'Semantic Vectors',
      },
    ],
  },
  {
    key: 'systems',
    title: 'Linux & Core CSE Layer',
    subtitle: 'Layer 03 • Ring-0 Syscalls, POSIX IPC & Kernel Primitives',
    description: 'Deterministic memory safety, anonymous pipes, shared memory segments, process trees, and compiler AST parsing.',
    accent: 'multi',
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
      },
      {
        id: 'tech-ipc-pipes',
        name: 'Linux POSIX IPC & Pipes',
        category: 'systems',
        description: 'Anonymous duplex pipe channels, inter-process streaming pipelines, and non-blocking descriptor polling.',
        capabilities: ['Anonymous Pipes', '< 1.2μs IPC Latency', 'Duplex Data Stream'],
        projectIds: ['neon-vanguard'],
        tag: 'Process Streams',
      },
      {
        id: 'tech-shm',
        name: 'POSIX Shared Memory (shmget / shmat)',
        category: 'systems',
        description: 'Zero-copy inter-process memory regions synchronized via atomic spinlocks and POSIX semaphore locks.',
        capabilities: ['shmget & shmat', 'Zero-Copy Ring Buffer', 'Spinlock Safety'],
        projectIds: ['neon-vanguard'],
        tag: 'Kernel Shared RAM',
      },
      {
        id: 'tech-fork',
        name: 'Process fork() Trees & Hierarchies',
        category: 'systems',
        description: 'Process spawning hierarchies with signal handling (SIGCHLD, SIGKILL), zombie reclamation, and exit code trapping.',
        capabilities: ['fork() Trees', 'Zombie Reaping', 'POSIX Signals'],
        projectIds: ['neon-vanguard'],
        tag: 'Process Lifecycle',
      },
      {
        id: 'tech-bash',
        name: 'Linux Shell & Bash Automation',
        category: 'systems',
        description: 'POSIX shell toolchains, automated Linux development environments, sysinfo telemetry, and Makefile compilation.',
        capabilities: ['Bash Scripting', 'Syscall Tracing', 'Automated Toolchains'],
        projectIds: ['neon-vanguard'],
        tag: 'Linux Environment',
      },
      {
        id: 'tech-valgrind',
        name: 'Memory Safety & Valgrind Audits',
        category: 'systems',
        description: 'Zero memory leak verification, cache miss telemetry profiling, buffer boundary audits, and GDB breakpoint analysis.',
        capabilities: ['0 Heap Leaks', 'Cache Boundary Check', 'GDB Telemetry'],
        projectIds: ['neon-vanguard'],
        tag: 'Safety & Profiling',
      },
      {
        id: 'tech-ast',
        name: 'Obsidian .canvas JSON AST Compilers',
        category: 'systems',
        description: 'Lossless bi-directional Abstract Syntax Tree compiler parsing, validating, and mutating Obsidian .canvas JSON graph schemas.',
        capabilities: ['Lossless AST Sync', 'JSON Graph Compiler', 'Bi-Directional Schema'],
        projectIds: ['mental-defrag'],
        tag: 'AST Compilation',
      },
    ],
  },
];

export const SkillMatrix: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useReveal(sectionRef);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTechId, setActiveTechId] = useState<string | null>(null);
  const [lockedMode, setLockedMode] = useState<boolean>(false);

  // Compute active associations
  const activeTech = activeTechId 
    ? ARCHITECTURE_LAYERS.flatMap(l => l.techs).find(t => t.id === activeTechId) 
    : null;

  const activeProject = activeProjectId 
    ? FLAGSHIP_PROJECTS.find(p => p.id === activeProjectId) 
    : null;

  // Handler for project selection/hover with procedural Web Audio feedback
  const handleProjectHover = (projectId: string | null) => {
    if (lockedMode) return;
    setActiveProjectId(projectId);
    if (projectId) {
      setActiveTechId(null);
      audio.playTick();
    }
  };

  const handleProjectClick = (projectId: string) => {
    audio.playChord();
    if (activeProjectId === projectId && lockedMode) {
      setLockedMode(false);
      setActiveProjectId(null);
    } else {
      setActiveProjectId(projectId);
      setActiveTechId(null);
      setLockedMode(true);
    }
  };

  // Handler for tech selection/hover with procedural Web Audio feedback
  const handleTechHover = (techId: string | null) => {
    if (lockedMode) return;
    setActiveTechId(techId);
    if (techId) {
      setActiveProjectId(null);
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
      setActiveProjectId(null);
      setLockedMode(true);
    }
  };

  const handleReset = () => {
    audio.playChord();
    setActiveProjectId(null);
    setActiveTechId(null);
    setLockedMode(false);
  };

  const handleSectionMouseLeave = () => {
    if (lockedMode) return;
    setActiveProjectId(null);
    setActiveTechId(null);
  };

  // Helpers to test highlighting state
  const isProjectHighlighted = (projectId: string) => {
    if (activeProjectId === projectId) return true;
    if (activeTech) {
      return activeTech.projectIds.includes(projectId);
    }
    return false;
  };

  const isTechHighlighted = (tech: ArchitectureTech) => {
    if (activeTechId === tech.id) return true;
    if (activeProjectId) {
      return tech.projectIds.includes(activeProjectId);
    }
    return false;
  };

  const hasAnyFilter = Boolean(activeProjectId || activeTechId);

  return (
    <section 
      ref={sectionRef} 
      id="systems" 
      onMouseLeave={handleSectionMouseLeave}
      className="py-24 md:py-32 relative bg-obsidian text-slate-100 overflow-hidden"
    >
      {/* Subtle ambient lighting flares behind the 3 columns */}
      <div data-parallax="0.15" className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-mint/5 rounded-full blur-3xl -z-10" />
      <div data-parallax="0.2" className="pointer-events-none absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-warm/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <div data-anim className="flex items-center gap-2 font-mono text-fluid-micro text-cyan-mint uppercase tracking-widest mb-3">
              <Layers className="w-4 h-4 text-cyan-mint animate-pulse" />
              <span>Cognitive Competency Matrix • Architectural Map</span>
            </div>
            <div className="overflow-hidden">
              <h2 data-mask className="font-display font-black text-fluid-h1 text-white tracking-tight uppercase">
                Systems & <span className="text-cyan-mint">Architecture</span>
              </h2>
            </div>
            <p data-anim data-delay="0.1" className="font-body text-fluid-body text-slate-400 mt-3 leading-relaxed">
              Replacing abstract skill percentages with an interactive 3-column architectural dependency graph. 
              Delivering verified resilience: from deterministic C POSIX shared-memory pipelines to 120 FPS WebGL rendering and distributed reactive state fabrics.
            </p>
          </div>

          {/* Interactive Mode Ribbon Indicator */}
          <div data-anim data-delay="0.15" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-carbon-surface/80 border border-white/10 backdrop-blur-md flex items-center gap-2 text-fluid-micro font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-mint animate-ping" />
              <span className="text-slate-300">Bi-Directional Project Tracer:</span>
              <span className="text-cyan-mint font-semibold">Active</span>
            </div>

            {hasAnyFilter && (
              <Magnetic>
                <button
                  onClick={handleReset}
                  aria-label="Reset tracer and clear active project or technology filter"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition-colors text-fluid-micro font-mono border border-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-mint" />
                  <span>Reset Tracer</span>
                </button>
              </Magnetic>
            )}
          </div>
        </div>

        {/* Drawn Divider Line */}
        <div data-draw className="w-full h-px bg-white/10 mb-12" />

        {/* Flagship Projects Architectural Tracer Bar */}
        <div data-anim className="mb-14 p-6 rounded-2xl bg-carbon/75 border border-white/10 backdrop-blur-xl shadow-liquid-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 font-mono text-fluid-micro text-slate-300 uppercase tracking-wider">
              <Boxes className="w-4 h-4 text-cyan-mint" />
              <span>Flagship Engineered Architectures (Hover or click to isolate stack)</span>
            </div>
            <span className="font-mono text-fluid-micro text-slate-500">
              {lockedMode ? '🔒 Pinned Selection (Click again to unlock)' : '⚡ Live Hover Trace'}
            </span>
          </div>

          <div data-stagger="0.08" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FLAGSHIP_PROJECTS.map((project) => {
              const highlighted = isProjectHighlighted(project.id);
              const isSelected = activeProjectId === project.id;
              const isDimmed = hasAnyFilter && !highlighted;

              return (
                <div
                  key={project.id}
                  onMouseEnter={() => handleProjectHover(project.id)}
                  onClick={() => handleProjectClick(project.id)}
                  className={`relative p-3.5 rounded-xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-wk-slate-surface border-wk-verdigris-signal shadow-editorial-card scale-[1.02]'
                      : highlighted
                      ? 'bg-white/10 border-wk-verdigris-signal/60 shadow-editorial-card'
                      : isDimmed
                      ? 'opacity-35 bg-obsidian-surface/40 border-white/5 grayscale-[50%]'
                      : 'bg-obsidian-surface/80 border-white/10 hover:border-white/25 hover:bg-carbon-surface/90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        isSelected 
                          ? 'bg-wk-terracotta-pulse' 
                          : highlighted 
                          ? 'bg-wk-verdigris-signal' 
                          : 'bg-muted/60'
                      }`} />
                      <span className="font-mono text-[10px] text-slate-500 uppercase">
                        {project.accent === 'cyan' ? 'High Performance' : 'Cloud / Web'}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-fluid-sm text-white group-hover:text-cyan-mint transition-colors">
                      {project.title}
                    </h4>
                    <p className="font-body text-fluid-micro text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {project.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-fluid-micro font-mono">
                    <span className="text-cyan-mint/90 truncate max-w-[120px]">
                      {project.layerBadge}
                    </span>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Inspect Source Code"
                      aria-label={`Inspect source code for ${project.title}`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Diagnostic HUD Banner */}
          {hasAnyFilter && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-fluid-micro font-mono animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyan-mint" />
                {activeProject && (
                  <span className="text-slate-200">
                    Inspecting Stack for <strong className="text-cyan-mint">{activeProject.title}</strong>: Highlighting all connected layer primitives below.
                  </span>
                )}
                {activeTech && (
                  <span className="text-slate-200">
                    Technology <strong className="text-cyan-mint">{activeTech.name}</strong> is deployed in:{' '}
                    <span className="text-amber-warm font-semibold">
                      {activeTech.projectIds
                        .map((id) => FLAGSHIP_PROJECTS.find((p) => p.id === id)?.title)
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </span>
                )}
              </div>

              <span className="text-slate-400">
                Tip: Click any item to lock selection
              </span>
            </div>
          )}
        </div>

        {/* 3-Column Architectural Map with data-stagger */}
        <div data-stagger="0.12" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {ARCHITECTURE_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isCyan = layer.accent === 'cyan';
            const isAmber = layer.accent === 'amber';
            const accentClass = isCyan ? 'text-cyan-mint' : isAmber ? 'text-amber-warm' : 'text-emerald-400';
            const badgeBg = isCyan ? 'bg-cyan-mint/10 border-cyan-mint/30' : isAmber ? 'bg-amber-warm/10 border-amber-warm/30' : 'bg-emerald-500/10 border-emerald-500/30';

            return (
              <div
                key={layer.key}
                className="skill-layer-column flex flex-col"
              >
                {/* Column Glass Container */}
                <div className="h-full rounded-2xl bg-carbon/80 border border-white/10 backdrop-blur-2xl shadow-liquid-card flex flex-col justify-between overflow-hidden">
                  
                  {/* Layer Header */}
                  <div className="p-6 md:p-7 border-b border-white/10 bg-obsidian-surface/60">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl border ${badgeBg}`}>
                        <Icon className={`w-5 h-5 ${accentClass}`} />
                      </div>
                      <span className={`font-mono text-fluid-micro uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeBg} ${accentClass}`}>
                        {layer.key === 'client' ? 'Viewport & DOM' : layer.key === 'server' ? 'State & Fabric' : 'Ring-0 & IPC'}
                      </span>
                    </div>

                    <h3 className="font-display font-extrabold text-fluid-h3 text-white">
                      {layer.title}
                    </h3>
                    <div className="font-mono text-fluid-micro text-slate-400 mt-1 mb-3">
                      {layer.subtitle}
                    </div>
                    <p className="font-body text-fluid-sm text-slate-400 leading-relaxed">
                      {layer.description}
                    </p>
                  </div>

                  {/* Technology Modules List */}
                  <div className="p-6 space-y-3.5 flex-1 overscroll-contain">
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
                          className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-wk-slate-surface border-wk-verdigris-signal shadow-editorial-card scale-[1.01]'
                              : highlighted
                              ? 'bg-white/10 border-wk-verdigris-signal/70 shadow-editorial-card'
                              : isDimmed
                              ? 'opacity-30 bg-obsidian-surface/40 border-white/5 grayscale-[60%]'
                              : 'bg-obsidian-surface/75 border-white/5 hover:border-white/20 hover:bg-carbon-surface/90'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-fluid-sm text-white group-hover:text-cyan-mint transition-colors">
                                  {tech.name}
                                </span>
                                {highlighted && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-mint animate-ping" />
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                                {tech.tag}
                              </span>
                            </div>

                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 shrink-0">
                              {tech.projectIds.length} {tech.projectIds.length === 1 ? 'Project' : 'Projects'}
                            </span>
                          </div>

                          <p className="font-body text-fluid-micro text-slate-400 mb-3 leading-relaxed">
                            {tech.description}
                          </p>

                          {/* Architectural Capabilities Chips */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {tech.capabilities.map((cap, i) => (
                              <span
                                key={i}
                                className="font-mono text-[10px] px-2 py-0.5 rounded bg-carbon-elevated/80 border border-white/5 text-slate-300"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>

                          {/* Connected Project Badges */}
                          <div className="pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mr-1">
                              Deployed in:
                            </span>
                            {connectedProjectTitles.map((title, i) => {
                              const isThisProjectActive = activeProjectId 
                                && FLAGSHIP_PROJECTS.find(p => p.id === activeProjectId)?.title === title;

                              return (
                                <span
                                  key={i}
                                  className={`font-mono text-[10px] px-2 py-0.5 rounded transition-colors ${
                                    isThisProjectActive
                                      ? 'bg-accent-coral text-alabaster font-bold shadow-editorial-card'
                                      : 'bg-white/5 text-alabaster-dim border border-white/10'
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
                  <div className="p-4 md:p-5 bg-obsidian-surface/60 border-t border-white/10 flex items-center justify-between font-mono text-fluid-micro text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${accentClass}`} />
                      <span>Zero Fluff • Verified Specs</span>
                    </span>
                    <span className="text-slate-500">
                      {layer.techs.length} Modules
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Matrix Philosophy Footer */}
        <div className="mt-12 text-center">
          <p className="font-mono text-fluid-micro text-slate-500">
            Systems architecture audited across East West University Computer Science & Engineering labs and production deployments.
          </p>
        </div>

      </div>
    </section>
  );
};

export default SkillMatrix;
