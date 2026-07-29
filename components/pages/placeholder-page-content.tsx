"use client";

import { useTranslation } from "@/hooks/use-locale";

export function PlaceholderPageContent({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 pb-6 text-center">
      <h1 className="text-2xl font-semibold text-gold-light">{t(titleKey)}</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">{t("common.comingSoon")}</p>
    </main>
  );
}
