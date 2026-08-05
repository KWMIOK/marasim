import { OCCASION_TYPES_BY_CATEGORY, type OccasionTypeId } from "@/lib/events/categories";
import { isValidKuwaitMobile } from "@/lib/phone/kuwait";
import { toE164KuwaitMobile } from "@/lib/phone/format-e164";

export const VIP_DESIGN_LEAD_DAYS = 2;

const VIP_OCCASION_TYPES = new Set<OccasionTypeId>(OCCASION_TYPES_BY_CATEGORY.vip);

function parseIsoDate(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getMinVipOccasionDateIso(from = new Date()): string {
  const min = startOfDay(from);
  min.setDate(min.getDate() + VIP_DESIGN_LEAD_DAYS);
  return toIsoDate(min);
}

export function isVipOccasionDateValid(isoDate: string, from = new Date()): boolean {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return false;

  const min = startOfDay(from);
  min.setDate(min.getDate() + VIP_DESIGN_LEAD_DAYS);

  return startOfDay(parsed).getTime() >= min.getTime();
}

export type VipRequestInput = {
  occasionType: string;
  phone: string;
  guestCount: number;
  occasionDate: string;
};

export type VipRequestValidationError =
  | "invalid_occasion"
  | "invalid_phone"
  | "invalid_guest_count"
  | "invalid_date"
  | "date_too_soon";

export function validateVipRequest(input: VipRequestInput): VipRequestValidationError | null {
  if (!VIP_OCCASION_TYPES.has(input.occasionType as OccasionTypeId)) {
    return "invalid_occasion";
  }

  if (!isValidKuwaitMobile(input.phone)) {
    return "invalid_phone";
  }

  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 50_000) {
    return "invalid_guest_count";
  }

  if (!input.occasionDate.trim()) {
    return "invalid_date";
  }

  if (!isVipOccasionDateValid(input.occasionDate)) {
    return "date_too_soon";
  }

  return null;
}

export function normalizeVipRequest(input: VipRequestInput) {
  return {
    occasionType: input.occasionType as OccasionTypeId,
    phone: toE164KuwaitMobile(input.phone),
    guestCount: input.guestCount,
    occasionDate: input.occasionDate,
  };
}
