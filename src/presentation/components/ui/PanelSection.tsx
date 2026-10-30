import type { ReactNode } from "react";
import styles from "./PanelSection.module.css";

interface PanelSectionProps {
  title: string;
  /** Keep the heading for assistive tech but do not show it. */
  hideTitle?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}

/** A titled group in the side panel, separated from its neighbours by a hairline. */
export function PanelSection({ title, hideTitle, aside, children }: PanelSectionProps) {
  const id = `panel-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={hideTitle ? styles.headHidden : styles.head}>
        <h2 id={id} className={hideTitle ? "srOnly" : styles.title}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
