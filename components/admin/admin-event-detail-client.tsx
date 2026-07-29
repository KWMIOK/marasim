"use client";

import Link from "next/link";
import { EventStatusActions } from "@/components/admin/event-status-actions";
import { GuestImportPanel } from "@/components/admin/guest-import-panel";
import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";
import type { TranslationKey } from "@/lib/i18n";
import { getGuestInvitationUrl } from "@/lib/utils/urls";
import type { Event, Guest, RsvpStatus } from "@/types/database";

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "ar" ? "ar-KW" : "en-US");
}

function eventTypeKey(type: string | null | undefined): TranslationKey {
  if (!type) return "eventTypes.wedding";
  return `eventTypes.${type}` as TranslationKey;
}

function rsvpKey(status: RsvpStatus): TranslationKey {
  return `rsvpStatus.${status}` as TranslationKey;
}

export function AdminEventDetailClient({
  eventId,
  event,
  guests,
}: {
  eventId: string;
  event: Event;
  guests: Guest[];
}) {
  const { t, locale } = useTranslation();

  const confirmed = guests.filter((g) => g.rsvp_status === "confirmed").length;
  const checkedIn = guests.filter((g) => g.check_in_status === "checked_in").length;

  const statusKey = `status.${event.status}` as TranslationKey;

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={ROUTES.admin.events}
            className="text-sm text-muted hover:text-foreground"
          >
            {t("admin.backToEvents")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gold-light">{event.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {t(eventTypeKey(event.event_type))} · /e/{event.slug} · {event.template_type} ·{" "}
            <span className="capitalize">{t(statusKey)}</span>
          </p>
          {(event.groom_name || event.bride_name) && (
            <p className="mt-1 text-sm text-muted">
              {event.groom_name} {event.bride_name ? `& ${event.bride_name}` : ""}
            </p>
          )}
          {event.honoree_name ? (
            <p className="mt-1 text-sm text-muted">{event.honoree_name}</p>
          ) : null}
        </div>
        <EventStatusActions eventId={eventId} status={event.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-gold surface-card p-4">
          <p className="text-sm text-muted">{t("admin.guests")}</p>
          <p className="text-2xl font-semibold">{guests.length}</p>
        </div>
        <div className="rounded-xl border border-border-gold surface-card p-4">
          <p className="text-sm text-muted">{t("admin.confirmed")}</p>
          <p className="text-2xl font-semibold">{confirmed}</p>
        </div>
        <div className="rounded-xl border border-border-gold surface-card p-4">
          <p className="text-sm text-muted">{t("admin.checkedIn")}</p>
          <p className="text-2xl font-semibold">{checkedIn}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-gold surface-card p-6">
          <h2 className="text-lg font-semibold text-gold-light">{t("admin.eventDetails")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("admin.start")}</dt>
              <dd>
                {formatDateTime(event.start_datetime ?? event.event_date, locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("admin.end")}</dt>
              <dd>{formatDateTime(event.end_datetime, locale)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("admin.venue")}</dt>
              <dd>{event.venue ?? event.location_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("admin.colors")}</dt>
              <dd className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: event.primary_color }}
                />
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: event.secondary_color }}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("admin.customMessage")}</dt>
              <dd className="max-w-xs truncate">{event.custom_message ?? "—"}</dd>
            </div>
          </dl>
          {event.maps_url ? (
            <a
              href={event.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-gold hover:text-gold-light"
            >
              {t("admin.openMap")}
            </a>
          ) : null}
        </div>

        <GuestImportPanel eventId={eventId} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border-gold surface-card">
        <div className="border-b border-border-gold px-6 py-4">
          <h2 className="text-lg font-semibold text-gold-light">{t("admin.guestList")}</h2>
        </div>
        {guests.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">{t("admin.noGuests")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-transparent text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("admin.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.phone")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.rsvp")}</th>
                  <th className="px-4 py-3 font-medium">{t("admin.invitationLink")}</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id} className="border-t border-border-gold/50">
                    <td className="px-4 py-3">{guest.name}</td>
                    <td className="px-4 py-3">{guest.phone_number ?? "—"}</td>
                    <td className="px-4 py-3">{t(rsvpKey(guest.rsvp_status))}</td>
                    <td className="px-4 py-3">
                      <a
                        href={getGuestInvitationUrl(event.slug, guest.unique_token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:text-gold-light"
                      >
                        {t("common.open")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
