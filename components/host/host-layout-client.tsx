"use client";

import type { ReactNode } from "react";
import { AppHeader } from "@/components/shared/app-header";
import { useTranslation } from "@/hooks/use-locale";

export function HostLayoutClient({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader title={t("host.panel")} />
      <main>{children}</main>
    </div>
  );
}
