import { useId } from "react";
import styles from "./SegmentedControl.module.css";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  options: readonly Option<T>[];
  /** `null` means none of the options is selected (e.g. a custom puzzle). */
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Hide the legend visually while keeping it for assistive tech. */
  hideLegend?: boolean;
  className?: string;
}

/** Native radio group styled as a segmented control, so arrow-key behaviour comes for free. */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  disabled,
  hideLegend,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={[styles.fieldset, className].filter(Boolean).join(" ")} disabled={disabled}>
      <legend className={hideLegend ? "srOnly" : styles.legend}>{legend}</legend>
      <div className={styles.track} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.label}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
