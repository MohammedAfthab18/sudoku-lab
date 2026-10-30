"use client";

import { gameService } from "@/composition";
import { useGameShortcuts } from "../hooks/useGameShortcuts";
import { useSudokuGame } from "../hooks/useSudokuGame";
import { defaultStatus } from "../state/statusMessages";
import { ActionBar } from "./ActionBar";
import { AlgorithmPanel } from "./AlgorithmPanel";
import { NumberPad } from "./NumberPad";
import { PuzzlePicker } from "./PuzzlePicker";
import { StatusLine } from "./StatusLine";
import { SudokuGrid } from "./SudokuGrid";
import styles from "./SudokuWorkspace.module.css";

const testCases = gameService.listTestCases();

export function SudokuWorkspace() {
  const game = useSudokuGame();
  useGameShortcuts(game);
  const { state, view, actions } = game;

  const clues = state.givens.filledCount;
  const fallback = defaultStatus(view.board.filledCount, view.board.emptyCount);

  return (
    <div className={`container ${styles.workspace}`}>
      <section className={styles.boardColumn} aria-labelledby="page-heading">
        <header className={styles.boardHeader}>
          <h1 id="page-heading" className={styles.heading}>
            Sudoku solver
          </h1>
          <p className={styles.meta}>
            <span>{state.puzzle?.name ?? "Custom board"}</span>
            <span className={styles.metaSub}>{clues === 1 ? "1 clue" : `${clues} clues`}</span>
          </p>
        </header>
        <SudokuGrid
          cells={view.cells}
          selected={state.selected}
          conflicts={view.conflicts}
          marker={view.marker}
          readOnly={view.busy}
          editingClues={state.mode === "edit"}
          complete={view.complete}
          onSelect={actions.select}
          onEnter={actions.enter}
        />
        <NumberPad counts={view.digitCounts} disabled={view.busy} onEnter={(value) => actions.enter(value)} />
      </section>

      <aside className={styles.panel} aria-label="Controls">
        <StatusLine status={state.status} fallback={fallback} />
        <ActionBar
          busy={view.busy}
          confirmingClear={state.confirmingClear}
          onSolve={actions.solve}
          onValidate={actions.validate}
          onReset={actions.reset}
          onRequestClear={actions.requestClear}
          onConfirmClear={actions.confirmClear}
          onCancelClear={actions.cancelClear}
        />
        <PuzzlePicker
          puzzle={state.puzzle}
          testCases={testCases}
          mode={state.mode}
          busy={view.busy}
          onDifficulty={actions.loadDifficulty}
          onNextPuzzle={actions.nextPuzzle}
          onTestCase={actions.loadTestCase}
          onMode={actions.setMode}
        />
        <AlgorithmPanel state={state} marker={view.marker} actions={actions} />
      </aside>
    </div>
  );
}
