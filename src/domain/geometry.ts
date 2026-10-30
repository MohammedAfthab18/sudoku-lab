export const SIZE = 9;
export const BOX_SIZE = 3;
export const CELL_COUNT = SIZE * SIZE;

export const rowOf = (index: number): number => Math.floor(index / SIZE);
export const colOf = (index: number): number => index % SIZE;
export const boxOf = (index: number): number =>
  Math.floor(rowOf(index) / BOX_SIZE) * BOX_SIZE + Math.floor(colOf(index) / BOX_SIZE);
export const indexOf = (row: number, col: number): number => row * SIZE + col;

/** Human-readable cell reference, e.g. "R3C5". */
export const cellLabel = (index: number): string => `R${rowOf(index) + 1}C${colOf(index) + 1}`;

export type UnitKind = "row" | "column" | "box";

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** All 27 units (9 rows, 9 columns, 9 boxes) as arrays of cell indices. */
export const UNITS: ReadonlyArray<{ kind: UnitKind; position: number; cells: readonly number[] }> = [
  ...range(SIZE).map((r) => ({
    kind: "row" as const,
    position: r,
    cells: range(SIZE).map((c) => indexOf(r, c)),
  })),
  ...range(SIZE).map((c) => ({
    kind: "column" as const,
    position: c,
    cells: range(SIZE).map((r) => indexOf(r, c)),
  })),
  ...range(SIZE).map((b) => ({
    kind: "box" as const,
    position: b,
    cells: range(CELL_COUNT).filter((i) => boxOf(i) === b),
  })),
];

export const sharesUnit = (a: number, b: number): boolean =>
  a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));
