import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Position,
  isValidKnightMove,
  get3MovePuzzle,
  KnightsTourPuzzle,
} from '../utils/knightsTour';
import { watchknightAudio as audioEngine } from '../audio/WatchknightAudioEngine';
import { retroAudio } from '../utils/retroAudio';
import {
  RotateCcw,
  Undo2,
  Home,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export interface NotFoundPageProps {
  onReturnHome?: () => void;
  puzzleIndex?: number;
}

const BOARD_SIZE = 5;
const COL_LABELS = ['A', 'B', 'C', 'D', 'E'];
const ROW_LABELS = ['1', '2', '3', '4', '5'];

const PHOSPHOR = {
  void: '#111712',
  dim: '#2e3b2b',
  mid: '#6e7d62',
  bright: '#c2cdb4',
};

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onReturnHome,
  puzzleIndex = 0,
}) => {
  const [puzzle] = useState<KnightsTourPuzzle>(() => get3MovePuzzle(puzzleIndex));
  const [currentPos, setCurrentPos] = useState<Position>(puzzle.start);
  const [visitedPath, setVisitedPath] = useState<Position[]>([puzzle.start]);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [invalidNotice, setInvalidNotice] = useState<string | null>(null);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>(
    '404 Page Not Found. Current position: Square A1. Move the Knight in valid L-shaped jumps to reach Target E4 in exactly 3 moves.'
  );
  const [isTransitioningHome, setIsTransitioningHome] = useState<boolean>(false);

  const autoRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoRedirectTimeoutRef.current) {
        clearTimeout(autoRedirectTimeoutRef.current);
      }
    };
  }, []);

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

    try {
      retroAudio.playOpenWindow();
    } catch {}

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
  }, [isTransitioningHome, onReturnHome]);

  // Reset the path back to the origin
  const handleReset = useCallback(() => {
    if (isSolved || isTransitioningHome) return;
    setVisitedPath([puzzle.start]);
    setCurrentPos(puzzle.start);
    setQuotaExceeded(false);
    setInvalidNotice(null);
    setScreenReaderAnnouncement('Path reset to origin square A1. 0 of 3 moves taken.');

    try {
      audioEngine.play8BitBlip(440);
    } catch {}
  }, [isSolved, isTransitioningHome, puzzle.start]);

  // Undo the most recent move
  const handleUndo = useCallback(() => {
    if (isSolved || isTransitioningHome || visitedPath.length <= 1) return;
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

    try {
      audioEngine.play8BitBlip(520);
    } catch {}
  }, [visitedPath, isSolved, isTransitioningHome]);

  // Move piece to target coordinate if legal
  const handleSquareClick = useCallback(
    (target: Position) => {
      if (isSolved || isTransitioningHome) return;

      // Check if user has already spent 3 moves without reaching target
      if (visitedPath.length - 1 >= 3) {
        setQuotaExceeded(true);
        setInvalidNotice(
          '3-move limit reached. Click Reset or Undo to try again.'
        );
        return;
      }

      const isValid = isValidKnightMove(currentPos, target, BOARD_SIZE);

      if (!isValid) {
        const targetLabel = `${COL_LABELS[target.x] ?? '?'}${ROW_LABELS[target.y] ?? '?'}`;
        const currentLabel = `${COL_LABELS[currentPos.x] ?? '?'}${ROW_LABELS[currentPos.y] ?? '?'}`;
        setInvalidNotice(
          `Invalid jump: ${targetLabel} is not an L-shaped move from ${currentLabel}.`
        );
        setScreenReaderAnnouncement(
          `Invalid move to ${targetLabel}. Knights must move in an L-shape.`
        );

        try {
          audioEngine.play8BitBlip(220);
        } catch {}
        return;
      }

      setInvalidNotice(null);
      const newPath = [...visitedPath, target];
      setVisitedPath(newPath);
      setCurrentPos(target);

      try {
        audioEngine.play8BitBlip(660);
      } catch {}

      const moveNumber = newPath.length - 1;
      const targetLabel = `${COL_LABELS[target.x]}${ROW_LABELS[target.y]}`;

      // Check if player reached the target node
      if (target.x === puzzle.target.x && target.y === puzzle.target.y) {
        if (moveNumber === 3) {
          setIsSolved(true);
          setQuotaExceeded(false);
          const msg = `Target ${targetLabel} reached in exactly 3 moves. Returning home...`;
          setScreenReaderAnnouncement(msg);

          try {
            retroAudio.playBlip();
          } catch {}

          autoRedirectTimeoutRef.current = setTimeout(() => {
            handleReturnHome();
          }, 1200);
        } else {
          setQuotaExceeded(true);
          setInvalidNotice(
            `Target reached in ${moveNumber} moves, but 404 requires the exact 3-move path. Reset or undo to try again.`
          );
        }
      } else if (moveNumber >= 3) {
        setQuotaExceeded(true);
        setInvalidNotice(
          '3 moves exhausted without reaching the target. Use Undo or Reset to retry.'
        );
        setScreenReaderAnnouncement(
          `Moved to ${targetLabel}. 3-move quota reached without hitting target. Please undo or reset.`
        );
      } else {
        setScreenReaderAnnouncement(
          `Moved to ${targetLabel}. Move ${moveNumber} of 3.`
        );
      }
    },
    [currentPos, isSolved, isTransitioningHome, puzzle, visitedPath, handleReturnHome]
  );

  // Keyboard accessibility: Escape to home (disabled when typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const targetTag = target?.tagName?.toUpperCase();
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const activeTag = activeEl?.tagName?.toUpperCase();
      const isTyping =
        targetTag === 'INPUT' ||
        targetTag === 'TEXTAREA' ||
        targetTag === 'SELECT' ||
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        activeTag === 'SELECT' ||
        target?.isContentEditable ||
        Boolean(activeEl && 'isContentEditable' in activeEl && (activeEl as HTMLElement).isContentEditable);

      if (isTyping) return;

      if (e.key === 'Escape') {
        handleReturnHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReturnHome]);

  return (
    <div
      data-testid="retro-404-screen"
      className="w-full h-full flex flex-col justify-between p-4 sm:p-6 select-none font-pixel overflow-y-auto"
      style={{
        backgroundColor: PHOSPHOR.void,
        color: PHOSPHOR.bright,
      }}
    >
      {/* Screen Reader Live Telemetry Region */}
      <div className="sr-only" aria-live="polite" role="status">
        {screenReaderAnnouncement}
      </div>

      {/* Top Header */}
      <header className="flex items-center justify-between border-b pb-2" style={{ borderColor: PHOSPHOR.mid }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 inline-block animate-pulse" style={{ backgroundColor: PHOSPHOR.bright }} />
          <h1 className="font-pixel text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: PHOSPHOR.bright }}>
            404 - Page Not Found
          </h1>
        </div>

        <button
          type="button"
          onClick={handleReturnHome}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 border font-mono text-[9px] uppercase tracking-wider cursor-pointer transition-none active:translate-y-[1px]"
          style={{
            backgroundColor: PHOSPHOR.dim,
            borderColor: PHOSPHOR.mid,
            color: PHOSPHOR.bright,
          }}
        >
          <Home className="w-3 h-3" />
          <span>Return Home</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="my-auto flex flex-col items-center gap-3 py-3 text-center">
        <p
          className="font-body text-[15.5px] leading-[1.65] max-w-md"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: PHOSPHOR.bright,
          }}
        >
          The requested route could not be found. Reconnect by executing the 3-move Knight jump puzzle (|dx|=1, |dy|=2) below, or return home.
        </p>

        {/* Status Ledger */}
        <div
          className="w-full max-w-xs grid grid-cols-3 gap-2 p-2 border font-mono text-xs"
          style={{
            backgroundColor: `${PHOSPHOR.dim}80`,
            borderColor: PHOSPHOR.mid,
          }}
        >
          <div>
            <span className="block text-[8px] uppercase" style={{ color: PHOSPHOR.mid }}>Origin</span>
            <span className="font-bold" style={{ color: PHOSPHOR.bright }}>
              {COL_LABELS[puzzle.start.x]}{ROW_LABELS[puzzle.start.y]}
            </span>
          </div>
          <div>
            <span className="block text-[8px] uppercase" style={{ color: PHOSPHOR.mid }}>Moves</span>
            <span
              className="font-bold text-sm"
              style={{
                color: isSolved ? PHOSPHOR.bright : (quotaExceeded ? PHOSPHOR.mid : PHOSPHOR.bright),
              }}
            >
              {visitedPath.length - 1} / 3
            </span>
          </div>
          <div>
            <span className="block text-[8px] uppercase" style={{ color: PHOSPHOR.mid }}>Target</span>
            <span className="font-bold animate-pulse" style={{ color: PHOSPHOR.bright }}>
              {COL_LABELS[puzzle.target.x]}{ROW_LABELS[puzzle.target.y]}
            </span>
          </div>
        </div>

        {/* Notices */}
        {invalidNotice && (
          <div
            className="px-2.5 py-1 border text-xs font-mono flex items-center gap-1.5"
            role="alert"
            style={{
              backgroundColor: `${PHOSPHOR.dim}90`,
              borderColor: PHOSPHOR.bright,
              color: PHOSPHOR.bright,
            }}
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{invalidNotice}</span>
          </div>
        )}

        {isSolved && (
          <div
            className="px-3 py-1.5 border text-xs font-mono flex items-center gap-2 animate-bounce"
            role="status"
            style={{
              backgroundColor: PHOSPHOR.dim,
              borderColor: PHOSPHOR.bright,
              color: PHOSPHOR.bright,
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">Solved in 3 moves. Returning home...</span>
          </div>
        )}

        {/* 5x5 Knight's Tour Chessboard */}
        <div
          className="relative p-2.5 sm:p-3 border select-none"
          style={{
            backgroundColor: `${PHOSPHOR.dim}40`,
            borderColor: PHOSPHOR.mid,
          }}
        >
          {/* Top Column Coordinates (A-E) */}
          <div className="grid grid-cols-5 gap-1 mb-1 text-center font-mono text-[9px]" style={{ color: PHOSPHOR.mid }}>
            {COL_LABELS.map((col) => (
              <div key={col}>{col}</div>
            ))}
          </div>

          {/* Grid with SVG line overlay */}
          <div className="relative">
            {/* SVG Graph Edges Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              viewBox="0 0 500 500"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {edges.map((edge, idx) => {
                const x1 = (edge.from.x + 0.5) * 100;
                const y1 = (edge.from.y + 0.5) * 100;
                const x2 = (edge.to.x + 0.5) * 100;
                const y2 = (edge.to.y + 0.5) * 100;

                return (
                  <line
                    key={`edge-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={PHOSPHOR.bright}
                    strokeWidth="3"
                    strokeDasharray="4,2"
                  />
                );
              })}
            </svg>

            {/* 5x5 Grid Cells */}
            <div className="grid grid-cols-5 gap-1" role="grid" aria-label="Knight's Tour 5x5 Grid">
              {Array.from({ length: BOARD_SIZE }).map((_, y) => (
                <React.Fragment key={`row-${y}`}>
                  {Array.from({ length: BOARD_SIZE }).map((__, x) => {
                    const isCurrent = currentPos.x === x && currentPos.y === y;
                    const isTarget = puzzle.target.x === x && puzzle.target.y === y;
                    const isVisited = visitedPath.some((p) => p.x === x && p.y === y);
                    const isDarkSquare = (x + y) % 2 === 1;
                    const isValidMove = isValidKnightMove(currentPos, { x, y }, BOARD_SIZE);

                    return (
                      <button
                        key={`cell-${x}-${y}`}
                        type="button"
                        role="gridcell"
                        aria-label={`Square ${COL_LABELS[x]}${ROW_LABELS[y]}${isCurrent ? ', current' : ''}${isTarget ? ', target' : ''}`}
                        onClick={() => handleSquareClick({ x, y })}
                        className="relative w-8 h-8 sm:w-10 sm:h-10 border flex items-center justify-center font-mono text-[9px] cursor-pointer transition-none outline-none focus-visible:outline-dashed"
                        style={{
                          backgroundColor: isCurrent
                            ? PHOSPHOR.bright
                            : isTarget
                            ? `${PHOSPHOR.dim}cc`
                            : isVisited
                            ? `${PHOSPHOR.dim}80`
                            : isDarkSquare
                            ? PHOSPHOR.void
                            : `${PHOSPHOR.dim}40`,
                          borderColor: isCurrent
                            ? PHOSPHOR.bright
                            : isTarget
                            ? PHOSPHOR.bright
                            : isValidMove
                            ? PHOSPHOR.mid
                            : `${PHOSPHOR.mid}40`,
                          color: isCurrent ? PHOSPHOR.void : PHOSPHOR.bright,
                        }}
                      >
                        {isCurrent ? (
                          <span className="font-bold text-xs">♞</span>
                        ) : isTarget ? (
                          <span className="font-bold text-[10px]">★</span>
                        ) : isVisited ? (
                          <span className="text-[8px] opacity-70">•</span>
                        ) : null}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Puzzle Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={visitedPath.length <= 1 || isSolved}
            className="inline-flex items-center gap-1 px-2.5 py-1 border font-mono text-[9px] uppercase tracking-wider cursor-pointer transition-none active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: PHOSPHOR.dim,
              borderColor: PHOSPHOR.mid,
              color: PHOSPHOR.bright,
            }}
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo Step</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={visitedPath.length <= 1 || isSolved}
            className="inline-flex items-center gap-1 px-2.5 py-1 border font-mono text-[9px] uppercase tracking-wider cursor-pointer transition-none active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: PHOSPHOR.dim,
              borderColor: PHOSPHOR.mid,
              color: PHOSPHOR.bright,
            }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Path</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t pt-2 flex items-center justify-between font-mono text-[8px]" style={{ borderColor: `${PHOSPHOR.mid}60`, color: PHOSPHOR.mid }}>
        <span>Abdur Rahman Moayed (@watchknight)</span>
        <span>Press Esc to return home</span>
      </footer>
    </div>
  );
};

export default NotFoundPage;
