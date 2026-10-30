import { describe, expect, it } from "vitest";
import { gameService } from "@/composition";
import { SudokuBoard } from "@/domain/SudokuBoard";
import type { Difficulty } from "@/domain/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

describe("puzzle library", () => {
  it("offers three puzzles per difficulty", () => {
    for (const d of DIFFICULTIES) expect(gameService.listPuzzles(d)).toHaveLength(3);
  });

  it.each(DIFFICULTIES.flatMap((d) => gameService.listPuzzles(d).map((p) => [p.id, p] as const)))(
    "%s is solvable and its solution is valid",
    (_id, puzzle) => {
      const clues = gameService.boardFromPuzzle(puzzle);
      const outcome = gameService.solve(clues, clues);
      expect(outcome.status).toBe("solved");
      if (outcome.status === "solved") {
        expect(gameService.isSolved(outcome.solution)).toBe(true);
        for (let i = 0; i < 81; i++) {
          if (clues.get(i)) expect(outcome.solution.get(i)).toBe(clues.get(i));
        }
      }
    },
  );

  it.each(DIFFICULTIES.flatMap((d) => gameService.listPuzzles(d).map((p) => [p.id, p] as const)))(
    "%s has exactly one solution",
    (_id, puzzle) => {
      // Any second solution differs from the first at some empty cell. So if putting any other
      // consistent digit into any empty cell makes the puzzle unsolvable, the solution is unique.
      const clues = gameService.boardFromPuzzle(puzzle);
      const first = gameService.solve(clues, clues);
      if (first.status !== "solved") throw new Error("expected solved");
      for (let i = 0; i < 81; i++) {
        if (clues.get(i) !== 0) continue;
        for (let digit = 1; digit <= 9; digit++) {
          if (digit === first.solution.get(i)) continue;
          const trial = clues.with(i, digit);
          if (gameService.findConflicts(trial).size > 0) continue;
          expect(gameService.solve(clues, trial).status, `cell ${i} = ${digit}`).toBe("unsolvable");
        }
      }
    },
    60_000,
  );

  it("cycles to the next puzzle in a category and wraps", () => {
    const [a, b, c] = gameService.listPuzzles("easy");
    expect(gameService.nextPuzzle(a)).toBe(b);
    expect(gameService.nextPuzzle(c)).toBe(a);
  });

  it("ships demo cases for the no-solution and conflict states", () => {
    const [noSolution, conflict] = gameService.listTestCases();
    const nsBoard = gameService.boardFromPuzzle(noSolution);
    const cBoard = gameService.boardFromPuzzle(conflict);
    expect(gameService.solve(nsBoard, nsBoard).status).toBe("unsolvable");
    expect(gameService.solve(cBoard, cBoard).status).toBe("invalid");
  });
});

describe("SudokuGameService.solve", () => {
  const easy = gameService.boardFromPuzzle(gameService.listPuzzles("easy")[0]);

  it("reports an empty board", () => {
    expect(gameService.solve(SudokuBoard.empty(), SudokuBoard.empty()).status).toBe("empty");
  });

  it("reports an already-solved board", () => {
    const outcome = gameService.solve(easy, easy);
    const solved = outcome.status === "solved" ? outcome.solution : easy;
    expect(gameService.solve(solved, solved).status).toBe("already-solved");
  });

  it("blames the user's entries when the clues alone are solvable", () => {
    const outcome = gameService.solve(easy, easy);
    if (outcome.status !== "solved") throw new Error("expected solved");
    const emptyCell = [...Array(81).keys()].find((i) => easy.get(i) === 0)!;
    const solvedDigit = outcome.solution.get(emptyCell);
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter((d) => d !== solvedDigit)
      .find((d) => gameService.findConflicts(easy.with(emptyCell, d)).size === 0)!;
    const withWrongEntry = easy.with(emptyCell, wrongDigit);
    const result = gameService.solve(easy, withWrongEntry);
    expect(result.status).toBe("unsolvable");
    if (result.status === "unsolvable") expect(result.entriesAreCause).toBe(true);
  });

  it("does not blame entries when there are none", () => {
    const board = SudokuBoard.fromString("123456780000000009" + "0".repeat(63));
    const result = gameService.solve(board, board);
    expect(result.status === "unsolvable" && result.entriesAreCause).toBe(false);
  });
});

describe("SudokuGameService.validate", () => {
  const easy = gameService.boardFromPuzzle(gameService.listPuzzles("easy")[0]);

  it("covers every report status", () => {
    expect(gameService.validate(SudokuBoard.empty()).status).toBe("empty");
    expect(gameService.validate(SudokuBoard.empty().with(0, 5).with(1, 5)).status).toBe("conflicts");
    expect(gameService.validate(easy)).toMatchObject({ status: "solvable", remaining: easy.emptyCount });
    expect(gameService.validate(gameService.boardFromPuzzle(gameService.listTestCases()[0])).status).toBe(
      "unsolvable",
    );
    const outcome = gameService.solve(easy, easy);
    if (outcome.status !== "solved") throw new Error("expected solved");
    expect(gameService.validate(outcome.solution).status).toBe("solved");
  });

  it("flags a full board that repeats a digit", () => {
    const outcome = gameService.solve(easy, easy);
    if (outcome.status !== "solved") throw new Error("expected solved");
    const broken = outcome.solution.with(0, (outcome.solution.get(0) % 9) + 1);
    expect(gameService.validate(broken)).toMatchObject({ status: "conflicts", complete: true });
  });
});

describe("SudokuGameService.trace", () => {
  it("returns replayable events for a solvable board", () => {
    const board = gameService.boardFromPuzzle(gameService.listPuzzles("medium")[0]);
    const trace = gameService.trace(board);
    expect(trace.status).toBe("ready");
    if (trace.status === "ready") {
      expect(trace.complete).toBe(true);
      expect(trace.solvable).toBe(true);
      expect(trace.events.length).toBeGreaterThan(0);
    }
  });

  it("refuses to trace empty, conflicting or finished boards", () => {
    expect(gameService.trace(SudokuBoard.empty()).status).toBe("empty");
    expect(gameService.trace(SudokuBoard.empty().with(0, 1).with(1, 1)).status).toBe("invalid");
    const board = gameService.boardFromPuzzle(gameService.listPuzzles("easy")[0]);
    const solved = gameService.solve(board, board);
    if (solved.status !== "solved") throw new Error("expected solved");
    expect(gameService.trace(solved.solution).status).toBe("already-solved");
  });

  it("describes where a placed digit repeats", () => {
    const board = SudokuBoard.empty().with(0, 5).with(2, 5);
    expect(gameService.conflictingUnits(board, 2)).toEqual([
      { kind: "row", number: 1 },
      { kind: "box", number: 1 },
    ]);
  });
});
