"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function TopLanguageBar() {
  const { t } = useTranslation();

  return (
    <div className="border-b border-border-gold bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
        <Link href={ROUTES.home} className="text-sm font-semibold text-gradient-gold">
          {t("common.appName")}
        </Link>
        <LanguageSwitcher />
      </div>
    </div>
  );
}
