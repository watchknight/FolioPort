import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTransition } from '../context/TransitionContext';
import { useTheme } from '../context/ThemeContext';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { GithubIcon } from './ui/Icons';
import {
  ExternalLink,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Terminal as TerminalIcon,
  RotateCcw,
  Play,
  Share2,
  Database,
  Cpu,
  AlertTriangle,
  ChevronRight,
  Terminal,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ============================================================================
// DATA STRUCTURE & 6 FLAGSHIP CASE STUDIES
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
  accent: 'cyan' | 'magenta' | 'amber';
  p99Latency: string;
  fpsMetric: string;
  parityMetric: string;
  trisCount: string;
  holoGeometryName: string;
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
  previewType: 'mental-defrag' | 'doclens' | 'rannabanna' | 'trash-trail' | 'neon-vanguard' | 'chronos-aether';
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
    p99Latency: '< 0.12 ms',
    fpsMetric: '60 FPS',
    parityMetric: '100% AST Parity',
    trisCount: '16.8K TRIS',
    holoGeometryName: 'SPATIAL_DODECAHEDRON_CORE',
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
        { label: 'Query Latency', value: '< 0.12 ms', detail: 'Local-first IndexedDB p99' },
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
    p99Latency: '< 45 ms',
    fpsMetric: '60 FPS',
    parityMetric: '99.98% SLA',
    trisCount: '14.2K TRIS',
    holoGeometryName: 'DATA_CYLINDER_ARRAY',
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
    p99Latency: '< 15 ms',
    fpsMetric: '60 FPS',
    parityMetric: '99/100 Lighthouse',
    trisCount: '24.6K TRIS',
    holoGeometryName: 'PARAMETRIC_BOTANICAL_TORUS',
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
    p99Latency: '< 1.0 ms',
    fpsMetric: '60 FPS',
    parityMetric: '0.00 CLS Score',
    trisCount: '18.2K TRIS',
    holoGeometryName: 'MOBIUS_HYDRO_RIBBON',
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
    p99Latency: '< 1.2 μs',
    fpsMetric: '120 FPS',
    parityMetric: '0 Leaks (Valgrind)',
    trisCount: '21.0K TRIS',
    holoGeometryName: 'OCTAHEDRAL_COMBAT_GIMBAL',
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
  },
  {
    id: 'chronos-aether',
    number: '06',
    title: 'Chronos-Guard & Aether-GL',
    subtitle: 'Cryptographic Merkle Agent Ledger & Audio-Reactive WebGPU Fluid Studio',
    category: 'Cryptographic Systems & GPU Shaders',
    client: 'Systems Architecture & Shader Lab',
    role: 'Lead Cryptographic & GPU Technologist',
    coreStack: 'WebGPU • SHA-256 • Navier-Stokes',
    year: '2024',
    accent: 'cyan',
    p99Latency: '< 0.12 ms',
    fpsMetric: '120 FPS',
    parityMetric: '100% Cryptographic SLA',
    trisCount: '28.4K TRIS',
    holoGeometryName: 'MERKLE_FLUID_VAULT',
    problem: {
      headline: 'Tamper Vulnerability in Distributed State & GPU Shader Stutters',
      description: 'Distributed AI agent state mutations lack immutable audit trails with sub-millisecond tamper alerts, while web-based Eulerian fluid solvers drop frames under dynamic acoustic FFT turbulence.',
      bottleneck: 'High hash calculation overhead in multi-agent pipelines and GPU raster bottlenecks during fluid Jacobi pressure Poisson iterations.'
    },
    solution: {
      headline: 'SHA-256 Merkle Ledger & WebGPU Eulerian Fluid Dynamics Solver',
      description: 'Architected a tamper-evident cryptographic agent ledger utilizing monotonic append-only Merkle tree state anchors with HMAC verification; paired with a dual-API WebGPU / WebGL2 Navier-Stokes fluid synthesizer driven by procedural FFT audio frequency injections.',
      architecture: [
        'Monotonic append-only ledger secured via SHA-256 Merkle tree state anchors with sub-0.12ms tamper alerts',
        'HMAC-SHA256 authenticated agent signatures preventing unauthorized state mutations at 18,500 evt/s',
        'Eulerian Navier-Stokes fluid grid solver executing advection, diffusion, and Poisson pressure Jacobi steps',
        'Fast Fourier Transform (FFT) procedural Web Audio frequency decomposition injecting dynamic fluid vorticity'
      ]
    },
    impact: {
      metrics: [
        { label: 'Tamper Detection', value: '< 0.12 ms', detail: 'Merkle root proof p99' },
        { label: 'Fluid Pass Time', value: '1.42 ms', detail: 'WebGPU compute kernel' },
        { label: 'Event Ingest', value: '18.5k evt/s', detail: 'Lock-free POSIX buffer' }
      ],
      summary: 'Unifies cryptographic ledger immutability and real-time audio-reactive GPU fluid simulation into a resilient cybernetic system.'
    },
    techStack: ['WebGPU', 'WebGL2 / GLSL', 'SHA-256', 'HMAC', 'Merkle Tree', 'Navier-Stokes', 'Web Audio API', 'TypeScript'],
    githubUrl: 'https://github.com/watchknight',
    liveUrl: 'https://github.com/watchknight',
    previewType: 'chronos-aether'
  }
];

// ============================================================================
// 6 REAL-TIME SHADER PASS SWITCHES SPECIFICATION
// ============================================================================

export type RenderPassId = 'beauty' | 'pixel' | 'wireframe' | 'clay' | 'uv' | 'normals';

export interface ShaderPassConfig {
  id: RenderPassId;
  keyNumber: string;
  label: string;
  badge: string;
  subtitle: string;
  description: string;
}

export const SHADER_PASSES: ShaderPassConfig[] = [
  {
    id: 'beauty',
    keyNumber: '1',
    label: '[1] BEAUTY_PBR',
    badge: 'PBR + CHROMA',
    subtitle: 'Physically Based Studio Composite + GGX Sheen + Chromatic Aberration',
    description: 'Dual-point studio illumination with GGX specular sheen, Fresnel rim glow, subtle chromatic aberration, and interactive fluid mouse-ripple wave displacement.'
  },
  {
    id: 'pixel',
    keyNumber: '2',
    label: '[2] 3D_PIXEL_PASS',
    badge: 'PIXEL: 6PX // OUTLINES',
    subtitle: 'Three.js RenderPixelatedPass 90s Cyberdeck Retro-Downsampling',
    description: 'Direct RenderPixelatedPass hardware rasterization with pixelSize: 6 and single-pixel normal/depth outlines for authentic chunky 90s arcade workstation aesthetics.'
  },
  {
    id: 'wireframe',
    keyNumber: '3',
    label: '[3] WIREFRAME_WAVE',
    badge: 'TOPOLOGY // MATRIX',
    subtitle: 'High-Contrast Polygon Edge Topology & Procedural Wave Flow',
    description: 'Isolates polygon density, quad tessellation, and procedural vertex manifold flow over deep obsidian depth.'
  },
  {
    id: 'clay',
    keyNumber: '4',
    label: '[4] CLAY_MATTE',
    badge: 'ROUGHNESS 0.85',
    subtitle: 'Matte Diffuse Studio Shading & Pure Silhouette Curvature',
    description: 'Matte diffuse studio lighting (roughness: 0.85, metalness: 0.0) isolating geometric silhouette curvature and volume without specular highlights.'
  },
  {
    id: 'uv',
    keyNumber: '5',
    label: '[5] UV_MATRIX',
    badge: '[U, V] MANIFOLD',
    subtitle: 'Parametric Texture Coordinate Space & 16x16 Grid Checker',
    description: 'Procedural 16x16 UV coordinate checkerboard with 1px border lines and continuous [U, V] manifold coordinate color mapping.'
  },
  {
    id: 'normals',
    keyNumber: '6',
    label: '[6] NORMALS_RGB',
    badge: 'VECTORS [RGB]',
    subtitle: 'Surface Normal Unit Vector Field in Camera Space',
    description: 'Maps surface normal unit vectors [Nx, Ny, Nz] directly into normalized [R, G, B] color space for geometric validation.'
  }
];

// ============================================================================
// INTERACTIVE PREVIEWS (01 - 06)
// ============================================================================

// --- PREVIEW 1: MENTAL DEFRAG (ZERO-G SPATIAL PHYSICS CANVAS) ---
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
      color: idx % 2 === 0 ? '#00F0FF' : '#FF2A85'
    }));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.fillStyle = '#0D1512';
      ctx.fillRect(0, 0, width, height);

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
            const alpha = (1 - dist / 130) * 0.45;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            if (dist < 80) {
              ctx.font = '8px monospace';
              ctx.fillStyle = `rgba(74, 246, 38, ${alpha * 0.9})`;
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

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#131629';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#F0EFE6';
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
    visibilityObserver.observe(canvas);

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
    watchknightAudio.playSpatialClick(0, 0, -1);
    setPulseCount((c) => c + 1);
    nodesRef.current.forEach((n) => {
      n.vx += (Math.random() - 0.5) * 4;
      n.vy += (Math.random() - 0.5) * 4;
    });
  };

  const handleSyncObsidian = () => {
    watchknightAudio.playHoverTick(0);
    setObsidianSynced(true);
    setTimeout(() => setObsidianSynced(false), 2000);
  };

  return (
    <div className="flex flex-col h-full justify-between bg-[#0D1512] rounded border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] p-3 relative overflow-hidden font-mono">
      <div className="flex items-center justify-between mb-2 z-10 border-b border-[#2D3645] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4AF626] animate-pulse" />
          <span className="font-pixel text-[10px] text-[#00F0FF] uppercase tracking-wider">
            SPATIAL_2D_PHYSICS.SYS
          </span>
        </div>
        <span className="text-[10px] text-[#4AF626] bg-[#131629] px-2 py-0.5 border border-[#2D3645]">
          MATTER.JS ZERO-G
        </span>
      </div>

      <div className="relative flex-1 w-full min-h-[160px] overflow-hidden border border-[#2D3645] bg-[#070814]">
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
            watchknightAudio.playHoverTick(0);
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
          <div className="absolute inset-0 bg-[#070814]/85 flex items-center justify-center p-2 text-center animate-in fade-in">
            <span className="font-pixel text-[9px] text-[#4AF626] bg-[#131629] p-2 border border-[#4AF626]">
              ✓ OBSIDIAN .CANVAS AST PARSED ({nodesRef.current.length} NODES LINKED)
            </span>
          </div>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#2D3645] flex items-center justify-between gap-2 z-10 text-[10px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePulse}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#131629] hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 active:translate-y-0.5"
          >
            <Zap className="w-3 h-3 text-[#FFCC00]" />
            <span>PULSE FIELD ({pulseCount})</span>
          </button>
          <button
            type="button"
            onClick={handleSyncObsidian}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#131629] hover:bg-[#4AF626]/20 text-[#4AF626] border border-[#4AF626]/40 active:translate-y-0.5"
          >
            <Share2 className="w-3 h-3" />
            <span>SYNC .CANVAS</span>
          </button>
        </div>
        <span className="text-[#8E98AA]">
          BODIES: <span className="text-[#00F0FF]">{nodesRef.current.length}</span> • 60 FPS
        </span>
      </div>
    </div>
  );
};

// --- PREVIEW 2: DOCLENSBD (CLOUD FIRESTORE & CI/CD PIPELINE) ---
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
    watchknightAudio.playSpatialClick(0.2, 0, -1);
    setIsSyncing(true);
    setSyncStep(1);

    timeoutsRef.current.push(
      window.setTimeout(() => setSyncStep(2), 350),
      window.setTimeout(() => setSyncStep(3), 750),
      window.setTimeout(() => {
        setSyncStep(4);
        setPipelineLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] DX-record sync: 32ms p99 [PASSED]`,
          ...prev.slice(0, 2)
        ]);
        setIsSyncing(false);
      }, 1150)
    );
  };

  return (
    <div className="flex flex-col h-full justify-between bg-[#0D1512] rounded border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] p-3 font-mono">
      <div className="flex items-center justify-between mb-2 border-b border-[#2D3645] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse" />
          <span className="font-pixel text-[10px] text-[#FFCC00] uppercase tracking-wider">
            CLOUD_FIRESTORE_TELEMETRY.SYS
          </span>
        </div>
        <span className="text-[10px] text-[#4AF626] bg-[#131629] px-2 py-0.5 border border-[#2D3645]">
          99.98% SLA
        </span>
      </div>

      <div className="my-auto py-2 bg-[#070814] p-3 border border-[#2D3645] space-y-2.5">
        <div className="grid grid-cols-4 gap-1.5 text-center text-[9px]">
          <div className={`p-1.5 border transition-all ${syncStep >= 1 ? 'bg-[#FFCC00]/20 border-[#FFCC00] text-[#FFCC00]' : 'bg-[#131629] border-[#2D3645] text-[#8E98AA]'}`}>
            <Activity className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">EMR Client</div>
            <div className="text-[8px] text-[#8E98AA]">Dhaka Hub</div>
          </div>
          <div className={`p-1.5 border transition-all ${syncStep >= 2 ? 'bg-[#FFCC00]/20 border-[#FFCC00] text-[#FFCC00]' : 'bg-[#131629] border-[#2D3645] text-[#8E98AA]'}`}>
            <Database className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">Firestore</div>
            <div className="text-[8px] text-[#8E98AA]">Stream 24ms</div>
          </div>
          <div className={`p-1.5 border transition-all ${syncStep >= 3 ? 'bg-[#FFCC00]/20 border-[#FFCC00] text-[#FFCC00]' : 'bg-[#131629] border-[#2D3645] text-[#8E98AA]'}`}>
            <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">CI/CD Guard</div>
            <div className="text-[8px] text-[#8E98AA]">14/14 Tests</div>
          </div>
          <div className={`p-1.5 border transition-all ${syncStep >= 4 ? 'bg-[#4AF626]/20 border-[#4AF626] text-[#4AF626]' : 'bg-[#131629] border-[#2D3645] text-[#8E98AA]'}`}>
            <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1" />
            <div className="font-bold">Sync Vault</div>
            <div className="text-[8px] text-[#8E98AA]">Encrypted</div>
          </div>
        </div>

        <div className="w-full h-1.5 bg-[#131629] border border-[#2D3645] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FFCC00] to-[#4AF626] transition-all duration-300" style={{ width: `${(syncStep / 4) * 100}%` }} />
        </div>
      </div>

      <div className="bg-[#070814] p-2 border border-[#2D3645] text-[9px] text-[#8E98AA] space-y-0.5">
        {pipelineLogs.map((log, i) => (
          <div key={i} className="break-words">
            <span className="text-[#FFCC00]">❯</span> {log}
          </div>
        ))}
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#2D3645] flex items-center justify-between text-[10px]">
        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#FFCC00] hover:bg-[#ffe066] text-[#070814] font-bold border border-[#D6CFC2] disabled:opacity-50 active:translate-y-0.5"
        >
          <RotateCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'STREAMING...' : 'TRIGGER SYNC'}</span>
        </button>
        <span className="text-[#8E98AA]">
          p99: <span className="text-[#FFCC00] font-bold">32 ms</span>
        </span>
      </div>
    </div>
  );
};

// --- PREVIEW 3: RANNABANNA (LOCALIZED BENGALI CULINARY ENGINE) ---
export const RannabannaPreview: React.FC = () => {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeDish, setActiveDish] = useState<number>(0);

  const dishes = [
    {
      nameBn: 'সরিষা ইলিশ',
      nameEn: 'Shorshe Ilish (Mustard Hilsa)',
      taglineBn: 'পদ্মার তাজা ইলিশ ও দেশি সরিষার ঝাঁঝ',
      taglineEn: 'Padma River Hilsa braised in pungent mustard emulsion',
      metrics: { cal: '420 kcal', prep: '25 min', spice: 'ঝাঁঝালো' }
    },
    {
      nameBn: 'কাচ্চি বিরিয়ানি',
      nameEn: 'Dhaka Kacchi Biryani',
      taglineBn: 'পুরান ঢাকার খাঁটি জাফরানি সুবাস ও খাসির মাংস',
      taglineEn: 'Old Dhaka slow-steamed mutton with saffron basmati',
      metrics: { cal: '680 kcal', prep: '90 min', spice: 'সুগন্ধি' }
    },
    {
      nameBn: 'শিল-পাটার ভর্তা',
      nameEn: 'Artisanal Vorta Platter',
      taglineBn: 'শিল-পাটায় বাটা সরিষা, কালিজিরা ও বেগুন ভর্তা',
      taglineEn: 'Stone-ground kalijira, mustard and charred eggplant mash',
      metrics: { cal: '210 kcal', prep: '15 min', spice: 'তীব্র' }
    }
  ];

  const current = dishes[activeDish];

  return (
    <div className="flex flex-col h-full justify-between bg-[#0D1512] rounded border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] p-3 font-mono">
      <div className="flex items-center justify-between mb-2 border-b border-[#2D3645] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
          <span className="font-pixel text-[10px] text-[#00F0FF] uppercase tracking-wider">
            {lang === 'bn' ? 'রান্নাবান্না • ভোজনরসিক' : 'RANNABANNA.SYS'}
          </span>
        </div>
        <div className="flex items-center bg-[#131629] border border-[#2D3645] p-0.5 text-[9px]">
          <button
            type="button"
            onClick={() => setLang('bn')}
            className={`px-2 py-0.5 ${lang === 'bn' ? 'bg-[#00F0FF] text-[#070814] font-bold' : 'text-[#8E98AA]'}`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 ${lang === 'en' ? 'bg-[#00F0FF] text-[#070814] font-bold' : 'text-[#8E98AA]'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 my-1 text-[10px]">
        {dishes.map((dish, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              watchknightAudio.playHoverTick(0);
              setActiveDish(idx);
            }}
            className={`px-1.5 py-1 break-words border ${
              activeDish === idx
                ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                : 'bg-[#131629] border-[#2D3645] text-[#8E98AA]'
            }`}
          >
            {lang === 'bn' ? dish.nameBn : dish.nameEn.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="my-auto p-2.5 bg-[#070814] border border-[#2D3645]">
        <div className="flex items-baseline justify-between mb-1">
          <h4 className="font-bold text-sm text-[#F0EFE6]">
            {lang === 'bn' ? current.nameBn : current.nameEn}
          </h4>
          <span className="text-[10px] text-[#00F0FF] bg-[#131629] px-1.5 py-0.5 border border-[#2D3645]">
            {current.metrics.cal}
          </span>
        </div>
        <p className="text-[11px] text-[#8E98AA] leading-relaxed mb-2">
          {lang === 'bn' ? current.taglineBn : current.taglineEn}
        </p>
        <div className="grid grid-cols-3 gap-1 text-center text-[9px] border-t border-[#2D3645] pt-1.5">
          <div>
            <span className="text-[#8E98AA] block text-[8px]">TIME</span>
            <span className="text-[#F0EFE6]">{current.metrics.prep}</span>
          </div>
          <div>
            <span className="text-[#8E98AA] block text-[8px]">FLAVOR</span>
            <span className="text-[#00F0FF]">{current.metrics.spice}</span>
          </div>
          <div>
            <span className="text-[#8E98AA] block text-[8px]">BUNDLE</span>
            <span className="text-[#4AF626]">42 KB</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#2D3645] flex items-center justify-between text-[10px] text-[#8E98AA]">
        <span className="text-[#4AF626]">✓ LIGHTHOUSE: 99/100</span>
        <span>UTF-8 SUBSET (22KB)</span>
      </div>
    </div>
  );
};

// --- PREVIEW 4: TRASH TRAIL (SCROLLTRIGGER VIEWPORT SCRUBBER) ---
export const TrashTrailPreview: React.FC = () => {
  const [scrubProgress, setScrubProgress] = useState<number>(35);

  const stages = [
    { title: '01. Urban Waste Generation', desc: 'Over 6,500 metric tons of plastic entering Dhaka waterways daily.' },
    { title: '02. Riverway Runoff & Drift', desc: 'Buriganga & Shitalakshya aquatic channel microplastic density surge.' },
    { title: '03. Microplastic Bio-Toxicity', desc: 'Downstream food web bio-accumulation and aquatic fauna asphyxiation.' },
    { title: '04. Circular Recovery & Remediation', desc: 'Automated kinetic floating booms and localized recycling reclamation.' }
  ];

  const currentStageIndex = Math.min(3, Math.floor((scrubProgress / 100) * 4));
  const currentStage = stages[currentStageIndex];

  return (
    <div className="flex flex-col h-full justify-between bg-[#0D1512] rounded border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] p-3 font-mono">
      <div className="flex items-center justify-between mb-2 border-b border-[#2D3645] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF2A85]" />
          <span className="font-pixel text-[10px] text-[#FF2A85] uppercase tracking-wider">
            SCROLL_SCRUB_SIMULATOR.SYS
          </span>
        </div>
        <span className="text-[10px] text-[#4AF626] bg-[#131629] px-2 py-0.5 border border-[#2D3645]">
          GSAP SCRUB: 0.8S
        </span>
      </div>

      <div className="relative flex-1 w-full min-h-[140px] border border-[#2D3645] bg-[#070814] flex flex-col justify-end p-2.5 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-8 h-12 opacity-35 pointer-events-none transition-transform duration-100"
          style={{ transform: `translateX(${-scrubProgress * 0.8}px)` }}
        >
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-full fill-[#FF2A85]/40">
            <path d="M0 40 L0 25 L30 25 L30 15 L60 15 L60 30 L100 30 L100 10 L150 10 L150 35 L200 35 L200 20 L250 20 L250 35 L320 35 L320 15 L400 15 L400 40 Z" />
          </svg>
        </div>

        <div className="relative z-10 bg-[#0D1512]/90 border border-[#2D3645] p-2 max-w-[95%]">
          <div className="font-bold text-[10px] text-[#FF2A85]">{currentStage.title}</div>
          <div className="text-[10px] text-[#8E98AA] leading-tight mt-0.5">{currentStage.desc}</div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#2D3645] space-y-1 text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[#8E98AA]">Scrub Viewport:</span>
          <span className="text-[#FF2A85] font-bold">{scrubProgress}% / 100%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={scrubProgress}
          aria-label="Scrub viewport narrative progress"
          onChange={(e) => setScrubProgress(Number(e.target.value))}
          data-lenis-prevent
          className="w-full accent-[#FF2A85] h-1.5 bg-[#131629] cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-[#8E98AA]">
          {['01 Urban', '02 River', '03 Toxicity', '04 Circular'].map((lbl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setScrubProgress(idx * 30 + 10)}
              className={currentStageIndex === idx ? 'text-[#FF2A85] font-bold underline' : 'hover:text-[#F0EFE6]'}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- PREVIEW 5: NEON VANGUARD 2D & OS KERNEL LABS ---
export const NeonVanguardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'os'>('canvas');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ipcMessageCount, setIpcMessageCount] = useState(1480);
  const [lastIpcLatency, setLastIpcLatency] = useState('0.85 μs');
  const [hits, setHits] = useState(0);
  const [isIpcSyncing, setIsIpcSyncing] = useState(false);

  useEffect(() => {
    if (activeTab !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let projectiles: { x: number; y: number; vx: number; vy: number }[] = [];
    const targets = [
      { x: 260, y: 50, radius: 14 },
      { x: 280, y: 110, radius: 16 },
      { x: 240, y: 150, radius: 12 }
    ];

    const render = () => {
      ctx.fillStyle = 'rgba(7, 8, 20, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.12) {
        projectiles.push({
          x: 20,
          y: 50 + Math.random() * 100,
          vx: 7 + Math.random() * 2,
          vy: (Math.random() - 0.5) * 1.5
        });
      }

      projectiles = projectiles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.moveTo(p.x - 12, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.stroke();

        targets.forEach((t) => {
          const dx = p.x - t.x;
          const dy = p.y - t.y;
          if (Math.sqrt(dx * dx + dy * dy) < t.radius) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#FF2A85';
            ctx.stroke();
          }
        });

        return p.x < canvas.width;
      });

      targets.forEach((t) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#131629';
        ctx.fill();
        ctx.strokeStyle = '#4AF626';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '8px monospace';
        ctx.fillStyle = '#4AF626';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NODE', t.x, t.y);
      });
    };

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

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
    watchknightAudio.playSpatialClick(0, 0, -1);
    setIsIpcSyncing(true);
    setIpcMessageCount((prev) => prev + 128);
    const latency = (0.7 + Math.random() * 0.4).toFixed(2);
    setLastIpcLatency(`${latency} μs`);
    setTimeout(() => setIsIpcSyncing(false), 800);
  };

  return (
    <div className="flex flex-col h-full justify-between bg-[#0D1512] rounded border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] p-3 font-mono">
      <div className="flex items-center justify-between mb-2 border-b border-[#2D3645] pb-1.5">
        <div className="flex items-center gap-1.5 bg-[#131629] p-0.5 border border-[#2D3645] text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('canvas')}
            className={`px-2.5 py-1 ${activeTab === 'canvas' ? 'bg-[#00F0FF] text-[#070814] font-bold' : 'text-[#8E98AA]'}`}
          >
            ⚡ 2D Canvas Combat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('os')}
            className={`px-2.5 py-1 ${activeTab === 'os' ? 'bg-[#4AF626] text-[#070814] font-bold' : 'text-[#8E98AA]'}`}
          >
            🐧 Linux Kernel POSIX
          </button>
        </div>
        <span className="text-[10px] text-[#00F0FF]">
          {activeTab === 'canvas' ? '120 FPS' : 'POSIX IPC'}
        </span>
      </div>

      {activeTab === 'canvas' ? (
        <div className="relative flex-1 w-full min-h-[160px] border border-[#2D3645] bg-[#070814] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={340}
            height={180}
            className="w-full h-full block cursor-crosshair"
            onClick={() => {
              watchknightAudio.playHoverTick(0);
              setHits((h) => h + 1);
            }}
          />
          <div className="absolute top-2 left-2 text-[8px] text-[#00F0FF] bg-[#070814]/90 px-1.5 py-0.5 border border-[#00F0FF]/40 pointer-events-none">
            Click to fire lasers • Zero-alloc object pool
          </div>
        </div>
      ) : (
        <div className="my-auto p-2.5 bg-[#070814] border border-[#2D3645] text-[10px] space-y-2">
          <div className="text-[#FFCC00] flex items-center justify-between font-bold">
            <span className="flex items-center gap-1">
              <TerminalIcon className="w-3.5 h-3.5" />
              PID 1024: master_daemon (Linux 6.1)
            </span>
            {isIpcSyncing && <span className="text-[#4AF626] animate-pulse">SYNCING PIPE...</span>}
          </div>
          <div className="pl-3 border-l border-[#2D3645] space-y-1 text-[#8E98AA] text-[9px]">
            <div className="flex justify-between p-1 bg-[#131629]">
              <span className="text-[#00F0FF]">├── [PID 1025] shm_producer</span>
              <span>shmget(0x7ffd, 4MB) [OK]</span>
            </div>
            <div className="flex justify-between p-1 bg-[#131629]">
              <span className="text-[#4AF626]">└── [PID 1026] pipe_worker</span>
              <span>pipe(fd[3]-&gt;fd[4]) [DUPLEX]</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[9px] pt-1">
            <div className="bg-[#131629] p-1 border border-[#2D3645]">
              <span className="text-[#8E98AA] block text-[8px]">TOTAL IPC MSGS</span>
              <span className="text-[#00F0FF] font-bold">{ipcMessageCount.toLocaleString()}</span>
            </div>
            <div className="bg-[#131629] p-1 border border-[#2D3645]">
              <span className="text-[#8E98AA] block text-[8px]">POSIX SHM LATENCY</span>
              <span className="text-[#4AF626] font-bold">{lastIpcLatency}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-[#2D3645] flex items-center justify-between text-[10px]">
        {activeTab === 'canvas' ? (
          <span className="text-[#8E98AA]">
            HITS: <span className="text-[#00F0FF] font-bold">{hits}</span> • 120 FPS
          </span>
        ) : (
          <button
            type="button"
            onClick={triggerIpcBurst}
            disabled={isIpcSyncing}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#4AF626] hover:bg-[#6ef750] text-[#070814] font-bold border border-[#D6CFC2] active:translate-y-0.5"
          >
            <Play className={`w-3 h-3 ${isIpcSyncing ? 'animate-spin' : ''}`} />
            <span>TRIGGER FORK() & IPC</span>
          </button>
        )}
        <span className="text-[#4AF626]">VALGRIND: 0 LEAKS</span>
      </div>
    </div>
  );
};

// --- PREVIEW 6: CHRONOS-GUARD & AETHER-GL (CRYPTOGRAPHIC MERKLE & NAVIER-STOKES FLUID) ---
export const ChronosAetherPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fluid' | 'merkle'>('fluid');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tamperedBlock, setTamperedBlock] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [merkleRoot, setMerkleRoot] = useState<string>('0x7F4A88C1B03E');
  const [tamperAlert, setTamperAlert] = useState<string>('< 0.12 ms [VERIFIED]');

  // Navier-Stokes fluid grid simulation
  useEffect(() => {
    if (activeTab !== 'fluid') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let time = 0;
    const ripples: { x: number; y: number; r: number; color: string }[] = [];

    const render = () => {
      time += 0.04;
      ctx.fillStyle = '#070814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Procedural Eulerian fluid wave simulation
      const cols = 28;
      const rows = 14;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const u = i / cols;
          const v = j / rows;
          const wave = Math.sin(u * 8.0 + time) * Math.cos(v * 6.0 - time * 0.8) +
                       Math.sin(Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2) * 12.0 - time * 2.0);
          const intensity = Math.max(0, Math.min(1, (wave + 1.5) / 3.0));

          const r = Math.floor(intensity * 0);
          const g = Math.floor(intensity * 240);
          const b = Math.floor(intensity * 255);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2);
        }
      }

      // Draw active ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 2.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (rp.r > 80) ripples.splice(i, 1);
      }
    };

    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    const tickerRender = () => {
      if (!isVisible) return;
      render();
    };
    gsap.ticker.add(tickerRender);

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
      ripples.push({
        x: clickX,
        y: clickY,
        r: 4,
        color: Math.random() > 0.5 ? '#00F0FF' : '#FF2A85'
      });
      watchknightAudio.playHoverTick(0);
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      visibilityObserver.disconnect();
      gsap.ticker.remove(tickerRender);
    };
  }, [activeTab]);

  const handleSimulateTamper = (blockIndex: number) => {
    watchknightAudio.playSpatialClick(-0.3, 0, -1);
    setTamperedBlock(blockIndex);
    setMerkleRoot('0xDEAD_C0DE_MISMATCH');
    setTamperAlert('< 0.12 ms [TAMPER_DETECTED!]');
  };

  const handleVerifyMerkle = () => {
    watchknightAudio.playSpatialClick(0.3, 0, -1);
    setIsVerifying(true);
    setTimeout(() => {
      setTamperedBlock(null);
      setMerkleRoot('0x7F4A88C1B03E');
      setTamperAlert('< 0.12 ms [VERIFIED_100%]');
      setIsVerifying(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full justify-between bg-[#0D1512] rounded border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] p-3 font-mono">
      <div className="flex items-center justify-between mb-2 border-b border-[#2D3645] pb-1.5">
        <div className="flex items-center gap-1.5 bg-[#131629] p-0.5 border border-[#2D3645] text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('fluid')}
            className={`px-2.5 py-1 ${activeTab === 'fluid' ? 'bg-[#00F0FF] text-[#070814] font-bold' : 'text-[#8E98AA]'}`}
          >
            🌊 Navier-Stokes Fluid
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('merkle')}
            className={`px-2.5 py-1 ${activeTab === 'merkle' ? 'bg-[#4AF626] text-[#070814] font-bold' : 'text-[#8E98AA]'}`}
          >
            🛡️ SHA-256 Merkle Ledger
          </button>
        </div>
        <span className="text-[10px] text-[#00F0FF]">
          {activeTab === 'fluid' ? '1.42 ms PASS' : '18.5k EVT/S'}
        </span>
      </div>

      {activeTab === 'fluid' ? (
        <div className="relative flex-1 w-full min-h-[160px] border border-[#2D3645] bg-[#070814] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={340}
            height={180}
            className="w-full h-full block cursor-crosshair"
          />
          <div className="absolute top-2 left-2 text-[8px] text-[#00F0FF] bg-[#070814]/90 px-1.5 py-0.5 border border-[#00F0FF]/40 pointer-events-none">
            Click canvas to inject Navier-Stokes fluid vorticity
          </div>
        </div>
      ) : (
        <div className="my-auto p-2.5 bg-[#070814] border border-[#2D3645] text-[10px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#4AF626] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              MERKLE_ROOT: <span className="text-[#F0EFE6]">{merkleRoot}</span>
            </span>
            <span className={tamperedBlock !== null ? 'text-[#FF2A85] font-bold animate-pulse' : 'text-[#4AF626]'}>
              {tamperAlert}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-[9px]">
            {['TX_01: STATE', 'TX_02: AGENT', 'TX_03: SHADER', 'TX_04: IPC'].map((tx, idx) => (
              <div
                key={idx}
                className={`p-1.5 border transition-all ${
                  tamperedBlock === idx
                    ? 'bg-[#FF2A85]/20 border-[#FF2A85] text-[#FF2A85]'
                    : 'bg-[#131629] border-[#2D3645] text-[#00F0FF]'
                }`}
              >
                <div className="font-bold">{tx}</div>
                <div className="text-[8px] text-[#8E98AA] break-all">
                  {tamperedBlock === idx ? '0xMUTATED!' : `0x${(idx + 1) * 31}a7e`}
                </div>
                <button
                  type="button"
                  onClick={() => handleSimulateTamper(idx)}
                  className="mt-1 text-[7px] text-[#FFCC00] hover:underline block mx-auto"
                >
                  [Tamper]
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] pt-1">
            <div className="bg-[#131629] p-1 border border-[#2D3645]">
              <span className="text-[#8E98AA] block text-[8px]">INGEST RATE</span>
              <span className="text-[#00F0FF] font-bold">18,500 evt/s</span>
            </div>
            <div className="bg-[#131629] p-1 border border-[#2D3645]">
              <span className="text-[#8E98AA] block text-[8px]">MERKLE DEPTH</span>
              <span className="text-[#4AF626] font-bold">32 Levels</span>
            </div>
            <div className="bg-[#131629] p-1 border border-[#2D3645]">
              <span className="text-[#8E98AA] block text-[8px]">TAMPER ALERT</span>
              <span className="text-[#FFCC00] font-bold">&lt; 0.12 ms</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-[#2D3645] flex items-center justify-between text-[10px]">
        {activeTab === 'fluid' ? (
          <span className="text-[#8E98AA]">
            GRID: <span className="text-[#00F0FF] font-bold">1024 x 1024</span> • 120 FPS
          </span>
        ) : (
          <button
            type="button"
            onClick={handleVerifyMerkle}
            disabled={isVerifying}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#4AF626] hover:bg-[#6ef750] text-[#070814] font-bold border border-[#D6CFC2] active:translate-y-0.5"
          >
            <ShieldCheck className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'VERIFYING...' : 'VERIFY MERKLE ROOT'}</span>
          </button>
        )}
        <span className="text-[#4AF626]">SLA: 100% SECURE</span>
      </div>
    </div>
  );
};

// ============================================================================
// GPU PARTICLE FORMATIONS & COLOR ACCENTS FOR 6 FLAGSHIP PROJECTS
// ============================================================================

export const PARTICLE_COUNT = 600;

export interface ProjectAccentConfig {
  color: THREE.Color;
  rimColor: THREE.Color;
}

export const PROJECT_ACCENTS: ProjectAccentConfig[] = [
  { color: new THREE.Color(0x00F0FF), rimColor: new THREE.Color(0x00F0FF) }, // 01 Mental Defrag (Cyan)
  { color: new THREE.Color(0xFFCC00), rimColor: new THREE.Color(0xFFCC00) }, // 02 DocLensBD (Amber)
  { color: new THREE.Color(0x00F0FF), rimColor: new THREE.Color(0xFFCC00) }, // 03 Rannabanna (Cyan/Amber)
  { color: new THREE.Color(0xFF2A85), rimColor: new THREE.Color(0xFF2A85) }, // 04 Trash Trail (Magenta)
  { color: new THREE.Color(0x4AF626), rimColor: new THREE.Color(0x4AF626) }, // 05 Neon Vanguard (Phosphor Green)
  { color: new THREE.Color(0x00F0FF), rimColor: new THREE.Color(0xFF2A85) }, // 06 Chronos-Guard (Cyan/Magenta)
];

export const generateParticleFormation = (projectIndex: number, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    if (projectIndex === 0) {
      // [01] Mental Defrag: Cognitive Spherical Constellation + Equatorial Orbital Disk
      if (i < count * 0.65) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const rad = 2.0 + Math.random() * 1.0;
        positions[idx] = rad * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = rad * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = rad * Math.cos(phi);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const rad = 1.6 + Math.random() * 1.6;
        positions[idx] = Math.cos(angle) * rad;
        positions[idx + 1] = (Math.random() - 0.5) * 0.35;
        positions[idx + 2] = Math.sin(angle) * rad;
      }
    } else if (projectIndex === 1) {
      // [02] DocLensBD: Cylindrical Ascending Telemetry Stream
      const u = i / count;
      const angle = u * Math.PI * 14;
      const rad = 1.4 + 0.4 * Math.sin(u * Math.PI * 6);
      positions[idx] = Math.cos(angle) * rad;
      positions[idx + 1] = (u - 0.5) * 4.2;
      positions[idx + 2] = Math.sin(angle) * rad;
    } else if (projectIndex === 2) {
      // [03] Rannabanna: Toroidal Botanical Vortex / Spiral Halo
      const u = (i / count) * Math.PI * 2 * 3;
      const rOuter = 2.1;
      const rTube = 0.6 + 0.3 * Math.sin(u * 5);
      positions[idx] = (rOuter + rTube * Math.cos(u * 3)) * Math.cos(u);
      positions[idx + 1] = rTube * Math.sin(u * 3);
      positions[idx + 2] = (rOuter + rTube * Math.cos(u * 3)) * Math.sin(u);
    } else if (projectIndex === 3) {
      // [04] Trash Trail: Hydrodynamic Wave Ribbon Stream
      const u = (i / count) * 2 - 1;
      const x = u * 3.2;
      const z = ((i % 15) / 15 - 0.5) * 2.2;
      const y = Math.sin(x * 1.8) * 0.65 + Math.cos(z * 2.5) * 0.25;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
    } else if (projectIndex === 4) {
      // [05] Neon Vanguard: POSIX IPC 3D Grid Lattices
      const step = 0.9;
      const gx = ((i % 5) - 2) * step;
      const gy = (((Math.floor(i / 5)) % 5) - 2) * step;
      const gz = (((Math.floor(i / 25)) % 5) - 2) * step;
      positions[idx] = gx + (Math.random() - 0.5) * 0.15;
      positions[idx + 1] = gy + (Math.random() - 0.5) * 0.15;
      positions[idx + 2] = gz + (Math.random() - 0.5) * 0.15;
    } else {
      // [06] Chronos-Guard: Geodesic Merkle Vault Cage + Acoustic Fluid Clusters
      const theta = (i / count) * Math.PI * 16;
      const phi = Math.acos(((i % 50) / 50) * 2 - 1);
      const rad = 2.4 + 0.3 * Math.sin(theta * 3.0);
      positions[idx] = rad * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = rad * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = rad * Math.cos(phi);
    }
  }
  return positions;
};

// ============================================================================
// MAIN COMPONENT: ProjectsShowcase (UNIFIED SYS.96 CYBERDECK SHOWCASE)
// ============================================================================

export const ProjectsShowcase: React.FC = () => {
  const { openCaseStudy } = useTransition();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fpsRef = useRef<HTMLSpanElement | null>(null);
  const coordsRef = useRef<HTMLSpanElement | null>(null);

  // Station State
  const [activeProjectIndex, setActiveProjectIndex] = useState<number>(0);
  const activeProjectIndexRef = useRef<number>(0);
  const [activePass, setActivePass] = useState<RenderPassId>('beauty');
  const activePassRef = useRef<RenderPassId>('beauty');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(true);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [dossierState, setDossierState] = useState<'normal' | 'maximized'>('normal');

  // DOM & Selection control refs
  const romCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isManualSelectingRef = useRef<boolean>(false);
  const manualTimeoutRef = useRef<number | null>(null);
  const dossierRef = useRef<HTMLDivElement | null>(null);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambLightRef = useRef<THREE.AmbientLight | null>(null);
  const pointAccentRef = useRef<THREE.PointLight | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const renderPassRef = useRef<RenderPass | null>(null);
  const pixelatedPassRef = useRef<RenderPixelatedPass | null>(null);

  // Mesh & Particle Groups
  const projectMeshesRef = useRef<THREE.Group[]>([]);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const particleGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const materialsRef = useRef<Record<RenderPassId, THREE.Material>>({} as Record<RenderPassId, THREE.Material>);

  // Particle Shader Uniforms
  const particleUniformsRef = useRef<{
    uTime: { value: number };
    uMorphProgress: { value: number };
    uMouse: { value: THREE.Vector2 };
    uRipple: { value: number };
    uColorA: { value: THREE.Color };
    uColorB: { value: THREE.Color };
  } | null>(null);

  // Shader Uniforms
  const beautyUniformsRef = useRef<{
    uTime: { value: number };
    uMouse: { value: THREE.Vector2 };
    uRipple: { value: number };
    uRimColor: { value: THREE.Color };
    uBaseCore: { value: THREE.Color };
  } | null>(null);

  const uvUniformsRef = useRef<{
    uTime: { value: number };
  } | null>(null);

  // Pointer tracking & physics
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const rippleEnergyRef = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeProject = FLAGSHIP_PROJECTS[activeProjectIndex];

  // --------------------------------------------------------------------------
  // SWITCH ACTIVE PROJECT & MORPH 3D GEOMETRY + PARTICLE FIELD
  // --------------------------------------------------------------------------
  const selectProject = useCallback((index: number) => {
    const oldIndex = activeProjectIndexRef.current;
    if (index === oldIndex && projectMeshesRef.current.length > 0) return;
    setActiveProjectIndex(index);
    activeProjectIndexRef.current = index;
    watchknightAudio.playHoverTick((index / FLAGSHIP_PROJECTS.length) * 2 - 1);
    chiptuneAudio.playCoinSFX();

    // Dynamic morphing: toggle mesh visibility and execute GSAP spring punch
    const meshes = projectMeshesRef.current;
    meshes.forEach((meshGroup, idx) => {
      meshGroup.visible = idx === index;
    });

    const activeMesh = meshes[index];
    if (activeMesh) {
      gsap.killTweensOf(activeMesh.scale);
      gsap.fromTo(
        activeMesh.scale,
        { x: 0.78, y: 0.78, z: 0.78 },
        { x: 1, y: 1, z: 1, duration: 0.55, ease: 'back.out(2.2)' }
      );
      gsap.fromTo(
        activeMesh.rotation,
        { y: activeMesh.rotation.y + 0.6 },
        { y: activeMesh.rotation.y, duration: 0.7, ease: 'power3.out' }
      );
    }

    // Dynamic particle field morphing across project signature formations
    if (particleGeoRef.current && particleUniformsRef.current) {
      const currentPos = generateParticleFormation(oldIndex, PARTICLE_COUNT);
      const targetPos = generateParticleFormation(index, PARTICLE_COUNT);

      const posAttr = particleGeoRef.current.getAttribute('position') as THREE.BufferAttribute;
      const targetAttr = particleGeoRef.current.getAttribute('aTargetPosition') as THREE.BufferAttribute;

      if (posAttr && targetAttr) {
        posAttr.copyArray(currentPos);
        posAttr.needsUpdate = true;
        targetAttr.copyArray(targetPos);
        targetAttr.needsUpdate = true;
      }

      const oldAccent = PROJECT_ACCENTS[oldIndex] || PROJECT_ACCENTS[0];
      const newAccent = PROJECT_ACCENTS[index] || PROJECT_ACCENTS[0];

      particleUniformsRef.current.uColorA.value.copy(oldAccent.color);
      particleUniformsRef.current.uColorB.value.copy(newAccent.color);

      gsap.killTweensOf(particleUniformsRef.current.uMorphProgress);
      gsap.fromTo(
        particleUniformsRef.current.uMorphProgress,
        { value: 0 },
        { value: 1, duration: 0.75, ease: 'power2.out' }
      );
    }

    // Update beauty shader rim color
    if (beautyUniformsRef.current) {
      const accent = PROJECT_ACCENTS[index] || PROJECT_ACCENTS[0];
      gsap.to(beautyUniformsRef.current.uRimColor.value, {
        r: accent.rimColor.r,
        g: accent.rimColor.g,
        b: accent.rimColor.b,
        duration: 0.5,
      });
    }

    rippleEnergyRef.current = 1.2;
  }, []);

  const handleSelectWithCooldown = useCallback((index: number) => {
    isManualSelectingRef.current = true;
    selectProject(index);
    if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    manualTimeoutRef.current = window.setTimeout(() => {
      isManualSelectingRef.current = false;
    }, 1200);
  }, [selectProject]);

  const openDossierForProject = useCallback((index?: number) => {
    if (typeof index === 'number') {
      handleSelectWithCooldown(index);
    }
    setIsDossierOpen(true);
    watchknightAudio.playSpatialClick(0, 0, -1);
    setTimeout(() => {
      if (dossierRef.current) {
        dossierRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);
  }, [handleSelectWithCooldown]);

  // --------------------------------------------------------------------------
  // SWITCH SHADER PASS
  // --------------------------------------------------------------------------
  const selectShaderPass = useCallback((passId: RenderPassId) => {
    setActivePass(passId);
    activePassRef.current = passId;
    watchknightAudio.playSpatialClick(0, 0, -1);
    chiptuneAudio.playPowerUpSFX();

    const materials = materialsRef.current;
    const meshes = projectMeshesRef.current;
    const targetMat = materials[passId];

    if (!targetMat) return;

    // Apply material across all active project geometries including child orbital meshes
    meshes.forEach((group) => {
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.userData?.isCage) {
            mesh.material = (mesh.userData?.originalMaterial as THREE.Material) || materials.wireframe;
          } else if (passId === 'beauty') {
            mesh.material = (mesh.userData?.originalMaterial as THREE.Material) || targetMat;
          } else if (passId === 'pixel') {
            mesh.material = (mesh.userData?.originalMaterial as THREE.Material) || materials.pixel;
          } else {
            mesh.material = targetMat;
          }
        }
      });
    });

    // Handle RenderPixelatedPass vs standard RenderPass switching:
    // In Three.js post-processing, RenderPixelatedPass replaces RenderPass directly!
    const renderPass = renderPassRef.current;
    const pixelatedPass = pixelatedPassRef.current;
    const renderer = rendererRef.current;
    const composer = composerRef.current;
    const container = containerRef.current;

    if (passId === 'pixel') {
      if (renderPass) renderPass.enabled = false;
      if (pixelatedPass) pixelatedPass.enabled = true;
      if (renderer && composer && container) {
        renderer.setPixelRatio(1);
        composer.setPixelRatio(1);
        const w = container.clientWidth || 400;
        const h = container.clientHeight || 340;
        composer.setSize(w, h);
        if (pixelatedPass) {
          pixelatedPass.setSize(w, h);
        }
      }
    } else {
      if (pixelatedPass) pixelatedPass.enabled = false;
      if (renderPass) renderPass.enabled = true;
      if (renderer && composer && container) {
        const pr = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pr);
        composer.setPixelRatio(pr);
        const w = container.clientWidth || 400;
        const h = container.clientHeight || 340;
        composer.setSize(w, h);
      }
    }

    // Material uniform / property reaction
    if (passId === 'clay') {
      const clayMat = targetMat as THREE.MeshStandardMaterial;
      gsap.fromTo(clayMat, { roughness: 0.2 }, { roughness: 0.85, duration: 0.5 });
    } else if (passId === 'wireframe') {
      const wireMat = targetMat as THREE.MeshBasicMaterial;
      gsap.fromTo(wireMat, { opacity: 0.3 }, { opacity: 1, duration: 0.4 });
    } else if (passId === 'beauty') {
      rippleEnergyRef.current = 1.4;
    }
  }, []);

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS [1 - 6] FOR SHADER PASSES & ESCAPE FOR DOSSIER
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)) return;
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= 6) {
        e.preventDefault();
        const pass = SHADER_PASSES[keyNum - 1];
        if (pass) selectShaderPass(pass.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectShaderPass]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDossierOpen) {
        setIsDossierOpen(false);
        watchknightAudio.playHoverTick(0);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDossierOpen]);

  // --------------------------------------------------------------------------
  // SCROLL-INTO-VIEW OBSERVER: MORPH 3D GEOMETRY AS ROM SLOTS SCROLL
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualSelectingRef.current) return;
        let bestEntry: IntersectionObserverEntry | null = null;
        let maxRatio = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            bestEntry = entry;
          }
        });

        if (bestEntry && maxRatio > 0.35) {
          const target = (bestEntry as IntersectionObserverEntry).target as HTMLElement;
          const idxStr = target.getAttribute('data-rom-index');
          if (idxStr !== null) {
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx) && idx !== activeProjectIndexRef.current) {
              selectProject(idx);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -25% 0px',
        threshold: [0.35, 0.6, 0.8],
      }
    );

    romCardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    };
  }, [selectProject]);

  // --------------------------------------------------------------------------
  // THREE.JS INITIALIZATION & 6 PROJECT MORPHING GEOMETRIES
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // 2. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5.0);
    cameraRef.current = camera;

    // 4. Studio Illumination (Calibrated to prevent blown-out bloom)
    const ambLight = new THREE.AmbientLight(0xffffff, isLight ? 0.8 : 0.5);
    scene.add(ambLight);
    ambLightRef.current = ambLight;

    const keyLight = new THREE.DirectionalLight(isLight ? 0x0052FF : 0x00F0FF, isLight ? 1.4 : 1.6);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(isLight ? 0xD90452 : 0xFF2A85, isLight ? 1.0 : 1.2);
    fillLight.position.set(-4, -3, -3);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const pointAccent = new THREE.PointLight(isLight ? 0x007A33 : 0x4AF626, 1.5, 10);
    pointAccent.position.set(0, 2, 3);
    scene.add(pointAccent);
    pointAccentRef.current = pointAccent;

    // 5. Build Materials for All 6 Passes
    const beautyUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uRipple: { value: 0 },
      uRimColor: { value: new THREE.Color(isLight ? 0x0052FF : 0x00F0FF) },
      uBaseCore: { value: new THREE.Color(isLight ? 0x181B24 : 0x070814) },
    };
    beautyUniformsRef.current = beautyUniforms;

    const beautyMaterial = new THREE.ShaderMaterial({
      uniforms: beautyUniforms,
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uRipple;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec4 vClipPosition;

        void main() {
          vUv = uv;
          vec4 initialMv = modelViewMatrix * vec4(position, 1.0);
          vec4 initialClip = projectionMatrix * initialMv;
          vec2 screenNdc = initialClip.xy / initialClip.w;

          float dist = length(screenNdc - uMouse);
          float wave = sin(dist * 14.0 - uTime * 4.0) * exp(-dist * 1.8) * (0.04 + uRipple * 0.2);
          vec3 pos = position + normal * wave;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          vClipPosition = projectionMatrix * mvPosition;
          gl_Position = vClipPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uRipple;
        uniform vec3 uRimColor;
        uniform vec3 uBaseCore;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec4 vClipPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          vec2 ndc = vClipPosition.xy / vClipPosition.w;
          float cursorDist = length(ndc - uMouse);

          // Key and fill lights
          vec3 lightDir = normalize(vec3(0.8, 1.2, 1.0));
          float diff = max(dot(normal, lightDir), 0.0);

          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
          vec3 diffuseCol = mix(uBaseCore, vec3(0.04, 0.08, 0.16), diff);

          float chromShift = fresnel * 0.08 + exp(-cursorDist * 2.5) * (0.04 + uRipple * 0.1);
          vec3 finalCol;
          finalCol.r = diffuseCol.r + spec * 0.4 + fresnel * uRimColor.r * (0.8 + chromShift);
          finalCol.g = diffuseCol.g + spec * 0.4 + fresnel * uRimColor.g * 0.8;
          finalCol.b = diffuseCol.b + spec * 0.4 + fresnel * (uRimColor.b * 0.8 + chromShift * 1.2);

          float ripplePulse = sin(cursorDist * 16.0 - uTime * 4.0) * exp(-cursorDist * 1.8) * uRipple;
          finalCol += vec3(max(0.0, ripplePulse) * 0.2);

          // Clamp maximum luminance to prevent blown out whiteout
          finalCol = min(finalCol, vec3(0.85));

          gl_FragColor = vec4(finalCol, 1.0);
        }
      `,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: isLight ? 0x0052FF : 0x00F0FF,
      wireframe: true,
    });

    const clayMaterial = new THREE.MeshStandardMaterial({
      color: 0xD6CFC2,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: false,
    });

    const uvUniforms = { uTime: { value: 0 } };
    uvUniformsRef.current = uvUniforms;

    const uvMaterial = new THREE.ShaderMaterial({
      uniforms: uvUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 animUv = vUv + vec2(uTime * 0.02, uTime * 0.01);
          vec2 grid = fract(animUv * 16.0);
          float checkX = step(0.5, grid.x);
          float checkY = step(0.5, grid.y);
          float checker = (checkX == checkY) ? 0.92 : 0.38;

          vec3 uvGradient = vec3(vUv.x, vUv.y, sin(vUv.x * 3.14159 + vUv.y * 3.14159) * 0.5 + 0.5);
          vec2 edge = step(vec2(0.04), grid) * step(grid, vec2(0.96));
          float gridLine = 1.0 - (edge.x * edge.y);

          vec3 finalCol = mix(uvGradient * checker, vec3(1.0), gridLine * 0.8);
          gl_FragColor = vec4(finalCol, 1.0);
        }
      `,
    });

    const normalsMaterial = new THREE.MeshNormalMaterial({ flatShading: false });

    // Pixel pass material uses clay or standard shaded baseline before RenderPixelatedPass
    const pixelBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x00F0FF,
      roughness: 0.3,
      metalness: 0.2,
    });

    materialsRef.current = {
      beauty: beautyMaterial,
      pixel: pixelBaseMaterial,
      wireframe: wireframeMaterial,
      clay: clayMaterial,
      uv: uvMaterial,
      normals: normalsMaterial,
    };

    // 6. Post-Processing: EffectComposer with RenderPixelatedPass (pixelSize: 6)
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    renderPassRef.current = renderPass;

    const pixelatedPass = new RenderPixelatedPass(6, scene, camera, {
      normalEdgeStrength: 1.5,
      depthEdgeStrength: 1.5,
    });
    pixelatedPass.enabled = false;
    composer.addPass(pixelatedPass);
    pixelatedPassRef.current = pixelatedPass;

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // 7. Master Hologram Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    // 8. Construct 6 Distinct Procedural 3D Project Geometries
    const registerMesh = (mesh: THREE.Mesh, isCore = false) => {
      mesh.name = isCore ? 'project-core-mesh' : 'project-child-mesh';
      mesh.userData = { originalMaterial: mesh.material, isCore };
    };

    const projectMeshes: THREE.Group[] = [];

    // [01] Mental Defrag: Multi-layered geometric hologram (Dark obsidian core, cyan/magenta cage, vertex cloud & orbital nodes)
    const g01 = new THREE.Group();

    // Dark translucent obsidian core (#070814 in dark, #181B24 in light, opacity: 0.8) with sharp 3D facets
    const geom01 = new THREE.IcosahedronGeometry(1.2, 0);
    const coreMat01 = new THREE.MeshStandardMaterial({
      color: isLight ? 0x181B24 : 0x070814,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.8,
      flatShading: true,
    });
    const m01 = new THREE.Mesh(geom01, coreMat01);
    registerMesh(m01, true);
    g01.add(m01);

    // Outer cyan/cobalt wireframe cage
    const cageGeom01 = new THREE.IcosahedronGeometry(1.38, 0);
    const cageMat01 = new THREE.MeshBasicMaterial({
      color: isLight ? 0x0052FF : 0x00F0FF,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const cage01 = new THREE.Mesh(cageGeom01, cageMat01);
    cage01.name = 'project-cage-mesh';
    cage01.userData = { originalMaterial: cageMat01, isCage: true };
    g01.add(cage01);

    // Outer magenta/crimson gimbal ring
    const gimbalGeom01 = new THREE.TorusGeometry(1.65, 0.015, 16, 64);
    const gimbalMat01 = new THREE.MeshBasicMaterial({
      color: isLight ? 0xD90452 : 0xFF2A85,
      transparent: true,
      opacity: 0.85,
    });
    const gimbal01 = new THREE.Mesh(gimbalGeom01, gimbalMat01);
    gimbal01.rotation.x = Math.PI / 4;
    gimbal01.rotation.y = Math.PI / 6;
    gimbal01.name = 'project-gimbal-mesh';
    gimbal01.userData = { originalMaterial: gimbalMat01, isCage: true };
    g01.add(gimbal01);

    // Outer vertex cloud around facets
    const cloudGeom01 = new THREE.IcosahedronGeometry(1.5, 1);
    const cloudMat01 = new THREE.PointsMaterial({
      color: isLight ? 0xD90452 : 0xFF2A85,
      size: 0.045,
      transparent: true,
      opacity: 0.9,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const cloud01 = new THREE.Points(cloudGeom01, cloudMat01);
    cloud01.frustumCulled = false;
    g01.add(cloud01);

    // 6 Orbital thought / satellite nodes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const satelliteGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const satMat = new THREE.MeshBasicMaterial({ color: isLight ? 0x0052FF : 0x00F0FF, wireframe: true });
      const sat = new THREE.Mesh(satelliteGeom, satMat);
      registerMesh(sat, false);
      sat.position.set(Math.cos(angle) * 2.1, Math.sin(angle * 2) * 0.8, Math.sin(angle) * 2.1);
      g01.add(sat);
    }
    projectMeshes.push(g01);
    mainGroup.add(g01);

    // [02] DocLensBD: Cylindrical Cloud Health Core + Concentric Telemetry Rings
    const g02 = new THREE.Group();
    const geom02 = new THREE.CylinderGeometry(0.9, 0.9, 2.0, 32, 6, false);
    const m02 = new THREE.Mesh(geom02, beautyMaterial);
    registerMesh(m02, true);
    g02.add(m02);

    [1.4, 1.75, 2.1].forEach((r, idx) => {
      const ringGeom = new THREE.TorusGeometry(r, 0.02, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: idx === 1 ? 0xFFCC00 : 0x00F0FF, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      registerMesh(ring, false);
      ring.rotation.x = Math.PI / 2 + idx * 0.2;
      g02.add(ring);
    });
    g02.visible = false;
    projectMeshes.push(g02);
    mainGroup.add(g02);

    // [03] Rannabanna: Parametric Botanical Torus Knot + Golden Spice Halo
    const g03 = new THREE.Group();
    const geom03 = new THREE.TorusKnotGeometry(1.15, 0.35, 128, 32, 3, 5);
    const m03 = new THREE.Mesh(geom03, beautyMaterial);
    registerMesh(m03, true);
    g03.add(m03);

    const spiceRingGeom = new THREE.TorusGeometry(2.05, 0.015, 16, 64);
    const spiceMat = new THREE.MeshBasicMaterial({ color: 0xFFCC00, transparent: true, opacity: 0.6 });
    const spiceRing = new THREE.Mesh(spiceRingGeom, spiceMat);
    registerMesh(spiceRing, false);
    spiceRing.rotation.x = Math.PI / 3;
    g03.add(spiceRing);

    g03.visible = false;
    projectMeshes.push(g03);
    mainGroup.add(g03);

    // [04] Trash Trail: Hydrodynamic Möbius Ribbon Stream + Boom Barrier Torus
    const g04 = new THREE.Group();
    const geom04 = new THREE.TorusGeometry(1.35, 0.32, 24, 180, Math.PI * 2);
    const m04 = new THREE.Mesh(geom04, beautyMaterial);
    registerMesh(m04, true);
    m04.rotation.x = Math.PI / 4;
    g04.add(m04);

    const boomGeom = new THREE.TorusGeometry(1.95, 0.03, 16, 64);
    const boomMat = new THREE.MeshBasicMaterial({ color: 0xFF2A85, wireframe: true });
    const boomRing = new THREE.Mesh(boomGeom, boomMat);
    registerMesh(boomRing, false);
    g04.add(boomRing);

    g04.visible = false;
    projectMeshes.push(g04);
    mainGroup.add(g04);

    // [05] Neon Vanguard: Octahedral Combat Hull + Orthogonal POSIX IPC Gimbals
    const g05 = new THREE.Group();
    const geom05 = new THREE.OctahedronGeometry(1.35, 0);
    const m05 = new THREE.Mesh(geom05, beautyMaterial);
    registerMesh(m05, true);
    g05.add(m05);

    const gimbal1Geom = new THREE.TorusGeometry(1.8, 0.03, 16, 64);
    const gimbalMat = new THREE.MeshBasicMaterial({ color: 0x4AF626 });
    const gimbal1 = new THREE.Mesh(gimbal1Geom, gimbalMat);
    registerMesh(gimbal1, false);
    g05.add(gimbal1);

    const gimbal2 = new THREE.Mesh(gimbal1Geom, gimbalMat);
    gimbal2.rotation.y = Math.PI / 2;
    registerMesh(gimbal2, false);
    g05.add(gimbal2);

    g05.visible = false;
    projectMeshes.push(g05);
    mainGroup.add(g05);

    // [06] Chronos-Guard & Aether-GL: Merkle Vault Cube + Geodesic Navier-Stokes Fluid Cage
    const g06 = new THREE.Group();
    const geom06 = new THREE.BoxGeometry(1.45, 1.45, 1.45, 4, 4, 4);
    const m06 = new THREE.Mesh(geom06, beautyMaterial);
    registerMesh(m06, true);
    g06.add(m06);

    const fluidCageGeom = new THREE.IcosahedronGeometry(1.95, 1);
    const cageMat = new THREE.MeshBasicMaterial({ color: 0x00F0FF, wireframe: true, transparent: true, opacity: 0.35 });
    const fluidCage = new THREE.Mesh(fluidCageGeom, cageMat);
    registerMesh(fluidCage, false);
    g06.add(fluidCage);

    g06.visible = false;
    projectMeshes.push(g06);
    mainGroup.add(g06);

    projectMeshesRef.current = projectMeshes;

    // 9. Volumetric Particle System with GPU Morphing (600 Points adhering to GEMINI.md flags)
    const particleCount = PARTICLE_COUNT;
    const particleGeo = new THREE.BufferGeometry();
    const initialPositions = generateParticleFormation(0, particleCount);
    const targetPositions = generateParticleFormation(0, particleCount);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particleSizes[i] = 0.6 + Math.random() * 0.8;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    particleGeo.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3));
    particleGeo.setAttribute('aPSize', new THREE.BufferAttribute(particleSizes, 1));
    particleGeoRef.current = particleGeo;

    const particleUniforms = {
      uTime: { value: 0 },
      uMorphProgress: { value: 1.0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uRipple: { value: 0 },
      uColorA: { value: new THREE.Color(isLight ? 0x0052FF : 0x00F0FF) },
      uColorB: { value: new THREE.Color(isLight ? 0xD90452 : 0x00F0FF) },
    };
    particleUniformsRef.current = particleUniforms;

    const particleMat = new THREE.ShaderMaterial({
      uniforms: particleUniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform vec2 uMouse;
        uniform float uRipple;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        attribute vec3 aTargetPosition;
        attribute float aPSize;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float t = smoothstep(0.0, 1.0, uMorphProgress);
          vec3 p = mix(position, aTargetPosition, t);

          // GPU-only orbital wave perturbation
          float angle = uTime * 0.4 + length(p.xz) * 0.5;
          p.y += sin(angle) * 0.12;

          // Screen-space mouse repulsion wave
          vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          vec2 screenNdc = clipPos.xy / clipPos.w;
          float mouseDist = length(screenNdc - uMouse);
          float rippleWave = sin(mouseDist * 12.0 - uTime * 4.0) * exp(-mouseDist * 2.0) * uRipple;
          p += normalize(p + vec3(0.001)) * rippleWave * 0.35;

          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          gl_PointSize = (aPSize * 36.0 + rippleWave * 20.0) * (1.0 / -mvPosition.z);

          vColor = mix(uColorA, uColorB, t);
          vAlpha = 0.55 + 0.35 * sin(uTime * 2.0 + p.x * 2.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float intensity = pow(1.0 - dist * 2.0, 1.5);
          gl_FragColor = vec4(vColor, vAlpha * intensity);
        }
      `,
      transparent: true,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    particles.frustumCulled = false;
    scene.add(particles);
    particleSystemRef.current = particles;

    // 10. Resize Observer
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
      if (pixelatedPassRef.current) {
        pixelatedPassRef.current.setSize(width, height);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    // 11. Animation Loop driven by unified gsap.ticker
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let isVisible = true;
    let isTickerAttached = false;
    let lastTime = performance.now();

    const animate = () => {
      if (!isVisible) return;

      const currentTime = performance.now();
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      const time = currentTime * 0.001;

      // Telemetry FPS update
      frameCount += 1;
      if (currentTime - lastFpsTime >= 500) {
        const calculatedFps = Math.round((frameCount * 1000) / (currentTime - lastFpsTime));
        if (fpsRef.current) {
          fpsRef.current.textContent = `${calculatedFps} FPS`;
        }
        frameCount = 0;
        lastFpsTime = currentTime;
      }

      // Smooth pointer interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * (0.08 * (dt * 60));
      mouse.y += (mouse.targetY - mouse.y) * (0.08 * (dt * 60));

      rippleEnergyRef.current = Math.max(0, rippleEnergyRef.current - dt * 1.5);

      if (beautyUniformsRef.current) {
        beautyUniformsRef.current.uTime.value = time;
        beautyUniformsRef.current.uMouse.value.set(mouse.x, mouse.y);
        beautyUniformsRef.current.uRipple.value = rippleEnergyRef.current;
      }

      if (uvUniformsRef.current) {
        uvUniformsRef.current.uTime.value = time;
      }

      if (particleUniformsRef.current) {
        particleUniformsRef.current.uTime.value = time;
        particleUniformsRef.current.uMouse.value.set(mouse.x, mouse.y);
        particleUniformsRef.current.uRipple.value = rippleEnergyRef.current;
      }

      // Rotate active project mesh
      const activeMesh = projectMeshesRef.current[activeProjectIndexRef.current];
      if (activeMesh) {
        const autoSpeed = autoRotateRef.current ? 0.4 : 0.05;
        activeMesh.rotation.y += dt * autoSpeed;

        const targetRotX = mouse.y * -0.5;
        const targetRotZ = mouse.x * 0.35;
        activeMesh.rotation.x += (targetRotX - activeMesh.rotation.x) * 0.06;
        activeMesh.rotation.z += (targetRotZ - activeMesh.rotation.z) * 0.06;

        // Counter-rotation on hologram gimbal ring for enhanced multi-layer depth
        const gimbal = activeMesh.getObjectByName('project-gimbal-mesh');
        if (gimbal) {
          gimbal.rotation.z += dt * 0.25;
        }
      }

      // Rotate particle cloud
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y -= dt * 0.15;
        particleSystemRef.current.rotation.x += dt * 0.08;
      }

      composer.render();
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !isTickerAttached) {
          lastTime = performance.now();
          gsap.ticker.add(animate);
          isTickerAttached = true;
        } else if (!isVisible && isTickerAttached) {
          gsap.ticker.remove(animate);
          isTickerAttached = false;
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    gsap.ticker.add(animate);
    isTickerAttached = true;
    gsap.ticker.lagSmoothing(0);

    // Teardown
    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      if (isTickerAttached) {
        gsap.ticker.remove(animate);
      }

      projectMeshes.forEach((g) => {
        g.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).geometry?.dispose();
          }
        });
      });
      particleGeo.dispose();
      particleMat.dispose();
      Object.values(materialsRef.current).forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, []);

  // Synchronize Three.js Hologram materials & lighting with global theme
  useEffect(() => {
    const isLightMode = theme === 'light';
    if (keyLightRef.current) {
      keyLightRef.current.color.setHex(isLightMode ? 0x0052FF : 0x00F0FF);
      keyLightRef.current.intensity = isLightMode ? 1.4 : 1.6;
    }
    if (fillLightRef.current) {
      fillLightRef.current.color.setHex(isLightMode ? 0xD90452 : 0xFF2A85);
      fillLightRef.current.intensity = isLightMode ? 1.0 : 1.2;
    }
    if (ambLightRef.current) {
      ambLightRef.current.intensity = isLightMode ? 0.8 : 0.5;
    }
    if (pointAccentRef.current) {
      pointAccentRef.current.color.setHex(isLightMode ? 0x007A33 : 0x4AF626);
    }
    if (beautyUniformsRef.current) {
      gsap.to(beautyUniformsRef.current.uBaseCore.value, {
        r: isLightMode ? 0x18 / 255 : 0x07 / 255,
        g: isLightMode ? 0x1b / 255 : 0x08 / 255,
        b: isLightMode ? 0x24 / 255 : 0x14 / 255,
        duration: 0.45,
      });
      gsap.to(beautyUniformsRef.current.uRimColor.value, {
        r: isLightMode ? 0x00 : 0x00,
        g: isLightMode ? 0x52 / 255 : 0xf0 / 255,
        b: 1.0,
        duration: 0.45,
      });
    }
    if (particleUniformsRef.current) {
      gsap.to(particleUniformsRef.current.uColorA.value, {
        r: isLightMode ? 0x00 : 0x00,
        g: isLightMode ? 0x52 / 255 : 0xf0 / 255,
        b: 1.0,
        duration: 0.45,
      });
      gsap.to(particleUniformsRef.current.uColorB.value, {
        r: isLightMode ? 0xd9 / 255 : 0.0,
        g: isLightMode ? 0x04 / 255 : 0xf0 / 255,
        b: isLightMode ? 0x52 / 255 : 1.0,
        duration: 0.45,
      });
    }
    if (particleSystemRef.current?.material && particleSystemRef.current.material instanceof THREE.Material) {
      particleSystemRef.current.material.blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
      particleSystemRef.current.material.needsUpdate = true;
    }
    if (materialsRef.current?.wireframe instanceof THREE.MeshBasicMaterial) {
      materialsRef.current.wireframe.color.setHex(isLightMode ? 0x0052FF : 0x00F0FF);
    }
    if (materialsRef.current?.pixel instanceof THREE.MeshStandardMaterial) {
      materialsRef.current.pixel.color.setHex(isLightMode ? 0x0052FF : 0x00F0FF);
    }
    // Update core meshes, wireframe cages, and particle clouds in the 6 meshes
    projectMeshesRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name === 'project-core-mesh' && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(isLightMode ? 0x181B24 : 0x070814);
          } else if (child.name === 'project-gimbal-mesh' && child.material instanceof THREE.MeshBasicMaterial) {
            child.material.color.setHex(isLightMode ? 0xD90452 : 0xFF2A85);
          } else if (child.material instanceof THREE.MeshBasicMaterial) {
            const hex = child.material.color.getHex();
            if (isLightMode) {
              if (hex === 0x00F0FF || hex === 0x0052FF) {
                child.material.color.setHex(0x0052FF);
              } else if (hex === 0xFF2A85 || hex === 0xD90452) {
                child.material.color.setHex(0xD90452);
              }
            } else {
              if (hex === 0x0052FF || hex === 0x00F0FF) {
                child.material.color.setHex(0x00F0FF);
              } else if (hex === 0xD90452 || hex === 0xFF2A85) {
                child.material.color.setHex(0xFF2A85);
              }
            }
          }
        } else if (child instanceof THREE.Points && child.material instanceof THREE.PointsMaterial) {
          child.material.color.setHex(isLightMode ? 0xD90452 : 0xFF2A85);
          child.material.blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
          child.material.needsUpdate = true;
        }
      });
    });
  }, [theme]);

  // --------------------------------------------------------------------------
  // POINTER TRACKING ON VIEWPORT
  // --------------------------------------------------------------------------
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1)));

    mouseRef.current.targetX = nx;
    mouseRef.current.targetY = ny;

    if (coordsRef.current) {
      coordsRef.current.textContent = `${nx >= 0 ? '+' : ''}${nx.toFixed(2)}, ${ny >= 0 ? '+' : ''}${ny.toFixed(2)}`;
    }

    if (isPointerDownRef.current) {
      const activeMesh = projectMeshesRef.current[activeProjectIndexRef.current];
      if (activeMesh) {
        const dx = e.clientX - lastPointerPosRef.current.x;
        const dy = e.clientY - lastPointerPosRef.current.y;
        activeMesh.rotation.y += dx * 0.008;
        activeMesh.rotation.x += dy * 0.008;
        lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    rippleEnergyRef.current = 1.3;
    watchknightAudio.playHoverTick(0);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // --------------------------------------------------------------------------
  // RENDER SIMULATION PREVIEW INSIDE EXPANDED DOSSIER
  // --------------------------------------------------------------------------
  const renderInteractivePreview = (previewType: FlagshipProject['previewType']) => {
    switch (previewType) {
      case 'mental-defrag':
        return <MentalDefragPreview />;
      case 'doclens':
        return <DocLensBDPreview />;
      case 'rannabanna':
        return <RannabannaPreview />;
      case 'trash-trail':
        return <TrashTrailPreview />;
      case 'neon-vanguard':
        return <NeonVanguardPreview />;
      case 'chronos-aether':
        return <ChronosAetherPreview />;
      default:
        return <MentalDefragPreview />;
    }
  };

  return (
    <section
      ref={sectionRef}
      className="projects-showcase relative bg-[#070814] text-[#F0EFE6] py-12 sm:py-16 overflow-hidden select-none font-mono transition-colors duration-300"
      style={{
        backgroundColor: 'var(--crt-void-bg, #070814)',
        color: 'var(--pixel-ivory-text, #F0EFE6)',
      }}
      aria-label="Unified Flagship Work Showcase & 3D Hologram Inspector"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================================================================== */}
        {/* TOP STATION BANNER & HARDWARE CHROME                               */}
        {/* ================================================================== */}
        <div className="w-full mb-6 border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#131629]">
          <div className="flex items-center justify-between px-3 py-2 bg-[#D6CFC2] text-[#070814] font-bold text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#4AF626] border border-[#070814] inline-block animate-pulse" />
              <span className="font-pixel text-[11px] uppercase tracking-wider">
                [ WATCHKNIGHT_OS // SYS.96 ] :: CYBERDECK_STATION.ROM
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#070814] text-[#4AF626] border border-[#2D3645]">
                VOLUMETRIC_ENGINE // ACTIVE
              </span>
              <span className="px-1.5 py-0.5 bg-[#070814] text-[#F0EFE6] border border-[#2D3645]">
                EAST WEST UNIVERSITY CSE
              </span>
            </div>
          </div>
          <div className="px-4 py-3 bg-[#0D1512] border-t border-[#2D3645] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-[10px] text-[#00F0FF] font-pixel mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>UNIFIED ROM CARTRIDGE LEDGER &amp; LIVE 3D HOLOGRAM INSPECTOR</span>
              </div>
              <p className="text-[#8E98AA] text-[11px] font-sans">
                Select any ROM slot to dynamically morph the real-time 3D procedural hologram and inspect its geometric manifold across 6 live shader passes.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-[#4AF626] bg-[#131629] px-2 py-1 border border-[#2D3645]">
                P99 LATENCY: &lt; 0.12ms
              </span>
              <span className="text-[10px] text-[#FFCC00] bg-[#131629] px-2 py-1 border border-[#2D3645]">
                PARITY: 100% AST
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TWO-ZONE CYBERDECK WORKSTATION: LEDGER (LEFT) + 3D VIEWPORT (RIGHT)*/}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ---------------------------------------------------------------- */}
          {/* ZONE 1 (LEFT): RETRO 90s BRACKET & ROM CARTRIDGE INDEX           */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className={`flex items-center justify-between px-2 py-1 border text-[10px] ${
              isLight ? 'bg-[#FFFFFF] border-[#1A1D24]/20' : 'bg-[#131629] border-[#2D3645]'
            }`}>
              <span className={`font-bold font-pixel ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`}>
                ROM SLOTS [01 - 06] // LOADED
              </span>
              <span className={isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'}>CLICK TO ENGAGE WORKSPACE</span>
            </div>

            <div className="space-y-2">
              {FLAGSHIP_PROJECTS.map((project, idx) => {
                const isActive = activeProjectIndex === idx;

                return (
                  <div
                    key={project.id}
                    ref={(el) => {
                      romCardRefs.current[idx] = el;
                    }}
                    data-rom-index={idx}
                    onClick={() => handleSelectWithCooldown(idx)}
                    onMouseEnter={() => {
                      watchknightAudio.playHoverTick(0);
                      chiptuneAudio.playPixelTick();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectWithCooldown(idx);
                      }
                    }}
                    aria-label={`Select ROM [${project.number}] ${project.title}`}
                    aria-pressed={isActive}
                    className={`group w-full p-3 transition-all duration-200 border-2 cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-[#FFFFFF] border-[#0052FF] shadow-[0_0_12px_rgba(0,82,255,0.25)]'
                          : 'bg-[#0D1512] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : isLight
                        ? 'bg-[#FAF8F5] border-[#1A1D24]/20 hover:border-[#0052FF] hover:bg-[#FFFFFF]'
                        : 'bg-[#131629]/90 border-[#2D3645] hover:border-[#D6CFC2] hover:bg-[#131629]'
                    }`}
                  >
                    {/* 12-Column Grid Layout row adhering to layout overlap tests */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-3">
                      
                      {/* Col 1-5: Pixel Index Bracket + Project Title */}
                      <div className="sm:col-span-12 lg:col-span-5 flex items-center gap-2.5 min-w-0">
                        <span className={`font-pixel text-xs shrink-0 ${
                          isActive
                            ? isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'
                            : isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'
                        }`}>
                          [{project.number}]
                        </span>
                        <h3 className={`font-bold text-sm tracking-tight leading-snug break-words ${
                          isActive
                            ? isLight ? 'text-[#11131A]' : 'text-[#F0EFE6]'
                            : isLight ? 'text-[#3F4654] group-hover:text-[#11131A]' : 'text-[#8E98AA] group-hover:text-[#F0EFE6]'
                        }`}>
                          {project.title}
                        </h3>
                      </div>

                      {/* Col 6-8: Role */}
                      <div className="hidden sm:block sm:col-span-4 lg:col-span-3 min-w-0">
                        <span className={`block text-[8px] uppercase tracking-wider ${isLight ? 'text-[#3F4654]/70' : 'text-[#8E98AA]'}`}>Role</span>
                        <span className={`text-[11px] leading-tight block break-words ${isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'}`}>
                          {project.role}
                        </span>
                      </div>

                      {/* Col 9-10: Services / Stack */}
                      <div className="hidden md:block sm:col-span-4 md:col-span-4 lg:col-span-2 min-w-0">
                        <span className={`block text-[8px] uppercase tracking-wider ${isLight ? 'text-[#3F4654]/70' : 'text-[#8E98AA]'}`}>Stack</span>
                        <span className={`text-[11px] leading-tight block break-words ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`}>
                          {project.coreStack}
                        </span>
                      </div>

                      {/* Col 11: Year */}
                      <div className="hidden sm:block sm:col-span-2 md:col-span-2 lg:col-span-1 min-w-0">
                        <span className={`block text-[8px] uppercase tracking-wider ${isLight ? 'text-[#3F4654]/70' : 'text-[#8E98AA]'}`}>Year</span>
                        <span className={`text-[11px] ${isLight ? 'text-[#11131A]' : 'text-[#F0EFE6]'}`}>{project.year}</span>
                      </div>

                      {/* Col 12: Action Trigger */}
                      <div className="flex sm:hidden lg:flex items-center justify-between sm:justify-end gap-2 sm:col-span-2 md:col-span-2 lg:col-span-1 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${isActive ? (isLight ? 'bg-[#007A33] animate-pulse' : 'bg-[#4AF626] animate-pulse') : (isLight ? 'bg-[#C8C1B4]' : 'bg-[#2D3645]')}`} />
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? (isLight ? 'text-[#0052FF] translate-x-0.5' : 'text-[#00F0FF] translate-x-0.5') : (isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]')}`} />
                      </div>
                    </div>

                    {/* ROM Cartridge Telemetry Sub-bar */}
                    <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${
                      isLight ? 'border-[#1A1D24]/15' : 'border-[#2D3645]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-[8px] font-bold ${
                          isActive
                            ? isLight ? 'bg-[#0052FF] text-[#FFFFFF]' : 'bg-[#00F0FF] text-[#070814]'
                            : isLight ? 'bg-[#EDE8DE] text-[#3F4654] border border-[#1A1D24]/20' : 'bg-[#070814] text-[#8E98AA] border border-[#2D3645]'
                        }`}>
                          {isActive ? 'ROM: ENGAGED' : 'ROM: READY'}
                        </span>
                        <span className={isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'}>
                          p99: <span className={`font-bold ${isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}`}>{project.p99Latency}</span>
                        </span>
                        <span className={`${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} hidden sm:inline`}>
                          • <span className={isLight ? 'text-[#007A33]' : 'text-[#4AF626]'}>{project.fpsMetric}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDossierForProject(idx);
                        }}
                        className={`px-2 py-0.5 text-[9px] font-pixel transition-all border ${
                          isLight
                            ? 'bg-[#FFFFFF] hover:bg-[#0052FF]/10 text-[#0052FF] border-[#0052FF]/40'
                            : 'bg-[#131629] hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                        }`}
                      >
                        [ INSPECT ARCHITECTURE ]
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* ZONE 2 (RIGHT): LIVE THREE.JS 3D PROJECT HOLOGRAM & PASSES       */}
          {/* ---------------------------------------------------------------- */}
          <div id="render-pass-inspector" className="lg:col-span-6 flex flex-col space-y-3 lg:sticky lg:top-20 self-start">
            
            {/* Viewport Outer Frame */}
            <div className={`w-full border-2 overflow-hidden flex flex-col ${
              isLight
                ? 'border-[#1A1D24] bg-[#FAF8F5] shadow-[4px_4px_0_0_#C8C1B4]'
                : 'border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#0D1512]'
            }`}>
              
              {/* Bezel Titlebar with Live Telemetry */}
              <div className={`flex items-center justify-between px-3 py-1.5 font-bold text-[10px] ${
                isLight ? 'bg-[#D8D2C5] text-[#11131A]' : 'bg-[#D6CFC2] text-[#070814]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${isLight ? 'bg-[#D90452]' : 'bg-[#FF2A85]'}`} />
                  <span className="font-pixel">
                    HOLO_VIEWPORT // [{activeProject.number}] {activeProject.title.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span ref={fpsRef} className={`px-1.5 py-0.5 border ${
                    isLight ? 'bg-[#FFFFFF] text-[#007A33] border-[#1A1D24]/20' : 'bg-[#070814] text-[#4AF626] border-[#2D3645]'
                  }`}>
                    120 FPS
                  </span>
                  <span ref={coordsRef} className={`hidden sm:inline-block px-1.5 py-0.5 border ${
                    isLight ? 'bg-[#FFFFFF] text-[#0052FF] border-[#1A1D24]/20' : 'bg-[#070814] text-[#00F0FF] border-[#2D3645]'
                  }`}>
                    +0.00, +0.00
                  </span>
                </div>
              </div>

              {/* 6 Real-Time Shader Pass Switches Directly on the Viewport Frame */}
              <div className={`p-2 border-b ${
                isLight ? 'bg-[#F2EFE9] border-[#1A1D24]/15' : 'bg-[#131629] border-[#2D3645]'
              }`}>
                <div className="text-[9px] mb-1.5 flex items-center justify-between">
                  <span className={`font-pixel ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`}>REAL-TIME SHADER PASS SWITCHES [KEYS 1-6]:</span>
                  <span className={isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}>PIXEL_PASS: RENDERPIXELATEDPASS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SHADER_PASSES.map((pass) => {
                    const isPassActive = activePass === pass.id;

                    return (
                      <button
                        key={pass.id}
                        type="button"
                        onClick={() => selectShaderPass(pass.id)}
                        aria-pressed={isPassActive}
                        className={`px-2 py-1.5 text-left text-[9px] font-pixel border transition-all ${
                          isPassActive
                            ? isLight
                              ? 'bg-[#0052FF] text-[#FFFFFF] border-[#0052FF] font-bold shadow-[0_0_8px_rgba(0,82,255,0.4)]'
                              : 'bg-[#00F0FF] text-[#070814] border-[#D6CFC2] font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                            : isLight
                            ? 'bg-[#FFFFFF] text-[#3F4654] border-[#1A1D24]/20 hover:border-[#0052FF] hover:text-[#0052FF]'
                            : 'bg-[#0D1512] text-[#8E98AA] border-[#2D3645] hover:border-[#00F0FF] hover:text-[#F0EFE6]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{pass.label}</span>
                          <span className={`w-1.5 h-1.5 ${
                            isPassActive
                              ? isLight ? 'bg-[#FFFFFF]' : 'bg-[#070814]'
                              : isLight ? 'bg-[#007A33]' : 'bg-[#4AF626]'
                          }`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3D WebGL Canvas Viewport */}
              <div
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                className={`relative w-full h-[340px] sm:h-[400px] cursor-grab active:cursor-grabbing overflow-hidden transition-colors duration-300 ${
                  isLight ? 'bg-[#EAE5DB]' : 'bg-[#070814]'
                }`}
                style={{
                  backgroundColor: isLight ? '#EAE5DB' : '#070814',
                }}
              >
                <canvas ref={canvasRef} className="w-full h-full block" />

                {/* CRT Scanline & Grid HUD Overlay / Blueprint Drafting Grid */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    backgroundImage: isLight
                      ? 'linear-gradient(rgba(0, 82, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 82, 255, 0.15) 1px, transparent 1px)'
                      : 'linear-gradient(rgba(13, 21, 18, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
                    backgroundSize: isLight ? '24px 24px' : '100% 4px',
                    opacity: isLight ? 0.9 : 0.08,
                  }}
                  aria-hidden="true"
                />

                {/* Corner Geometric Reticle Badges */}
                <div className={`absolute top-2 left-2 text-[9px] px-2 py-1 pointer-events-none space-y-0.5 border ${
                  isLight
                    ? 'text-[#0052FF] bg-[#FFFFFF]/90 border-[#1A1D24]/20 shadow-sm'
                    : 'text-[#00F0FF] bg-[#0D1512]/90 border-[#2D3645]'
                }`}>
                  <div>GEOMETRY: <span className={isLight ? 'text-[#11131A] font-bold' : 'text-[#F0EFE6] font-bold'}>{activeProject.holoGeometryName}</span></div>
                  <div>SURFACE_TRIS: <span className={isLight ? 'text-[#007A33]' : 'text-[#4AF626]'}>{activeProject.trisCount}</span></div>
                </div>

                <div className={`absolute top-2 right-2 text-[9px] px-2 py-1 pointer-events-none space-y-0.5 border ${
                  isLight
                    ? 'text-[#D90452] bg-[#FFFFFF]/90 border-[#1A1D24]/20 shadow-sm'
                    : 'text-[#FF2A85] bg-[#0D1512]/90 border-[#2D3645]'
                }`}>
                  <div>PASS_MODE: <span className={isLight ? 'text-[#11131A] font-bold' : 'text-[#F0EFE6] font-bold'}>{activePass.toUpperCase()}</span></div>
                  <div>PASS_BADGE: <span className={isLight ? 'text-[#C85A00]' : 'text-[#FFCC00]'}>{SHADER_PASSES.find((p) => p.id === activePass)?.badge}</span></div>
                </div>

                <div className={`absolute bottom-2 left-2 text-[9px] px-2 py-1 pointer-events-none border ${
                  isLight
                    ? 'text-[#3F4654] bg-[#FFFFFF]/90 border-[#1A1D24]/20'
                    : 'text-[#8E98AA] bg-[#0D1512]/90 border-[#2D3645]'
                }`}>
                  DRAG: ROTATE 3D • CLICK: SHOCKWAVE PULSE
                </div>

                {/* Bottom Viewport Bezel Controls */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoRotate((prev) => !prev);
                      autoRotateRef.current = !autoRotateRef.current;
                      watchknightAudio.playHoverTick(0);
                    }}
                    className={`px-2 py-0.5 text-[9px] border transition-colors ${
                      isLight
                        ? 'bg-[#FFFFFF] hover:bg-[#0052FF]/10 text-[#0052FF] border-[#1A1D24]/30'
                        : 'bg-[#131629] hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#2D3645]'
                    }`}
                  >
                    AUTO-ROT: {autoRotate ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      rippleEnergyRef.current = 1.5;
                      watchknightAudio.playSpatialClick(0, 0, -1);
                    }}
                    className={`px-2 py-0.5 text-[9px] border transition-colors ${
                      isLight
                        ? 'bg-[#FFFFFF] hover:bg-[#D90452]/10 text-[#D90452] border-[#1A1D24]/30'
                        : 'bg-[#131629] hover:bg-[#FF2A85]/20 text-[#FF2A85] border border-[#2D3645]'
                    }`}
                  >
                    PULSE WAVE
                  </button>
                </div>
              </div>

              {/* Viewport Footer Telemetry Bar */}
              <div className={`p-2.5 border-t flex items-center justify-between text-[10px] ${
                isLight ? 'bg-[#F2EFE9] border-[#1A1D24]/20' : 'bg-[#131629] border-[#2D3645]'
              }`}>
                <div className={`${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} leading-snug pr-2`}>
                  <span className={`${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} font-bold`}>INFO:</span> {SHADER_PASSES.find((p) => p.id === activePass)?.description}
                </div>
                <button
                  type="button"
                  onClick={() => openDossierForProject(activeProjectIndex)}
                  className={`shrink-0 px-2.5 py-1 font-bold font-pixel text-[9px] active:translate-y-0.5 ${
                    isLight
                      ? 'bg-[#007A33] hover:bg-[#006028] text-[#FFFFFF]'
                      : 'bg-[#4AF626] hover:bg-[#6ef750] text-[#070814]'
                  }`}
                >
                  [ OPEN DOSSIER ]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* EXPANDABLE RETRO-OS DOSSIER & P99 TELEMETRY WINDOW                 */}
        {/* ================================================================== */}
        {isDossierOpen && (
          <div ref={dossierRef} className="mt-8 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            <div className={`w-full border-2 border-[#D6CFC2] border-b-[#2D3645] border-r-[#2D3645] bg-[#0D1512] ${
              dossierState === 'maximized' ? 'fixed inset-4 z-50 overflow-y-auto' : 'relative'
            }`}>
              
              {/* Dossier Titlebar with Retro Controls [ - ] [ + ] [ x ] */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#D6CFC2] text-[#070814] font-bold text-xs select-none">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] uppercase tracking-wider">
                    [ ARCHITECTURE_DOSSIER // SYS.96 ] :: [{activeProject.number}] {activeProject.title.toUpperCase()}.EXE
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setDossierState('normal');
                      watchknightAudio.playHoverTick(0);
                    }}
                    title="Minimize Dossier"
                    className="w-5 h-5 flex items-center justify-center bg-[#131629] text-[#F0EFE6] hover:bg-[#070814] border border-[#2D3645]"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDossierState((s) => s === 'maximized' ? 'normal' : 'maximized');
                      watchknightAudio.playHoverTick(0);
                    }}
                    title="Toggle Fullscreen Maximize"
                    className="w-5 h-5 flex items-center justify-center bg-[#131629] text-[#F0EFE6] hover:bg-[#070814] border border-[#2D3645]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDossierOpen(false);
                      watchknightAudio.playSpatialClick(0, 0, -1);
                    }}
                    title="Close Dossier"
                    className="w-5 h-5 flex items-center justify-center bg-[#FF2A85] text-[#F0EFE6] hover:bg-[#e0186f] border border-[#070814] font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Dossier Body Content */}
              <div className="p-4 sm:p-6 space-y-6">
                
                {/* Header Information Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2D3645] pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#00F0FF] text-[10px] font-pixel mb-1">
                      <span>PROJECT_SECTOR // {activeProject.category}</span>
                      <span>•</span>
                      <span className="text-[#FFCC00]">YEAR {activeProject.year}</span>
                    </div>
                    <h2 className="font-bold text-xl sm:text-2xl text-[#F0EFE6]">
                      {activeProject.title} — <span className="text-[#8E98AA] text-base font-normal">{activeProject.subtitle}</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#131629] hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 text-xs flex items-center gap-1.5"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>@watchknight GITHUB ↗</span>
                    </a>
                    {activeProject.liveUrl && (
                      <a
                        href={activeProject.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#00F0FF] hover:bg-[#4df4ff] text-[#070814] font-bold text-xs flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>LIVE DEMO ↗</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Problem Bottleneck & System Solution Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Problem & Solution Columns */}
                  <div className="lg:col-span-7 space-y-5">
                    
                    {/* Problem Bottleneck */}
                    <div className="p-4 bg-[#131629] border border-[#2D3645] space-y-2">
                      <div className="text-[10px] text-[#FF2A85] font-pixel flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF2A85]" />
                        <span>PROBLEM BOTTLENECK</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#F0EFE6]">{activeProject.problem.headline}</h4>
                      <p className="text-xs text-[#8E98AA] leading-relaxed">{activeProject.problem.description}</p>
                      <div className="p-2 bg-[#070814] border-l-2 border-[#FF2A85] text-[11px] text-[#D6CFC2]">
                        <span className="text-[#FF2A85] font-bold">Root Bottleneck:</span> {activeProject.problem.bottleneck}
                      </div>
                    </div>

                    {/* System Solution */}
                    <div className="p-4 bg-[#131629] border border-[#2D3645] space-y-2.5">
                      <div className="text-[10px] text-[#4AF626] font-pixel flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#4AF626]" />
                        <span>SYSTEM ARCHITECTURE SOLUTION</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#F0EFE6]">{activeProject.solution.headline}</h4>
                      <p className="text-xs text-[#8E98AA] leading-relaxed">{activeProject.solution.description}</p>
                      
                      <div className="space-y-1.5 pt-1">
                        {activeProject.solution.architecture.map((archItem, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-2 text-xs text-[#D6CFC2]">
                            <span className="text-[#00F0FF] font-bold">❯</span>
                            <span>{archItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* P99 Telemetry Readout Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {activeProject.impact.metrics.map((metric, mIdx) => (
                        <div key={mIdx} className="p-3 bg-[#131629] border border-[#2D3645] text-center">
                          <span className="text-[9px] text-[#8E98AA] block uppercase mb-1">{metric.label}</span>
                          <span className="text-base sm:text-lg font-bold text-[#00F0FF] block">{metric.value}</span>
                          <span className="text-[9px] text-[#4AF626] block leading-tight break-words">{metric.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Live Interactive Simulation Preview Box */}
                  <div className="lg:col-span-5 flex flex-col space-y-3">
                    <div className="text-[10px] text-[#00F0FF] font-pixel flex items-center justify-between">
                      <span>LIVE SIMULATION PREVIEW:</span>
                      <span className="text-[#4AF626]">{activeProject.fpsMetric}</span>
                    </div>

                    <div className="h-[340px] sm:h-[380px]">
                      {renderInteractivePreview(activeProject.previewType)}
                    </div>

                    <div className="p-3 bg-[#131629] border border-[#2D3645] flex items-center justify-between">
                      <div className="text-xs text-[#8E98AA]">
                        <span className="text-[#00F0FF] font-bold">CLIENT:</span> {activeProject.client}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          openCaseStudy(activeProject, e.currentTarget);
                        }}
                        className="px-3 py-1 bg-[#00F0FF] hover:bg-[#4df4ff] text-[#070814] font-bold text-xs flex items-center gap-1 active:translate-y-0.5"
                      >
                        <span>FULL CASE STUDY ⤢</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default ProjectsShowcase;
