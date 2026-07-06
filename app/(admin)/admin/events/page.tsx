import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { ROUTES } from "@/lib/constants/routes";

export default function AdminEventsPage() {
  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Events</h1>
        <Link
          href={ROUTES.admin.newEvent}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          New Event
        </Link>
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Event list will load from Supabase. Create your first event to get started.
      </p>
    </PageShell>
  );
}
