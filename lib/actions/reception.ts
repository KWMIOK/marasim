"use server";

import { getProfile } from "@/lib/auth/session";
import type { ReceptionSession } from "@/lib/reception/session";
import {
  parseReceptionGuestDetail,
  parseReceptionGuestSummaries,
  type ReceptionGuestDetail,
  type ReceptionGuestSummary,
} from "@/lib/reception/guest";
import {
  parseGuestInvitationUrl,
  parseReceptionistUrl,
} from "@/lib/invitations/parse-invitation-urls";

import { generateEmergencyPasscode } from "@/lib/reception/staff-session";

export type CreateReceptionSessionInput = {
  token: string;
  eventDisplayName: string;
  eventDate: string | null;
  occasion: string | null;
  eventSlug: string;
  guestToken: string;
  guestQrEnabled?: boolean;
  receptionStaffCount?: number;
  locationName?: string | null;
  locationDirections?: string | null;
  mapsLat?: number | null;
  mapsLng?: number | null;
  mapsUrl?: string | null;
  eventLogoUrl?: string | null;
};

export type CreateReceptionSessionResult =
  | { success: true; emergencyPasscode?: string }
  | { success: false; error: string };

function parseReceptionSession(value: unknown): ReceptionSession | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.token !== "string" || typeof record.event_display_name !== "string") {
    return null;
  }

  return {
    token: record.token,
    eventDisplayName: record.event_display_name,
    eventDate: typeof record.event_date === "string" ? record.event_date : null,
    occasion: typeof record.occasion === "string" ? (record.occasion as ReceptionSession["occasion"]) : null,
    totalGuests: typeof record.total_guests === "number" ? record.total_guests : 0,
    arrivedGuests: typeof record.arrived_guests === "number" ? record.arrived_guests : 0,
    notArrivedGuests: typeof record.not_arrived_guests === "number" ? record.not_arrived_guests : 0,
    updatedAt: typeof record.updated_at === "string" ? record.updated_at : null,
  };
}

async function callReceptionRpc<T>(
  functionName: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function createReceptionSession(
  input: CreateReceptionSessionInput
): Promise<CreateReceptionSessionResult> {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return { success: false, error: "Supabase is not configured." };
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      return { success: false, error: "Supabase is not configured." };
    }

    const profile = await getProfile();
    const staffLimit = Math.min(20, Math.max(0, Math.round(input.receptionStaffCount ?? 0)));
    const emergencyPasscodePlain = generateEmergencyPasscode();

    const response = await fetch(`${url}/rest/v1/rpc/create_reception_session`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_token: input.token,
        p_event_display_name: input.eventDisplayName,
        p_event_date: input.eventDate,
        p_occasion: input.occasion,
        p_event_slug: input.eventSlug,
        p_guest_token: input.guestToken,
        p_guest_qr_enabled: input.guestQrEnabled ?? true,
        p_reception_staff_limit: staffLimit,
        p_host_profile_id: profile?.id ?? null,
        p_emergency_passcode_plain: emergencyPasscodePlain,
        p_location_name: input.locationName?.trim() || null,
        p_location_directions: input.locationDirections?.trim() || null,
        p_maps_lat: input.mapsLat ?? null,
        p_maps_lng: input.mapsLng ?? null,
        p_maps_url: input.mapsUrl?.trim() || null,
        p_event_logo_url: input.eventLogoUrl ?? null,
      }),
    });

    if (!response.ok) {
      return { success: false, error: await response.text() };
    }

    const payload = (await response.json()) as { ok?: boolean; created?: boolean };
    return {
      success: true,
      emergencyPasscode: payload.created ? emergencyPasscodePlain : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reception session",
    };
  }
}

export async function ensureReceptionSessionForInvitation(input: {
  eventDisplayName: string;
  eventDate: string | null;
  occasion: string | null;
  guestUrl: string;
  receptionistUrl: string;
  receptionSessionToken?: string | null;
  guestQrEnabled?: boolean;
  receptionStaffCount?: number;
  locationName?: string | null;
  locationDirections?: string | null;
  mapsLat?: number | null;
  mapsLng?: number | null;
  mapsUrl?: string | null;
  eventLogoUrl?: string | null;
}): Promise<CreateReceptionSessionResult> {
  const receptionistToken =
    parseReceptionistUrl(input.receptionistUrl) ?? input.receptionSessionToken ?? null;
  const guest = parseGuestInvitationUrl(input.guestUrl);
  const isPrivateEvent = input.guestQrEnabled !== false;

  if (!receptionistToken || !guest) {
    return { success: false, error: "Invalid invitation links." };
  }

  return createReceptionSession({
    token: receptionistToken,
    eventDisplayName: input.eventDisplayName,
    eventDate: input.eventDate,
    occasion: input.occasion,
    eventSlug: guest.eventSlug,
    guestToken: guest.guestToken,
    guestQrEnabled: input.guestQrEnabled ?? true,
    receptionStaffCount: isPrivateEvent ? (input.receptionStaffCount ?? 0) : 0,
    locationName: input.locationName ?? null,
    locationDirections: input.locationDirections ?? null,
    mapsLat: input.mapsLat ?? null,
    mapsLng: input.mapsLng ?? null,
    mapsUrl: input.mapsUrl ?? null,
    eventLogoUrl: input.eventLogoUrl ?? null,
  });
}

export async function getReceptionSessionByToken(
  token: string
): Promise<ReceptionSession | null> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return null;

  const data = await callReceptionRpc<unknown>("get_reception_session", { p_token: token }, anonKey);
  if (!data) return null;

  return parseReceptionSession(data);
}

export async function searchReceptionGuests(
  receptionToken: string,
  query: string
): Promise<ReceptionGuestSummary[]> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return [];

  const data = await callReceptionRpc<unknown>(
    "search_reception_guests",
    { p_reception_token: receptionToken, p_query: query },
    anonKey
  );

  return parseReceptionGuestSummaries(data);
}

export async function listReceptionGuests(
  receptionToken: string
): Promise<ReceptionGuestSummary[]> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return [];

  const data = await callReceptionRpc<unknown>(
    "list_reception_guests",
    { p_reception_token: receptionToken },
    anonKey
  );

  return parseReceptionGuestSummaries(data);
}

export async function syncReceptionData(receptionToken: string): Promise<{
  session: ReceptionSession | null;
  guests: ReceptionGuestSummary[];
}> {
  const [session, guests] = await Promise.all([
    getReceptionSessionByToken(receptionToken),
    listReceptionGuests(receptionToken),
  ]);

  return { session, guests };
}

export async function getReceptionGuest(
  receptionToken: string,
  guestToken: string
): Promise<ReceptionGuestDetail | null> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return null;

  const data = await callReceptionRpc<unknown>(
    "get_reception_guest",
    { p_reception_token: receptionToken, p_guest_token: guestToken },
    anonKey
  );

  if (!data) return null;
  return parseReceptionGuestDetail(data);
}

export type RegisterReceptionGuestResult =
  | { success: true; checkedInAt: string | null; checkedInEntrance: string | null }
  | {
      success: false;
      error: "invalid_guest" | "already_checked_in" | "unknown";
      checkedInEntrance?: string | null;
    };

export async function registerReceptionGuestArrival(
  receptionToken: string,
  guestToken: string,
  entranceLabel: string
): Promise<RegisterReceptionGuestResult> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) return { success: false, error: "unknown" };

  const data = await callReceptionRpc<Record<string, unknown>>(
    "register_reception_guest_arrival",
    {
      p_reception_token: receptionToken,
      p_guest_token: guestToken,
      p_entrance_label: entranceLabel,
    },
    anonKey
  );

  if (!data) return { success: false, error: "unknown" };

  const checkedInEntrance =
    typeof data.checked_in_entrance === "string" ? data.checked_in_entrance : null;

  if (data.success === true) {
    return {
      success: true,
      checkedInAt: typeof data.checked_in_at === "string" ? data.checked_in_at : null,
      checkedInEntrance,
    };
  }

  const error = data.error;
  if (error === "invalid_guest" || error === "already_checked_in") {
    return { success: false, error, checkedInEntrance };
  }

  return { success: false, error: "unknown" };
}
