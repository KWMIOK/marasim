"use client";

import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";

export function HostDashboardClient() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">{t("host.yourEvents")}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t("host.yourEventsSubtitle")}</p>
    </PageShell>
  );
}
