import type { Difficulty, Puzzle } from "./types";

export interface IPuzzleRepository {
  listByDifficulty(difficulty: Difficulty): readonly Puzzle[];
  listTestCases(): readonly Puzzle[];
}
