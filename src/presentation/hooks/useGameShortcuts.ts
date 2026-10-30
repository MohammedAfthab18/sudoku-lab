import { useEffect, useEffectEvent } from "react";
import type { SudokuGame } from "./useSudokuGame";

const TEXT_ENTRY = "input:not([type=radio]):not([type=checkbox]), textarea, select, [contenteditable=true]";
const INTERACTIVE = "button, a[href], summary, [role=button], input, select, textarea";

/**
 * Document-level shortcuts for actions. Digit and arrow handling lives on the
 * board itself so it can never fire while someone is typing elsewhere.
 */
export function useGameShortcuts({ state, actions }: SudokuGame) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(TEXT_ENTRY) || target?.closest("dialog")) return;

    const key = event.key;
    const tracing = state.trace !== null;

    if (key === "Escape") {
      if (state.confirmingClear) {
        actions.cancelClear();
        event.preventDefault();
      } else if (state.selected !== null) {
        actions.select(null);
        event.preventDefault();
      }
      return;
    }

    if (tracing) {
      if (key === " " && !target?.closest(INTERACTIVE)) {
        actions.togglePlay();
        event.preventDefault();
      } else if (key === ",") {
        actions.step(-1);
      } else if (key === ".") {
        actions.step(1);
      }
    }

    switch (key.toLowerCase()) {
      case "a":
        actions.setVisualize(!state.visualize);
        break;
      case "s":
        if (!tracing) actions.solve();
        break;
      case "v":
        if (!tracing) actions.validate();
        break;
      case "r":
        if (!tracing) actions.reset();
        break;
      case "e":
        if (!tracing) actions.setMode(state.mode === "edit" ? "play" : "edit");
        break;
      case "n":
        if (!tracing) actions.nextPuzzle();
        break;
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
}
