import { describe, expect, it } from "vitest";
import { SudokuBoard } from "./SudokuBoard";
import { SudokuValidator } from "./SudokuValidator";
import { UNITS, boxOf, cellLabel, colOf, rowOf, sharesUnit } from "./geometry";

const validator = new SudokuValidator();
const SOLVED = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

describe("geometry", () => {
  it("defines 27 units of 9 distinct cells, and every cell is in exactly 3 units", () => {
    expect(UNITS).toHaveLength(27);
    const memberships = new Array(81).fill(0);
    for (const unit of UNITS) {
      expect(new Set(unit.cells).size).toBe(9);
      unit.cells.forEach((i) => memberships[i]++);
    }
    expect(memberships.every((n) => n === 3)).toBe(true);
  });

  it("computes rows, columns, boxes and labels", () => {
    expect([rowOf(40), colOf(40), boxOf(40)]).toEqual([4, 4, 4]);
    expect(boxOf(0)).toBe(0);
    expect(boxOf(80)).toBe(8);
    expect(boxOf(27)).toBe(3);
    expect(cellLabel(0)).toBe("R1C1");
    expect(cellLabel(80)).toBe("R9C9");
  });

  it("reports shared units, excluding the cell itself", () => {
    expect(sharesUnit(0, 8)).toBe(true); // row
    expect(sharesUnit(0, 72)).toBe(true); // column
    expect(sharesUnit(0, 20)).toBe(true); // box
    expect(sharesUnit(0, 40)).toBe(false);
    expect(sharesUnit(0, 0)).toBe(false);
  });
});

describe("SudokuValidator", () => {
  it("finds no conflicts on an empty or solved board", () => {
    expect(validator.findConflicts(SudokuBoard.empty()).size).toBe(0);
    expect(validator.isSolved(SudokuBoard.fromString(SOLVED))).toBe(true);
  });

  it("detects duplicates in a row, a column and a box", () => {
    const row = SudokuBoard.empty().with(0, 5).with(8, 5);
    expect([...validator.findConflicts(row)].sort((a, b) => a - b)).toEqual([0, 8]);

    const col = SudokuBoard.empty().with(0, 3).with(72, 3);
    expect([...validator.findConflicts(col)].sort((a, b) => a - b)).toEqual([0, 72]);

    const box = SudokuBoard.empty().with(0, 9).with(20, 9);
    expect([...validator.findConflicts(box)].sort((a, b) => a - b)).toEqual([0, 20]);
  });

  it("does not flag the same digit in unrelated cells", () => {
    const board = SudokuBoard.empty().with(0, 4).with(40, 4);
    expect(validator.isConsistent(board)).toBe(true);
  });

  it("names the units that contain a repeat", () => {
    const board = SudokuBoard.empty().with(0, 5).with(2, 5); // same row and same box
    expect(validator.conflictingUnits(board, 0)).toEqual(["row", "box"]);
    expect(validator.conflictingUnits(board, 40)).toEqual([]);
    expect(validator.unitNumber("row", 0)).toBe(1);
  });

  it("does not call a full board with a repeat solved", () => {
    const broken = SudokuBoard.fromString(SOLVED).with(0, 3);
    expect(broken.isFull).toBe(true);
    expect(validator.isSolved(broken)).toBe(false);
  });

  it("does not call a consistent partial board solved", () => {
    expect(validator.isSolved(SudokuBoard.empty().with(0, 1))).toBe(false);
  });
});
