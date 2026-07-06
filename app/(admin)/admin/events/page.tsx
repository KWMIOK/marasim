import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/shared/page-shell";
import { ROUTES } from "@/lib/constants/routes";
import type { Event } from "@/types/database";

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const eventList = (events ?? []) as Event[];

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Events</h1>
          <p className="text-sm text-zinc-500">{eventList.length} total</p>
        </div>
        <Link
          href={ROUTES.admin.newEvent}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          New Event
        </Link>
      </div>

      {eventList.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-600">No events yet.</p>
          <Link
            href={ROUTES.admin.newEvent}
            className="mt-4 inline-block text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {eventList.map((event) => (
                <tr key={event.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.admin.event(event.id)}
                      className="font-medium text-zinc-900 hover:text-rose-600"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{event.slug}</td>
                  <td className="px-4 py-3 capitalize">{event.template_type}</td>
                  <td className="px-4 py-3 capitalize">{event.status}</td>
                  <td className="px-4 py-3 text-zinc-600">
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
