import { parseGuestInvitationUrl } from "@/lib/invitations/parse-invitation-urls";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MARASIM_GUEST_PREFIX = "marasim:guest:";
const MARASIM_VENDOR_PREFIX = "marasim:vendor:";

export function buildGuestQrPayload(guestToken: string) {
  return `${MARASIM_GUEST_PREFIX}${guestToken}`;
}

export function buildVendorQrPayload(masterToken: string) {
  return `${MARASIM_VENDOR_PREFIX}${masterToken}`;
}

export function parseVendorQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith(MARASIM_VENDOR_PREFIX)) {
    const token = trimmed.slice(MARASIM_VENDOR_PREFIX.length).trim();
    return UUID_REGEX.test(token) ? token : null;
  }

  const vendorPassMatch = trimmed.match(/\/vendor-pass\/([^/?#]+)/i);
  if (vendorPassMatch?.[1] && UUID_REGEX.test(vendorPassMatch[1])) {
    return vendorPassMatch[1];
  }

  return null;
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
