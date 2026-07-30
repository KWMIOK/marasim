"use client";

import { AppPageShell } from "@/components/shared/app-page-shell";
import { ReceptionBackLink } from "@/components/reception/reception-back-link";
import { ReceptionGuestsPieChart } from "@/components/reception/reception-guests-pie-chart";
import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { useTranslation } from "@/hooks/use-locale";

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-xl px-2 py-3 text-center shadow-lg shadow-black/20">
      <p className="text-[10px] leading-tight text-muted sm:text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gold-light sm:text-xl">{value}</p>
    </div>
  );
}

export function ReceptionGuestsReportContent() {
  const { t } = useTranslation();
  const { session } = useReceptionSync();

  const arrivedPercentage =
    session.totalGuests > 0
      ? Math.round((session.arrivedGuests / session.totalGuests) * 100)
      : 0;

  return (
    <AppPageShell className="min-h-screen pb-10 pt-8">
      <ReceptionBackLink
        receptionToken={session.token}
        label={t("reception.backToHome")}
      />

      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("reception.guestsReport")}</h1>
      </header>

      <div className="surface-card mt-8 rounded-2xl px-6 py-8 shadow-lg shadow-black/20">
        <ReceptionGuestsPieChart
          total={session.totalGuests}
          arrived={session.arrivedGuests}
          notArrived={session.notArrivedGuests}
          totalLabel={t("reception.totalGuests")}
        />

        <div className="mt-8 grid grid-cols-3 gap-2">
          <ReportStat label={t("reception.arrived")} value={String(session.arrivedGuests)} />
          <ReportStat
            label={t("reception.reportDidNotArrive")}
            value={String(session.notArrivedGuests)}
          />
          <ReportStat
            label={t("reception.reportArrivedPercentage")}
            value={`${arrivedPercentage}%`}
          />
        </div>
      </div>
    </AppPageShell>
  );
}
