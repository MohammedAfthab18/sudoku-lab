import type { IPuzzleRepository } from "@/domain/IPuzzleRepository";
import type { Difficulty, Puzzle } from "@/domain/types";
import { PUZZLES } from "./puzzleData";

export class StaticPuzzleRepository implements IPuzzleRepository {
  constructor(private readonly puzzles: readonly Puzzle[] = PUZZLES) {}

  listByDifficulty(difficulty: Difficulty): readonly Puzzle[] {
    return this.puzzles.filter((p) => p.category === difficulty);
  }

  listTestCases(): readonly Puzzle[] {
    return this.puzzles.filter((p) => p.category === "test");
  }
}
