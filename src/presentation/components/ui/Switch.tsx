import { useId } from "react";
import styles from "./Switch.module.css";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  shortcut?: string;
}

export function Switch({ label, checked, onChange, shortcut }: SwitchProps) {
  const id = useId();
  return (
    <label className={styles.root} htmlFor={id}>
      <span className={styles.text}>{label}</span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        aria-keyshortcuts={shortcut?.toUpperCase()}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
