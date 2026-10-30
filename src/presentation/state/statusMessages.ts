import type { SolveOutcome, TraceOutcome, ValidationReport } from "@/application/outcomes";
import { formatCount, formatDuration, plural } from "./format";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "error";

export interface Status {
  readonly tone: StatusTone;
  readonly title: string;
  readonly detail?: string;
}

export function solveStatus(outcome: SolveOutcome, hasEntries: boolean): Status {
  switch (outcome.status) {
    case "empty":
      return { tone: "warning", title: "Nothing to solve", detail: "Load a puzzle or type some clues first." };
    case "already-solved":
      return { tone: "success", title: "Already solved", detail: "Every row, column and box is complete and valid." };
    case "invalid":
      return {
        tone: "error",
        title: "Can't solve: repeated digits",
        detail: `${plural(outcome.conflicts.length, "cell")} break the rules. Fix the highlighted cells and try again.`,
      };
    case "solved":
      return {
        tone: "success",
        title: `Solved in ${formatDuration(outcome.stats.durationMs)}`,
        detail: `${formatCount(outcome.stats.recursiveCalls)} calls, ${formatCount(outcome.stats.backtracks)} backtracks.`,
      };
    case "unsolvable":
      return {
        tone: "error",
        title: "No solution",
        detail: outcome.entriesAreCause
          ? "The original clues are solvable, so one of your entries is wrong. Reset to remove them."
          : hasEntries
            ? "No digit repeats, but the clues can't all be satisfied together. Reset and check the clues."
            : "No digit repeats, but the clues can't all be satisfied together.",
      };
    case "limit-reached":
      return {
        tone: "warning",
        title: "Search stopped early",
        detail: `Gave up after ${formatCount(outcome.stats.recursiveCalls)} calls without an answer.`,
      };
  }
}

export function validateStatus(report: ValidationReport): Status {
  switch (report.status) {
    case "empty":
      return { tone: "warning", title: "Nothing to check", detail: "The board is empty." };
    case "conflicts":
      return {
        tone: "error",
        title: report.complete ? "Board is full but invalid" : "Repeated digits found",
        detail: `${plural(report.cells.length, "cell")} repeat a digit in a row, column or box.`,
      };
    case "solved":
      return { tone: "success", title: "Valid and complete", detail: "Every row, column and box has the digits 1 to 9." };
    case "solvable":
      return {
        tone: "success",
        title: "No conflicts, and it's solvable",
        detail: `${plural(report.remaining, "cell")} left to fill.`,
      };
    case "unsolvable":
      return {
        tone: "error",
        title: "No conflicts, but no solution",
        detail: `No digit repeats, yet ${plural(report.remaining, "empty cell")} can't be filled. Something entered is wrong.`,
      };
    case "inconclusive":
      return {
        tone: "warning",
        title: "No conflicts so far",
        detail: "Couldn't confirm the puzzle is solvable within the search limit.",
      };
  }
}

export function traceBlockedStatus(outcome: Exclude<TraceOutcome, { status: "ready" }>): Status {
  switch (outcome.status) {
    case "empty":
      return { tone: "warning", title: "Nothing to visualize", detail: "Load a puzzle or type some clues first." };
    case "already-solved":
      return { tone: "success", title: "Already solved", detail: "There is no search left to show." };
    case "invalid":
      return {
        tone: "error",
        title: "Can't visualize: repeated digits",
        detail: `${plural(outcome.conflicts.length, "cell")} break the rules. Fix the highlighted cells first.`,
      };
  }
}

export const TRACE_RUNNING_STATUS: Status = {
  tone: "info",
  title: "Visualizing the search",
  detail: "Play, or step through one event at a time.",
};

export function traceFinishedStatus(args: { complete: boolean; solvable: boolean; events: number }): Status {
  if (!args.complete) {
    return {
      tone: "warning",
      title: "Recording stopped early",
      detail: `The trace is capped at ${formatCount(args.events)} events, so this run doesn't reach an answer. Try fewest-candidates ordering.`,
    };
  }
  if (!args.solvable) {
    return { tone: "error", title: "Search finished: no solution", detail: "Every branch ended in a dead end." };
  }
  return { tone: "success", title: "Search finished: solved", detail: `Replayed ${formatCount(args.events)} events.` };
}

export function defaultStatus(filled: number, empty: number): Status {
  if (filled === 0) {
    return { tone: "neutral", title: "Empty board", detail: "Type clues, or load a puzzle." };
  }
  return { tone: "neutral", title: `${plural(empty, "cell")} to fill`, detail: `${filled} of 81 filled.` };
}
