import React from 'react';
import type { PhosphorColorTokens } from '../RetroOSWindow';
import { watchknightAudio } from '../../audio/WatchknightAudioEngine';

export interface AboutMeViewProps {
  palette?: PhosphorColorTokens;
}

// 16x16 2-bit Phosphor Pixel Art Matrix: Cyberdeck Knight / Sentinel Visor Avatar
// 0: void, 1: dim, 2: mid, 3: bright
const PIXEL_KNIGHT_16x16 = [
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

export const AboutMeView: React.FC<AboutMeViewProps> = ({ palette }) => {
  const bright = palette?.bright ?? '#c2cdb4';
  const voidCol = palette?.void ?? '#111712';
  const mid = palette?.mid ?? '#6e7d62';
  const dim = palette?.dim ?? '#2e3b2b';

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
      >
        <span>=== [1] ABOUT ME // ABOUT_ME.TXT ===</span>
        <span
          className="text-[7.5px] px-1 py-0.2 border"
          style={{ backgroundColor: dim, borderColor: mid, color: bright }}
        >
          SYS.96 // CHAR_SHEET
        </span>
      </div>

      {/* 2. PIXEL PORTRAIT & RPG IDENTITY HEADER */}
      <div
        className="p-2 sm:p-2.5 border flex flex-col sm:flex-row gap-3 items-start"
        style={{ backgroundColor: `${dim}66`, borderColor: mid }}
      >
        {/* Left: Pixel Portrait Canvas Frame */}
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
              width="80"
              height="80"
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
            className="text-[6.5px] uppercase tracking-tighter"
            style={{ color: mid }}
          >
            [16x16 2BPP PHOSPHOR]
          </span>
        </div>

        {/* Right: RPG Dossier / Identity Sheet */}
        <div className="flex-1 flex flex-col gap-1.5 w-full text-[8px] sm:text-[8.5px]">
          <div className="flex items-center justify-between flex-wrap gap-1 border-b pb-1" style={{ borderColor: `${mid}66` }}>
            <span className="font-bold text-[9px] sm:text-[10px]" style={{ color: bright }}>
              NAME: ABDUR RAHMAN MOAYED
            </span>
            <span
              className="px-1 py-0.2 border text-[7px] font-bold"
              style={{ backgroundColor: bright, color: voidCol, borderColor: bright }}
            >
              @watchknight
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[7.5px] sm:text-[8px]">
            <div>
              <strong style={{ color: mid }}>GUILD / INSTITUTION:</strong>{' '}
              <span style={{ color: bright }}>B.Sc. in CSE @ East West University, Dhaka, Bangladesh</span>
            </div>
            <div>
              <strong style={{ color: mid }}>EDUCATION:</strong>{' '}
              <span style={{ color: bright }}>East West University, Dhaka (CSE Undergrad 2022-2026)</span>
            </div>
            <div>
              <strong style={{ color: mid }}>LOCATION:</strong>{' '}
              <span style={{ color: bright }}>Dhaka, BD (23°N, 90°E) // UTC+6</span>
            </div>
            <div>
              <strong style={{ color: mid }}>STATUS:</strong>{' '}
              <span className="font-bold" style={{ color: bright }}>
                ONLINE // OPEN FOR INTERNSHIPS &amp; ENGINEERING ROLES
              </span>
            </div>
          </div>

          {/* RPG Stats / Resource Bar */}
          <div
            className="mt-1 pt-1 border-t grid grid-cols-2 sm:grid-cols-4 gap-1 text-[7px]"
            style={{ borderColor: `${mid}40` }}
          >
            <div>
              <span style={{ color: mid }}>CLASS: </span>
              <span style={{ color: bright }}>CYBERDECK PALADIN</span>
            </div>
            <div>
              <span style={{ color: mid }}>LEVEL: </span>
              <span style={{ color: bright }}>LVL 96</span>
            </div>
            <div>
              <span style={{ color: mid }}>HP: </span>
              <span style={{ color: bright }}>100/100 [████]</span>
            </div>
            <div>
              <span style={{ color: mid }}>EXP: </span>
              <span style={{ color: bright }}>2026/2026 [████]</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ENGINEERING BIOGRAPHY */}
      <div
        className="p-2 sm:p-2.5 border flex flex-col gap-1.5 text-[8px] sm:text-[8.5px] leading-relaxed"
        style={{ backgroundColor: `${dim}33`, borderColor: `${mid}80` }}
      >
        <div className="font-bold uppercase text-[8.5px] sm:text-[9px]" style={{ color: bright }}>
          &gt; SYSTEM MANIFEST // ENGINEERING BIOGRAPHY:
        </div>
        <p>
          I am a Computer Science &amp; Engineering undergraduate at{' '}
          <strong style={{ color: bright }}>East West University, Dhaka</strong>.
          My core engineering discipline bridges low-level <strong style={{ color: bright }}>C/C++ Operating Systems architecture</strong>{' '}
          (POSIX shared memory, process trees, multi-process fork hierarchies, and Linux bash pipelines) with modern
          full-stack <strong style={{ color: bright }}>TypeScript, React, Next.js</strong>, and real-time GPU graphics applications.
        </p>
        <p style={{ color: `${bright}dd` }}>
          Aesthetic Paradigm: <em>WATCHKNIGHT_OS SYS.96</em> — The 1996 Cyberdeck Workstation Rendering
          a Real-Time 3D Volumetric Particle Engine. Engineered with strict 4-color monochrome phosphor tokens,
          hardware bevels, zero legacy UI noise, and zero-asset procedural Web Audio synthesis.
        </p>
      </div>

      {/* 4. PIXEL SKILL ATTRIBUTE BARS (10-BLOCK STEPPED ASCII/PIXEL GAUGES in #c2cdb4 and #2e3b2b) */}
      <div
        className="p-2 sm:p-2.5 border flex flex-col gap-2"
        style={{ backgroundColor: `${dim}40`, borderColor: mid }}
      >
        <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-bold uppercase pb-1 border-b" style={{ borderColor: `${mid}60` }}>
          <span>&gt; PIXEL ATTRIBUTE GAUGES [10-BLOCK STEPPED]</span>
          <span className="text-[7px]" style={{ color: mid }}>GAUGE REGISTERS: #c2cdb4 / #2e3b2b</span>
        </div>

        {/* Gauge 1: FRONTEND_SYS */}
        <div
          className="flex flex-col gap-1 p-1.5 border cursor-default"
          style={{ borderColor: `${mid}50`, backgroundColor: `${voidCol}80` }}
          onMouseEnter={() => handleInteractionSound(540)}
        >
          <div className="flex items-center justify-between text-[7.5px] sm:text-[8px]">
            <span className="font-bold" style={{ color: bright }}>
              FRONTEND_SYS [9/10]
            </span>
            <span className="font-mono tracking-wider font-bold" style={{ color: bright }}>
              █████████░ [90%]
            </span>
          </div>

          {/* Stepped 10-Block Pixel Gauge Bar (Active: bright #c2cdb4, Inactive: dim #2e3b2b) */}
          <div
            className="flex items-center gap-0.5 w-full h-2 border p-0.5"
            style={{ backgroundColor: voidCol, borderColor: `${mid}60` }}
            role="progressbar"
            aria-valuenow={90}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="FRONTEND_SYS 90% Stepped 10-Block Pixel Gauge"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1"
                style={{
                  backgroundColor: i < 9 ? bright : dim,
                }}
              />
            ))}
          </div>

          <div className="text-[7px] sm:text-[7.5px] leading-tight" style={{ color: `${bright}bb` }}>
            React, TypeScript, Next.js, Tailwind CSS, HTML5 Canvas
          </div>
        </div>

        {/* Gauge 2: BACKEND_DATA */}
        <div
          className="flex flex-col gap-1 p-1.5 border cursor-default"
          style={{ borderColor: `${mid}50`, backgroundColor: `${voidCol}80` }}
          onMouseEnter={() => handleInteractionSound(600)}
        >
          <div className="flex items-center justify-between text-[7.5px] sm:text-[8px]">
            <span className="font-bold" style={{ color: bright }}>
              BACKEND_DATA [8/10]
            </span>
            <span className="font-mono tracking-wider font-bold" style={{ color: bright }}>
              ████████░░ [80%]
            </span>
          </div>

          {/* Stepped 10-Block Pixel Gauge Bar (Active: bright #c2cdb4, Inactive: dim #2e3b2b) */}
          <div
            className="flex items-center gap-0.5 w-full h-2 border p-0.5"
            style={{ backgroundColor: voidCol, borderColor: `${mid}60` }}
            role="progressbar"
            aria-valuenow={80}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="BACKEND_DATA 80% Stepped 10-Block Pixel Gauge"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1"
                style={{
                  backgroundColor: i < 8 ? bright : dim,
                }}
              />
            ))}
          </div>

          <div className="text-[7px] sm:text-[7.5px] leading-tight" style={{ color: `${bright}bb` }}>
            Node.js, Express, PostgreSQL, MongoDB, Cloud Firestore
          </div>
        </div>

        {/* Gauge 3: LOW_LEVEL_OS */}
        <div
          className="flex flex-col gap-1 p-1.5 border cursor-default"
          style={{ borderColor: `${mid}50`, backgroundColor: `${voidCol}80` }}
          onMouseEnter={() => handleInteractionSound(680)}
        >
          <div className="flex items-center justify-between text-[7.5px] sm:text-[8px]">
            <span className="font-bold" style={{ color: bright }}>
              LOW_LEVEL_OS [9/10]
            </span>
            <span className="font-mono tracking-wider font-bold" style={{ color: bright }}>
              █████████░ [90%]
            </span>
          </div>

          {/* Stepped 10-Block Pixel Gauge Bar (Active: bright #c2cdb4, Inactive: dim #2e3b2b) */}
          <div
            className="flex items-center gap-0.5 w-full h-2 border p-0.5"
            style={{ backgroundColor: voidCol, borderColor: `${mid}60` }}
            role="progressbar"
            aria-valuenow={90}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="LOW_LEVEL_OS 90% Stepped 10-Block Pixel Gauge"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-full flex-1"
                style={{
                  backgroundColor: i < 9 ? bright : dim,
                }}
              />
            ))}
          </div>

          <div className="text-[7px] sm:text-[7.5px] leading-tight" style={{ color: `${bright}bb` }}>
            C, C++, Ubuntu Linux, Bash Scripting, POSIX IPC
          </div>
        </div>
      </div>

      {/* 5. CORE COMPETENCIES MATRIX (Backwards-compatibility & comprehensive coverage) */}
      <div
        className="p-2 border flex flex-col gap-1 text-[7.5px] sm:text-[8px]"
        style={{ borderColor: `${mid}60`, backgroundColor: `${dim}20` }}
      >
        <div className="font-bold uppercase tracking-wider" style={{ color: bright }}>
          &gt; CORE COMPETENCIES:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1" style={{ color: `${bright}cc` }}>
          <div>• C++ / C Systems</div>
          <div>• TypeScript &amp; React</div>
          <div>• WebGL &amp; GLSL Shaders</div>
          <div>• Three.js Volumetrics</div>
          <div>• Native Web Audio API</div>
          <div>• Linux &amp; POSIX SHM</div>
        </div>
      </div>
    </article>
  );
};

export default AboutMeView;
