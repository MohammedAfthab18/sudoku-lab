# Sudoku Lab

A Sudoku solver built with Next.js (App Router), TypeScript (strict), OOP and SOLID principles, using a
recursive **backtracking** algorithm. It has a replayable algorithm visualizer, light and dark themes, and a
fully keyboard-, touch- and screen-reader-friendly board.

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (includes architecture boundary rules)
npm test           # vitest: unit + component tests
npm run build      # production build
```

## The algorithm

Backtracking explores the search space depth-first and abandons a branch as soon as it cannot work.

1. Pick an empty cell (default: the one with the **fewest legal digits**; "Row by row" is also available).
2. Try each legal digit there, one at a time. A digit is legal when it does not repeat in its row, column or box.
3. **Recurse** on the rest of the board.
4. If the recursion fails, **undo** the placement (the backtrack) and try the next digit.
5. If every digit fails, return failure to the caller. If no empty cell is left, the board is solved.

`BacktrackingSudokuSolver` keeps row/column/box usage in bit masks, so a legality check is a few bitwise operations.
Picking the most constrained cell first prunes dead branches early, which is why even hard puzzles solve in
milliseconds. The same search powers both **Solve** and the visualizer; the visualizer only *observes* it.

Safety valve: the search stops after 2,000,000 recursive calls and reports `limit-reached` rather than freezing the tab.

### Visualizer

`trace()` records each step as an invertible event (`select`, `assign`, `dead-end`, `backtrack`, `solved`). The UI
replays events forward and backward (`applyEvent` / `revertEvent`), so **reverse stepping is exact**. Counters
(recursive calls, assignments, backtracks) are derived from the events and verified in tests against the solver's own
statistics. Recording is capped at 50,000 events; a capped trace is reported honestly instead of pretending to finish.

## Architecture

```
src/
  domain/           SudokuBoard (immutable), SudokuValidator, geometry, ISudokuSolver, IPuzzleRepository, trace helpers
  application/      SudokuGameService: solve / validate / trace use cases, outcome types
  infrastructure/   BacktrackingSudokuSolver, StaticPuzzleRepository (+ puzzle data)
  presentation/     React components, hooks, reducer state, CSS modules
  composition.ts    the only place that wires concrete classes to contracts
  app/              layout, page (Server Component), design tokens (globals.css)
```

Dependencies point inward, and **ESLint enforces it** (`no-restricted-imports` per layer): the domain imports nothing
from outer layers; the application layer depends only on domain contracts; the UI cannot import
`@/infrastructure/*`. Swapping the algorithm means implementing `ITraceableSudokuSolver` and changing one line in
`composition.ts`.

SOLID where it earns its keep: `ISudokuSolver` / `ITraceableSudokuSolver` are split so a plain solver need not
implement tracing (ISP); the service depends on abstractions (DIP); the validator is the single source of truth
for the rules (SRP).

UI state is one reducer (`presentation/state/gameState.ts`) with immutable updates. Only `SudokuWorkspace` is a
Client Component boundary; the page, header shell and explainer are Server Components.

## Design system

Tokens live in `src/app/globals.css`: neutral surfaces, one accent (focus, selection, your own digits), semantic
feedback colours, three radii, a 4px spacing scale and a small type scale in Geist with tabular numerals. Dark
mode is a separate palette, not an inversion. Digit ownership is encoded by weight *and* colour (clues bold, your
entries regular in the accent colour, solver digits in green), conflicts get a tint plus a corner mark, and
solver states differ by outline style (solid, dotted, dashed), never colour alone.

## Keyboard

| Keys | Action |
| --- | --- |
| `1`–`9`, `Backspace` / `Delete` | Enter / erase in the selected cell |
| Arrow keys | Move between cells |
| `Esc` | Clear selection, or cancel Clear |
| `S` `V` `R` `N` `E` | Solve, Validate, Reset, Next puzzle, toggle Edit clues |
| `A`, `Space`, `,` `.` | Algorithm view, play/pause, step back/forward |
| `?` | Show the shortcut list |

Digit and arrow handling is attached to the board only; letter shortcuts ignore text fields and dialogs.

## Notes and limits

- Solving runs synchronously on the main thread. It takes a few milliseconds for the bundled puzzles; the call limit
  above is the guard for pathological input. There is no Web Worker.
- Puzzles are a built-in set of 12 (3 per difficulty, each verified to have exactly one solution) plus two test cases.
  Difficulty labels are by clue count, not a rated metric.
- "Edit clues" lets you enter your own puzzle; there is no import/export or undo.
