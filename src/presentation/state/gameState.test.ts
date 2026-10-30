import { describe, expect, it } from "vitest";
import { gameService } from "@/composition";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { deriveCells, displayBoard, recentEvents, traceMarker, traceSolved } from "./boardView";
import { createGameReducer, createInitialState, currentBoard, type GameAction, type GameState } from "./gameState";

const reducer = createGameReducer(gameService);
const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(reducer, state);
const initial = () => createInitialState(gameService);
const firstEmpty = (s: GameState) => [...Array(81).keys()].find((i) => s.givens.isEmptyAt(i))!;
const firstClue = (s: GameState) => [...Array(81).keys()].find((i) => !s.givens.isEmptyAt(i))!;

function solveAction(s: GameState): GameAction {
  return { type: "solve-finished", outcome: gameService.solve(s.givens, currentBoard(s)) };
}

describe("entering digits", () => {
  it("writes player entries without touching clues", () => {
    const s0 = initial();
    const i = firstEmpty(s0);
    const s1 = run(s0, { type: "enter", value: 7, index: i });
    expect(s1.entries.get(i)).toBe(7);
    expect(s1.givens.equals(s0.givens)).toBe(true);
    expect(s0.entries.get(i)).toBe(0); // immutable update
  });

  it("locks clue cells in play mode and says so", () => {
    const s0 = initial();
    const i = firstClue(s0);
    const s1 = run(s0, { type: "enter", value: 9, index: i });
    expect(s1.givens.get(i)).toBe(s0.givens.get(i));
    expect(s1.entries.get(i)).toBe(0);
    expect(s1.status?.title).toMatch(/locked/i);
    const s2 = run(s0, { type: "enter", value: 0, index: i });
    expect(s2.givens.get(i)).toBe(s0.givens.get(i));
  });

  it("uses the selected cell when no index is given and asks for one otherwise", () => {
    const s0 = initial();
    const i = firstEmpty(s0);
    expect(run(s0, { type: "enter", value: 3 }).status?.title).toMatch(/select a cell/i);
    const s1 = run(s0, { type: "select", index: i }, { type: "enter", value: 3 });
    expect(s1.entries.get(i)).toBe(3);
  });

  it("warns, naming the unit, when an entry repeats a digit", () => {
    const s0 = initial();
    const clue = firstClue(s0);
    const digit = s0.givens.get(clue);
    // Find an empty cell in the same row.
    const row = Math.floor(clue / 9);
    const target = [...Array(9).keys()].map((c) => row * 9 + c).find((i) => s0.givens.isEmptyAt(i))!;
    const s1 = run(s0, { type: "enter", value: digit, index: target });
    expect(s1.status?.tone).toBe("warning");
    expect(s1.status?.title).toContain(`row ${row + 1}`);
    expect(gameService.findConflicts(currentBoard(s1)).has(target)).toBe(true);
  });

  it("erases an entry with 0", () => {
    const s0 = initial();
    const i = firstEmpty(s0);
    const s1 = run(s0, { type: "enter", value: 4, index: i }, { type: "enter", value: 0, index: i });
    expect(s1.entries.get(i)).toBe(0);
  });

  it("turns typed digits into clues in edit mode and detaches from the library puzzle", () => {
    const s0 = initial();
    const i = firstEmpty(s0);
    const s1 = run(s0, { type: "set-mode", mode: "edit" }, { type: "enter", value: 8, index: i });
    expect(s1.givens.get(i)).toBe(8);
    expect(s1.entries.get(i)).toBe(0);
    expect(s1.puzzle).toBeNull();
    const j = firstClue(s0);
    const s2 = run(s1, { type: "enter", value: 0, index: j });
    expect(s2.givens.get(j)).toBe(0);
  });

  it("announces completion only when the board is genuinely solved", () => {
    const s0 = initial();
    const outcome = gameService.solve(s0.givens, s0.givens);
    if (outcome.status !== "solved") throw new Error("expected solved");
    const empties = [...Array(81).keys()].filter((i) => s0.givens.isEmptyAt(i));
    let s = s0;
    empties.forEach((i, n) => {
      s = reducer(s, { type: "enter", value: outcome.solution.get(i), index: i });
      if (n < empties.length - 1) expect(s.status?.tone).not.toBe("success");
    });
    expect(s.status?.title).toBe("Puzzle complete");
  });
});

describe("solve, reset, clear", () => {
  it("overlays the solution and reports success only after solving", () => {
    const s0 = initial();
    expect(s0.status).toBeNull();
    const s1 = reducer(s0, solveAction(s0));
    expect(s1.status?.tone).toBe("success");
    expect(s1.solved?.isFull).toBe(true);
    const cells = deriveCells(s1);
    expect(cells.some((c) => c.source === "solved")).toBe(true);
    expect(cells.filter((c) => c.source === "given")).toHaveLength(s0.givens.filledCount);
    expect(gameService.isSolved(displayBoard(s1))).toBe(true);
  });

  it("drops the overlay as soon as the player edits", () => {
    const s0 = initial();
    const s1 = reducer(s0, solveAction(s0));
    const s2 = reducer(s1, { type: "enter", value: 5, index: firstEmpty(s0) });
    expect(s2.solved).toBeNull();
  });

  it("reports unsolvable boards without an overlay", () => {
    const s0 = run(initial(), { type: "load-puzzle", puzzle: gameService.listTestCases()[0] });
    const s1 = reducer(s0, solveAction(s0));
    expect(s1.solved).toBeNull();
    expect(s1.status?.tone).toBe("error");
    expect(s1.status?.title).toBe("No solution");
  });

  it("reports repeated digits for the conflict demo", () => {
    const s0 = run(initial(), { type: "load-puzzle", puzzle: gameService.listTestCases()[1] });
    const s1 = reducer(s0, solveAction(s0));
    expect(s1.status?.title).toMatch(/repeated digits/i);
  });

  it("reset removes entries and the overlay but keeps clues", () => {
    const s0 = initial();
    const s1 = run(s0, { type: "enter", value: 5, index: firstEmpty(s0) }, solveAction(s0), { type: "reset" });
    expect(s1.entries.filledCount).toBe(0);
    expect(s1.solved).toBeNull();
    expect(s1.givens.equals(s0.givens)).toBe(true);
  });

  it("clear needs confirmation, and cancelling keeps the board", () => {
    const s0 = initial();
    const s1 = reducer(s0, { type: "request-clear" });
    expect(s1.confirmingClear).toBe(true);
    expect(s1.givens.equals(s0.givens)).toBe(true);
    const s2 = reducer(s1, { type: "cancel-clear" });
    expect(s2.confirmingClear).toBe(false);
    expect(s2.givens.filledCount).toBeGreaterThan(0);
    const s3 = run(s1, { type: "confirm-clear" });
    expect(s3.givens.filledCount).toBe(0);
    expect(s3.mode).toBe("edit");
  });

  it("does not ask to confirm clearing an empty board", () => {
    const empty = run(initial(), { type: "request-clear" }, { type: "confirm-clear" });
    const again = reducer(empty, { type: "request-clear" });
    expect(again.confirmingClear).toBe(false);
    expect(again.status?.title).toMatch(/already empty/i);
  });
});

describe("trace playback", () => {
  function startTrace(): GameState {
    const s0 = run(initial(), { type: "load-puzzle", puzzle: gameService.listPuzzles("medium")[0] }, { type: "set-visualize", on: true });
    const outcome = gameService.trace(currentBoard(s0), { cellOrder: s0.cellOrder });
    if (outcome.status !== "ready") throw new Error("expected ready");
    return reducer(s0, { type: "trace-ready", outcome });
  }

  it("starts at the base board with zeroed counters", () => {
    const s = startTrace();
    expect(s.trace?.cursor).toBe(0);
    expect(s.trace?.counts).toEqual({ recursiveCalls: 0, assignments: 0, backtracks: 0 });
    expect(s.trace?.board.equals(currentBoard(s))).toBe(true);
  });

  it("stepping forward then back returns to exactly the same frame", () => {
    const s0 = startTrace();
    const forward = reducer(s0, { type: "trace-step", delta: 120 });
    expect(forward.trace?.cursor).toBe(120);
    const back = reducer(forward, { type: "trace-step", delta: -120 });
    expect(back.trace?.board.equals(s0.trace!.board)).toBe(true);
    expect(back.trace?.counts).toEqual(s0.trace?.counts);
  });

  it("counters at the end equal the solver's own stats and the board is solved", () => {
    const s0 = startTrace();
    const total = s0.trace!.events.length;
    const end = reducer(s0, { type: "trace-step", delta: total + 50 }); // clamps
    expect(end.trace?.cursor).toBe(total);
    expect(end.trace?.playing).toBe(false);
    expect(traceSolved(end.trace)).toBe(true);
    expect(gameService.isSolved(end.trace!.board)).toBe(true);
    const direct = gameService.solve(end.givens, currentBoard(end));
    if (direct.status !== "solved") throw new Error("expected solved");
    expect(end.trace?.counts.recursiveCalls).toBe(direct.stats.recursiveCalls);
    expect(end.trace?.counts.backtracks).toBe(direct.stats.backtracks);
    expect(end.status?.tone).toBe("success");
  });

  it("never steps below zero", () => {
    const s0 = startTrace();
    expect(reducer(s0, { type: "trace-step", delta: -5 })).toBe(s0);
  });

  it("marks the cell of the latest event and logs newest first", () => {
    const s = reducer(startTrace(), { type: "trace-step", delta: 3 });
    expect(traceMarker(s.trace)).not.toBeNull();
    const log = recentEvents(s.trace!, 10);
    expect(log.map((l) => l.step)).toEqual([3, 2, 1]);
  });

  it("is read-only while a trace is active", () => {
    const s0 = startTrace();
    const i = firstEmpty(s0);
    expect(reducer(s0, { type: "enter", value: 1, index: i })).toBe(s0);
    expect(reducer(s0, { type: "reset" })).toBe(s0);
    expect(reducer(s0, { type: "request-clear" })).toBe(s0);
  });

  it("replays from the original board after finishing", () => {
    const s0 = startTrace();
    const end = reducer(s0, { type: "trace-step", delta: s0.trace!.events.length });
    const replay = reducer(end, { type: "trace-toggle-play" });
    expect(replay.trace?.cursor).toBe(0);
    expect(replay.trace?.playing).toBe(true);
    expect(replay.trace?.board.equals(currentBoard(s0))).toBe(true);
  });

  it("stopping or switching visualization off restores the normal board", () => {
    const s0 = startTrace();
    const stepped = reducer(s0, { type: "trace-step", delta: 40 });
    const stopped = reducer(stepped, { type: "trace-stop" });
    expect(stopped.trace).toBeNull();
    expect(displayBoard(stopped).equals(currentBoard(s0))).toBe(true);
    expect(reducer(stepped, { type: "set-visualize", on: false }).trace).toBeNull();
  });

  it("reports an unsolvable search as an error, not a success", () => {
    const s0 = run(initial(), { type: "load-puzzle", puzzle: gameService.listTestCases()[0] });
    const outcome = gameService.trace(currentBoard(s0));
    if (outcome.status !== "ready") throw new Error("expected ready");
    const s1 = reducer(s0, { type: "trace-ready", outcome });
    const end = reducer(s1, { type: "trace-step", delta: s1.trace!.events.length });
    expect(end.status?.tone).toBe("error");
    expect(traceSolved(end.trace)).toBe(false);
  });
});

describe("loading puzzles", () => {
  it("replaces the board, clears entries and selection, and resets to play mode", () => {
    const s0 = run(initial(), { type: "enter", value: 5, index: 2 }, { type: "set-mode", mode: "edit" });
    const hard = gameService.listPuzzles("hard")[0];
    const s1 = reducer(s0, { type: "load-puzzle", puzzle: hard });
    expect(s1.mode).toBe("play");
    expect(s1.entries.filledCount).toBe(0);
    expect(s1.selected).toBeNull();
    expect(s1.givens.equals(SudokuBoard.fromString(hard.clues))).toBe(true);
  });
});
