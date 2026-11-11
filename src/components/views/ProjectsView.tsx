import React, { useState, useEffect, useRef } from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { useRetroOS } from '../../context/RetroOSContext';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface ProjectsViewProps {
  palette?: PhosphorColorTokens;
}

export interface HeroMetric {
  value: string;
  label: string;
}

export interface FlagshipProject {
  id: string;
  index: string;
  category: string;
  title: string;
  summary: string;
  outcomeBadge: string;
  demoUrl: string;
  sourceUrl: string;
  role: string;
  year: string;
  heroMetrics: HeroMetric[];
  problem: string;
  architecture: string;
  impact: string;
  hasSandbox: boolean;
  sandboxType?: 'physics' | 'throttler' | 'laser';
  // Backwards compatibility alias fields
  fileCode?: string;
  tagline?: string;
  stack?: string;
  status?: string;
  date?: string;
  size?: string;
}

export interface GitHubRepoItem {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  forks_count?: number;
}

// Backwards compatibility type alias
export type FeaturedProject = FlagshipProject;

// 4 FLAGSHIP CASE STUDIES (Curated 2x2 Flagship Project Grid)
export const FLAGSHIP_PROJECTS: FlagshipProject[] = [
  {
    id: '01_MENTAL_DEFRAG',
    index: '01',
    category: 'SPATIAL WEB',
    title: 'Mental Defrag',
    summary:
      'Zero-gravity spatial cognitive workspace built with Matter.js physics and bi-directional Obsidian .canvas AST synchronization.',
    outcomeBadge: '60 FPS • 200+ Physics Nodes • Obsidian AST Sync',
    demoUrl: 'https://github.com/watchknight/Mental-Defrag',
    sourceUrl: 'https://github.com/watchknight/Mental-Defrag',
    role: 'Lead Systems & Graphics Architect',
    year: '2024',
    heroMetrics: [
      { value: '60 FPS', label: 'Solid Physics Loop' },
      { value: '200+', label: 'Physics Nodes' },
      { value: '100%', label: 'Obsidian AST Parity' },
    ],
    problem:
      'Hierarchical note-taking tools enforce rigid tree structures that stifle non-linear ideation and spatial conceptual clustering. Users struggle to organize divergent thoughts without experiencing cognitive friction.',
    architecture:
      'Engineered with Vite, TypeScript, and Matter.js rigid-body physics featuring zero-gravity decay and cosine similarity vector clustering. Integrated a bi-directional Obsidian .canvas JSON AST compiler with lossless synchronization.',
    impact:
      'Sustained 60 FPS spatial physics loop across 200+ active nodes with zero layout jitter. Achieved 100% bi-directional Obsidian schema parity with zero-latency local vector queries.',
    hasSandbox: true,
    sandboxType: 'physics',
    fileCode: 'Mental Defrag',
    tagline: 'Zero-gravity spatial cognitive workspace',
    stack: 'Vite • TypeScript • Matter.js • Vector Embeddings • Obsidian Canvas',
    status: 'Production',
    date: '1996-11-04',
    size: '142KB',
  },
  {
    id: '02_FOCUSGUARD',
    index: '02',
    category: 'CHROME MV3',
    title: 'FocusGuard',
    summary:
      'Manifest V3 browser productivity daemon engineered for contextual tab suspension and background heap throttling.',
    outcomeBadge: '-58% RAM Reclaimed • <12 MB Heap • Manifest V3',
    demoUrl: 'https://github.com/watchknight/FocusGuard',
    sourceUrl: 'https://github.com/watchknight/FocusGuard',
    role: 'Systems & Extension Engineer',
    year: '2024',
    heroMetrics: [
      { value: '-58% RAM', label: 'Heap Reclaimed' },
      { value: '<12 MB', label: 'Heap Footprint' },
      { value: '0 LEAKS', label: 'MV3 Service Worker' },
    ],
    problem:
      'Modern browser workflows accumulate dozens of inactive tabs that consume gigabytes of memory and degrade workstation performance. Existing tab suspenders break page states and introduce intrusive service worker latency.',
    architecture:
      'Engineered a Chrome Manifest V3 daemon utilizing declarativeNetRequest rules and alarm-driven service workers. Implemented an adaptive background tab throttler that serialized DOM states before shedding memory.',
    impact:
      'Reclaimed 58% of dormant browser RAM while restricting background heap overhead to under 12 MB. Maintained instant zero-latency tab hydration without breaking session forms or audio streams.',
    hasSandbox: true,
    sandboxType: 'throttler',
    fileCode: 'FocusGuard',
    tagline: 'Contextual distraction blocker and background tab throttler',
    stack: 'Chrome Extension MV3 • TypeScript • WebSockets • React',
    status: 'Production',
    date: '1996-10-18',
    size: '188KB',
  },
  {
    id: '03_NEON_VANGUARD_POSIX',
    index: '03',
    category: 'SYSTEMS & 2D ENGINE',
    title: 'Neon Vanguard & POSIX',
    summary:
      'Deterministic 120 FPS HTML5 canvas combat engine coupled with Linux C POSIX shared memory and multi-process IPC labs.',
    outcomeBadge: '120 FPS Zero-Alloc Canvas • <1.2µs POSIX IPC',
    demoUrl: 'https://github.com/watchknight/BitForge',
    sourceUrl: 'https://github.com/watchknight/BitForge',
    role: 'Low-Level Systems & Graphics Engineer',
    year: '2023–2024',
    heroMetrics: [
      { value: '120 FPS', label: 'Zero-Alloc Canvas' },
      { value: '<1.2µs', label: 'POSIX IPC Latency' },
      { value: '0 LEAKS', label: '24hr Valgrind Audit' },
    ],
    problem:
      'High particle-count collision overhead causes severe GC pauses in web engines, while process IPC in operating systems suffers from locking contention. Developers need predictable frame pacing and sub-microsecond message dispatch.',
    architecture:
      'Engineered an HTML5 2D canvas engine with pre-allocated object pools, raycast piercing, and branching chain-lightning. Coupled with Linux C POSIX shared memory (shmget/shmat), anonymous duplex pipes, and multi-process fork hierarchies.',
    impact:
      'Sustained 120 FPS render pacing with zero garbage-collector allocations during intense combat scenes. Verified sub-1.2 microsecond round-trip IPC latency with zero memory leaks under 24-hour Valgrind stress runs.',
    hasSandbox: true,
    sandboxType: 'laser',
    fileCode: 'Neon Vanguard',
    tagline: 'HTML5 2D canvas combat engine & Linux C/C++ POSIX IPC',
    stack: 'C / C++ • Linux POSIX IPC • fork() • HTML5 Canvas • Shm',
    status: 'Active',
    date: '1996-08-30',
    size: '312KB',
  },
  {
    id: '04_DOCLENS_RANNABANNA',
    index: '04',
    category: 'CLOUD PLATFORM',
    title: 'DocLensBD & Rannabanna',
    summary:
      'Cloud-backed medical diagnostic intelligence platform featuring real-time Firestore synchronization and automated CI/CD staging pipelines.',
    outcomeBadge: 'Cloud Firestore • Real-Time Sync • CI/CD',
    demoUrl: 'https://github.com/watchknight/DocLensBD',
    sourceUrl: 'https://github.com/watchknight/DocLensBD',
    role: 'Full-Stack & Cloud Infrastructure Engineer',
    year: '2023–2024',
    heroMetrics: [
      { value: '<45 ms', label: 'Regional Snapshot Sync' },
      { value: '99.98%', label: 'Production SLA' },
      { value: '14/14 PASS', label: 'Automated CI/CD' },
    ],
    problem:
      'Regional health platforms in Bangladesh struggle with unreliable networks, packet loss, and unencrypted clinical records. Simultaneously, non-Latin localized web apps suffer from bloated fonts and sluggish search latency.',
    architecture:
      'Engineered on Cloud Firestore real-time snapshot listeners with offline IndexedDB caching and AES-256 field encryption. Paired with custom Bengali font glyph subsetting and automated GitHub Actions CI/CD deployment pipelines.',
    impact:
      'Delivered sub-45ms regional data propagation with a 99.98% production uptime SLA. Maintained 14/14 passing automated CI/CD tests and scored 99/100 on Google Lighthouse performance audits.',
    hasSandbox: false,
    fileCode: 'DocLensBD',
    tagline: 'Cloud-backed document & healthcare platform',
    stack: 'React • TypeScript • Cloud Firestore • Firebase Auth • CI/CD',
    status: 'Verified',
    date: '1996-10-28',
    size: '284KB',
  },
];

// Backwards-compatible export
export const FEATURED_PROJECTS = FLAGSHIP_PROJECTS;

// Resilient Static Fallback Array for GitHub Archive Accordion
export const FALLBACK_REPOSITORIES: GitHubRepoItem[] = [
  {
    id: 201,
    name: 'BitForge',
    description: 'HTML5 2D canvas combat engine paired with Linux C/C++ Operating Systems IPC & fork() labs.',
    html_url: 'https://github.com/watchknight/BitForge',
    stargazers_count: 32,
    language: 'C++',
    updated_at: '2026-08-30T16:00:00Z',
    forks_count: 8,
  },
  {
    id: 202,
    name: 'simd-json-stream',
    description: 'Zero-allocation JSON stream parser utilizing AVX-512 SIMD vector instructions for batch parsing.',
    html_url: 'https://github.com/watchknight/simd-json-stream',
    stargazers_count: 482,
    language: 'C++',
    updated_at: '2026-04-11T13:00:00Z',
    forks_count: 64,
  },
  {
    id: 203,
    name: 'posix-shm-kernel-lab',
    description: 'Linux C Operating Systems lab featuring POSIX shared memory, process hierarchies & spinlocks.',
    html_url: 'https://github.com/watchknight/posix-shm-kernel-lab',
    stargazers_count: 29,
    language: 'C',
    updated_at: '2026-05-24T12:00:00Z',
    forks_count: 7,
  },
  {
    id: 204,
    name: 'TrashTrail',
    description: 'Interactive scroll-driven environmental storytelling web application with GSAP ScrollTrigger.',
    html_url: 'https://github.com/watchknight/TrashTrail',
    stargazers_count: 18,
    language: 'JavaScript',
    updated_at: '2026-09-22T14:00:00Z',
    forks_count: 4,
  },
  {
    id: 205,
    name: 'POSHRA',
    description: 'High-throughput distributed data stream and component architecture for cyberdeck terminals.',
    html_url: 'https://github.com/watchknight/POSHRA',
    stargazers_count: 26,
    language: 'TypeScript',
    updated_at: '2026-07-28T10:00:00Z',
    forks_count: 3,
  },
  {
    id: 206,
    name: 'PureFeed',
    description: 'Distraction-free web productivity client with declarative content filtering and zero DOM leaks.',
    html_url: 'https://github.com/watchknight/PureFeed',
    stargazers_count: 21,
    language: 'TypeScript',
    updated_at: '2026-06-12T11:00:00Z',
    forks_count: 2,
  },
  {
    id: 211,
    name: 'hyperdeck-3d-particles',
    description: 'Volumetric wave synthesizer with 14,400+ points displaced on GPU via GLSL vertex shaders.',
    html_url: 'https://github.com/watchknight/hyperdeck-3d-particles',
    stargazers_count: 27,
    language: 'TypeScript',
    updated_at: '2026-08-14T08:00:00Z',
    forks_count: 6,
  },
  {
    id: 212,
    name: 'chiptune-audio-engine',
    description: 'Zero-asset procedural chiptune synthesizer and spatial panner using native Web Audio API.',
    html_url: 'https://github.com/watchknight/chiptune-audio-engine',
    stargazers_count: 16,
    language: 'TypeScript',
    updated_at: '2026-07-02T15:00:00Z',
    forks_count: 3,
  },
  {
    id: 207,
    name: 'Mental-Defrag',
    description: 'Zero-gravity spatial cognitive workspace built with Vite, TypeScript, 2D physics & Obsidian canvas.',
    html_url: 'https://github.com/watchknight/Mental-Defrag',
    stargazers_count: 24,
    language: 'TypeScript',
    updated_at: '2026-11-04T12:00:00Z',
    forks_count: 5,
  },
  {
    id: 208,
    name: 'FocusGuard',
    description: 'Chrome Manifest V3 distraction blocker and background tab heap throttler.',
    html_url: 'https://github.com/watchknight/FocusGuard',
    stargazers_count: 35,
    language: 'TypeScript',
    updated_at: '2026-10-18T14:00:00Z',
    forks_count: 6,
  },
  {
    id: 209,
    name: 'DocLensBD',
    description: 'Cloud-backed medical diagnostic platform engineered with Cloud Firestore & CI/CD pipelines.',
    html_url: 'https://github.com/watchknight/DocLensBD',
    stargazers_count: 19,
    language: 'TypeScript',
    updated_at: '2026-10-28T10:00:00Z',
    forks_count: 3,
  },
  {
    id: 210,
    name: 'Rannabanna',
    description: 'Full-stack localized Bengali culinary web application built with Vite and real-time cloud DB sync.',
    html_url: 'https://github.com/watchknight/Rannabanna',
    stargazers_count: 15,
    language: 'TypeScript',
    updated_at: '2026-10-15T09:00:00Z',
    forks_count: 2,
  },
];

const GITHUB_CACHE_KEY = 'watchknight_repos_v2';
const GITHUB_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// -------------------------------------------------------------
// SUB-COMPONENT: Mental Defrag Draggable Physics Nodes Sandbox
// -------------------------------------------------------------
interface PhysicsNode {
  id: number;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const AST_EDGES: [number, number][] = [
  [1, 2], // Obsidian AST <-> Matter.js
  [1, 3], // Obsidian AST <-> Vector Math
  [2, 4], // Matter.js <-> Cosine Repulsion
  [3, 4], // Vector Math <-> Cosine Repulsion
  [2, 5], // Matter.js <-> Lossless Sync
  [4, 6], // Cosine Repulsion <-> Zero Gravity
  [3, 6], // Vector Math <-> Zero Gravity
];

const MentalDefragSandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<PhysicsNode[]>([
    { id: 1, label: 'Obsidian AST', x: 80, y: 60, vx: 0.2, vy: -0.15, radius: 28 },
    { id: 2, label: 'Matter.js', x: 210, y: 95, vx: -0.15, vy: 0.25, radius: 24 },
    { id: 3, label: 'Vector Math', x: 135, y: 160, vx: 0.25, vy: 0.2, radius: 26 },
    { id: 4, label: 'Cosine Repulsion', x: 285, y: 135, vx: -0.2, vy: -0.2, radius: 26 },
    { id: 5, label: 'Lossless Sync', x: 365, y: 70, vx: 0.15, vy: 0.3, radius: 25 },
    { id: 6, label: 'Zero Gravity', x: 245, y: 205, vx: -0.25, vy: 0.15, radius: 24 },
  ]);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const dragVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  const pulseForce = () => {
    try {
      watchknightAudio.play8BitBlip(740);
    } catch {}
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
      }))
    );
  };

  const handlePointerDown = (id: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    try {
      watchknightAudio.play8BitBlip(880);
    } catch {}

    setActiveDragId(id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const targetNode = nodes.find((n) => n.id === id);
      if (targetNode) {
        dragOffsetRef.current = {
          x: clickX - targetNode.x,
          y: clickY - targetNode.y,
        };
      }
    }
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    dragVelocityRef.current = { vx: 0, vy: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragId === null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);
    const vx = ((e.clientX - lastPointerRef.current.x) / dt) * 16;
    const vy = ((e.clientY - lastPointerRef.current.y) / dt) * 16;
    dragVelocityRef.current = {
      vx: Math.max(-5, Math.min(5, vx)),
      vy: Math.max(-5, Math.min(5, vy)),
    };
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };

    const currentX = e.clientX - rect.left - dragOffsetRef.current.x;
    const currentY = e.clientY - rect.top - dragOffsetRef.current.y;

    const clampX = Math.max(30, Math.min(rect.width - 30, currentX));
    const clampY = Math.max(30, Math.min(rect.height - 30, currentY));

    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeDragId
          ? { ...n, x: clampX, y: clampY, vx: dragVelocityRef.current.vx, vy: dragVelocityRef.current.vy }
          : n
      )
    );
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e && e.currentTarget && typeof e.currentTarget.releasePointerCapture === 'function') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (activeDragId !== null) {
      try {
        watchknightAudio.play8BitBlip(560);
      } catch {}

      // Apply kinetic release velocity to the released node
      const releaseVx = dragVelocityRef.current.vx;
      const releaseVy = dragVelocityRef.current.vy;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === activeDragId
            ? { ...n, vx: releaseVx, vy: releaseVy }
            : n
        )
      );
    }
    setActiveDragId(null);
  };

  // Zero-gravity animation loop with authentic Hooke's Law spring tension and wall bounds
  useEffect(() => {
    let animId: number;

    const step = () => {
      setNodes((prev) => {
        const width = containerRef.current?.clientWidth || 450;
        const height = containerRef.current?.clientHeight || 260;

        // Clone current state for spring physics integration
        const next = prev.map((n) => ({ ...n }));
        const nodeMap = new Map(next.map((n) => [n.id, n]));

        // Calculate Hooke's Law spring forces between connected AST edges
        const REST_LENGTH = 110;
        const SPRING_K = 0.0022;

        for (const [idA, idB] of AST_EDGES) {
          const a = nodeMap.get(idA);
          const b = nodeMap.get(idB);
          if (!a || !b) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - REST_LENGTH;
          const force = displacement * SPRING_K;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (a.id !== activeDragId) {
            a.vx += fx;
            a.vy += fy;
          }
          if (b.id !== activeDragId) {
            b.vx -= fx;
            b.vy -= fy;
          }
        }

        // Apply velocities, subtle zero-gravity drift, wall collisions and damping
        return next.map((node) => {
          if (node.id === activeDragId) return node;

          // Subtle zero-gravity ambient wander drift
          const driftX = (Math.random() - 0.5) * 0.04;
          const driftY = (Math.random() - 0.5) * 0.04;

          let nx = node.x + node.vx;
          let ny = node.y + node.vy;
          let nvx = (node.vx + driftX) * 0.988; // zero-gravity viscous resistance
          let nvy = (node.vy + driftY) * 0.988;

          // Wall boundaries reflection
          if (nx < node.radius) {
            nx = node.radius;
            nvx = Math.abs(nvx) * 0.82;
          } else if (nx > width - node.radius) {
            nx = width - node.radius;
            nvx = -Math.abs(nvx) * 0.82;
          }

          if (ny < node.radius) {
            ny = node.radius;
            nvy = Math.abs(nvy) * 0.82;
          } else if (ny > height - node.radius) {
            ny = height - node.radius;
            nvy = -Math.abs(nvy) * 0.82;
          }

          return { ...node, x: nx, y: ny, vx: nvx, vy: nvy };
        });
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [activeDragId]);

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1 border-b" style={{ borderColor: `${mid}40` }}>
        <span className="font-bold" style={{ color: bright }}>
          Simulation: Draggable Physics Nodes (Matter.js • Zero-Gravity AST)
        </span>
        <button
          type="button"
          onClick={pulseForce}
          className="px-2 py-0.5 border text-[7.5px] font-mono cursor-pointer transition-none outline-none focus-visible:outline-dashed"
          style={{ backgroundColor: dim, borderColor: bright, color: bright }}
        >
          Pulse Force
        </button>
      </div>

      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative w-full h-[240px] sm:h-[260px] border overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        style={{
          backgroundColor: '#070814',
          borderColor: `${mid}40`,
          touchAction: 'none',
        }}
      >
        {/* Connection spring lines with dynamic spring tension opacity */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {AST_EDGES.map(([idA, idB]) => {
            const nodeA = nodes.find((n) => n.id === idA);
            const nodeB = nodes.find((n) => n.id === idB);
            if (!nodeA || !nodeB) return null;

            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const tension = Math.min(1, Math.abs(dist - 110) / 90);
            const opacity = Math.max(0.2, 0.45 + tension * 0.45);

            return (
              <line
                key={`${idA}-${idB}`}
                x1={nodeA.x}
                y1={nodeA.y}
                x2={nodeB.x}
                y2={nodeB.y}
                stroke={tension > 0.4 ? '#00F0FF' : bright}
                strokeWidth={tension > 0.5 ? '1.5' : '1'}
                strokeOpacity={opacity}
                strokeDasharray={tension > 0.6 ? '4,2' : '2,2'}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            onPointerDown={(e) => handlePointerDown(node.id, e)}
            className="absolute flex items-center justify-center p-1 border font-pixel text-[7px] text-center transition-none shadow-sm touch-none"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: activeDragId === node.id ? 10 : 2,
              backgroundColor: activeDragId === node.id ? bright : `${dim}e6`,
              color: activeDragId === node.id ? voidCol : bright,
              borderColor: bright,
              minWidth: '70px',
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            {node.label}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono" style={{ color: mid }}>
        <span>DRAG NODES TO TEST REVERSIBLE SPRING TENSION</span>
        <span>STATUS: LOSSLESS OBSIDIAN SYNC • 60 FPS</span>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: FocusGuard Interactive RAM Throttler Slider Sandbox
// -------------------------------------------------------------
const FocusGuardSandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const [throttle, setThrottle] = useState<number>(58);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setThrottle(val);
    if (val % 8 === 0) {
      try {
        watchknightAudio.play8BitBlip(440 + val * 4);
      } catch {}
    }
  };

  const setPreset = (pct: number) => {
    try {
      watchknightAudio.play8BitBlip(680);
    } catch {}
    setThrottle(pct);
  };

  // Reclaimed RAM math: base heap is 1840 MB, throttled down to ~420 MB
  const reclaimedPct = Math.round(throttle * 0.77);
  const currentHeapMB = Math.round(1840 - (1840 - 420) * (throttle / 100));
  const suspendedTabs = Math.round(24 * (throttle / 100));

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1 border-b" style={{ borderColor: `${mid}40` }}>
        <span className="font-bold" style={{ color: bright }}>
          &gt; SIMULATION: BACKGROUND TAB HEAP THROTTLER (MANIFEST V3 DAEMON)
        </span>
        <span className="font-mono text-[8px] font-bold" style={{ color: bright }}>
          THROTTLE: {throttle}%
        </span>
      </div>

      {/* Slider Controls */}
      <div className="flex flex-col gap-1.5 p-2 border" style={{ backgroundColor: `${dim}30`, borderColor: `${mid}40` }}>
        <div className="flex items-center justify-between text-[7.5px] font-mono">
          <span style={{ color: mid }}>THROTTLE INTENSITY:</span>
          <span style={{ color: bright }}>
            {reclaimedPct}% RECLAIMED ({1840 - currentHeapMB} MB SAVED)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={throttle}
          onChange={handleSlider}
          className="w-full h-2 cursor-pointer appearance-none outline-none"
          style={{
            backgroundColor: dim,
            accentColor: bright,
          }}
          aria-label="Interactive RAM throttler slider"
        />
        <div className="flex items-center justify-between text-[7px] font-mono" style={{ color: mid }}>
          <span>0% (Idle / 1,840 MB)</span>
          <span>50% (Balanced / 1,130 MB)</span>
          <span>100% (Aggressive Discard / 420 MB)</span>
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: '0% Idle', pct: 0 },
          { label: '58% Optimized', pct: 58 },
          { label: '100% Aggressive', pct: 100 },
        ].map((item) => (
          <button
            key={item.pct}
            type="button"
            onClick={() => setPreset(item.pct)}
            className="p-1 border text-[7px] sm:text-[7.5px] font-pixel cursor-pointer transition-none outline-none focus-visible:outline-dashed"
            style={
              throttle === item.pct
                ? { backgroundColor: bright, color: voidCol, borderColor: bright }
                : { backgroundColor: dim, color: bright, borderColor: `${mid}60` }
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Simulated Tab Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[6.5px] sm:text-[7px] font-mono">
        {Array.from({ length: 8 }).map((_, i) => {
          const isSuspended = i < Math.floor(suspendedTabs / 3);
          return (
            <div
              key={i}
              className="p-1 border flex flex-col justify-between"
              style={{
                backgroundColor: isSuspended ? `${dim}50` : `${voidCol}80`,
                borderColor: isSuspended ? `${mid}60` : bright,
                color: isSuspended ? `${bright}80` : bright,
              }}
            >
              <span>{`Tab 0${i + 1}`}</span>
              <span className="font-bold">
                {isSuspended ? 'Discarded • 2MB' : 'Active • 120MB'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono" style={{ color: mid }}>
        <span>Heap: {currentHeapMB} MB / 1,840 MB Total</span>
        <span>Daemon Wakelocks: 0 (Zero Idle CPU)</span>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUB-COMPONENT: Neon Vanguard Clickable Laser Target Canvas Sandbox
// -------------------------------------------------------------
interface ParticleSpark {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface LaserBeam {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
  maxLife: number;
  hit: boolean;
}

const SPARK_POOL_SIZE = 96;
const BEAM_POOL_SIZE = 8;

const NeonVanguardSandbox: React.FC<{
  bright: string;
  mid: string;
  dim: string;
  voidCol: string;
}> = ({ bright, mid, dim, voidCol }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [neutralizedCount, setNeutralizedCount] = useState<number>(0);

  // Pre-allocated zero-allocation deterministic memory pools
  const sparksRef = useRef<ParticleSpark[]>([]);
  const beamsRef = useRef<LaserBeam[]>([]);
  const targetXRef = useRef<number>(140);
  const targetVxRef = useRef<number>(1.8);
  const targetFlashRef = useRef<number>(0);

  // Initialize fixed memory pools once on component mount
  useEffect(() => {
    if (sparksRef.current.length === 0) {
      const pool: ParticleSpark[] = [];
      const colors = [bright, '#00F0FF', '#FF2A85', '#4AF626'];
      for (let i = 0; i < SPARK_POOL_SIZE; i++) {
        pool.push({
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 20,
          color: colors[i % colors.length],
        });
      }
      sparksRef.current = pool;
    }

    if (beamsRef.current.length === 0) {
      const beamPool: LaserBeam[] = [];
      for (let i = 0; i < BEAM_POOL_SIZE; i++) {
        beamPool.push({
          active: false,
          startX: 240,
          startY: 175,
          endX: 0,
          endY: 0,
          life: 0,
          maxLife: 8,
          hit: false,
        });
      }
      beamsRef.current = beamPool;
    }
  }, [bright]);

  // Click / Tap on canvas to fire instant zero-alloc raycast laser
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Correct coordinate transformation accounting for CSS stretch
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const turretX = canvas.width / 2;
    const turretY = canvas.height - 5;

    // Check hit against moving target drone (centered at targetX, y=40, w=36, h=24)
    const targetX = targetXRef.current;
    const isHit = Math.abs(clickX - targetX) <= 22 && Math.abs(clickY - 40) <= 16;

    if (isHit) {
      targetFlashRef.current = 14;
      setNeutralizedCount((c) => c + 1);
      try {
        watchknightAudio.play8BitBlip(1420);
      } catch {}
    } else {
      try {
        watchknightAudio.play8BitBlip(880);
      } catch {}
    }

    // Activate a laser beam from pre-allocated beam pool
    const beam = beamsRef.current.find((b) => !b.active) || beamsRef.current[0];
    if (beam) {
      beam.active = true;
      beam.startX = turretX;
      beam.startY = turretY;
      beam.endX = clickX;
      beam.endY = clickY;
      beam.life = 0;
      beam.maxLife = isHit ? 10 : 7;
      beam.hit = isHit;
    }

    // Activate kinetic particle sparks from pre-allocated zero-alloc pool
    const count = isHit ? 24 : 12;
    let activated = 0;
    const sparks = sparksRef.current;
    const colors = isHit
      ? ['#FF2A85', '#00F0FF', '#FFFFFF', bright]
      : [bright, '#00F0FF', `${bright}99`];

    for (let i = 0; i < sparks.length && activated < count; i++) {
      const p = sparks[i];
      if (!p.active) {
        p.active = true;
        p.x = clickX;
        p.y = clickY;
        const angle = Math.random() * Math.PI * 2;
        const speed = isHit ? 2.0 + Math.random() * 4.5 : 1.2 + Math.random() * 2.8;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = 0;
        p.maxLife = 16 + Math.floor(Math.random() * 16);
        p.color = colors[activated % colors.length];
        activated++;
      }
    }
  };

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Clear with CRT phosphor void
      ctx.fillStyle = '#070814';
      ctx.fillRect(0, 0, w, h);

      // Subtle background grid
      ctx.strokeStyle = `${dim}35`;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Update target drone position
      let tx = targetXRef.current + targetVxRef.current;
      if (tx < 45 || tx > w - 45) {
        targetVxRef.current = -targetVxRef.current;
        tx = Math.max(45, Math.min(w - 45, tx));
      }
      targetXRef.current = tx;

      // Draw bottom turret defense battery
      const turretX = w / 2;
      const turretY = h - 6;
      ctx.fillStyle = mid;
      ctx.fillRect(turretX - 16, turretY, 32, 6);
      ctx.fillStyle = bright;
      ctx.fillRect(turretX - 6, turretY - 6, 12, 6);

      // Active Laser Beams
      const beams = beamsRef.current;
      for (let i = 0; i < beams.length; i++) {
        const b = beams[i];
        if (!b.active) continue;
        b.life++;
        if (b.life >= b.maxLife) {
          b.active = false;
          continue;
        }

        const beamAlpha = 1 - b.life / b.maxLife;

        // Outer glow beam
        ctx.strokeStyle = b.hit ? '#FF2A85' : '#00F0FF';
        ctx.lineWidth = b.hit ? 3 : 2;
        ctx.globalAlpha = beamAlpha * 0.85;
        ctx.beginPath();
        ctx.moveTo(b.startX, b.startY);
        ctx.lineTo(b.endX, b.endY);
        ctx.stroke();

        // Core white streak
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = beamAlpha;
        ctx.beginPath();
        ctx.moveTo(b.startX, b.startY);
        ctx.lineTo(b.endX, b.endY);
        ctx.stroke();

        ctx.globalAlpha = 1;
      }

      // Draw moving target drone
      const isTargetFlashing = targetFlashRef.current > 0;
      if (isTargetFlashing) {
        targetFlashRef.current--;
      }

      const droneColor = isTargetFlashing ? '#FF2A85' : bright;
      ctx.strokeStyle = droneColor;
      ctx.lineWidth = isTargetFlashing ? 2 : 1.5;
      ctx.strokeRect(tx - 18, 28, 36, 24);
      ctx.fillStyle = isTargetFlashing ? '#FF2A8550' : `${bright}25`;
      ctx.fillRect(tx - 18, 28, 36, 24);

      // Target crosshairs
      ctx.beginPath();
      ctx.moveTo(tx, 22);
      ctx.lineTo(tx, 58);
      ctx.moveTo(tx - 24, 40);
      ctx.lineTo(tx + 24, 40);
      ctx.stroke();

      ctx.fillStyle = droneColor;
      ctx.font = '8px monospace';
      ctx.fillText(isTargetFlashing ? '!HIT!' : 'Target', tx - 20, 24);

      // Render kinetic sparks from zero-alloc pool
      const sparks = sparksRef.current;
      for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life++;

        if (p.life >= p.maxLife) {
          p.active = false;
          continue;
        }

        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bright, dim, mid]);

  return (
    <div
      data-testid="interactive-demo-sandbox"
      className="p-3 border flex flex-col gap-2 mt-2 select-none"
      style={{ backgroundColor: `${voidCol}f0`, borderColor: mid }}
    >
      <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono pb-1 border-b" style={{ borderColor: `${mid}40` }}>
        <span className="font-bold" style={{ color: bright }}>
          Simulation: Zero-Alloc Laser Target Canvas (120 FPS • Deterministic Pool)
        </span>
        <span className="font-mono text-[8px] font-bold" style={{ color: bright }}>
          Targets Hit: {neutralizedCount}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={480}
        height={180}
        onClick={handleCanvasClick}
        className="w-full h-[180px] border cursor-crosshair touch-none"
        style={{ borderColor: mid, touchAction: 'none' }}
        aria-label="Clickable zero-alloc laser target canvas"
      />

      <div className="flex items-center justify-between text-[7px] sm:text-[7.5px] font-mono" style={{ color: mid }}>
        <span>Click or tap canvas to fire instant raycast laser</span>
        <span>Zero runtime heap allocations • &lt;1.2µs POSIX</span>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MAIN COMPONENT: ProjectsView
// -------------------------------------------------------------
const FLAGSHIP_REPO_SLUGS = new Set([
  'mental-defrag',
  'focusguard',
  'doclensbd',
  'rannabanna',
]);

export const ProjectsView: React.FC<ProjectsViewProps> = ({ palette }) => {
  const os = useRetroOS();

  const bright = palette?.bright ?? '#c2cdb4';
  const voidCol = palette?.void ?? '#111712';
  const mid = palette?.mid ?? '#6e7d62';
  const dim = palette?.dim ?? '#2e3b2b';

  // 1. Single Selected Project for Unfolding Case Study Reader View (null = Grid view)
  const [selectedProject, setSelectedProject] = useState<FlagshipProject | null>(null);

  // 2. Interactive Sandbox toggle state inside Case Study Detail View
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // 3. Compact GitHub Archive Accordion state (collapsed by default)
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);

  // 4. Live Repositories state & fetch lifecycle
  const [repos, setRepos] = useState<GitHubRepoItem[]>(FALLBACK_REPOSITORIES);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Audio blip helper
  const playClickSound = (freq: number = 640) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {}
  };

  // Fetch additional repos with sessionStorage caching and flagship deduplication
  useEffect(() => {
    let isCancelled = false;

    const loadAdditionalRepos = async () => {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          const cachedStr = sessionStorage.getItem(GITHUB_CACHE_KEY);
          if (cachedStr) {
            const parsed = JSON.parse(cachedStr);
            if (Date.now() - (parsed.timestamp || 0) < GITHUB_CACHE_TTL && Array.isArray(parsed.data)) {
              if (!isCancelled) {
                setRepos(parsed.data);
              }
              return;
            }
          }
        } catch {}
      }

      try {
        const res = await fetch(
          'https://api.github.com/users/watchknight/repos?sort=updated&per_page=10',
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );

        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && !isCancelled) {
          const formatted: GitHubRepoItem[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            html_url: item.html_url || `https://github.com/watchknight/${item.name}`,
            stargazers_count: item.stargazers_count ?? 0,
            language: item.language ?? 'Text',
            updated_at: item.updated_at,
            forks_count: item.forks_count ?? 0,
          }));

          // Merge fetched repos with static fallback so that required labs remain present
          const existingNames = new Set(formatted.map((r) => r.name.toLowerCase()));
          const merged = [...formatted];
          for (const fb of FALLBACK_REPOSITORIES) {
            if (!existingNames.has(fb.name.toLowerCase())) {
              merged.push(fb);
              existingNames.add(fb.name.toLowerCase());
            }
          }

          setRepos(merged);

          try {
            sessionStorage.setItem(
              GITHUB_CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: merged })
            );
          } catch {}
        }
      } catch {
        // Fallback array remains default
      }
    };

    loadAdditionalRepos();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter out the 4 flagship case studies to present strictly the 8 additional open-source labs
  const additionalArchiveRepos = repos
    .filter((r) => !FLAGSHIP_REPO_SLUGS.has(r.name.toLowerCase()))
    .slice(0, 8);

  // Transition into Case Study Detail View with Bayer Dither
  const handleOpenDetailView = (proj: FlagshipProject) => {
    playClickSound(880);
    setIsSandboxOpen(false);

    if (os.triggerDitherTransition) {
      os.triggerDitherTransition(() => {
        setSelectedProject(proj);
      });
    } else {
      setSelectedProject(proj);
    }
  };

  // Transition back to 2x2 Flagship Project Grid with Bayer Dither
  const handleBackToGrid = () => {
    playClickSound(640);
    setIsSandboxOpen(false);

    if (os.triggerDitherTransition) {
      os.triggerDitherTransition(() => {
        setSelectedProject(null);
      });
    } else {
      setSelectedProject(null);
    }
  };

  return (
    <article
      data-testid="retro-content-projects"
      className="flex flex-col gap-4 font-pixel select-text"
      style={{ color: bright }}
    >
      {/* ============================================================== */}
      {/* TIER 1: CURATED 2x2 FLAGSHIP PROJECT GRID (DEFAULT WORK VIEW)  */}
      {/* ============================================================== */}
      {selectedProject === null ? (
        <>
          {/* SECTION HEADER: Clean title + Right-aligned GitHub Link */}
          <header
            className="pb-2 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 font-bold uppercase tracking-wide"
            style={{ borderColor: mid }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs" style={{ color: bright }}>
                SELECTED ENGINEERING WORK (4 FLAGSHIP CASE STUDIES)
              </span>
            </div>
            <a
              href="https://github.com/watchknight"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playClickSound(800)}
              className="font-mono text-xs hover:underline self-start sm:self-auto outline-none focus-visible:outline-dashed"
              style={{ color: bright }}
            >
              All 14 Repos on GitHub @watchknight
            </a>
          </header>

          {/* SPACIOUS 2x2 FLAGSHIP PROJECT GRID (1 col mobile, 2 col desktop, 20px gap) */}
          <section
            data-testid="flagship-projects-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-[20px]"
          >
            {FLAGSHIP_PROJECTS.map((project) => {
              const isHovered = hoveredCardId === project.id;
              return (
                <div
                  key={project.id}
                  data-testid={`flagship-card-${project.index}`}
                  onMouseEnter={() => setHoveredCardId(project.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  className="flex flex-col justify-between transition-colors cursor-pointer"
                  style={{
                    padding: '20px',
                    border: `1px solid ${isHovered ? bright : mid}`,
                    backgroundColor: isHovered ? `${dim}55` : `${dim}28`,
                  }}
                  onClick={() => handleOpenDetailView(project)}
                >
                  <div className="flex flex-col gap-3">
                    {/* ELEMENT 1: Top row with monospace index and category tag */}
                    <div className="flex items-center justify-between font-mono text-xs font-bold tracking-wider">
                      <span style={{ color: bright }}>{project.index}</span>
                      <span
                        className="px-1.5 py-0.5 border text-[10px]"
                        style={{
                          borderColor: `${mid}80`,
                          backgroundColor: `${voidCol}80`,
                          color: bright,
                        }}
                      >
                        {project.category}
                      </span>
                    </div>

                    {/* ELEMENT 2: Project Title in bold crisp typography + 1-sentence high-impact summary in 'Plus Jakarta Sans' */}
                    <div className="flex flex-col gap-1.5">
                      <h2
                        className="font-bold text-sm sm:text-base tracking-wide"
                        style={{ color: bright }}
                      >
                        {project.title}
                      </h2>
                      <p
                        className="font-body text-xs sm:text-[13.5px] leading-relaxed"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          color: `${bright}dd`,
                        }}
                      >
                        {project.summary}
                      </p>
                    </div>

                    {/* ELEMENT 3: Single key quantified outcome badge */}
                    <div
                      className="p-2 border text-center font-mono text-xs font-bold tracking-tight"
                      style={{
                        backgroundColor: `${voidCol}95`,
                        borderColor: isHovered ? bright : `${mid}70`,
                        color: bright,
                      }}
                    >
                      {project.outcomeBadge}
                    </div>
                  </div>

                  {/* ELEMENT 4: Bottom action row with Read Case Study, Live Demo, and GitHub */}
                  <div
                    className="flex items-center justify-between gap-2 pt-3 mt-4 border-t flex-wrap"
                    style={{ borderColor: `${mid}40` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      data-testid={`retro-btn-read-case-study-${project.index}`}
                      onClick={() => handleOpenDetailView(project)}
                      className="px-2.5 py-1.5 border font-mono font-bold text-xs uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
                      style={{
                        backgroundColor: bright,
                        color: voidCol,
                        borderColor: bright,
                      }}
                    >
                      Read Case Study
                    </button>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playClickSound(760)}
                        className="px-2 py-1 border hover:underline outline-none focus-visible:outline-dashed"
                        style={{ borderColor: mid, color: bright }}
                      >
                        Live Demo
                      </a>

                      <a
                        href={project.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playClickSound(720)}
                        className="px-2 py-1 border hover:underline outline-none focus-visible:outline-dashed"
                        style={{ borderColor: mid, color: bright }}
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* ============================================================== */}
          {/* TIER 3: COMPACT GITHUB ARCHIVE ACCORDION AT BOTTOM OF WORK VIEW */}
          {/* ============================================================== */}
          <section
            data-testid="github-archive-accordion"
            className="flex flex-col gap-2 pt-2 border-t"
            style={{ borderColor: `${mid}50` }}
          >
            {/* Collapsible Accordion Bar */}
            <button
              type="button"
              data-testid="btn-toggle-github-accordion"
              onClick={() => {
                playClickSound(isAccordionOpen ? 540 : 680);
                setIsAccordionOpen((prev) => !prev);
              }}
              aria-expanded={isAccordionOpen}
              className="w-full text-left p-2 border font-mono font-bold text-xs tracking-wide flex items-center justify-between cursor-pointer transition-none outline-none focus-visible:outline-dashed"
              style={{
                backgroundColor: isAccordionOpen ? dim : `${dim}40`,
                borderColor: isAccordionOpen ? bright : mid,
                color: bright,
              }}
            >
              <span>
                {isAccordionOpen
                  ? '- Hide Additional Labs'
                  : '+ View Additional Labs (8)'}
              </span>
              <span className="text-[10px]" style={{ color: mid }}>
                {isAccordionOpen ? 'COLLAPSE' : 'EXPAND TABLE'}
              </span>
            </button>

            {/* Clean single-line table of additional @watchknight repositories */}
            {isAccordionOpen && (
              <div
                data-testid="github-archive-table"
                className="border p-2 overflow-x-auto flex flex-col gap-1.5"
                style={{ backgroundColor: `${voidCol}cc`, borderColor: mid }}
              >
                <div
                  className="grid grid-cols-12 gap-2 text-[8px] sm:text-[8.5px] font-mono uppercase pb-1 border-b font-bold"
                  style={{ borderColor: `${mid}40`, color: mid }}
                >
                  <span className="col-span-4 sm:col-span-3">REPOSITORY</span>
                  <span className="col-span-3 sm:col-span-2">STACK</span>
                  <span className="hidden sm:inline sm:col-span-4">DESCRIPTION</span>
                  <span className="col-span-2 sm:col-span-1 text-center">STARS</span>
                  <span className="col-span-3 sm:col-span-2 text-right">ACTION</span>
                </div>

                <div className="flex flex-col gap-1">
                  {additionalArchiveRepos.map((repo) => (
                    <div
                      key={repo.id}
                      data-testid={`github-repo-row-${repo.name}`}
                      className="grid grid-cols-12 gap-2 items-center p-1 border text-[7.5px] sm:text-[8px] font-mono hover:brightness-125 transition-none"
                      style={{
                        backgroundColor: `${dim}25`,
                        borderColor: `${mid}35`,
                        color: bright,
                      }}
                    >
                      <span className="col-span-4 sm:col-span-3 font-bold truncate">
                        {repo.name}
                      </span>
                      <span className="col-span-3 sm:col-span-2 truncate" style={{ color: `${bright}bb` }}>
                        {repo.language || 'Code'}
                      </span>
                      <span className="hidden sm:inline sm:col-span-4 truncate text-[7.5px]" style={{ color: `${bright}99` }}>
                        {repo.description || 'Public GitHub laboratory repository.'}
                      </span>
                      <span className="col-span-2 sm:col-span-1 text-center font-bold" style={{ color: bright }}>
                        ★ {repo.stargazers_count}
                      </span>
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <a
                          href={repo.html_url || `https://github.com/watchknight/${repo.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => playClickSound(800)}
                          className="hover:underline font-bold px-1 py-0.5 border inline-block"
                          style={{ borderColor: `${mid}60`, color: bright }}
                        >
                          GitHub ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* BACKWARDS-COMPATIBLE SYSTEM SUBSYSTEMS & ARCHITECTURAL LABS */}
          <section
            data-testid="subsystems-labs-archive"
            className="p-2 border flex flex-col gap-1.5"
            style={{ backgroundColor: `${dim}20`, borderColor: `${mid}50` }}
          >
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-bold uppercase pb-0.5 border-b" style={{ borderColor: `${mid}40` }}>
              <span>Architecture Labs</span>
              <span style={{ color: mid }}>Online Labs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[7px] sm:text-[7.5px] font-mono">
              <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
                <div className="font-bold" style={{ color: bright }}>1. Hyperdeck 3D Particle Engine</div>
                <div style={{ color: `${bright}bb` }}>Volumetric wave synthesizer with 14,400+ points displaced on GPU via GLSL vertex shaders.</div>
                <div className="text-[6.5px]" style={{ color: mid }}>Three.js • GLSL • WebGL 2.0 • GSAP</div>
              </div>

              <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
                <div className="font-bold" style={{ color: bright }}>2. Retro 90s OS Window Manager</div>
                <div style={{ color: `${bright}bb` }}>Authentic cyberdeck desktop window manager with stepped transitions and phosphor optics.</div>
                <div className="text-[6.5px]" style={{ color: mid }}>React 18 • TypeScript • TailwindCSS</div>
              </div>

              <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
                <div className="font-bold" style={{ color: bright }}>3. Procedural Chiptune Audio Engine</div>
                <div style={{ color: `${bright}bb` }}>Native Web Audio API 4-channel retro chiptune synthesizer and 3D spatial panner. Zero external audio files.</div>
                <div className="text-[6.5px]" style={{ color: mid }}>Web Audio API • AnalyserNode • GSAP Ticker</div>
              </div>

              <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
                <div className="font-bold" style={{ color: bright }}>4. Dedicated Browser Extension Studio</div>
                <div style={{ color: `${bright}bb` }}>Keyboard-first browser productivity suite with real-time DOM inspection and secure background service workers.</div>
                <div className="text-[6.5px]" style={{ color: mid }}>Manifest V3 • WebSockets • TypeScript</div>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* ============================================================== */
        /* TIER 2: UNFOLDING CASE STUDY DETAIL VIEW (READER VIEW)         */
        /* ============================================================== */
        <section
          data-testid="case-study-detail-view"
          className="flex flex-col gap-4 font-pixel select-text"
        >
          {/* TOP NAVIGATION: Back to All Projects */}
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: mid }}>
            <button
              type="button"
              data-testid="btn-back-to-projects"
              onClick={handleBackToGrid}
              className="px-3 py-1.5 border font-mono font-bold text-xs uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
              style={{
                backgroundColor: dim,
                borderColor: bright,
                color: bright,
              }}
            >
              Back to All Projects
            </button>
            <span className="font-mono text-xs" style={{ color: mid }}>
              Case Study • {selectedProject.index} of 04
            </span>
          </div>

          {/* PROJECT HEADER: Title, Role, Year, Live Demo, and GitHub Source */}
          <div
            className="p-3 sm:p-4 border flex flex-col gap-3"
            style={{ backgroundColor: `${dim}35`, borderColor: mid }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2" style={{ borderColor: `${mid}40` }}>
              <div>
                <span className="font-mono text-[9px] font-bold" style={{ color: mid }}>
                  {selectedProject.index} • {selectedProject.category}
                </span>
                <h1 className="font-bold text-base sm:text-xl tracking-wide mt-0.5" style={{ color: bright }}>
                  {selectedProject.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <a
                  href={selectedProject.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClickSound(840)}
                  className="px-3 py-1.5 border font-bold hover:underline outline-none focus-visible:outline-dashed"
                  style={{ backgroundColor: bright, color: voidCol, borderColor: bright }}
                >
                  Live Demo
                </a>
                <a
                  href={selectedProject.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClickSound(740)}
                  className="px-3 py-1.5 border font-bold hover:underline outline-none focus-visible:outline-dashed"
                  style={{ borderColor: bright, color: bright }}
                >
                  GitHub Source
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono" style={{ color: `${bright}cc` }}>
              <span>
                ROLE: <strong style={{ color: bright }}>{selectedProject.role}</strong>
              </span>
              <span>
                YEAR: <strong style={{ color: bright }}>{selectedProject.year}</strong>
              </span>
            </div>
          </div>

          {/* 3 HERO METRIC BOXES IN HORIZONTAL ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedProject.heroMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-3 border flex flex-col items-center justify-center text-center gap-1"
                style={{ backgroundColor: `${voidCol}90`, borderColor: mid }}
              >
                <span className="font-pixel text-base sm:text-lg font-bold" style={{ color: bright }}>
                  {metric.value}
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase font-bold" style={{ color: mid }}>
                  {metric.label}
                </span>
              </div>
            ))}
          </div>

          {/* CONCISE 3-PART BREAKDOWN (Problem, How It Works, Key Results) */}
          <div className="flex flex-col gap-3">
            {/* 1. Problem */}
            <div className="p-3.5 border flex flex-col gap-1.5" style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}>
              <div className="font-pixel text-xs font-bold uppercase tracking-wide" style={{ color: bright }}>
                Problem
              </div>
              <p
                className="font-body text-xs sm:text-[14px] leading-relaxed"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: `${bright}dd`,
                }}
              >
                {selectedProject.problem}
              </p>
            </div>

            {/* 2. How It Works */}
            <div className="p-3.5 border flex flex-col gap-1.5" style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}>
              <div className="font-pixel text-xs font-bold uppercase tracking-wide" style={{ color: bright }}>
                How It Works
              </div>
              <p
                className="font-body text-xs sm:text-[14px] leading-relaxed"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: `${bright}dd`,
                }}
              >
                {selectedProject.architecture}
              </p>
            </div>

            {/* 3. Key Results */}
            <div className="p-3.5 border flex flex-col gap-1.5" style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}>
              <div className="font-pixel text-xs font-bold uppercase tracking-wide" style={{ color: bright }}>
                Key Results
              </div>
              <p
                className="font-body text-xs sm:text-[14px] leading-relaxed"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: `${bright}dd`,
                }}
              >
                {selectedProject.impact}
              </p>
            </div>
          </div>

          {/* PROGRESSIVE DISCLOSURE: OPTIONAL INTERACTIVE DEMO SANDBOX */}
          {selectedProject.hasSandbox && (
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                data-testid="btn-toggle-sandbox"
                onClick={() => {
                  playClickSound(isSandboxOpen ? 580 : 880);
                  setIsSandboxOpen((prev) => !prev);
                }}
                className="w-full text-center p-2 border font-mono font-bold text-xs uppercase cursor-pointer transition-none outline-none focus-visible:outline-dashed"
                style={{
                  backgroundColor: isSandboxOpen ? bright : dim,
                  color: isSandboxOpen ? voidCol : bright,
                  borderColor: bright,
                }}
              >
                {isSandboxOpen
                  ? 'Close Interactive Demo'
                  : 'Launch Interactive Demo'}
              </button>

              {isSandboxOpen && (
                <>
                  {selectedProject.sandboxType === 'physics' && (
                    <MentalDefragSandbox
                      bright={bright}
                      mid={mid}
                      dim={dim}
                      voidCol={voidCol}
                    />
                  )}
                  {selectedProject.sandboxType === 'throttler' && (
                    <FocusGuardSandbox
                      bright={bright}
                      mid={mid}
                      dim={dim}
                      voidCol={voidCol}
                    />
                  )}
                  {selectedProject.sandboxType === 'laser' && (
                    <NeonVanguardSandbox
                      bright={bright}
                      mid={mid}
                      dim={dim}
                      voidCol={voidCol}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}
    </article>
  );
};

export default ProjectsView;
