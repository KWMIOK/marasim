"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { InvitationAnimatedTemplate } from "@/types/events";

export function TemplateCustomizeContent({ template }: { template: InvitationAnimatedTemplate }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const browseQuery = buildTemplateBrowseQuery({
    category: searchParams.get("category"),
    occasion: searchParams.get("occasion"),
  });

  return (
    <AppPageShell align="center">
      <h1 className="text-2xl font-semibold text-gold-light">{t("browseTemplates.customizeTitle")}</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        {t("browseTemplates.customizeSubtitle", { name: template.name })}
      </p>
      <Link
        href={`${ROUTES.templates.browse}${browseQuery}`}
        className="btn-outline-gold mt-8 rounded-xl px-5 py-2.5 text-sm font-medium"
      >
        {t("browseTemplates.backToBrowse")}
      </Link>
    </AppPageShell>
  );
}
