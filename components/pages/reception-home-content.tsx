"use client";

import Link from "next/link";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { ReceptionSyncStatus } from "@/components/reception/reception-entrance-picker";
import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { formatReceptionEventDate } from "@/lib/reception/session";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";

function ReceptionStatBox({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card rounded-xl px-2 py-3 shadow-lg shadow-black/20 transition hover:border-border-gold-strong"
    >
      <p className="text-[10px] leading-tight text-muted sm:text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gold-light sm:text-2xl">{value}</p>
    </Link>
  );
}

function ReceptionMenuButton({ label, href }: { label: string; href?: string }) {
  const className =
    "btn-outline-gold flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-medium";

  if (!href) {
    return (
      <button type="button" disabled className={cnDisabled(className)}>
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function cnDisabled(className: string) {
  return `${className} opacity-60`;
}

export function ReceptionHomeContent() {
  const { t, locale } = useTranslation();
  const { session } = useReceptionSync();
  const formattedDate = formatReceptionEventDate(session.eventDate, locale);
  const reportHref = ROUTES.receptionReport(session.token);

  const menuItems: Array<{ label: string; href?: string }> = [
    { label: t("reception.registerGuestArrival"), href: ROUTES.receptionRegister(session.token) },
    { label: t("reception.showGuestsList"), href: ROUTES.receptionGuests(session.token) },
    { label: t("reception.sendNotification") },
    { label: t("reception.messages") },
    { label: t("reception.occasionSettings") },
  ];

  return (
    <AppPageShell className="min-h-screen pb-10 pt-8">
      <header>
        <h1 className="text-3xl font-semibold text-gold-light">{t("reception.hello")}</h1>
        <p className="mt-1 text-base text-muted">{t("reception.roleLabel")}</p>
      </header>

      <ReceptionSyncStatus className="mt-4" />

      <div
        className="surface-card mt-4 rounded-2xl px-4 py-4 shadow-lg shadow-black/20"
        aria-label={session.eventDisplayName}
      >
        <p className="text-base font-semibold leading-snug text-gold-light">{session.eventDisplayName}</p>
        {formattedDate ? (
          <p className="mt-2 text-sm text-muted">{formattedDate}</p>
        ) : (
          <p className="mt-2 text-sm text-gold-muted">{t("reception.datePending")}</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ReceptionStatBox label={t("reception.totalGuests")} value={session.totalGuests} href={reportHref} />
        <ReceptionStatBox label={t("reception.arrived")} value={session.arrivedGuests} href={reportHref} />
        <ReceptionStatBox label={t("reception.notArrived")} value={session.notArrivedGuests} href={reportHref} />
      </div>

      <div className="mt-6 space-y-3">
        {menuItems.map((item) => (
          <ReceptionMenuButton key={item.label} label={item.label} href={item.href} />
        ))}
      </div>
    </AppPageShell>
  );
}
