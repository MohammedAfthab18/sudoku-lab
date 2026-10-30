import type { TraceOutcome, SolveOutcome, ValidationReport } from "@/application/outcomes";
import type { SudokuGameService } from "@/application/SudokuGameService";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { CELL_COUNT, cellLabel } from "@/domain/geometry";
import {
  ZERO_COUNTS,
  addCounts,
  applyEvent,
  countsFor,
  revertEvent,
  type TraceCounts,
} from "@/domain/trace";
import type { CellOrder, Puzzle, SearchEvent, SolveStats } from "@/domain/types";
import {
  TRACE_RUNNING_STATUS,
  solveStatus,
  traceFinishedStatus,
  validateStatus,
  type Status,
} from "./statusMessages";

export type Mode = "play" | "edit";
export type PlaybackSpeed = "slow" | "normal" | "fast" | "turbo";

export interface TracePlayback {
  readonly events: readonly SearchEvent[];
  /** Number of events applied so far. */
  readonly cursor: number;
  /** The board before any event was applied (clues plus the player's entries). */
  readonly base: SudokuBoard;
  /** The board after `cursor` events. */
  readonly board: SudokuBoard;
  readonly counts: TraceCounts;
  readonly playing: boolean;
  /** False when the recording hit its cap before the search ended. */
  readonly complete: boolean;
  readonly solvable: boolean;
}

export interface GameState {
  readonly puzzle: Puzzle | null;
  readonly givens: SudokuBoard;
  /** Values the player typed into non-clue cells. */
  readonly entries: SudokuBoard;
  /** Full solution produced by the Solve action, shown as an overlay. */
  readonly solved: SudokuBoard | null;
  readonly stats: SolveStats | null;
  readonly selected: number | null;
  readonly mode: Mode;
  readonly status: Status | null;
  readonly confirmingClear: boolean;
  readonly visualize: boolean;
  readonly cellOrder: CellOrder;
  readonly speed: PlaybackSpeed;
  readonly trace: TracePlayback | null;
}

export type GameAction =
  | { type: "select"; index: number | null }
  | { type: "enter"; value: number; index?: number }
  | { type: "set-mode"; mode: Mode }
  | { type: "load-puzzle"; puzzle: Puzzle }
  | { type: "reset" }
  | { type: "request-clear" }
  | { type: "confirm-clear" }
  | { type: "cancel-clear" }
  | { type: "solve-finished"; outcome: SolveOutcome }
  | { type: "validate-finished"; report: ValidationReport }
  | { type: "operation-failed"; message: string }
  | { type: "set-visualize"; on: boolean }
  | { type: "set-cell-order"; order: CellOrder }
  | { type: "set-speed"; speed: PlaybackSpeed }
  | { type: "trace-ready"; outcome: Extract<TraceOutcome, { status: "ready" }> }
  | { type: "trace-blocked"; status: Status }
  | { type: "trace-step"; delta: number }
  | { type: "trace-toggle-play" }
  | { type: "trace-stop" };

export function currentBoard(state: Pick<GameState, "givens" | "entries">): SudokuBoard {
  let board = state.givens;
  for (let i = 0; i < CELL_COUNT; i++) {
    if (board.isEmptyAt(i) && !state.entries.isEmptyAt(i)) board = board.with(i, state.entries.get(i));
  }
  return board;
}

export function createInitialState(service: SudokuGameService): GameState {
  const puzzle = service.listPuzzles("easy")[0];
  return {
    puzzle,
    givens: service.boardFromPuzzle(puzzle),
    entries: SudokuBoard.empty(),
    solved: null,
    stats: null,
    selected: null,
    mode: "play",
    status: null,
    confirmingClear: false,
    visualize: false,
    cellOrder: "fewest-candidates",
    speed: "normal",
    trace: null,
  };
}

const LOCKED_STATUS: Status = {
  tone: "info",
  title: "Clue cells are locked",
  detail: "Switch to Edit clues if you want to change the puzzle itself.",
};

export function createGameReducer(service: SudokuGameService) {
  return function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case "select":
        return state.selected === action.index ? state : { ...state, selected: action.index };

      case "enter": {
        if (state.trace) return state;
        const index = action.index ?? state.selected;
        if (index === null) {
          return { ...state, status: { tone: "info", title: "Select a cell first" } };
        }
        const isClue = !state.givens.isEmptyAt(index);
        const base = { ...state, selected: index, solved: null, stats: null, confirmingClear: false };

        let givens = state.givens;
        let entries = state.entries;
        if (state.mode === "play") {
          if (isClue) return { ...state, selected: index, status: LOCKED_STATUS };
          if (action.value === 0 && state.entries.isEmptyAt(index) && !state.solved) {
            return { ...state, selected: index };
          }
          entries = entries.with(index, action.value);
        } else {
          givens = givens.with(index, action.value);
          entries = entries.with(index, 0);
        }

        const next: GameState = { ...base, givens, entries, puzzle: state.mode === "edit" ? null : state.puzzle };
        const board = currentBoard(next);
        let status: Status | null = null;
        if (action.value !== 0) {
          const units = service.conflictingUnits(board, index);
          if (units.length > 0) {
            const where = units.map((u) => `${u.kind} ${u.number}`).join(" and ");
            status = {
              tone: "warning",
              title: `${action.value} repeats in ${where}`,
              detail: `${cellLabel(index)} conflicts with another ${action.value}. Conflicting cells are marked.`,
            };
          } else if (service.isSolved(board)) {
            status = {
              tone: "success",
              title: "Puzzle complete",
              detail: "Every row, column and box has the digits 1 to 9.",
            };
          }
        }
        return { ...next, status };
      }

      case "set-mode":
        if (state.trace || state.mode === action.mode) return state;
        return {
          ...state,
          mode: action.mode,
          solved: null,
          stats: null,
          confirmingClear: false,
          status:
            action.mode === "edit"
              ? { tone: "info", title: "Editing clues", detail: "Digits you type become clues. Switch back to Play to solve by hand." }
              : null,
        };

      case "load-puzzle":
        return {
          ...state,
          puzzle: action.puzzle,
          givens: service.boardFromPuzzle(action.puzzle),
          entries: SudokuBoard.empty(),
          solved: null,
          stats: null,
          selected: null,
          mode: "play",
          status: null,
          confirmingClear: false,
          trace: null,
        };

      case "reset": {
        if (state.trace) return state;
        const hasWork = state.entries.filledCount > 0 || state.solved !== null;
        return {
          ...state,
          entries: SudokuBoard.empty(),
          solved: null,
          stats: null,
          confirmingClear: false,
          status: hasWork
            ? { tone: "neutral", title: "Entries cleared", detail: "Back to the original clues." }
            : { tone: "info", title: "Nothing to reset", detail: "You haven't added any entries." },
        };
      }

      case "request-clear": {
        if (state.trace) return state;
        const empty = state.givens.filledCount === 0 && state.entries.filledCount === 0;
        if (empty) {
          return { ...state, status: { tone: "info", title: "Board is already empty" } };
        }
        return { ...state, confirmingClear: true };
      }

      case "cancel-clear":
        return state.confirmingClear ? { ...state, confirmingClear: false } : state;

      case "confirm-clear":
        return {
          ...state,
          puzzle: null,
          givens: SudokuBoard.empty(),
          entries: SudokuBoard.empty(),
          solved: null,
          stats: null,
          selected: null,
          mode: "edit",
          confirmingClear: false,
          status: { tone: "neutral", title: "Board cleared", detail: "Type clues to enter your own puzzle." },
        };

      case "solve-finished": {
        const { outcome } = action;
        const hasEntries = state.entries.filledCount > 0;
        const status = solveStatus(outcome, hasEntries);
        if (outcome.status === "solved") {
          return { ...state, solved: outcome.solution, stats: outcome.stats, status };
        }
        if (outcome.status === "unsolvable" || outcome.status === "limit-reached") {
          return { ...state, solved: null, stats: outcome.stats, status };
        }
        return { ...state, status };
      }

      case "validate-finished":
        return { ...state, status: validateStatus(action.report) };

      case "operation-failed":
        return {
          ...state,
          status: { tone: "error", title: "Something went wrong", detail: action.message },
        };

      case "set-visualize":
        if (action.on === state.visualize) return state;
        return {
          ...state,
          visualize: action.on,
          trace: null,
          confirmingClear: false,
          status: state.trace ? null : state.status,
        };

      case "set-cell-order":
        return state.trace ? state : { ...state, cellOrder: action.order };

      case "set-speed":
        return { ...state, speed: action.speed };

      case "trace-ready": {
        const base = currentBoard(state);
        const { events, complete, solvable } = action.outcome;
        return {
          ...state,
          solved: null,
          stats: null,
          confirmingClear: false,
          status: TRACE_RUNNING_STATUS,
          trace: { events, cursor: 0, base, board: base, counts: ZERO_COUNTS, playing: true, complete, solvable },
        };
      }

      case "trace-blocked":
        return { ...state, status: action.status };

      case "trace-step": {
        const trace = state.trace;
        if (!trace) return state;
        const total = trace.events.length;
        const target = Math.min(total, Math.max(0, trace.cursor + action.delta));
        if (target === trace.cursor) return state;

        let { cursor, board, counts } = trace;
        while (cursor < target) {
          const event = trace.events[cursor];
          board = applyEvent(board, event);
          counts = addCounts(counts, countsFor(event));
          cursor++;
        }
        while (cursor > target) {
          cursor--;
          const event = trace.events[cursor];
          board = revertEvent(board, event);
          counts = addCounts(counts, countsFor(event), -1);
        }

        const finished = cursor === total;
        return {
          ...state,
          trace: { ...trace, cursor, board, counts, playing: trace.playing && !finished },
          status: finished
            ? traceFinishedStatus({ complete: trace.complete, solvable: trace.solvable, events: total })
            : TRACE_RUNNING_STATUS,
        };
      }

      case "trace-toggle-play": {
        const trace = state.trace;
        if (!trace) return state;
        if (!trace.playing && trace.cursor >= trace.events.length) {
          // Replay from the start once the end has been reached.
          return {
            ...state,
            status: TRACE_RUNNING_STATUS,
            trace: { ...trace, cursor: 0, board: trace.base, counts: ZERO_COUNTS, playing: true },
          };
        }
        return { ...state, trace: { ...trace, playing: !trace.playing } };
      }

      case "trace-stop":
        return { ...state, trace: null, status: null };
    }
  };
}
