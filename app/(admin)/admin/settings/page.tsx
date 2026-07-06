import { PageShell } from "@/components/shared/page-shell";

export default function AdminSettingsPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Global platform settings and host management.
      </p>
    </PageShell>
  );
}
