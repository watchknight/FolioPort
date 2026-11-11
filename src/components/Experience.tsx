import React from 'react';
import { useReveal } from '../hooks/useReveal';
import { audio } from '../utils/audio';
import { Magnetic } from './ui/Magnetic';
import { 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  MapPin, 
  ChevronRight
} from 'lucide-react';

interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  location: string;
  type: 'Academic' | 'Full-Stack Architecture' | 'Systems & Labs';
  description: string;
  achievements: string[];
  techStack: string[];
}

const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-1',
    role: 'Computer Science & Engineering (CSE) Undergraduate',
    organization: 'East West University, Bangladesh',
    period: '2021 - Present (Senior)',
    location: 'Dhaka, Bangladesh',
    type: 'Academic',
    description: 'Specializing in Operating Systems, POSIX Systems Programming, Advanced Data Structures, and Distributed Computing.',
    achievements: [
      'Implemented C multi-process fork() hierarchies with anonymous duplex pipes and POSIX shared memory (shmget, shmat) with spinlock synchronization.',
      'Designed deterministic memory benchmarks with Valgrind ensuring 0 memory leaks across high-throughput IPC pipelines.',
      'Active researcher in browser hardware acceleration, WebGL canvas pacing, and localized Bengali NLP font subsetting.',
    ],
    techStack: ['C / C++', 'Linux POSIX', 'Operating Systems', 'Algorithms', 'Valgrind', 'Bash'],
  },
  {
    id: 'exp-2',
    role: 'Full-Stack Web Architect & Open-Source Engineer',
    organization: 'Independent Systems & Production Platforms',
    period: '2022 - Present',
    location: 'Remote / Global',
    type: 'Full-Stack Architecture',
    description: 'Building resilient full-stack web platforms, spatial engines, and reactive cloud architectures from zero to production.',
    achievements: [
      'Engineered Mental Defrag: Zero-gravity spatial cognitive canvas with local vector embeddings and bi-directional Obsidian .canvas JSON AST parsing.',
      'Built DocLensBD: Real-time Cloud Firestore diagnostic pipeline with automated GitHub Actions CI/CD (14/14 test pass rate).',
      'Developed Rannabanna: High-performance Bengali culinary platform with Unicode font subsetting reducing critical CSS/font payload by 78%.',
    ],
    techStack: ['React 18', 'TypeScript', 'Matter.js', 'Cloud Firestore', 'Vite', 'Tailwind CSS', 'GitHub Actions'],
  },
  {
    id: 'exp-3',
    role: 'Creative Technologist & Low-Level Labs Architect',
    organization: 'BitForge & Graphics Micro-Engines',
    period: '2023 - Present',
    location: 'Open Source',
    type: 'Systems & Labs',
    description: 'Building hardware-adjacent graphics loops, kinetic scroll choreographies, and procedural Web Audio synthesizers.',
    achievements: [
      'Engineered Neon Vanguard: 120 FPS HTML5 2D canvas combat engine with raycast projectile piercing and recursive chain-lightning generator.',
      'Choreographed Trash Trail: Kinetic pinned storytelling web architecture powered by GSAP ScrollTrigger and will-change GPU composite layers.',
      'Authored zero-dependency procedural Web Audio synthesizers and declarative scroll-reveal hook systems (useReveal).',
    ],
    techStack: ['GSAP', 'ScrollTrigger', 'Lenis', 'HTML5 2D Canvas', 'Three.js / GLSL', 'Web Audio API'],
  },
];

export const Experience: React.FC = () => {
  const containerRef = useReveal<HTMLElement>();

  return (
    <section
      id="experience"
      ref={containerRef}
      className="relative z-20 py-24 md:py-32 bg-obsidian text-alabaster border-t border-white/10 overflow-hidden"
    >
      {/* Background Telemetry Parallax Badge */}
      <div 
        data-parallax="0.1" 
        className="pointer-events-none absolute left-4 top-16 font-mono text-[9vw] font-black text-white/[0.015] select-none uppercase tracking-tighter"
        aria-hidden="true"
      >
        TIMELINE
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div data-anim className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-[#4AF626] animate-pulse shadow-[0_0_8px_#4AF626]" />
              <span className="font-pixel text-[10px] uppercase tracking-widest text-[#00F0FF]">
                Timeline • Experience
              </span>
            </div>

            <div className="overflow-visible">
              <h2 
                data-anim 
                className="font-display uppercase text-[#F0EFE6]"
                style={{
                  fontFamily: "'Space Grotesk', 'Syne', sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-0.035em',
                  fontSize: 'clamp(1.85rem, 4vw, 3.25rem)',
                  lineHeight: 1.05,
                  overflow: 'visible',
                }}
              >
                EXPERIENCE &amp; <span className="text-[#FF2A85]">TRAJECTORY</span>
              </h2>
            </div>
          </div>

          <p 
            data-anim 
            data-delay="0.15" 
            className="max-w-md font-sans text-sm sm:text-base text-[#D6CFC2] leading-relaxed"
          >
            Chronological ledger tracing academic engineering rigor at East West University alongside production-grade full-stack and low-level graphics implementations.
          </p>
        </div>

        {/* Drawn Top Divider Line */}
        <div data-draw className="w-full h-px bg-white/15 mb-14" />

        {/* Experience Timeline Container with data-stagger */}
        <div 
          data-stagger="0.08" 
          className="space-y-8"
        >
          {EXPERIENCES.map((exp, idx) => (
            <div
              key={exp.id}
              onMouseEnter={() => audio.playTick()}
              className="relative bg-[#131629] border-2 border-[#2D3645] hover:border-[#00F0FF] shadow-[2px_2px_0_0_#070814] transition-all duration-200 group"
            >
              {/* Retro Window Titlebar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D1512] border-b-2 border-[#2D3645] select-none">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[8px] px-1.5 py-0.5 bg-black/40 border border-white/20 text-[#4AF626]">
                    {exp.type.toUpperCase()}
                  </span>
                  <span className="font-pixel text-[10px] text-[#00F0FF]">
                    {exp.role}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1 mx-2 flex-1 justify-center opacity-40">
                  <div className="retro-drag-dots" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="retro-btn-box">-</span>
                  <span className="retro-btn-box">+</span>
                  <span className="retro-btn-box">x</span>
                </div>
              </div>

              {/* Window Body */}
              <div className="p-5 sm:p-6 bg-[#0D1512]/90">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  
                  {/* Left Metadata Block */}
                  <div className="lg:w-1/3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[9px] px-2 py-0.5 bg-[#131629] border border-[#00F0FF]/40 text-[#00F0FF] uppercase">
                        {exp.type}
                      </span>
                      <span className="font-pixel text-[9px] text-[#8E98AA]">
                        INDEX 0{idx + 1}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-xl sm:text-2xl text-[#F0EFE6] group-hover:text-white transition-colors">
                      {exp.role}
                    </h3>

                    <div className="flex items-center gap-1.5 text-[#FF2A85] font-medium text-sm">
                      {exp.type === 'Academic' ? (
                        <GraduationCap className="w-4 h-4 shrink-0" />
                      ) : (
                        <Briefcase className="w-4 h-4 shrink-0" />
                      )}
                      <span>{exp.organization}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-xs text-[#8E98AA]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-white/40" />
                        <span>{exp.period}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-white/40" />
                        <span>{exp.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Details Block */}
                  <div className="lg:w-2/3 space-y-4 lg:border-l lg:border-white/10 lg:pl-8">
                    <p className="font-sans text-sm text-[#D6CFC2] leading-relaxed">
                      {exp.description}
                    </p>

                    <ul className="space-y-2 text-xs sm:text-sm text-[#8E98AA]">
                      {exp.achievements.map((item, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2">
                          <span className="text-[#4AF626] font-pixel text-[8px] mt-1">•</span>
                          <span className="leading-relaxed text-[#D6CFC2]">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tech Stack Badges */}
                    <div className="pt-3 flex flex-wrap gap-1.5">
                      {exp.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-[#131629] border border-[#2D3645] font-mono text-[11px] text-[#D6CFC2] hover:border-[#00F0FF] transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Subtle Ledger Line */}
                <div className="mt-6 pt-4 border-t border-[#2D3645] flex items-center justify-between font-mono text-[11px] text-[#8E98AA]">
                  <span>Verified Record • East West University</span>
                  <span className="text-[#4AF626] opacity-0 group-hover:opacity-100 transition-opacity font-pixel text-[9px]">
                    Confirmed ✓
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Drawn Lower Ledger Divider */}
        <div data-draw className="w-full h-px bg-white/10 mt-14 mb-8" />

        {/* Navigation jump pill to skills and projects */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#8E98AA]">
          <div data-anim className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#4AF626] animate-pulse" />
            <span>ACADEMIC CSE DEGREE EXPECTED: 2025/2026</span>
          </div>

          <div data-anim data-delay="0.1">
            <Magnetic>
              <a
                href="#systems"
                aria-label="Proceed to Systems and Skills Stack section"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#131629] hover:bg-[#1A1F38] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#F0EFE6] font-pixel text-[10px] shadow-[2px_2px_0_0_#070814] transition-all"
              >
                <span>View Systems &amp; Skills</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#00F0FF]" />
              </a>
            </Magnetic>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Experience;
