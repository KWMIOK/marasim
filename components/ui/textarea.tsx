import { cn } from "@/lib/utils/cn";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-border-gold bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/50",
        className
      )}
      {...props}
    />
  );
}
