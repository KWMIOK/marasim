import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function ShareOptionCard({
  href,
  icon,
  title,
  description,
  className,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "surface-card block rounded-2xl p-5 text-start shadow-lg shadow-black/20 transition hover:border-border-gold-strong",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gold-light">{title}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
        </div>
      </div>
    </Link>
  );
}
