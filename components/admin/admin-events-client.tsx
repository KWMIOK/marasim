"use client";

import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";
import type { Event } from "@/types/database";

export function AdminEventsClient({ events }: { events: Event[] }) {
  const { t } = useTranslation();

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gold-light">{t("nav.events")}</h1>
          <p className="text-sm text-muted">
            {t("admin.eventsTotal", { count: events.length })}
          </p>
        </div>
        <Link
          href={ROUTES.admin.newEvent}
          className="rounded-lg btn-gold px-4 py-2 text-sm"
        >
          {t("admin.newEvent")}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border-gold surface-card p-10 text-center">
          <p className="text-muted">{t("admin.noEvents")}</p>
          <Link
            href={ROUTES.admin.newEvent}
            className="mt-4 inline-block text-sm font-medium text-gold hover:text-gold-light"
          >
            {t("admin.createFirstEvent")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-border-gold surface-card">
          <table className="min-w-full text-sm">
            <thead className="bg-transparent text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.title")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.slug")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.template")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
                <th className="px-4 py-3 font-medium">{t("admin.date")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-border-gold/50 hover:bg-transparent">
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.admin.event(event.id)}
                      className="font-medium text-gold-light hover:text-gold"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{event.slug}</td>
                  <td className="px-4 py-3 capitalize">{event.template_type}</td>
                  <td className="px-4 py-3 capitalize">
                    {t(`status.${event.status}` as "status.draft")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {event.event_date
                      ? new Date(event.event_date).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
