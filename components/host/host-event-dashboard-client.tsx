"use client";

import { PageShell, StatCard } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";

export function HostEventDashboardClient({ eventId }: { eventId: string }) {
  const { t } = useTranslation();

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-gold-light">{t("host.eventDashboard")}</h1>
      <p className="mt-1 text-sm text-muted">{t("host.eventIdLabel", { id: eventId })}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("host.totalGuests")} value="—" />
        <StatCard label={t("admin.confirmed")} value="—" />
        <StatCard label={t("admin.checkedIn")} value="—" />
      </div>

      <p className="mt-8 text-sm text-muted">{t("host.guestTableHint")}</p>
    </PageShell>
  );
}
