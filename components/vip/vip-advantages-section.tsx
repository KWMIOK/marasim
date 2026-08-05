"use client";

import { VIP_ADVANTAGE_KEYS } from "@/lib/templates/vip-showcase";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

function AdvantageIcon() {
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-sm text-gold-light"
    >
      ✦
    </span>
  );
}

export function VipAdvantagesSection() {
  const { t } = useTranslation();

  return (
    <section className="surface-card rounded-2xl p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-gold-light">
          {t("vipShowcase.advantages.title")}
        </h2>
        <span className="rounded-full border border-border-gold bg-surface px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {t("vipShowcase.advantages.demoBadge")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {t("vipShowcase.advantages.subtitle")}
      </p>
      <ul className="mt-5 space-y-3">
        {VIP_ADVANTAGE_KEYS.map((key) => (
          <li key={key} className="flex items-start gap-3">
            <AdvantageIcon />
            <div>
              <p className="text-sm font-medium text-gold-light">
                {t(`vipShowcase.advantages.items.${key}.title` as TranslationKey)}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {t(`vipShowcase.advantages.items.${key}.description` as TranslationKey)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-xl border border-border-gold/60 bg-surface/50 px-4 py-3 text-xs leading-relaxed text-muted">
        {t("vipShowcase.advantages.designLeadTimeNote")}
      </p>
    </section>
  );
}
