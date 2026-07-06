import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/constants/routes";

export function AppHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <Link href={ROUTES.home} className="text-lg font-semibold text-zinc-900">
            Marasim
          </Link>
          <p className="text-sm text-zinc-500">{title}</p>
          {subtitle ? (
            <p className="text-xs text-zinc-400">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
