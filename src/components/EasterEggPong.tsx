import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { createPortal } from 'react-dom';
import { audio } from '../utils/audio';
import { Magnetic } from './ui/Magnetic';
import { 
  Tv, 
  RotateCcw, 
  Terminal, 
  Sparkles, 
  Cpu, 
  Lock, 
  Unlock,
  Radio
} from 'lucide-react';

interface EasterEggPongProps {
  isOpen: boolean;
  onClose: () => void;
  triggerElementRef?: React.RefObject<HTMLElement | null>;
}

export const EasterEggPong: React.FC<EasterEggPongProps> = ({
  isOpen,
  onClose,
  triggerElementRef,
}) => {
  const [activeChannel, setActiveChannel] = useState<'pong' | 'notes' | 'kernel'>('pong');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [rallyCount, setRallyCount] = useState(0);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isUnlockedRef = useRef(false);
  const resetSignalRef = useRef(false);

  // Keep isUnlockedRef synchronized with state
  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
  }, [isUnlocked]);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for restoration
    const previousActive = document.activeElement as HTMLElement | null;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button initially
    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        setTimeout(() => {
          const btn = triggerElementRef?.current || (previousActive && document.contains(previousActive) ? previousActive : null) || document.querySelector<HTMLElement>('button[aria-label="Open retro CRT channel surfing Easter egg"]');
          btn?.focus();
        }, 50);
        return;
      }

      // Channel shortcuts
      if (e.key === '1') setActiveChannel('pong');
      if (e.key === '2') setActiveChannel('notes');
      if (e.key === '3') setActiveChannel('kernel');

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      setTimeout(() => {
        const btn = triggerElementRef?.current || (previousActive && document.contains(previousActive) ? previousActive : null) || document.querySelector<HTMLElement>('button[aria-label="Open retro CRT channel surfing Easter egg"]');
        btn?.focus();
      }, 50);
    };
  }, [isOpen, onClose, triggerElementRef]);

  // Minimalist Pong Game Engine Loop with Keyboard & Pointer Physics
  useEffect(() => {
    if (!isOpen || activeChannel !== 'pong') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    let width = (canvas.width = parent?.clientWidth || 640);
    let height = (canvas.height = Math.max(220, Math.min(360, Math.floor(width * 0.52))));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.max(220, Math.min(360, Math.floor(width * 0.52)));
    };

    window.addEventListener('resize', handleResize);

    const paddleWidth = 10;
    const paddleHeight = 64;
    const ballSize = 8;

    let playerY = height / 2 - paddleHeight / 2;
    let aiY = height / 2 - paddleHeight / 2;

    let ballX = width / 2;
    let ballY = height / 2;
    let ballSpeedX = 4.2;
    let ballSpeedY = (Math.random() - 0.5) * 3.5;

    let localPlayerScore = playerScore;
    let localAiScore = aiScore;
    let localRally = rallyCount;

    // Keyboard paddle control state
    const keysPressed = { up: false, down: false };
    const handleGameKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysPressed.up = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysPressed.down = true;
      }
    };
    const handleGameKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keysPressed.up = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysPressed.down = false;
      }
    };

    window.addEventListener('keydown', handleGameKeyDown);
    window.addEventListener('keyup', handleGameKeyUp);

    // Track mouse / pointer over canvas with aspect-ratio scaling
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleY = height / (rect.height || 1);
      const relativeY = (e.clientY - rect.top) * scaleY;
      playerY = Math.max(0, Math.min(height - paddleHeight, relativeY - paddleHeight / 2));
    };

    canvas.addEventListener('pointermove', handlePointerMove);

    const resetBall = (direction: number) => {
      ballX = width / 2;
      ballY = height / 2;
      ballSpeedX = direction * 4.2;
      ballSpeedY = (Math.random() - 0.5) * 3.5;
    };

    let isRunning = true;

    const gameLoop = () => {
      if (!isRunning) return;

      // Check external reset button signal
      if (resetSignalRef.current) {
        resetSignalRef.current = false;
        localPlayerScore = 0;
        localAiScore = 0;
        localRally = 0;
        resetBall(1);
      }

      // Handle keyboard paddle velocity
      if (keysPressed.up) {
        playerY = Math.max(0, playerY - 6.5);
      }
      if (keysPressed.down) {
        playerY = Math.min(height - paddleHeight, playerY + 6.5);
      }

      // Update ball position
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Wall bounce top/bottom
      if (ballY <= 0 || ballY + ballSize >= height) {
        ballSpeedY = -ballSpeedY;
        audio.playPongBlip('wall');
      }

      // AI Paddle tracking with organic smoothing
      const aiCenter = aiY + paddleHeight / 2;
      const aiTarget = ballY;
      if (aiCenter < aiTarget - 12) {
        aiY += 3.6;
      } else if (aiCenter > aiTarget + 12) {
        aiY -= 3.6;
      }
      aiY = Math.max(0, Math.min(height - paddleHeight, aiY));

      // Player Paddle Collision (Left)
      if (
        ballX <= paddleWidth + 16 &&
        ballX >= 16 &&
        ballY + ballSize >= playerY &&
        ballY <= playerY + paddleHeight
      ) {
        ballSpeedX = Math.abs(ballSpeedX) * 1.05;
        // Angle variation based on impact offset
        const impactOffset = (ballY + ballSize / 2 - (playerY + paddleHeight / 2)) / (paddleHeight / 2);
        ballSpeedY = impactOffset * 4.5;
        audio.playPongBlip('paddle');
        localRally += 1;
        setRallyCount(localRally);

        // Unlock without tearing down game loop
        if (localRally >= 3 && !isUnlockedRef.current) {
          isUnlockedRef.current = true;
          setIsUnlocked(true);
          audio.playPongBlip('unlock');
        }
      }

      // AI Paddle Collision (Right)
      if (
        ballX + ballSize >= width - 16 - paddleWidth &&
        ballX + ballSize <= width - 16 &&
        ballY + ballSize >= aiY &&
        ballY <= aiY + paddleHeight
      ) {
        ballSpeedX = -Math.abs(ballSpeedX) * 1.04;
        const impactOffset = (ballY + ballSize / 2 - (aiY + paddleHeight / 2)) / (paddleHeight / 2);
        ballSpeedY = impactOffset * 4.2;
        audio.playPongBlip('paddle');
      }

      // Score Player
      if (ballX > width) {
        localPlayerScore += 1;
        setPlayerScore(localPlayerScore);
        audio.playPongBlip('score');
        if (localPlayerScore >= 3 && !isUnlockedRef.current) {
          isUnlockedRef.current = true;
          setIsUnlocked(true);
          audio.playPongBlip('unlock');
        }
        resetBall(-1);
      }

      // Score AI
      if (ballX < 0) {
        localAiScore += 1;
        setAiScore(localAiScore);
        audio.playPongBlip('wall');
        resetBall(1);
      }

      // Clear & Draw Frame
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, width, height);

      // Center court dashed divider rule
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Player Paddle (Retro Cyan Glow)
      ctx.fillStyle = '#DF6C4F';
      ctx.shadowColor = 'rgba(223, 108, 79, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fillRect(16, playerY, paddleWidth, paddleHeight);

      // Draw AI Paddle (Alabaster Glow)
      ctx.fillStyle = '#F4F3EF';
      ctx.shadowColor = 'rgba(244, 243, 239, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillRect(width - 16 - paddleWidth, aiY, paddleWidth, paddleHeight);

      // Draw Ball
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = 'rgba(74, 222, 128, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillRect(ballX, ballY, ballSize, ballSize);

      ctx.shadowBlur = 0; // reset
    };

    gsap.ticker.add(gameLoop);

    return () => {
      isRunning = false;
      gsap.ticker.remove(gameLoop);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleGameKeyDown);
      window.removeEventListener('keyup', handleGameKeyUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, activeChannel]);

  const handleResetGame = useCallback(() => {
    resetSignalRef.current = true;
    setPlayerScore(0);
    setAiScore(0);
    setRallyCount(0);
    audio.playChord();
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-obsidian/90 backdrop-blur-2xl animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="easter-egg-title"
    >
      {/* CRT Television Monitor Frame */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#070814] border-2 border-[#00F0FF] shadow-[0_0_35px_rgba(0,240,255,0.35),0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden"
      >
        {/* CRT Scanline & Phosphor Overlay */}
        <div 
          className="pointer-events-none absolute inset-0 z-30 opacity-40 mix-blend-overlay bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%),linear-gradient(90deg,rgba(0,240,255,0.03),rgba(74,246,38,0.02),rgba(255,42,133,0.03))] bg-[length:100%_4px,6px_100%]" 
          aria-hidden="true"
        />

        {/* Vintage CRT Bezel Header */}
        <div className="relative z-40 flex items-center justify-between px-4 py-2.5 bg-[#D6CFC2] text-[#070814] border-b-2 border-[#2D3645] select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-[#2D3645] bg-[#070814] text-[#00F0FF] font-pixel text-[9px] uppercase tracking-wider">
              <Radio className="w-3 h-3 text-[#4AF626] animate-pulse" />
              <span>SYS.96 // CH.SURF // EASTER_EGG.ROM</span>
            </div>
            <span className="hidden md:inline text-[#2D3645] text-xs font-mono">•</span>
            <span className="hidden md:inline font-pixel text-[9px] text-[#2D3645]">
              MODEL: FP-1994-PONG-OS
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center border-2 border-[#2D3645] bg-[#D6CFC2] text-[#070814] font-pixel text-[9px] leading-none hover:bg-white"
              aria-hidden="true"
            >
              -
            </button>
            <button
              type="button"
              className="w-5 h-5 flex items-center justify-center border-2 border-[#2D3645] bg-[#D6CFC2] text-[#070814] font-pixel text-[9px] leading-none hover:bg-white"
              aria-hidden="true"
            >
              +
            </button>
            <Magnetic>
              <button
                ref={closeBtnRef}
                onClick={onClose}
                aria-label="Close retro CRT channel surfing Easter egg"
                className="w-5 h-5 flex items-center justify-center border-2 border-[#2D3645] bg-[#FF2A85] text-white hover:bg-red-600 transition-colors font-pixel text-[9px] leading-none"
              >
                x
              </button>
            </Magnetic>
          </div>
        </div>

        {/* Channel Selector Bar */}
        <div className="relative z-40 flex items-center justify-between gap-2 px-4 py-2 bg-[#0D1512] border-b-2 border-[#2D3645] overflow-x-auto text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#00F0FF] font-pixel text-[9px] tracking-wider uppercase mr-1 hidden sm:inline">&gt; CH:</span>
            
            <button
              onClick={() => {
                setActiveChannel('pong');
                audio.playTick();
              }}
              aria-label="Switch to Channel 1: Minimalist Pong Arcade"
              aria-pressed={activeChannel === 'pong'}
              className={`flex items-center gap-1.5 px-2.5 py-1 border-2 font-pixel text-[9px] transition-all ${
                activeChannel === 'pong'
                  ? 'border-[#00F0FF] bg-[#131629] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)] font-bold'
                  : 'border-[#2D3645] bg-[#070814] text-[#8E98AA] hover:text-[#F0EFE6] hover:border-[#00F0FF]/50'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>[1] PONG_ARCADE</span>
            </button>

            <button
              onClick={() => {
                setActiveChannel('notes');
                audio.playTick();
              }}
              aria-label="Switch to Channel 2: Classified Developer Notes"
              aria-pressed={activeChannel === 'notes'}
              className={`flex items-center gap-1.5 px-2.5 py-1 border-2 font-pixel text-[9px] transition-all ${
                activeChannel === 'notes'
                  ? 'border-[#FF2A85] bg-[#131629] text-[#FF2A85] shadow-[0_0_10px_rgba(255,42,133,0.3)] font-bold'
                  : 'border-[#2D3645] bg-[#070814] text-[#8E98AA] hover:text-[#F0EFE6] hover:border-[#FF2A85]/50'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>[2] DEV_NOTES</span>
              {isUnlocked ? (
                <Unlock className="w-3 h-3 text-[#4AF626]" />
              ) : (
                <Lock className="w-3 h-3 opacity-60" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveChannel('kernel');
                audio.playTick();
              }}
              aria-label="Switch to Channel 3: Systems & Micro-Labs"
              aria-pressed={activeChannel === 'kernel'}
              className={`flex items-center gap-1.5 px-2.5 py-1 border-2 font-pixel text-[9px] transition-all ${
                activeChannel === 'kernel'
                  ? 'border-[#4AF626] bg-[#131629] text-[#4AF626] shadow-[0_0_10px_rgba(74,246,38,0.3)] font-bold'
                  : 'border-[#2D3645] bg-[#070814] text-[#8E98AA] hover:text-[#F0EFE6] hover:border-[#4AF626]/50'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>[3] POSIX_KERNEL</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[#8E98AA]">
            <span className="font-pixel text-[8px] uppercase tracking-wider text-[#FFCC00]">[HOTKEYS: 1, 2, 3 | ESC]</span>
          </div>
        </div>

        {/* CRT Main Screen Body */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070814]">
          {/* CHANNEL 01: PONG MINI-GAME */}
          {activeChannel === 'pong' && (
            <div className="flex flex-col items-center">
              {/* Scoreboard and Status Bar */}
              <div className="w-full flex items-center justify-between mb-3 px-2 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-[#FF2A85] font-pixel text-xs flex items-center gap-1.5">
                    <span>YOU:</span>
                    <span className="text-sm px-2 py-0.5 border-2 border-[#2D3645] bg-[#131629] text-[#FF2A85]">{playerScore}</span>
                  </span>
                  <span className="text-[#8E98AA] font-pixel text-[10px]">VS</span>
                  <span className="text-[#00F0FF] font-pixel text-xs flex items-center gap-1.5">
                    <span>AI:</span>
                    <span className="text-sm px-2 py-0.5 border-2 border-[#2D3645] bg-[#131629] text-[#00F0FF]">{aiScore}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8E98AA] font-pixel text-[9px] hidden sm:inline">
                    RALLY: <strong className="text-[#FFCC00] font-pixel">{rallyCount}</strong>
                  </span>
                  <Magnetic>
                    <button
                      onClick={handleResetGame}
                      aria-label="Reset Pong mini-game score"
                      className="flex items-center gap-1 px-2.5 py-1 border-2 border-[#2D3645] bg-[#131629] hover:border-[#00F0FF] text-[#00F0FF] text-xs font-pixel text-[9px] transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>RESET</span>
                    </button>
                  </Magnetic>
                </div>
              </div>

              {/* Pong Canvas Arena */}
              <div className="relative w-full border-2 border-[#00F0FF] overflow-hidden bg-[#070814] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <canvas 
                  ref={canvasRef}
                  className="w-full block cursor-ns-resize touch-none"
                />

                {/* Overlaid unlock celebration banner */}
                {isUnlocked && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 border-2 border-[#4AF626] bg-[#0D1512] text-[#4AF626] font-pixel text-[9px] tracking-wider uppercase animate-bounce">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFCC00]" />
                    <span>Secret Transmission Unlocked! Check CH-02</span>
                  </div>
                )}
              </div>

              {/* Interactive Help Pill */}
              <div className="mt-3 text-center font-mono text-[11px] text-[#8E98AA]">
                <span>Move pointer vertically or use [↑ / ↓] / [W / S] keys to steer the left paddle. Rally 3 hits or score 3 points to decrypt hidden developer notes.</span>
              </div>
            </div>
          )}

          {/* CHANNEL 02: HIDDEN DEVELOPER NOTES */}
          {activeChannel === 'notes' && (
            <div className="space-y-4 font-mono text-xs text-[#F0EFE6] leading-relaxed">
              <div className="flex items-center justify-between p-3 border-2 border-[#2D3645] bg-[#131629]">
                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <Unlock className="w-4 h-4 text-[#4AF626]" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#FFCC00]" />
                  )}
                  <h3 id="easter-egg-title" className="font-pixel text-[11px] text-[#F0EFE6] tracking-wide">
                    {isUnlocked 
                      ? 'CLASSIFIED ARCHITECTURAL TRANSMISSION: DECRYPTED'
                      : 'RESTRICTED ARCHIVES // DECRYPTION REQUIRED'}
                  </h3>
                </div>
                <span className="font-pixel text-[8px] text-[#8E98AA]">TRANSMISSION ID: FP-DEV-2026</span>
              </div>

              <div className="p-4 border-2 border-[#2D3645] bg-[#131629] space-y-3 font-sans text-sm">
                <h4 className="font-pixel text-xs text-[#00F0FF] flex items-center gap-2">
                  <span>Architecture Philosophy: "Zero-Gravity Engineering"</span>
                </h4>
                <p className="text-[#8E98AA] leading-relaxed font-mono text-xs">
                  "Most modern portfolios treat motion as an afterthought — slapping cubic bezier transitions onto a Bootstrap grid. Inspired by Tom Barrow and classic editorial typographers, FolioPort treats the browser viewport as an analog canvas governed by rigid Newtonian mechanics."
                </p>
                <div className="p-3 border-2 border-[#2D3645] bg-[#070814] font-mono text-xs text-[#FF2A85] space-y-1">
                  <p>• Hook Architecture: useReveal() synchronizes ScrollTrigger with declarative attributes without DOM overhead.</p>
                  <p>• Vector Physics: Magnetic quickTo setters decouple mouse sampling from React virtual DOM renders.</p>
                  <p>• Procedural Audio: 2ms low-pass filtered triangle waves mimic analog ledger tactile resistance.</p>
                </div>
              </div>

              <div className="p-4 border-2 border-[#2D3645] bg-[#131629] space-y-2">
                <h4 className="font-pixel text-xs text-[#FFCC00]">Secret Terminal Commands:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2 border border-[#2D3645] bg-[#070814]">
                    <span className="text-[#00F0FF] font-pixel text-[9px]">&gt; sudo hire moayed</span>
                    <p className="text-[#8E98AA] text-[11px] mt-0.5">Prefills transmission dispatch form with recruiter payload.</p>
                  </div>
                  <div className="p-2 border border-[#2D3645] bg-[#070814]">
                    <span className="text-[#00F0FF] font-pixel text-[9px]">&gt; sudo defrag</span>
                    <p className="text-[#8E98AA] text-[11px] mt-0.5">Re-indexes spatial memory nodes in Matter.js physics.</p>
                  </div>
                  <div className="p-2 border border-[#2D3645] bg-[#070814]">
                    <span className="text-[#00F0FF] font-pixel text-[9px]">&gt; dhaka</span>
                    <p className="text-[#8E98AA] text-[11px] mt-0.5">Prints real-time Asian Edge CDN telemetry & local time.</p>
                  </div>
                  <div className="p-2 border border-[#2D3645] bg-[#070814]">
                    <span className="text-[#00F0FF] font-pixel text-[9px]">&gt; sudo barrow</span>
                    <p className="text-[#8E98AA] text-[11px] mt-0.5">Re-arms CRT scanlines and procedural harmonic synthesizers.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL 03: POSIX KERNEL TELEMETRY */}
          {activeChannel === 'kernel' && (
            <div className="space-y-4 font-mono text-xs text-[#F0EFE6]">
              <div className="p-3 border-2 border-[#2D3645] bg-[#131629] flex items-center justify-between">
                <span className="text-[#00F0FF] font-pixel text-[10px]">LINUX C / POSIX KERNEL WORKFLOW TELEMETRY</span>
                <span className="text-[#4AF626] font-pixel text-[9px] flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#4AF626] animate-ping" />
                  STATUS: 0 LEAKS (VALGRIND CLEAN)
                </span>
              </div>

              <div className="p-4 border-2 border-[#2D3645] bg-[#131629] space-y-3">
                <h4 className="font-pixel text-xs text-[#FF2A85]">Low-Level Systems Manifesto:</h4>
                <p className="text-[#8E98AA] leading-relaxed font-mono text-xs">
                  "At East West University, our core operating systems research spans C/C++ POSIX shared memory (shmget, shmat) with hardware spinlocks and multi-process fork() trees communicating over anonymous duplex pipes with microsecond IPC latencies."
                </p>

                <div className="p-3 border-2 border-[#2D3645] bg-[#070814] overflow-x-auto text-[11px] text-[#4AF626] font-mono">
                  <code>{`/* POSIX Shared Memory IPC Synchronization Benchmark */
int shm_id = shmget(IPC_PRIVATE, sizeof(telemetry_buffer_t), IPC_CREAT | 0666);
telemetry_buffer_t *shared = (telemetry_buffer_t *)shmat(shm_id, NULL, 0);
atomic_flag_clear(&shared->spinlock);
// IPC Round-Trip: < 1.2 microseconds`}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vintage CRT Footer Control Deck */}
        <div className="relative z-40 flex items-center justify-between px-4 py-2.5 bg-[#D6CFC2] text-[#070814] border-t-2 border-[#2D3645] font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#4AF626] animate-pulse" />
            <span className="font-pixel text-[9px] text-[#070814]">CHANNEL SURF ACTIVE // OPT-IN AUDIO ENABLED</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Return to portfolio page from CRT Easter egg"
            className="px-3 py-1 border-2 border-[#2D3645] bg-[#070814] hover:bg-[#131629] text-[#00F0FF] font-pixel text-[9px] transition-colors"
          >
            [ EXIT MONITOR ]
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EasterEggPong;
