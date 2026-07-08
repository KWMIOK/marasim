import { notFound } from "next/navigation";
import { AdminEventDetailClient } from "@/components/admin/admin-event-detail-client";
import { createClient } from "@/lib/supabase/server";
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

  return <AdminEventDetailClient eventId={id} event={typedEvent} guests={guestList} />;
}
