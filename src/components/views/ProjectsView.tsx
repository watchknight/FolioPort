import React, { useState, useEffect, useMemo } from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface ProjectsViewProps {
  palette?: PhosphorColorTokens;
}

export interface FeaturedProject {
  id: string;
  fileCode: string;
  title: string;
  tagline: string;
  problem: string;
  architecture: string;
  impact: string;
  stack: string;
  demoUrl: string;
  sourceUrl: string;
  status: string;
  date: string;
  size: string;
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

// 1. TOP FEATURED ARCHIVE: Flagship Case Studies with Problem / Architecture / Impact breakdown
export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: '01_MENTAL_DEFRAG',
    fileCode: '01_MENTAL_DEFRAG.EXE',
    title: 'Mental Defrag',
    tagline: 'Zero-gravity spatial cognitive workspace',
    problem:
      'Hierarchical note-taking tools enforce rigid tree structures that stifle non-linear ideation and spatial conceptual clustering.',
    architecture:
      'Engineered with Vite, TypeScript, and Matter.js rigid-body physics with zero-gravity friction decay. Built local vector embeddings (cosine similarity clustering) and bi-directional Obsidian .canvas JSON AST compiler with lossless synchronization.',
    impact:
      'Sustained 60 FPS spatial physics loop across 200+ active nodes, zero-latency local vector queries, and 100% bi-directional Obsidian .canvas schema parity.',
    stack: 'VITE // TYPESCRIPT // MATTER.JS // VECTOR EMBEDDINGS // OBSIDIAN CANVAS',
    demoUrl: 'https://github.com/watchknight/Mental-Defrag',
    sourceUrl: 'https://github.com/watchknight/Mental-Defrag',
    status: 'PRODUCTION',
    date: '1996-11-04',
    size: '142KB',
  },
  {
    id: '02_DOCLENS_BD',
    fileCode: '02_DOCLENS_BD.EXE',
    title: 'DocLensBD',
    tagline: 'Cloud-backed document & healthcare platform',
    problem:
      'Medical diagnostics in regional facilities suffer from erratic mobile networks, high packet loss, and severe security compliance risks.',
    architecture:
      'Architected on Cloud Firestore real-time snapshot listeners with offline IndexedDB fallback. Implemented client-side AES-256 field encryption, role-based access security rules, and automated GitHub Actions CI/CD staging pipelines.',
    impact:
      '< 45 ms regional snapshot propagation, 99.98% production uptime SLA, and 14/14 automated end-to-end integration test passes on every PR.',
    stack: 'REACT // TYPESCRIPT // CLOUD FIRESTORE // FIREBASE AUTH // CI/CD',
    demoUrl: 'https://github.com/watchknight/DocLensBD',
    sourceUrl: 'https://github.com/watchknight/DocLensBD',
    status: 'VERIFIED',
    date: '1996-10-28',
    size: '284KB',
  },
  {
    id: '03_RANNABANNA',
    fileCode: '03_RANNABANNA.EXE',
    title: 'Rannabanna',
    tagline: 'Full-stack localized Bengali culinary web application',
    problem:
      'Complex Unicode font glyphs and sluggish search algorithms degraded mobile web performance for non-Latin localized culinary archives.',
    architecture:
      'Vite build pipeline with custom Bengali Unicode glyph subsetting reducing font payload by 78%. Built real-time cloud database synchronization and a phonetic English-to-Bengali transliteration search indexing engine.',
    impact:
      '99/100 Google Lighthouse performance score, 42 KB critical bundle footprint, and < 15 ms transliterated query latency.',
    stack: 'REACT // VITE // CLOUD DB SYNC // BENGALI NLP // TAILWIND',
    demoUrl: 'https://github.com/watchknight/Rannabanna',
    sourceUrl: 'https://github.com/watchknight/Rannabanna',
    status: 'ONLINE',
    date: '1996-10-15',
    size: '98KB',
  },
  {
    id: '04_TRASH_TRAIL',
    fileCode: '04_TRASH_TRAIL.EXE',
    title: 'Trash Trail',
    tagline: 'Interactive scroll-driven environmental storytelling web application',
    problem:
      'Traditional public environmental reports suffer from high bounce rates and disengaged readers on mobile and desktop platforms.',
    architecture:
      'Crafted multi-stage GSAP ScrollTrigger choreography with pinned viewport layers, zero Cumulative Layout Shift (0.00 CLS) aspect-ratio preservation, and vanilla JS micro-event dispatchers avoiding virtual DOM re-render overhead.',
    impact:
      '+340% average user session duration, rock-solid 60 FPS mobile scrubbing, and 0.00 CLS layout stability.',
    stack: 'VANILLA JS // GSAP SCROLLTRIGGER // SVG KINETIC // VITE',
    demoUrl: 'https://github.com/watchknight/TrashTrail',
    sourceUrl: 'https://github.com/watchknight/TrashTrail',
    status: 'SHIPPED',
    date: '1996-09-22',
    size: '116KB',
  },
  {
    id: '05_NEON_VANGUARD_OS',
    fileCode: '05_NEON_VANGUARD_OS.EXE',
    title: 'Neon Vanguard OS & Combat Labs',
    tagline: 'HTML5 2D canvas combat engine & Linux C/C++ POSIX IPC',
    problem:
      'High particle-count collision overhead causes severe frame drops in web games, while inter-process communication in native OS labs suffers from buffer lock contention.',
    architecture:
      'Pre-allocated object pooling with raycast projectile piercing and recursive chain-lightning luminescence on HTML5 2D Canvas. Coupled with Linux C POSIX shared memory (shmget/shmat), anonymous duplex pipes, and multi-process fork() hierarchy labs.',
    impact:
      '120 FPS sustained render pacing in 2D combat simulations, < 1.2 μs IPC round-trip latency, and zero memory leaks under 24-hour Valgrind stress runs.',
    stack: 'C / C++ // LINUX POSIX IPC // FORK() // HTML5 CANVAS // SHM',
    demoUrl: 'https://github.com/watchknight/BitForge',
    sourceUrl: 'https://github.com/watchknight/BitForge',
    status: 'ACTIVE',
    date: '1996-08-30',
    size: '312KB',
  },
];

// Resilient Static Fallback Array for Live GitHub Repository Feed (12 public repositories)
export const FALLBACK_REPOSITORIES: GitHubRepoItem[] = [
  {
    id: 101,
    name: 'Mental-Defrag',
    description: 'Zero-gravity spatial cognitive workspace built with Vite, TypeScript, 2D physics & Obsidian canvas.',
    html_url: 'https://github.com/watchknight/Mental-Defrag',
    stargazers_count: 24,
    language: 'TypeScript',
    updated_at: '2026-11-04T12:00:00Z',
    forks_count: 5,
  },
  {
    id: 102,
    name: 'DocLensBD',
    description: 'Cloud-backed document & healthcare platform engineered with Cloud Firestore & CI/CD pipelines.',
    html_url: 'https://github.com/watchknight/DocLensBD',
    stargazers_count: 19,
    language: 'TypeScript',
    updated_at: '2026-10-28T10:00:00Z',
    forks_count: 3,
  },
  {
    id: 103,
    name: 'Rannabanna',
    description: 'Full-stack localized Bengali culinary web application built with Vite and real-time cloud DB sync.',
    html_url: 'https://github.com/watchknight/Rannabanna',
    stargazers_count: 15,
    language: 'TypeScript',
    updated_at: '2026-10-15T09:00:00Z',
    forks_count: 2,
  },
  {
    id: 104,
    name: 'TrashTrail',
    description: 'Interactive scroll-driven environmental storytelling web application with GSAP ScrollTrigger.',
    html_url: 'https://github.com/watchknight/TrashTrail',
    stargazers_count: 18,
    language: 'JavaScript',
    updated_at: '2026-09-22T14:00:00Z',
    forks_count: 4,
  },
  {
    id: 105,
    name: 'BitForge',
    description: 'HTML5 2D canvas combat engine paired with Linux C/C++ Operating Systems IPC & fork() labs.',
    html_url: 'https://github.com/watchknight/BitForge',
    stargazers_count: 32,
    language: 'C++',
    updated_at: '2026-08-30T16:00:00Z',
    forks_count: 8,
  },
  {
    id: 106,
    name: 'hyperdeck-3d-particles',
    description: 'Volumetric wave synthesizer with 14,400+ points displaced on GPU via GLSL vertex shaders.',
    html_url: 'https://github.com/watchknight/hyperdeck-3d-particles',
    stargazers_count: 27,
    language: 'TypeScript',
    updated_at: '2026-08-14T08:00:00Z',
    forks_count: 6,
  },
  {
    id: 107,
    name: 'retro-os-window-manager',
    description: 'Authentic 90s cyberdeck desktop window manager with stepped transitions and phosphor optics.',
    html_url: 'https://github.com/watchknight/retro-os-window-manager',
    stargazers_count: 21,
    language: 'TypeScript',
    updated_at: '2026-07-19T11:00:00Z',
    forks_count: 4,
  },
  {
    id: 108,
    name: 'chiptune-audio-engine',
    description: 'Zero-asset procedural chiptune synthesizer and spatial panner using native Web Audio API.',
    html_url: 'https://github.com/watchknight/chiptune-audio-engine',
    stargazers_count: 16,
    language: 'TypeScript',
    updated_at: '2026-07-02T15:00:00Z',
    forks_count: 3,
  },
  {
    id: 109,
    name: 'extension-studio',
    description: 'Dedicated browser productivity suite with real-time DOM inspector & background service workers.',
    html_url: 'https://github.com/watchknight/extension-studio',
    stargazers_count: 14,
    language: 'TypeScript',
    updated_at: '2026-06-18T18:00:00Z',
    forks_count: 2,
  },
  {
    id: 110,
    name: 'posix-shm-kernel-lab',
    description: 'Linux C Operating Systems lab featuring POSIX shared memory, process hierarchies & spinlocks.',
    html_url: 'https://github.com/watchknight/posix-shm-kernel-lab',
    stargazers_count: 29,
    language: 'C',
    updated_at: '2026-05-24T12:00:00Z',
    forks_count: 7,
  },
  {
    id: 111,
    name: 'simd-json-stream',
    description: 'Zero-allocation JSON stream parser utilizing AVX-512 SIMD vector instructions for batch parsing.',
    html_url: 'https://github.com/watchknight/simd-json-stream',
    stargazers_count: 482,
    language: 'C++',
    updated_at: '2026-04-11T13:00:00Z',
    forks_count: 64,
  },
  {
    id: 112,
    name: 'shader-terrain-gen',
    description: 'Procedural heightmap terrain generation rendered via raymarching in pure fragment shaders.',
    html_url: 'https://github.com/watchknight/shader-terrain-gen',
    stargazers_count: 315,
    language: 'GLSL',
    updated_at: '2026-03-08T09:00:00Z',
    forks_count: 41,
  },
];

export type FilterTab = 'ALL_FILES' | 'TS_WEB' | 'C_CPP_OS' | 'CANVAS_LABS';
export type CommanderMode = 'dual' | 'featured' | 'github';

const GITHUB_CACHE_KEY = 'watchknight_github_repos_v1';
const GITHUB_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export const ProjectsView: React.FC<ProjectsViewProps> = ({ palette }) => {
  const bright = palette?.bright ?? '#c2cdb4';
  const voidCol = palette?.void ?? '#111712';
  const mid = palette?.mid ?? '#6e7d62';
  const dim = palette?.dim ?? '#2e3b2b';

  // Navigation mode: 'dual' (Norton Commander side-by-side) | 'featured' | 'github'
  const [commanderMode, setCommanderMode] = useState<CommanderMode>('dual');
  // Selected featured item index (0-4)
  const [selectedFeaturedIndex, setSelectedFeaturedIndex] = useState<number>(0);
  // Selected GitHub repo item id
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  // Filter tab for GitHub feed
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL_FILES');

  // Repos state & fetch status
  const [repos, setRepos] = useState<GitHubRepoItem[]>(FALLBACK_REPOSITORIES);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [repoSource, setRepoSource] = useState<'live' | 'cache' | 'fallback'>('fallback');

  const playClickSound = (freq: number = 640) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {
      // Safe audio trigger
    }
  };

  // Fetch live repositories with sessionStorage caching
  useEffect(() => {
    let isCancelled = false;

    const loadRepos = async () => {
      // Check client sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          const cachedStr = sessionStorage.getItem(GITHUB_CACHE_KEY);
          if (cachedStr) {
            const parsed = JSON.parse(cachedStr);
            if (Date.now() - (parsed.timestamp || 0) < GITHUB_CACHE_TTL && Array.isArray(parsed.data)) {
              if (!isCancelled) {
                setRepos(parsed.data);
                setRepoSource('cache');
              }
              return;
            }
          }
        } catch {
          // Ignore cache read error
        }
      }

      setIsFetching(true);
      try {
        const res = await fetch(
          'https://api.github.com/users/watchknight/repos?sort=updated&per_page=12',
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );

        if (!res.ok) {
          throw new Error(`GitHub API returned status ${res.status}`);
        }

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

          setRepos(formatted);
          setRepoSource('live');

          try {
            sessionStorage.setItem(
              GITHUB_CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: formatted })
            );
          } catch {
            // Ignore cache storage error
          }
        }
      } catch {
        // Fallback array already set as default state
        if (!isCancelled) {
          setRepoSource('fallback');
        }
      } finally {
        if (!isCancelled) {
          setIsFetching(false);
        }
      }
    };

    loadRepos();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtered repositories according to retro filter tabs
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      if (activeFilter === 'ALL_FILES') return true;

      const lang = (r.language || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const name = r.name.toLowerCase();

      if (activeFilter === 'TS_WEB') {
        return (
          lang.includes('typescript') ||
          lang.includes('javascript') ||
          lang.includes('html') ||
          desc.includes('web') ||
          desc.includes('vite') ||
          desc.includes('react')
        );
      }

      if (activeFilter === 'C_CPP_OS') {
        return (
          lang.includes('c') ||
          lang.includes('c++') ||
          lang.includes('rust') ||
          lang.includes('go') ||
          desc.includes('linux') ||
          desc.includes('posix') ||
          desc.includes('ipc') ||
          desc.includes('kernel') ||
          desc.includes('operating system')
        );
      }

      if (activeFilter === 'CANVAS_LABS') {
        return (
          lang.includes('glsl') ||
          desc.includes('canvas') ||
          desc.includes('particle') ||
          desc.includes('shader') ||
          desc.includes('three') ||
          name.includes('particle') ||
          name.includes('shader')
        );
      }

      return true;
    });
  }, [repos, activeFilter]);

  const selectedFeatured = FEATURED_PROJECTS[selectedFeaturedIndex] || FEATURED_PROJECTS[0];
  const selectedRepo =
    filteredRepos.find((r) => r.id === selectedRepoId) || filteredRepos[0] || repos[0];

  const showFeaturedPane = commanderMode === 'dual' || commanderMode === 'featured';
  const showGitHubPane = commanderMode === 'dual' || commanderMode === 'github';

  return (
    <article
      data-testid="retro-content-projects"
      className="flex flex-col gap-3 font-pixel select-text"
      style={{ color: bright }}
    >
      {/* 1. ARCHIVE COMMANDER TOP HEADER */}
      <div
        className="pb-1 border-b flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold tracking-wider"
        style={{ borderColor: mid, color: bright }}
      >
        <span>=== [2] MY PROJECTS // MY_PROJECTS.EXE ===</span>
        <span
          className="text-[7.5px] px-1 py-0.2 border"
          style={{ backgroundColor: dim, borderColor: mid, color: bright }}
        >
          DUAL-PANE COMMANDER
        </span>
      </div>

      {/* 2. COMMANDER MODE TOGGLE TOOLBAR */}
      <div
        className="flex items-center justify-between gap-1 p-1 border text-[7.5px] sm:text-[8px] flex-wrap"
        style={{ backgroundColor: `${dim}66`, borderColor: mid }}
        role="tablist"
        aria-label="Projects Commander Panes"
      >
        <div className="flex items-center gap-1 flex-wrap">
          {/* Dual View (Norton Commander default) */}
          <button
            type="button"
            role="tab"
            aria-selected={commanderMode === 'dual'}
            data-testid="retro-projects-tab-dual"
            onClick={() => {
              playClickSound(780);
              setCommanderMode('dual');
            }}
            className="px-2 py-0.5 border font-bold uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
            style={
              commanderMode === 'dual'
                ? { backgroundColor: bright, color: voidCol, borderColor: bright }
                : { backgroundColor: 'transparent', color: bright, borderColor: `${mid}66` }
            }
          >
            [☷ DUAL_PANES.EXE]
          </button>

          {/* Pane 1: Top Featured Archive */}
          <button
            type="button"
            role="tab"
            aria-selected={commanderMode === 'featured'}
            data-testid="retro-projects-tab-featured"
            onClick={() => {
              playClickSound(720);
              setCommanderMode('featured');
            }}
            className="px-2 py-0.5 border font-bold uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
            style={
              commanderMode === 'featured'
                ? { backgroundColor: bright, color: voidCol, borderColor: bright }
                : { backgroundColor: 'transparent', color: bright, borderColor: `${mid}66` }
            }
          >
            [★ FEATURED_ARCHIVE.EXE]
          </button>

          {/* Pane 2: Live GitHub Sync */}
          <button
            type="button"
            role="tab"
            aria-selected={commanderMode === 'github'}
            data-testid="retro-projects-tab-github"
            onClick={() => {
              playClickSound(640);
              setCommanderMode('github');
            }}
            className="px-2 py-0.5 border font-bold uppercase transition-none cursor-pointer flex items-center gap-1 outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
            style={
              commanderMode === 'github'
                ? { backgroundColor: bright, color: voidCol, borderColor: bright }
                : { backgroundColor: 'transparent', color: bright, borderColor: `${mid}66` }
            }
          >
            <span>[⇄ LIVE_GITHUB.FEED]</span>
            <span
              className="w-1.5 h-1.5 inline-block"
              style={{
                backgroundColor: bright,
              }}
            />
          </button>
        </div>

        <span className="hidden sm:inline text-[7px]" style={{ color: mid }}>
          {commanderMode === 'dual'
            ? 'DUAL COMMANDER // 5 CARTRIDGES + LIVE SYNC'
            : commanderMode === 'featured'
            ? '5 CURATED CARTRIDGES'
            : `FEED: ${repoSource.toUpperCase()}`}
        </span>
      </div>

      {/* 3. DUAL-PANE FILE COMMANDER BODY */}
      <div className={`grid grid-cols-1 ${commanderMode === 'dual' ? 'xl:grid-cols-2' : ''} gap-2.5`}>
        {/* PANE 1: TOP FEATURED ARCHIVE (Curated Flagship Case Studies) */}
        {showFeaturedPane && (
          <div
            data-testid="retro-projects-pane-featured"
            className="border flex flex-col p-2 gap-2"
            style={{ backgroundColor: `${dim}33`, borderColor: mid }}
          >
            {/* Subheader / Volume Information */}
            <div
              className="flex items-center justify-between text-[7px] sm:text-[7.5px] pb-1 border-b uppercase font-bold"
              style={{ borderColor: `${mid}60`, color: bright }}
            >
              <span>VOLUME: ARCHIVE_C:\FEATURED\</span>
              <span style={{ color: mid }}>5 FLAGSHIP CASE STUDIES</span>
            </div>

            {/* Featured Cartridges List */}
            <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-0.5">
              {FEATURED_PROJECTS.map((proj, idx) => {
                const isSelected = selectedFeaturedIndex === idx;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    data-testid={`retro-featured-item-${idx}`}
                    onClick={() => {
                      playClickSound(620 + idx * 30);
                      setSelectedFeaturedIndex(idx);
                    }}
                    className="w-full text-left p-1 border flex items-center justify-between gap-1 transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                    style={
                      isSelected
                        ? { backgroundColor: dim, borderColor: bright, color: bright }
                        : { backgroundColor: 'transparent', borderColor: `${mid}40`, color: `${bright}cc` }
                    }
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-bold text-[7.5px] sm:text-[8px]">
                        {isSelected ? '►' : ' '}
                      </span>
                      <span className="truncate text-[7.5px] sm:text-[8px] font-bold">
                        {proj.fileCode}
                      </span>
                    </div>
                    <span className="text-[6.5px] shrink-0 font-mono" style={{ color: isSelected ? bright : mid }}>
                      {proj.size}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Featured Case Study Dossier */}
            <div
              className="border p-2 flex flex-col gap-2"
              style={{ backgroundColor: `${dim}40`, borderColor: mid }}
            >
              <div className="border-b pb-1 flex items-center justify-between flex-wrap gap-1" style={{ borderColor: `${mid}60` }}>
                <span className="font-bold text-[8.5px] sm:text-[9.5px]" style={{ color: bright }}>
                  {selectedFeatured.fileCode}
                </span>
                <span
                  className="px-1 py-0.2 border text-[6.5px] sm:text-[7px] font-bold"
                  style={{ backgroundColor: bright, color: voidCol, borderColor: bright }}
                >
                  [{selectedFeatured.status}]
                </span>
              </div>

              {/* Tagline */}
              <div className="text-[7.5px] sm:text-[8px] italic" style={{ color: `${bright}cc` }}>
                &gt; {selectedFeatured.tagline}
              </div>

              {/* Problem / Architecture / Impact Breakdown */}
              <div className="flex flex-col gap-1.5 text-[7px] sm:text-[7.5px] leading-relaxed">
                {/* 1. PROBLEM */}
                <div className="p-1.5 border" style={{ backgroundColor: `${voidCol}80`, borderColor: `${mid}50` }}>
                  <div className="font-bold uppercase pb-0.5" style={{ color: bright }}>
                    [PROBLEM STATEMENT]:
                  </div>
                  <p style={{ color: `${bright}dd` }}>{selectedFeatured.problem}</p>
                </div>

                {/* 2. ARCHITECTURE */}
                <div className="p-1.5 border" style={{ backgroundColor: `${voidCol}80`, borderColor: `${mid}50` }}>
                  <div className="font-bold uppercase pb-0.5" style={{ color: bright }}>
                    [SYSTEM ARCHITECTURE]:
                  </div>
                  <p style={{ color: `${bright}dd` }}>{selectedFeatured.architecture}</p>
                </div>

                {/* 3. IMPACT */}
                <div className="p-1.5 border" style={{ backgroundColor: `${voidCol}80`, borderColor: `${mid}50` }}>
                  <div className="font-bold uppercase pb-0.5" style={{ color: bright }}>
                    [ENGINEERING IMPACT &amp; METRICS]:
                  </div>
                  <p style={{ color: `${bright}dd` }}>{selectedFeatured.impact}</p>
                </div>

                {/* STACK */}
                <div className="text-[6.5px] sm:text-[7px]" style={{ color: mid }}>
                  STACK: {selectedFeatured.stack}
                </div>
              </div>

              {/* Direct Links: [RUN_DEMO.EXE] and [SOURCE_CODE] */}
              <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: `${mid}60` }}>
                <a
                  href={selectedFeatured.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="retro-btn-run-demo"
                  onClick={() => playClickSound(880)}
                  className="px-2.5 py-1 border font-bold text-[7.5px] sm:text-[8px] uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: bright,
                    color: voidCol,
                    borderColor: bright,
                    boxShadow: `1px 1px 0px 0px ${voidCol}`,
                  }}
                >
                  [RUN_DEMO.EXE]
                </a>

                <a
                  href={selectedFeatured.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="retro-btn-source-code"
                  onClick={() => playClickSound(720)}
                  className="px-2.5 py-1 border font-bold text-[7.5px] sm:text-[8px] uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: 'transparent',
                    color: bright,
                    borderColor: bright,
                  }}
                >
                  [SOURCE_CODE]
                </a>
              </div>
            </div>
          </div>
        )}

        {/* PANE 2: LIVE GITHUB REPOSITORY FEED (Live GitHub Sync + Inspectable Rows) */}
        {showGitHubPane && (
          <div
            data-testid="retro-projects-pane-github"
            className="border flex flex-col p-2 gap-2"
            style={{ backgroundColor: `${dim}33`, borderColor: mid }}
          >
            {/* Subheader / Volume Information */}
            <div
              className="flex items-center justify-between text-[7px] sm:text-[7.5px] pb-1 border-b uppercase font-bold"
              style={{ borderColor: `${mid}60`, color: bright }}
            >
              <span>VOLUME: GITHUB_D:\LIVE_FEED\</span>
              <span style={{ color: mid }}>
                {isFetching ? 'SYNCING GITHUB...' : `SRC: ${repoSource.toUpperCase()} (${filteredRepos.length} REPOS)`}
              </span>
            </div>

            {/* Retro Filter Tabs */}
            <div className="flex flex-wrap gap-1 text-[6.5px] sm:text-[7px] pb-1 border-b" style={{ borderColor: `${mid}40` }}>
              {(['ALL_FILES', 'TS_WEB', 'C_CPP_OS', 'CANVAS_LABS'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  data-testid={`retro-repo-filter-${tab}`}
                  onClick={() => {
                    playClickSound(580);
                    setActiveFilter(tab);
                  }}
                  className="px-1.5 py-0.5 border transition-none cursor-pointer uppercase outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                  style={
                    activeFilter === tab
                      ? { backgroundColor: bright, color: voidCol, borderColor: bright, fontWeight: 'bold' }
                      : { backgroundColor: 'transparent', color: bright, borderColor: `${mid}66` }
                  }
                >
                  [{tab}]
                </button>
              ))}
            </div>

            {/* Inspectable .PRG Directory Rows */}
            <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-0.5">
              {filteredRepos.map((repo) => {
                const isSelected = selectedRepo.id === repo.id;
                const repoUrl = repo.html_url || `https://github.com/watchknight/${repo.name}`;

                return (
                  <div
                    key={repo.id}
                    data-testid={`retro-github-repo-row-${repo.name}`}
                    className="p-1.5 border flex flex-col gap-1 transition-none"
                    style={{
                      backgroundColor: isSelected ? `${dim}80` : `${voidCol}80`,
                      borderColor: isSelected ? bright : `${mid}50`,
                    }}
                  >
                    {/* Top Row: Select button + Name + Star Count + Language + Last Commit Date */}
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound(640);
                          setSelectedRepoId(repo.id);
                        }}
                        className="flex items-center gap-1 text-left font-bold text-[7.5px] sm:text-[8px] cursor-pointer hover:underline outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                        style={{ color: bright }}
                      >
                        <span>{isSelected ? '►' : '•'}</span>
                        <span>{`${repo.name}.PRG`}</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-[6.5px] sm:text-[7px] font-mono">
                        <span style={{ color: mid }}>{`★ ${repo.stargazers_count}`}</span>
                        <span
                          className="px-1 py-0.2 border"
                          style={{ borderColor: `${mid}50`, color: bright }}
                        >
                          {`[${repo.language || 'RAW'}]`}
                        </span>
                        <span className="text-[6.5px]" style={{ color: mid }}>
                          {`UPD: ${repo.updated_at.slice(0, 10)}`}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[7px] sm:text-[7.5px] leading-tight" style={{ color: `${bright}cc` }}>
                      {repo.description || 'Public GitHub repository compiled under @watchknight.'}
                    </p>

                    {/* Direct link to https://github.com/watchknight/ */}
                    <div className="flex items-center justify-between text-[6.5px] sm:text-[7px] pt-1 border-t" style={{ borderColor: `${mid}30` }}>
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`retro-github-link-${repo.name}`}
                        onClick={() => playClickSound(800)}
                        className="hover:underline flex items-center gap-1 font-bold outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                        style={{ color: bright }}
                      >
                        {`> ${repoUrl}`}
                      </a>
                      <span style={{ color: mid }}>FORMAT: .PRG</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected GitHub Repo Inspector Card */}
            <div
              className="border p-2 flex flex-col gap-1.5"
              style={{ backgroundColor: `${dim}40`, borderColor: mid }}
            >
              <div className="border-b pb-1 flex items-center justify-between flex-wrap gap-1" style={{ borderColor: `${mid}60` }}>
                <span className="font-bold text-[8px] sm:text-[9px]" style={{ color: bright }}>
                  {`INSPECT: ${selectedRepo.name}.PRG`}
                </span>
                <span
                  className="px-1 py-0.2 border text-[6.5px] sm:text-[7px] font-bold"
                  style={{ backgroundColor: bright, color: voidCol, borderColor: bright }}
                >
                  ★ {selectedRepo.stargazers_count} STARS
                </span>
              </div>

              <div className="text-[7px] leading-relaxed" style={{ color: `${bright}dd` }}>
                {selectedRepo.description || 'Raw production module compiled directly from developer repository.'}
              </div>

              <div className="grid grid-cols-2 gap-1 text-[6.5px] sm:text-[7px]">
                <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
                  <span style={{ color: mid }}>LANGUAGE: </span>
                  <strong style={{ color: bright }}>{selectedRepo.language || 'Unknown'}</strong>
                </div>
                <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
                  <span style={{ color: mid }}>LAST UPDATED: </span>
                  <strong style={{ color: bright }}>{selectedRepo.updated_at.slice(0, 10)}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: `${mid}60` }}>
                <a
                  href={selectedRepo.html_url || `https://github.com/watchknight/${selectedRepo.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="retro-btn-open-repo"
                  onClick={() => playClickSound(840)}
                  className="px-2.5 py-1 border font-bold text-[7.5px] sm:text-[8px] uppercase transition-none cursor-pointer outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-[#c2cdb4] focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: bright,
                    color: voidCol,
                    borderColor: bright,
                    boxShadow: `1px 1px 0px 0px ${voidCol}`,
                  }}
                >
                  [OPEN_GITHUB.EXE]
                </a>
                <span className="text-[6.5px]" style={{ color: mid }}>
                  DIRECT: https://github.com/watchknight/
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SYSTEM SUBSYSTEMS & HARDWARE LAB ARCHIVE (Backwards Compatibility & Full Engine Suite) */}
      <div
        className="p-2 border flex flex-col gap-1.5"
        style={{ backgroundColor: `${dim}20`, borderColor: `${mid}60` }}
      >
        <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-bold uppercase pb-0.5 border-b" style={{ borderColor: `${mid}40` }}>
          <span>&gt; SYSTEM SUBSYSTEMS &amp; ARCHITECTURAL LABS</span>
          <span style={{ color: mid }}>ONLINE ROMS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[7px] sm:text-[7.5px]">
          {/* Subsystem 1: HYPERDECK 3D PARTICLE ENGINE */}
          <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
            <div className="font-bold" style={{ color: bright }}>
              1. HYPERDECK 3D PARTICLE ENGINE
            </div>
            <div style={{ color: `${bright}bb` }}>
              Volumetric wave synthesizer with 14,400+ points displaced on the GPU via GLSL vertex shaders.
            </div>
            <div className="text-[6.5px]" style={{ color: mid }}>
              STACK: THREE.JS // GLSL // WEBGL 2.0 // GSAP
            </div>
          </div>

          {/* Subsystem 2: RETRO 90S OS WINDOW MANAGER */}
          <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
            <div className="font-bold" style={{ color: bright }}>
              2. RETRO 90S OS WINDOW MANAGER
            </div>
            <div style={{ color: `${bright}bb` }}>
              Full cyberdeck GUI with roving keyboard navigation (1-3, arrows, Enter/Esc), stepped CSS clip-path transitions.
            </div>
            <div className="text-[6.5px]" style={{ color: mid }}>
              STACK: REACT 18 // TYPESCRIPT // TAILWINDCSS
            </div>
          </div>

          {/* Subsystem 3: PROCEDURAL CHIPTUNE AUDIO ENGINE */}
          <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
            <div className="font-bold" style={{ color: bright }}>
              3. PROCEDURAL CHIPTUNE AUDIO ENGINE
            </div>
            <div style={{ color: `${bright}bb` }}>
              Native Web Audio API 4-channel retro chiptune synthesizer and 3D spatial panner. Zero external audio files.
            </div>
            <div className="text-[6.5px]" style={{ color: mid }}>
              STACK: WEB AUDIO API // ANALYSERNODE // GSAP TICKER
            </div>
          </div>

          {/* Subsystem 4: DEDICATED BROWSER EXTENSION STUDIO */}
          <div className="p-1 border" style={{ borderColor: `${mid}40`, backgroundColor: `${voidCol}60` }}>
            <div className="font-bold" style={{ color: bright }}>
              4. DEDICATED BROWSER EXTENSION STUDIO
            </div>
            <div style={{ color: `${bright}bb` }}>
              Keyboard-first browser productivity suite with real-time DOM inspection and secure background service workers.
            </div>
            <div className="text-[6.5px]" style={{ color: mid }}>
              STACK: MANIFEST V3 // WEBSOCKETS // TYPESCRIPT
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProjectsView;
