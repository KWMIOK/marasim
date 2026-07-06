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
        "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
