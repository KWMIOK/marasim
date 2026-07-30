"use server";

export type PublicGuestInvitation = {
  guestToken: string;
  name: string;
  invitationNumber: string;
  eventDisplayName: string;
  eventDate: string | null;
  rsvpStatus: string;
  checkInStatus: string;
  guestQrEnabled: boolean;
};

function parsePublicGuestInvitation(value: unknown): PublicGuestInvitation | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.guest_token !== "string" ||
    typeof record.name !== "string" ||
    typeof record.invitation_number !== "string" ||
    typeof record.event_display_name !== "string"
  ) {
    return null;
  }

  return {
    guestToken: record.guest_token,
    name: record.name,
    invitationNumber: record.invitation_number,
    eventDisplayName: record.event_display_name,
    eventDate: typeof record.event_date === "string" ? record.event_date : null,
    rsvpStatus: typeof record.rsvp_status === "string" ? record.rsvp_status : "not_opened",
    checkInStatus:
      typeof record.check_in_status === "string" ? record.check_in_status : "not_checked_in",
    guestQrEnabled:
      typeof record.guest_qr_enabled === "boolean" ? record.guest_qr_enabled : true,
  };
}

export async function getPublicGuestInvitation(
  slug: string,
  token: string
): Promise<PublicGuestInvitation | null> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!anonKey || !url) return null;

  const response = await fetch(`${url}/rest/v1/rpc/get_public_guest_invitation`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_slug: slug,
      p_token: token,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data) return null;

  return parsePublicGuestInvitation(data);
}
