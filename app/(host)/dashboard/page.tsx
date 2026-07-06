import { PageShell } from "@/components/shared/page-shell";

export default function HostIndexPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">Your Events</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Select an event to view RSVP analytics and distribute invitations.
      </p>
    </PageShell>
  );
}
