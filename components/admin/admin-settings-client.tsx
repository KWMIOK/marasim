"use client";

import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function AdminSettingsClient() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-gold-light">{t("admin.settingsTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("admin.settingsSubtitle")}</p>
      <Link
        href={ROUTES.admin.catalog}
        className="mt-6 inline-block text-sm font-medium text-gold hover:text-gold-light"
      >
        {t("admin.manageCatalog")}
      </Link>
      <Link
        href={ROUTES.admin.pricing}
        className="mt-3 inline-block text-sm font-medium text-gold hover:text-gold-light"
      >
        {t("admin.pricingLink")}
      </Link>
    </PageShell>
  );
}
