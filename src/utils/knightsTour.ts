// src/utils/knightsTour.ts
// Precision Graph Validator & Path Planner for the 5x5 Knight's Tour Chessboard

export interface Position {
  x: number; // Column index (0 to boardSize - 1)
  y: number; // Row index (0 to boardSize - 1)
}

export interface KnightMoveEdge {
  from: Position;
  to: Position;
}

export interface KnightsTourPuzzle {
  start: Position;
  target: Position;
  minMoves: number;
  optimalPath: Position[];
}

/**
 * Standard knight jump deltas: 8 possible L-shaped graph transitions.
 * Satisfies (|dx| == 1 && |dy| == 2) || (|dx| == 2 && |dy| == 1).
 */
export const KNIGHT_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [-2, -1], [-2, 1],
  [-1, -2], [-1, 2],
  [1, -2],  [1, 2],
  [2, -1],  [2, 1],
] as const;

/**
 * Validates whether a coordinate lies within the n x n board boundary.
 */
export function isWithinBoard(pos: Position, boardSize: number = 5): boolean {
  if (!pos || typeof pos !== 'object') {
    return false;
  }
  if (!Number.isInteger(boardSize) || boardSize <= 0) {
    return false;
  }
  return (
    Number.isInteger(pos.x) &&
    Number.isInteger(pos.y) &&
    pos.x >= 0 &&
    pos.x < boardSize &&
    pos.y >= 0 &&
    pos.y < boardSize
  );
}

/**
 * Validates whether a single move from `from` to `to` constitutes a legal Knight move.
 * Rule: (|dx| == 1 && |dy| == 2) || (|dx| == 2 && |dy| == 1) within board limits.
 */
export function isValidKnightMove(
  from: Position,
  to: Position,
  boardSize: number = 5
): boolean {
  if (!isWithinBoard(from, boardSize) || !isWithinBoard(to, boardSize)) {
    return false;
  }

  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);

  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

/**
 * Enumerates all legal Knight moves from a given position.
 */
export function getValidKnightMoves(
  from: Position,
  boardSize: number = 5
): Position[] {
  if (!isWithinBoard(from, boardSize)) {
    return [];
  }

  const validMoves: Position[] = [];

  for (const [dx, dy] of KNIGHT_DELTAS) {
    const candidate: Position = { x: from.x + dx, y: from.y + dy };
    if (isWithinBoard(candidate, boardSize)) {
      validMoves.push(candidate);
    }
  }

  return validMoves;
}

/**
 * Encodes a Position into a unique string key "x,y" for hash set lookup.
 */
export function posToKey(pos: Position): string {
  if (!pos || typeof pos !== 'object' || !Number.isInteger(pos.x) || !Number.isInteger(pos.y)) {
    return '0,0';
  }
  return `${pos.x},${pos.y}`;
}

/**
 * Decodes a key string "x,y" back into a Position.
 */
export function keyToPos(key: string): Position {
  if (!key || typeof key !== 'string') {
    return { x: 0, y: 0 };
  }
  const parts = key.split(',').map(Number);
  const x = Number.isInteger(parts[0]) ? parts[0] : 0;
  const y = Number.isInteger(parts[1]) ? parts[1] : 0;
  return { x, y };
}

/**
 * Computes the shortest path of Knight moves between `start` and `target` using BFS.
 * Returns an array of Positions starting with `start` and ending with `target`.
 * If `start` equals `target`, returns `[start]`.
 * If no path exists, returns `null`.
 */
export function findShortestPath(
  start: Position,
  target: Position,
  boardSize: number = 5
): Position[] | null {
  if (!isWithinBoard(start, boardSize) || !isWithinBoard(target, boardSize)) {
    return null;
  }

  if (start.x === target.x && start.y === target.y) {
    return [start];
  }

  const startKey = posToKey(start);
  const targetKey = posToKey(target);

  const queue: Position[] = [start];
  const visited = new Set<string>([startKey]);
  const parentMap = new Map<string, Position>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = posToKey(current);

    if (currentKey === targetKey) {
      // Reconstruct path
      const path: Position[] = [target];
      let stepKey = targetKey;

      while (stepKey !== startKey) {
        const parent = parentMap.get(stepKey)!;
        path.unshift(parent);
        stepKey = posToKey(parent);
      }

      return path;
    }

    const nextMoves = getValidKnightMoves(current, boardSize);
    for (const next of nextMoves) {
      const nextKey = posToKey(next);
      if (!visited.has(nextKey)) {
        visited.add(nextKey);
        parentMap.set(nextKey, current);
        queue.push(next);
      }
    }
  }

  return null;
}

/**
 * Computes the minimal number of knight jumps between `start` and `target`.
 * Returns -1 if unreachable or invalid.
 */
export function getKnightDistance(
  start: Position,
  target: Position,
  boardSize: number = 5
): number {
  const path = findShortestPath(start, target, boardSize);
  return path ? path.length - 1 : -1;
}

/**
 * Validates a sequential path of moves. Returns true if every consecutive pair
 * is a legal Knight move.
 */
export function isValidPath(
  path: Position[],
  boardSize: number = 5
): boolean {
  if (!Array.isArray(path)) {
    return false;
  }
  if (path.length === 0) {
    return true;
  }

  for (let i = 0; i < path.length; i++) {
    if (!isWithinBoard(path[i], boardSize)) {
      return false;
    }
    if (i > 0) {
      if (!isValidKnightMove(path[i - 1], path[i], boardSize)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Canonical 3-move puzzle instances on a 5x5 board:
 * (0,0) -> (4,3): 3 moves via (1,2) -> (2,4) -> (4,3)
 * (0,0) -> (4,1): 3 moves via (1,2) -> (3,3) -> (4,1)
 * (0,0) -> (1,4): 3 moves via (2,1) -> (3,3) -> (1,4)
 */
export const PRESET_3_MOVE_PUZZLES: ReadonlyArray<KnightsTourPuzzle> = [
  {
    start: { x: 0, y: 0 },
    target: { x: 4, y: 3 },
    minMoves: 3,
    optimalPath: [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 4, y: 3 },
    ],
  },
  {
    start: { x: 0, y: 0 },
    target: { x: 4, y: 1 },
    minMoves: 3,
    optimalPath: [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 1 },
    ],
  },
  {
    start: { x: 0, y: 0 },
    target: { x: 1, y: 4 },
    minMoves: 3,
    optimalPath: [
      { x: 0, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: 3 },
      { x: 1, y: 4 },
    ],
  },
  {
    start: { x: 4, y: 4 },
    target: { x: 0, y: 1 },
    minMoves: 3,
    optimalPath: [
      { x: 4, y: 4 },
      { x: 3, y: 2 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
    ],
  },
];

/**
 * Returns a 3-move Knight's Tour puzzle instance.
 */
export function get3MovePuzzle(index: number = 0): KnightsTourPuzzle {
  const len = PRESET_3_MOVE_PUZZLES.length;
  if (len === 0) {
    throw new Error('No preset puzzles configured');
  }
  const numericIdx = Number.isFinite(index) ? Math.floor(index) : 0;
  const safeIdx = ((numericIdx % len) + len) % len;
  return PRESET_3_MOVE_PUZZLES[safeIdx];
}
