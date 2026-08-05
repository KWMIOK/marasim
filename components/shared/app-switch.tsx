"use client";

import { cn } from "@/lib/utils/cn";

type AppSwitchProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
};

export function AppSwitch({ id, checked, onChange, "aria-label": ariaLabel }: AppSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-4 w-7 shrink-0 rounded-full border border-border-gold transition-colors",
        checked ? "bg-gold/20" : "bg-surface"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3 w-3 rounded-full transition-all",
          checked ? "start-3.5 bg-gold shadow-sm shadow-gold/40" : "start-0.5 bg-border-gold"
        )}
      />
    </button>
  );
}
