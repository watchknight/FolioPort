import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { audio } from '../utils/audio';
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
import { useTheme } from '../context/ThemeContext';

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
  C: '#8E98AA',
  'HTML/Canvas': '#00F0FF',
  HTML: '#00F0FF',
  Python: '#3572A5',
  Rust: '#DEA584',
  Go: '#00ADD8',
  Shell: '#4AF626',
  CSS: '#563D7C'
};

const CACHE_KEY = 'watchknight_repos_cache_v3';
const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes TTL

// Curated Fallback & Metadata Enrichment Dataset (including FolioPort, watchknight, MyPortfolio, etc.)
const FALLBACK_REPOS: GithubRepo[] = [
  {
    id: 100,
    name: 'FolioPort',
    description: '1996 Cyberdeck Workstation Rendering a Real-Time 3D Volumetric Particle Engine (WATCHKNIGHT_OS // SYS.96). Built with Three.js WebGL shaders, React 18, GSAP, and procedural Web Audio chiptunes.',
    html_url: 'https://github.com/watchknight/FolioPort',
    language: 'TypeScript',
    stargazers_count: 28,
    forks_count: 6,
    updated_at: '2026-11-07T12:00:00Z',
    topics: ['three-js', 'webgl-shaders', 'cyberdeck', 'react-18', 'audio-api'],
    category: 'TypeScript/JS'
  },
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
  },
  {
    id: 113,
    name: 'MyPortfolio',
    description: 'Personal portfolio codebase featuring GSAP inertia, interactive canvas shaders, and responsive UI components.',
    html_url: 'https://github.com/watchknight/MyPortfolio',
    language: 'JavaScript',
    stargazers_count: 10,
    forks_count: 2,
    updated_at: '2026-07-20T10:00:00Z',
    topics: ['react', 'gsap', 'tailwind-css'],
    category: 'HTML/Canvas'
  }
];

// Enricher dictionary for repos that might have null descriptions from GitHub API
const REPO_DESCRIPTIONS: Record<string, { desc: string; category: GithubRepo['category']; language?: string; topics?: string[] }> = {
  'FolioPort': {
    desc: '1996 Cyberdeck Workstation Rendering a Real-Time 3D Volumetric Particle Engine (WATCHKNIGHT_OS // SYS.96). Built with Three.js WebGL shaders, React 18, GSAP, and procedural Web Audio chiptunes.',
    category: 'TypeScript/JS',
    language: 'TypeScript',
    topics: ['three-js', 'webgl-shaders', 'cyberdeck', 'react-18', 'audio-api']
  },
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

// Prompt filter specification: [FILTER: ALL | TS/JS | C/C++ | HTML/CANVAS]
export type RetroFilterCategory = 'ALL' | 'TS/JS' | 'C/C++' | 'HTML/CANVAS';

export const GithubLab: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [repos, setRepos] = useState<GithubRepo[]>(FALLBACK_REPOS);
  const [activeFilter, setActiveFilter] = useState<RetroFilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'fallback'>('fallback');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Human-readable relative time formatter
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently updated';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return 'Updated today';
      if (diffDays === 1) return 'Updated yesterday';
      if (diffDays < 30) return `Updated ${diffDays}d ago`;
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) return `Updated ${diffMonths}mo ago`;
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
      } catch {
        // Continue to network fetch if cache read errors
      }
    }

    // 2. Network Fetch from GitHub API
    try {
      const response = await fetch('https://api.github.com/users/watchknight/repos?sort=updated&per_page=15', {
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
          stargazers_count: item.stargazers_count ?? fallbackMatch?.stargazers_count ?? 0,
          forks_count: item.forks_count ?? fallbackMatch?.forks_count ?? 0,
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
    } catch {
      // 5. Graceful Fallback Dataset on Rate Limit (403) or Network Failure
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

  // Matcher for retro filter categories
  const matchesFilter = useCallback((repo: GithubRepo, filter: RetroFilterCategory): boolean => {
    if (filter === 'ALL') return true;
    if (filter === 'TS/JS') {
      return (
        repo.language === 'TypeScript' ||
        repo.language === 'JavaScript' ||
        repo.category === 'TypeScript/JS' ||
        repo.category === 'Full-Stack'
      );
    }
    if (filter === 'C/C++') {
      return (
        repo.language === 'C++' ||
        repo.language === 'C' ||
        repo.category === 'C/C++'
      );
    }
    if (filter === 'HTML/CANVAS') {
      return (
        repo.language === 'HTML/Canvas' ||
        repo.language === 'HTML' ||
        repo.category === 'HTML/Canvas'
      );
    }
    return true;
  }, []);

  // Compute counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<RetroFilterCategory, number> = {
      ALL: repos.length,
      'TS/JS': 0,
      'C/C++': 0,
      'HTML/CANVAS': 0
    };

    repos.forEach((repo) => {
      if (matchesFilter(repo, 'TS/JS')) counts['TS/JS']++;
      if (matchesFilter(repo, 'C/C++')) counts['C/C++']++;
      if (matchesFilter(repo, 'HTML/CANVAS')) counts['HTML/CANVAS']++;
    });

    return counts;
  }, [repos, matchesFilter]);

  // Filtered and searched repositories
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      const matchCat = matchesFilter(repo, activeFilter);
      const matchesSearch =
        searchQuery === '' ||
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchesSearch;
    });
  }, [repos, activeFilter, searchQuery, matchesFilter]);

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

  const filterTabs: RetroFilterCategory[] = ['ALL', 'TS/JS', 'C/C++', 'HTML/CANVAS'];

  return (
    <section 
      ref={sectionRef} 
      id="lab" 
      className="py-24 md:py-32 relative bg-[#070814] text-[#F0EFE6] border-t-2 border-[#2D3645] overflow-hidden"
      style={{
        backgroundColor: 'var(--crt-void-bg, #070814)',
        color: 'var(--pixel-ivory-text, #F0EFE6)',
        borderColor: 'var(--crt-bezel-shadow, #2D3645)',
      }}
    >
      {/* 90s Cyberdeck PCB Background Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#00F0FF_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF_1px,transparent_1px)] bg-[size:32px_32px] -z-10" 
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div 
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 border-b-2 border-[#2D3645] pb-8 gap-6"
          style={{ borderColor: 'var(--crt-bezel-shadow, #2D3645)' }}
        >
          <div>
            <div className="flex items-center gap-2 font-pixel text-[10px] text-[#FFCC00] uppercase tracking-widest mb-3">
              <FlaskConical className="w-4 h-4 text-[#FFCC00]" />
              <span>&gt; [04] GITHUB_ROM // RETRO DATA CARTRIDGE EXPLORER</span>
            </div>
            <div className="overflow-visible">
              <h2 
                className="font-display uppercase text-white"
                style={{
                  fontFamily: "'Space Grotesk', 'Syne', sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  fontSize: 'clamp(1.85rem, 4vw, 3.25rem)',
                  lineHeight: 1.05,
                  color: 'var(--pixel-ivory-text, #F0EFE6)',
                }}
              >
                GITHUB <span className="text-[#FFCC00]">DATA CARTRIDGES</span>
              </h2>
            </div>
            <p className="font-body text-fluid-body text-[#D6CFC2] max-w-2xl mt-2 leading-relaxed" style={{ color: 'var(--text-secondary, #D6CFC2)' }}>
              Live cryptographic telemetry and repository stream directly queried from GitHub. 
              Restyled as 90s Cyberdeck Floppy Modules and Data Cartridges spanning Linux C/C++ OS primitives, spatial physics engines, and localized web architectures.
            </p>
          </div>

          {/* Telemetry Status Strip & Manual Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#131629] border-2 border-[#2D3645] shadow-[2px_2px_0_0_#070814] text-[9px] font-pixel"
              style={{
                backgroundColor: 'var(--crt-panel-slate, #131629)',
                borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                color: 'var(--pixel-ivory-text, #F0EFE6)',
                boxShadow: isLight ? '2px 2px 0 0 #C8C1B4' : '2px 2px 0 0 #070814',
              }}
            >
              {dataSource === 'live' && (
                <>
                  <span className="w-2 h-2 rounded-none bg-[#4AF626] animate-pulse" />
                  <span className="text-[#4AF626] font-semibold">Live GitHub API Connected</span>
                </>
              )}
              {dataSource === 'cache' && (
                <>
                  <span className="w-2 h-2 rounded-none bg-[#00F0FF]" />
                  <span className="text-[#00F0FF] font-semibold">Smart Session Cache Active</span>
                </>
              )}
              {dataSource === 'fallback' && (
                <>
                  <span className="w-2 h-2 rounded-none bg-[#FFCC00]" />
                  <span className="text-[#FFCC00] font-semibold">Rate-Limit Resilient Fallback</span>
                </>
              )}
              {lastRefreshed && (
                <span className="text-[#8E98AA] hidden sm:inline">[{lastRefreshed}]</span>
              )}
            </div>

            <button
              onClick={() => fetchRepositories(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131629] hover:bg-[#1A1F38] text-[#D6CFC2] hover:text-white border-2 border-[#2D3645] hover:border-[#FFCC00] font-pixel text-[9px] transition-all active:scale-95 disabled:opacity-50 shadow-[2px_2px_0_0_#070814]"
              title="Force re-query GitHub API"
              aria-label="Refresh repository data"
            >
              <RefreshCw className={`w-3 h-3 text-[#FFCC00] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <a
              href="https://github.com/watchknight?tab=repositories"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFCC00] text-[#070814] font-pixel text-[9px] font-bold border-2 border-white shadow-[2px_2px_0_0_#070814] hover:bg-[#00F0FF] transition-all active:scale-95"
              aria-label="View all repositories on GitHub (@watchknight)"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>View All Repos</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Filter Controls [FILTER: ALL | TS/JS | C/C++ | HTML/CANVAS] & Live Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          
          {/* Prompt-mandated Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-pixel text-[9px] text-[#8E98AA] mr-1 hidden sm:inline">
              [FILTER:
            </span>

            {filterTabs.map((filter) => {
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
                  className={`flex items-center gap-2 px-3 py-1.5 font-pixel text-[9px] transition-all duration-150 border-2 ${
                    isActive
                      ? 'bg-[#332505] text-[#FFCC00] border-[#FFCC00] shadow-[0_0_12px_rgba(255,204,0,0.35),2px_2px_0_0_#070814] font-bold'
                      : 'bg-[#131629] text-[#8E98AA] hover:text-[#F0EFE6] border-[#2D3645] hover:border-[#00F0FF] shadow-[2px_2px_0_0_#070814]'
                  }`}
                  aria-label={`Filter by ${filter} category (${count} repositories)`}
                >
                  <span>{`> ${filter}`}</span>
                  <span
                    className={`px-1 py-0.2 text-[8px] font-mono ${
                      isActive ? 'bg-[#FFCC00] text-[#070814] font-bold' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    [{count}]
                  </span>
                </button>
              );
            })}

            <span className="font-pixel text-[9px] text-[#8E98AA] ml-1 hidden sm:inline">
              ]
            </span>
          </div>

          {/* Quick Filter Search Input styled as 90s Command */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E98AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="> SEARCH_ROM: [ query... ]"
              aria-label="Search repositories, tags, or technology stack"
              className="w-full pl-9 pr-3 py-1.5 bg-[#0D1512] border-2 border-[#2D3645] font-mono text-fluid-micro text-[#00F0FF] placeholder:text-[#8E98AA] focus:outline-none focus:border-[#FFCC00] shadow-[inset_0_0_8px_rgba(0,0,0,0.8),2px_2px_0_0_#070814] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear repository search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E98AA] hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RETRO ROM CARTRIDGE / FLOPPY MODULES GRID                                 */}
        {/* ========================================================================= */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRepos.map((repo, idx) => {
            const langColor = LANGUAGE_COLORS[repo.language] || '#00F0FF';
            const romId = `ROM_${String(idx + 1).padStart(2, '0')}`;

            return (
              <div
                key={repo.id}
                onMouseEnter={() => audio.playTick()}
                className="relative bg-[#131629] border-2 border-[#2D3645] hover:border-[#FFCC00] shadow-[2px_2px_0_0_#070814] transition-all duration-200 group flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--crt-panel-slate, #131629)',
                  borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                  boxShadow: isLight ? '4px 4px 0 0 #C8C1B4' : '2px 2px 0 0 #070814',
                }}
              >
                {/* 1. Floppy Shutter & Write-Protect Notch Header */}
                <div 
                  className="bg-[#1A1F38] border-b-2 border-[#2D3645] px-3.5 py-2 flex items-center justify-between select-none"
                  style={{
                    backgroundColor: isLight ? '#E5DFD3' : '#1A1F38',
                    borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                  }}
                >
                  {/* Metal sliding shutter graphic */}
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-pixel text-[8px] text-[#8E98AA] px-1.5 py-0.5 bg-[#070814] border border-[#2D3645]"
                      style={{
                        backgroundColor: isLight ? '#FAF8F5' : '#070814',
                        borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                      }}
                    >
                      {romId}
                    </span>
                    <span 
                      className="font-pixel text-[8px] sm:text-[9px] text-[#FFCC00] tracking-wider break-all"
                      style={{ color: 'var(--pixel-amber-gold, #FFCC00)' }}
                    >
                      {repo.name.toUpperCase()}.DAT
                    </span>
                    {repo.name === 'FocusGuard' && (
                      <a
                        href="#extensions"
                        className={`font-pixel text-[7px] px-1.5 py-0.5 transition-colors ${
                          isLight
                            ? 'bg-[#0052FF]/15 border border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF] hover:text-white shadow-[1px_1px_0_0_#C8C1B4]'
                            : 'bg-[#00F0FF]/15 border border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#070814] shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                        }`}
                        title="Jump to interactive Browser Extension Studio"
                      >
                        [ STUDIO ↗ ]
                      </a>
                    )}
                  </div>

                  {/* Write-Protect & Grip Ridges */}
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-0.5 text-[#2D3645] font-mono text-[8px]">
                      <span>||||</span>
                    </div>
                    <span className={`font-pixel text-[7px] px-1.5 py-0.5 flex items-center gap-1 border ${
                      isLight
                        ? 'bg-[#FAF8F5] border-[#007A33]/40 text-[#007A33]'
                        : 'bg-[#0D1512] border-[#4AF626]/40 text-[#4AF626]'
                    }`}>
                      <span className={`w-1 h-1 rounded-none animate-pulse ${
                        isLight ? 'bg-[#007A33]' : 'bg-[#4AF626]'
                      }`} />
                      WP: OFF
                    </span>
                  </div>
                </div>

                {/* 2. Cartridge Label Sticker Body */}
                <div 
                  className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-[#0D1512]/95 m-1.5 border border-[#2D3645]"
                  style={{
                    backgroundColor: isLight ? '#FAF8F5' : 'rgba(13, 21, 18, 0.95)',
                    borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                  }}
                >
                  <div>
                    {/* Language LED & Timestamp */}
                    <div 
                      className="flex items-center justify-between mb-3 border-b border-[#2D3645]/80 pb-2"
                      style={{ borderColor: 'var(--crt-bezel-shadow, #2D3645)' }}
                    >
                      {/* Pixelated language color LED */}
                      <span 
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#2D3645] text-fluid-micro font-pixel text-[8px] bg-[#070814] text-[#F0EFE6]"
                        style={{
                          backgroundColor: isLight ? '#EDE8DE' : '#070814',
                          color: 'var(--pixel-ivory-text, #F0EFE6)',
                          borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                        }}
                      >
                        <span
                          className="w-2 h-2 shrink-0 rounded-none shadow-[0_0_6px_currentColor]"
                          style={{ backgroundColor: langColor, color: langColor }}
                        />
                        <span>{repo.language}</span>
                      </span>

                      <span className="font-mono text-[9px] text-[#8E98AA]">
                        {formatRelativeTime(repo.updated_at)}
                      </span>
                    </div>

                    {/* Repository Name & External Icon */}
                    <div className="mb-2">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="group/link inline-flex items-center gap-1.5 max-w-full"
                      >
                        <h3 
                          className="font-pixel text-xs text-[#F0EFE6] group-hover/link:text-[#FFCC00] transition-colors break-words"
                          style={{ color: 'var(--pixel-ivory-text, #F0EFE6)' }}
                        >
                          {repo.name}
                        </h3>
                        <ExternalLink className="w-3 h-3 text-[#8E98AA] group-hover/link:text-[#FFCC00] transition-colors shrink-0" />
                      </a>
                    </div>

                    {/* Description */}
                    <p 
                      className="font-body text-xs text-[#D6CFC2] mb-4 leading-relaxed break-words"
                      style={{ color: 'var(--text-secondary, #D6CFC2)' }}
                    >
                      {repo.description}
                    </p>

                    {/* Topic Badges */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-1.5 py-0.5 bg-[#070814] font-mono text-[9px] text-[#00F0FF] border border-[#2D3645]"
                          style={{
                            backgroundColor: isLight ? '#EDE8DE' : '#070814',
                            color: 'var(--tech-cyan-wave, #00F0FF)',
                            borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                          }}
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3. Gold Cartridge Pin Contacts & [ >_ INSPECT_ROM ] Action Button */}
                  <div>
                    {/* PCB Gold Contact Pin Fingers */}
                    <div 
                      className="py-1 border-t border-[#2D3645] mb-3 flex items-center justify-between font-mono text-[8px] text-[#C59B27] select-none tracking-widest opacity-80 overflow-hidden"
                      style={{ borderColor: 'var(--crt-bezel-shadow, #2D3645)' }}
                    >
                      <span>||||||||||||||||||||||||||||||||</span>
                      <span className="font-pixel text-[7px] text-[#8E98AA]">16-BIT BUS</span>
                    </div>

                    {/* Footer: Star/Fork Counters + [ >_ INSPECT_ROM ] Button */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Star and Fork Glowing Pixel Readouts */}
                      <div className="flex items-center gap-3 font-pixel text-[9px]">
                        <span 
                          className="flex items-center gap-1 text-[#FFCC00]"
                          style={{ color: 'var(--pixel-amber-gold, #FFCC00)' }}
                        >
                          <Star className="w-3 h-3 text-[#FFCC00] fill-[#FFCC00]/30" style={{ color: 'var(--pixel-amber-gold, #FFCC00)' }} />
                          <span>{String(repo.stargazers_count).padStart(2, '0')}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#8E98AA]">
                          <GitFork className="w-3 h-3 text-[#8E98AA]" />
                          <span>{String(repo.forks_count).padStart(2, '0')}</span>
                        </span>
                      </div>

                      {/* Prompt-mandated [ >_ INSPECT_ROM ] Button */}
                      <MagneticButton
                        as="a"
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        strength={0.25}
                        innerStrength={0.15}
                        onMouseEnter={() => audio.playTick()}
                        onClick={() => audio.playChord()}
                        className="px-2.5 py-1 border-2 border-[#2D3645] bg-[#131629] hover:bg-[#FFCC00] hover:text-[#070814] text-[#FFCC00] font-pixel text-[8px] transition-all group/btn inline-flex items-center gap-1 shadow-[2px_2px_0_0_#070814] active:scale-95 cursor-pointer"
                        style={{
                          backgroundColor: isLight ? '#E5DFD3' : '#131629',
                          borderColor: 'var(--crt-bezel-shadow, #2D3645)',
                          color: 'var(--pixel-amber-gold, #FFCC00)',
                          boxShadow: isLight ? '2px 2px 0 0 #C8C1B4' : '2px 2px 0 0 #070814',
                        }}
                        aria-label={`Inspect ROM for ${repo.name} on GitHub`}
                      >
                        <span>[ &gt;_ INSPECT_ROM ]</span>
                        <ArrowUpRight className="w-2.5 h-2.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                      </MagneticButton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Fallback */}
        {filteredRepos.length === 0 && (
          <div className="text-center py-16 bg-[#131629] border-2 border-[#2D3645] font-mono">
            <AlertTriangle className="w-8 h-8 text-[#FFCC00] mx-auto mb-2" />
            <h4 className="text-[#F0EFE6] text-base font-pixel text-xs">No repositories match &ldquo;{searchQuery}&rdquo;</h4>
            <p className="text-[#8E98AA] text-xs mt-1">Try resetting the filter category or clearing search keywords.</p>
            <button
              onClick={() => {
                setActiveFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-1.5 border-2 border-[#2D3645] bg-[#FFCC00] text-[#070814] font-pixel text-[10px] hover:bg-white transition-colors"
            >
              [ RESET FILTERS ]
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

export default GithubLab;
