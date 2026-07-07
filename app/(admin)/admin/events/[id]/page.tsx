import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventStatusActions } from "@/components/admin/event-status-actions";
import { GuestImportPanel } from "@/components/admin/guest-import-panel";
import { PageShell } from "@/components/shared/page-shell";
import { ROUTES } from "@/lib/constants/routes";
import { getGuestInvitationUrl } from "@/lib/utils/urls";
import type { Event, Guest } from "@/types/database";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const typedEvent = event as Event;

  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("event_id", id)
    .order("name");

  const guestList = (guests ?? []) as Guest[];

  const confirmed = guestList.filter((g) => g.rsvp_status === "confirmed").length;
  const checkedIn = guestList.filter((g) => g.check_in_status === "checked_in").length;

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={ROUTES.admin.events}
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Back to events
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{typedEvent.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {typedEvent.event_type?.replace(/_/g, " ")} · /e/{typedEvent.slug} ·{" "}
            {typedEvent.template_type} · <span className="capitalize">{typedEvent.status}</span>
          </p>
          {(typedEvent.groom_name || typedEvent.bride_name) && (
            <p className="mt-1 text-sm text-zinc-600">
              {typedEvent.groom_name} {typedEvent.bride_name ? `& ${typedEvent.bride_name}` : ""}
            </p>
          )}
          {typedEvent.honoree_name ? (
            <p className="mt-1 text-sm text-zinc-600">{typedEvent.honoree_name}</p>
          ) : null}
        </div>
        <EventStatusActions eventId={id} status={typedEvent.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Guests</p>
          <p className="text-2xl font-semibold">{guestList.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Confirmed</p>
          <p className="text-2xl font-semibold">{confirmed}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Checked in</p>
          <p className="text-2xl font-semibold">{checkedIn}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Event details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Start</dt>
              <dd>
                {typedEvent.start_datetime
                  ? new Date(typedEvent.start_datetime).toLocaleString()
                  : typedEvent.event_date
                    ? new Date(typedEvent.event_date).toLocaleString()
                    : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">End</dt>
              <dd>
                {typedEvent.end_datetime
                  ? new Date(typedEvent.end_datetime).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Venue</dt>
              <dd>{typedEvent.venue ?? typedEvent.location_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Colors</dt>
              <dd className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: typedEvent.primary_color }}
                />
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: typedEvent.secondary_color }}
                />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Custom message</dt>
              <dd className="max-w-xs truncate">{typedEvent.custom_message ?? "—"}</dd>
            </div>
          </dl>
          {typedEvent.maps_url ? (
            <a
              href={typedEvent.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-rose-600 hover:text-rose-700"
            >
              Open map →
            </a>
          ) : null}
        </div>

        <GuestImportPanel eventId={id} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Guest list</h2>
        </div>
        {guestList.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-500">
            No guests yet. Import a CSV or Excel file above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">RSVP</th>
                  <th className="px-4 py-3 font-medium">Invitation link</th>
                </tr>
              </thead>
              <tbody>
                {guestList.map((guest) => (
                  <tr key={guest.id} className="border-t border-zinc-100">
                    <td className="px-4 py-3">{guest.name}</td>
                    <td className="px-4 py-3">{guest.phone_number ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      {guest.rsvp_status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={getGuestInvitationUrl(typedEvent.slug, guest.unique_token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Open
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
