"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import {
  validateOccasionPricingTierInput,
  type OccasionPricingTierInput,
  type OccasionPricingValidationError,
} from "@/lib/pricing/occasion-pricing";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";

export type OccasionPricingActionResult =
  | { success: true; id?: string }
  | { success: false; error: OccasionPricingValidationError | "unauthorized" | "db_error" };

async function requireSuperAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return profile;
}

function revalidatePricingPaths() {
  revalidatePath(ROUTES.admin.pricing);
  revalidatePath(ROUTES.occasions);
}

export async function createOccasionPricingTier(
  input: OccasionPricingTierInput
): Promise<OccasionPricingActionResult> {
  try {
    await requireSuperAdmin();
    const validationError = validateOccasionPricingTierInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = await createClient();
    const payload = {
      category: input.category,
      guests_from: input.guests_from,
      guests_to: input.guests_to,
      price_kd: input.price_kd,
      sort_order: 0,
    };

    const { data, error } = await (supabase.from("occasion_pricing_tiers") as ReturnType<
      typeof supabase.from
    >)
      .insert(payload as never)
      .select("id")
      .single();

    if (error || !data) {
      console.error("createOccasionPricingTier:", error?.message ?? "Insert failed");
      return { success: false, error: "db_error" };
    }

    revalidatePricingPaths();
    return { success: true, id: (data as { id: string }).id };
  } catch (err) {
    console.error("createOccasionPricingTier:", err);
    return { success: false, error: "unauthorized" };
  }
}

export async function updateOccasionPricingTier(
  id: string,
  input: OccasionPricingTierInput
): Promise<OccasionPricingActionResult> {
  try {
    await requireSuperAdmin();
    const validationError = validateOccasionPricingTierInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const supabase = await createClient();
    const payload = {
      category: input.category,
      guests_from: input.guests_from,
      guests_to: input.guests_to,
      price_kd: input.price_kd,
      sort_order: 0,
    };

    const { error } = await (supabase.from("occasion_pricing_tiers") as ReturnType<
      typeof supabase.from
    >)
      .update(payload as never)
      .eq("id", id);

    if (error) {
      console.error("updateOccasionPricingTier:", error.message);
      return { success: false, error: "db_error" };
    }

    revalidatePricingPaths();
    return { success: true, id };
  } catch (err) {
    console.error("updateOccasionPricingTier:", err);
    return { success: false, error: "unauthorized" };
  }
}

export async function deleteOccasionPricingTier(id: string): Promise<OccasionPricingActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("occasion_pricing_tiers").delete().eq("id", id);

    if (error) {
      console.error("deleteOccasionPricingTier:", error.message);
      return { success: false, error: "db_error" };
    }

    revalidatePricingPaths();
    return { success: true, id };
  } catch (err) {
    console.error("deleteOccasionPricingTier:", err);
    return { success: false, error: "unauthorized" };
  }
}
