export type EventCategory = "personal" | "formal" | "vip";

export type OccasionTypeId =
  | "reception"
  | "dinner_party"
  | "wedding"
  | "graduation"
  | "birthday"
  | "family_occasion"
  | "engagement"
  | "katb_ktab"
  | "henna"
  | "corporate_event"
  | "gala_dinner"
  | "formal_dinner"
  | "private_celebration"
  | "exclusive_wedding"
  | "corporate_vip"
  | "royal_occasion";

export const EVENT_CATEGORIES: EventCategory[] = ["personal", "formal", "vip"];

export const OCCASION_TYPES_BY_CATEGORY: Record<EventCategory, OccasionTypeId[]> = {
  personal: [
    "reception",
    "dinner_party",
    "wedding",
    "graduation",
    "birthday",
    "family_occasion",
  ],
  formal: ["wedding", "engagement", "katb_ktab", "henna", "corporate_event", "gala_dinner"],
  vip: ["exclusive_wedding", "private_celebration", "corporate_vip", "royal_occasion"],
};

export function isEventCategory(value: string): value is EventCategory {
  return EVENT_CATEGORIES.includes(value as EventCategory);
}
