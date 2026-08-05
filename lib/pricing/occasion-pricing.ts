import type { EventCategory } from "@/lib/events/categories";
import { EVENT_CATEGORIES } from "@/lib/events/categories";

export interface OccasionPricingTier {
  id: string;
  category: EventCategory;
  guests_from: number;
  guests_to: number;
  price_kd: number;
  sort_order: number;
}

export type OccasionPricingTierInput = {
  category: EventCategory;
  guests_from: number;
  guests_to: number;
  price_kd: number;
};

export type OccasionPricingValidationError =
  | "invalid_category"
  | "invalid_guest_range"
  | "invalid_price";

export function formatPriceKd(price: number): string {
  if (Number.isInteger(price)) return String(price);
  return price.toFixed(3).replace(/\.?0+$/, "");
}

export function getLowestPriceByCategory(
  tiers: OccasionPricingTier[]
): Record<EventCategory, number | null> {
  const lowest: Record<EventCategory, number | null> = {
    personal: null,
    formal: null,
    vip: null,
  };

  for (const category of EVENT_CATEGORIES) {
    const categoryTiers = tiers.filter((tier) => tier.category === category);
    if (categoryTiers.length === 0) continue;

    lowest[category] = Math.min(...categoryTiers.map((tier) => tier.price_kd));
  }

  return lowest;
}

export function validateOccasionPricingTierInput(
  input: OccasionPricingTierInput
): OccasionPricingValidationError | null {
  if (!EVENT_CATEGORIES.includes(input.category)) {
    return "invalid_category";
  }

  if (
    !Number.isInteger(input.guests_from) ||
    !Number.isInteger(input.guests_to) ||
    input.guests_from < 0 ||
    input.guests_to < input.guests_from
  ) {
    return "invalid_guest_range";
  }

  if (!Number.isFinite(input.price_kd) || input.price_kd < 0) {
    return "invalid_price";
  }

  return null;
}

export function groupTiersByCategory(
  tiers: OccasionPricingTier[]
): Record<EventCategory, OccasionPricingTier[]> {
  return {
    personal: tiers.filter((tier) => tier.category === "personal").sort(sortTiers),
    formal: tiers.filter((tier) => tier.category === "formal").sort(sortTiers),
    vip: tiers.filter((tier) => tier.category === "vip").sort(sortTiers),
  };
}

function sortTiers(a: OccasionPricingTier, b: OccasionPricingTier) {
  return a.price_kd - b.price_kd || a.guests_from - b.guests_from;
}

function parseNumericField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseIntegerField(value: unknown): number | null {
  const parsed = parseNumericField(value);
  if (parsed == null || !Number.isInteger(parsed)) return null;
  return parsed;
}

export function parseOccasionPricingTier(row: unknown): OccasionPricingTier | null {
  if (!row || typeof row !== "object") return null;

  const record = row as Record<string, unknown>;
  const category = record.category;

  if (category !== "personal" && category !== "formal" && category !== "vip") {
    return null;
  }

  if (typeof record.id !== "string") return null;

  const guests_from = parseIntegerField(record.guests_from);
  const guests_to = parseIntegerField(record.guests_to);
  const price_kd = parseNumericField(record.price_kd);
  const sort_order = parseIntegerField(record.sort_order) ?? 0;

  if (guests_from == null || guests_to == null || price_kd == null) {
    return null;
  }

  return {
    id: record.id,
    category,
    guests_from,
    guests_to,
    price_kd,
    sort_order,
  };
}
