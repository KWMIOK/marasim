"use client";

import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslation } from "@/hooks/use-locale";

export function ProfilePageContent() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col px-6 pb-6 pt-10">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-gold-light">{t("bottomNav.profile")}</h1>

        <section className="surface-card mt-8 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-gold-light">{t("profile.languageTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("profile.languageSubtitle")}</p>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </section>
      </div>
    </main>
  );
}
