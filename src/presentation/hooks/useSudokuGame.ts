import { useEffect, useReducer } from "react";
import { gameService } from "@/composition";
import type { Difficulty, Puzzle } from "@/domain/types";
import { deriveCells, displayBoard, traceMarker } from "../state/boardView";
import {
  createGameReducer,
  createInitialState,
  currentBoard,
  type Mode,
  type PlaybackSpeed,
} from "../state/gameState";
import { traceBlockedStatus } from "../state/statusMessages";
import type { CellOrder } from "@/domain/types";

const reducer = createGameReducer(gameService);

/** Replay pacing. `perTick` batches events so the fastest speed stays smooth. */
export const PLAYBACK_SPEEDS: Record<PlaybackSpeed, { label: string; interval: number; perTick: number }> = {
  slow: { label: "Slow", interval: 500, perTick: 1 },
  normal: { label: "Normal", interval: 160, perTick: 1 },
  fast: { label: "Fast", interval: 40, perTick: 1 },
  turbo: { label: "Max", interval: 33, perTick: 8 },
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error. Please try again.";
}

export function useSudokuGame() {
  const [state, dispatch] = useReducer(reducer, gameService, createInitialState);

  const playing = state.trace?.playing ?? false;
  const speed = state.speed;
  useEffect(() => {
    if (!playing) return;
    const { interval, perTick } = PLAYBACK_SPEEDS[speed];
    const id = window.setInterval(() => dispatch({ type: "trace-step", delta: perTick }), interval);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const board = displayBoard(state);
  const view = {
    cells: deriveCells(state),
    board,
    conflicts: gameService.findConflicts(board),
    marker: traceMarker(state.trace),
    busy: state.trace !== null,
    complete: gameService.isSolved(board),
    /** digitCounts[d] is how many times digit d is on the board (index 0 unused). */
    digitCounts: Array.from({ length: 10 }, (_, d) => (d === 0 ? 0 : board.countOf(d))),
  };

  const attempt = (operation: () => void) => {
    try {
      operation();
    } catch (error) {
      dispatch({ type: "operation-failed", message: messageOf(error) });
    }
  };

  const loadPuzzle = (puzzle: Puzzle) => dispatch({ type: "load-puzzle", puzzle });

  const actions = {
    select: (index: number | null) => dispatch({ type: "select", index }),
    enter: (value: number, index?: number) => dispatch({ type: "enter", value, index }),
    setMode: (mode: Mode) => dispatch({ type: "set-mode", mode }),

    loadDifficulty: (difficulty: Difficulty) => loadPuzzle(gameService.listPuzzles(difficulty)[0]),
    loadTestCase: (puzzle: Puzzle) => loadPuzzle(puzzle),
    nextPuzzle: () => {
      const next = state.puzzle
        ? gameService.nextPuzzle(state.puzzle)
        : gameService.listPuzzles("easy")[0];
      loadPuzzle(next);
    },

    reset: () => dispatch({ type: "reset" }),
    requestClear: () => dispatch({ type: "request-clear" }),
    confirmClear: () => dispatch({ type: "confirm-clear" }),
    cancelClear: () => dispatch({ type: "cancel-clear" }),

    solve: () =>
      attempt(() => {
        const outcome = gameService.solve(state.givens, currentBoard(state), { cellOrder: state.cellOrder });
        dispatch({ type: "solve-finished", outcome });
      }),
    validate: () =>
      attempt(() => dispatch({ type: "validate-finished", report: gameService.validate(currentBoard(state)) })),

    setVisualize: (on: boolean) => dispatch({ type: "set-visualize", on }),
    setCellOrder: (order: CellOrder) => dispatch({ type: "set-cell-order", order }),
    setSpeed: (next: PlaybackSpeed) => dispatch({ type: "set-speed", speed: next }),
    startTrace: () =>
      attempt(() => {
        const outcome = gameService.trace(currentBoard(state), { cellOrder: state.cellOrder });
        if (outcome.status === "ready") dispatch({ type: "trace-ready", outcome });
        else dispatch({ type: "trace-blocked", status: traceBlockedStatus(outcome) });
      }),
    togglePlay: () => dispatch({ type: "trace-toggle-play" }),
    step: (delta: number) => dispatch({ type: "trace-step", delta }),
    stopTrace: () => dispatch({ type: "trace-stop" }),
  };

  return { state, view, actions };
}

export type SudokuGame = ReturnType<typeof useSudokuGame>;
