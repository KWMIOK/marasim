import { redirect } from "next/navigation";
import { NewEventPageClient } from "@/components/admin/new-event-page-client";
import { getEventCatalogs } from "@/lib/data/catalogs";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";
import type { Profile } from "@/types/database";

export default async function NewEventPage() {
  const user = await getSessionUser();
  const profile = await getProfile();

  if (!user || profile?.role !== "super_admin") {
    redirect(ROUTES.login);
  }

  const supabase = await createClient();
  const [{ data: hosts }, catalogs] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["host", "super_admin"])
      .order("full_name"),
    getEventCatalogs(),
  ]);

  return (
    <NewEventPageClient
      hosts={(hosts ?? [profile]) as Pick<Profile, "id" | "full_name" | "role">[]}
      currentUserId={user.id}
      catalogs={catalogs}
    />
  );
}
