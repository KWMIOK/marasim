"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { OCCASION_TYPES_BY_CATEGORY, type EventCategory } from "@/lib/events/categories";
import { formatPriceKd } from "@/lib/pricing/occasion-pricing";
import { startOccasionCategoryFlow, saveOccasionFlow } from "@/lib/flow/occasion-flow";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

function EventTypeCapsule({ label }: { label: string }) {
  return (
    <span className="inline-flex select-none rounded-full border border-border-gold bg-surface px-3 py-1 text-xs text-gold-light pointer-events-none">
      {label}
    </span>
  );
}

function PriceFromLabel({ price }: { price: number | null }) {
  const { t } = useTranslation();

  if (price == null) return null;

  return (
    <p className="mt-2 text-sm font-medium text-gold-light">
      {t("chooseEventType.priceStartsFrom", { price: formatPriceKd(price) })}
    </p>
  );
}

function CategoryCard({
  title,
  children,
  href,
  category,
  className,
}: {
  title: string;
  children: ReactNode;
  href: string;
  category: EventCategory;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => startOccasionCategoryFlow(category)}
      className={cn(
        "surface-card block rounded-2xl p-5 shadow-lg shadow-black/20 transition hover:border-border-gold-strong",
        className
      )}
    >
      <h2 className="text-lg font-semibold text-gold-light">{title}</h2>
      {children}
    </Link>
  );
}

export function ChooseEventTypeContent({
  lowestPrices,
}: {
  lowestPrices: Record<EventCategory, number | null>;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    saveOccasionFlow({ step: "category" });
  }, []);

  function occasionLabel(category: EventCategory, type: string) {
    return t(`occasionTypes.${type}` as TranslationKey);
  }

  return (
    <AppPageShell>
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("chooseEventType.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("chooseEventType.subtitle")}</p>
      </header>

      <div className="mt-8 space-y-5">
        <CategoryCard
          title={t("chooseEventType.personal.title")}
          href={ROUTES.occasionCategory("personal")}
          category="personal"
        >
          <PriceFromLabel price={lowestPrices.personal} />
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASION_TYPES_BY_CATEGORY.personal.map((type) => (
              <EventTypeCapsule key={type} label={occasionLabel("personal", type)} />
            ))}
          </div>
          <span className="btn-outline-gold mt-5 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium">
            {t("chooseEventType.continue")}
          </span>
        </CategoryCard>

        <CategoryCard
          title={t("chooseEventType.formal.title")}
          href={ROUTES.occasionCategory("formal")}
          category="formal"
        >
          <PriceFromLabel price={lowestPrices.formal} />
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASION_TYPES_BY_CATEGORY.formal.map((type) => (
              <EventTypeCapsule key={type} label={occasionLabel("formal", type)} />
            ))}
          </div>
          <span className="btn-outline-gold mt-5 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium">
            {t("chooseEventType.continue")}
          </span>
        </CategoryCard>

        <CategoryCard
          title={t("chooseEventType.vip.title")}
          href={ROUTES.occasionCategory("vip")}
          category="vip"
        >
          <PriceFromLabel price={lowestPrices.vip} />
          <p className="mt-2 text-sm text-muted">{t("chooseEventType.vip.subtitle")}</p>
          <span className="btn-gold mt-5 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium">
            {t("chooseEventType.vip.cta")}
          </span>
          <p className="mt-3 text-center text-xs text-muted">{t("chooseEventType.vip.followUp")}</p>
        </CategoryCard>

        <article className="surface-muted rounded-2xl p-5 text-sm leading-relaxed text-muted pointer-events-none select-none">
          {t("chooseEventType.infoCard")}
        </article>
      </div>
    </AppPageShell>
  );
}
