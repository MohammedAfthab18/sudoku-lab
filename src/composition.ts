import { SudokuGameService } from "@/application/SudokuGameService";
import { SudokuValidator } from "@/domain/SudokuValidator";
import { StaticPuzzleRepository } from "@/infrastructure/puzzles/StaticPuzzleRepository";
import { BacktrackingSudokuSolver } from "@/infrastructure/solver/BacktrackingSudokuSolver";

/**
 * Composition root: the only module that knows which concrete implementations
 * back the domain contracts. The UI imports `gameService` from here.
 */
const validator = new SudokuValidator();

export const gameService = new SudokuGameService(
  new BacktrackingSudokuSolver(validator),
  validator,
  new StaticPuzzleRepository(),
);
