"use client";

import { useMemo, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { AppDatePickerField } from "@/components/templates/app-date-picker";
import { OccasionTypeIcon } from "@/components/occasions/occasion-type-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitVipRequest } from "@/lib/actions/vip-request";
import { OCCASION_TYPES_BY_CATEGORY, type OccasionTypeId } from "@/lib/events/categories";
import { saveOccasionFlow } from "@/lib/flow/occasion-flow";
import { formatKuwaitMobileInput, isValidKuwaitMobile } from "@/lib/phone/kuwait";
import { getMinVipOccasionDateIso } from "@/lib/vip/request-form";
import { useOccasionFlowPersistence } from "@/hooks/use-occasion-flow";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export function VipRequestContent() {
  const { t } = useTranslation();
  const occasionTypes = OCCASION_TYPES_BY_CATEGORY.vip;
  const minOccasionDate = useMemo(() => getMinVipOccasionDateIso(), []);

  const [occasionType, setOccasionType] = useState<OccasionTypeId | null>(null);
  const [phone, setPhone] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const phoneValid = isValidKuwaitMobile(phone);
  const guestCountNumber = Number.parseInt(guestCount, 10);
  const guestCountValid =
    guestCount.trim() !== "" && Number.isInteger(guestCountNumber) && guestCountNumber >= 1;

  useOccasionFlowPersistence({
    step: "occasion",
    category: "vip",
    occasion: occasionType,
    templateId: null,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!occasionType || submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await submitVipRequest({
      occasionType,
      phone,
      guestCount: guestCountNumber,
      occasionDate,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(t(`vipRequest.errors.${result.error}` as TranslationKey));
      return;
    }

    saveOccasionFlow({
      step: "occasion",
      category: "vip",
      occasion: occasionType,
      templateId: null,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AppPageShell>
        <article className="surface-card rounded-2xl p-6 text-center shadow-lg shadow-black/20">
          <h1 className="text-xl font-semibold text-gold-light">{t("vipRequest.successTitle")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("vipRequest.successMessage")}</p>
        </article>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("vipRequest.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("vipRequest.subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <section>
          <Label>{t("vipRequest.occasionType")}</Label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {occasionTypes.map((type) => {
              const selected = occasionType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOccasionType(type)}
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

        <section>
          <Label htmlFor="vipPhone">{t("vipRequest.phone")}</Label>
          <div dir="ltr" className="surface-card mt-2 flex overflow-hidden rounded-xl border border-border-gold">
            <span className="flex shrink-0 items-center border-r border-border-gold px-3 text-sm text-gold-light">
              +965
            </span>
            <input
              id="vipPhone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => setPhone(formatKuwaitMobileInput(event.target.value))}
              placeholder="5XXXXXXX"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-gold-light outline-none placeholder:text-gold-muted"
              autoComplete="tel-national"
              required
            />
          </div>
        </section>

        <section>
          <Label htmlFor="vipGuestCount">{t("vipRequest.guestCount")}</Label>
          <Input
            id="vipGuestCount"
            type="number"
            min={1}
            inputMode="numeric"
            value={guestCount}
            onChange={(event) => setGuestCount(event.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder={t("vipRequest.guestCountPlaceholder")}
            className="mt-2 min-h-11 rounded-xl px-4 py-3"
            required
          />
        </section>

        <section>
          <AppDatePickerField
            label={t("vipRequest.occasionDate")}
            htmlFor="vipOccasionDate"
            value={occasionDate}
            onChange={setOccasionDate}
            minDate={minOccasionDate}
          />
          <p className="mt-2 text-xs leading-relaxed text-muted">{t("vipRequest.dateHint")}</p>
        </section>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={
            !occasionType || !phoneValid || !guestCountValid || !occasionDate || submitting
          }
          className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-40"
        >
          {submitting ? t("common.loading") : t("vipRequest.submit")}
        </button>
      </form>
    </AppPageShell>
  );
}
