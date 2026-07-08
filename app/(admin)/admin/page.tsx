import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { createClient } from "@/lib/supabase/server";

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
    <AdminDashboardClient
      eventCount={eventCount ?? 0}
      guestCount={guestCount ?? 0}
      totalConfirmed={totalConfirmed}
      totalCheckedIn={totalCheckedIn}
    />
  );
}
