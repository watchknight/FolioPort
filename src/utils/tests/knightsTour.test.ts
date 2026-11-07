import { describe, it, expect } from 'vitest';
import {
  isValidKnightMove,
  getValidKnightMoves,
  findShortestPath,
  getKnightDistance,
  isValidPath,
  isWithinBoard,
  posToKey,
  keyToPos,
  get3MovePuzzle,
  PRESET_3_MOVE_PUZZLES,
  KNIGHT_DELTAS,
  Position,
} from '../knightsTour';

describe("Knight's Tour Graph Validator & Solver (@watchknight 404 Sentinel)", () => {
  describe('Boundary and Coordinate Checks', () => {
    it('correctly identifies valid in-bounds positions on a 5x5 board', () => {
      expect(isWithinBoard({ x: 0, y: 0 }, 5)).toBe(true);
      expect(isWithinBoard({ x: 4, y: 4 }, 5)).toBe(true);
      expect(isWithinBoard({ x: 2, y: 3 }, 5)).toBe(true);
    });

    it('rejects out-of-bounds positions', () => {
      expect(isWithinBoard({ x: -1, y: 0 }, 5)).toBe(false);
      expect(isWithinBoard({ x: 0, y: -1 }, 5)).toBe(false);
      expect(isWithinBoard({ x: 5, y: 2 }, 5)).toBe(false);
      expect(isWithinBoard({ x: 2, y: 5 }, 5)).toBe(false);
      expect(isWithinBoard({ x: 1.5, y: 2 }, 5)).toBe(false);
    });

    it('serializes and deserializes position keys reliably', () => {
      const pos: Position = { x: 3, y: 2 };
      const key = posToKey(pos);
      expect(key).toBe('3,2');
      expect(keyToPos(key)).toEqual(pos);
    });
  });

  describe('Single-Move Knight Graph Validation: (|dx|==1 && |dy|==2) || (|dx|==2 && |dy|==1)', () => {
    it('validates all 8 standard L-shaped jumps from a central square', () => {
      const center: Position = { x: 2, y: 2 };

      for (const [dx, dy] of KNIGHT_DELTAS) {
        const dest: Position = { x: center.x + dx, y: center.y + dy };
        expect(isValidKnightMove(center, dest, 5)).toBe(true);
      }
    });

    it('rejects straight moves, diagonals, and staying in place', () => {
      const center: Position = { x: 2, y: 2 };

      // Staying in place
      expect(isValidKnightMove(center, { x: 2, y: 2 }, 5)).toBe(false);

      // Orthogonal 1 square (Rook move)
      expect(isValidKnightMove(center, { x: 2, y: 3 }, 5)).toBe(false);
      expect(isValidKnightMove(center, { x: 3, y: 2 }, 5)).toBe(false);

      // Orthogonal 2 squares
      expect(isValidKnightMove(center, { x: 2, y: 4 }, 5)).toBe(false);
      expect(isValidKnightMove(center, { x: 4, y: 2 }, 5)).toBe(false);

      // Diagonal 1 square (Bishop move)
      expect(isValidKnightMove(center, { x: 3, y: 3 }, 5)).toBe(false);
      expect(isValidKnightMove(center, { x: 1, y: 1 }, 5)).toBe(false);

      // Diagonal 2 squares
      expect(isValidKnightMove(center, { x: 4, y: 4 }, 5)).toBe(false);
      expect(isValidKnightMove(center, { x: 0, y: 0 }, 5)).toBe(false);

      // 3 squares jump
      expect(isValidKnightMove(center, { x: 2, y: 5 }, 5)).toBe(false);
    });

    it('rejects moves that start or land outside board bounds', () => {
      expect(isValidKnightMove({ x: 0, y: 0 }, { x: -1, y: 2 }, 5)).toBe(false);
      expect(isValidKnightMove({ x: 0, y: 0 }, { x: 2, y: -1 }, 5)).toBe(false);
      expect(isValidKnightMove({ x: -1, y: -1 }, { x: 1, y: 0 }, 5)).toBe(false);
      expect(isValidKnightMove({ x: 4, y: 4 }, { x: 6, y: 5 }, 5)).toBe(false);
    });

    it('correctly handles board corner moves (only 2 valid options on 5x5)', () => {
      const corner: Position = { x: 0, y: 0 };
      expect(isValidKnightMove(corner, { x: 1, y: 2 }, 5)).toBe(true);
      expect(isValidKnightMove(corner, { x: 2, y: 1 }, 5)).toBe(true);

      // Invalid from corner
      expect(isValidKnightMove(corner, { x: 2, y: 2 }, 5)).toBe(false);
      expect(isValidKnightMove(corner, { x: 0, y: 1 }, 5)).toBe(false);
    });
  });

  describe('Move Enumeration: getValidKnightMoves', () => {
    it('returns exactly 2 legal moves from corner (0,0)', () => {
      const moves = getValidKnightMoves({ x: 0, y: 0 }, 5);
      expect(moves).toHaveLength(2);
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 1, y: 2 },
          { x: 2, y: 1 },
        ])
      );
    });

    it('returns exactly 8 legal moves from center (2,2)', () => {
      const moves = getValidKnightMoves({ x: 2, y: 2 }, 5);
      expect(moves).toHaveLength(8);
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 0, y: 1 },
          { x: 0, y: 3 },
          { x: 1, y: 0 },
          { x: 1, y: 4 },
          { x: 3, y: 0 },
          { x: 3, y: 4 },
          { x: 4, y: 1 },
          { x: 4, y: 3 },
        ])
      );
    });

    it('returns exactly 4 legal moves from board edge (0,2)', () => {
      const moves = getValidKnightMoves({ x: 0, y: 2 }, 5);
      expect(moves).toHaveLength(4);
      expect(moves).toEqual(
        expect.arrayContaining([
          { x: 1, y: 0 },
          { x: 1, y: 4 },
          { x: 2, y: 1 },
          { x: 2, y: 3 },
        ])
      );
    });

    it('returns empty array for an invalid starting position', () => {
      expect(getValidKnightMoves({ x: -1, y: 0 }, 5)).toEqual([]);
      expect(getValidKnightMoves({ x: 5, y: 5 }, 5)).toEqual([]);
    });
  });

  describe('Shortest Path & BFS Distance Calculation', () => {
    it('returns path of length 1 when start equals target', () => {
      const path = findShortestPath({ x: 2, y: 2 }, { x: 2, y: 2 }, 5);
      expect(path).toEqual([{ x: 2, y: 2 }]);
      expect(getKnightDistance({ x: 2, y: 2 }, { x: 2, y: 2 }, 5)).toBe(0);
    });

    it('finds 1-move paths correctly', () => {
      const start = { x: 0, y: 0 };
      const target = { x: 1, y: 2 };
      const path = findShortestPath(start, target, 5);
      expect(path).toHaveLength(2);
      expect(path).toEqual([start, target]);
      expect(getKnightDistance(start, target, 5)).toBe(1);
    });

    it('finds 2-move paths correctly', () => {
      const start = { x: 0, y: 0 };
      const target = { x: 3, y: 3 };
      const path = findShortestPath(start, target, 5);
      expect(path).not.toBeNull();
      expect(path!.length).toBe(3); // 2 moves = 3 positions
      expect(getKnightDistance(start, target, 5)).toBe(2);
      expect(isValidPath(path!, 5)).toBe(true);
    });

    it('finds 3-move paths for the 404 Easter Egg puzzle', () => {
      const start = { x: 0, y: 0 };
      const target = { x: 4, y: 3 };
      const path = findShortestPath(start, target, 5);
      expect(path).not.toBeNull();
      expect(path!.length).toBe(4); // 3 moves = 4 positions
      expect(getKnightDistance(start, target, 5)).toBe(3);
      expect(isValidPath(path!, 5)).toBe(true);
    });

    it('returns null and -1 for out-of-bounds start or target', () => {
      expect(findShortestPath({ x: -1, y: 0 }, { x: 2, y: 2 }, 5)).toBeNull();
      expect(findShortestPath({ x: 0, y: 0 }, { x: 5, y: 5 }, 5)).toBeNull();
      expect(getKnightDistance({ x: -1, y: 0 }, { x: 2, y: 2 }, 5)).toBe(-1);
    });
  });

  describe('Path Validation: isValidPath', () => {
    it('accepts empty and single-element paths', () => {
      expect(isValidPath([], 5)).toBe(true);
      expect(isValidPath([{ x: 2, y: 2 }], 5)).toBe(true);
    });

    it('accepts valid multi-step knight paths', () => {
      const valid3MovePath: Position[] = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 4, y: 3 },
      ];
      expect(isValidPath(valid3MovePath, 5)).toBe(true);
    });

    it('rejects path containing an invalid transition', () => {
      const brokenPath: Position[] = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 2 }, // Illegal jump: (1,2) -> (2,2)
        { x: 4, y: 3 },
      ];
      expect(isValidPath(brokenPath, 5)).toBe(false);
    });

    it('rejects path containing out-of-bounds coordinates', () => {
      const oobPath: Position[] = [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: -1, y: 3 }, // Out of bounds
      ];
      expect(isValidPath(oobPath, 5)).toBe(false);
    });
  });

  describe('Preset 3-Move Puzzles for 404 Route', () => {
    it('verifies all preset puzzles require exactly 3 moves', () => {
      expect(PRESET_3_MOVE_PUZZLES.length).toBeGreaterThanOrEqual(4);

      for (const puzzle of PRESET_3_MOVE_PUZZLES) {
        expect(puzzle.minMoves).toBe(3);
        expect(puzzle.optimalPath.length).toBe(4);
        expect(isValidPath(puzzle.optimalPath, 5)).toBe(true);
        expect(getKnightDistance(puzzle.start, puzzle.target, 5)).toBe(3);
      }
    });

    it('get3MovePuzzle retrieves puzzles cyclically without throwing', () => {
      const p0 = get3MovePuzzle(0);
      const p1 = get3MovePuzzle(1);
      const pWrapped = get3MovePuzzle(PRESET_3_MOVE_PUZZLES.length);

      expect(p0).toBeDefined();
      expect(p1).toBeDefined();
      expect(pWrapped).toEqual(p0);
    });

    it('handles negative, NaN, and non-integer puzzle indices safely', () => {
      const pNeg = get3MovePuzzle(-1);
      const pNaN = get3MovePuzzle(NaN);
      const pFloat = get3MovePuzzle(2.7);

      expect(pNeg).toBeDefined();
      expect(pNaN).toBeDefined();
      expect(pFloat).toEqual(get3MovePuzzle(2));
    });
  });

  describe('Defensive Edge Cases & Unreachable Nodes', () => {
    it('gracefully handles null, undefined, and non-object inputs without crashing', () => {
      expect(isWithinBoard(null as unknown as Position, 5)).toBe(false);
      expect(isWithinBoard(undefined as unknown as Position, 5)).toBe(false);
      expect(isWithinBoard({ x: 0, y: 0 }, 0)).toBe(false);
      expect(isWithinBoard({ x: 0, y: 0 }, -5)).toBe(false);

      expect(isValidKnightMove(null as unknown as Position, { x: 0, y: 0 }, 5)).toBe(false);
      expect(isValidKnightMove({ x: 0, y: 0 }, null as unknown as Position, 5)).toBe(false);

      expect(getValidKnightMoves(null as unknown as Position, 5)).toEqual([]);
      expect(findShortestPath(null as unknown as Position, { x: 0, y: 0 }, 5)).toBeNull();
      expect(findShortestPath({ x: 0, y: 0 }, null as unknown as Position, 5)).toBeNull();

      expect(getKnightDistance(null as unknown as Position, { x: 0, y: 0 }, 5)).toBe(-1);
      expect(isValidPath(null as unknown as Position[], 5)).toBe(false);
      expect(isValidPath([null as unknown as Position], 5)).toBe(false);

      expect(posToKey(null as unknown as Position)).toBe('0,0');
      expect(keyToPos(null as unknown as string)).toEqual({ x: 0, y: 0 });
    });

    it('correctly identifies unreachable nodes on small boards (e.g. 2x2 or 3x3)', () => {
      // On a 2x2 board, no knight move is ever valid
      expect(findShortestPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 2)).toBeNull();
      expect(getKnightDistance({ x: 0, y: 0 }, { x: 1, y: 1 }, 2)).toBe(-1);

      // On a 3x3 board, the center node (1,1) cannot be reached by a knight from anywhere
      expect(findShortestPath({ x: 0, y: 0 }, { x: 1, y: 1 }, 3)).toBeNull();
      expect(getKnightDistance({ x: 0, y: 0 }, { x: 1, y: 1 }, 3)).toBe(-1);
    });
  });
});
