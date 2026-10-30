import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Sudoku Lab mark: a 3x3 grid with one filled cell. */
export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.33 1.5v15M11.67 1.5v15M1.5 6.33h15M1.5 11.67h15" stroke="currentColor" strokeWidth="1" />
      <rect x="6.9" y="6.9" width="4.2" height="4.2" rx="1" fill="var(--accent)" />
    </svg>
  );
}

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" />
  </Icon>
);

export const KeyboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.75" />
    <path d="M4.5 6.5h.01M7 6.5h.01M9.5 6.5h.01M12 6.5h.01M4.5 9.5h7" />
  </Icon>
);

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3.25v9.5L12.25 8 5 3.25Z" fill="currentColor" />
  </Icon>
);

export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.25 3.5v9M10.75 3.5v9" strokeWidth="2" />
  </Icon>
);

export const StepBackIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 3.5v9" />
    <path d="M12 3.5 6.5 8l5.5 4.5v-9Z" fill="currentColor" />
  </Icon>
);

export const StepForwardIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5v9" />
    <path d="M4 3.5 9.5 8 4 12.5v-9Z" fill="currentColor" />
  </Icon>
);

export const StopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="8" height="8" rx="1.25" fill="currentColor" />
  </Icon>
);

export const EraseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.5h7.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6L1.5 8 6 3.5Z" />
    <path d="m8.5 6.25 3 3.5M11.5 6.25l-3 3.5" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
);

export const ShuffleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 4.5h2.2c3 0 4 7 7 7H14M2 11.5h2.2c1 0 1.8-.8 2.5-1.9M9.3 6.4c.6-1 1.4-1.9 2.4-1.9H14" />
    <path d="m12.5 3-1.5 1.5L12.5 6M12.5 10l-1.5 1.5L12.5 13" />
  </Icon>
);

/** Status marks: shape differs per tone so meaning never depends on color alone. */
export const StatusIcon = ({ tone, ...p }: IconProps & { tone: "neutral" | "info" | "success" | "warning" | "error" }) => {
  switch (tone) {
    case "success":
      return (
        <Icon {...p}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="m5.25 8.25 1.9 1.9 3.6-4" />
        </Icon>
      );
    case "warning":
      return (
        <Icon {...p}>
          <path d="M8 2 14.25 13H1.75L8 2Z" />
          <path d="M8 6.25v3M8 11.4h.01" />
        </Icon>
      );
    case "error":
      return (
        <Icon {...p}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="m5.75 5.75 4.5 4.5M10.25 5.75l-4.5 4.5" />
        </Icon>
      );
    case "info":
      return (
        <Icon {...p}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 7.25v3.5M8 5.1h.01" />
        </Icon>
      );
    default:
      return (
        <Icon {...p}>
          <circle cx="8" cy="8" r="6.25" strokeDasharray="2 2.4" />
        </Icon>
      );
  }
};
