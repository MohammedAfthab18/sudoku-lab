import type { SudokuBoard } from "./SudokuBoard";
import type { SearchEvent } from "./types";

export interface TraceCounts {
  readonly recursiveCalls: number;
  readonly assignments: number;
  readonly backtracks: number;
}

export const ZERO_COUNTS: TraceCounts = { recursiveCalls: 0, assignments: 0, backtracks: 0 };

/** Board after applying `event` going forward. */
export function applyEvent(board: SudokuBoard, event: SearchEvent): SudokuBoard {
  if (event.type === "assign") return board.with(event.index, event.value);
  if (event.type === "backtrack") return board.with(event.index, 0);
  return board;
}

/** Board after undoing `event` (stepping backwards). Exact inverse of `applyEvent`. */
export function revertEvent(board: SudokuBoard, event: SearchEvent): SudokuBoard {
  if (event.type === "assign") return board.with(event.index, 0);
  if (event.type === "backtrack") return board.with(event.index, event.value);
  return board;
}

/** Counter contribution of a single event. */
export function countsFor(event: SearchEvent): TraceCounts {
  switch (event.type) {
    case "select":
    case "dead-end":
    case "solved":
      return { recursiveCalls: 1, assignments: 0, backtracks: 0 };
    case "assign":
      return { recursiveCalls: 0, assignments: 1, backtracks: 0 };
    case "backtrack":
      return { recursiveCalls: 0, assignments: 0, backtracks: 1 };
  }
}

export function addCounts(a: TraceCounts, b: TraceCounts, sign: 1 | -1 = 1): TraceCounts {
  return {
    recursiveCalls: a.recursiveCalls + sign * b.recursiveCalls,
    assignments: a.assignments + sign * b.assignments,
    backtracks: a.backtracks + sign * b.backtracks,
  };
}
