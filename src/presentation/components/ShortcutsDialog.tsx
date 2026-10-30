"use client";

import { useEffect, useRef } from "react";
import { Button } from "./ui/Button";
import { Kbd } from "./ui/Kbd";
import { CloseIcon, KeyboardIcon } from "./icons";
import styles from "./ShortcutsDialog.module.css";

interface Shortcut {
  keys: string[];
  label: string;
}

const GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: "Board",
    shortcuts: [
      { keys: ["1–9"], label: "Enter a digit" },
      { keys: ["Backspace", "Delete"], label: "Erase the selected cell" },
      { keys: ["←", "↑", "↓", "→"], label: "Move between cells" },
      { keys: ["Esc"], label: "Clear the selection, or cancel Clear" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["S"], label: "Solve" },
      { keys: ["V"], label: "Validate" },
      { keys: ["R"], label: "Reset entries" },
      { keys: ["N"], label: "Next puzzle" },
      { keys: ["E"], label: "Toggle Edit clues" },
    ],
  },
  {
    title: "Algorithm view",
    shortcuts: [
      { keys: ["A"], label: "Show or hide the algorithm view" },
      { keys: ["Space"], label: "Play or pause the replay" },
      { keys: [","], label: "Step back one event" },
      { keys: ["."], label: "Step forward one event" },
    ],
  },
];

export function ShortcutsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  };
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "?" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("input:not([type=radio]):not([type=checkbox]), textarea, select")) return;
      event.preventDefault();
      open();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Button variant="tertiary" icon={<KeyboardIcon />} onClick={open} aria-keyshortcuts="?" className={styles.trigger}>
        <span className={styles.triggerLabel}>Shortcuts</span>
        <span className="srOnly">: keyboard shortcuts</span>
      </Button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="shortcuts-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.head}>
          <h2 id="shortcuts-title" className={styles.title}>
            Keyboard shortcuts
          </h2>
          <Button variant="tertiary" iconOnly small aria-label="Close" onClick={close} icon={<CloseIcon />} />
        </div>
        <div className={styles.body}>
          {GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={`sc-${group.title}`}>
              <h3 id={`sc-${group.title}`} className={styles.groupTitle}>
                {group.title}
              </h3>
              <dl className={styles.list}>
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.label} className={styles.row}>
                    <dt>{shortcut.label}</dt>
                    <dd className={styles.keys}>
                      {shortcut.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
          <p className={styles.note}>
            Press <Kbd>?</Kbd> anywhere to open this list.
          </p>
        </div>
      </dialog>
    </>
  );
}
