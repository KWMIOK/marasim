"use client";

import Link from "next/link";
import { PageShell, StatCard } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function AdminDashboardClient({
  eventCount,
  guestCount,
  totalConfirmed,
  totalCheckedIn,
}: {
  eventCount: number;
  guestCount: number;
  totalConfirmed: number;
  totalCheckedIn: number;
}) {
  const { t } = useTranslation();

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gold-light">{t("admin.nav.dashboard")}</h1>
          <p className="text-sm text-muted">{t("admin.overview")}</p>
        </div>
        <Link
          href={ROUTES.admin.newEvent}
          className="rounded-lg btn-gold px-4 py-2 text-sm"
        >
          {t("admin.createEvent")}
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("admin.totalEvents")} value={eventCount} />
        <StatCard label={t("admin.totalGuests")} value={guestCount} />
        <StatCard label={t("admin.confirmedRsvps")} value={totalConfirmed} />
        <StatCard label={t("admin.checkedIn")} value={totalCheckedIn} />
      </div>

      <div className="mt-10">
        <Link
          href={ROUTES.admin.events}
          className="text-sm font-medium text-gold hover:text-gold-light"
        >
          {t("admin.manageEvents")}
        </Link>
      </div>
    </PageShell>
  );
}
