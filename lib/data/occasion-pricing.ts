import { createClient } from "@/lib/supabase/server";
import {
  getLowestPriceByCategory,
  parseOccasionPricingTier,
  type OccasionPricingTier,
} from "@/lib/pricing/occasion-pricing";
import type { EventCategory } from "@/lib/events/categories";
import { EVENT_CATEGORIES } from "@/lib/events/categories";

export async function getOccasionPricingTiers(): Promise<OccasionPricingTier[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("occasion_pricing_tiers")
    .select("*")
    .order("category")
    .order("price_kd")
    .order("guests_from");

  if (error) {
    console.error("getOccasionPricingTiers:", error.message);
    return [];
  }

  if (!data?.length) {
    return [];
  }

  return data
    .map(parseOccasionPricingTier)
    .filter((tier): tier is OccasionPricingTier => tier !== null);
}

export async function getOccasionLowestPrices(): Promise<Record<EventCategory, number | null>> {
  const tiers = await getOccasionPricingTiers();
  return getLowestPriceByCategory(tiers);
}

export { EVENT_CATEGORIES };
