import styles from "./AlgorithmPrimer.module.css";

const STEPS = [
  "Find an empty cell. By default, the one with the fewest legal digits.",
  "Try a legal digit there: one that doesn't repeat in its row, column or box.",
  "Recurse: repeat for the next empty cell.",
  "If a cell has no legal digit, undo the last placement and try its next digit. That undo is the backtrack.",
];

const LAYERS = [
  ["Domain", "SudokuBoard, SudokuValidator and the ISudokuSolver contract."],
  ["Application", "SudokuGameService: solve, validate and trace use cases."],
  ["Infrastructure", "BacktrackingSudokuSolver and the puzzle library."],
  ["Presentation", "Next.js App Router, one client boundary, reducer-driven state."],
];

export function AlgorithmPrimer() {
  return (
    <section className={`container ${styles.primer}`} aria-labelledby="primer-heading">
      <h2 id="primer-heading" className={styles.heading}>
        How it works
      </h2>
      <div className={styles.columns}>
        <div>
          <h3 className={styles.sub}>Backtracking</h3>
          <ol className={styles.steps}>
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className={styles.note}>
            Invalid branches are cut off as soon as a cell runs out of options, which is why even hard puzzles solve in
            milliseconds. Turn on Visualize to watch it happen.
          </p>
        </div>
        <div>
          <h3 className={styles.sub}>Architecture</h3>
          <dl className={styles.layers}>
            {LAYERS.map(([name, text]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.note}>Built with Next.js, React, TypeScript (strict) and Vitest.</p>
        </div>
      </div>
    </section>
  );
}
