import type { OccasionTypeId } from "@/lib/events/categories";

export type ReceptionSession = {
  token: string;
  eventDisplayName: string;
  eventDate: string | null;
  occasion: OccasionTypeId | null;
  totalGuests: number;
  arrivedGuests: number;
  notArrivedGuests: number;
  updatedAt: string | null;
};

export function buildEventDisplayName(
  hostName: string,
  occasionLabel: string | null
): string {
  const trimmedHost = hostName.trim();
  if (!trimmedHost) {
    return occasionLabel ?? "Occasion";
  }

  if (!occasionLabel) {
    return trimmedHost;
  }

  return `${trimmedHost} ${occasionLabel}`;
}

export function formatReceptionEventDate(
  value: string | null,
  locale: "ar" | "en"
): string | null {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(locale === "ar" ? "ar-KW" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
