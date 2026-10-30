import { InvalidBoardError } from "./errors";
import { CELL_COUNT, SIZE, indexOf } from "./geometry";

/** 9×9 grid of digits, 0 meaning empty. */
export type SudokuGrid = ReadonlyArray<ReadonlyArray<number>>;

/**
 * Immutable 9×9 Sudoku board. Every "mutation" returns a new board, which keeps
 * UI state updates trivially safe and makes the solver easy to test.
 */
export class SudokuBoard {
  private constructor(private readonly cells: readonly number[]) {}

  static empty(): SudokuBoard {
    return new SudokuBoard(new Array<number>(CELL_COUNT).fill(0));
  }

  static fromCells(cells: readonly number[]): SudokuBoard {
    if (cells.length !== CELL_COUNT) {
      throw new InvalidBoardError(`A Sudoku board has ${CELL_COUNT} cells, received ${cells.length}.`);
    }
    for (const value of cells) {
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        throw new InvalidBoardError(`Cell values must be integers from 0 to 9, received ${value}.`);
      }
    }
    return new SudokuBoard([...cells]);
  }

  static fromGrid(grid: SudokuGrid): SudokuBoard {
    if (grid.length !== SIZE || grid.some((row) => row.length !== SIZE)) {
      throw new InvalidBoardError("A Sudoku grid must be 9 rows of 9 cells.");
    }
    return SudokuBoard.fromCells(grid.flat());
  }

  /** Accepts 81 characters: digits 1–9 for clues, "0" or "." for empty. Whitespace is ignored. */
  static fromString(text: string): SudokuBoard {
    const compact = text.replace(/\s+/g, "");
    if (compact.length !== CELL_COUNT || !/^[0-9.]+$/.test(compact)) {
      throw new InvalidBoardError(`Expected ${CELL_COUNT} characters of 0-9 or ".".`);
    }
    return SudokuBoard.fromCells([...compact].map((ch) => (ch === "." ? 0 : Number(ch))));
  }

  get(index: number): number {
    return this.cells[index];
  }

  at(row: number, col: number): number {
    return this.cells[indexOf(row, col)];
  }

  isEmptyAt(index: number): boolean {
    return this.cells[index] === 0;
  }

  /** Returns a new board with `value` at `index`. Returns `this` when nothing changes. */
  with(index: number, value: number): SudokuBoard {
    if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
      throw new InvalidBoardError(`Cell index out of range: ${index}.`);
    }
    if (!Number.isInteger(value) || value < 0 || value > 9) {
      throw new InvalidBoardError(`Cell values must be integers from 0 to 9, received ${value}.`);
    }
    if (this.cells[index] === value) return this;
    const next = [...this.cells];
    next[index] = value;
    return new SudokuBoard(next);
  }

  get filledCount(): number {
    return this.cells.reduce((n, v) => (v === 0 ? n : n + 1), 0);
  }

  get emptyCount(): number {
    return CELL_COUNT - this.filledCount;
  }

  get isFull(): boolean {
    return this.emptyCount === 0;
  }

  /** How many times `digit` appears on the board. */
  countOf(digit: number): number {
    return this.cells.reduce((n, v) => (v === digit ? n + 1 : n), 0);
  }

  equals(other: SudokuBoard): boolean {
    return this.cells.every((v, i) => v === other.cells[i]);
  }

  toCells(): readonly number[] {
    return this.cells;
  }

  toGrid(): number[][] {
    return Array.from({ length: SIZE }, (_, r) => this.cells.slice(r * SIZE, (r + 1) * SIZE));
  }

  toString(): string {
    return this.cells.join("");
  }
}
