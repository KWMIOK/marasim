import Link from "next/link";
import { redirect } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { PageShell } from "@/components/shared/page-shell";
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
    <PageShell>
      <Link href={ROUTES.admin.events} className="text-sm text-zinc-500 hover:text-zinc-700">
        ← Back to events
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Create event</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Configure ceremony details, design, features, and guest list.
      </p>

      <div className="mt-8">
        <EventForm
          hosts={(hosts ?? [profile]) as Pick<Profile, "id" | "full_name" | "role">[]}
          currentUserId={user.id}
          catalogs={catalogs}
        />
      </div>
    </PageShell>
  );
}
