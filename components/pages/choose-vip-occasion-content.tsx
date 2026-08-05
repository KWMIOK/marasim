"use client";

import Link from "next/link";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { VipAdvantagesSection } from "@/components/vip/vip-advantages-section";
import { VipTemplateComparison } from "@/components/vip/vip-template-comparison";
import { saveOccasionFlow } from "@/lib/flow/occasion-flow";
import { useOccasionFlowPersistence } from "@/hooks/use-occasion-flow";
import { resolveVipComparisonPairs } from "@/lib/templates/vip-showcase";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { InvitationAnimatedTemplate } from "@/types/events";

export function ChooseVipOccasionContent({
  templates,
}: {
  templates: InvitationAnimatedTemplate[];
}) {
  const { t } = useTranslation();
  const comparisonPairs = resolveVipComparisonPairs(templates);

  useOccasionFlowPersistence({
    step: "occasion",
    category: "vip",
    occasion: null,
    templateId: null,
  });

  return (
    <AppPageShell>
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("chooseOccasion.vip.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("vipShowcase.subtitle")}</p>
      </header>

      <div className="mt-8 space-y-8">
        <VipAdvantagesSection />
        <VipTemplateComparison pairs={comparisonPairs} />
      </div>

      <div className="mt-10">
        <Link
          href={ROUTES.occasionsVipRequest}
          onClick={() =>
            saveOccasionFlow({
              step: "occasion",
              category: "vip",
              occasion: null,
              templateId: null,
            })
          }
          className="btn-gold flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
        >
          {t("vipShowcase.continue")}
        </Link>
      </div>
    </AppPageShell>
  );
}
