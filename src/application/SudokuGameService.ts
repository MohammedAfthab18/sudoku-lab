import type { IPuzzleRepository } from "@/domain/IPuzzleRepository";
import type { ITraceableSudokuSolver } from "@/domain/ISudokuSolver";
import { SudokuBoard } from "@/domain/SudokuBoard";
import type { SudokuValidator } from "@/domain/SudokuValidator";
import type { UnitKind } from "@/domain/geometry";
import type { Difficulty, Puzzle, SolveOptions, TraceOptions } from "@/domain/types";
import type { SolveOutcome, TraceOutcome, ValidationReport } from "./outcomes";

/**
 * Use cases for the game. Depends only on domain contracts, so the solver
 * implementation can be swapped without touching the UI.
 */
export class SudokuGameService {
  constructor(
    private readonly solver: ITraceableSudokuSolver,
    private readonly validator: SudokuValidator,
    private readonly puzzles: IPuzzleRepository,
  ) {}

  // ---- Puzzles -----------------------------------------------------------

  listPuzzles(difficulty: Difficulty): readonly Puzzle[] {
    return this.puzzles.listByDifficulty(difficulty);
  }

  listTestCases(): readonly Puzzle[] {
    return this.puzzles.listTestCases();
  }

  /** The puzzle after `current` in its own category, wrapping around. */
  nextPuzzle(current: Puzzle): Puzzle {
    const siblings =
      current.category === "test" ? this.listTestCases() : this.listPuzzles(current.category);
    const position = siblings.findIndex((p) => p.id === current.id);
    return siblings[(position + 1) % siblings.length];
  }

  boardFromPuzzle(puzzle: Puzzle): SudokuBoard {
    return SudokuBoard.fromString(puzzle.clues);
  }

  // ---- Rules ---------------------------------------------------------------

  findConflicts(board: SudokuBoard): ReadonlySet<number> {
    return this.validator.findConflicts(board);
  }

  conflictingUnits(board: SudokuBoard, index: number): Array<{ kind: UnitKind; number: number }> {
    return this.validator
      .conflictingUnits(board, index)
      .map((kind) => ({ kind, number: this.validator.unitNumber(kind, index) }));
  }

  isSolved(board: SudokuBoard): boolean {
    return this.validator.isSolved(board);
  }

  // ---- Use cases -----------------------------------------------------------

  /**
   * Solve `current` (clues plus user entries). If that fails and the user has
   * entered values, check whether the clues alone are solvable so the UI can
   * say which of the two is the problem.
   */
  solve(givens: SudokuBoard, current: SudokuBoard, options?: SolveOptions): SolveOutcome {
    const early = this.precheck(current);
    if (early) return early;

    const result = this.solver.solve(current, options);
    switch (result.status) {
      case "solved":
        return { status: "solved", solution: result.solution, stats: result.stats };
      case "invalid":
        return { status: "invalid", conflicts: result.conflicts };
      case "limit-reached":
        return { status: "limit-reached", stats: result.stats };
      case "unsolvable": {
        const hasEntries = !current.equals(givens);
        const cluesAlone = hasEntries ? this.solver.solve(givens, options) : null;
        return {
          status: "unsolvable",
          stats: result.stats,
          entriesAreCause: cluesAlone?.status === "solved",
        };
      }
    }
  }

  validate(current: SudokuBoard): ValidationReport {
    if (current.filledCount === 0) return { status: "empty" };

    const conflicts = this.validator.findConflicts(current);
    if (conflicts.size > 0) {
      return { status: "conflicts", cells: [...conflicts], complete: current.isFull };
    }
    if (current.isFull) return { status: "solved" };

    const remaining = current.emptyCount;
    const result = this.solver.solve(current);
    if (result.status === "solved") return { status: "solvable", remaining };
    if (result.status === "unsolvable") return { status: "unsolvable", remaining };
    return { status: "inconclusive", remaining };
  }

  /** Record the solver's search so the UI can replay it step by step. */
  trace(current: SudokuBoard, options?: TraceOptions): TraceOutcome {
    const early = this.precheck(current);
    if (early?.status === "empty" || early?.status === "already-solved" || early?.status === "invalid") {
      return early;
    }
    const { events, result } = this.solver.trace(current, options);
    return {
      status: "ready",
      events,
      complete: result.status !== "limit-reached",
      finalStats: result.stats,
      solvable: result.status === "solved",
    };
  }

  private precheck(
    board: SudokuBoard,
  ): { status: "empty" } | { status: "already-solved" } | { status: "invalid"; conflicts: readonly number[] } | null {
    if (board.filledCount === 0) return { status: "empty" };
    const conflicts = this.validator.findConflicts(board);
    if (conflicts.size > 0) return { status: "invalid", conflicts: [...conflicts] };
    if (board.isFull) return { status: "already-solved" };
    return null;
  }
}
