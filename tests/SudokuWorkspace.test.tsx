import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SudokuWorkspace } from "@/presentation/components/SudokuWorkspace";

const cell = (index: number) => document.querySelector<HTMLElement>(`[data-index="${index}"]`)!;
const status = () => screen.getByRole("status").textContent ?? "";

function setup() {
  const user = userEvent.setup();
  render(<SudokuWorkspace />);
  return user;
}

describe("SudokuWorkspace", () => {
  it("renders a 9x9 grid with accessible cells and the clue count", () => {
    setup();
    expect(screen.getByRole("grid", { name: "Sudoku board" })).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell")).toHaveLength(81);
    expect(screen.getByText("38 clues")).toBeInTheDocument();
    expect(cell(0)).toHaveAccessibleName("Row 1, column 1, clue 5, locked");
  });

  it("highlights related cells and matching digits when a cell is selected", async () => {
    const user = setup();
    await user.click(cell(0)); // clue 5
    expect(cell(0)).toHaveAttribute("aria-selected", "true");
    expect(document.querySelectorAll("[data-related]")).toHaveLength(20);
    expect(document.querySelectorAll("[data-match]").length).toBeGreaterThan(0);
  });

  it("enters digits with the keyboard and navigates with arrows", async () => {
    const user = setup();
    await user.click(cell(1)); // empty
    await user.keyboard("2");
    expect(cell(1)).toHaveAccessibleName(/your entry 2/);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cell(10));
    await user.keyboard("{ArrowUp}{Backspace}");
    expect(cell(1)).toHaveAccessibleName(/empty/);
  });

  it("never edits a clue while playing", async () => {
    const user = setup();
    await user.click(cell(0));
    await user.keyboard("9");
    expect(cell(0)).toHaveAccessibleName(/clue 5/);
    expect(status()).toMatch(/clue cells are locked/i);
  });

  it("flags conflicts immediately, with text and aria-invalid", async () => {
    const user = setup();
    await user.click(cell(1));
    await user.keyboard("4"); // R1 already has a 4
    expect(cell(1)).toHaveAttribute("aria-invalid", "true");
    expect(status()).toMatch(/4 repeats in row 1/);
  });

  it("solves, reports success after the fact, and fills every cell", async () => {
    const user = setup();
    expect(status()).toBe(""); // nothing announced before an action
    await user.click(screen.getByRole("button", { name: /^Solve/ }));
    expect(status()).toMatch(/Solved in/);
    expect(document.querySelectorAll('[data-source="solved"]')).toHaveLength(43);
    expect(screen.getByText("Recursive calls").nextSibling).not.toHaveTextContent("–");
  });

  it("reports an unsolvable puzzle as an error", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "No-solution demo" }));
    await user.click(screen.getByRole("button", { name: /^Solve/ }));
    expect(status()).toMatch(/No solution/);
    expect(document.querySelectorAll('[data-source="solved"]')).toHaveLength(0);
  });

  it("asks before clearing, and cancel keeps the board", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    const confirm = screen.getByRole("group", { name: /confirm clearing/i });
    await user.click(within(confirm).getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("38 clues")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Clear board" }));
    expect(screen.getByText("0 clues")).toBeInTheDocument();
    expect(status()).toMatch(/Board cleared/);
  });

  it("lets the digit pad enter values without a keyboard", async () => {
    const user = setup();
    await user.click(cell(1));
    await user.click(screen.getByRole("button", { name: /^2, / }));
    expect(cell(1)).toHaveAccessibleName(/your entry 2/);
  });

  it("steps through the visualization and stops it", async () => {
    const user = setup();
    const position = () => {
      const match = /^(\d+) \/ (\d+)$/.exec(screen.getByText(/^\d+ \/ \d+$/).textContent ?? "");
      return { step: Number(match![1]), total: Number(match![2]) };
    };

    await user.click(screen.getByRole("switch", { name: "Visualize" }));
    await user.click(screen.getByRole("button", { name: "Start visualization" }));
    await user.click(screen.getByRole("button", { name: /^Pause/ })); // freeze auto-play
    const paused = position();
    expect(paused.total).toBeGreaterThan(paused.step + 2);

    await user.click(screen.getByRole("button", { name: "Step forward" }));
    await user.click(screen.getByRole("button", { name: "Step forward" }));
    expect(position().step).toBe(paused.step + 2);
    expect(screen.getByRole("button", { name: /^Solve/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Step back" }));
    expect(position().step).toBe(paused.step + 1);

    await user.click(screen.getByRole("button", { name: "Stop and return to the board" }));
    expect(screen.getByRole("button", { name: /^Solve/ })).toBeEnabled();
    expect(document.querySelectorAll("[data-trace]")).toHaveLength(0);
  });

  it("solves from the S shortcut when focus is not in a text field", async () => {
    const user = setup();
    await user.keyboard("s");
    expect(status()).toMatch(/Solved/);
  });
});
