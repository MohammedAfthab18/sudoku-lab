import type { SudokuBoard } from "./SudokuBoard";
import { UNITS, type UnitKind, boxOf, colOf, rowOf } from "./geometry";

/** The single source of truth for Sudoku rules on a (possibly partial) board. */
export class SudokuValidator {
  /** Indices of every cell that shares a digit with another cell in a row, column or box. */
  findConflicts(board: SudokuBoard): ReadonlySet<number> {
    const conflicts = new Set<number>();
    for (const unit of UNITS) {
      const seen = new Map<number, number>();
      for (const index of unit.cells) {
        const value = board.get(index);
        if (value === 0) continue;
        const first = seen.get(value);
        if (first === undefined) {
          seen.set(value, index);
        } else {
          conflicts.add(first);
          conflicts.add(index);
        }
      }
    }
    return conflicts;
  }

  /** Which units (row / column / box) contain another copy of the digit at `index`. */
  conflictingUnits(board: SudokuBoard, index: number): UnitKind[] {
    const value = board.get(index);
    if (value === 0) return [];
    const kinds: UnitKind[] = [];
    for (const unit of UNITS) {
      const containsCell = unit.cells.includes(index);
      if (!containsCell) continue;
      const repeats = unit.cells.some((other) => other !== index && board.get(other) === value);
      if (repeats) kinds.push(unit.kind);
    }
    return kinds;
  }

  isConsistent(board: SudokuBoard): boolean {
    return this.findConflicts(board).size === 0;
  }

  /** A board is solved when it is full and has no repeated digits. */
  isSolved(board: SudokuBoard): boolean {
    return board.isFull && this.isConsistent(board);
  }

  /** 1-based position of the unit that contains `index`, for messages like "row 3". */
  unitNumber(kind: UnitKind, index: number): number {
    if (kind === "row") return rowOf(index) + 1;
    if (kind === "column") return colOf(index) + 1;
    return boxOf(index) + 1;
  }
}
