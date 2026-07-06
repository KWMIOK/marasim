import Link from "next/link";
import { PageShell, StatCard } from "@/components/shared/page-shell";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: eventCount }, { count: guestCount }, analyticsRows] =
    await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("guests").select("*", { count: "exact", head: true }),
      supabase.from("event_analytics").select("*"),
    ]);

  const analytics = (analyticsRows.data ?? []) as Array<{
    confirmed: number;
    checked_in: number;
  }>;

  const totalConfirmed = analytics.reduce((sum, row) => sum + row.confirmed, 0);
  const totalCheckedIn = analytics.reduce((sum, row) => sum + row.checked_in, 0);

  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">Global overview across all events</p>
        </div>
        <Link
          href={ROUTES.admin.newEvent}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create Event
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Events" value={eventCount ?? 0} />
        <StatCard label="Total Guests" value={guestCount ?? 0} />
        <StatCard label="Confirmed RSVPs" value={totalConfirmed} />
        <StatCard label="Checked In" value={totalCheckedIn} />
      </div>

      <div className="mt-10">
        <Link
          href={ROUTES.admin.events}
          className="text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          Manage events →
        </Link>
      </div>
    </PageShell>
  );
}
