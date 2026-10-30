import type { SudokuBoard } from "./SudokuBoard";
import type { SolveOptions, SolveResult, SolveTrace, TraceOptions } from "./types";

/** Anything that can solve a board. Keeps callers independent of the algorithm. */
export interface ISudokuSolver {
  solve(board: SudokuBoard, options?: SolveOptions): SolveResult;
}

/** Solvers that can also expose their search as a replayable event trace. */
export interface ITraceableSudokuSolver extends ISudokuSolver {
  trace(board: SudokuBoard, options?: TraceOptions): SolveTrace;
}
