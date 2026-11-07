// src/pages/404.tsx
// "Node 404: Unreachable Sector in the Watchtower"
// Interactive "Broken Chronometer / Knight's Tour" 404 Micro-World & Graph Routing Puzzle

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  Position,
  isValidKnightMove,
  get3MovePuzzle,
  posToKey,
  KnightsTourPuzzle,
} from '../utils/knightsTour';
import { watchknightAudio as audioEngine } from '../audio/WatchknightAudioEngine';
import {
  Compass,
  RotateCcw,
  Undo2,
  Home,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';

export interface NotFoundPageProps {
  onReturnHome?: () => void;
  puzzleIndex?: number;
}

const BOARD_SIZE = 5;
const COL_LABELS = ['A', 'B', 'C', 'D', 'E'];
const ROW_LABELS = ['1', '2', '3', '4', '5'];

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onReturnHome,
  puzzleIndex = 0,
}) => {
  const [puzzle] = useState<KnightsTourPuzzle>(() => get3MovePuzzle(puzzleIndex));
  const [currentPos, setCurrentPos] = useState<Position>(puzzle.start);
  const [visitedPath, setVisitedPath] = useState<Position[]>([puzzle.start]);
  const [hoveredSquare, setHoveredSquare] = useState<Position | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [invalidNotice, setInvalidNotice] = useState<string | null>(null);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>(
    'Node 404: Unreachable Sector in the Watchtower. The Broken Chronometer lattice has fractured. Current position: Square A1. Move the Watchknight in valid L-shaped jumps to reach Target E4 in exactly 3 moves.'
  );
  const [isTransitioningHome, setIsTransitioningHome] = useState<boolean>(false);

  const focusedCoordRef = useRef<Position>(puzzle.start);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const knightIconRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoRedirectTimeoutRef = useRef<number | null>(null);
  const jumpPulseRef = useRef<number>(0);
  const isSolvedRef = useRef<boolean>(false);

  useEffect(() => {
    isSolvedRef.current = isSolved;
  }, [isSolved]);

  // Compute graph edges between consecutive path coordinates
  const edges = useMemo(() => {
    const list: Array<{ from: Position; to: Position }> = [];
    for (let i = 1; i < visitedPath.length; i++) {
      list.push({ from: visitedPath[i - 1], to: visitedPath[i] });
    }
    return list;
  }, [visitedPath]);

  // Handle returning to home route smoothly
  const handleReturnHome = useCallback(() => {
    if (isTransitioningHome) return;
    setIsTransitioningHome(true);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (audioEngine.isEngineUnlocked()) {
      audioEngine.playTransitionSwoosh(0.6);
    }

    const completeNavigation = () => {
      if (onReturnHome) {
        onReturnHome();
      } else if (typeof window !== 'undefined') {
        if (
          window.location.hash.startsWith('#/404') ||
          window.location.hash.startsWith('#404')
        ) {
          window.location.hash = '';
        } else {
          window.history.pushState(null, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    };

    if (prefersReducedMotion || !boardRef.current) {
      completeNavigation();
      return;
    }

    // GSAP exit fade animation on master ticker
    gsap.to(boardRef.current, {
      autoAlpha: 0,
      y: -30,
      scale: 0.98,
      duration: 0.45,
      ease: 'power3.in',
      onComplete: completeNavigation,
    });
  }, [isTransitioningHome, onReturnHome]);

  // Reset current puzzle
  const handleReset = useCallback(() => {
    if (autoRedirectTimeoutRef.current) {
      window.clearTimeout(autoRedirectTimeoutRef.current);
    }
    setCurrentPos(puzzle.start);
    setVisitedPath([puzzle.start]);
    setIsSolved(false);
    setQuotaExceeded(false);
    setInvalidNotice(null);
    setScreenReaderAnnouncement(
      `Puzzle reset. Piece returned to Square ${COL_LABELS[puzzle.start.x]}${ROW_LABELS[puzzle.start.y]}. Target is at ${COL_LABELS[puzzle.target.x]}${ROW_LABELS[puzzle.target.y]}.`
    );

    if (audioEngine.isEngineUnlocked()) {
      audioEngine.playHoverTick(0);
    }
  }, [puzzle]);

  // Undo last step
  const handleUndo = useCallback(() => {
    if (visitedPath.length <= 1 || isSolved || isTransitioningHome) return;

    const newPath = visitedPath.slice(0, -1);
    const prevPos = newPath[newPath.length - 1];
    setVisitedPath(newPath);
    setCurrentPos(prevPos);
    setQuotaExceeded(false);
    setInvalidNotice(null);

    const moveCount = newPath.length - 1;
    setScreenReaderAnnouncement(
      `Undid last jump. Reverted to Square ${COL_LABELS[prevPos.x]}${ROW_LABELS[prevPos.y]}. Move ${moveCount} of 3.`
    );

    if (audioEngine.isEngineUnlocked()) {
      audioEngine.playHoverTick(0);
    }
  }, [visitedPath, isSolved, isTransitioningHome]);

  // Move piece to target coordinate if legal
  const handleSquareClick = useCallback(
    (target: Position) => {
      if (isSolved || isTransitioningHome) return;

      // Check if user has already spent 3 moves without reaching target
      if (visitedPath.length - 1 >= 3) {
        setQuotaExceeded(true);
        setInvalidNotice(
          '3-Move limit reached! Click "Reset Path" or "Undo Step" to try again.'
        );
        return;
      }

      const isValid = isValidKnightMove(currentPos, target, BOARD_SIZE);

      if (!isValid) {
        // Trigger invalid move feedback
        const targetLabel = `${COL_LABELS[target.x] ?? '?'}${ROW_LABELS[target.y] ?? '?'}`;
        const currentLabel = `${COL_LABELS[currentPos.x] ?? '?'}${ROW_LABELS[currentPos.y] ?? '?'}`;
        setInvalidNotice(
          `Invalid Jump: ${targetLabel} is not an L-shaped knight jump from ${currentLabel}.`
        );
        setScreenReaderAnnouncement(
          `Invalid move to ${targetLabel}. Knights must move in an L-shape: 2 squares in one dimension, 1 in the other.`
        );

        if (!audioEngine.isEngineUnlocked()) {
          audioEngine.initContext();
        }
        if (audioEngine.isEngineUnlocked()) {
          audioEngine.playHoverTick(-0.5);
        }

        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion && knightIconRef.current) {
          gsap.fromTo(
            knightIconRef.current,
            { x: -4 },
            { x: 4, duration: 0.08, repeat: 3, yoyo: true, ease: 'sine.inOut' }
          );
        }
        return;
      }

      // Valid Knight Move: unlock audio context on direct user gesture
      if (!audioEngine.isEngineUnlocked()) {
        audioEngine.initContext();
      }

      setInvalidNotice(null);
      const newPath = [...visitedPath, target];
      setVisitedPath(newPath);
      setCurrentPos(target);
      jumpPulseRef.current = 1.0;

      // Procedural 3D Spatial Audio: normalized pointer position
      const normX = (target.x / (BOARD_SIZE - 1)) * 2 - 1;
      const normY = -((target.y / (BOARD_SIZE - 1)) * 2 - 1); // Invert Y so top of board maps to spatial +Y
      if (audioEngine.isEngineUnlocked()) {
        audioEngine.playSpatialClick(normX, normY, -1);
      }

      const moveNumber = newPath.length - 1;
      const targetLabel = `${COL_LABELS[target.x]}${ROW_LABELS[target.y]}`;

      // Check if player reached the target node
      if (target.x === puzzle.target.x && target.y === puzzle.target.y) {
        if (moveNumber === 3) {
          setIsSolved(true);
          setQuotaExceeded(false);
          const msg = `Target ${targetLabel} reached in exactly 3 moves! Chronometer lattice repaired. Transitioning back to Sector Alpha...`;
          setScreenReaderAnnouncement(msg);

          const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

          if (!prefersReducedMotion && boardRef.current) {
            gsap.fromTo(
              boardRef.current,
              { scale: 1 },
              { scale: 1.02, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }
            );
          }

          const redirectDelay = prefersReducedMotion ? 300 : 1600;
          autoRedirectTimeoutRef.current = window.setTimeout(() => {
            handleReturnHome();
          }, redirectDelay);
        } else {
          // Reached target but not in 3 moves
          setQuotaExceeded(true);
          setInvalidNotice(
            `Target reached in ${moveNumber} moves, but Sector 404 requires the exact 3-move path. Reset or undo to try again!`
          );
        }
      } else if (moveNumber >= 3) {
        // 3 moves taken but missed target
        setQuotaExceeded(true);
        setInvalidNotice(
          '3 moves exhausted without reaching the target sector node. Use "Undo Step" or "Reset Path" to retry.'
        );
        setScreenReaderAnnouncement(
          `Moved to ${targetLabel}. 3-move quota reached without hitting target ${COL_LABELS[puzzle.target.x]}${ROW_LABELS[puzzle.target.y]}. Please undo or reset.`
        );
      } else {
        setScreenReaderAnnouncement(
          `Moved to ${targetLabel}. Move ${moveNumber} of 3. Target is at ${COL_LABELS[puzzle.target.x]}${ROW_LABELS[puzzle.target.y]}.`
        );
      }
    },
    [currentPos, isSolved, isTransitioningHome, puzzle, visitedPath, handleReturnHome]
  );

  // Square hover audio trigger
  const handleSquareMouseEnter = (pos: Position) => {
    setHoveredSquare(pos);
    const isValid = isValidKnightMove(currentPos, pos, BOARD_SIZE);
    if (isValid && audioEngine.isEngineUnlocked()) {
      const normX = (pos.x / (BOARD_SIZE - 1)) * 2 - 1;
      audioEngine.playHoverTick(normX);
    }
  };

  const handleSquareMouseLeave = () => {
    setHoveredSquare(null);
  };

  // Keyboard accessibility: Escape to home, Arrow keys navigation across 5x5 grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReturnHome();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const prev = focusedCoordRef.current;
        let nextX = prev.x;
        let nextY = prev.y;
        if (e.key === 'ArrowUp') nextY = Math.max(0, prev.y - 1);
        if (e.key === 'ArrowDown') nextY = Math.min(BOARD_SIZE - 1, prev.y + 1);
        if (e.key === 'ArrowLeft') nextX = Math.max(0, prev.x - 1);
        if (e.key === 'ArrowRight') nextX = Math.min(BOARD_SIZE - 1, prev.x + 1);

        focusedCoordRef.current = { x: nextX, y: nextY };
        const targetBtn = document.getElementById(`square-${nextX}-${nextY}`);
        targetBtn?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoRedirectTimeoutRef.current) {
        window.clearTimeout(autoRedirectTimeoutRef.current);
      }
    };
  }, [handleReturnHome]);

  // WebGL / Canvas Broken Chronometer Simulation (Driven strictly by gsap.ticker)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let particlesMesh: THREE.Points | null = null;
    let gearMesh: THREE.LineSegments | null = null;
    let ticksGroup: THREE.Group | null = null;
    let useFallback2D = false;

    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        useFallback2D = true;
      } else {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        camera.position.set(0, 0, 400);

        // 1. Broken Gear Teeth (LineSegments)
        const gearGeom = new THREE.BufferGeometry();
        const gearVertices: number[] = [];
        const numTeeth = 36;
        const baseRadius = 140;
        const toothHeight = 16;

        for (let i = 0; i < numTeeth; i++) {
          const angle1 = (i / numTeeth) * Math.PI * 2;
          const angle2 = ((i + 0.5) / numTeeth) * Math.PI * 2;
          const r = i % 3 === 0 ? baseRadius + toothHeight : baseRadius; // Fractured tooth pattern

          const x1 = Math.cos(angle1) * baseRadius;
          const y1 = Math.sin(angle1) * baseRadius;
          const x2 = Math.cos(angle2) * r;
          const y2 = Math.sin(angle2) * r;

          gearVertices.push(x1, y1, 0, x2, y2, 0);
        }

        gearGeom.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(gearVertices, 3)
        );
        const gearMaterial = new THREE.LineBasicMaterial({
          color: 0xff2a85,
          transparent: true,
          opacity: 0.55,
        });
        gearMesh = new THREE.LineSegments(gearGeom, gearMaterial);
        scene.add(gearMesh);

        // 2. Fractured Radial Hour Ticks
        ticksGroup = new THREE.Group();
        for (let h = 0; h < 12; h++) {
          const angle = (h / 12) * Math.PI * 2;
          const isBroken = h === 4 || h === 8; // Displaced ticks for Node 404
          const tickLen = isBroken ? 28 : 18;
          const offsetAngle = isBroken ? angle + 0.12 : angle;

          const tickGeom = new THREE.BufferGeometry();
          const xStart = Math.cos(offsetAngle) * 165;
          const yStart = Math.sin(offsetAngle) * 165;
          const xEnd = Math.cos(offsetAngle) * (165 + tickLen);
          const yEnd = Math.sin(offsetAngle) * (165 + tickLen);

          tickGeom.setAttribute(
            'position',
            new THREE.Float32BufferAttribute([xStart, yStart, 0, xEnd, yEnd, 0], 3)
          );

          const tickMat = new THREE.LineBasicMaterial({
            color: isBroken ? 0xff2a85 : 0x00f0ff,
            transparent: true,
            opacity: isBroken ? 0.9 : 0.45,
          });

          ticksGroup.add(new THREE.LineSegments(tickGeom, tickMat));
        }
        scene.add(ticksGroup);

        // 3. Orbiting Temporal Particle Shards
        const particleCount = 140;
        const particleGeom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorMagenta = new THREE.Color(0xff2a85);
        const colorCyan = new THREE.Color(0x00f0ff);
        const colorIvory = new THREE.Color(0xf0efe6);

        for (let p = 0; p < particleCount; p++) {
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = 80 + Math.random() * 160;
          positions[p * 3] = Math.cos(pAngle) * pDist;
          positions[p * 3 + 1] = Math.sin(pAngle) * pDist;
          positions[p * 3 + 2] = (Math.random() - 0.5) * 60;

          const chosenColor =
            p % 4 === 0
              ? colorMagenta
              : p % 4 === 1
              ? colorCyan
              : colorIvory;
          colors[p * 3] = chosenColor.r;
          colors[p * 3 + 1] = chosenColor.g;
          colors[p * 3 + 2] = chosenColor.b;
        }

        particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
          size: 3.5,
          vertexColors: true,
          transparent: true,
          opacity: 0.6,
        });
        particlesMesh = new THREE.Points(particleGeom, particleMat);
        scene.add(particlesMesh);
      }
    } catch {
      useFallback2D = true;
    }

    // Resize handler
    const updateDimensions = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const w = rect?.width || 500;
      const h = rect?.height || 500;
      canvas.width = w;
      canvas.height = h;

      if (renderer && camera) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Render callback attached to existing gsap.ticker
    const render404 = () => {
      jumpPulseRef.current = Math.max(0, jumpPulseRef.current - 0.025);
      const solved = isSolvedRef.current;

      if (!useFallback2D && renderer && scene && camera) {
        if (!prefersReducedMotion) {
          const t = gsap.ticker.time;
          if (gearMesh) {
            gearMesh.rotation.z = t * 0.15 + (solved ? t * 0.4 : 0);
          }
          if (particlesMesh) {
            particlesMesh.rotation.z = -t * 0.1;
            const pulseScale = 1 + jumpPulseRef.current * 0.15;
            particlesMesh.scale.set(pulseScale, pulseScale, pulseScale);
          }
        }
        renderer.render(scene, camera);
      } else {
        // High-performance 2D Canvas Fallback
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const t = prefersReducedMotion ? 0 : gsap.ticker.time;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.08);

        // Draw Broken Dial Ring
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 1.85); // Fractured gap
        ctx.strokeStyle = solved ? '#4AF626' : '#FF2A85';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();

        ctx.restore();
      }
    };

    gsap.ticker.add(render404);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(render404);
      window.removeEventListener('resize', updateDimensions);
      if (renderer) {
        renderer.dispose();
      }
      if (gearMesh) {
        gearMesh.geometry.dispose();
        (gearMesh.material as THREE.Material).dispose();
      }
      if (particlesMesh) {
        particlesMesh.geometry.dispose();
        (particlesMesh.material as THREE.Material).dispose();
      }
      if (ticksGroup) {
        ticksGroup.traverse((child) => {
          if (child instanceof THREE.LineSegments) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
      }
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between items-center p-4 sm:p-8 md:p-12 overflow-x-hidden selection:bg-[#FF2A85] selection:text-[#F0EFE6]"
      style={{
        backgroundColor: 'var(--crt-void-bg, #070814)',
        color: 'var(--pixel-ivory-text, #F0EFE6)',
      }}
    >
      {/* Background Architectural Noise & Fine Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0, 240, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Screen Reader Live Telemetry Region */}
      <div className="sr-only" aria-live="polite" role="status">
        {screenReaderAnnouncement}
      </div>

      {/* Top Telemetry Header */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between border-b-2 border-[#2D3645] pb-4">
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 bg-[#FF2A85] animate-ping motion-reduce:animate-none"
          />
          <span className="font-pixel text-[9px] uppercase tracking-wider text-[#00F0FF]">
            NODE 404 // BROKEN CHRONOMETER SECTOR
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => audioEngine.toggleMute()}
            className="p-2 border-2 border-[#2D3645] bg-[#131629] text-[#8E98AA] hover:text-[#00F0FF] hover:border-[#00F0FF] transition-colors focus:outline-none"
            aria-label={audioEngine.isAudioMuted() ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          >
            {audioEngine.isAudioMuted() ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#4AF626]" />
            )}
          </button>

          <button
            onClick={handleReturnHome}
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#2D3645] bg-[#131629] text-xs font-pixel text-[9px] uppercase tracking-wider text-[#00F0FF] hover:border-[#00F0FF] hover:bg-[#070814] transition-colors focus:outline-none"
          >
            <Home className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Return to Home</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center my-auto py-8">
        {/* Narrative & Error Code Headline */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-pixel text-[9px] uppercase tracking-wider text-[#FF2A85] mb-2 px-2.5 py-1 border-2 border-[#FF2A85]/40 bg-[#FF2A85]/10">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>TEMPORAL SECTOR FAULT // 404</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight text-[#F0EFE6]">
            Unreachable Sector in the Watchtower
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#8E98AA] max-w-xl mx-auto leading-relaxed">
            The chronometric sentinel lattice has fractured. Execute valid{' '}
            <span className="text-[#00F0FF] font-mono font-semibold">
              Knight Graph Jumps
            </span>{' '}
            (|dx|=1, |dy|=2 or |dx|=2, |dy|=1) to reconnect Sector Alpha in exactly{' '}
            <span className="text-[#4AF626] font-mono font-bold">3 moves</span>.
          </p>
        </div>

        {/* Puzzle Status Ledger HUD */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2 p-2 mb-4 border-2 border-[#2D3645] bg-[#131629] text-center font-mono text-xs">
          <div>
            <span className="text-[#8E98AA] block text-[10px] uppercase font-pixel text-[8px]">Origin Node</span>
            <span className="text-[#F0EFE6] font-bold">
              {COL_LABELS[puzzle.start.x]}
              {ROW_LABELS[puzzle.start.y]}
            </span>
          </div>
          <div>
            <span className="text-[#8E98AA] block text-[10px] uppercase font-pixel text-[8px]">Moves Taken</span>
            <span
              className="font-bold text-sm"
              style={{
                color:
                  visitedPath.length - 1 === 3 && isSolved
                    ? 'var(--pixel-phosphor-green, #4AF626)'
                    : visitedPath.length - 1 >= 3
                    ? 'var(--tech-magenta-crest, #FF2A85)'
                    : 'var(--pixel-ivory-text, #F0EFE6)',
              }}
            >
              {`${visitedPath.length - 1} / 3`}
            </span>
          </div>
          <div>
            <span className="text-[#8E98AA] block text-[10px] uppercase font-pixel text-[8px]">Target Sector</span>
            <span
              className="font-bold animate-pulse motion-reduce:animate-none"
              style={{ color: 'var(--tech-magenta-crest, #FF2A85)' }}
            >
              {COL_LABELS[puzzle.target.x]}
              {ROW_LABELS[puzzle.target.y]}
            </span>
          </div>
        </div>

        {/* Invalid Notice / Quota Exceeded Banner */}
        {invalidNotice && (
          <div
            className="mb-4 px-3 py-1.5 border-2 border-[#FF2A85] text-xs font-mono text-[#FF2A85] bg-[#FF2A85]/10 flex items-center gap-2"
            role="alert"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{invalidNotice}</span>
          </div>
        )}

        {/* Success Banner */}
        {isSolved && (
          <div
            className="mb-4 px-4 py-2 border-2 border-[#4AF626] text-xs sm:text-sm font-mono text-[#4AF626] bg-[#0D1512] flex items-center gap-2.5 animate-bounce motion-reduce:animate-none"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4AF626]" />
            <span className="font-semibold">
              SECTOR REPAIRED // Solved in exactly 3 moves! Smoothly transitioning back to Sector Alpha...
            </span>
          </div>
        )}

        {/* 5x5 Knight's Tour Chessboard Container with Ambient WebGL Broken Chronometer */}
        <div
          ref={boardRef}
          className="relative p-3 sm:p-5 border-2 border-[#2D3645] bg-[#131629]/90 shadow-2xl backdrop-blur-md select-none overflow-hidden"
        >
          {/* Ambient WebGL Broken Chronometer Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
          />

          {/* Top Column Coordinates (A to E) */}
          <div className="relative z-10 grid grid-cols-5 gap-2 mb-2 px-1 text-center font-mono text-xs text-[#8E98AA]">
            {COL_LABELS.map((col) => (
              <div key={col}>{col}</div>
            ))}
          </div>

          {/* Chessboard Grid Stage with SVG Edge Overlay */}
          <div className="relative z-10">
            {/* SVG Graph Edges Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 500 500"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="verdigris-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Render glowing --pixel-phosphor-green edges for visited graph transitions */}
              {edges.map((edge, idx) => {
                const x1 = (edge.from.x + 0.5) * 100;
                const y1 = (edge.from.y + 0.5) * 100;
                const x2 = (edge.to.x + 0.5) * 100;
                const y2 = (edge.to.y + 0.5) * 100;

                return (
                  <g key={`edge-${idx}`}>
                    {/* Outer glow stroke */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--pixel-phosphor-green, #4AF626)"
                      strokeWidth="5"
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                    />
                    {/* Inner crisp line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="var(--pixel-phosphor-green, #4AF626)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      filter="url(#verdigris-glow)"
                    />
                  </g>
                );
              })}

              {/* Dynamic Dashed Preview Edge for hovered valid jump */}
              {hoveredSquare &&
                !quotaExceeded &&
                isValidKnightMove(currentPos, hoveredSquare, BOARD_SIZE) && (
                  <line
                    x1={(currentPos.x + 0.5) * 100}
                    y1={(currentPos.y + 0.5) * 100}
                    x2={(hoveredSquare.x + 0.5) * 100}
                    y2={(hoveredSquare.y + 0.5) * 100}
                    stroke="var(--pixel-phosphor-green, #4AF626)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                  />
                )}
            </svg>

            {/* 5x5 Squares Grid */}
            <div
              className="grid grid-cols-5 gap-2 sm:gap-3"
              style={{ width: 'clamp(280px, 75vw, 420px)', height: 'clamp(280px, 75vw, 420px)' }}
              role="grid"
              aria-label="5 by 5 Knight's Tour Chessboard"
            >
              {Array.from({ length: BOARD_SIZE }).map((_, y) =>
                Array.from({ length: BOARD_SIZE }).map((_, x) => {
                  const isCurrent = currentPos.x === x && currentPos.y === y;
                  const isTarget = puzzle.target.x === x && puzzle.target.y === y;
                  const isVisited = visitedPath.some((p) => p.x === x && p.y === y);
                  const isValidCandidate =
                    !quotaExceeded && isValidKnightMove(currentPos, { x, y }, BOARD_SIZE);
                  const isDarkSquare = (x + y) % 2 === 1;

                  // Label for accessibility & display
                  const squareLabel = `${COL_LABELS[x]}${ROW_LABELS[y]}`;

                  return (
                    <button
                      id={`square-${x}-${y}`}
                      key={posToKey({ x, y })}
                      onClick={() => handleSquareClick({ x, y })}
                      onMouseEnter={() => handleSquareMouseEnter({ x, y })}
                      onMouseLeave={handleSquareMouseLeave}
                      disabled={isSolved || isTransitioningHome}
                      aria-label={`Square ${squareLabel}${
                        isCurrent
                          ? ', Watchknight current position'
                          : isTarget
                          ? ', Target sector node'
                          : isValidCandidate
                          ? ', Valid knight move available'
                          : ''
                      }`}
                      className={`relative flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#4AF626] ${
                        isDarkSquare ? 'bg-[#070814]/85' : 'bg-[#131629]/85'
                      } ${
                        isValidCandidate && !isSolved
                          ? 'border-2 border-[#4AF626]/80 cursor-pointer shadow-[0_0_12px_rgba(74,246,38,0.35)] hover:bg-[#4AF626]/20'
                          : 'border border-white/5 cursor-default'
                      }`}
                    >
                      {/* Sub-label coordinate watermark */}
                      <span className="absolute bottom-1 right-1 font-mono text-[9px] text-white/20 select-none">
                        {squareLabel}
                      </span>

                      {/* Visited Node Marker */}
                      {isVisited && !isCurrent && (
                        <div
                          className="w-2.5 h-2.5 z-10"
                          style={{
                            backgroundColor: 'var(--pixel-phosphor-green, #4AF626)',
                            boxShadow: '0 0 8px #4AF626',
                          }}
                        />
                      )}

                      {/* Target Beacon */}
                      {isTarget && !isCurrent && (
                        <div className="relative flex items-center justify-center z-10">
                          <span
                            className="absolute w-6 h-6 animate-ping opacity-75 motion-reduce:animate-none"
                            style={{ backgroundColor: 'var(--tech-magenta-crest, #FF2A85)' }}
                          />
                          <span
                            className="w-3.5 h-3.5 border-2 border-[#F0EFE6]"
                            style={{ backgroundColor: 'var(--tech-magenta-crest, #FF2A85)' }}
                          />
                        </div>
                      )}

                      {/* Active Watchknight Piece Indicator */}
                      {isCurrent && (
                        <div
                          ref={knightIconRef}
                          className="relative flex items-center justify-center z-30"
                        >
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-[#F0EFE6] shadow-lg"
                            style={{
                              backgroundColor: isSolved
                                ? 'var(--pixel-phosphor-green, #4AF626)'
                                : 'var(--tech-magenta-crest, #FF2A85)',
                            }}
                          >
                            {/* Stylized Knight SVG glyph */}
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-[#F0EFE6]"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19 22H5a1 1 0 0 1-1-1v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1a1 1 0 0 1-1 1ZM19 8.5C19 5 16 3 13 3c-1.2 0-2.3.4-3.2 1.1-.9.7-1.4 1.7-1.8 2.9l-2.6 1.7A1 1 0 0 0 5 9.5v2a1 1 0 0 0 .5.9l2.8 1.4c.2 1 .8 2 1.7 2.6V18h8v-3.5c0-1.5.5-2.8 1-4.2.3-.9.5-1.9.5-2.8l-.5 1z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Valid Jump Target Beacon ring */}
                      {isValidCandidate && !isCurrent && !isSolved && (
                        <span
                          className="absolute w-2 h-2 animate-pulse motion-reduce:animate-none"
                          style={{ backgroundColor: 'var(--pixel-phosphor-green, #4AF626)' }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Puzzle Controls and Hint Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={handleUndo}
            disabled={visitedPath.length <= 1 || isSolved || isTransitioningHome}
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#2D3645] bg-[#131629] text-xs font-pixel text-[9px] uppercase tracking-wider text-[#8E98AA] hover:text-[#00F0FF] hover:border-[#00F0FF] transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Step</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-[#2D3645] bg-[#131629] text-xs font-pixel text-[9px] uppercase tracking-wider text-[#8E98AA] hover:text-[#00F0FF] hover:border-[#00F0FF] transition-colors focus:outline-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Path</span>
          </button>

          <button
            onClick={handleReturnHome}
            className="inline-flex items-center gap-2 px-4 py-1.5 font-pixel text-[9px] uppercase tracking-wider font-semibold border-2 border-[#4AF626] text-[#4AF626] bg-[#0D1512] hover:bg-[#4AF626] hover:text-[#070814] transition-colors focus:outline-none"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Bypass to Home Route</span>
          </button>
        </div>
      </main>

      {/* Semantic Text Content for SEO & Assistive Crawlers underneath WebGL Canvas */}
      <section
        className="relative z-10 w-full max-w-4xl border-t border-white/10 pt-6 mt-4"
        aria-label="Node 404 Sector Telemetry and Directory"
      >
        <div className="text-[#8E98AA] font-mono text-xs space-y-3">
          <h2 className="text-sm font-semibold text-[#F0EFE6] uppercase tracking-wider">
            Sector 404 Telemetry & Chronometric Directory
          </h2>
          <p className="leading-relaxed">
            You have accessed an unmapped temporal sector within the{' '}
            <strong className="text-[#F0EFE6]">@watchknight</strong> portfolio runtime. The
            interactive 5x5 chessboard above simulates an algorithmic graph traversal puzzle
            governed by standard chess knight jumps: every move must span strictly two squares in
            one dimension and one square in the orthogonal dimension.
          </p>

          <nav aria-label="Portfolio Flagship Sectors" className="pt-2">
            <span className="block text-[#F0EFE6] font-medium mb-1.5">
              Available Direct Routes:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <li>
                <a
                  href="/#work"
                  onClick={(e) => {
                    e.preventDefault();
                    handleReturnHome();
                  }}
                  className="inline-flex items-center gap-1.5 text-[#00F0FF] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>01: Mental Defrag</span>
                </a>
              </li>
              <li>
                <a
                  href="/#work"
                  onClick={(e) => {
                    e.preventDefault();
                    handleReturnHome();
                  }}
                  className="inline-flex items-center gap-1.5 text-[#00F0FF] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>02: DocLensBD</span>
                </a>
              </li>
              <li>
                <a
                  href="/#work"
                  onClick={(e) => {
                    e.preventDefault();
                    handleReturnHome();
                  }}
                  className="inline-flex items-center gap-1.5 text-[#00F0FF] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>03: Trash Trail & Aether-GL</span>
                </a>
              </li>
              <li>
                <a
                  href="/#work"
                  onClick={(e) => {
                    e.preventDefault();
                    handleReturnHome();
                  }}
                  className="inline-flex items-center gap-1.5 text-[#00F0FF] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>04: Rannabanna & Neon Vanguard</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </section>

      {/* Footer Colophon */}
      <footer className="relative z-10 w-full max-w-4xl border-t border-white/10 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between text-[#8E98AA] font-mono text-fluid-micro gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-[#FF2A85]" />
          <span>EST. EAST WEST UNIVERSITY // CSE DEPT // 23.7644° N, 90.4252° E</span>
        </div>
        <div>
          <span>@WATCHKNIGHT PORTFOLIO CHRONOMETER RUNTIME // 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;
