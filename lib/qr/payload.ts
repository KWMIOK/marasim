import { parseGuestInvitationUrl } from "@/lib/invitations/parse-invitation-urls";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MARASIM_GUEST_PREFIX = "marasim:guest:";

export function buildGuestQrPayload(guestToken: string) {
  return `${MARASIM_GUEST_PREFIX}${guestToken}`;
}

export function parseGuestQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith(MARASIM_GUEST_PREFIX)) {
    const token = trimmed.slice(MARASIM_GUEST_PREFIX.length).trim();
    return UUID_REGEX.test(token) ? token : null;
  }

  const fromUrl = parseGuestInvitationUrl(trimmed);
  if (fromUrl?.guestToken && UUID_REGEX.test(fromUrl.guestToken)) {
    return fromUrl.guestToken;
  }

  return null;
}
