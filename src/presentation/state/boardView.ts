import type { SudokuBoard } from "@/domain/SudokuBoard";
import { CELL_COUNT } from "@/domain/geometry";
import type { SearchEvent } from "@/domain/types";
import { currentBoard, type GameState, type TracePlayback } from "./gameState";

export type CellSource = "empty" | "given" | "entry" | "solved" | "search";

export interface CellView {
  readonly index: number;
  readonly value: number;
  readonly source: CellSource;
}

/** True once a replay has reached its last event and that search found a solution. */
export function traceSolved(trace: TracePlayback | null): boolean {
  return !!trace && trace.complete && trace.solvable && trace.cursor === trace.events.length;
}

/** The board the player currently sees: replay frame, solver overlay, or clues plus entries. */
export function displayBoard(state: GameState): SudokuBoard {
  if (state.trace) return state.trace.board;
  return state.solved ?? currentBoard(state);
}

export function deriveCells(state: GameState): CellView[] {
  const shown = displayBoard(state);
  const searchSource: CellSource = traceSolved(state.trace) ? "solved" : "search";
  const overlaySource: CellSource = state.trace ? searchSource : "solved";

  return Array.from({ length: CELL_COUNT }, (_, index) => {
    const value = shown.get(index);
    if (value === 0) return { index, value, source: "empty" };
    if (!state.givens.isEmptyAt(index)) return { index, value, source: "given" };
    if (!state.entries.isEmptyAt(index)) return { index, value, source: "entry" };
    return { index, value, source: overlaySource };
  });
}

export type TraceMarkerKind = "select" | "assign" | "backtrack" | "dead-end";

export interface TraceMarker {
  readonly index: number;
  readonly kind: TraceMarkerKind;
  readonly candidates: readonly number[];
}

/** The cell the most recently applied event was about, if any. */
export function traceMarker(trace: TracePlayback | null): TraceMarker | null {
  if (!trace || trace.cursor === 0) return null;
  const event = trace.events[trace.cursor - 1];
  switch (event.type) {
    case "select":
      return { index: event.index, kind: "select", candidates: event.candidates };
    case "assign":
    case "backtrack":
    case "dead-end":
      return { index: event.index, kind: event.type, candidates: [] };
    case "solved":
      return null;
  }
}

export interface LoggedEvent {
  /** 1-based position in the full trace. */
  readonly step: number;
  readonly event: SearchEvent;
}

/** The latest `limit` applied events, newest first. */
export function recentEvents(trace: TracePlayback, limit: number): LoggedEvent[] {
  const logged: LoggedEvent[] = [];
  for (let i = trace.cursor - 1; i >= 0 && logged.length < limit; i--) {
    logged.push({ step: i + 1, event: trace.events[i] });
  }
  return logged;
}
