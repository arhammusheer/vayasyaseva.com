"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Answers as large buttons: a radio group, or toggles when `multi`. */
export function Pills({
  options,
  labels,
  selected,
  onPick,
  labelledBy,
  multi = false,
  small = false,
  disabled = false,
}: {
  options: readonly string[];
  labels: Record<string, string>;
  selected: (value: string) => boolean;
  onPick: (value: string) => void;
  labelledBy: string;
  multi?: boolean;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={cn("quick-pills", small && "is-small")} role={multi ? "group" : "radiogroup"} aria-labelledby={labelledBy}>
      {options.map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          role={multi ? undefined : "radio"}
          aria-checked={multi ? undefined : selected(value)}
          aria-pressed={multi ? selected(value) : undefined}
          className={cn("quick-pill", selected(value) && "is-selected")}
          onClick={() => onPick(value)}
        >
          {selected(value) && <Check size={16} aria-hidden="true" />}
          {labels[value] ?? value}
        </button>
      ))}
    </div>
  );
}
