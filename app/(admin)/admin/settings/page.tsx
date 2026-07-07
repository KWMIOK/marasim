import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { ROUTES } from "@/lib/constants/routes";

export default function AdminSettingsPage() {
  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Global platform settings and invitation catalog management.
      </p>
      <Link
        href={ROUTES.admin.catalog}
        className="mt-6 inline-block text-sm font-medium text-rose-600 hover:text-rose-700"
      >
        Manage invitation catalog →
      </Link>
    </PageShell>
  );
}
