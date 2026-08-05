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
  locationName: string | null;
  locationDirections: string | null;
  mapsLat: number | null;
  mapsLng: number | null;
  mapsUrl: string | null;
  eventLogoUrl: string | null;
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
    locationName: typeof record.location_name === "string" ? record.location_name : null,
    locationDirections:
      typeof record.location_directions === "string" ? record.location_directions : null,
    mapsLat: typeof record.maps_lat === "number" ? record.maps_lat : null,
    mapsLng: typeof record.maps_lng === "number" ? record.maps_lng : null,
    mapsUrl: typeof record.maps_url === "string" ? record.maps_url : null,
    eventLogoUrl:
      typeof record.event_logo_url === "string" ? record.event_logo_url : null,
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
