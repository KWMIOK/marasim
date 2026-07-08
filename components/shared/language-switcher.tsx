"use client";

import { useTranslation } from "@/hooks/use-locale";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 text-xs font-medium ${className ?? ""}`}
      role="group"
      aria-label={t("common.language")}
    >
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={`rounded-md px-2.5 py-1.5 transition ${
          locale === "ar"
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        {t("common.arabic")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-md px-2.5 py-1.5 transition ${
          locale === "en"
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:bg-zinc-50"
        }`}
      >
        {t("common.english")}
      </button>
    </div>
  );
}
