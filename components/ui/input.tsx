import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-border-gold bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/50",
          className
        )}
        {...props}
      />
    );
  }
);
