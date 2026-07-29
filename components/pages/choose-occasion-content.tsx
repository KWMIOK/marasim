"use client";

import { useState } from "react";
import Link from "next/link";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { OccasionTypeIcon } from "@/components/occasions/occasion-type-icon";
import {
  OCCASION_TYPES_BY_CATEGORY,
  type EventCategory,
  type OccasionTypeId,
} from "@/lib/events/categories";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

function buildCreateHref(category: EventCategory, occasion: OccasionTypeId | null, flow: "templates" | "custom") {
  const params = new URLSearchParams({ category, flow });
  if (occasion) params.set("occasion", occasion);
  return `${ROUTES.create}?${params.toString()}`;
}

function ProceedCard({
  title,
  description,
  buttonLabel,
  href,
  disabled,
  variant = "outline",
}: {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  disabled?: boolean;
  variant?: "outline" | "gold";
}) {
  const buttonClass =
    variant === "gold"
      ? "btn-gold rounded-xl px-4 py-2.5 text-sm font-medium"
      : "btn-outline-gold rounded-xl px-4 py-2.5 text-sm font-medium";

  return (
    <article className="surface-card rounded-2xl p-5 shadow-lg shadow-black/20">
      <h3 className="text-base font-semibold text-gold-light">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      {disabled ? (
        <button type="button" disabled className={cn(buttonClass, "mt-5 w-full opacity-45")}>
          {buttonLabel}
        </button>
      ) : (
        <Link href={href} className={cn(buttonClass, "mt-5 flex w-full items-center justify-center")}>
          {buttonLabel}
        </Link>
      )}
    </article>
  );
}

export function ChooseOccasionContent({ category }: { category: EventCategory }) {
  const { t } = useTranslation();
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTypeId | null>(null);
  const occasionTypes = OCCASION_TYPES_BY_CATEGORY[category];
  const categoryTitleKey = `chooseOccasion.${category}.title` as TranslationKey;
  const hasSelection = selectedOccasion !== null;

  return (
    <AppPageShell>
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t(categoryTitleKey)}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("chooseOccasion.subtitle")}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-gold-light">{t("chooseOccasion.occasionTypes")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {occasionTypes.map((type) => {
            const selected = selectedOccasion === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedOccasion(type)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-[8.5rem] flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition",
                  selected
                    ? "btn-gold border-border-gold-strong shadow-lg shadow-black/25 [&_svg]:text-[#0a0a0a]"
                    : "surface-card hover:border-border-gold-strong"
                )}
              >
                <OccasionTypeIcon type={type} />
                <span
                  className={cn(
                    "text-sm font-medium leading-snug",
                    selected ? "text-[#0a0a0a]" : "text-gold-light"
                  )}
                >
                  {t(`occasionTypes.${type}` as TranslationKey)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-gold-light">{t("chooseOccasion.howToProceed")}</h2>
        <div className="mt-4 space-y-4">
          <ProceedCard
            title={t("chooseOccasion.readyTemplates.title")}
            description={t("chooseOccasion.readyTemplates.description")}
            buttonLabel={t("chooseOccasion.readyTemplates.cta")}
            href={buildCreateHref(category, selectedOccasion, "templates")}
            disabled={!hasSelection}
          />
          <ProceedCard
            title={t("chooseOccasion.bespokeDesign.title")}
            description={t("chooseOccasion.bespokeDesign.description")}
            buttonLabel={t("chooseOccasion.bespokeDesign.cta")}
            href={buildCreateHref(category, selectedOccasion, "custom")}
            disabled={!hasSelection}
            variant="gold"
          />
        </div>
        {!hasSelection ? (
          <p className="mt-3 text-center text-xs text-muted">{t("chooseOccasion.selectOccasionHint")}</p>
        ) : null}
      </section>
    </AppPageShell>
  );
}
