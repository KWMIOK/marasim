export const VENDOR_TYPES = [
  "photography",
  "videography",
  "live_band",
  "catering",
  "decoration",
  "lighting_av",
  "security",
  "other",
] as const;

export type VendorTypeId = (typeof VENDOR_TYPES)[number];

export function isVendorTypeId(value: string): value is VendorTypeId {
  return (VENDOR_TYPES as readonly string[]).includes(value);
}

export function clampVendorHeadcount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(500, Math.round(parsed));
}
