"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { SlideToChoose } from "@/components/templates/slide-to-choose";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import { isEventCategory } from "@/lib/events/categories";
import { isOccasionTypeId, saveOccasionFlow } from "@/lib/flow/occasion-flow";
import { useOccasionFlowPersistence } from "@/hooks/use-occasion-flow";
import { ROUTES } from "@/lib/constants/routes";
import { getCatalogDescription, getCatalogName } from "@/lib/catalog/localized";
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
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const occasionParam = searchParams.get("occasion");
  const category = categoryParam && isEventCategory(categoryParam) ? categoryParam : null;
  const occasion = occasionParam && isOccasionTypeId(occasionParam) ? occasionParam : null;

  const browseQuery = buildTemplateBrowseQuery({
    category,
    occasion,
  });

  useOccasionFlowPersistence({
    step: "preview",
    category,
    occasion,
    templateId: template.id,
  });

  useEffect(() => {
    saveOccasionFlow({
      step: "preview",
      category,
      occasion,
      templateId: template.id,
    });
  }, [category, occasion, template.id]);

  function handleChooseComplete() {
    saveOccasionFlow({
      step: "customize",
      category,
      occasion,
      templateId: template.id,
    });
    router.push(`${ROUTES.templates.customize(template.id)}${browseQuery}`);
  }

  return (
    <AppPageShell className="pb-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-gold-light">{t("browseTemplates.previewTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{getCatalogName(template, locale)}</p>
      </header>

      <article className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-border-gold shadow-xl shadow-black/30">
        <PreviewBackground template={template} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 text-center">
          <h2 className="text-lg font-semibold text-gold-light">{getCatalogName(template, locale)}</h2>
          {getCatalogDescription(template, locale) ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {getCatalogDescription(template, locale)}
            </p>
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
