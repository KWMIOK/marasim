import type { EventCategory, OccasionTypeId } from "@/lib/events/categories";

export type HostInvitation = {
  id: string;
  templateId: string;
  eventDisplayName: string;
  eventDate: string | null;
  category: EventCategory | null;
  occasion: OccasionTypeId | null;
  guestUrl: string;
  receptionistUrl: string;
  guestQrEnabled: boolean;
  createdAt: string;
};

const STORAGE_KEY = "marasim_host_invitations";

function canUseStorage() {
  return typeof window !== "undefined";
}

function createInvitationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `inv-${Date.now()}`;
}

function parseHostInvitations(value: unknown): HostInvitation[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is HostInvitation => {
      if (!item || typeof item !== "object") return false;
      const record = item as Partial<HostInvitation>;
      return (
        typeof record.id === "string" &&
        typeof record.templateId === "string" &&
        typeof record.eventDisplayName === "string" &&
        typeof record.guestUrl === "string" &&
        typeof record.receptionistUrl === "string" &&
        typeof record.createdAt === "string" &&
        (record.guestQrEnabled === undefined || typeof record.guestQrEnabled === "boolean")
      );
    })
    .map((item) => ({
      ...item,
      guestQrEnabled: item.guestQrEnabled ?? true,
    }));
}

export function getHostInvitations(): HostInvitation[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseHostInvitations(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function getHostInvitation(id: string): HostInvitation | null {
  return getHostInvitations().find((invitation) => invitation.id === id) ?? null;
}

export function saveHostInvitation(
  input: Omit<HostInvitation, "id" | "createdAt"> & { id?: string; createdAt?: string }
): HostInvitation {
  const invitation: HostInvitation = {
    id: input.id ?? createInvitationId(),
    templateId: input.templateId,
    eventDisplayName: input.eventDisplayName,
    eventDate: input.eventDate,
    category: input.category,
    occasion: input.occasion,
    guestUrl: input.guestUrl,
    receptionistUrl: input.receptionistUrl,
    guestQrEnabled: input.guestQrEnabled ?? true,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  if (!canUseStorage()) return invitation;

  const existing = getHostInvitations().filter((item) => item.id !== invitation.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([invitation, ...existing]));

  return invitation;
}

export function buildInvitationSuccessPath(invitation: HostInvitation) {
  const params = new URLSearchParams();
  if (invitation.category) params.set("category", invitation.category);
  if (invitation.occasion) params.set("occasion", invitation.occasion);
  params.set("invitation", invitation.id);
  const query = params.toString();
  return `/templates/${invitation.templateId}/success${query ? `?${query}` : ""}`;
}
