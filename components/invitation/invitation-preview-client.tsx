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
    <main className="min-h-full">
      <PageShell className="max-w-lg py-10">
        <p className="text-xs uppercase tracking-widest text-gold">{t("invitation.preview")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gradient-gold">
          {t("invitation.dynamicTemplate")}
        </h1>
        <p className="mt-2 text-sm text-gold-muted">
          {slug} · {tokenPreview}…
        </p>
        <p className="mt-6 text-sm text-muted">{t("invitation.previewHint")}</p>
      </PageShell>
    </main>
  );
}
