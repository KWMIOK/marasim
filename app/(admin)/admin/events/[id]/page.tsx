import { PageShell } from "@/components/shared/page-shell";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-zinc-900">Event Details</h1>
      <p className="mt-2 text-sm text-zinc-500">Event ID: {id}</p>
    </PageShell>
  );
}
