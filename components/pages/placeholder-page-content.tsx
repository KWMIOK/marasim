"use client";

import { AppPageShell } from "@/components/shared/app-page-shell";
import { useTranslation } from "@/hooks/use-locale";

export function PlaceholderPageContent({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();

  return (
    <AppPageShell align="center" className="text-center">
      <h1 className="text-2xl font-semibold text-gold-light">{t(titleKey)}</h1>
      <p className="mt-3 max-w-sm text-muted text-sm">{t("common.comingSoon")}</p>
    </AppPageShell>
  );
}
