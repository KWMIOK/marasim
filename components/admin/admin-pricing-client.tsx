"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOccasionPricingTier,
  deleteOccasionPricingTier,
  updateOccasionPricingTier,
} from "@/lib/actions/occasion-pricing";
import {
  formatPriceKd,
  getLowestPriceByCategory,
  groupTiersByCategory,
  type OccasionPricingTier,
  type OccasionPricingTierInput,
} from "@/lib/pricing/occasion-pricing";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/events/categories";
import { PageShell } from "@/components/shared/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

type TierFormState = {
  guests_from: string;
  guests_to: string;
  price_kd: string;
};

const EMPTY_FORM: TierFormState = {
  guests_from: "",
  guests_to: "",
  price_kd: "",
};

function tierToForm(tier: OccasionPricingTier): TierFormState {
  return {
    guests_from: String(tier.guests_from),
    guests_to: String(tier.guests_to),
    price_kd: String(tier.price_kd),
  };
}

function parseTierForm(form: TierFormState, category: EventCategory): OccasionPricingTierInput | null {
  const guests_from = Number.parseInt(form.guests_from, 10);
  const guests_to = Number.parseInt(form.guests_to, 10);
  const price_kd = Number.parseFloat(form.price_kd);

  if (!Number.isInteger(guests_from) || !Number.isInteger(guests_to) || !Number.isFinite(price_kd)) {
    return null;
  }

  return { category, guests_from, guests_to, price_kd };
}

function CategoryPricingSection({
  category,
  tiers,
  lowestPrice,
  onChanged,
}: {
  category: EventCategory;
  tiers: OccasionPricingTier[];
  lowestPrice: number | null;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TierFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TierFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryTitleKey = `chooseEventType.${category}.title` as TranslationKey;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const input = parseTierForm(form, category);
    if (!input) {
      setError(t("admin.pricing.errors.invalid_fields"));
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await createOccasionPricingTier(input);
    setSubmitting(false);

    if (!result.success) {
      setError(t(`admin.pricing.errors.${result.error}` as TranslationKey));
      return;
    }

    setForm(EMPTY_FORM);
    onChanged();
  }

  async function handleUpdate(id: string) {
    const input = parseTierForm(editForm, category);
    if (!input) {
      setError(t("admin.pricing.errors.invalid_fields"));
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await updateOccasionPricingTier(id, input);
    setSubmitting(false);

    if (!result.success) {
      setError(t(`admin.pricing.errors.${result.error}` as TranslationKey));
      return;
    }

    setEditingId(null);
    onChanged();
  }

  async function handleDelete(id: string) {
    setSubmitting(true);
    setError(null);
    const result = await deleteOccasionPricingTier(id);
    setSubmitting(false);

    if (!result.success) {
      setError(t(`admin.pricing.errors.${result.error}` as TranslationKey));
      return;
    }

    if (editingId === id) setEditingId(null);
    onChanged();
  }

  function startEdit(tier: OccasionPricingTier) {
    setEditingId(tier.id);
    setEditForm(tierToForm(tier));
    setError(null);
  }

  return (
    <section className="surface-card rounded-2xl p-5 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gold-light">{t(categoryTitleKey)}</h2>
          {lowestPrice != null ? (
            <p className="mt-1 text-sm text-muted">
              {t("admin.pricing.cardStartsFrom", { price: formatPriceKd(lowestPrice) })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {tiers.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.pricing.noTiers")}</p>
        ) : (
          tiers.map((tier) =>
            editingId === tier.id ? (
              <div key={tier.id} className="surface-muted rounded-xl p-4">
                <TierFields form={editForm} onChange={setEditForm} idPrefix={`edit-${tier.id}`} />
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleUpdate(tier.id)}
                    className="btn-gold rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    {t("common.save")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setEditingId(null)}
                    className="btn-outline-gold rounded-lg px-3 py-2 text-sm font-medium"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <article
                key={tier.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-gold px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gold-light">
                    {t("admin.pricing.guestRange", {
                      from: String(tier.guests_from),
                      to: String(tier.guests_to),
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t("admin.pricing.tierPrice", { price: formatPriceKd(tier.price_kd) })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => startEdit(tier)}
                    className="btn-outline-gold rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    {t("admin.pricing.editTier")}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDelete(tier.id)}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300"
                  >
                    {t("admin.pricing.deleteTier")}
                  </button>
                </div>
              </article>
            )
          )
        )}
      </div>

      <form onSubmit={handleCreate} className="mt-6 border-t border-border-gold pt-5">
        <h3 className="text-sm font-medium text-gold-light">{t("admin.pricing.addTier")}</h3>
        <TierFields form={form} onChange={setForm} idPrefix={`new-${category}`} />
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="btn-gold mt-4 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          {submitting ? t("common.loading") : t("admin.pricing.addTier")}
        </button>
      </form>
    </section>
  );
}

function TierFields({
  form,
  onChange,
  idPrefix,
}: {
  form: TierFormState;
  onChange: (form: TierFormState) => void;
  idPrefix: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-from`}>{t("admin.pricing.guestsFrom")}</Label>
        <Input
          id={`${idPrefix}-from`}
          type="number"
          min={0}
          inputMode="numeric"
          value={form.guests_from}
          onChange={(event) => onChange({ ...form, guests_from: event.target.value })}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-to`}>{t("admin.pricing.guestsTo")}</Label>
        <Input
          id={`${idPrefix}-to`}
          type="number"
          min={0}
          inputMode="numeric"
          value={form.guests_to}
          onChange={(event) => onChange({ ...form, guests_to: event.target.value })}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-price`}>{t("admin.pricing.priceKd")}</Label>
        <Input
          id={`${idPrefix}-price`}
          type="number"
          min={0}
          step="0.001"
          inputMode="decimal"
          value={form.price_kd}
          onChange={(event) => onChange({ ...form, price_kd: event.target.value })}
          className="mt-1"
          required
        />
      </div>
    </div>
  );
}

export function AdminPricingClient({ tiers }: { tiers: OccasionPricingTier[] }) {
  const { t } = useTranslation();
  const router = useRouter();

  const grouped = useMemo(() => groupTiersByCategory(tiers), [tiers]);
  const lowestPrices = useMemo(() => getLowestPriceByCategory(tiers), [tiers]);

  function onChanged() {
    router.refresh();
  }

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold text-gold-light">{t("admin.pricing.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("admin.pricing.subtitle")}</p>

      <div className="mt-8 space-y-6">
        {EVENT_CATEGORIES.map((category) => (
          <CategoryPricingSection
            key={category}
            category={category}
            tiers={grouped[category]}
            lowestPrice={lowestPrices[category]}
            onChanged={onChanged}
          />
        ))}
      </div>
    </PageShell>
  );
}
