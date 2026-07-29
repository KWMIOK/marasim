import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6 py-8", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="surface-card rounded-xl p-5 shadow-lg shadow-black/20">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gold-light">{value}</p>
    </div>
  );
}
