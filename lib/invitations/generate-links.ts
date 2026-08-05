import { ROUTES } from "@/lib/constants/routes";
import { getAppOriginFromRequest } from "@/lib/utils/app-origin";
import { slugify } from "@/lib/utils/urls";

export type GeneratedInvitationLinks = {
  eventSlug: string;
  guestToken: string;
  receptionistToken: string;
  guestUrl: string;
  receptionistUrl: string;
};

function createToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
}

export function buildGuestInvitationLink(slug: string, token: string, origin: string) {
  return `${origin}${ROUTES.invitation(slug, token)}`;
}

export function buildReceptionistLink(token: string, origin: string) {
  return `${origin}${ROUTES.reception(token)}`;
}

export function generateInvitationLinks(input: {
  hostName: string;
  origin?: string;
  includeReceptionistLink?: boolean;
}): GeneratedInvitationLinks {
  const origin = input.origin ?? getAppOriginFromRequest();
  const slugBase = slugify(input.hostName.trim()) || "occasion";
  const eventSlug = `${slugBase}-${createToken().slice(0, 8)}`;
  const guestToken = createToken();
  const receptionistToken = createToken();
  const includeReceptionistLink = input.includeReceptionistLink !== false;

  return {
    eventSlug,
    guestToken,
    receptionistToken,
    guestUrl: buildGuestInvitationLink(eventSlug, guestToken, origin),
    receptionistUrl: includeReceptionistLink
      ? buildReceptionistLink(receptionistToken, origin)
      : "",
  };
}
