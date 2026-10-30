import type { SudokuBoard } from "./SudokuBoard";

/** How the solver chooses the next empty cell to fill. */
export type CellOrder = "first-empty" | "fewest-candidates";

export interface SolveStats {
  /** Number of times the recursive search function was entered. */
  readonly recursiveCalls: number;
  /** Number of digits tentatively placed. */
  readonly assignments: number;
  /** Number of placements undone. */
  readonly backtracks: number;
  readonly durationMs: number;
}

export interface SolveOptions {
  readonly cellOrder?: CellOrder;
  /** Safety valve: stop the search after this many recursive calls. */
  readonly maxCalls?: number;
}

export interface TraceOptions extends SolveOptions {
  /** Stop recording after this many events. */
  readonly maxEvents?: number;
}

export type SolveResult =
  | { readonly status: "solved"; readonly solution: SudokuBoard; readonly stats: SolveStats }
  | { readonly status: "unsolvable"; readonly stats: SolveStats }
  | { readonly status: "invalid"; readonly conflicts: readonly number[]; readonly stats: SolveStats }
  | { readonly status: "limit-reached"; readonly stats: SolveStats };

/**
 * One step of the recursive search. Each recursive call produces exactly one of
 * `select`, `dead-end` or `solved`; assignments and backtracks happen between calls.
 */
export type SearchEvent =
  | { readonly type: "select"; readonly index: number; readonly candidates: readonly number[]; readonly depth: number }
  | { readonly type: "dead-end"; readonly index: number; readonly depth: number }
  | { readonly type: "assign"; readonly index: number; readonly value: number; readonly depth: number }
  | { readonly type: "backtrack"; readonly index: number; readonly value: number; readonly depth: number }
  | { readonly type: "solved"; readonly depth: number };

export interface SolveTrace {
  readonly events: readonly SearchEvent[];
  readonly result: SolveResult;
}

export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type PuzzleCategory = Difficulty | "test";

export interface Puzzle {
  readonly id: string;
  readonly name: string;
  readonly category: PuzzleCategory;
  /** 81-character clue string, "0" for empty. */
  readonly clues: string;
}
