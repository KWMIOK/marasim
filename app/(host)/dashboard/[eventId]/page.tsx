import { PageShell, StatCard } from "@/components/shared/page-shell";

export default async function HostEventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">Event Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Event ID: {eventId}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Guests" value="—" />
        <StatCard label="Confirmed" value="—" />
        <StatCard label="Checked In" value="—" />
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        Guest table with WhatsApp distribution links and CSV export will live here.
      </p>
    </PageShell>
  );
}
