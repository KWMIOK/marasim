import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-rose-500 focus:ring-2",
        className
      )}
      {...props}
    />
  );
}
