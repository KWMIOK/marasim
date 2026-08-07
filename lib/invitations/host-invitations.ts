import { ROUTES } from "@/lib/constants/routes";
import type { EventCategory, OccasionTypeId } from "@/lib/events/categories";
import {
  parseGuestInvitationUrl,
  parseReceptionistUrl,
} from "@/lib/invitations/parse-invitation-urls";

export type HostInvitation = {
  id: string;
  templateId: string;
  eventDisplayName: string;
  eventDate: string | null;
  category: EventCategory | null;
  occasion: OccasionTypeId | null;
  guestUrl: string;
  receptionistUrl: string;
  receptionSessionToken: string | null;
  guestQrEnabled: boolean;
  receptionStaffCount: number;
  location: string;
  locationDirections: string;
  mapsLat: number | null;
  mapsLng: number | null;
  mapsUrl: string;
  eventLogoUrl: string | null;
  emergencyPasscode: string | null;
  noKidsAllowed: boolean;
  dressCode: boolean;
  menOnly: boolean;
  womenOnly: boolean;
  couplesOnly: boolean;
  noPhotos: boolean;
  publicRegistrationToken: string | null;
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
      receptionStaffCount:
        typeof item.receptionStaffCount === "number" && item.receptionStaffCount >= 0
          ? Math.min(20, Math.round(item.receptionStaffCount))
          : 0,
      location: typeof item.location === "string" ? item.location : "",
      locationDirections:
        typeof item.locationDirections === "string" ? item.locationDirections : "",
      mapsLat: typeof item.mapsLat === "number" ? item.mapsLat : null,
      mapsLng: typeof item.mapsLng === "number" ? item.mapsLng : null,
      mapsUrl: typeof item.mapsUrl === "string" ? item.mapsUrl : "",
      eventLogoUrl:
        typeof item.eventLogoUrl === "string" && item.eventLogoUrl.startsWith("data:image/")
          ? item.eventLogoUrl
          : null,
      emergencyPasscode:
        typeof item.emergencyPasscode === "string" ? item.emergencyPasscode : null,
      receptionSessionToken:
        typeof item.receptionSessionToken === "string"
          ? item.receptionSessionToken
          : parseReceptionistUrl(item.receptionistUrl),
      noKidsAllowed: item.noKidsAllowed ?? false,
      dressCode: item.dressCode ?? false,
      menOnly: item.menOnly ?? false,
      womenOnly: item.womenOnly ?? false,
      couplesOnly: item.couplesOnly ?? false,
      noPhotos: item.noPhotos ?? false,
      publicRegistrationToken:
        typeof item.publicRegistrationToken === "string"
          ? item.publicRegistrationToken
          : null,
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
  input: Omit<
    HostInvitation,
    "id" | "createdAt" | "receptionStaffCount" | "location" | "locationDirections" | "mapsLat" | "mapsLng" | "mapsUrl" | "eventLogoUrl" | "emergencyPasscode" | "receptionSessionToken" | "noKidsAllowed" | "dressCode" | "menOnly" | "womenOnly" | "couplesOnly" | "noPhotos" | "publicRegistrationToken"
  > & {
    id?: string;
    createdAt?: string;
    receptionStaffCount?: number;
    location?: string;
    locationDirections?: string;
    mapsLat?: number | null;
    mapsLng?: number | null;
    mapsUrl?: string;
    eventLogoUrl?: string | null;
    emergencyPasscode?: string | null;
    receptionSessionToken?: string | null;
    noKidsAllowed?: boolean;
    dressCode?: boolean;
    menOnly?: boolean;
    womenOnly?: boolean;
    couplesOnly?: boolean;
    noPhotos?: boolean;
    publicRegistrationToken?: string | null;
  }
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
    receptionSessionToken: input.receptionSessionToken ?? null,
    guestQrEnabled: input.guestQrEnabled ?? true,
    receptionStaffCount: input.receptionStaffCount ?? 0,
    location: input.location ?? "",
    locationDirections: input.locationDirections ?? "",
    mapsLat: input.mapsLat ?? null,
    mapsLng: input.mapsLng ?? null,
    mapsUrl: input.mapsUrl ?? "",
    eventLogoUrl: input.eventLogoUrl ?? null,
    emergencyPasscode: input.emergencyPasscode ?? null,
    noKidsAllowed: input.noKidsAllowed ?? false,
    dressCode: input.dressCode ?? false,
    menOnly: input.menOnly ?? false,
    womenOnly: input.womenOnly ?? false,
    couplesOnly: input.couplesOnly ?? false,
    noPhotos: input.noPhotos ?? false,
    publicRegistrationToken: input.publicRegistrationToken ?? null,
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

export function buildInvitationShareQuery(invitation: HostInvitation) {
  const params = new URLSearchParams();
  if (invitation.category) params.set("category", invitation.category);
  if (invitation.occasion) params.set("occasion", invitation.occasion);
  params.set("invitation", invitation.id);
  return params.toString();
}

export function buildInvitationSharePath(invitation: HostInvitation) {
  const query = buildInvitationShareQuery(invitation);
  return `/templates/${invitation.templateId}/success/share${query ? `?${query}` : ""}`;
}

export function buildInvitationShareMethodPath(
  invitation: HostInvitation,
  method: "manual" | "contacts" | "import" | "public-link"
) {
  const query = buildInvitationShareQuery(invitation);
  return `/templates/${invitation.templateId}/success/share/${method}${query ? `?${query}` : ""}`;
}

export function getEventSlugFromInvitation(invitation: HostInvitation): string | null {
  return parseGuestInvitationUrl(invitation.guestUrl)?.eventSlug ?? null;
}

export function buildPublicRegistrationUrl(publicRegistrationToken: string): string {
  const path = ROUTES.publicRegistration(publicRegistrationToken);
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

export function buildPublicRegistrationUrlForInvitation(invitation: HostInvitation): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const eventSlug = getEventSlugFromInvitation(invitation);
  if (eventSlug) {
    return `${origin}${ROUTES.eventRegister(eventSlug)}`;
  }
  if (invitation.publicRegistrationToken) {
    return `${origin}${ROUTES.publicRegistration(invitation.publicRegistrationToken)}`;
  }
  return "";
}

export function hasReceptionEmployeeLink(invitation: HostInvitation): boolean {
  return invitation.guestQrEnabled && invitation.receptionistUrl.trim().length > 0;
}

export function getReceptionSessionToken(invitation: HostInvitation): string | null {
  if (invitation.receptionSessionToken) {
    return invitation.receptionSessionToken;
  }

  return parseReceptionistUrl(invitation.receptionistUrl);
}
