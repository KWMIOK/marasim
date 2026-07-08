"use client";

import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function AdminCatalogClient() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <Link href={ROUTES.admin.settings} className="text-sm text-zinc-500 hover:text-zinc-700">
        {t("admin.backToSettings")}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{t("admin.catalogTitle")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">{t("admin.catalogSubtitle")}</p>
    </PageShell>
  );
}
