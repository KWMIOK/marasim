export function parseGuestInvitationUrl(
  url: string
): { eventSlug: string; guestToken: string } | null {
  try {
    const pathname = new URL(url, "http://localhost").pathname;
    const match = pathname.match(/^\/e\/([^/]+)\/([^/]+)$/);
    if (!match) return null;

    return { eventSlug: match[1], guestToken: match[2] };
  } catch {
    return null;
  }
}

export function parseReceptionistUrl(url: string): string | null {
  try {
    const pathname = new URL(url, "http://localhost").pathname;
    const match = pathname.match(/^\/reception\/([^/]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
