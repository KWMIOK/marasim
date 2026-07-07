import type { CeremonyEventType, InvitationLanguage } from "@/types/events";

export const EVENT_TYPE_OPTIONS: Array<{
  value: CeremonyEventType;
  label: string;
}> = [
  { value: "wedding", label: "Wedding" },
  { value: "katb_ktab", label: "Katb Ktab" },
  { value: "engagement", label: "Engagement" },
  { value: "henna", label: "Henna" },
  { value: "birthday", label: "Birthday" },
  { value: "graduation", label: "Graduation" },
];

export const COUPLE_EVENT_TYPES: CeremonyEventType[] = [
  "wedding",
  "katb_ktab",
  "engagement",
  "henna",
];

export const SINGLE_NAME_EVENT_TYPES: CeremonyEventType[] = [
  "birthday",
  "graduation",
];

export function isCoupleEventType(type: CeremonyEventType): boolean {
  return COUPLE_EVENT_TYPES.includes(type);
}

export function defaultEventTitle(
  type: CeremonyEventType,
  groom: string,
  bride: string,
  honoree: string
): string {
  const typeLabel =
    EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Event";

  if (isCoupleEventType(type)) {
    if (groom && bride) return `${groom} & ${bride} — ${typeLabel}`;
    if (groom || bride) return `${groom || bride} — ${typeLabel}`;
  } else if (honoree) {
    return `${honoree} — ${typeLabel}`;
  }

  return typeLabel;
}

export const LANGUAGE_OPTIONS: Array<{
  value: InvitationLanguage;
  label: string;
}> = [
  { value: "ar", label: "Arabic" },
  { value: "en", label: "English" },
];

export const DEFAULT_FEATURE_TOGGLES = {
  confetti: true,
  background_music: false,
  show_language_selector: true,
  live_photo_album: false,
  guest_comments: false,
  guest_book: false,
  rsvp: true,
  dress_code: false,
  important_notes: false,
  invitation_protection: false,
  whatsapp_messages: true,
} as const;
