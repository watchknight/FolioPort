import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useLenis } from '../hooks/useLenis';
import { useTheme } from '../context/ThemeContext';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { audio } from '../utils/audio';
import { chiptuneAudio } from '../utils/chiptuneAudio';
import { 
  Terminal as TerminalIcon, 
  Send, 
  CornerDownLeft, 
  RefreshCcw, 
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
  Gamepad2,
  Tv
} from 'lucide-react';

interface TerminalEntry {
  id: string;
  command: string;
  output: React.ReactNode;
  timestamp: string;
  isError?: boolean;
}

// Particle class for celebratory confetti
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'ribbon';
  alpha: number;
}

const CONFETTI_COLORS = [
  '#00F0FF', // Cyan wave
  '#FF2A85', // Magenta crest
  '#4AF626', // Phosphor green
  '#FFCC00', // Amber gold
  '#F0EFE6', // Ivory
  '#131629', // Panel slate
];

// =========================================================================
// 8-BIT CYBER-KNIGHT WAVE RUNNER / SPACE INVADERS MINI-GAME COMPONENT
// =========================================================================
interface ArcadeProps {
  onExit: (score: number, bugsPurged: number, wave: number) => void;
  phosphorMode: 'green' | 'amber';
}

const CyberKnightArcade: React.FC<ArcadeProps> = ({ onExit, phosphorMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('cyberknight_arcade_high') || '1200', 10);
    } catch {
      return 1200;
    }
  });
  const highScoreRef = useRef(highScore);
  const [lives, setLives] = useState<number>(3);
  const [wave, setWave] = useState<number>(1);
  const [bugsPurged, setBugsPurged] = useState<number>(0);
  const [gameState, setGameState] = useState<'PLAYING' | 'WAVE_CLEAR' | 'GAME_OVER'>('PLAYING');

  // Sound state
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('folioport_sound_enabled') === 'true' || audio.isEnabled();
    } catch {
      return false;
    }
  });
  const sfxEnabledRef = useRef(sfxEnabled);
  useEffect(() => {
    sfxEnabledRef.current = sfxEnabled;
  }, [sfxEnabled]);

  // Internal mutable game loop references
  const gameRef = useRef({
    player: { x: 280, y: 310, w: 36, h: 22, vx: 0, speed: 5.5 },
    lasers: [] as { x: number; y: number; vy: number; color: string }[],
    enemies: [] as {
      id: number;
      x: number;
      y: number;
      w: number;
      h: number;
      type: string;
      label: string;
      color: string;
      points: number;
      alive: boolean;
      animOffset: number;
    }[],
    enemyProjectiles: [] as { x: number; y: number; vy: number; color: string }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }[],
    stars: [] as { x: number; y: number; speed: number; size: number }[],
    keys: { left: false, right: false, space: false },
    enemyDir: 1,
    enemyStepDown: false,
    enemySpeed: 1.2,
    lastShotTime: 0,
    waveTransitionTimer: 0,
    time: 0,
    score: 0,
    bugsPurged: 0,
    wave: 1,
    lives: 3,
    active: true,
  });

  const primaryAccent = phosphorMode === 'green' ? '#4AF626' : '#FFCC00';
  const phosphorBorder = phosphorMode === 'green' ? 'border-[#4AF626]' : 'border-[#FFCC00]';
  const phosphorGlow = phosphorMode === 'green'
    ? 'shadow-[0_0_20px_rgba(74,246,38,0.3)]'
    : 'shadow-[0_0_20px_rgba(255,204,0,0.3)]';
  const phosphorText = phosphorMode === 'green' ? 'text-[#4AF626]' : 'text-[#FFCC00]';

  // Procedural Sound Effects for Mini-Game
  const playArcadeSound = useCallback((type: 'shoot' | 'explode' | 'wave' | 'hurt' | 'gameover') => {
    if (!sfxEnabledRef.current && !audio.isEnabled()) return;
    try {
      if (type === 'shoot') {
        audio.playPongBlip('paddle');
      } else if (type === 'explode') {
        audio.playPongBlip('score');
      } else if (type === 'wave') {
        audio.playPongBlip('unlock');
      } else if (type === 'hurt') {
        audio.playPongBlip('wall');
      } else if (type === 'gameover') {
        audio.playChord();
      }
    } catch {
      // Audio operation safely suppressed
    }
  }, []);

  const toggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    audio.setEnabled(next);
    if (next) {
      audio.playPongBlip('paddle');
    }
  };

  // Laser firing helper with cooldown rate limit
  const fireLaser = useCallback(() => {
    const g = gameRef.current;
    const now = Date.now();
    if (g.lives <= 0 || now - g.lastShotTime < 160) return;
    g.lasers.push(
      { x: g.player.x + 8, y: g.player.y - 4, vy: -7, color: '#00F0FF' },
      { x: g.player.x + 28, y: g.player.y - 4, vy: -7, color: '#00F0FF' }
    );
    g.lastShotTime = now;
    playArcadeSound('shoot');
  }, [playArcadeSound]);

  // Spawn enemy grid for wave
  const initWaveEnemies = useCallback((waveNum: number) => {
    const enemies = [];
    const rows = 3;
    const cols = 6;
    const startX = 60;
    const startY = 40;
    const spacingX = 80;
    const spacingY = 36;

    const types = [
      { type: 'LEAK', label: '0xDEAD', color: '#FF2A85', points: 150 },
      { type: 'SEGFAULT', label: 'SIGSEGV', color: '#FFCC00', points: 120 },
      { type: 'NULLPTR', label: 'NULL_PTR', color: '#00F0FF', points: 100 },
    ];

    let idCounter = 0;
    for (let r = 0; r < rows; r++) {
      const typeConfig = types[r % types.length];
      for (let c = 0; c < cols; c++) {
        enemies.push({
          id: idCounter++,
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          w: 48,
          h: 20,
          type: typeConfig.type,
          label: typeConfig.label,
          color: typeConfig.color,
          points: typeConfig.points,
          alive: true,
          animOffset: (r + c) * 0.4,
        });
      }
    }

    gameRef.current.enemies = enemies;
    gameRef.current.enemySpeed = 1.0 + waveNum * 0.35;
    gameRef.current.enemyDir = 1;
  }, []);

  // Restart Handler
  const handleRestart = useCallback(() => {
    gameRef.current.score = 0;
    gameRef.current.bugsPurged = 0;
    gameRef.current.wave = 1;
    gameRef.current.lives = 3;
    gameRef.current.lasers = [];
    gameRef.current.enemyProjectiles = [];
    gameRef.current.particles = [];
    gameRef.current.player.x = 280;
    setScore(0);
    setBugsPurged(0);
    setWave(1);
    setLives(3);
    setGameState('PLAYING');
    initWaveEnemies(1);
    audio.playChord();
  }, [initWaveEnemies]);

  const restartRef = useRef(handleRestart);
  useEffect(() => {
    restartRef.current = handleRestart;
  }, [handleRestart]);

  // Initialize stars background
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * 600,
        y: Math.random() * 360,
        speed: 0.5 + Math.random() * 1.5,
        size: Math.random() > 0.8 ? 2 : 1,
      });
    }
    gameRef.current.stars = stars;
    initWaveEnemies(1);
  }, [initWaveEnemies]);

  // Keyboard handlers including 'r' / 'R' / Space restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (gameRef.current.lives <= 0) {
          restartRef.current();
        } else {
          gameRef.current.keys.space = true;
          fireLaser();
        }
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') {
        if (gameRef.current.lives <= 0) {
          e.preventDefault();
          restartRef.current();
        }
      } else if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
        onExit(gameRef.current.score, gameRef.current.bugsPurged, gameRef.current.wave);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = false;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gameRef.current.keys.space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onExit, fireLaser]);

  // Canvas Pointer & Touch Handler
  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 600 / rect.width;
    const targetX = (e.clientX - rect.left) * scaleX - gameRef.current.player.w / 2;
    gameRef.current.player.x = Math.max(20, Math.min(544, targetX));
    if ((e.type === 'pointerdown' || e.buttons === 1) && gameRef.current.lives > 0) {
      fireLaser();
    }
  };

  // Main Canvas Animation Frame Loop (decoupled from highScore state)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const loop = () => {
      const g = gameRef.current;
      g.time += 0.03;

      // 1. Clear Screen with dark phosphor CRT void
      ctx.fillStyle = '#070D0A';
      ctx.fillRect(0, 0, 600, 360);

      // 2. Render Starfield / Telemetry Warp Grid
      ctx.fillStyle = primaryAccent;
      for (const star of g.stars) {
        star.y += star.speed;
        if (star.y > 360) star.y = 0;
        ctx.globalAlpha = star.size === 2 ? 0.6 : 0.3;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
      ctx.globalAlpha = 1.0;

      // 3. Player Movement
      if (g.keys.left) {
        g.player.x = Math.max(20, g.player.x - g.player.speed);
      }
      if (g.keys.right) {
        g.player.x = Math.min(544, g.player.x + g.player.speed);
      }

      // 4. Update & Draw Lasers
      for (let i = g.lasers.length - 1; i >= 0; i--) {
        const l = g.lasers[i];
        l.y += l.vy;
        ctx.fillStyle = l.color;
        ctx.fillRect(l.x - 1.5, l.y, 3, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(l.x - 0.5, l.y + 2, 1, 6);

        if (l.y < -10) {
          g.lasers.splice(i, 1);
        }
      }

      // 5. Update & Draw Enemy Bug Invaders in Sine-Wave Movement
      let hitEdge = false;
      const aliveEnemies = g.enemies.filter((e) => e.alive);

      // Check wave clear
      if (aliveEnemies.length === 0 && g.lives > 0) {
        g.wave += 1;
        g.score += 500;
        setWave(g.wave);
        setScore(g.score);
        playArcadeSound('wave');
        initWaveEnemies(g.wave);
      }

      for (const enemy of aliveEnemies) {
        // Horizontal step with direction-guarded edge check (prevents rapid cascade jitter)
        enemy.x += g.enemyDir * g.enemySpeed;
        if ((g.enemyDir > 0 && enemy.x > 530) || (g.enemyDir < 0 && enemy.x < 20)) {
          hitEdge = true;
        }

        // Sinusoidal wave oscillation
        const waveY = enemy.y + Math.sin(g.time * 3 + enemy.animOffset) * 4;

        // Draw Bug Invader Box (8-bit micro module)
        ctx.fillStyle = '#0D1512';
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(enemy.x, waveY, enemy.w, enemy.h);
        ctx.strokeRect(enemy.x, waveY, enemy.w, enemy.h);

        // Invader Glitch Sprite / Label
        ctx.fillStyle = enemy.color;
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.label, enemy.x + enemy.w / 2, waveY + enemy.h / 2);

        // Random enemy projectile firing
        if (Math.random() < 0.003 * g.wave) {
          g.enemyProjectiles.push({
            x: enemy.x + enemy.w / 2,
            y: waveY + enemy.h,
            vy: 3.5,
            color: enemy.color,
          });
        }

        // Check Collision with Player Lasers
        for (let li = g.lasers.length - 1; li >= 0; li--) {
          const l = g.lasers[li];
          if (
            l.x >= enemy.x &&
            l.x <= enemy.x + enemy.w &&
            l.y >= waveY &&
            l.y <= waveY + enemy.h
          ) {
            enemy.alive = false;
            g.lasers.splice(li, 1);
            g.score += enemy.points;
            g.bugsPurged += 1;
            setScore(g.score);
            setBugsPurged(g.bugsPurged);

            // Update high score ref without causing RAF loop tear-down
            if (g.score > highScoreRef.current) {
              highScoreRef.current = g.score;
              setHighScore(g.score);
              try {
                localStorage.setItem('cyberknight_arcade_high', String(g.score));
              } catch {}
            }
            playArcadeSound('explode');

            // Spawn explosion particles
            for (let p = 0; p < 12; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 1.5 + Math.random() * 3.5;
              g.particles.push({
                x: enemy.x + enemy.w / 2,
                y: waveY + enemy.h / 2,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 2 + Math.random() * 2,
                color: enemy.color,
                alpha: 1.0,
              });
            }
            break;
          }
        }

        // If killed by laser above, skip baseline invasion check
        if (!enemy.alive) continue;

        // Check if alive enemy invaded player baseline
        if (waveY + enemy.h >= g.player.y && g.lives > 0) {
          g.lives = 0;
          setLives(0);
          setGameState('GAME_OVER');
          playArcadeSound('gameover');
        }
      }

      // Step down and reverse direction on edge hit
      if (hitEdge) {
        g.enemyDir *= -1;
        for (const enemy of g.enemies) {
          enemy.y += 10;
        }
      }

      // 6. Update & Draw Enemy Glitch Projectiles
      for (let pi = g.enemyProjectiles.length - 1; pi >= 0; pi--) {
        const ep = g.enemyProjectiles[pi];
        ep.y += ep.vy;
        ctx.fillStyle = ep.color;
        ctx.fillRect(ep.x - 1.5, ep.y, 3, 6);

        // Check collision with player
        if (
          ep.x >= g.player.x &&
          ep.x <= g.player.x + g.player.w &&
          ep.y >= g.player.y &&
          ep.y <= g.player.y + g.player.h
        ) {
          g.enemyProjectiles.splice(pi, 1);
          g.lives = Math.max(0, g.lives - 1);
          setLives(g.lives);
          playArcadeSound('hurt');

          // Flash particles
          for (let p = 0; p < 15; p++) {
            g.particles.push({
              x: g.player.x + g.player.w / 2,
              y: g.player.y + g.player.h / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 2,
              color: '#FF2A85',
              alpha: 1.0,
            });
          }

          if (g.lives <= 0) {
            setGameState('GAME_OVER');
            playArcadeSound('gameover');
          }
          continue;
        }

        if (ep.y > 360) {
          g.enemyProjectiles.splice(pi, 1);
        }
      }

      // 7. Update & Draw Explosion Particles
      for (let pi = g.particles.length - 1; pi >= 0; pi--) {
        const p = g.particles[pi];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          g.particles.splice(pi, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      // 8. Draw Cyber-Knight Ship
      if (g.lives > 0) {
        const px = g.player.x;
        const py = g.player.y;

        // Ship hull
        ctx.fillStyle = '#0D1512';
        ctx.strokeStyle = primaryAccent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + 18, py);
        ctx.lineTo(px + 36, py + 18);
        ctx.lineTo(px + 30, py + 22);
        ctx.lineTo(px + 6, py + 22);
        ctx.lineTo(px, py + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(px + 16, py + 6, 4, 6);

        // Thruster flame animation
        const flameHeight = Math.sin(g.time * 20) > 0 ? 8 : 4;
        ctx.fillStyle = '#FF2A85';
        ctx.fillRect(px + 10, py + 22, 4, flameHeight);
        ctx.fillRect(px + 22, py + 22, 4, flameHeight);
      }

      // 9. Draw Game Over Overlay
      if (g.lives <= 0) {
        ctx.fillStyle = 'rgba(7, 8, 20, 0.85)';
        ctx.fillRect(0, 0, 600, 360);

        ctx.fillStyle = '#FF2A85';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM SEGFAULT • GAME OVER', 300, 150);

        ctx.fillStyle = '#F0EFE6';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${g.score}  •  BUGS PURGED: ${g.bugsPurged}`, 300, 185);

        ctx.fillStyle = primaryAccent;
        ctx.fillText('Press Restart (R) or Esc to exit', 300, 225);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [initWaveEnemies, playArcadeSound, primaryAccent]);

  return (
    <div className={`relative bg-[#070D0A] border-2 ${phosphorBorder} ${phosphorGlow} p-3 select-none flex flex-col justify-between transition-all duration-300`}>
      {/* Top Arcade Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2D3645] pb-2 mb-2 font-pixel text-[9px]">
        <div className="flex items-center gap-3">
          <span className="text-[#FFCC00]">
            SCORE: <strong className="text-white">{String(score).padStart(5, '0')}</strong>
          </span>
          <span className="text-[#8E98AA] hidden sm:inline">
            HIGH: <strong className="text-[#FFCC00]">{String(highScore).padStart(5, '0')}</strong>
          </span>
          <span className="text-[#00F0FF]">
            WAVE: <strong className="text-white">{String(wave).padStart(2, '0')}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`${phosphorText} flex items-center gap-1`}>
            SHIELDS: {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <span key={i} className="text-[#FF2A85]">♥</span>
            ))}
          </span>
          <span className="text-[#8E98AA] hidden md:inline">
            PURGED: <strong className={phosphorText}>{bugsPurged}</strong>
          </span>
          <button
            type="button"
            onClick={toggleSfx}
            className={`px-1.5 py-0.5 border font-pixel text-[8px] flex items-center gap-1 active:scale-95 transition-all ${
              sfxEnabled
                ? `${phosphorText} border-current bg-[#131629]`
                : 'text-[#8E98AA] border-[#2D3645] bg-[#070814]'
            }`}
            title="Toggle Arcade Sound Effects"
            aria-label="Toggle Arcade Sound Effects"
          >
            <span>{sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Arcade Canvas with touch-action: none and direct pointer tracking */}
      <div className="relative aspect-[5/3] w-full max-h-[360px] overflow-hidden bg-black border border-[#2D3645]">
        <canvas
          ref={canvasRef}
          width={600}
          height={360}
          onPointerDown={handleCanvasPointer}
          onPointerMove={handleCanvasPointer}
          style={{ touchAction: 'none' }}
          className="w-full h-full block pixelated cursor-crosshair"
          aria-label="8-bit Cyber-Knight Wave Runner canvas screen"
        />

        {/* Scanlines Overlay on Arcade Screen */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[size:100%_4px]"
          aria-hidden="true"
        />
      </div>

      {/* Bottom Arcade Control Toolbar with touch-friendly ergonomics */}
      <div 
        style={{ touchAction: 'none' }}
        className="mt-3 pt-2 border-t-2 border-[#2D3645] flex flex-wrap items-center justify-between gap-2 font-pixel text-[8px]"
      >
        {/* On-screen touch buttons for mobile / quick click with min-h-[40px] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={() => { gameRef.current.keys.left = true; }}
            onPointerUp={() => { gameRef.current.keys.left = false; }}
            onPointerLeave={() => { gameRef.current.keys.left = false; }}
            className="min-h-[38px] px-3.5 py-1.5 bg-[#131629] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#00F0FF] active:scale-95 transition-transform"
            aria-label="Move Ship Left"
          >
            ◄ LEFT
          </button>
          <button
            type="button"
            onClick={fireLaser}
            className="min-h-[38px] px-4 py-1.5 bg-[#FF2A85] text-white border-2 border-white font-bold active:scale-95 transition-transform shadow-[0_0_8px_rgba(255,42,133,0.4)]"
            aria-label="Fire Plasma Lasers"
          >
            ⚡ FIRE (SPACE)
          </button>
          <button
            type="button"
            onPointerDown={() => { gameRef.current.keys.right = true; }}
            onPointerUp={() => { gameRef.current.keys.right = false; }}
            onPointerLeave={() => { gameRef.current.keys.right = false; }}
            className="min-h-[38px] px-3.5 py-1.5 bg-[#131629] border-2 border-[#2D3645] hover:border-[#00F0FF] text-[#00F0FF] active:scale-95 transition-transform"
            aria-label="Move Ship Right"
          >
            RIGHT ►
          </button>
        </div>

        {/* Game State Actions */}
        <div className="flex items-center gap-2">
          {gameState === 'GAME_OVER' && (
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[38px] px-3 py-1.5 bg-[#FFCC00] text-[#070814] font-bold border-2 border-white hover:bg-white active:scale-95 shadow-[0_0_8px_rgba(255,204,0,0.4)]"
            >
              Restart (R)
            </button>
          )}

          <button
            type="button"
            onClick={() => onExit(gameRef.current.score, gameRef.current.bugsPurged, gameRef.current.wave)}
            className="min-h-[38px] px-3 py-1.5 bg-[#131629] hover:bg-[#FF2A85] text-[#D6CFC2] hover:text-white border-2 border-[#2D3645] hover:border-white active:scale-95"
          >
            Exit to Shell
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN TERMINAL LAB COMPONENT
// =========================================================================
export const TerminalLab: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { scrollTo } = useLenis();
  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showShaderPulse, setShowShaderPulse] = useState(false);
  const [activeChipAnimation, setActiveChipAnimation] = useState<string | null>(null);

  // Phosphor Mode: Green (P1) vs Amber (P3)
  const [phosphorMode, setPhosphorMode] = useState<'green' | 'amber'>('green');
  // Arcade Mini-Game Mode state
  const [isArcadeActive, setIsArcadeActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const terminalScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeTickerFnRef = useRef<((now: number) => void) | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const savedDraftRef = useRef<string>('');
  const tabCycleRef = useRef<{ prefix: string; index: number; matches: string[] }>({
    prefix: '',
    index: 0,
    matches: [],
  });

  // Initial welcome message
  const initialHistory: TerminalEntry[] = [
    {
      id: 'init-1',
      command: 'whoami',
      timestamp: '00:00:01',
      output: (
        <div className="space-y-1 font-mono text-fluid-mono">
          <div className="text-[#00F0FF] font-semibold">
            Abdur Rahman Moayed • Computer Science &amp; Engineering Undergraduate
          </div>
          <div className="text-[#D6CFC2]">
            East West University, Dhaka, Bangladesh (UTC+6) • Full-Stack Web Architect &amp; Low-Level Systems Engineer
          </div>
          <div className="text-[#8E98AA] text-fluid-micro">
            Specializing in POSIX shared-memory pipelines, Linux syscall architectures, and 120 FPS kinetic web frontends.
          </div>
        </div>
      ),
    },
    {
      id: 'init-2',
      command: 'help',
      timestamp: '00:00:02',
      output: (
        <div className="text-[#D6CFC2] font-mono text-fluid-mono space-y-1">
          <div className="text-[#FFCC00] font-semibold mb-1">AVAILABLE COMMANDS:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-fluid-micro">
            <div><span className="text-[#00F0FF] font-bold">help</span> • List available terminal commands</div>
            <div><span className="text-[#00F0FF] font-bold">whoami</span> • Display bio, university &amp; credentials</div>
            <div><span className="text-[#00F0FF] font-bold">skills</span> • Render ASCII competency motherboard chart</div>
            <div><span className="text-[#00F0FF] font-bold">projects</span> • List flagship architectures with repo links</div>
            <div><span className="text-[#00F0FF] font-bold">github</span> • Open GitHub (@watchknight) in new tab</div>
            <div><span className="text-[#00F0FF] font-bold">arcade</span> (or <span className="text-[#FFCC00] font-bold">$arcade</span>) • Launch 8-bit Cyber-Knight Wave Runner mini-game</div>
            <div><span className="text-[#00F0FF] font-bold">clear</span> • Flush terminal history buffer</div>
            <div className="sm:col-span-2 text-[#FFCC00] font-semibold pt-1">
              <span className="text-[#4AF626] font-bold">sudo hire moayed</span> • Send interview invitation &amp; get in touch
            </div>
          </div>
        </div>
      ),
    },
  ];

  const [history, setHistory] = useState<TerminalEntry[]>(initialHistory);
  const [commandHistory, setCommandHistory] = useState<string[]>(['whoami', 'help']);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  // Auto-scroll to bottom of output on change
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [history, isArcadeActive]);

  // Global listener for focus-terminal custom event
  useEffect(() => {
    const handleFocusTerminal = () => {
      setIsMinimized(false);
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 50);
    };
    window.addEventListener('focus-terminal', handleFocusTerminal);
    return () => window.removeEventListener('focus-terminal', handleFocusTerminal);
  }, []);

  // Confetti Particle Burst Animation with high-DPI retina scaling
  const fireConfetti = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const particles: ConfettiParticle[] = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) / 1.5 + Math.PI / 6;
      const speed = 7 + Math.random() * 12;
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.7,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed * 1.3,
        size: (4 + Math.random() * 6) * dpr,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.6 ? 'rect' : Math.random() > 0.3 ? 'ribbon' : 'circle',
        alpha: 1.0,
      });
    }

    const gravity = 0.35 * dpr;
    const drag = 0.985;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.rotation += p.vRot;

        if (frameCount > 30) {
          p.alpha -= 0.015;
        }

        if (p.alpha > 0.01 && p.y < canvas.height + 50) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size * 1.8, p.size / 2);
          }
          ctx.restore();
        }
      }

      if (aliveCount === 0 || frameCount > 180) {
        if (activeTickerFnRef.current) {
          gsap.ticker.remove(activeTickerFnRef.current);
          activeTickerFnRef.current = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (activeTickerFnRef.current) {
      gsap.ticker.remove(activeTickerFnRef.current);
    }
    activeTickerFnRef.current = render;
    gsap.ticker.add(render);
  }, []);

  // Cleanup ticker on unmount
  useEffect(() => {
    return () => {
      if (activeTickerFnRef.current) {
        gsap.ticker.remove(activeTickerFnRef.current);
        activeTickerFnRef.current = null;
      }
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Format Skills Command Output: ASCII Progress Bar Chart
  const renderSkillsOutput = () => {
    return (
      <div className="font-mono text-fluid-micro leading-relaxed space-y-4 py-1 select-text">
        <div className="text-[#00F0FF] border-b border-[#2D3645] pb-2 font-pixel text-[8px]">
          ┌──────────────────────────────────────────────────────────────────┐<br />
          │  EAST WEST UNIVERSITY CSE LABS • FULL-SPECTRUM SYSTEMS ARCHITECTURE │<br />
          └──────────────────────────────────────────────────────────────────┘
        </div>

        {/* Section 1: Frontend */}
        <div className="space-y-1">
          <div className="text-[#00F0FF] font-bold uppercase tracking-wider flex items-center gap-1.5 font-pixel text-[8px]">
            <span>1. Frontend, 3D WebGL &amp; Motion</span>
          </div>
          <div className="text-[#D6CFC2]">
            Three.js / GLSL       <span className="text-[#00F0FF]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">98%</span>  • GPU Wave Vertex Physics &amp; Additive Bloom
          </div>
          <div className="text-[#D6CFC2]">
            React 18 / Next.js    <span className="text-[#00F0FF]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">96%</span>  • Concurrent Reconciler &amp; State Machines
          </div>
          <div className="text-[#D6CFC2]">
            TypeScript            <span className="text-[#00F0FF]">[██████████████████░░]</span> <span className="text-[#4AF626] font-bold">94%</span>  • Strict Type Algebra, AST Compilers
          </div>
          <div className="text-[#D6CFC2]">
            GSAP &amp; ScrollTrigger  <span className="text-[#00F0FF]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">96%</span>  • Inertial Timeline Scrubbing &amp; Tickers
          </div>
        </div>

        {/* Section 2: Backend */}
        <div className="space-y-1">
          <div className="text-[#FFCC00] font-bold uppercase tracking-wider flex items-center gap-1.5 font-pixel text-[8px]">
            <span>2. Distributed Server &amp; Data</span>
          </div>
          <div className="text-[#D6CFC2]">
            Cloud Firestore       <span className="text-[#FFCC00]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">96%</span>  • Real-time Snapshot Streams &amp; Offline Cache
          </div>
          <div className="text-[#D6CFC2]">
            Node.js / Express     <span className="text-[#FFCC00]">[██████████████████░░]</span> <span className="text-[#4AF626] font-bold">92%</span>  • Event Loop, Async Stream Processing
          </div>
          <div className="text-[#D6CFC2]">
            PostgreSQL Relational <span className="text-[#FFCC00]">[█████████████████░░░]</span> <span className="text-[#4AF626] font-bold">88%</span>  • Relational Schemas, ACID Compliance
          </div>
          <div className="text-[#D6CFC2]">
            GitHub Actions CI/CD  <span className="text-[#FFCC00]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">100%</span> • 14/14 Staging Test Suite Pass
          </div>
        </div>

        {/* Section 3: Systems */}
        <div className="space-y-1">
          <div className="text-[#4AF626] font-bold uppercase tracking-wider flex items-center gap-1.5 font-pixel text-[8px]">
            <span>3. Linux Kernel &amp; C/C++ POSIX IPC</span>
          </div>
          <div className="text-[#D6CFC2]">
            C / C++ Systems       <span className="text-[#4AF626]">[██████████████████░░]</span> <span className="text-[#4AF626] font-bold">92%</span>  • Pointer Arithmetic &amp; Struct Alignment
          </div>
          <div className="text-[#D6CFC2]">
            POSIX shmget / shmat  <span className="text-[#4AF626]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">98%</span>  • Zero-Copy Shared RAM Ring Buffers
          </div>
          <div className="text-[#D6CFC2]">
            Linux POSIX IPC Pipes <span className="text-[#4AF626]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">96%</span>  • Anonymous Duplex Streaming (&lt;1.2μs)
          </div>
          <div className="text-[#D6CFC2]">
            Valgrind Mem Audits   <span className="text-[#4AF626]">[████████████████████]</span> <span className="text-[#4AF626] font-bold">100%</span> • 0 Bytes in 0 Blocks Heap Leaks
          </div>
        </div>

        <div className="text-[#8E98AA] border-t border-[#2D3645] pt-2 text-[10px] font-pixel">
          100% Deterministic Verification • Memory Leaks: 0 • Frame Pacing: 60/120 FPS
        </div>
      </div>
    );
  };

  // Format Projects Command Output
  const renderProjectsOutput = () => {
    return (
      <div className="font-mono text-fluid-micro space-y-3 py-1">
        <div className="text-[#FFCC00] font-semibold border-b border-[#2D3645] pb-1.5 flex items-center justify-between font-pixel text-[9px]">
          <span>FLAGSHIP ARCHITECTURAL DEPLOYMENTS (Click any title or link):</span>
          <span className="text-[#8E98AA]">6 verified builds</span>
        </div>

        {PORTFOLIO_DATA.projects.map((proj, idx) => (
          <div 
            key={proj.id} 
            className="p-2.5 bg-[#070814] border border-[#2D3645] hover:border-[#00F0FF] transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <a
                href={proj.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#00F0FF] hover:text-white font-bold flex items-center gap-1.5 text-fluid-mono transition-colors font-pixel text-[10px]"
              >
                <span>{`0${idx + 1}.`} {proj.title}</span>
                <ExternalLink className="w-3 h-3 text-[#00F0FF]" />
              </a>
              <span className="text-[#8E98AA] text-[9px] uppercase px-1.5 py-0.5 bg-[#131629] border border-[#2D3645]">
                {proj.category}
              </span>
            </div>

            <p className="text-[#D6CFC2] text-fluid-micro leading-relaxed mb-1.5">
              {proj.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#2D3645]">
              <div className="flex flex-wrap gap-1">
                {proj.tags.map((tag) => (
                  <span key={tag} className="text-[9px] text-[#8E98AA] px-1 bg-[#131629] border border-[#2D3645]">
                    #{tag}
                  </span>
                ))}
              </div>

              <a
                href={proj.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#FFCC00] hover:text-white text-[10px] font-pixel underline underline-offset-2 flex items-center gap-1"
              >
                <span>View GitHub Repository</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Main Command Execution Handler
  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    // Normalize multiple whitespace sequences
    const normalized = trimmed.replace(/\s+/g, ' ');
    const lower = normalized.toLowerCase();
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Handle 'clear' command
    if (lower === 'clear') {
      setHistory([]);
      setInputVal('');
      setCommandHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
      setHistoryPointer(-1);
      savedDraftRef.current = '';
      return;
    }

    let outputNode: React.ReactNode = null;
    let isError = false;

    // Handle 'arcade' or '$arcade' or './arcade' or 'game' or 'invaders'
    if (
      lower === 'arcade' || 
      lower === '$arcade' || 
      lower === './arcade' ||
      lower === 'run arcade' ||
      lower === 'game' || 
      lower === 'play' || 
      lower === 'invaders' || 
      lower === 'waverunner'
    ) {
      audio.playChord();
      setIsArcadeActive(true);
      outputNode = (
        <div className="p-2.5 bg-[#0C2430] border border-[#00F0FF] text-[#00F0FF] font-pixel text-[9px] space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <Gamepad2 className="w-4 h-4 text-[#00F0FF] animate-bounce" />
            <span>Arcade Initialized: Defend POSIX Kernel...</span>
          </div>
          <div className="text-white">
            Defend East West University POSIX Kernel from memory leaks &amp; dangling pointers!
          </div>
          <div className="text-[#8E98AA] text-[8px]">
            Controls: Left/Right Arrow keys or A/D, Spacebar to fire plasma cannons, ESC to return to shell.
          </div>
        </div>
      );
    }
    // Handle 'sudo hire moayed' command
    else if (lower === 'sudo hire moayed') {
      // 1. Visual rewards: Confetti & Screen Shader Pulse
      fireConfetti();
      setShowShaderPulse(true);
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = window.setTimeout(() => setShowShaderPulse(false), 2400);

      // 2. Dispatch custom event to pre-fill ContactSection
      const hireMessage = "Hi Abdur Rahman Moayed, I executed 'sudo hire moayed' in your Systems & Terminal Lab! I'm impressed by your systems and full-stack work and would love to discuss an engineering role with our team.";
      window.dispatchEvent(
        new CustomEvent('prefill-contact', {
          detail: {
            message: hireMessage,
          },
        })
      );

      // 3. Smooth scroll down to #contact with Lenis
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollTo('#contact', { offset: -90 });
      }, 300);

      outputNode = (
        <div className="p-3.5 bg-[#0C2430] border-2 border-[#00F0FF] space-y-2 text-fluid-mono">
          <div className="flex items-center gap-2 text-[#00F0FF] font-bold font-pixel text-[10px]">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
            <span>Authentication Successful: Elevating process...</span>
          </div>
          <div className="text-white font-pixel text-[11px]">
            🎉 Talent Acquisition Activated!
          </div>
          <div className="text-[#D6CFC2] text-fluid-micro leading-relaxed">
            Dispatching credentials to the Encrypted Transmission Dispatch channel below. 
            Pre-filling contact form with verified applicant metadata for direct interview scheduling.
          </div>
        </div>
      );
    } 
    // Handle 'skills' command
    else if (lower === 'skills') {
      outputNode = renderSkillsOutput();
    } 
    // Handle 'projects' command
    else if (lower === 'projects') {
      outputNode = renderProjectsOutput();
    } 
    // Handle 'github' command
    else if (lower === 'github') {
      try {
        window.open('https://github.com/watchknight', '_blank', 'noopener,noreferrer');
      } catch {
        // Fallback if popup blocker intervenes
      }

      outputNode = (
        <div className="space-y-1 font-mono text-fluid-mono">
          <div className="text-[#00F0FF] flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Redirecting to GitHub profile (@watchknight) in new tab...</span>
          </div>
          <div className="text-[#8E98AA] text-fluid-micro">
            Direct link:{' '}
            <a
              href="https://github.com/watchknight"
              target="_blank"
              rel="noreferrer"
              className="text-[#FFCC00] hover:underline font-semibold"
            >
              https://github.com/watchknight
            </a>
          </div>
        </div>
      );
    } 
    // Handle 'dhaka' command
    else if (lower === 'dhaka') {
      const dhakaTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        dateStyle: 'full',
        timeStyle: 'medium',
      });
      outputNode = (
        <div className="font-mono text-fluid-mono space-y-1">
          <div className="text-[#00F0FF]">Operational Hub: Dhaka, Bangladesh (East West University)</div>
          <div className="text-[#D6CFC2]">Local Time: {dhakaTime} (UTC+6)</div>
          <div className="text-[#8E98AA] text-fluid-micro">
            Global Overlap: UTC+0 London/Europe (afternoon overlap), UTC+5:30 APAC (full overlap), UTC-5 US East (morning overlap).
          </div>
        </div>
      );
    }
    // Handle 'uname' or 'uname -a'
    else if (lower === 'uname' || lower === 'uname -a') {
      outputNode = (
        <div className="font-mono text-fluid-mono text-[#D6CFC2]">
          Linux ewu-cse 6.8.0-48-generic #48-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux
        </div>
      );
    }
    // Handle 'uptime'
    else if (lower === 'uptime') {
      outputNode = (
        <div className="font-mono text-fluid-mono text-[#D6CFC2]">
          up 48 days, 14:22, 1 user, load average: 0.08, 0.04, 0.01 (East West University node stable)
        </div>
      );
    }
    // Handle 'neofetch'
    else if (lower === 'neofetch') {
      outputNode = (
        <div className="font-mono text-fluid-micro leading-relaxed text-[#D6CFC2] space-y-1">
          <div className="text-[#00F0FF] font-bold">moayed@ewu-cse</div>
          <div className="text-[#8E98AA]">-------------</div>
          <div><strong className="text-[#FFCC00]">OS:</strong> Ubuntu 24.04.1 LTS x86_64</div>
          <div><strong className="text-[#FFCC00]">Host:</strong> East West University CSE Systems Node</div>
          <div><strong className="text-[#FFCC00]">Kernel:</strong> 6.8.0-48-generic</div>
          <div><strong className="text-[#FFCC00]">Uptime:</strong> 48 days, 14 hours</div>
          <div><strong className="text-[#FFCC00]">Shell:</strong> bash 5.2.21</div>
          <div><strong className="text-[#FFCC00]">Terminal:</strong> 90s Cyberdeck Phosphor CRT Shell</div>
          <div><strong className="text-[#FFCC00]">CPU:</strong> x86_64 Multiprocessor (POSIX fork enabled)</div>
          <div><strong className="text-[#FFCC00]">Memory:</strong> 0 Leaks / Deterministic Allocation (Valgrind OK)</div>
        </div>
      );
    }
    // Handle 'pwd'
    else if (lower === 'pwd') {
      outputNode = <div className="font-mono text-fluid-mono text-[#D6CFC2]">/home/moayed</div>;
    }
    // Handle 'ls' or 'dir'
    else if (lower === 'ls' || lower === 'dir') {
      outputNode = (
        <div className="font-mono text-fluid-mono text-[#D6CFC2]">
          <span className="text-[#00F0FF] font-bold">Mental-Defrag/</span>&nbsp;&nbsp;
          <span className="text-[#00F0FF] font-bold">DocLensBD/</span>&nbsp;&nbsp;
          <span className="text-[#00F0FF] font-bold">Rannabanna/</span>&nbsp;&nbsp;
          <span className="text-[#00F0FF] font-bold">TrashTrail/</span>&nbsp;&nbsp;
          <span className="text-[#00F0FF] font-bold">BitForge-OS-Kernel/</span>&nbsp;&nbsp;
          <span className="text-[#4AF626]">resume.pdf</span>&nbsp;&nbsp;
          <span className="text-[#8E98AA]">architecture-specs.md</span>
        </div>
      );
    }
    // Handle '404' or 'knight'
    else if (lower === '404' || lower === 'goto 404' || lower === 'knight' || lower === 'tour') {
      outputNode = (
        <div className="p-3 border-2 border-[#FF2A85] bg-[#131629] text-fluid-micro font-mono text-white space-y-1 shadow-[2px_2px_0_0_#070814]">
          <div className="text-[#FFCC00] font-pixel text-[9px] flex items-center gap-1.5">
            <span>⚠️ Page Not Found: Traversing to Node 404...</span>
          </div>
          <div className="text-[#D6CFC2]">
            Dispatching to the 5x5 Knight&apos;s Tour Chessboard in Unreachable Sector 404.
          </div>
        </div>
      );
      setTimeout(() => {
        window.location.hash = '#/404';
      }, 400);
    }
    // Handle unknown sudo
    else if (lower.startsWith('sudo ')) {
      isError = true;
      outputNode = (
        <div className="font-mono text-fluid-mono text-[#FF2A85]">
          sudo: &apos;{trimmed.slice(5)}&apos; is restricted. Did you mean &apos;<span className="text-[#4AF626] font-bold underline cursor-pointer" onClick={() => executeCommand('sudo hire moayed')}>sudo hire moayed</span>&apos;?
        </div>
      );
    }
    // Unrecognized command
    else {
      isError = true;
      outputNode = (
        <div className="font-mono text-fluid-mono text-[#FF2A85] space-y-1">
          <div>Command &apos;{trimmed}&apos; not found in ewu-cse environment.</div>
          <div className="text-[#8E98AA] text-fluid-micro">
            Type &apos;<span className="text-[#00F0FF] font-semibold underline cursor-pointer" onClick={() => executeCommand('help')}>help</span>&apos; to view valid directives or tap the quick chips below.
          </div>
        </div>
      );
    }

    setHistory((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random()}`,
        command: trimmed,
        output: outputNode,
        timestamp,
        isError,
      },
    ]);

    setCommandHistory((prev) => (prev[prev.length - 1] === trimmed ? prev : [...prev, trimmed]));
    setHistoryPointer(-1);
    savedDraftRef.current = '';
    setInputVal('');
  };

  // Keyboard Navigation: Enter, Up, Down, Tab
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      chiptuneAudio.playPowerUpSFX();
      executeCommand(inputVal);
    } else {
      chiptuneAudio.playNoiseTap();
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) return;
        if (historyPointer === -1) {
          savedDraftRef.current = inputVal;
        }
        const newPointer = historyPointer === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyPointer - 1);
        setHistoryPointer(newPointer);
        setInputVal(commandHistory[newPointer]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyPointer === -1) return;
        const newPointer = historyPointer + 1;
        if (newPointer >= commandHistory.length) {
          setHistoryPointer(-1);
          setInputVal(savedDraftRef.current);
        } else {
          setHistoryPointer(newPointer);
          setInputVal(commandHistory[newPointer]);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const current = inputVal.trim().toLowerCase();
        if (!current) return;

        const candidates = [
          'help',
          'whoami',
          'skills',
          'projects',
          'github',
          'arcade',
          'clear',
          'sudo hire moayed',
          'dhaka',
          'uname',
          'uptime',
          'neofetch',
          'pwd',
          'ls',
          '404',
        ];

        const matches = candidates.filter((cmd) => cmd.startsWith(current));
        if (matches.length === 1) {
          setInputVal(matches[0]);
        } else if (matches.length > 1) {
          let cycle = tabCycleRef.current;
          if (cycle.prefix !== current) {
            cycle = { prefix: current, index: 0, matches };
            tabCycleRef.current = cycle;
          } else {
            cycle.index = (cycle.index + 1) % matches.length;
          }
          setInputVal(matches[cycle.index]);
        }
      }
    }
  };

  // Quick Command Chip Click Handler
  const handleChipClick = (cmd: string) => {
    chiptuneAudio.playPowerUpSFX();
    setActiveChipAnimation(cmd);
    setTimeout(() => setActiveChipAnimation(null), 300);
    executeCommand(cmd);
    inputRef.current?.focus();
  };

  // Copy terminal history to clipboard
  const handleCopyHistory = () => {
    const textLines = history.map((e) => `moayed@ewu-cse:~$ ${e.command}`);
    navigator.clipboard.writeText(textLines.join('\n')).then(() => {
      setIsCopied(true);
      audio.playChord();
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {});
  };

  const handleTerminalWindowClick = () => {
    if (!isArcadeActive) {
      inputRef.current?.focus();
    }
  };

  // Handle Arcade Exit
  const handleArcadeExit = (score: number, bugsPurged: number, wave: number) => {
    setIsArcadeActive(false);
    audio.playChord();
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setHistory((prev) => [
      ...prev,
      {
        id: `arcade-log-${Date.now()}`,
        command: 'arcade --status',
        output: (
          <div className="p-2.5 bg-[#0D1512] border-2 border-[#4AF626] font-pixel text-[9px] text-[#4AF626] space-y-1">
            <div className="text-[#FFCC00] font-bold">
              Arcade Session Ended • Kernel Session Logged
            </div>
            <div className="text-white">
              Final Score: <strong className="text-[#FFCC00]">{score} pts</strong> • Bugs Purged: <strong className="text-[#4AF626]">{bugsPurged}</strong> • Wave: <strong className="text-[#00F0FF]">{wave}</strong>
            </div>
            <div className="text-[#8E98AA]">
              Memory status verified: 0 leaks in POSIX shared memory. Type &apos;arcade&apos; or tap $arcade to play again.
            </div>
          </div>
        ),
        timestamp,
      },
    ]);
  };

  const phosphorTextColor = phosphorMode === 'green' ? 'text-[#4AF626]' : 'text-[#FFCC00]';
  const phosphorBorderColor = phosphorMode === 'green' ? 'border-[#4AF626]' : 'border-[#FFCC00]';
  const phosphorGlowShadow = phosphorMode === 'green'
    ? 'shadow-[0_0_25px_rgba(74,246,38,0.25),inset_0_0_40px_rgba(0,0,0,0.85),2px_2px_0_0_#070814]'
    : 'shadow-[0_0_25px_rgba(255,204,0,0.25),inset_0_0_40px_rgba(0,0,0,0.85),2px_2px_0_0_#070814]';

  return (
    <section 
      id="terminal" 
      className="py-24 md:py-32 relative bg-[#070814] text-[#F0EFE6] border-t-2 border-[#2D3645] overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'var(--crt-void-bg, #070814)',
        color: 'var(--pixel-ivory-text, #F0EFE6)',
      }}
    >
      {/* 90s Cyberdeck PCB Background Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#00F0FF_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF_1px,transparent_1px)] bg-[size:32px_32px] -z-10" 
        aria-hidden="true"
      />

      {/* Confetti Celebration Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 w-full h-full"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <div className={`inline-flex items-center gap-2 font-pixel text-[10px] ${isLight ? 'text-[#0052FF] bg-[#FFFFFF] border-[#1A1D24] shadow-[2px_2px_0_0_#C8C1B4]' : 'text-[#00F0FF] bg-[#131629] border-[#2D3645] shadow-[2px_2px_0_0_#070814]'} uppercase tracking-widest mb-3 px-3.5 py-1.5 border-2`}>
            <TerminalIcon className={`w-3.5 h-3.5 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} animate-pulse`} />
            <span>05. Terminal</span>
          </div>

          <div className="overflow-visible">
            <h2 
              className={`font-display uppercase ${isLight ? 'text-[#11131A]' : 'text-white'}`}
              style={{
                fontFamily: "'Space Grotesk', 'Syne', sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.035em',
                fontSize: 'clamp(1.85rem, 4vw, 3.25rem)',
                lineHeight: 1.05,
              }}
            >
              SYSTEMS <span className={isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}>TERMINAL &amp; ARCADE</span>
            </h2>
          </div>

          <p className={`font-body text-fluid-body ${isLight ? 'text-[#3F4654]' : 'text-[#D6CFC2]'} mt-2 leading-relaxed`}>
            Authentic 90s deep green/amber phosphor CRT terminal connected to East West University CSE environment. 
            Run live commands, inspect projects, send an interview invitation via &apos;sudo hire moayed&apos;, 
            or launch the inline 8-bit Cyber-Knight Wave Runner mini-game via &apos;arcade&apos;.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 90s PHOSPHOR CRT MONITOR FRAME WITH BEZEL, SCANLINES & RETRO CONTROLS     */}
        {/* ========================================================================= */}
        <div 
          onClick={handleTerminalWindowClick}
          className={`border-4 ${isLight ? 'border-[#1A1D24] bg-[#E5DFD3] shadow-[4px_4px_0_0_#C8C1B4]' : 'border-[#2D3645] bg-[#070D0A]'} ${phosphorGlowShadow} transition-all duration-300 cursor-text relative overflow-hidden ${
            isExpanded ? (isLight ? 'ring-2 ring-[#0052FF]' : 'ring-2 ring-[#00F0FF]') : ''
          } ${showShaderPulse ? (isLight ? 'ring-4 ring-[#D90452] shadow-[0_0_30px_rgba(217,4,82,0.8)]' : 'ring-4 ring-[#FF2A85] shadow-[0_0_30px_rgba(255,42,133,0.8)]') : ''}`}
        >
          {/* Subtle CRT Scanline Overlay across entire monitor face */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[size:100%_4px] z-20"
            aria-hidden="true"
          />

          {/* CRT Radial Screen Vignette */}
          <div 
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] z-10"
            aria-hidden="true"
          />

          {/* Authentic 90s Retro Window Titlebar with Putty/Slate Styling */}
          <div className={`${isLight ? 'bg-[#D8D2C5] border-b-2 border-[#1A1D24] text-[#11131A]' : 'bg-[#131629] border-b-2 border-[#2D3645] text-[#F0EFE6]'} px-3 py-2 flex items-center justify-between select-none relative z-30`}>
            {/* Left: Glyph & Prompt */}
            <div className="flex items-center gap-2">
              <span className={`font-pixel text-[10px] ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} hidden sm:inline-flex items-center gap-1.5`}>
                <span>Terminal</span>
                <span className={isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'}>•</span>
                <span className={phosphorTextColor}>moayed@ewu-cse:~ (24.04.1 LTS)</span>
              </span>
              <span className={`font-pixel text-[10px] ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'} sm:hidden`}>
                Terminal
              </span>
            </div>

            {/* Center: Dotted pixel drag handles */}
            <div className="hidden sm:flex items-center gap-1 mx-2 flex-1 justify-center opacity-40">
              <div className="retro-drag-dots" />
            </div>

            {/* Right: Retro window controls, Phosphor Switcher & Arcade quick launcher */}
            <div className="flex items-center gap-1.5">
              {/* Phosphor Mode Switcher */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhosphorMode(prev => prev === 'green' ? 'amber' : 'green');
                  audio.playTick();
                }}
                className={`px-2 py-0.5 ${isLight ? 'bg-white text-[#11131A] border border-[#1A1D24]/40 hover:border-[#0052FF]' : 'bg-[#070814] text-[#D6CFC2] border border-[#2D3645] hover:border-[#00F0FF]'} font-pixel text-[8px] flex items-center gap-1`}
                title="Toggle Phosphor Mode (Green P1 / Amber P3)"
                aria-label="Toggle CRT Phosphor Mode"
              >
                <Tv className={`w-2.5 h-2.5 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`} />
                <span className="hidden md:inline">CRT:</span>
                <span className={phosphorTextColor}>{phosphorMode.toUpperCase()}</span>
              </button>

              {/* Arcade Quick Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsArcadeActive(prev => !prev);
                  audio.playChord();
                }}
                className={`px-2 py-0.5 border font-pixel text-[8px] flex items-center gap-1 ${
                  isArcadeActive
                    ? 'bg-[#FF2A85] text-white border-white animate-pulse'
                    : 'bg-[#070814] text-[#FFCC00] border-[#FFCC00]/50 hover:bg-[#FFCC00] hover:text-[#070814]'
                }`}
                title="Toggle Arcade Mini-Game"
                aria-label="Toggle Arcade Mini-Game"
              >
                <Gamepad2 className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">ARCADE</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyHistory();
                }}
                className="retro-btn-box px-1.5 text-[8px] font-pixel text-[#D6CFC2] hover:text-[#00F0FF]"
                title="Copy terminal session"
                aria-label="Copy terminal session"
              >
                {isCopied ? <Check className="w-3 h-3 text-[#4AF626]" /> : <Copy className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHistory([]);
                }}
                className="retro-btn-box px-1.5 text-[8px] font-pixel text-[#D6CFC2] hover:text-[#00F0FF] flex items-center gap-1"
                title="Clear screen"
                aria-label="Clear screen"
              >
                <RefreshCcw className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">CLR</span>
              </button>

              {/* Authentic 90s [ - ] [ + ] [ x ] Window Controls */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="retro-btn-box"
                title={isMinimized ? "Restore terminal" : "Minimize terminal"}
                aria-label="Minimize or restore terminal"
              >
                -
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMinimized) {
                    setIsMinimized(false);
                  }
                  setIsExpanded(!isExpanded);
                }}
                className="retro-btn-box"
                title={isExpanded ? "Standard view" : "Maximize height"}
                aria-label="Toggle expanded height"
              >
                +
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHistory(initialHistory);
                  setInputVal('');
                  setHistoryPointer(-1);
                  setIsArcadeActive(false);
                }}
                className="retro-btn-box hover:bg-[#FF2A85] hover:text-white"
                title="Reset terminal session"
                aria-label="Reset terminal session"
              >
                x
              </button>
            </div>
          </div>

          {/* Minimized Dock Ribbon */}
          {isMinimized && (
            <div
              onClick={() => setIsMinimized(false)}
              className="px-4 py-3 bg-[#0D1512] border-t-2 border-[#2D3645] flex items-center justify-between text-fluid-micro font-mono text-[#8E98AA] cursor-pointer hover:bg-white/5 transition-colors relative z-30"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-none bg-[#FFCC00] animate-ping" />
                <span className="text-[#D6CFC2] font-medium font-pixel text-[9px]">
                  moayed@ewu-cse:~ • Phosphor CRT Shell Minimized
                </span>
              </div>
              <span className="text-[#00F0FF] hover:underline font-pixel text-[9px] flex items-center gap-1">
                <span>Restore Terminal</span>
                <span>↗</span>
              </span>
            </div>
          )}

          {!isMinimized && (
            <>
              {/* If Arcade Mini-game is active, render Cyber-Knight Wave Runner canvas */}
              {isArcadeActive ? (
                <div className="p-4 relative z-30 animate-in fade-in duration-300">
                  <CyberKnightArcade
                    phosphorMode={phosphorMode}
                    onExit={handleArcadeExit}
                  />
                </div>
              ) : (
                /* Standard Terminal History & Output Stream */
                <div
                  ref={terminalScrollRef}
                  data-lenis-prevent
                  className={`p-5 md:p-6 font-mono text-fluid-mono text-slate-200 overflow-y-auto overscroll-contain space-y-4 transition-all duration-300 relative z-30 ${
                    isExpanded ? 'min-h-[520px] max-h-[680px]' : 'min-h-[360px] max-h-[460px]'
                  }`}
                >
                  {/* Authentic Ubuntu MOTD Banner with Phosphor Styling */}
                  <div className="text-[#8E98AA] text-fluid-micro border-b border-[#2D3645] pb-3 leading-relaxed space-y-1">
                    <div className="text-white font-semibold flex items-center gap-2">
                      <span>Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-48-generic x86_64)</span>
                      <span className="w-2 h-2 rounded-none bg-[#4AF626] inline-block animate-ping" />
                    </div>
                    <div className="text-[#8E98AA]">
                      * Node: East West University Systems Lab (Dhaka, BD • UTC+6)<br />
                      * Kernel: Deterministic POSIX IPC &amp; Shared Memory Pipelines (0 Leaks)<br />
                      * Host: moayed@ewu-cse (Full-Stack Web Architect &amp; Systems Engineer)
                    </div>
                    <div className="text-[#00F0FF] pt-1 font-pixel text-[9px]">
                      Type &apos;<span className="underline font-bold">help</span>&apos; to view all directives, &apos;<span className="underline font-bold text-[#FFCC00]">arcade</span>&apos; to play 8-bit game, or tap chips below.
                    </div>
                  </div>

                  {/* History Output Stream */}
                  {history.map((entry) => (
                    <div key={entry.id} className="space-y-2 animate-in fade-in duration-200">
                      {/* Ubuntu Command Line Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`${phosphorTextColor} font-bold`}>moayed@ewu-cse</span>
                        <span className="text-[#8E98AA] font-semibold">:</span>
                        <span className="text-[#00F0FF] font-semibold">~</span>
                        <span className="text-[#D6CFC2] font-bold mr-1">$</span>
                        <span className="font-semibold text-white">{entry.command}</span>
                        <span className="text-[#8E98AA] text-fluid-micro ml-auto">[{entry.timestamp}]</span>
                      </div>

                      {/* Command Output Payload */}
                      <div className={`pl-3.5 border-l-2 ${phosphorBorderColor} py-0.5`}>
                        {entry.output}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Command Input Line (only shown when arcade not active) */}
              {!isArcadeActive && (
                <div className="p-3.5 bg-[#0D1512] border-t-2 border-[#2D3645] flex items-center gap-2 relative z-30">
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-fluid-mono select-none">
                    <span className={`${phosphorTextColor} font-bold`}>moayed@ewu-cse</span>
                    <span className="text-[#8E98AA]">:</span>
                    <span className="text-[#00F0FF] font-semibold">~</span>
                    <span className="text-[#D6CFC2] font-bold">$</span>
                  </div>

                  <input
                    ref={inputRef}
                    id="terminal-input"
                    type="text"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      tabCycleRef.current = { prefix: '', index: 0, matches: [] };
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type 'help', 'arcade', 'skills', 'projects', 'github', or 'sudo hire moayed'..."
                    className="w-full bg-transparent font-mono text-fluid-mono text-[#00F0FF] focus:outline-none placeholder:text-[#8E98AA] caret-[#00F0FF]"
                    autoComplete="off"
                    spellCheck="false"
                    aria-label="Terminal command input"
                  />

                  <button
                    onClick={() => executeCommand(inputVal)}
                    className="p-2 bg-[#00F0FF] text-[#070814] hover:bg-white active:scale-95 transition-all shrink-0 font-pixel text-[9px] font-bold flex items-center gap-1 shadow-[2px_2px_0_0_#070814]"
                    aria-label="Execute terminal command"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Run</span>
                  </button>
                </div>
              )}

              {/* Clickable Quick-Command Chips including $arcade */}
              <div className={`px-4 py-3 ${isLight ? 'bg-[#E5DFD3] border-t-2 border-[#1A1D24]' : 'bg-[#131629] border-t-2 border-[#2D3645]'} flex flex-wrap items-center gap-2 select-none relative z-30`}>
                <span className={`font-pixel text-[8px] ${isLight ? 'text-[#3F4654]' : 'text-[#8E98AA]'} flex items-center gap-1 mr-1`}>
                  <CornerDownLeft className={`w-3 h-3 ${isLight ? 'text-[#0052FF]' : 'text-[#00F0FF]'}`} /> Quick exec:
                </span>

                {/* Standard Quick Directives including prompt-mandated $arcade */}
                {[
                  { cmd: 'help', label: 'help', special: false },
                  { cmd: 'whoami', label: 'whoami', special: false },
                  { cmd: 'skills', label: 'skills', special: false },
                  { cmd: 'projects', label: 'projects', special: false },
                  { cmd: 'github', label: 'github', special: false },
                  { cmd: 'arcade', label: '$arcade', special: true, badge: '🎮' },
                  { cmd: 'clear', label: 'clear', special: false },
                ].map(({ cmd, label, special, badge }) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => handleChipClick(cmd)}
                    aria-label={`Execute terminal command: ${cmd}`}
                    className={`font-pixel text-[9px] px-2.5 py-1 border-2 transition-all duration-200 active:scale-95 flex items-center gap-1 ${
                      activeChipAnimation === cmd
                        ? isLight
                          ? 'bg-[#0052FF] text-white font-bold border-[#0052FF] shadow-[0_0_10px_rgba(0,82,255,0.5)]'
                          : 'bg-[#00F0FF] text-[#070814] font-bold border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                        : special
                        ? isLight
                          ? 'bg-[#0052FF]/10 hover:bg-[#0052FF] text-[#0052FF] hover:text-white border-[#0052FF] shadow-[0_0_8px_rgba(0,82,255,0.2)]'
                          : 'bg-[#0C2430] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#070814] border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                        : isLight
                        ? 'bg-[#FFFFFF] hover:bg-[#0052FF]/10 text-[#11131A] hover:text-[#0052FF] border-[#1A1D24]/30 hover:border-[#0052FF]'
                        : 'bg-[#0D1512] hover:bg-[#00F0FF]/15 text-[#D6CFC2] hover:text-[#00F0FF] border-[#2D3645] hover:border-[#00F0FF]'
                    }`}
                  >
                    <span>{label}</span>
                    {badge && <span className="text-[9px]">{badge}</span>}
                  </button>
                ))}

                {/* Special Highlight Chip: sudo hire moayed */}
                <button
                  type="button"
                  onClick={() => handleChipClick('sudo hire moayed')}
                  aria-label="Execute terminal command: sudo hire moayed (Trigger talent acquisition protocol)"
                  className={`font-pixel text-[9px] px-3 py-1 border-2 transition-all duration-300 flex items-center gap-1.5 active:scale-95 ${
                    activeChipAnimation === 'sudo hire moayed'
                      ? 'bg-[#FF2A85] text-white border-[#FF2A85] shadow-[0_0_15px_rgba(255,42,133,0.6)]'
                      : isLight
                      ? 'bg-[#FFFFFF] text-[#11131A] border-[#D90452] hover:bg-[#D90452] hover:text-white'
                      : 'bg-[#131629] text-[#F0EFE6] border-[#FF2A85] hover:bg-[#FF2A85] hover:text-white hover:shadow-[0_0_10px_rgba(255,42,133,0.4)]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#FFCC00] animate-pulse" />
                  <span>sudo hire moayed</span>
                  <span className="text-[8px] text-[#FFCC00] px-1 bg-black/50 border border-[#FFCC00]/30">⚡</span>
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </section>
  );
};

export default TerminalLab;
