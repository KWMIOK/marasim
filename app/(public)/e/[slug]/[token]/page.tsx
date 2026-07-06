import { PageShell } from "@/components/shared/page-shell";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;

  return (
    <main className="min-h-full bg-zinc-950 text-white">
      <PageShell className="max-w-lg py-10">
        <p className="text-xs uppercase tracking-widest text-rose-400">
          Invitation Preview
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Dynamic Template</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Slug: {slug} · Token: {token.slice(0, 8)}…
        </p>
        <p className="mt-6 text-sm text-zinc-500">
          Standard/VIP template renderer, countdown, RSVP form, and locale toggle
          will hydrate from Supabase via get_guest_invitation RPC.
        </p>
      </PageShell>
    </main>
  );
}
