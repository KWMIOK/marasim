"use client";

import { getCatalogDescription, getCatalogName } from "@/lib/catalog/localized";
import type { ResolvedVipComparisonPair } from "@/lib/templates/vip-showcase";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import type { InvitationAnimatedTemplate } from "@/types/events";
import { cn } from "@/lib/utils/cn";

const GRADIENTS = [
  "linear-gradient(160deg, rgb(18 16 12) 0%, rgb(201 162 39 / 0.45) 100%)",
  "linear-gradient(160deg, rgb(12 12 12) 0%, rgb(154 132 85 / 0.5) 100%)",
  "linear-gradient(160deg, rgb(20 18 14) 0%, rgb(232 213 163 / 0.35) 100%)",
  "linear-gradient(160deg, rgb(8 8 8) 0%, rgb(201 162 39 / 0.3) 100%)",
];

function TemplatePreviewThumb({
  template,
  tier,
}: {
  template: InvitationAnimatedTemplate;
  tier: "standard" | "vip";
}) {
  const { t, locale } = useTranslation();
  const description = getCatalogDescription(template, locale);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span
        className={cn(
          "mb-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          tier === "vip"
            ? "border border-border-gold-strong bg-gold-light/15 text-gold-light"
            : "border border-border bg-surface text-muted"
        )}
      >
        {t(tier === "vip" ? "vipShowcase.comparison.vipLabel" : "vipShowcase.comparison.standardLabel")}
      </span>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border-gold/40">
        {template.preview_url ? (
          <img
            src={template.preview_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: GRADIENTS[template.sort_order % GRADIENTS.length] }}
          />
        )}
        {tier === "vip" ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        ) : null}
      </div>
      <p className="mt-2 truncate text-sm font-medium text-gold-light">
        {getCatalogName(template, locale)}
      </p>
      {description ? (
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  );
}

function ComparisonPairRow({ pair }: { pair: ResolvedVipComparisonPair }) {
  const { t } = useTranslation();

  return (
    <article className="surface-muted rounded-2xl p-4">
      <p className="text-xs leading-relaxed text-muted">
        {t(`vipShowcase.comparison.highlights.${pair.highlightKey}` as TranslationKey)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <TemplatePreviewThumb template={pair.standard} tier="standard" />
        <TemplatePreviewThumb template={pair.vip} tier="vip" />
      </div>
    </article>
  );
}

export function VipTemplateComparison({ pairs }: { pairs: ResolvedVipComparisonPair[] }) {
  const { t } = useTranslation();

  if (pairs.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-medium text-gold-light">{t("vipShowcase.comparison.title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {t("vipShowcase.comparison.subtitle")}
      </p>
      <div className="mt-4 space-y-4">
        {pairs.map((pair) => (
          <ComparisonPairRow key={pair.id} pair={pair} />
        ))}
      </div>
    </section>
  );
}
