import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function AppPageShell({
  children,
  className,
  align = "start",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}) {
  return (
    <main
      className={cn(
        "min-h-[calc(100vh-5rem)] px-6 pb-6 pt-6",
        align === "end" && "flex flex-col justify-end",
        align === "center" && "flex flex-col items-center justify-center",
        className
      )}
    >
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </main>
  );
}

/** @deprecated Use AppPageShell — kept for gradual migration of admin pages. */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <AppPageShell className={className}>{children}</AppPageShell>;
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
