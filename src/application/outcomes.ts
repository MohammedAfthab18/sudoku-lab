import type { SudokuBoard } from "@/domain/SudokuBoard";
import type { SearchEvent, SolveStats } from "@/domain/types";

export type SolveOutcome =
  | { readonly status: "empty" }
  | { readonly status: "already-solved" }
  | { readonly status: "invalid"; readonly conflicts: readonly number[] }
  | { readonly status: "solved"; readonly solution: SudokuBoard; readonly stats: SolveStats }
  | {
      readonly status: "unsolvable";
      readonly stats: SolveStats;
      /** True when the original clues are solvable but the user's entries rule every solution out. */
      readonly entriesAreCause: boolean;
    }
  | { readonly status: "limit-reached"; readonly stats: SolveStats };

export type ValidationReport =
  | { readonly status: "empty" }
  | { readonly status: "conflicts"; readonly cells: readonly number[]; readonly complete: boolean }
  | { readonly status: "solved" }
  | { readonly status: "solvable"; readonly remaining: number }
  | { readonly status: "unsolvable"; readonly remaining: number }
  | { readonly status: "inconclusive"; readonly remaining: number };

export type TraceOutcome =
  | { readonly status: "empty" }
  | { readonly status: "already-solved" }
  | { readonly status: "invalid"; readonly conflicts: readonly number[] }
  | {
      readonly status: "ready";
      readonly events: readonly SearchEvent[];
      /** False when the recording hit its size cap before the search finished. */
      readonly complete: boolean;
      readonly finalStats: SolveStats;
      readonly solvable: boolean;
    };
