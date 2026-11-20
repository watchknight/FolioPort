export interface HeroMetric {
  value: string;
  label: string;
}

export type SandboxType =
  | 'bitforge-sort'
  | 'focuslab-reflex'
  | 'rannabanna-pantry'
  | 'doclens-tryon'
  | 'physics';

export interface FlagshipProject {
  id: string;
  index: string;
  category: string;
  title: string;
  summary: string;
  keyMetrics: string;
  outcomeBadge: string;
  demoUrl: string;
  sourceUrl: string;
  screenshot: string;
  role: string;
  year: string;
  heroMetrics: HeroMetric[];
  problem: string;
  howItWorks: string;
  architecture: string;
  keyResults: string;
  impact: string;
  hasSandbox: boolean;
  sandboxType: SandboxType;
  // Backwards compatibility alias fields
  fileCode?: string;
  tagline?: string;
  stack?: string;
  status?: string;
  date?: string;
  size?: string;
}

export interface DeployedApp {
  id: string;
  title: string;
  tagline: string;
  liveUrl: string;
  githubUrl: string;
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

export type FeaturedProject = FlagshipProject;

export const PORTFOLIO_DATA = {
  meta: {
    name: 'Abdur Rahman Moayed',
    handle: '@watchknight',
    role: 'Software Engineer · Browser Internals, Systems Security & Web Architecture • CSE Undergraduate Scholar at East West University',
    academicAnchor: 'East West University (EWU), Dhaka, Bangladesh',
    location: 'Dhaka, Bangladesh (Remote Available)',
    status: 'Available for Software Engineering Roles & Systems Architecture',
    bio: 'Undergraduate Scholar specializing in Systems Architecture, Operating Systems, Browser Internals, and Distributed Web Engineering.',
    experienceYears: '4+',
    github: 'https://github.com/watchknight',
    linkedin: 'https://www.linkedin.com/in/abdur-rahman-moayed-9225b5389/',
    twitter: 'https://x.com',
    email: 'armabdur.rahman04@gmail.com',
    resumeUrl: '/resume.pdf',
  },
};

// ============================================================================
// 4 FLAGSHIP PRODUCTION PROJECTS (Curated 2x2 Flagship Project Grid)
// ============================================================================
export const FLAGSHIP_PROJECTS: FlagshipProject[] = [
  {
    id: '01_BITFORGE',
    index: '01',
    category: 'Visual Algorithm Lab',
    title: 'BitForge',
    summary:
      'Stop memorizing code. Watch data move with real-time step-through simulations and synchronized multi-language code.',
    keyMetrics: '50+ Visualized Algos • 11 Curriculum Stages • C++ / Python / Java / TS',
    outcomeBadge: '50+ Visualized Algos • 11 Curriculum Stages • C++ / Python / Java / TS',
    demoUrl: 'https://bitforge-3u2q.onrender.com',
    sourceUrl: 'https://github.com/watchknight/BitForge',
    screenshot: '/projects/bitforge.png',
    role: 'Lead Systems & Graphics Architect',
    year: '2024',
    heroMetrics: [
      { value: '50+', label: 'Visualized Algos' },
      { value: '11 Stages', label: 'Curriculum Depth' },
      { value: '4 Langs', label: 'C++ / Py / Java / TS' },
    ],
    problem:
      'Textbook pseudocode is static and lifeless, making it hard for CS students to build intuition for pointer hops, tree rotations, and in-memory mutations.',
    howItWorks:
      'Built a real-time visualization engine featuring interactive simulations for Array Sorting, Binary Trees, Graph BFS, and Linked Lists alongside Big-O complexity tracking and Race/Quiz modes.',
    architecture:
      'Built a real-time visualization engine featuring interactive simulations for Array Sorting, Binary Trees, Graph BFS, and Linked Lists alongside Big-O complexity tracking and Race/Quiz modes.',
    keyResults:
      'Accelerated algorithmic intuition and code execution retention across 50+ algorithm modules with zero simulation frame drops.',
    impact:
      'Accelerated algorithmic intuition and code execution retention across 50+ algorithm modules with zero simulation frame drops.',
    hasSandbox: true,
    sandboxType: 'bitforge-sort',
    fileCode: 'BitForge',
    tagline: 'Interactive DSA & Visual Intuition Engine',
    stack: 'TypeScript • WebGL Canvas • C++ / Python / Java AST • Algorithm Engine',
    status: 'Production',
    date: '1996-11-04',
    size: '142KB',
  },
  {
    id: '02_FOCUSLAB',
    index: '02',
    category: 'Cognitive Performance Web App',
    title: 'FocusLab',
    summary:
      'Build focus you can measure with a 3-minute reaction test, guided focus practices, and private local insights.',
    keyMetrics: '3-Minute Reflex Check • Sub-ms Precision • English & বাংলা UI',
    outcomeBadge: '3-Minute Reflex Check • Sub-ms Precision • English & বাংলা UI',
    demoUrl: 'https://focuslab-smoa.onrender.com',
    sourceUrl: 'https://github.com/watchknight/FocusLab',
    screenshot: '/projects/focuslab.png',
    role: 'Frontend & Cognitive Telemetry Engineer',
    year: '2024',
    heroMetrics: [
      { value: '3 Min', label: 'Reflex Check' },
      { value: 'Sub-ms', label: 'Timer Precision' },
      { value: 'EN / BN', label: 'Bilingual Interface' },
    ],
    problem:
      'Standard productivity timers track time spent sitting at a desk without measuring real cognitive alertness, mental fatigue, or reaction stability.',
    howItWorks:
      'Engineered a privacy-first cognitive studio combining a visual aperture reflex test, structured focus intervals, ambient soundscapes, and local IndexedDB telemetry with full English and Bengali support.',
    architecture:
      'Engineered a privacy-first cognitive studio combining a visual aperture reflex test, structured focus intervals, ambient soundscapes, and local IndexedDB telemetry with full English and Bengali support.',
    keyResults:
      'Delivered sub-millisecond reflex telemetry precision with 100% offline data sovereignty and private IndexedDB analytics.',
    impact:
      'Delivered sub-millisecond reflex telemetry precision with 100% offline data sovereignty and private IndexedDB analytics.',
    hasSandbox: true,
    sandboxType: 'focuslab-reflex',
    fileCode: 'FocusLab',
    tagline: 'Measurable Cognitive Focus & Reaction Studio',
    stack: 'TypeScript • Web Audio API • IndexedDB • Canvas Telemetry',
    status: 'Production',
    date: '1996-10-28',
    size: '188KB',
  },
  {
    id: '03_RANNABANNA',
    index: '03',
    category: 'Full-Stack Consumer Platform',
    title: 'Rannabanna',
    summary:
      'Cook the world with what you have by matching fridge and pantry staples to authentic global and Bengali dishes.',
    keyMetrics: '1-Tap Pantry Match • Global & Bengali Cuisines • English & বাংলা UI',
    outcomeBadge: '1-Tap Pantry Match • Global & Bengali Cuisines • English & বাংলা UI',
    demoUrl: 'https://rannabanna.onrender.com',
    sourceUrl: 'https://github.com/watchknight/Rannabanna',
    screenshot: '/projects/rannabanna.png',
    role: 'Full-Stack & Localization Architect',
    year: '2023–2024',
    heroMetrics: [
      { value: '1-Tap', label: 'Pantry Match' },
      { value: 'Global', label: '& Bengali Cuisines' },
      { value: 'EN / BN', label: 'Bilingual Interface' },
    ],
    problem:
      'Home cooks waste time and ingredients because recipe platforms require fixed shopping lists instead of matching dishes to items already in the kitchen.',
    howItWorks:
      'Created a real-time Pantry & Fridge Matchmaker where tapping kitchen staples (Red Onion, Garlic, Ginger, Egg, Basmati Rice, Chicken Breast) immediately filters matching recipes across global cuisines.',
    architecture:
      'Created a real-time Pantry & Fridge Matchmaker where tapping kitchen staples (Red Onion, Garlic, Ginger, Egg, Basmati Rice, Chicken Breast) immediately filters matching recipes across global cuisines.',
    keyResults:
      'Sub-15ms client-side filter response, complete bilingual Bengali & English culinary indexing, and 99/100 Lighthouse performance.',
    impact:
      'Sub-15ms client-side filter response, complete bilingual Bengali & English culinary indexing, and 99/100 Lighthouse performance.',
    hasSandbox: true,
    sandboxType: 'rannabanna-pantry',
    fileCode: 'Rannabanna',
    tagline: 'Global Recipe Discovery & Pantry Matchmaker',
    stack: 'React • Vite • Real-Time DB • Bengali NLP • PWA',
    status: 'Production',
    date: '1996-10-15',
    size: '210KB',
  },
  {
    id: '04_DOCLENS_BD',
    index: '04',
    category: '3D E-Commerce & Computer Vision',
    title: 'DocLensBD',
    summary:
      'Vision meets high fashion with real-time 3D camera frame try-on and custom prescription configuration.',
    keyMetrics: '198+ Precision Frames • 3D Face-Tracking Try-On • Custom Prescription Flow',
    outcomeBadge: '198+ Precision Frames • 3D Face-Tracking Try-On • Custom Prescription Flow',
    demoUrl: 'https://doclensbd.onrender.com',
    sourceUrl: 'https://github.com/watchknight/DocLensBD',
    screenshot: '/projects/doclensbd.png',
    role: '3D Graphics & Full-Stack Engineer',
    year: '2024',
    heroMetrics: [
      { value: '198+', label: 'Precision Frames' },
      { value: '3D Mesh', label: 'Face Tracking' },
      { value: 'Custom', label: 'Prescription Flow' },
    ],
    problem:
      'Buying prescription eyewear online in Bangladesh is difficult without seeing how frames fit your face geometry in real time.',
    howItWorks:
      'Engineered an optical e-commerce platform featuring real-time 3D virtual try-on via camera face tracking, category filtering (Eyeglasses, Sunglasses, Computer BLU), and a prescription lens selector.',
    architecture:
      'Engineered an optical e-commerce platform featuring real-time 3D virtual try-on via camera face tracking, category filtering (Eyeglasses, Sunglasses, Computer BLU), and a prescription lens selector.',
    keyResults:
      'Real-time WebGL face mesh alignment with 60 FPS viewport rendering, zero frame jitter, and responsive lens configuration.',
    impact:
      'Real-time WebGL face mesh alignment with 60 FPS viewport rendering, zero frame jitter, and responsive lens configuration.',
    hasSandbox: true,
    sandboxType: 'doclens-tryon',
    fileCode: 'DocLensBD',
    tagline: '3D Virtual Eyewear Try-On & Optical Platform',
    stack: 'React • TypeScript • WebGL / Three.js • Face Tracking • Cloud Firestore',
    status: 'Production',
    date: '1996-09-22',
    size: '284KB',
  },
];

export const FEATURED_PROJECTS = FLAGSHIP_PROJECTS;

// ============================================================================
// MORE LIVE DEPLOYED WEB APPS (Bottom Section of Selected Work View)
// ============================================================================
export const MORE_DEPLOYED_APPS: DeployedApp[] = [
  {
    id: 'mental-defrag',
    title: 'Mental Defrag',
    tagline: 'Spatial cognitive workspace with 2D physics and Obsidian canvas sync',
    liveUrl: 'https://mental-defrag.onrender.com',
    githubUrl: 'https://github.com/watchknight/Mental-Defrag',
  },
  {
    id: 'trashtrail',
    title: 'TrashTrail',
    tagline: 'Scroll-driven interactive environmental storytelling (Trash Trail) powered by GSAP',
    liveUrl: 'https://trashtrail.onrender.com',
    githubUrl: 'https://github.com/watchknight/TrashTrail',
  },
  {
    id: 'poshra',
    title: 'POSHRA',
    tagline: 'Scalable commerce architecture featuring atomic cart state synchronization and idempotent regional payment verification • Cloud-enabled resource scheduling engine with reactive optimistic UI',
    liveUrl: 'https://poshra.onrender.com',
    githubUrl: 'https://github.com/watchknight/POSHRA',
  },
];

// ============================================================================
// Resilient Static Fallback Array for GitHub Repositories
// ============================================================================
export const FALLBACK_REPOSITORIES: GitHubRepoItem[] = [
  {
    id: 201,
    name: 'BitForge',
    description: 'HTML5 2D canvas algorithm visualizer with multi-language AST code sync.',
    html_url: 'https://github.com/watchknight/BitForge',
    stargazers_count: 32,
    language: 'TypeScript',
    updated_at: '2026-08-30T16:00:00Z',
    forks_count: 8,
  },
  {
    id: 202,
    name: 'FocusLab',
    description: 'Cognitive focus & aperture reflex testing studio with IndexedDB local insights.',
    html_url: 'https://github.com/watchknight/FocusLab',
    stargazers_count: 28,
    language: 'TypeScript',
    updated_at: '2026-10-28T10:00:00Z',
    forks_count: 6,
  },
  {
    id: 203,
    name: 'Rannabanna',
    description: 'Full-stack localized Bengali recipe platform with 1-tap pantry matching.',
    html_url: 'https://github.com/watchknight/Rannabanna',
    stargazers_count: 22,
    language: 'TypeScript',
    updated_at: '2026-10-15T09:00:00Z',
    forks_count: 4,
  },
  {
    id: 204,
    name: 'DocLensBD',
    description: '3D virtual eyewear try-on and optical prescription configuration platform.',
    html_url: 'https://github.com/watchknight/DocLensBD',
    stargazers_count: 19,
    language: 'TypeScript',
    updated_at: '2026-09-22T14:00:00Z',
    forks_count: 3,
  },
  {
    id: 205,
    name: 'Mental-Defrag',
    description: 'Zero-gravity spatial cognitive workspace built with 2D physics & Obsidian canvas sync.',
    html_url: 'https://github.com/watchknight/Mental-Defrag',
    stargazers_count: 24,
    language: 'TypeScript',
    updated_at: '2026-11-04T12:00:00Z',
    forks_count: 5,
  },
  {
    id: 206,
    name: 'TrashTrail',
    description: 'Interactive scroll-driven environmental storytelling web application with GSAP ScrollTrigger.',
    html_url: 'https://github.com/watchknight/TrashTrail',
    stargazers_count: 18,
    language: 'JavaScript',
    updated_at: '2026-09-22T14:00:00Z',
    forks_count: 4,
  },
  {
    id: 207,
    name: 'POSHRA',
    description: 'Scalable commerce architecture with atomic cart state synchronization and idempotent payment verification.',
    html_url: 'https://github.com/watchknight/POSHRA',
    stargazers_count: 26,
    language: 'TypeScript',
    updated_at: '2026-07-28T10:00:00Z',
    forks_count: 3,
  },
  {
    id: 208,
    name: 'PureFeed',
    description: 'Browser engine & anti-adblock countermeasures bypassing YouTube 20ms loop & CSP via Manifest V3.',
    html_url: 'https://github.com/watchknight/PureFeed',
    stargazers_count: 21,
    language: 'JavaScript',
    updated_at: '2026-06-12T11:00:00Z',
    forks_count: 2,
  },
  {
    id: 209,
    name: 'FocusGuard',
    description: 'Multi-layer network & OS-level policy enforcement with declarativeNetRequest and 60s watchdog daemon.',
    html_url: 'https://github.com/watchknight/FocusGuard',
    stargazers_count: 35,
    language: 'JavaScript',
    updated_at: '2026-11-15T09:00:00Z',
    forks_count: 5,
  },
  {
    id: 210,
    name: 'Sentinel-Portfolio',
    description: 'Systems architecture portfolio featuring hardware-accelerated coordinate canvas and native Web Audio synthesizer.',
    html_url: 'https://github.com/watchknight/Sentinel-Portfolio',
    stargazers_count: 42,
    language: 'TypeScript',
    updated_at: '2026-11-20T18:00:00Z',
    forks_count: 9,
  },
];
