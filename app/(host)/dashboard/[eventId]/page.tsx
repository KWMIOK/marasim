import { HostEventDashboardClient } from "@/components/host/host-event-dashboard-client";

export default async function HostEventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return <HostEventDashboardClient eventId={eventId} />;
}
