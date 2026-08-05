"use server";

import {
  normalizeVipRequest,
  validateVipRequest,
  type VipRequestInput,
  type VipRequestValidationError,
} from "@/lib/vip/request-form";

export type SubmitVipRequestResult =
  | { success: true }
  | { success: false; error: VipRequestValidationError };

export async function submitVipRequest(input: VipRequestInput): Promise<SubmitVipRequestResult> {
  const error = validateVipRequest(input);
  if (error) {
    return { success: false, error };
  }

  normalizeVipRequest(input);

  // TODO: persist request (database / CRM) and notify operations team.
  return { success: true };
}
