"use client";

import Link from "next/link";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { SlideToChoose } from "@/components/templates/slide-to-choose";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { InvitationAnimatedTemplate } from "@/types/events";
import { useRouter, useSearchParams } from "next/navigation";

function PreviewBackground({ template }: { template: InvitationAnimatedTemplate }) {
  if (template.preview_url) {
    return (
      <img
        src={template.preview_url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(165deg, rgb(8 8 8) 0%, rgb(201 162 39 / 0.35) 55%, rgb(18 16 12) 100%)",
      }}
    />
  );
}

export function TemplatePreviewContent({ template }: { template: InvitationAnimatedTemplate }) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const browseQuery = buildTemplateBrowseQuery({
    category: searchParams.get("category"),
    occasion: searchParams.get("occasion"),
  });

  function handleChooseComplete() {
    router.push(`${ROUTES.templates.customize(template.id)}${browseQuery}`);
  }

  return (
    <AppPageShell className="pb-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gold-light">{t("browseTemplates.previewTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{template.name}</p>
      </header>

      <article className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-border-gold shadow-xl shadow-black/30">
        <PreviewBackground template={template} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 text-center">
          <h2 className="text-lg font-semibold text-gold-light">{template.name}</h2>
          {template.description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">{template.description}</p>
          ) : null}
          <p className="mt-4 text-xs uppercase tracking-wide text-gold-muted">
            {t("browseTemplates.previewHint")}
          </p>
        </div>
      </article>

      <div className="mt-6">
        <SlideToChoose label={t("browseTemplates.chooseTemplate")} onComplete={handleChooseComplete} />
      </div>

      <Link
        href={`${ROUTES.templates.browse}${browseQuery}`}
        className="btn-outline-gold mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-medium"
      >
        {t("browseTemplates.backToBrowse")}
      </Link>
    </AppPageShell>
  );
}
