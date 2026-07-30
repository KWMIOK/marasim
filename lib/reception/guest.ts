import type { CheckInStatus, RsvpStatus } from "@/types/database";

export type ReceptionGuestSummary = {
  guestToken: string;
  name: string;
  invitationNumber: string;
  rsvpStatus: RsvpStatus;
  companionCount: number;
  avatarUrl: string | null;
  checkInStatus: CheckInStatus;
  checkedInAt?: string | null;
  checkedInEntrance?: string | null;
};

export type ReceptionGuestDetail = ReceptionGuestSummary & {
  checkedInAt: string | null;
  checkedInEntrance?: string | null;
};

export function parseReceptionGuestSummary(value: unknown): ReceptionGuestSummary | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.guest_token !== "string" ||
    typeof record.name !== "string" ||
    typeof record.invitation_number !== "string"
  ) {
    return null;
  }

  return {
    guestToken: record.guest_token,
    name: record.name,
    invitationNumber: record.invitation_number,
    rsvpStatus: (record.rsvp_status as RsvpStatus) ?? "not_opened",
    companionCount: typeof record.companion_count === "number" ? record.companion_count : 0,
    avatarUrl: typeof record.avatar_url === "string" ? record.avatar_url : null,
    checkInStatus: (record.check_in_status as CheckInStatus) ?? "not_checked_in",
    checkedInAt: typeof record.checked_in_at === "string" ? record.checked_in_at : null,
    checkedInEntrance:
      typeof record.checked_in_entrance === "string" ? record.checked_in_entrance : null,
  };
}

export function parseReceptionGuestDetail(value: unknown): ReceptionGuestDetail | null {
  const summary = parseReceptionGuestSummary(value);
  if (!summary) return null;

  const record = value as Record<string, unknown>;

  return {
    ...summary,
    checkedInAt: typeof record.checked_in_at === "string" ? record.checked_in_at : null,
    checkedInEntrance:
      typeof record.checked_in_entrance === "string" ? record.checked_in_entrance : null,
  };
}

export function parseReceptionGuestSummaries(value: unknown): ReceptionGuestSummary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseReceptionGuestSummary)
    .filter((guest): guest is ReceptionGuestSummary => guest !== null);
}

export function getRsvpStatusLabelKey(status: RsvpStatus): string {
  switch (status) {
    case "confirmed":
      return "rsvpStatus.confirmed";
    case "declined":
      return "rsvpStatus.declined";
    case "maybe":
      return "rsvpStatus.maybe";
    case "not_opened":
      return "reception.rsvpNotOpened";
    case "opened_no_response":
      return "reception.rsvpNotSure";
    default:
      return "rsvpStatus.pending";
  }
}

export function getGuestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export type ReceptionGuestListFilter = "all" | "not_arrived" | "arrived" | "confirmed";

export type GuestStatusDisplay = {
  labelKey: string;
  tone: "green" | "lime" | "yellow" | "orange" | "red" | "muted";
};

export function getGuestStatusDisplay(guest: ReceptionGuestSummary): GuestStatusDisplay {
  if (guest.checkInStatus === "checked_in") {
    return { labelKey: "reception.statusArrived", tone: "green" };
  }

  switch (guest.rsvpStatus) {
    case "confirmed":
      return { labelKey: "rsvpStatus.confirmed", tone: "lime" };
    case "maybe":
      return { labelKey: "rsvpStatus.maybe", tone: "yellow" };
    case "opened_no_response":
      return { labelKey: "reception.rsvpNotSure", tone: "orange" };
    case "declined":
      return { labelKey: "rsvpStatus.declined", tone: "red" };
    case "not_opened":
      return { labelKey: "reception.rsvpNotOpened", tone: "muted" };
    default:
      return { labelKey: "reception.statusNotArrived", tone: "orange" };
  }
}

export function matchesGuestListFilter(
  guest: ReceptionGuestSummary,
  filter: ReceptionGuestListFilter
): boolean {
  switch (filter) {
    case "not_arrived":
      return guest.checkInStatus === "not_checked_in";
    case "arrived":
      return guest.checkInStatus === "checked_in";
    case "confirmed":
      return guest.rsvpStatus === "confirmed";
    case "all":
    default:
      return true;
  }
}

export function matchesGuestSearch(guest: ReceptionGuestSummary, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    guest.name.toLowerCase().includes(normalized) ||
    guest.invitationNumber.toLowerCase().includes(normalized)
  );
}

export const guestStatusToneClasses: Record<GuestStatusDisplay["tone"], string> = {
  green: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  lime: "border-lime-500/50 bg-lime-500/10 text-lime-300",
  yellow: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  orange: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  red: "border-red-500/50 bg-red-500/10 text-red-300",
  muted: "border-border-gold bg-surface text-muted",
};
