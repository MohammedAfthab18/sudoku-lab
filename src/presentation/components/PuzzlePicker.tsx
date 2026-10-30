import type { Difficulty, Puzzle } from "@/domain/types";
import type { Mode } from "../state/gameState";
import { Button } from "./ui/Button";
import { PanelSection } from "./ui/PanelSection";
import { SegmentedControl } from "./ui/SegmentedControl";
import { ShuffleIcon } from "./icons";
import styles from "./PuzzlePicker.module.css";

const DIFFICULTIES: ReadonlyArray<{ value: Difficulty; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "expert", label: "Expert" },
];

const MODES: ReadonlyArray<{ value: Mode; label: string }> = [
  { value: "play", label: "Play" },
  { value: "edit", label: "Edit clues" },
];

interface PuzzlePickerProps {
  puzzle: Puzzle | null;
  testCases: readonly Puzzle[];
  mode: Mode;
  busy: boolean;
  onDifficulty: (difficulty: Difficulty) => void;
  onNextPuzzle: () => void;
  onTestCase: (puzzle: Puzzle) => void;
  onMode: (mode: Mode) => void;
}

export function PuzzlePicker({
  puzzle,
  testCases,
  mode,
  busy,
  onDifficulty,
  onNextPuzzle,
  onTestCase,
  onMode,
}: PuzzlePickerProps) {
  const difficulty = puzzle && puzzle.category !== "test" ? puzzle.category : null;
  return (
    <PanelSection title="Puzzle">
      <SegmentedControl
        legend="Difficulty"
        hideLegend
        options={DIFFICULTIES}
        value={difficulty}
        onChange={onDifficulty}
        disabled={busy}
      />
      <Button icon={<ShuffleIcon />} shortcut="n" disabled={busy} onClick={onNextPuzzle} className={styles.next}>
        Next puzzle
      </Button>
      <SegmentedControl legend="Typing a digit" options={MODES} value={mode} onChange={onMode} disabled={busy} />
      <div className={styles.tests}>
        <span className={styles.testsLabel} id="test-cases-label">
          Test cases
        </span>
        <div role="group" aria-labelledby="test-cases-label" className={styles.testButtons}>
          {testCases.map((testCase) => (
            <Button key={testCase.id} variant="tertiary" small disabled={busy} onClick={() => onTestCase(testCase)}>
              {testCase.name}
            </Button>
          ))}
        </div>
      </div>
    </PanelSection>
  );
}
