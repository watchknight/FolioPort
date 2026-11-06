export interface Project {
  id: string;
  title: string;
  tagline: string;
  category: 'Distributed Systems' | 'Graphics & Audio' | 'Real-time & Network' | 'Full-Stack Platform';
  description: string;
  architectureDetails: string[];
  metrics: { label: string; value: string }[];
  tags: string[];
  githubUrl: string;
  liveUrl?: string;
  featured: boolean;
  accent: 'cyan' | 'amber';
}

export interface LabExperiment {
  id: string;
  title: string;
  description: string;
  type: string;
  stars: number;
  forks: number;
  language: string;
  status: 'Production' | 'Beta' | 'Research';
  githubUrl: string;
}

export interface SkillCategory {
  title: string;
  description: string;
  skills: { name: string; level: string; highlight?: boolean }[];
}

export const PORTFOLIO_DATA = {
  meta: {
    name: 'Abdur Rahman Moayed',
    handle: '@watchknight',
    role: 'Computer Science & Engineering (CSE) Undergraduate at East West University, Bangladesh — Full-Stack Web Architect & Low-Level Systems Engineer',
    academicAnchor: 'East West University, Bangladesh',
    location: 'Dhaka, BD (UTC+6)',
    status: 'Available for Systems & Full-Stack Roles',
    bio: 'From POSIX shared-memory pipelines in C and Linux kernel workflows to zero-gravity TypeScript & GSAP web applications.',
    experienceYears: '4+',
    github: 'https://github.com/watchknight',
    linkedin: 'https://linkedin.com/in/watchknight',
    twitter: 'https://x.com',
    email: 'moayed.cse@gmail.com',
    resumeUrl: '/resume.pdf',
  },

  projects: [
    {
      id: 'mental-defrag',
      title: 'Mental Defrag',
      tagline: 'Zero-Gravity Spatial Cognitive Obsidian Engine',
      category: 'Distributed Systems',
      description: 'Zero-gravity spatial thought engine built with Vite, TypeScript, and Matter.js physics. Features local vector embeddings for semantic node clustering and native bi-directional Obsidian .canvas JSON parsing.',
      architectureDetails: [
        'Matter.js rigid-body physics loop with zero-gravity friction decay',
        'Local cosine similarity vector clustering for semantic thought repulsion/attraction',
        'Bidirectional Obsidian .canvas JSON AST compiler with lossless sync',
        'Client-side IndexedDB persistence for offline-first zero-latency state',
      ],
      metrics: [
        { label: 'Simulation FPS', value: '60 FPS Solid' },
        { label: 'Query Latency', value: '0 ms' },
        { label: 'Obsidian Parity', value: '100%' },
      ],
      tags: ['TypeScript', 'Vite', 'Matter.js', 'Vector Embeddings', 'Obsidian Canvas', 'IndexedDB'],
      githubUrl: 'https://github.com/watchknight/Mental-Defrag',
      liveUrl: 'https://github.com/watchknight/Mental-Defrag',
      featured: true,
      accent: 'cyan',
    },
    {
      id: 'doclens-bd',
      title: 'DocLensBD',
      tagline: 'Cloud-Backed Health Intelligence & Diagnostic Pipeline',
      category: 'Full-Stack Platform',
      description: 'Cloud-backed medical diagnostic platform utilizing Cloud Firestore real-time snapshot listeners, AES-256 field encryption, and automated GitHub Actions CI/CD staging pipelines.',
      architectureDetails: [
        'Cloud Firestore real-time snapshot listeners with offline persistence',
        'Role-based access control (RBAC) security rules with encrypted fields',
        'Automated GitHub Actions CI/CD pipeline running automated test suites',
        'Optimistic UI update reconciler ensuring zero data loss over unstable mobile networks',
      ],
      metrics: [
        { label: 'Regional Sync', value: '< 45 ms' },
        { label: 'Uptime SLA', value: '99.98%' },
        { label: 'CI/CD Pipeline', value: '14/14 Pass' },
      ],
      tags: ['Cloud Firestore', 'React', 'TypeScript', 'GitHub Actions', 'Firebase Auth', 'Tailwind CSS'],
      githubUrl: 'https://github.com/watchknight/DocLensBD',
      liveUrl: 'https://github.com/watchknight/DocLensBD',
      featured: true,
      accent: 'amber',
    },
    {
      id: 'rannabanna',
      title: 'Rannabanna',
      tagline: 'Localized Bengali Culinary & Nutrition Engine',
      category: 'Full-Stack Platform',
      description: 'Ultra-optimized localized full-stack Bengali web application featuring specialized Bengali font glyph subsetting, phonetic search indexing, and real-time cloud database synchronization.',
      architectureDetails: [
        'Vite build pipeline with aggressive tree-shaking and dynamic code-splitting',
        'Custom Bengali Unicode glyph subsetting reducing font payload by 78%',
        'Real-time cloud database synchronization with offline IndexedDB fallback',
        'Phonetic phonetic-to-Bengali transliterated search indexing engine',
      ],
      metrics: [
        { label: 'Lighthouse Score', value: '99 / 100' },
        { label: 'Critical Bundle', value: '42 KB' },
        { label: 'Search Latency', value: '< 15 ms' },
      ],
      tags: ['React', 'Vite', 'Cloud DB Sync', 'Bengali NLP / Localization', 'PWA', 'Tailwind CSS'],
      githubUrl: 'https://github.com/watchknight/Rannabanna',
      liveUrl: 'https://github.com/watchknight/Rannabanna',
      featured: true,
      accent: 'cyan',
    },
    {
      id: 'trash-trail',
      title: 'Trash Trail',
      tagline: 'Kinetic Scroll-Driven Interactive Storytelling Web Architecture',
      category: 'Graphics & Audio',
      description: 'Cinematic scroll-driven storytelling web experience powered by vanilla JavaScript, GSAP, and ScrollTrigger. Implemented multi-stage pinned parallax scenes, dynamic viewport scrubbing, and audio-visual synchrony.',
      architectureDetails: [
        'GSAP ScrollTrigger pinned multi-stage viewport narrative choreography',
        'Fixed coordinate aspect-ratio preservation ensuring 0 Cumulative Layout Shift (CLS)',
        'Vanilla JavaScript micro-event orchestrator bypassing virtual DOM overhead',
        'GPU composite layers using will-change transforms for 60 FPS mobile scrubbing',
      ],
      metrics: [
        { label: 'Session Duration', value: '+340%' },
        { label: 'Frame Consistency', value: '60 FPS Solid' },
        { label: 'CLS Score', value: '0.00' },
      ],
      tags: ['GSAP', 'ScrollTrigger', 'Vanilla JavaScript', 'SVG Kinetic Animation', 'Vite'],
      githubUrl: 'https://github.com/watchknight/TrashTrail',
      liveUrl: 'https://github.com/watchknight/TrashTrail',
      featured: true,
      accent: 'amber',
    },
    {
      id: 'neon-vanguard',
      title: 'Neon Vanguard 2D & OS Kernel Labs',
      tagline: 'HTML5 2D Canvas Combat Engine & Linux C/C++ OS Kernel Labs',
      category: 'Real-time & Network',
      description: 'High-throughput 2D HTML5 Canvas combat engine with piercing projectile raycasting and recursive chain-lightning algorithms; paired with Linux C/C++ Operating System implementations featuring IPC pipes, fork() process hierarchies, and POSIX shared memory.',
      architectureDetails: [
        'HTML5 2D Canvas render loop with pre-allocated particle pools and raycast piercing',
        'Branching chain-lightning recursive arc generator with dynamic luminescence',
        'Linux C POSIX shared memory (shmget, shmat) with spinlock synchronization',
        'Multi-process fork() hierarchy pipeline communicating via anonymous duplex pipes',
      ],
      metrics: [
        { label: 'Render Pacing', value: '120 FPS' },
        { label: 'IPC Latency', value: '< 1.2 μs' },
        { label: 'Memory Safety', value: '0 Leaks' },
      ],
      tags: ['C / C++', 'Linux POSIX', 'HTML5 Canvas', 'IPC Pipes', 'fork()', 'POSIX Shared Memory'],
      githubUrl: 'https://github.com/watchknight/BitForge',
      liveUrl: 'https://github.com/watchknight',
      featured: true,
      accent: 'cyan',
    },
  ] as Project[],

  labExperiments: [
    {
      id: 'lab-1',
      title: 'simd-json-stream',
      description: 'Zero-allocation JSON stream parser utilizing AVX-512 SIMD vector instructions for ultra-fast batch deserialization.',
      type: 'Systems / Micro-Engine',
      stars: 482,
      forks: 64,
      language: 'Rust / C++',
      status: 'Production',
      githubUrl: 'https://github.com/watchknight',
    },
    {
      id: 'lab-2',
      title: 'shader-terrain-gen',
      description: 'Procedural heightmap terrain generation rendered via Raymarching in pure fragment shaders with fractional Brownian motion.',
      type: 'Creative Graphics',
      stars: 315,
      forks: 41,
      language: 'GLSL / TypeScript',
      status: 'Beta',
      githubUrl: 'https://github.com/watchknight',
    },
    {
      id: 'lab-3',
      title: 'raft-in-500-lines',
      description: 'Pedagogical yet hardened implementation of the Raft distributed consensus state machine with visualization simulator.',
      type: 'Algorithms',
      stars: 620,
      forks: 118,
      language: 'Go',
      status: 'Research',
      githubUrl: 'https://github.com/watchknight',
    },
    {
      id: 'lab-4',
      title: 'lenis-gsap-toolkit',
      description: 'Lightweight hooks and micro-interaction utilities for inertial scroll choreography in React & Next.js applications.',
      type: 'Frontend Architecture',
      stars: 289,
      forks: 33,
      language: 'TypeScript',
      status: 'Production',
      githubUrl: 'https://github.com/watchknight',
    },
  ] as LabExperiment[],

  skillCategories: [
    {
      title: 'Core Systems & Low-Level',
      description: 'Deterministic memory safety, concurrency primitives, and hardware-adjacent efficiency.',
      skills: [
        { name: 'C / C++', level: 'Memory Allocation, POSIX, Linux Systems', highlight: true },
        { name: 'Linux Kernel & POSIX IPC', level: 'Shared Memory, Anonymous Pipes, fork() Trees', highlight: true },
        { name: 'Rust', level: 'Memory Safety & Concurrency Primitives' },
        { name: 'Go (Golang)', level: 'High-Concurrency Microservices' },
        { name: 'Distributed Systems', level: 'Consensus State Machines & Data Integrity' },
      ],
    },
    {
      title: 'Frontend & Creative Engineering',
      description: 'Awwwards-grade motion, inertial scrolling, and responsive reactive interfaces.',
      skills: [
        { name: 'React 18 / Next.js', level: 'Full-Stack Architecture & State Machines', highlight: true },
        { name: 'TypeScript', level: 'Strict Type Systems & Functional Patterns', highlight: true },
        { name: 'GSAP & Lenis', level: 'Physics Inertia & ScrollTrigger Orchestration', highlight: true },
        { name: 'Tailwind CSS', level: 'Fluid Design Systems & Glassmorphism' },
        { name: 'HTML5 2D Canvas & Shaders', level: 'High-Performance 120 FPS Rendering' },
      ],
    },
    {
      title: 'Infrastructure & Data Fabric',
      description: 'Cloud scale, high-availability storage, zero-downtime pipelines, and observability.',
      skills: [
        { name: 'Cloud Firestore & Firebase', level: 'Real-time Listeners & Security Rules', highlight: true },
        { name: 'CI/CD & GitHub Actions', level: 'Automated Test Pipelines & Staging Releases', highlight: true },
        { name: 'PostgreSQL / IndexedDB', level: 'Offline-First Schema & Query Optimization' },
        { name: 'Docker & Linux Automation', level: 'Containerized Development Environments' },
        { name: 'Vite & Webpack', level: 'Micro-Bundle Optimization & Tree-Shaking' },
      ],
    },
  ] as SkillCategory[],

  terminalCommands: {
    help: 'List of commands:\n  • about     : Display identity and core philosophy\n  • skills    : Technical competencies and systems stack\n  • projects  : Flagship engineered architectures\n  • dhaka     : Live Dhaka, Bangladesh timezone telemetry\n  • contact   : Transmission coordinates\n  • clear     : Clear terminal buffer',
    about: 'Abdur Rahman Moayed (@watchknight) — CSE Undergraduate at East West University, Bangladesh.\nFull-Stack Web Architect & Low-Level Systems Engineer.\nBridging POSIX shared-memory pipelines in C and Linux kernel workflows with zero-gravity TypeScript & GSAP web applications.',
    skills: 'Languages : C, C++, TypeScript, JavaScript, Rust, Go, Python, SQL, Bash\nFrontend  : React, Vite, GSAP Motion, ScrollTrigger, HTML5 Canvas, Tailwind, Lenis\nSystems   : POSIX Shared Memory, Linux IPC Pipes, fork() Trees, Valgrind\nCloud/DB  : Cloud Firestore, IndexedDB, Firebase Auth, GitHub Actions CI/CD',
    projects: '1. Mental Defrag   : Zero-Gravity Spatial Cognitive Canvas (Matter.js + Obsidian)\n2. DocLensBD        : Cloud Medical Diagnostic Platform (Firestore + CI/CD)\n3. Rannabanna       : Full-Stack Localized Bengali Culinary Engine (Vite + Cloud DB)\n4. Trash Trail      : Kinetic Scroll-Driven Storytelling (GSAP + ScrollTrigger)\n5. Neon Vanguard    : 2D Canvas Combat Engine & Linux C/C++ POSIX Kernel Labs',
    dhaka: 'Location : East West University, Dhaka, Bangladesh (UTC+6)\nStatus   : Open for Global Systems & Full-Stack Engineering Roles\nPing     : ~14ms (South Asia CDN edge), ~120ms (EU/US edge)',
    contact: 'Email    : moayed.cse@gmail.com\nGitHub   : https://github.com/watchknight\nLinkedIn : https://linkedin.com/in/watchknight\nHandle   : @watchknight\nLocation : Dhaka, Bangladesh (UTC+6)',
  },
};
