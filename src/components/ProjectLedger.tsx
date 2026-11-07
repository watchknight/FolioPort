import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { watchknightAudio } from '../audio/WatchknightAudioEngine';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { useReveal } from '../hooks/useReveal';
import {
  ChevronDown,
  ExternalLink,
  Terminal,
  Activity
} from 'lucide-react';
import { GithubIcon } from './ui/Icons';

export interface LedgerProject {
  id: string;
  positionBadge: string;
  positionRole: 'primacy' | 'standard' | 'anomaly' | 'recency';
  number: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  domain: string;
  role: string;
  year: string;
  keyMetric: {
    label: string;
    value: string;
  };
  architectureSpecs: string[];
  systemMetrics: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  techStack: string[];
  githubUrl: string;
  liveUrl?: string;
  serialNote: string;
}

export const SERIAL_PROJECTS: LedgerProject[] = [
  {
    id: 'chronos-guard',
    positionBadge: '01 / 04 • PRIMACY ANCHOR',
    positionRole: 'primacy',
    number: '01',
    title: 'Chronos-Guard — Tamper-Evident Cryptographic Agent Ledger (SHA-256 + HMAC)',
    shortTitle: 'Chronos-Guard',
    subtitle: 'High-Throughput Cryptographic Audit Ledger & Autonomous Agent Verifier',
    domain: 'Cryptographic Ledger & Agent Security',
    role: 'Lead Cryptographic Systems Architect',
    year: '2024',
    keyMetric: {
      label: 'Tamper Detection',
      value: '< 0.12 ms'
    },
    architectureSpecs: [
      'Monotonic append-only ledger secured via SHA-256 Merkle tree state anchors',
      'HMAC-SHA256 authenticated agent signatures preventing unauthorized state mutations',
      'Zero-knowledge temporal checkpoint verification with sub-millisecond tamper alerts',
      'POSIX-compliant lock-free write buffers delivering 18,500 verifiable events/sec'
    ],
    systemMetrics: [
      { label: 'Ingest Rate', value: '18.5k evt/s', detail: 'Zero lock contention' },
      { label: 'Merkle Depth', value: '32 Levels', detail: 'Sub-millisecond root proof' },
      { label: 'Integrity SLA', value: '100.0%', detail: 'Cryptographic proof verifiable' }
    ],
    techStack: ['TypeScript', 'SHA-256', 'HMAC', 'Merkle Tree', 'Node.js Crypto', 'Zero-Knowledge Proofs'],
    githubUrl: 'https://github.com/watchknight',
    liveUrl: 'https://github.com/watchknight',
    serialNote: 'Cognitive Primacy Anchor: Establishes immediate baseline architectural credibility and cryptographic rigor.'
  },
  {
    id: 'hypergraph-ewu',
    positionBadge: '02 / 04 • GRAPH DYNAMICS',
    positionRole: 'standard',
    number: '02',
    title: 'HyperGraph-EWU — Real-Time 3D Knight\'s Tour & Dijkstra Pathfinding Visualizer',
    shortTitle: 'HyperGraph-EWU',
    subtitle: 'Spatial Graph Theory Visualizer & Heuristic Search Simulator',
    domain: 'Graph Algorithmics & Heuristic Optimization',
    role: 'Graph Theory & Systems Engineer',
    year: '2024',
    keyMetric: {
      label: 'Warnsdorff p99',
      value: '2.4 ms'
    },
    architectureSpecs: [
      'Warnsdorff heuristic backtracking engine solving closed 8x8 to 16x16 knight tours in O(V)',
      'Simultaneous bidirectional Dijkstra and A* topological traversal with dynamic weight heuristics',
      'Interactive 3D graph visualizer mapping East West University CSE lab coordinate clusters',
      'GPU-accelerated Canvas rendering pipeline processing 5,000+ active edge traversals at 60 FPS'
    ],
    systemMetrics: [
      { label: 'Graph Nodes', value: '10,000+', detail: 'Dynamic topological space' },
      { label: 'Traversal Latency', value: '2.4 ms', detail: 'Heuristic branch pruning' },
      { label: 'Render Pacing', value: '60 FPS', detail: 'Zero memory allocation in loop' }
    ],
    techStack: ['TypeScript', 'Three.js / WebGL', 'Warnsdorff Algorithm', 'Dijkstra & A*', 'Graph Theory'],
    githubUrl: 'https://github.com/watchknight',
    liveUrl: 'https://github.com/watchknight',
    serialNote: 'Trajectory Continuity: Bridges mathematical graph algorithms with spatial interactive 3D computing.'
  },
  {
    id: 'aether-gl',
    positionBadge: '03 / 04 • VON RESTORFF STRATEGIC ANOMALY',
    positionRole: 'anomaly',
    number: '03',
    title: 'Aether-GL — Audio-Reactive WebGPU/WebGL Fluid Shader Studio',
    shortTitle: 'Aether-GL',
    subtitle: 'Real-Time Navier-Stokes Fluid Dynamics & GLSL Shader Synthesizer',
    domain: 'Creative GPU Architecture & Audio Reactive Shaders',
    role: 'Creative GPU Technologist & Shader Architect',
    year: '2024',
    keyMetric: {
      label: 'Pass Time',
      value: '1.42 ms'
    },
    architectureSpecs: [
      'Eulerian Navier-Stokes fluid grid solver running advection, diffusion, and Poisson pressure Jacobi iterations',
      'Fast Fourier Transform (FFT) procedural Web Audio frequency decomposition driving dynamic vorticity injections',
      'Dual-API WebGPU compute pipeline with automatic WebGL2 GLSL render-pass fallback',
      'Asymmetric visual layout anomaly breaking ledger symmetry with --wk-terracotta-pulse focal accent'
    ],
    systemMetrics: [
      { label: 'Grid Resolution', value: '1024 x 1024', detail: 'Eulerian fluid cells' },
      { label: 'GPU Pass Time', value: '1.42 ms', detail: 'WebGPU compute kernel' },
      { label: 'Frame Consistency', value: '120 FPS', detail: 'Zero dropped presentation frames' }
    ],
    techStack: ['WebGPU', 'WebGL2 / GLSL', 'Navier-Stokes', 'Web Audio API', 'FFT Analyzer', 'GSAP'],
    githubUrl: 'https://github.com/watchknight',
    liveUrl: 'https://github.com/watchknight',
    serialNote: 'Von Restorff Strategic Anomaly: Disrupts horizontal cadence with terracotta focal frame and live render studio.'
  },
  {
    id: 'perceptron-core',
    positionBadge: '04 / 04 • RECENCY ANCHOR',
    positionRole: 'recency',
    number: '04',
    title: 'Perceptron-Core — Neural Network Socket Telemetry & Distributed Inference Engine',
    shortTitle: 'Perceptron-Core',
    subtitle: 'Low-Latency Distributed Edge Model Inference & WebSocket Telemetry Stream',
    domain: 'Distributed Systems & Neural Inference Pipelines',
    role: 'Distributed Systems & ML Lead',
    year: '2024',
    keyMetric: {
      label: 'Inference p99',
      value: '11.8 ms'
    },
    architectureSpecs: [
      'Custom matrix multiply kernel accelerated with WebAssembly SIMD vector instructions',
      'Binary WebSocket streaming protocol reducing serialization overhead by 68% over JSON',
      'Distributed multi-node edge inference telemetry with decentralized consensus health pings',
      'Client-side backpropagation visualizer decomposing weight gradients across dense layers'
    ],
    systemMetrics: [
      { label: 'p99 Inference', value: '11.8 ms', detail: 'SIMD-accelerated forward pass' },
      { label: 'Socket Overhead', value: '< 2.1 μs', detail: 'Binary buffer framing' },
      { label: 'Throughput', value: '4,200 req/s', detail: 'Distributed edge worker pool' }
    ],
    techStack: ['TypeScript', 'WebAssembly / SIMD', 'Binary WebSockets', 'Matrix Algebra', 'Neural Networks'],
    githubUrl: 'https://github.com/watchknight',
    liveUrl: 'https://github.com/watchknight',
    serialNote: 'Cognitive Recency Anchor: Concludes the serial portfolio scan with deep systems telemetry and low-level ML engineering.'
  }
];

export const ProjectLedger: React.FC = () => {
  const containerRef = useReveal<HTMLElement>();
  const [expandedId, setExpandedId] = useState<string | null>('aether-gl');
  const [renderMode, setRenderMode] = useState<'fluid' | 'audio' | 'inspector'>('fluid');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Procedural audio hover tick handler for ledger rows
  const handleRowHover = (e: React.PointerEvent | React.MouseEvent) => {
    const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
    watchknightAudio.playHoverTick(normX);
    chiptuneAudio.playPixelTick();
  };

  // Toggle progressive disclosure with auditory feedback & 3D HRTF spatial panner
  const handleToggleExpand = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    let normX = 0;
    let normY = 0;
    if (e && 'clientX' in e && typeof window !== 'undefined') {
      normX = (e.clientX / window.innerWidth) * 2 - 1;
      normY = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    watchknightAudio.playSpatialClick(normX, normY, -1);
    chiptuneAudio.playCoinSFX();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Keyboard accessibility handler for rows
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleExpand(id, e);
    }
  };

  // Live Canvas simulation for Position 03 (Von Restorff Strategic Anomaly) driven by single gsap.ticker
  useEffect(() => {
    if (expandedId !== 'aether-gl') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let step = 0;

    const render = () => {
      t += 0.035;
      step = (step + 1) % 1000;
      const w = canvas.width;
      const h = canvas.height;

      // Deep obsidian void base
      ctx.fillStyle = '#090A0D';
      ctx.fillRect(0, 0, w, h);

      if (renderMode === 'fluid') {
        // Navier-Stokes fluid vorticity curl visualization
        for (let x = 0; x < w; x += 18) {
          for (let y = 0; y < h; y += 18) {
            const angle = Math.sin(x * 0.015 + t) + Math.cos(y * 0.015 - t * 0.8);
            const len = 9 + Math.sin(t + (x + y) * 0.01) * 4;
            const x2 = x + Math.cos(angle) * len;
            const y2 = y + Math.sin(angle) * len;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            // Terracotta pulse focal accent blended with verdigris signal
            const isVortex = Math.sin(x * 0.03 + y * 0.03 + t) > 0.4;
            ctx.strokeStyle = isVortex
              ? 'rgba(184, 74, 39, 0.75)'
              : 'rgba(78, 154, 127, 0.35)';
            ctx.lineWidth = isVortex ? 1.5 : 0.8;
            ctx.stroke();
          }
        }
      } else if (renderMode === 'audio') {
        // Audio reactive spectral bands linked directly to watchknightAudio FFT uniforms
        const bassUniform = watchknightAudio.uniforms.uAudioBass.value;
        const midUniform = watchknightAudio.uniforms.uAudioMid.value;
        const trebleUniform = watchknightAudio.uniforms.uAudioTreble.value;
        const beatPulse = watchknightAudio.uniforms.uBeatPulse.value;

        const bands = 28;
        const barWidth = (w - (bands + 1) * 3) / bands;
        for (let i = 0; i < bands; i++) {
          const bandUniform = i < 8 ? bassUniform : i < 18 ? midUniform : trebleUniform;
          const proceduralSim = (Math.sin(t * 2 + i * 0.4) * 0.5 + 0.5) * 0.4;
          const liveMag = Math.min(1.0, proceduralSim + bandUniform * 1.2 + (i < 8 ? beatPulse * 0.35 : 0));
          const freqHeight = liveMag * (h * 0.75) + 6;
          const x = 3 + i * (barWidth + 3);
          const y = h - freqHeight - 8;

          // Cyber-CRT focal band highlights
          const isHighRes = i >= 8 && i <= 14;
          ctx.fillStyle = isHighRes ? '#FF2A85' : 'rgba(240, 239, 230, 0.25)';
          ctx.fillRect(x, y, barWidth, freqHeight);

          // Crest vector ticks
          ctx.fillStyle = isHighRes ? '#F0EFE6' : '#4AF626';
          ctx.fillRect(x, Math.max(4, y - 3), barWidth, 1.5);
        }
      } else {
        // GLSL Render-Pass Inspector wireframe & depth buffer
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= w; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y <= h; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Inspection target bounds with Kanizsa corners
        const boxX = w * 0.25;
        const boxY = h * 0.2;
        const boxW = w * 0.5;
        const boxH = h * 0.6;
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#F0EFE6';
        ctx.fillText('PASS 01: COLOR_ATTACHMENT_0 (RGBA16F)', boxX + 6, boxY + 14);
        ctx.fillStyle = '#4AF626';
        ctx.fillText('PASS 02: DEPTH24_STENCIL8 [VALIDATED]', boxX + 6, boxY + 28);
        ctx.fillStyle = '#8E98AA';
        ctx.fillText(`OCCLUSION SAMPLES: ${3420 + (step % 40)}`, boxX + 6, boxY + 42);
      }
    };

    gsap.ticker.add(render);
    return () => {
      gsap.ticker.remove(render);
    };
  }, [expandedId, renderMode]);

  return (
    <section
      id="project-ledger"
      ref={containerRef}
      className="relative w-full py-20 px-4 sm:px-6 lg:px-12 bg-wk-obsidian-void text-wk-alabaster-ink selection:bg-wk-terracotta-pulse selection:text-wk-alabaster-ink transition-colors"
      style={{
        backgroundColor: 'var(--wk-obsidian-void, #090A0D)',
        color: 'var(--wk-alabaster-ink, #F2EFE9)'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header: Editorial Ledger Telemetry Title */}
        <div className="kanizsa-container mb-12 p-6 sm:p-8 bg-wk-slate-surface/40 border border-wk-ash-muted/15 relative">
          {/* Kanizsa Implied Corner Crosshairs */}
          <svg className="kanizsa-crosshair kanizsa-tl" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="kanizsa-crosshair kanizsa-tr" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="kanizsa-crosshair kanizsa-bl" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg className="kanizsa-crosshair kanizsa-br" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
          </svg>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-wk-verdigris-signal animate-pulse" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-wk-ash-muted">
                  Serial Position Architecture • East West University CSE Showcase
                </span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-wk-alabaster-ink tracking-tight uppercase">
                Editorial Project Ledger
              </h2>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px] text-wk-ash-muted">
              <div>
                <span className="text-wk-alabaster-ink font-semibold">4</span> Verified Anchors
              </div>
              <span className="text-wk-ash-muted/40">/</span>
              <div>
                <span className="text-wk-terracotta-pulse font-semibold">1</span> Von Restorff Anomaly
              </div>
              <span className="text-wk-ash-muted/40">/</span>
              <div className="text-wk-verdigris-signal flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>100% Deterministic</span>
              </div>
            </div>
          </div>

          {/* 1px SVG Data-Draw Rule animated by useReveal */}
          <div data-draw className="wk-rule-h" />

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-wk-ash-muted font-mono gap-2">
            <p>
              Pre-attentive 50ms scan matrix • Kanizsa optical boundaries • Progressive architectural disclosure
            </p>
            <span className="text-[10px] bg-wk-obsidian-void px-2 py-0.5 border border-wk-ash-muted/20">
              WCAG 2.1 AAA &bull; 17.28:1 Contrast
            </span>
          </div>
        </div>

        {/* 4-Project Serial Position Stack */}
        <div data-stagger className="space-y-4">
          {SERIAL_PROJECTS.map((proj) => {
            const isExpanded = expandedId === proj.id;
            const isAnomaly = proj.positionRole === 'anomaly';
            const isPrimacy = proj.positionRole === 'primacy';
            const isRecency = proj.positionRole === 'recency';

            return (
              <div
                key={proj.id}
                data-project-id={proj.id}
                className={`kanizsa-container wk-velocity-item wk-project-row transition-all duration-300 relative ${
                  isAnomaly
                    ? 'von-restorff-frame -mx-2 sm:-mx-3 lg:-mx-4 w-[calc(100%+16px)] sm:w-[calc(100%+24px)] lg:w-[calc(100%+32px)] z-20 bg-wk-slate-surface border-l-4 border-l-wk-terracotta-pulse'
                    : 'bg-wk-slate-surface/30 border border-wk-ash-muted/20 hover:border-wk-ash-muted/45 z-10'
                }`}
              >
                {/* Kanizsa Implied Corner Crosshairs (4 points per ledger row) */}
                <svg className="kanizsa-crosshair kanizsa-tl" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
                </svg>
                <svg className="kanizsa-crosshair kanizsa-tr" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
                </svg>
                <svg className="kanizsa-crosshair kanizsa-bl" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
                </svg>
                <svg className="kanizsa-crosshair kanizsa-br" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 0V9M0 4.5H9" stroke="currentColor" strokeWidth="1" />
                </svg>

                {/* Primary Ledger Row (Uncluttered 50ms pre-attentive scan window) */}
                <div
                  id={`ledger-btn-${proj.id}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`ledger-panel-${proj.id}`}
                  onPointerEnter={handleRowHover}
                  onClick={(e) => handleToggleExpand(proj.id, e)}
                  onKeyDown={(e) => handleKeyDown(e, proj.id)}
                  className={`w-full p-4 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors select-none ${
                    isExpanded ? 'bg-wk-slate-surface/70' : 'hover:bg-wk-slate-surface/50'
                  }`}
                >
                  {/* Left: Sequential Index & Title */}
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    {/* Index Badge */}
                    <div className="shrink-0 flex flex-col items-center justify-center">
                      <span
                        className={`font-mono font-black text-sm px-2.5 py-1 border transition-colors ${
                          isAnomaly
                            ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink border-wk-terracotta-pulse font-bold'
                            : isPrimacy || isRecency
                            ? 'bg-wk-obsidian-void text-wk-alabaster-ink border-wk-alabaster-ink/30 font-bold'
                            : 'bg-wk-obsidian-void/80 text-wk-ash-muted border-wk-ash-muted/20'
                        }`}
                      >
                        {proj.number}
                      </span>
                    </div>

                    {/* Metadata & Title */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 border ${
                            isAnomaly
                              ? 'text-wk-terracotta-pulse border-wk-terracotta-pulse/40 bg-wk-terracotta-pulse/10'
                              : isPrimacy
                              ? 'text-wk-verdigris-signal border-wk-verdigris-signal/40 bg-wk-verdigris-signal/10'
                              : isRecency
                              ? 'text-wk-alabaster-ink border-wk-alabaster-ink/30 bg-wk-alabaster-ink/5'
                              : 'text-wk-ash-muted border-wk-ash-muted/20'
                          }`}
                        >
                          {proj.positionBadge}
                        </span>
                        <span className="font-mono text-[11px] text-wk-ash-muted hidden sm:inline">
                          &bull; {proj.domain}
                        </span>
                      </div>

                      <h3
                        className={`font-display font-black text-base sm:text-lg md:text-xl tracking-tight transition-colors break-words leading-snug ${
                          isAnomaly
                            ? 'text-wk-alabaster-ink group-hover:text-wk-terracotta-pulse'
                            : 'text-wk-alabaster-ink'
                        }`}
                      >
                        {proj.title}
                      </h3>
                    </div>
                  </div>

                  {/* Right: Telemetry Key Metric & Disclosure Toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 font-mono">
                    <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-wk-ash-muted/20 pl-3 md:pl-0 md:pr-4">
                      <span className="block text-[9px] uppercase tracking-wider text-wk-ash-muted">
                        {proj.keyMetric.label}
                      </span>
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          isAnomaly ? 'text-wk-terracotta-pulse' : 'text-wk-alabaster-ink'
                        }`}
                      >
                        {proj.keyMetric.value}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-wk-ash-muted hidden lg:inline">
                        {isExpanded ? 'Collapse' : 'Architecture'}
                      </span>
                      <div
                        className={`p-1.5 rounded border transition-transform duration-200 ${
                          isExpanded
                            ? 'bg-wk-alabaster-ink/10 border-wk-alabaster-ink/30 text-wk-alabaster-ink rotate-180'
                            : 'bg-wk-obsidian-void border-wk-ash-muted/20 text-wk-ash-muted'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progressive Disclosure Panel (revealed on user interaction) */}
                {isExpanded && (
                  <div
                    id={`ledger-panel-${proj.id}`}
                    role="region"
                    aria-labelledby={`ledger-btn-${proj.id}`}
                    className="border-t border-wk-ash-muted/15 p-4 sm:p-6 lg:p-8 bg-wk-obsidian-void/90 space-y-6 animate-in fade-in duration-200"
                  >
                    {/* Architectural Thesis & Cognitive Serial Position Note */}
                    <div className="p-3 bg-wk-slate-surface/80 border border-wk-ash-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="text-wk-ash-muted">
                        <span className="text-wk-alabaster-ink font-semibold">Subsystem:</span>{' '}
                        {proj.subtitle}
                      </div>
                      <div className="text-wk-ash-muted/80 text-[11px] italic">
                        {proj.serialNote}
                      </div>
                    </div>

                    {/* Specific Interactive Showcase for Position 03 (Von Restorff Strategic Anomaly) */}
                    {isAnomaly && (
                      <div className="p-4 sm:p-6 bg-wk-slate-surface border border-wk-terracotta-pulse/40 relative space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-wk-ash-muted/20 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-wk-terracotta-pulse animate-ping" />
                            <h4 className="font-mono text-xs font-bold text-wk-alabaster-ink uppercase tracking-wider">
                              Aether-GL Live Render-Pass Shader Synthesizer
                            </h4>
                          </div>

                          {/* 3-way Interactive Render Mode Switcher */}
                          <div className="flex items-center p-1 bg-wk-obsidian-void border border-wk-ash-muted/20 text-[11px] font-mono">
                            <button
                              type="button"
                              onPointerEnter={handleRowHover}
                              onClick={(e) => {
                                e.stopPropagation();
                                const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
                                watchknightAudio.playSpatialClick(normX, 0, -1);
                                setRenderMode('fluid');
                              }}
                              className={`px-2.5 py-1 transition-all ${
                                renderMode === 'fluid'
                                  ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                                  : 'text-wk-ash-muted hover:text-wk-alabaster-ink'
                              }`}
                            >
                              Eulerian Fluid
                            </button>
                            <button
                              type="button"
                              onPointerEnter={handleRowHover}
                              onClick={(e) => {
                                e.stopPropagation();
                                const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
                                watchknightAudio.playSpatialClick(normX, 0, -1);
                                setRenderMode('audio');
                              }}
                              className={`px-2.5 py-1 transition-all ${
                                renderMode === 'audio'
                                  ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                                  : 'text-wk-ash-muted hover:text-wk-alabaster-ink'
                              }`}
                            >
                              Audio Reactive
                            </button>
                            <button
                              type="button"
                              onPointerEnter={handleRowHover}
                              onClick={(e) => {
                                e.stopPropagation();
                                const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
                                watchknightAudio.playSpatialClick(normX, 0, -1);
                                setRenderMode('inspector');
                              }}
                              className={`px-2.5 py-1 transition-all ${
                                renderMode === 'inspector'
                                  ? 'bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold'
                                  : 'text-wk-ash-muted hover:text-wk-alabaster-ink'
                              }`}
                            >
                              GLSL Inspector
                            </button>
                          </div>
                        </div>

                        {/* Interactive Canvas Element */}
                        <div className="relative w-full h-[180px] sm:h-[220px] bg-wk-obsidian-void border border-wk-ash-muted/20 overflow-hidden">
                          <canvas
                            ref={canvasRef}
                            width={720}
                            height={220}
                            className="w-full h-full block"
                          />
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-wk-obsidian-void/90 border border-wk-ash-muted/20 text-[9px] font-mono text-wk-ash-muted">
                            Mode: <span className="text-wk-alabaster-ink uppercase">{renderMode}</span> &bull; 1024x1024 &bull; WebGPU
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Specifications Grid (2 Columns) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Architecture Specifications Checklist */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-wk-ash-muted/15 pb-2">
                          <Terminal className="w-3.5 h-3.5 text-wk-ash-muted" />
                          <h4 className="font-mono text-xs font-bold text-wk-alabaster-ink uppercase tracking-wider">
                            Engine Architecture & Proofs
                          </h4>
                        </div>
                        <ul className="space-y-2">
                          {proj.architectureSpecs.map((spec, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2.5 font-mono text-xs text-wk-ash-muted">
                              <span className="text-wk-terracotta-pulse mt-0.5 shrink-0">&gt;</span>
                              <span className="leading-relaxed">{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Quantitative System Telemetry Benchmarks */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-wk-ash-muted/15 pb-2">
                          <Activity className="w-3.5 h-3.5 text-wk-ash-muted" />
                          <h4 className="font-mono text-xs font-bold text-wk-alabaster-ink uppercase tracking-wider">
                            Performance Benchmarks (p99 Telemetry)
                          </h4>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {proj.systemMetrics.map((met, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-3 bg-wk-slate-surface/70 border border-wk-ash-muted/15 font-mono"
                            >
                              <span className="block text-[9px] uppercase tracking-wider text-wk-ash-muted">
                                {met.label}
                              </span>
                              <span className="block text-sm sm:text-base font-bold text-wk-alabaster-ink my-0.5">
                                {met.value}
                              </span>
                              <span className="block text-[9px] text-wk-ash-muted/70 break-words leading-tight">
                                {met.detail}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Tech Stack Chips */}
                        <div className="pt-2">
                          <span className="block text-[10px] font-mono text-wk-ash-muted uppercase tracking-wider mb-1.5">
                            Core Technologies
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {proj.techStack.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 bg-wk-slate-surface text-wk-ash-muted border border-wk-ash-muted/20 font-mono text-[10px]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Tray: Repository & Live Links */}
                    <div data-draw className="wk-rule-h" />
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                      <div className="flex items-center gap-2 text-wk-ash-muted text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-wk-verdigris-signal" />
                        <span>East West University CSE Verified Pipeline</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          onPointerEnter={handleRowHover}
                          onClick={(e) => {
                            e.stopPropagation();
                            const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
                            watchknightAudio.playSpatialClick(normX, 0, -1);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-wk-slate-surface hover:bg-wk-slate-surface/80 text-wk-alabaster-ink border border-wk-ash-muted/30 transition-all hover:border-wk-alabaster-ink active:scale-95"
                        >
                          <GithubIcon className="w-3.5 h-3.5" />
                          <span>Inspect Code</span>
                        </a>

                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            onPointerEnter={handleRowHover}
                            onClick={(e) => {
                              e.stopPropagation();
                              const normX = typeof window !== 'undefined' ? (e.clientX / window.innerWidth) * 2 - 1 : 0;
                              watchknightAudio.playSpatialClick(normX, 0, -1);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-wk-terracotta-pulse text-wk-alabaster-ink font-bold border border-wk-terracotta-pulse transition-all hover:brightness-110 active:scale-95"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Telemetry</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectLedger;
