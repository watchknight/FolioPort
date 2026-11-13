import React from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { useRetroOS } from '../../context/RetroOSContext';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface AboutMeViewProps {
  palette?: PhosphorColorTokens;
}

// 16x16 2-bit Phosphor Pixel Art Matrix: Cyberdeck Knight / Sentinel Visor Avatar
// 0: void, 1: dim, 2: mid, 3: bright
export const PIXEL_KNIGHT_16x16 = [
  [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0, 0],
  [0, 0, 2, 3, 1, 1, 1, 1, 1, 1, 1, 1, 3, 2, 0, 0],
  [0, 2, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 2, 0],
  [0, 2, 3, 1, 3, 0, 0, 3, 3, 0, 0, 3, 1, 3, 2, 0],
  [2, 3, 1, 1, 3, 0, 0, 3, 3, 0, 0, 3, 1, 1, 3, 2],
  [2, 3, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 3, 2],
  [2, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 2],
  [0, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 0],
  [0, 0, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 0, 0],
  [0, 0, 2, 2, 3, 1, 2, 1, 1, 2, 1, 3, 2, 2, 0, 0],
  [0, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 2, 0],
  [2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2],
  [2, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 2],
  [2, 1, 1, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 2],
  [0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0],
];

// Clean 3-Column Capability Grid Data Structure
export interface CapabilityColumn {
  title: string;
  badge: string;
  skills: string[];
}

export const CAPABILITY_COLUMNS: CapabilityColumn[] = [
  {
    title: 'Frontend & Interactive UI',
    badge: 'Frontend',
    skills: [
      'TypeScript',
      'React 18',
      'Next.js',
      'Tailwind CSS',
      'GSAP & ScrollTrigger',
      'HTML5 Canvas',
      '3D Web & Face Tracking',
    ],
  },
  {
    title: 'Backend, Data & Cloud',
    badge: 'Backend',
    skills: [
      'Node.js',
      'Express',
      'Cloud Firestore',
      'PostgreSQL',
      'MongoDB',
      'IndexedDB',
      'Render & GitHub Actions CI/CD',
    ],
  },
  {
    title: 'Core CSE & Languages',
    badge: 'Core CSE',
    skills: [
      'Data Structures & Algorithms',
      'C++',
      'C',
      'Python',
      'Java',
      'JavaScript',
      'Git & Ubuntu Linux Workflow',
    ],
  },
];

export const AboutMeView: React.FC<AboutMeViewProps> = ({ palette }) => {
  const os = useRetroOS();
  const isAmber = os.isInsideProvider && os.phosphorMode === 'amber';
  const bright = palette?.bright ?? (isAmber ? '#d4a359' : '#c2cdb4');
  const voidCol = palette?.void ?? (isAmber ? '#140f07' : '#111712');
  const mid = palette?.mid ?? (isAmber ? '#8c6830' : '#6e7d62');
  const dim = palette?.dim ?? (isAmber ? '#3d2b12' : '#2e3b2b');

  const getColorByVal = (val: number) => {
    switch (val) {
      case 3:
        return bright;
      case 2:
        return mid;
      case 1:
        return dim;
      case 0:
      default:
        return voidCol;
    }
  };

  const handleInteractionSound = (freq: number = 720) => {
    try {
      watchknightAudio.play8BitBlip(freq);
    } catch {
      // Safe audio trigger
    }
  };

  return (
    <article
      data-testid="retro-content-about"
      className="flex flex-col gap-3 font-pixel select-text"
      style={{ color: bright }}
    >
      {/* 1. TERMINAL HEADER */}
      <div
        className="pb-1 border-b flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold tracking-wider"
        style={{ borderColor: mid, color: bright }}
        title="About"
      >
        <span>2. About &amp; Skills</span>
        <span
          className="text-[7.5px] px-1 py-0.2 border"
          style={{ backgroundColor: dim, borderColor: mid, color: bright }}
        >
          Profile
        </span>
      </div>

      {/* WIDESCREEN 2-COLUMN DASHBOARD (5fr left / 7fr right on desktop) */}
      <div
        data-testid="about-widescreen-dashboard"
        className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start"
      >
        {/* LEFT COLUMN (5fr): Identity Card + 2-paragraph Biography */}
        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-3.5 min-w-0">
          {/* 2. TOP IDENTITY CARD: Pixel Portrait + Abdur Rahman Moayed + EWU CSE + Pulsing Availability Badge */}
          <div
            data-testid="about-identity-card"
            className="p-3 sm:p-3.5 border flex flex-col sm:flex-row gap-3.5 items-start"
            style={{ backgroundColor: `${dim}40`, borderColor: mid }}
          >
            {/* Left: Pixel Portrait Frame */}
            <div className="flex flex-col items-center gap-1 shrink-0 self-center sm:self-start">
              <div
                className="p-1 border"
                style={{
                  backgroundColor: voidCol,
                  borderColor: bright,
                  boxShadow: `2px 2px 0px 0px ${voidCol}`,
                }}
              >
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 16 16"
                  shapeRendering="crispEdges"
                  className="shape-rendering-crisp"
                  style={{ imageRendering: 'pixelated' }}
                  aria-label="Pixel Portrait of Abdur Rahman Moayed (@watchknight)"
                  role="img"
                >
                  {PIXEL_KNIGHT_16x16.map((row, y) =>
                    row.map((val, x) => (
                      <rect
                        key={`${y}-${x}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                        fill={getColorByVal(val)}
                      />
                    ))
                  )}
                </svg>
              </div>
              <span
                className="text-[6.5px] uppercase tracking-tighter font-mono"
                style={{ color: mid }}
              >
                16x16 Pixel Art
              </span>
            </div>

            {/* Right: Clean High-Converting Engineering Profile */}
            <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
              {/* Identity Header */}
              <div
                className="flex items-center justify-between flex-wrap gap-1.5 border-b pb-1.5"
                style={{ borderColor: `${mid}60` }}
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[11px] sm:text-[12px] tracking-wide truncate" style={{ color: bright }}>
                    ABDUR RAHMAN MOAYED <span className="font-mono text-[9px] font-normal" style={{ color: `${bright}aa` }}>(@watchknight)</span>
                  </span>
                  <span className="font-mono text-[8.5px] sm:text-[9.5px] leading-tight" style={{ color: `${bright}cc` }}>
                    B.Sc. in Computer Science &amp; Engineering at East West University, Dhaka, Bangladesh
                  </span>
                </div>
                <span
                  className="px-1.5 py-0.5 border text-[7.5px] sm:text-[8px] font-bold font-mono shrink-0"
                  style={{ backgroundColor: bright, color: voidCol, borderColor: bright }}
                >
                  @watchknight
                </span>
              </div>

              {/* Pulsing Availability Badge */}
              <div
                data-testid="pulsing-availability-badge"
                className="inline-flex items-center gap-1.5 px-2 py-1 border font-mono text-[7.5px] sm:text-[8.5px] font-bold animate-pulse"
                style={{
                  backgroundColor: `${voidCol}99`,
                  borderColor: bright,
                  color: bright,
                  boxShadow: `1px 1px 0px 0px ${voidCol}`,
                }}
              >
                <span
                  className="inline-block w-2 h-2 shrink-0 border"
                  style={{
                    backgroundColor: bright,
                    borderColor: voidCol,
                    boxShadow: `0 0 6px ${bright}`,
                  }}
                />
                <span className="tracking-wide">
                  Available for Software Engineering Internships &amp; Full-Stack Roles
                </span>
              </div>

              {/* System Telemetry & Metadata */}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 font-mono text-[7.5px] sm:text-[8px] pt-0.5" style={{ color: mid }}>
                <span>LOCATION: <strong style={{ color: bright }}>Dhaka, BD (23°N, 90°E)</strong></span>
                <span>•</span>
                <span>TIMEZONE: <strong style={{ color: bright }}>UTC+6</strong></span>
                <span>•</span>
                <span>DEGREE: <strong style={{ color: bright }}>B.Sc. CSE (2022–2026)</strong></span>
              </div>
            </div>
          </div>

          {/* 3. CONCISE 2-PARAGRAPH BIOGRAPHY (in readable 'Plus Jakarta Sans', max-width: 62ch) */}
          <div
            data-testid="about-biography-section"
            className="p-3 sm:p-3.5 border flex flex-col gap-2"
            style={{ backgroundColor: `${dim}33`, borderColor: `${mid}80` }}
          >
            <div
              className="font-pixel font-bold uppercase text-[8.5px] sm:text-[9.5px] tracking-wider pb-1 border-b"
              style={{ borderColor: `${mid}50`, color: bright }}
            >
              About Me
            </div>
            <div
              className="font-body flex flex-col gap-2.5"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14.5px',
                lineHeight: 1.6,
                maxWidth: '62ch',
                color: bright,
              }}
            >
              <p>
                I am a Computer Science &amp; Engineering undergraduate at{' '}
                <strong style={{ color: bright, fontWeight: 700 }}>East West University, Dhaka, Bangladesh</strong>.{' '}
                My core engineering discipline combines strong Data Structures &amp; Algorithms fundamentals in C++ and Python with high-performance TypeScript, React, and interactive web applications.{' '}
                I design and engineer interactive educational platforms like <strong style={{ color: bright, fontWeight: 700 }}>BitForge</strong> to build deep visual algorithm intuition, alongside measurable cognitive performance tools like <strong style={{ color: bright, fontWeight: 700 }}>FocusLab</strong> with sub-millisecond reaction telemetry.
              </p>
              <p style={{ color: `${bright}ee` }}>
                My full-stack production systems span localized consumer applications including <strong style={{ color: bright, fontWeight: 700 }}>Rannabanna</strong> (real-time pantry matching across global and Bengali cuisines) and <strong style={{ color: bright, fontWeight: 700 }}>DocLensBD</strong> (optical e-commerce with real-time 3D camera face-tracking try-on and custom prescription flows), as well as spatial physics workspaces like <strong style={{ color: bright, fontWeight: 700 }}>Mental Defrag</strong>. I combine rigorous CSE principles with modern interactive web technologies to build deterministic, high-converting platforms with robust memory discipline and clean software architecture.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7fr): 3-category Skills & Capabilities cards side-by-side + Core Competencies */}
        <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-3.5 min-w-0">
          {/* 4. CLEAN 3-COLUMN CAPABILITY GRID (Frontend & Interactive UI, Backend, Data & Cloud, Core CSE & Languages) */}
          <div
            data-testid="skills-capability-grid"
            className="p-2.5 sm:p-3 border flex flex-col gap-2.5"
            style={{ backgroundColor: `${dim}40`, borderColor: mid }}
          >
            <div
              className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-bold uppercase pb-1 border-b"
              style={{ borderColor: `${mid}60`, color: bright }}
            >
              <span>Skills</span>
              <span className="font-mono text-[7px]" style={{ color: mid }}>Capability Grid</span>
            </div>

            {/* 3-category cards side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
              {CAPABILITY_COLUMNS.map((col, idx) => (
                <div
                  key={col.title}
                  data-testid={`capability-column-${idx}`}
                  onMouseEnter={() => handleInteractionSound(520 + idx * 100)}
                  className="p-2.5 border flex flex-col gap-2 cursor-default transition-none"
                  style={{
                    backgroundColor: `${voidCol}80`,
                    borderColor: `${mid}70`,
                  }}
                >
                  {/* Column Header */}
                  <div
                    className="pb-1 border-b font-pixel text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wide"
                    style={{ borderColor: `${mid}50`, color: bright }}
                  >
                    <span>{col.title}</span>
                  </div>

                  {/* Skills List */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {col.skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[8px] sm:text-[9px] px-2 py-0.5 border"
                        style={{
                          backgroundColor: `${dim}50`,
                          borderColor: `${mid}50`,
                          color: `${bright}f0`,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. CORE CSE COMPETENCIES SUMMARY */}
          <div
            className="p-2.5 border flex flex-col gap-1.5 text-[7.5px] sm:text-[8px]"
            style={{ borderColor: `${mid}60`, backgroundColor: `${dim}20` }}
          >
            <div className="font-bold uppercase tracking-wider" style={{ color: bright }}>
              Core Competencies:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[8px] sm:text-[9px]" style={{ color: `${bright}cc` }}>
              <div>• C++ / C Systems</div>
              <div>• TypeScript &amp; React 18</div>
              <div>• WebGL &amp; 3D Web</div>
              <div>• Cloud Firestore &amp; DBs</div>
              <div>• Interactive Algorithm Visualization</div>
              <div>• Native Web Audio API</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default AboutMeView;
