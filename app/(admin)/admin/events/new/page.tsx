import { PageShell } from "@/components/shared/page-shell";

export default function NewEventPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">Create Event</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Event creator form: template type, colors, content slots, and guest import.
      </p>
    </PageShell>
  );
}
