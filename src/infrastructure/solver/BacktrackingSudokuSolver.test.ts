import { describe, expect, it } from "vitest";
import { SudokuBoard } from "@/domain/SudokuBoard";
import { SudokuValidator } from "@/domain/SudokuValidator";
import { addCounts, applyEvent, countsFor, revertEvent, ZERO_COUNTS } from "@/domain/trace";
import type { CellOrder } from "@/domain/types";
import { BacktrackingSudokuSolver } from "./BacktrackingSudokuSolver";

const solver = new BacktrackingSudokuSolver();
const validator = new SudokuValidator();

const EASY = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const EASY_SOLUTION = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
// Arto Inkala's 2012 puzzle, widely cited as very hard for brute force.
const HARD = "800000000003600000070090200050007000000045700000100030001000068008500010090000400";

function expectValidSolution(clues: SudokuBoard, solution: SudokuBoard) {
  expect(solution.isFull).toBe(true);
  expect(validator.isSolved(solution)).toBe(true);
  for (let i = 0; i < 81; i++) {
    if (clues.get(i) !== 0) expect(solution.get(i)).toBe(clues.get(i));
  }
}

describe("BacktrackingSudokuSolver.solve", () => {
  it("solves the classic example to its known solution", () => {
    const result = solver.solve(SudokuBoard.fromString(EASY));
    expect(result.status).toBe("solved");
    if (result.status === "solved") expect(result.solution.toString()).toBe(EASY_SOLUTION);
  });

  it("solves a very hard puzzle quickly and correctly", () => {
    const clues = SudokuBoard.fromString(HARD);
    const result = solver.solve(clues);
    expect(result.status).toBe("solved");
    if (result.status === "solved") {
      expectValidSolution(clues, result.solution);
      expect(result.stats.durationMs).toBeLessThan(2000);
    }
  });

  it.each<CellOrder>(["first-empty", "fewest-candidates"])("solves with %s ordering", (cellOrder) => {
    const clues = SudokuBoard.fromString(EASY);
    const result = solver.solve(clues, { cellOrder });
    expect(result.status).toBe("solved");
    if (result.status === "solved") expectValidSolution(clues, result.solution);
  });

  it("does not mutate the input board", () => {
    const clues = SudokuBoard.fromString(EASY);
    const before = clues.toString();
    solver.solve(clues);
    expect(clues.toString()).toBe(before);
  });

  it("fills an empty board with a valid grid", () => {
    const result = solver.solve(SudokuBoard.empty());
    expect(result.status).toBe("solved");
    if (result.status === "solved") expectValidSolution(SudokuBoard.empty(), result.solution);
  });

  it("returns an already-complete valid board unchanged", () => {
    const full = SudokuBoard.fromString(EASY_SOLUTION);
    const result = solver.solve(full);
    expect(result.status).toBe("solved");
    if (result.status === "solved") {
      expect(result.solution.equals(full)).toBe(true);
      expect(result.stats.assignments).toBe(0);
    }
  });

  it("reports unsolvable when a cell has no legal digit even though nothing repeats", () => {
    const board = SudokuBoard.fromString("123456780000000009" + "0".repeat(63));
    expect(validator.isConsistent(board)).toBe(true);
    expect(solver.solve(board).status).toBe("unsolvable");
  });

  it("reports unsolvable when a wrong entry only fails deep in the search", () => {
    // The puzzle has one solution, so any other consistent digit in an empty cell is a dead end,
    // but not one that shows up as a direct row/column/box repeat.
    const clues = SudokuBoard.fromString(EASY);
    const solution = SudokuBoard.fromString(EASY_SOLUTION);
    let tested = 0;
    for (let i = 0; i < 81 && tested < 5; i++) {
      if (clues.get(i) !== 0) continue;
      const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(
        (d) => d !== solution.get(i) && validator.isConsistent(clues.with(i, d)),
      );
      if (wrong === undefined) continue;
      const result = solver.solve(clues.with(i, wrong));
      expect(result.status).toBe("unsolvable");
      expect(result.stats.recursiveCalls).toBeGreaterThan(1);
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  });

  it("rejects boards with repeated digits and names the cells", () => {
    const board = SudokuBoard.empty().with(0, 5).with(1, 5);
    const result = solver.solve(board);
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") expect([...result.conflicts].sort((a, b) => a - b)).toEqual([0, 1]);
  });

  it("stops at the call limit instead of running forever", () => {
    const result = solver.solve(SudokuBoard.fromString(HARD), { cellOrder: "first-empty", maxCalls: 50 });
    expect(result.status).toBe("limit-reached");
    expect(result.stats.recursiveCalls).toBeLessThanOrEqual(51);
  });

  it("keeps its counters consistent: every placement is either kept or undone", () => {
    const result = solver.solve(SudokuBoard.fromString(HARD));
    expect(result.status).toBe("solved");
    if (result.status === "solved") {
      const kept = SudokuBoard.fromString(HARD).emptyCount;
      expect(result.stats.assignments - result.stats.backtracks).toBe(kept);
    }
  });
});

describe("BacktrackingSudokuSolver.trace", () => {
  const board = SudokuBoard.fromString(HARD);
  const { events, result } = solver.trace(board);

  it("agrees with solve()", () => {
    const direct = solver.solve(board);
    expect(result.status).toBe("solved");
    if (result.status === "solved" && direct.status === "solved") {
      expect(result.solution.equals(direct.solution)).toBe(true);
      expect(result.stats.recursiveCalls).toBe(direct.stats.recursiveCalls);
      expect(result.stats.backtracks).toBe(direct.stats.backtracks);
    }
  });

  it("replaying events forward reproduces the solution", () => {
    const final = events.reduce(applyEvent, board);
    expect(result.status === "solved" && final.equals(result.solution)).toBe(true);
  });

  it("replaying events backward restores the original board exactly", () => {
    const final = events.reduce(applyEvent, board);
    const restored = [...events].reverse().reduce(revertEvent, final);
    expect(restored.equals(board)).toBe(true);
  });

  it("stepping forward then back at every position is lossless", () => {
    let current = board;
    for (const event of events.slice(0, 300)) {
      const next = applyEvent(current, event);
      expect(revertEvent(next, event).equals(current)).toBe(true);
      current = next;
    }
  });

  it("derives the same counters from events as the solver reports", () => {
    const counts = events.map(countsFor).reduce((a, b) => addCounts(a, b), ZERO_COUNTS);
    expect(counts.recursiveCalls).toBe(result.stats.recursiveCalls);
    expect(counts.assignments).toBe(result.stats.assignments);
    expect(counts.backtracks).toBe(result.stats.backtracks);
  });

  it("ends with a solved event and never lists an illegal candidate", () => {
    expect(events.at(-1)?.type).toBe("solved");
    let current = board;
    for (const event of events) {
      if (event.type === "select") {
        for (const digit of event.candidates) {
          const trial = current.with(event.index, digit);
          expect(validator.isConsistent(trial)).toBe(true);
        }
      }
      current = applyEvent(current, event);
    }
  });

  it("records a dead end for the no-candidate demo", () => {
    const demo = SudokuBoard.fromString("123456780000000009" + "0".repeat(63));
    const traced = solver.trace(demo);
    expect(traced.result.status).toBe("unsolvable");
    expect(traced.events.some((e) => e.type === "dead-end")).toBe(true);
  });

  it("caps recording and reports limit-reached", () => {
    const capped = solver.trace(board, { cellOrder: "first-empty", maxEvents: 25 });
    expect(capped.events).toHaveLength(25);
    expect(capped.result.status).toBe("limit-reached");
  });
});
