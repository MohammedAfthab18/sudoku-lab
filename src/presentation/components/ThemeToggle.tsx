"use client";

import { useSyncExternalStore } from "react";
import { Button } from "./ui/Button";
import { MoonIcon, SunIcon } from "./icons";

type Theme = "light" | "dark";
const STORAGE_KEY = "sudoku-lab-theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const readTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const readServerTheme = (): Theme => "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, readServerTheme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
    window.setTimeout(() => root.classList.remove("theme-transition"), 250);
  };

  return (
    <Button
      variant="tertiary"
      iconOnly
      aria-label={`Switch to ${next} theme`}
      onClick={toggle}
      icon={next === "dark" ? <MoonIcon /> : <SunIcon />}
    />
  );
}
