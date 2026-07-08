import { AdminEventsClient } from "@/components/admin/admin-events-client";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  return <AdminEventsClient events={(events ?? []) as Event[]} />;
}
