import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Kbd } from "./Kbd";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "destructive-solid";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Square, icon-only button. Requires an accessible name via aria-label. */
  iconOnly?: boolean;
  small?: boolean;
  /** Shortcut hint shown inside the button on devices with a keyboard. */
  shortcut?: string;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "secondary",
  iconOnly = false,
  small = false,
  shortcut,
  icon,
  className,
  children,
  type = "button",
  ref,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], iconOnly && styles.iconOnly, small && styles.small, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      aria-keyshortcuts={shortcut?.toUpperCase()}
      title={shortcut && rest["aria-label"] ? `${rest["aria-label"]} (${shortcut})` : rest.title}
      {...rest}
    >
      {icon}
      {children}
      {shortcut && !iconOnly && <Kbd className={styles.kbd}>{shortcut}</Kbd>}
    </button>
  );
}
