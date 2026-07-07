import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";
import { ROUTES } from "@/lib/constants/routes";

export default function AdminCatalogPage() {
  return (
    <PageShell>
      <Link href={ROUTES.admin.settings} className="text-sm text-zinc-500 hover:text-zinc-700">
        ← Back to settings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Invitation catalog</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-500">
        Manage animated templates, themes, fonts, and font colors in Supabase tables:
        <code className="mx-1 rounded bg-zinc-100 px-1">invitation_animated_templates</code>,
        <code className="mx-1 rounded bg-zinc-100 px-1">invitation_themes</code>,
        <code className="mx-1 rounded bg-zinc-100 px-1">invitation_fonts</code>,
        <code className="mx-1 rounded bg-zinc-100 px-1">invitation_font_colors</code>.
        A full CRUD UI will be added with your partners — defaults are seeded in migration 002.
      </p>
    </PageShell>
  );
}
