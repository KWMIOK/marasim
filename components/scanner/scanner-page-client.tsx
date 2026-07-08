"use client";

import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";

export function ScannerPageClient() {
  const { t } = useTranslation();

  return (
    <PageShell className="max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900">{t("scanner.title")}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t("scanner.subtitle")}</p>
      <div className="mt-8 aspect-square rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-100" />
    </PageShell>
  );
}
