"use client";

import { AppPageShell } from "@/components/shared/app-page-shell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslation } from "@/hooks/use-locale";

export function ProfilePageContent() {
  const { t } = useTranslation();

  return (
    <AppPageShell className="pt-10">
      <h1 className="text-2xl font-semibold text-gold-light">{t("bottomNav.profile")}</h1>

      <section className="surface-card mt-8 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-gold-light">{t("profile.languageTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("profile.languageSubtitle")}</p>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </section>
    </AppPageShell>
  );
}
