import { describe, expect, it } from "vitest";
import { InvalidBoardError } from "./errors";
import { SudokuBoard } from "./SudokuBoard";

const EMPTY = "0".repeat(81);

describe("SudokuBoard", () => {
  it("parses 81-character strings, accepting dots and whitespace", () => {
    const board = SudokuBoard.fromString("5.." + ".".repeat(72) + "\n" + "..9 ".repeat(2));
    expect(board.get(0)).toBe(5);
    expect(board.get(1)).toBe(0);
    expect(board.get(80)).toBe(9);
  });

  it("rejects malformed input", () => {
    expect(() => SudokuBoard.fromString("123")).toThrow(InvalidBoardError);
    expect(() => SudokuBoard.fromString("x".repeat(81))).toThrow(InvalidBoardError);
    expect(() => SudokuBoard.fromCells(new Array(81).fill(10))).toThrow(InvalidBoardError);
    expect(() => SudokuBoard.fromGrid([[1]])).toThrow(InvalidBoardError);
  });

  it("is immutable: with() returns a new board and leaves the original untouched", () => {
    const original = SudokuBoard.empty();
    const next = original.with(10, 7);
    expect(original.get(10)).toBe(0);
    expect(next.get(10)).toBe(7);
    expect(next).not.toBe(original);
  });

  it("returns the same instance when nothing changes", () => {
    const board = SudokuBoard.empty();
    expect(board.with(3, 0)).toBe(board);
  });

  it("rejects out-of-range writes", () => {
    const board = SudokuBoard.empty();
    expect(() => board.with(81, 1)).toThrow(InvalidBoardError);
    expect(() => board.with(-1, 1)).toThrow(InvalidBoardError);
    expect(() => board.with(0, 10)).toThrow(InvalidBoardError);
    expect(() => board.with(0, 1.5)).toThrow(InvalidBoardError);
  });

  it("counts filled, empty and per-digit cells", () => {
    const board = SudokuBoard.fromString("11" + "2" + "0".repeat(78));
    expect(board.filledCount).toBe(3);
    expect(board.emptyCount).toBe(78);
    expect(board.countOf(1)).toBe(2);
    expect(board.countOf(2)).toBe(1);
    expect(board.isFull).toBe(false);
  });

  it("round-trips through string and grid forms", () => {
    const text = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
    const board = SudokuBoard.fromString(text);
    expect(board.toString()).toBe(text);
    expect(SudokuBoard.fromGrid(board.toGrid()).equals(board)).toBe(true);
    expect(board.at(2, 3)).toBe(Number(text[2 * 9 + 3]));
    expect(board.isFull).toBe(true);
  });

  it("compares by value", () => {
    expect(SudokuBoard.fromString(EMPTY).equals(SudokuBoard.empty())).toBe(true);
    expect(SudokuBoard.empty().with(0, 1).equals(SudokuBoard.empty())).toBe(false);
  });
});
