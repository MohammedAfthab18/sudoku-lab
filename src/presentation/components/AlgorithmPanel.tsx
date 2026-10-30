import { cellLabel } from "@/domain/geometry";
import type { CellOrder, SolveStats } from "@/domain/types";
import { recentEvents, type TraceMarker } from "../state/boardView";
import type { GameState, PlaybackSpeed } from "../state/gameState";
import { formatCount, formatDuration } from "../state/format";
import { PLAYBACK_SPEEDS } from "../hooks/useSudokuGame";
import { EventLog, LOG_ROWS } from "./EventLog";
import { Button } from "./ui/Button";
import { PanelSection } from "./ui/PanelSection";
import { SegmentedControl } from "./ui/SegmentedControl";
import { Switch } from "./ui/Switch";
import { PauseIcon, PlayIcon, StepBackIcon, StepForwardIcon, StopIcon } from "./icons";
import styles from "./AlgorithmPanel.module.css";

const ORDERS: ReadonlyArray<{ value: CellOrder; label: string }> = [
  { value: "fewest-candidates", label: "Fewest candidates" },
  { value: "first-empty", label: "Row by row" },
];

const SPEEDS = (Object.keys(PLAYBACK_SPEEDS) as PlaybackSpeed[]).map((value) => ({
  value,
  label: PLAYBACK_SPEEDS[value].label,
}));

interface AlgorithmPanelProps {
  state: GameState;
  marker: TraceMarker | null;
  actions: {
    setVisualize: (on: boolean) => void;
    setCellOrder: (order: CellOrder) => void;
    setSpeed: (speed: PlaybackSpeed) => void;
    startTrace: () => void;
    togglePlay: () => void;
    step: (delta: number) => void;
    stopTrace: () => void;
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Stats({ counts }: { counts: Pick<SolveStats, "recursiveCalls" | "assignments" | "backtracks"> | null }) {
  const show = (n: number | undefined) => (n === undefined ? "–" : formatCount(n));
  return (
    <dl className={styles.stats}>
      <Stat label="Recursive calls" value={show(counts?.recursiveCalls)} />
      <Stat label="Assignments" value={show(counts?.assignments)} />
      <Stat label="Backtracks" value={show(counts?.backtracks)} />
    </dl>
  );
}

export function AlgorithmPanel({ state, marker, actions }: AlgorithmPanelProps) {
  const { trace, stats, visualize } = state;
  const counts = trace ? trace.counts : stats;
  const total = trace?.events.length ?? 0;
  const finished = trace !== null && trace.cursor >= total;
  const lastEvent = trace && trace.cursor > 0 ? trace.events[trace.cursor - 1] : null;
  const depth = lastEvent && "depth" in lastEvent ? lastEvent.depth : 0;

  return (
    <PanelSection
      title="Algorithm"
      aside={<Switch label="Visualize" checked={visualize} onChange={actions.setVisualize} shortcut="a" />}
    >
      <Stats counts={counts} />
      {!trace && stats && (
        <p className={styles.time}>
          Last solve took <strong>{formatDuration(stats.durationMs)}</strong>.
        </p>
      )}

      {visualize && !trace && (
        <div className={styles.setup}>
          <SegmentedControl
            legend="Next cell to fill"
            options={ORDERS}
            value={state.cellOrder}
            onChange={actions.setCellOrder}
          />
          <Button icon={<PlayIcon />} onClick={actions.startTrace} className={styles.start}>
            Start visualization
          </Button>
          <p className={styles.hint}>Replays the exact search Solve runs, one event at a time.</p>
        </div>
      )}

      {trace && (
        <div className={styles.player}>
          <div role="group" aria-label="Playback" className={styles.toolbar}>
            <Button variant="secondary" iconOnly aria-label="Step back" shortcut="," disabled={trace.cursor === 0} onClick={() => actions.step(-1)} icon={<StepBackIcon />} />
            <Button
              variant="primary"
              className={styles.play}
              shortcut="Space"
              onClick={actions.togglePlay}
              icon={trace.playing ? <PauseIcon /> : <PlayIcon />}
            >
              {trace.playing ? "Pause" : finished ? "Replay" : "Play"}
            </Button>
            <Button variant="secondary" iconOnly aria-label="Step forward" shortcut="." disabled={finished} onClick={() => actions.step(1)} icon={<StepForwardIcon />} />
            <Button variant="tertiary" iconOnly aria-label="Stop and return to the board" onClick={actions.stopTrace} icon={<StopIcon />} />
          </div>

          <SegmentedControl legend="Speed" hideLegend options={SPEEDS} value={state.speed} onChange={actions.setSpeed} />

          <div className={styles.position}>
            <progress value={trace.cursor} max={total} aria-label="Replay progress" className={styles.progress} />
            <dl className={styles.where}>
              <div>
                <dt>Step</dt>
                <dd>
                  {formatCount(trace.cursor)} / {formatCount(total)}
                </dd>
              </div>
              <div>
                <dt>Depth</dt>
                <dd>{depth}</dd>
              </div>
              <div>
                <dt>Cell</dt>
                <dd>{marker ? cellLabel(marker.index) : "–"}</dd>
              </div>
            </dl>
          </div>

          <EventLog events={recentEvents(trace, LOG_ROWS)} />

          <ul className={styles.legend} aria-label="Cell markers">
            <li><span className={styles.swatch} data-kind="select" aria-hidden="true" />Choosing</li>
            <li><span className={styles.swatch} data-kind="assign" aria-hidden="true" />Trying</li>
            <li><span className={styles.swatch} data-kind="dead-end" aria-hidden="true" />Dead end</li>
            <li><span className={styles.swatch} data-kind="backtrack" aria-hidden="true" />Undone</li>
          </ul>
        </div>
      )}
    </PanelSection>
  );
}
