"use client";

import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";

export function InvitationPreviewClient({
  slug,
  tokenPreview,
}: {
  slug: string;
  tokenPreview: string;
}) {
  const { t } = useTranslation();

  return (
    <main className="min-h-full bg-zinc-950 text-white">
      <PageShell className="max-w-lg py-10">
        <p className="text-xs uppercase tracking-widest text-rose-400">{t("invitation.preview")}</p>
        <h1 className="mt-2 text-2xl font-semibold">{t("invitation.dynamicTemplate")}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {slug} · {tokenPreview}…
        </p>
        <p className="mt-6 text-sm text-zinc-500">{t("invitation.previewHint")}</p>
      </PageShell>
    </main>
  );
}
