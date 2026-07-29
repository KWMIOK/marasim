"use client";

import { useTranslation } from "@/hooks/use-locale";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-border-gold bg-surface p-0.5 text-xs font-medium ${className ?? ""}`}
      role="group"
      aria-label={t("common.language")}
    >
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={`rounded-md px-2.5 py-1.5 transition ${
          locale === "ar"
            ? "bg-gold text-black"
            : "text-muted hover:bg-gold/10 hover:text-gold-light"
        }`}
      >
        {t("common.arabic")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-md px-2.5 py-1.5 transition ${
          locale === "en"
            ? "bg-gold text-black"
            : "text-muted hover:bg-gold/10 hover:text-gold-light"
        }`}
      >
        {t("common.english")}
      </button>
    </div>
  );
}
