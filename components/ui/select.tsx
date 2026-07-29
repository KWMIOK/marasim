import { cn } from "@/lib/utils/cn";
import type { SelectHTMLAttributes } from "react";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-border-gold bg-surface px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-gold/50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
