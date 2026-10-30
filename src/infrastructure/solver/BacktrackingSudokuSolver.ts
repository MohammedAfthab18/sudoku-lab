import { SudokuBoard } from "@/domain/SudokuBoard";
import { SudokuValidator } from "@/domain/SudokuValidator";
import type { ITraceableSudokuSolver } from "@/domain/ISudokuSolver";
import { CELL_COUNT, SIZE, boxOf, colOf, rowOf } from "@/domain/geometry";
import type {
  CellOrder,
  SearchEvent,
  SolveOptions,
  SolveResult,
  SolveStats,
  SolveTrace,
  TraceOptions,
} from "@/domain/types";

const ALL_DIGITS_MASK = 0b1111111110; // bits 1..9
const DEFAULT_MAX_CALLS = 2_000_000;
const DEFAULT_MAX_EVENTS = 50_000;

/** Number of set bits for every possible 10-bit mask. */
const POPCOUNT = Array.from({ length: 1 << 10 }, (_, mask) => {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
});

class SearchAborted extends Error {}

/**
 * Classic recursive backtracking:
 *   1. pick an empty cell,
 *   2. try each legal digit, placing it,
 *   3. recurse on the rest of the board,
 *   4. if the recursion fails, undo the placement and try the next digit.
 *
 * Row / column / box usage is kept in bit masks so "is this digit legal here?"
 * is a couple of bitwise operations. The same search powers both `solve` and
 * `trace`; the trace simply observes it.
 */
export class BacktrackingSudokuSolver implements ITraceableSudokuSolver {
  constructor(private readonly validator: SudokuValidator = new SudokuValidator()) {}

  solve(board: SudokuBoard, options: SolveOptions = {}): SolveResult {
    return this.run(board, options).result;
  }

  trace(board: SudokuBoard, options: TraceOptions = {}): SolveTrace {
    const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
    const events: SearchEvent[] = [];
    const { result } = this.run(board, options, (event) => {
      if (events.length >= maxEvents) throw new SearchAborted();
      events.push(event);
    });
    return { events, result };
  }

  private run(
    board: SudokuBoard,
    options: SolveOptions,
    observe?: (event: SearchEvent) => void,
  ): { result: SolveResult } {
    const started = now();
    const conflicts = [...this.validator.findConflicts(board)];
    if (conflicts.length > 0) {
      return { result: { status: "invalid", conflicts, stats: emptyStats(now() - started) } };
    }

    const cellOrder: CellOrder = options.cellOrder ?? "fewest-candidates";
    const maxCalls = options.maxCalls ?? DEFAULT_MAX_CALLS;

    const cells = new Int8Array(board.toCells());
    const rows = new Array<number>(SIZE).fill(0);
    const cols = new Array<number>(SIZE).fill(0);
    const boxes = new Array<number>(SIZE).fill(0);
    for (let i = 0; i < CELL_COUNT; i++) {
      if (cells[i] !== 0) {
        const bit = 1 << cells[i];
        rows[rowOf(i)] |= bit;
        cols[colOf(i)] |= bit;
        boxes[boxOf(i)] |= bit;
      }
    }

    let recursiveCalls = 0;
    let assignments = 0;
    let backtracks = 0;

    const candidateMask = (i: number): number =>
      ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]) & ALL_DIGITS_MASK;

    /** Returns the next cell and its legal digits, or null when the board is full. */
    const pickCell = (): { index: number; mask: number } | null => {
      let best: { index: number; mask: number } | null = null;
      let bestCount = 10;
      for (let i = 0; i < CELL_COUNT; i++) {
        if (cells[i] !== 0) continue;
        const mask = candidateMask(i);
        if (cellOrder === "first-empty") return { index: i, mask };
        const count = POPCOUNT[mask];
        if (count < bestCount) {
          best = { index: i, mask };
          bestCount = count;
          if (count <= 1) break; // cannot do better than 0 or 1
        }
      }
      return best;
    };

    const search = (depth: number): boolean => {
      recursiveCalls++;
      if (recursiveCalls > maxCalls) throw new SearchAborted();

      const pick = pickCell();
      if (pick === null) {
        observe?.({ type: "solved", depth });
        return true;
      }
      const { index, mask } = pick;
      if (mask === 0) {
        observe?.({ type: "dead-end", index, depth });
        return false;
      }
      if (observe) {
        observe({ type: "select", index, candidates: digitsOf(mask), depth });
      }

      const r = rowOf(index);
      const c = colOf(index);
      const b = boxOf(index);
      for (let digit = 1; digit <= SIZE; digit++) {
        const bit = 1 << digit;
        if ((mask & bit) === 0) continue;

        cells[index] = digit;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[b] |= bit;
        assignments++;
        observe?.({ type: "assign", index, value: digit, depth });

        if (search(depth + 1)) return true;

        cells[index] = 0;
        rows[r] &= ~bit;
        cols[c] &= ~bit;
        boxes[b] &= ~bit;
        backtracks++;
        observe?.({ type: "backtrack", index, value: digit, depth });
      }
      return false;
    };

    const stats = (): SolveStats => ({
      recursiveCalls,
      assignments,
      backtracks,
      durationMs: now() - started,
    });

    try {
      const solved = search(0);
      if (solved) {
        return { result: { status: "solved", solution: SudokuBoard.fromCells(Array.from(cells)), stats: stats() } };
      }
      return { result: { status: "unsolvable", stats: stats() } };
    } catch (error) {
      if (error instanceof SearchAborted) {
        return { result: { status: "limit-reached", stats: stats() } };
      }
      throw error;
    }
  }
}

function digitsOf(mask: number): number[] {
  const digits: number[] = [];
  for (let d = 1; d <= SIZE; d++) if (mask & (1 << d)) digits.push(d);
  return digits;
}

function emptyStats(durationMs: number): SolveStats {
  return { recursiveCalls: 0, assignments: 0, backtracks: 0, durationMs };
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
