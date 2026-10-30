import { EraseIcon } from "./icons";
import styles from "./NumberPad.module.css";

interface NumberPadProps {
  /** How many of each digit (index 1-9) are already on the board. */
  counts: readonly number[];
  disabled: boolean;
  onEnter: (value: number) => void;
}

/** Touch-friendly digit entry that works without a hardware keyboard. */
export function NumberPad({ counts, disabled, onEnter }: NumberPadProps) {
  return (
    <div role="group" aria-label="Digit pad" className={styles.pad}>
      {Array.from({ length: 9 }, (_, i) => {
        const digit = i + 1;
        const left = 9 - counts[digit];
        return (
          <button
            key={digit}
            type="button"
            className={styles.key}
            disabled={disabled}
            data-done={left <= 0 || undefined}
            aria-label={left <= 0 ? `${digit}, all placed` : `${digit}, ${left} left`}
            // Keep focus on the board so typing and arrow keys continue to work after a tap.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onEnter(digit)}
          >
            <span className={styles.digit}>{digit}</span>
            <span className={styles.left} aria-hidden="true">
              {left > 0 ? left : ""}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className={`${styles.key} ${styles.erase}`}
        disabled={disabled}
        aria-label="Erase cell"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onEnter(0)}
      >
        <EraseIcon size={18} />
      </button>
    </div>
  );
}
