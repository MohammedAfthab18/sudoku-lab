import type { Status } from "../state/statusMessages";
import { StatusIcon } from "./icons";
import styles from "./StatusLine.module.css";

interface StatusLineProps {
  /** Result of the last action. Announced to screen readers. */
  status: Status | null;
  /** Shown when there is no result to report. Not announced. */
  fallback: Status;
}

export function StatusLine({ status, fallback }: StatusLineProps) {
  const shown = status ?? fallback;
  return (
    <div className={styles.status} data-tone={shown.tone}>
      <span className={styles.mark}>
        <StatusIcon tone={shown.tone} size={18} />
      </span>
      <div className={styles.text} aria-hidden="true">
        <p className={styles.title}>{shown.title}</p>
        {shown.detail && <p className={styles.detail}>{shown.detail}</p>}
      </div>
      {/* One persistent live region: only real results are announced, not the running tally. */}
      <p className="srOnly" role="status">
        {status ? `${status.title}. ${status.detail ?? ""}` : ""}
      </p>
    </div>
  );
}
