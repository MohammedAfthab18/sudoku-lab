import { useRef, type KeyboardEvent } from "react";
import { SIZE, indexOf, rowOf, colOf, sharesUnit } from "@/domain/geometry";
import type { CellView, TraceMarker } from "../state/boardView";
import { SudokuCell } from "./SudokuCell";
import styles from "./SudokuGrid.module.css";

interface SudokuGridProps {
  cells: readonly CellView[];
  selected: number | null;
  conflicts: ReadonlySet<number>;
  marker: TraceMarker | null;
  /** True while a replay is running: navigation works, editing does not. */
  readOnly: boolean;
  /** True when clue cells are editable (Edit clues mode). */
  editingClues: boolean;
  /** True when the displayed board is a verified solution. */
  complete: boolean;
  onSelect: (index: number | null) => void;
  onEnter: (value: number, index: number) => void;
}

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export function SudokuGrid({
  cells,
  selected,
  conflicts,
  marker,
  readOnly,
  editingClues,
  complete,
  onSelect,
  onEnter,
}: SudokuGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedValue = selected === null ? 0 : cells[selected].value;

  const focusCell = (row: number, col: number) => {
    const r = Math.min(SIZE - 1, Math.max(0, row));
    const c = Math.min(SIZE - 1, Math.max(0, col));
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${indexOf(r, c)}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!cell) return;
    const index = Number(cell.dataset.index);

    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      focusCell(rowOf(index) + move[0], colOf(index) + move[1]);
      return;
    }
    if (readOnly) return;
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      onEnter(Number(event.key), index);
    } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      onEnter(0, index);
    }
  };

  return (
    <div className={styles.frame} data-complete={complete || undefined} data-editing={editingClues || undefined}>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Sudoku board"
        aria-rowcount={SIZE}
        aria-colcount={SIZE}
        aria-readonly={readOnly || undefined}
        className={styles.grid}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: SIZE }, (_, row) => (
          <div key={row} role="row" aria-rowindex={row + 1} className={styles.row}>
            {cells.slice(row * SIZE, row * SIZE + SIZE).map((cell) => {
              const isMarked = marker?.index === cell.index;
              return (
                <SudokuCell
                  key={cell.index}
                  index={cell.index}
                  value={cell.value}
                  source={cell.source}
                  tabbable={cell.index === (selected ?? 0)}
                  selected={cell.index === selected}
                  related={selected !== null && sharesUnit(selected, cell.index)}
                  matching={selectedValue !== 0 && cell.index !== selected && cell.value === selectedValue}
                  conflict={conflicts.has(cell.index)}
                  locked={cell.source === "given" && !editingClues}
                  trace={isMarked ? marker.kind : null}
                  candidates={isMarked ? marker.candidates : []}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
