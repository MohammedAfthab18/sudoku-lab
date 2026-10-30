import { LogoMark } from "./icons";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <LogoMark />
          <span className={styles.name}>Sudoku Lab</span>
          <span className={styles.subtitle}>Backtracking solver</span>
        </div>
        <div className={styles.tools}>
          <ShortcutsDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
