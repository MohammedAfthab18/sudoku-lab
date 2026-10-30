import { useRef } from "react";
import { Button } from "./ui/Button";
import { PanelSection } from "./ui/PanelSection";
import styles from "./ActionBar.module.css";

interface ActionBarProps {
  /** A replay is active: board-changing actions are unavailable until it stops. */
  busy: boolean;
  confirmingClear: boolean;
  onSolve: () => void;
  onValidate: () => void;
  onReset: () => void;
  onRequestClear: () => void;
  onConfirmClear: () => void;
  onCancelClear: () => void;
}

export function ActionBar(props: ActionBarProps) {
  const { busy, confirmingClear } = props;
  const clearRef = useRef<HTMLButtonElement>(null);

  // The confirm row unmounts after either choice, so hand focus back to the button that opened it.
  const settle = (action: () => void) => () => {
    action();
    clearRef.current?.focus();
  };

  return (
    <PanelSection title="Actions" hideTitle>
      <Button variant="primary" className={styles.solve} shortcut="s" disabled={busy} onClick={props.onSolve}>
        Solve
      </Button>
      <div className={styles.row}>
        <Button shortcut="v" disabled={busy} onClick={props.onValidate}>
          Validate
        </Button>
        <Button shortcut="r" disabled={busy} onClick={props.onReset}>
          Reset
        </Button>
        <Button
          ref={clearRef}
          variant="destructive"
          disabled={busy}
          aria-expanded={confirmingClear}
          aria-controls="confirm-clear"
          onClick={props.onRequestClear}
        >
          Clear
        </Button>
      </div>
      {confirmingClear && (
        <div id="confirm-clear" className={styles.confirm} role="group" aria-label="Confirm clearing the board">
          <p className={styles.question}>Remove every digit, including clues?</p>
          <div className={styles.confirmButtons}>
            <Button small onClick={settle(props.onCancelClear)}>
              Cancel
            </Button>
            <Button small variant="destructive-solid" onClick={settle(props.onConfirmClear)}>
              Clear board
            </Button>
          </div>
        </div>
      )}
    </PanelSection>
  );
}
