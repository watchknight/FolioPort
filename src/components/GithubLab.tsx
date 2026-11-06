import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { audio } from '../utils/audio';
import { LiquidGlassCard } from './ui/LiquidGlassCard';
import { MagneticButton } from './ui/MagneticButton';
import { GithubIcon } from './ui/Icons';
import {
  FlaskConical,
  Star,
  GitFork,
  ArrowUpRight,
  RefreshCw,
  Search,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

export interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
  category: 'TypeScript/JS' | 'C/C++' | 'HTML/Canvas' | 'Full-Stack';
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  'C++': '#F34B7D',
  C: '#555555',
  'HTML/Canvas': '#E34C26',
  HTML: '#E34C26',
  Python: '#3572A5',
  Rust: '#DEA584',
  Go: '#00ADD8',
  Shell: '#89E051',
  CSS: '#563D7C'
};

const CACHE_KEY = 'watchknight_repos_cache_v2';
const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes TTL

// Curated Fallback & Metadata Enrichment Dataset
const FALLBACK_REPOS: GithubRepo[] = [
  {
    id: 101,
    name: 'Mental-Defrag',
    description: 'Zero-gravity spatial cognitive canvas & physics thought sandbox with Obsidian .canvas AST integration and vector clustering.',
    html_url: 'https://github.com/watchknight/Mental-Defrag',
    language: 'TypeScript',
    stargazers_count: 14,
    forks_count: 3,
    updated_at: '2026-10-28T12:00:00Z',
    topics: ['matter-js', 'obsidian-canvas', 'spatial-web', 'vector-embeddings'],
    category: 'TypeScript/JS'
  },
  {
    id: 102,
    name: 'DocLensBD',
    description: 'Cloud-backed medical document management platform with Cloud Firestore real-time listeners and automated GitHub Actions CI/CD pipelines.',
    html_url: 'https://github.com/watchknight/DocLensBD',
    language: 'TypeScript',
    stargazers_count: 9,
    forks_count: 2,
    updated_at: '2026-10-22T09:30:00Z',
    topics: ['firestore', 'react', 'typescript', 'ci-cd', 'pwa'],
    category: 'Full-Stack'
  },
  {
    id: 103,
    name: 'Rannabanna',
    description: 'Localized Bengali culinary platform engineered with Vite deployment, cloud database synchronization, and offline-first PWA caching.',
    html_url: 'https://github.com/watchknight/Rannabanna',
    language: 'JavaScript',
    stargazers_count: 11,
    forks_count: 2,
    updated_at: '2026-10-15T16:45:00Z',
    topics: ['react', 'vite', 'bengali-nlp', 'cloud-sync', 'tailwind-css'],
    category: 'Full-Stack'
  },
  {
    id: 104,
    name: 'TrashTrail',
    description: 'Scroll-driven interactive storytelling web architecture powered by vanilla JavaScript, GSAP, and ScrollTrigger.',
    html_url: 'https://github.com/watchknight/TrashTrail',
    language: 'JavaScript',
    stargazers_count: 12,
    forks_count: 4,
    updated_at: '2026-09-28T14:10:00Z',
    topics: ['gsap', 'scrolltrigger', 'vanilla-js', 'parallax', 'storytelling'],
    category: 'HTML/Canvas'
  },
  {
    id: 105,
    name: 'Linux-OS-Kernel-Labs',
    description: 'Operating Systems implementations in Linux C/C++: IPC pipes, fork() process trees, and POSIX shared memory buffers (shmget/shmat).',
    html_url: 'https://github.com/watchknight/Linux-OS-Kernel-Labs',
    language: 'C++',
    stargazers_count: 23,
    forks_count: 7,
    updated_at: '2026-09-24T18:20:00Z',
    topics: ['c', 'cpp', 'linux-kernel', 'posix-shm', 'ipc-pipes'],
    category: 'C/C++'
  },
  {
    id: 106,
    name: 'NeonVanguard-2D',
    description: 'HTML5 2D canvas combat engine featuring piercing projectile raycasting, particle bursts, and recursive chain-lightning physics.',
    html_url: 'https://github.com/watchknight/NeonVanguard-2D',
    language: 'HTML/Canvas',
    stargazers_count: 18,
    forks_count: 5,
    updated_at: '2026-09-20T11:00:00Z',
    topics: ['html5-canvas', 'combat-engine', 'chain-lightning', 'particles'],
    category: 'HTML/Canvas'
  },
  {
    id: 107,
    name: 'BitForge',
    description: 'Low-level binary protocol inspector and buffer serialization toolkit with bit-level memory layout visualization.',
    html_url: 'https://github.com/watchknight/BitForge',
    language: 'TypeScript',
    stargazers_count: 8,
    forks_count: 1,
    updated_at: '2026-09-18T13:40:00Z',
    topics: ['binary-protocol', 'buffers', 'webassembly', 'systems'],
    category: 'TypeScript/JS'
  },
  {
    id: 108,
    name: 'FocusLab',
    description: 'Developer cognitive telemetry suite measuring deep work intervals with localized IndexedDB state persistence.',
    html_url: 'https://github.com/watchknight/FocusLab',
    language: 'TypeScript',
    stargazers_count: 7,
    forks_count: 1,
    updated_at: '2026-08-30T17:15:00Z',
    topics: ['react', 'indexeddb', 'telemetry', 'productivity'],
    category: 'TypeScript/JS'
  },
  {
    id: 109,
    name: 'POSHRA',
    description: 'Cloud-enabled decentralized resource scheduling engine with reactive UI and atomic optimistic updates.',
    html_url: 'https://github.com/watchknight/POSHRA',
    language: 'TypeScript',
    stargazers_count: 6,
    forks_count: 1,
    updated_at: '2026-08-20T08:50:00Z',
    topics: ['typescript', 'cloud-functions', 'distributed', 'reactive-ui'],
    category: 'Full-Stack'
  },
  {
    id: 110,
    name: 'FocusGuard',
    description: 'Contextual distraction blocker and background tab throttler optimizing browser memory consumption.',
    html_url: 'https://github.com/watchknight/FocusGuard',
    language: 'JavaScript',
    stargazers_count: 5,
    forks_count: 0,
    updated_at: '2026-08-12T19:25:00Z',
    topics: ['browser-extension', 'memory-optimization', 'productivity'],
    category: 'TypeScript/JS'
  },
  {
    id: 111,
    name: 'PureFeed',
    description: 'Lightweight algorithmic news aggregator stripping tracking cookies and ad-bloat for distilled reading.',
    html_url: 'https://github.com/watchknight/PureFeed',
    language: 'JavaScript',
    stargazers_count: 4,
    forks_count: 1,
    updated_at: '2026-08-05T14:30:00Z',
    topics: ['javascript', 'reader-mode', 'rss', 'privacy'],
    category: 'TypeScript/JS'
  },
  {
    id: 112,
    name: 'watchknight',
    description: 'Core developer profile configuration, Linux dotfiles, system automation scripts, and GitHub workflow pipelines.',
    html_url: 'https://github.com/watchknight/watchknight',
    language: 'C++',
    stargazers_count: 15,
    forks_count: 3,
    updated_at: '2026-10-31T17:19:00Z',
    topics: ['linux', 'dotfiles', 'automation', 'posix'],
    category: 'C/C++'
  }
];

// Enricher dictionary for repos that might have null descriptions from GitHub API
const REPO_DESCRIPTIONS: Record<string, { desc: string; category: GithubRepo['category']; language?: string; topics?: string[] }> = {
  'Mental-Defrag': {
    desc: 'Zero-gravity spatial cognitive canvas & physics thought sandbox with Obsidian .canvas AST integration and vector clustering.',
    category: 'TypeScript/JS',
    language: 'TypeScript',
    topics: ['matter-js', 'obsidian-canvas', 'spatial-web']
  },
  'DocLensBD': {
    desc: 'Cloud-backed medical document management platform with Cloud Firestore real-time listeners and automated GitHub Actions CI/CD pipelines.',
    category: 'Full-Stack',
    language: 'TypeScript',
    topics: ['firestore', 'react', 'ci-cd']
  },
  'Rannabanna': {
    desc: 'Localized Bengali culinary platform engineered with Vite deployment, cloud database synchronization, and offline-first PWA caching.',
    category: 'Full-Stack',
    language: 'JavaScript',
    topics: ['react', 'vite', 'bengali-nlp']
  },
  'TrashTrail': {
    desc: 'Scroll-driven interactive storytelling web architecture powered by vanilla JavaScript, GSAP, and ScrollTrigger.',
    category: 'HTML/Canvas',
    language: 'JavaScript',
    topics: ['gsap', 'scrolltrigger', 'vanilla-js']
  },
  'BitForge': {
    desc: 'Low-level binary protocol inspector and buffer serialization toolkit with bit-level memory layout visualization.',
    category: 'TypeScript/JS',
    language: 'TypeScript',
    topics: ['binary-protocol', 'buffers', 'systems']
  },
  'FocusLab': {
    desc: 'Developer cognitive telemetry suite measuring deep work intervals with localized IndexedDB state persistence.',
    category: 'TypeScript/JS',
    language: 'TypeScript',
    topics: ['react', 'indexeddb', 'telemetry']
  },
  'POSHRA': {
    desc: 'Cloud-enabled decentralized resource scheduling engine with reactive UI and atomic optimistic updates.',
    category: 'Full-Stack',
    language: 'TypeScript',
    topics: ['typescript', 'cloud-functions', 'reactive-ui']
  },
  'FocusGuard': {
    desc: 'Contextual distraction blocker and background tab throttler optimizing browser memory consumption.',
    category: 'TypeScript/JS',
    language: 'JavaScript',
    topics: ['browser-extension', 'memory-optimization']
  },
  'PureFeed': {
    desc: 'Lightweight algorithmic news aggregator stripping tracking cookies and ad-bloat for distilled reading.',
    category: 'TypeScript/JS',
    language: 'JavaScript',
    topics: ['reader-mode', 'rss', 'privacy']
  },
  'MyPortfolio': {
    desc: 'Personal portfolio codebase featuring GSAP inertia, interactive canvas shaders, and responsive UI components.',
    category: 'HTML/Canvas',
    language: 'JavaScript',
    topics: ['react', 'gsap', 'tailwind-css']
  },
  'watchknight': {
    desc: 'Core developer profile configuration, Linux dotfiles, system automation scripts, and GitHub workflow pipelines.',
    category: 'C/C++',
    language: 'C++',
    topics: ['linux', 'dotfiles', 'automation']
  },
  'Linux-OS-Kernel-Labs': {
    desc: 'Operating Systems implementations in Linux C/C++: IPC pipes, fork() process trees, and POSIX shared memory buffers (shmget/shmat).',
    category: 'C/C++',
    language: 'C++',
    topics: ['c', 'cpp', 'linux-kernel', 'posix-shm', 'ipc-pipes']
  },
  'NeonVanguard-2D': {
    desc: 'HTML5 2D canvas combat engine featuring piercing projectile raycasting, particle bursts, and recursive chain-lightning physics.',
    category: 'HTML/Canvas',
    language: 'HTML/Canvas',
    topics: ['html5-canvas', 'combat-engine', 'chain-lightning', 'particles']
  }
};

type FilterCategory = 'All' | 'TypeScript/JS' | 'C/C++' | 'HTML/Canvas' | 'Full-Stack';

export const GithubLab: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [repos, setRepos] = useState<GithubRepo[]>(FALLBACK_REPOS);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'fallback'>('fallback');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Human-readable relative time formatter
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 1) return 'Updated today';
      if (diffDays === 1) return 'Updated yesterday';
      if (diffDays < 30) return `Updated ${diffDays} days ago`;
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) return `Updated ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
      return `Updated ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    } catch {
      return 'Recently updated';
    }
  };

  // Helper to categorize raw GitHub repo
  const inferCategory = (name: string, lang: string | null, topics: string[]): GithubRepo['category'] => {
    const lowerName = name.toLowerCase();
    const lowerLang = (lang || '').toLowerCase();

    if (REPO_DESCRIPTIONS[name]?.category) {
      return REPO_DESCRIPTIONS[name].category;
    }

    if (lowerLang.includes('c++') || lowerLang.includes('c') || lowerName.includes('kernel') || lowerName.includes('posix') || lowerName.includes('os')) {
      return 'C/C++';
    }
    if (lowerLang.includes('canvas') || lowerLang.includes('html') || lowerName.includes('trail') || lowerName.includes('vanguard')) {
      return 'HTML/Canvas';
    }
    if (lowerName.includes('doclens') || lowerName.includes('ranna') || lowerName.includes('poshra') || topics.includes('full-stack') || topics.includes('firestore')) {
      return 'Full-Stack';
    }
    return 'TypeScript/JS';
  };

  // Fetch repositories with session cache & fallback logic
  const fetchRepositories = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    // 1. Check Session Storage Cache
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - (parsed.timestamp || 0);
          if (age < CACHE_TTL_MS && Array.isArray(parsed.data) && parsed.data.length > 0) {
            setRepos(parsed.data);
            setDataSource('cache');
            setLastRefreshed(new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Continue to network fetch if cache read errors
      }
    }

    // 2. Network Fetch from GitHub API
    try {
      const response = await fetch('https://api.github.com/users/watchknight/repos?sort=updated&per_page=12', {
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const rawData = await response.json();

      if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('Invalid repository payload from GitHub API');
      }

      // 3. Transform and Enrich Live Data
      const processed: GithubRepo[] = rawData.map((item: any) => {
        const metadata = REPO_DESCRIPTIONS[item.name];
        const category = inferCategory(item.name, item.language, item.topics || []);
        const fallbackMatch = FALLBACK_REPOS.find((f) => f.name.toLowerCase() === item.name.toLowerCase());

        return {
          id: item.id,
          name: item.name,
          description: item.description || metadata?.desc || fallbackMatch?.description || `${item.name} engineering repository by @watchknight.`,
          html_url: item.html_url || `https://github.com/watchknight/${item.name}`,
          language: item.language || metadata?.language || fallbackMatch?.language || 'TypeScript',
          stargazers_count: item.stargazers_count || fallbackMatch?.stargazers_count || 0,
          forks_count: item.forks_count || fallbackMatch?.forks_count || 0,
          updated_at: item.updated_at || new Date().toISOString(),
          topics: (item.topics && item.topics.length > 0) ? item.topics : metadata?.topics || fallbackMatch?.topics || ['engineering', 'systems'],
          category
        };
      });

      // 4. Merge flagship lab repos ensuring none are arbitrarily omitted
      const existingNames = new Set(processed.map((p) => p.name.toLowerCase()));
      const supplementary = FALLBACK_REPOS.filter((f) => !existingNames.has(f.name.toLowerCase()));
      const combined = [...processed, ...supplementary];

      // Save to Session Storage
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: combined
          })
        );
      } catch {
        // Storage might be disabled in private mode; silently ignore
      }

      setRepos(combined);
      setDataSource('live');
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      // 5. Graceful Fallback Dataset on Rate Limit (403) or Network Failure
      // Check if previously cached data exists first (even if stale) to maximize live fidelity
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.data) && parsed.data.length > 0) {
            setRepos(parsed.data);
            setDataSource('cache');
            setLastRefreshed(`Cache (${new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
            return;
          }
        }
      } catch {
        // Fall through to hardcoded fallback dataset
      }

      setRepos(FALLBACK_REPOS);
      setDataSource('fallback');
      setLastRefreshed('Fallback Dataset');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRepositories(false);
  }, [fetchRepositories]);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      All: repos.length,
      'TypeScript/JS': 0,
      'C/C++': 0,
      'HTML/Canvas': 0,
      'Full-Stack': 0
    };

    repos.forEach((repo) => {
      if (counts[repo.category] !== undefined) {
        counts[repo.category]++;
      }
    });

    return counts;
  }, [repos]);

  // Filtered and searched repositories
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      const matchesCategory = activeFilter === 'All' || repo.category === activeFilter;
      const matchesSearch =
        searchQuery === '' ||
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [repos, activeFilter, searchQuery]);

  // Smooth layout animation on filter change
  useEffect(() => {
    if (gridRef.current && gridRef.current.children.length > 0) {
      gsap.killTweensOf(gridRef.current.children);
      gsap.fromTo(
        gridRef.current.children,
        { autoAlpha: 0, y: 15, scale: 0.98, force3D: true },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          stagger: 0.04,
          ease: 'power3.out',
        }
      );
    }
    return () => {
      if (gridRef.current) {
        gsap.killTweensOf(gridRef.current.children);
      }
    };
  }, [activeFilter, searchQuery]);

  return (
    <section ref={sectionRef} id="lab" className="py-24 md:py-32 relative bg-obsidian-surface/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 border-b border-white/10 pb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-fluid-micro text-amber-warm uppercase tracking-widest mb-3">
              <FlaskConical className="w-4 h-4" />
              <span>Live GitHub Repository Explorer • @watchknight</span>
            </div>
            <h2 className="font-display font-extrabold text-fluid-h1 text-white tracking-tight uppercase">
              GITHUB <span className="text-amber-warm">LAB</span> & OPEN SOURCE
            </h2>
            <p className="font-body text-fluid-body text-slate-400 max-w-2xl mt-2 leading-relaxed">
              Live cryptographic telemetry and repository stream directly queried from GitHub. Spanning high-throughput C/C++ OS primitives, spatial physics engines, and localized web architectures.
            </p>
          </div>

          {/* Telemetry Status Strip & Manual Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-carbon/80 border border-white/10 text-fluid-micro font-mono">
              {dataSource === 'live' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-semibold">Live GitHub API Connected</span>
                </>
              )}
              {dataSource === 'cache' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-mint" />
                  <span className="text-cyan-mint font-semibold">Smart Session Cache Active</span>
                </>
              )}
              {dataSource === 'fallback' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-warm" />
                  <span className="text-amber-warm font-semibold">Rate-Limit Resilient Fallback</span>
                </>
              )}
              {lastRefreshed && (
                <span className="text-slate-500 hidden sm:inline">[{lastRefreshed}]</span>
              )}
            </div>

            <button
              onClick={() => fetchRepositories(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-mono text-fluid-micro transition-all active:scale-95 disabled:opacity-50"
              title="Force re-query GitHub API"
              aria-label="Refresh repository data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-warm ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <a
              href="https://github.com/watchknight?tab=repositories"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-warm text-obsidian font-mono text-fluid-micro font-bold shadow-glow-amber hover:bg-[#ffc42e] transition-all active:scale-95"
              aria-label="View all repositories on GitHub (@watchknight)"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>View All Repos</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Filter Controls & Live Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'TypeScript/JS', 'C/C++', 'HTML/Canvas', 'Full-Stack'] as FilterCategory[]).map((filter) => {
              const isActive = activeFilter === filter;
              const count = categoryCounts[filter];
              return (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    audio.playChord();
                  }}
                  onMouseEnter={() => audio.playTick()}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-fluid-micro transition-all duration-200 border ${
                    isActive
                      ? 'bg-amber-warm/15 text-amber-warm border-amber-warm/50 shadow-[0_0_15px_rgba(255,183,3,0.2)] font-bold'
                      : 'bg-carbon/60 text-slate-400 hover:text-slate-200 border-white/10 hover:border-white/20'
                  }`}
                  aria-label={`Filter by ${filter} category (${count} repositories)`}
                >
                  <span>{filter}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-amber-warm text-obsidian font-bold' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repos, tags, or stack..."
              aria-label="Search repositories, tags, or technology stack"
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-carbon/70 border border-white/10 font-mono text-fluid-micro text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-warm/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear repository search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Repository Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {filteredRepos.map((repo) => {
            const langColor = LANGUAGE_COLORS[repo.language] || '#DF6C4F';
            return (
              <LiquidGlassCard
                key={repo.id}
                spotlightColor="amber"
                spotlightRadius={420}
                spotlightOpacity={0.14}
                onMouseEnter={() => audio.playTick()}
                className="p-5 sm:p-6 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Category & Language Badge */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-fluid-micro font-mono bg-white/5 border border-white/10 text-slate-300">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: langColor }}
                      />
                      <span>{repo.language}</span>
                    </span>

                    <span className="font-mono text-[10px] text-slate-500">
                      {formatRelativeTime(repo.updated_at)}
                    </span>
                  </div>

                  {/* Repository Name & External Icon */}
                  <div className="mb-2.5">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group/link inline-flex items-center gap-1.5"
                    >
                      <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover/link:text-amber-warm transition-colors truncate">
                        {repo.name}
                      </h3>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover/link:text-amber-warm transition-colors shrink-0" />
                    </a>
                  </div>

                  {/* Description */}
                  <p className="font-body text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed line-clamp-3">
                    {repo.description}
                  </p>

                  {/* Topic Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {repo.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px] text-slate-400 border border-white/5"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Telemetry & Magnetic Repository Link */}
                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 font-mono text-fluid-micro text-slate-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-warm fill-amber-warm/20" />
                      <span>{repo.stargazers_count}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-slate-400" />
                      <span>{repo.forks_count}</span>
                    </span>
                  </div>

                  {/* Direct Magnetic Link to Repository */}
                  <MagneticButton
                    as="a"
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    strength={0.25}
                    innerStrength={0.15}
                    className="px-3 py-1.5 rounded-lg bg-carbon-elevated hover:bg-amber-warm/15 border border-white/10 hover:border-amber-warm/40 text-slate-300 hover:text-amber-warm font-mono text-[11px] transition-all group/btn inline-flex items-center"
                    aria-label={`Inspect code for ${repo.name} on GitHub`}
                  >
                    <span>Inspect Code</span>
                    <ArrowUpRight className="w-3 h-3 text-amber-warm transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </MagneticButton>
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>

        {/* Empty Search Fallback */}
        {filteredRepos.length === 0 && (
          <div className="text-center py-16 bg-carbon/40 rounded-2xl border border-white/5 font-mono">
            <AlertTriangle className="w-8 h-8 text-amber-warm mx-auto mb-2" />
            <h4 className="text-white text-base font-bold">No repositories match &ldquo;{searchQuery}&rdquo;</h4>
            <p className="text-slate-400 text-xs mt-1">Try resetting the filter category or clearing search keywords.</p>
            <button
              onClick={() => {
                setActiveFilter('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-1.5 rounded-full bg-amber-warm text-obsidian text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

export default GithubLab;
