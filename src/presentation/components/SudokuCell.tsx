import { colOf, rowOf } from "@/domain/geometry";
import type { CellSource, TraceMarkerKind } from "../state/boardView";
import styles from "./SudokuCell.module.css";

interface SudokuCellProps {
  index: number;
  value: number;
  source: CellSource;
  tabbable: boolean;
  selected: boolean;
  related: boolean;
  matching: boolean;
  conflict: boolean;
  /** Clue cells cannot be changed while playing. */
  locked: boolean;
  trace: TraceMarkerKind | null;
  /** Candidates shown as pencil marks while the solver is choosing a value. */
  candidates: readonly number[];
  onSelect: (index: number) => void;
}

const SOURCE_LABEL: Record<CellSource, string> = {
  empty: "empty",
  given: "clue",
  entry: "your entry",
  solved: "solved",
  search: "solver trial",
};

function describe(props: SudokuCellProps): string {
  const { index, value, source, conflict, locked, trace } = props;
  const parts = [
    `Row ${rowOf(index) + 1}, column ${colOf(index) + 1}`,
    value === 0 ? "empty" : `${SOURCE_LABEL[source]} ${value}`,
  ];
  if (conflict) parts.push("conflicts with another cell");
  if (locked) parts.push("locked");
  if (trace === "dead-end") parts.push("no legal digit");
  if (trace === "select") parts.push("solver is choosing here");
  return parts.join(", ");
}

export function SudokuCell(props: SudokuCellProps) {
  const { index, value, source, tabbable, selected, related, matching, conflict, trace, candidates, onSelect } = props;
  const row = rowOf(index);
  const col = colOf(index);

  return (
    <div
      role="gridcell"
      data-index={index}
      data-source={source}
      data-selected={selected || undefined}
      data-related={related || undefined}
      data-match={matching || undefined}
      data-conflict={conflict || undefined}
      data-trace={trace ?? undefined}
      data-box-right={col % 3 === 2 && col !== 8 ? "" : undefined}
      data-box-bottom={row % 3 === 2 && row !== 8 ? "" : undefined}
      data-last-col={col === 8 ? "" : undefined}
      data-last-row={row === 8 ? "" : undefined}
      tabIndex={tabbable ? 0 : -1}
      aria-selected={selected}
      aria-invalid={conflict || undefined}
      aria-label={describe(props)}
      className={styles.cell}
      onFocus={() => onSelect(index)}
      onClick={() => onSelect(index)}
    >
      {value !== 0 && (
        <span className={styles.digit} aria-hidden="true">
          {value}
        </span>
      )}
      {value === 0 && trace === "select" && (
        <span className={styles.candidates} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i}>{candidates.includes(i + 1) ? i + 1 : ""}</span>
          ))}
        </span>
      )}
      {value === 0 && trace === "dead-end" && (
        <span className={styles.deadMark} aria-hidden="true">
          ×
        </span>
      )}
    </div>
  );
}
