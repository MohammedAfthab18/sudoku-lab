import { cellLabel } from "@/domain/geometry";
import type { SearchEvent } from "@/domain/types";
import type { LoggedEvent } from "../state/boardView";
import styles from "./EventLog.module.css";

function describe(event: SearchEvent): { kind: string; what: string } {
  switch (event.type) {
    case "select":
      return { kind: "Pick", what: `${cellLabel(event.index)}, candidates ${event.candidates.join(" ")}` };
    case "assign":
      return { kind: "Place", what: `${event.value} at ${cellLabel(event.index)}` };
    case "dead-end":
      return { kind: "Dead end", what: `${cellLabel(event.index)} has no legal digit` };
    case "backtrack":
      return { kind: "Undo", what: `${event.value} at ${cellLabel(event.index)}` };
    case "solved":
      return { kind: "Done", what: "All cells filled" };
  }
}

export const LOG_ROWS = 8;

export function EventLog({ events }: { events: readonly LoggedEvent[] }) {
  return (
    <ol className={styles.log} aria-label="Latest search events, newest first">
      {events.length === 0 && <li className={styles.empty}>Press play or step forward to begin.</li>}
      {events.map(({ step, event }, i) => {
        const { kind, what } = describe(event);
        return (
          <li key={step} className={styles.item} data-type={event.type} data-latest={i === 0 || undefined}>
            <span className={styles.step}>{step}</span>
            <span className={styles.kind}>{kind}</span>
            <span className={styles.what}>{what}</span>
          </li>
        );
      })}
    </ol>
  );
}
