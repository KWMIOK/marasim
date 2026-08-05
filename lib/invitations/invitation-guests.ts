export type InvitationGuestSource = "manual" | "contacts" | "import";

export type InvitationGuest = {
  id: string;
  invitationId: string;
  name: string;
  phone: string;
  source: InvitationGuestSource;
  createdAt: string;
};

const STORAGE_KEY = "marasim_invitation_guests";

function canUseStorage() {
  return typeof window !== "undefined";
}

function createGuestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function parseInvitationGuests(value: unknown): InvitationGuest[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is InvitationGuest => {
    if (!item || typeof item !== "object") return false;
    const record = item as Partial<InvitationGuest>;
    return (
      typeof record.id === "string" &&
      typeof record.invitationId === "string" &&
      typeof record.name === "string" &&
      typeof record.phone === "string" &&
      (record.source === "manual" ||
        record.source === "contacts" ||
        record.source === "import") &&
      typeof record.createdAt === "string"
    );
  });
}

export function getInvitationGuests(invitationId: string): InvitationGuest[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseInvitationGuests(JSON.parse(raw)).filter(
      (guest) => guest.invitationId === invitationId
    );
  } catch {
    return [];
  }
}

export function addInvitationGuests(
  invitationId: string,
  guests: Array<{ name: string; phone: string }>,
  source: InvitationGuestSource
): InvitationGuest[] {
  if (!canUseStorage() || guests.length === 0) return [];

  const existing = parseInvitationGuests(
    JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  );
  const createdAt = new Date().toISOString();
  const added = guests.map((guest) => ({
    id: createGuestId(),
    invitationId,
    name: guest.name.trim(),
    phone: guest.phone.trim(),
    source,
    createdAt,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...added, ...existing]));
  return added;
}

export function countInvitationGuests(invitationId: string): number {
  return getInvitationGuests(invitationId).length;
}
