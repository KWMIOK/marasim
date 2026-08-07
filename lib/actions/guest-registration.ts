"use server";

export type PublicRegistrationEvent = {
  eventDisplayName: string;
  eventDate: string | null;
  occasion: string | null;
};

export type GuestRegistrationRequest = {
  id: string;
  name: string;
  phone: string;
  status: "pending" | "approved" | "declined";
  guest_token: string | null;
  created_at: string;
  reviewed_at: string | null;
};

async function callRpc<T>(
  functionName: string,
  body: Record<string, unknown>,
  useServiceRole = false
): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !apiKey) return null;

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function getPublicRegistrationEvent(
  publicToken: string
): Promise<PublicRegistrationEvent | null> {
  const data = await callRpc<{
    event_display_name?: string;
    event_date?: string | null;
    occasion?: string | null;
  }>("get_public_registration_event", { p_public_token: publicToken });

  if (!data?.event_display_name) return null;

  return {
    eventDisplayName: data.event_display_name,
    eventDate: data.event_date ?? null,
    occasion: data.occasion ?? null,
  };
}

export async function getPublicRegistrationEventBySlug(
  eventSlug: string
): Promise<(PublicRegistrationEvent & { publicToken?: string }) | null> {
  const data = await callRpc<{
    event_display_name?: string;
    event_date?: string | null;
    occasion?: string | null;
    public_registration_token?: string;
  }>("get_public_registration_event_by_slug", { p_event_slug: eventSlug });

  if (!data?.event_display_name) return null;

  return {
    eventDisplayName: data.event_display_name,
    eventDate: data.event_date ?? null,
    occasion: data.occasion ?? null,
    publicToken: data.public_registration_token,
  };
}

export async function submitGuestRegistrationRequestBySlug(input: {
  eventSlug: string;
  name: string;
  phone: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const data = await callRpc<{ success?: boolean; error?: string }>(
    "submit_guest_registration_request_by_slug",
    {
      p_event_slug: input.eventSlug,
      p_name: input.name,
      p_phone: input.phone,
    }
  );

  if (!data?.success) {
    return { success: false, error: data?.error ?? "submit_failed" };
  }

  return { success: true };
}

export async function submitGuestRegistrationRequest(input: {
  publicToken: string;
  name: string;
  phone: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const data = await callRpc<{ success?: boolean; error?: string }>(
    "submit_guest_registration_request",
    {
      p_public_token: input.publicToken,
      p_name: input.name,
      p_phone: input.phone,
    }
  );

  if (!data?.success) {
    return { success: false, error: data?.error ?? "submit_failed" };
  }

  return { success: true };
}

export async function getPublicRegistrationToken(
  receptionToken: string
): Promise<string | null> {
  const data = await callRpc<string>("get_public_registration_token", {
    p_reception_token: receptionToken,
  });

  return typeof data === "string" ? data : null;
}

export async function listGuestRegistrationRequests(
  receptionToken: string
): Promise<GuestRegistrationRequest[]> {
  const data = await callRpc<GuestRegistrationRequest[]>(
    "list_guest_registration_requests",
    { p_reception_token: receptionToken }
  );

  if (!Array.isArray(data)) return [];
  return data;
}

export async function reviewGuestRegistrationRequest(input: {
  receptionToken: string;
  requestId: string;
  action: "approve" | "decline";
  origin?: string;
}): Promise<
  | {
      success: true;
      status: "approved" | "declined";
      guestUrl?: string;
      qrPayload?: string;
      phone?: string;
      name?: string;
    }
  | { success: false; error: string }
> {
  const data = await callRpc<{
    success?: boolean;
    error?: string;
    status?: "approved" | "declined";
    guest_url_path?: string;
    qr_payload?: string;
    phone?: string;
    name?: string;
  }>("review_guest_registration_request", {
    p_reception_token: input.receptionToken,
    p_request_id: input.requestId,
    p_action: input.action,
  });

  if (!data?.success) {
    return { success: false, error: data?.error ?? "review_failed" };
  }

  const guestUrl =
    data.guest_url_path && input.origin
      ? `${input.origin}${data.guest_url_path}`
      : data.guest_url_path ?? undefined;

  return {
    success: true,
    status:
      data.status ?? (input.action === "approve" ? "approved" : "declined"),
    guestUrl,
    qrPayload: data.qr_payload,
    phone: data.phone,
    name: data.name,
  };
}

export async function countPendingGuestRegistrationRequests(
  receptionToken: string
): Promise<number> {
  const requests = await listGuestRegistrationRequests(receptionToken);
  return requests.filter((request) => request.status === "pending").length;
}
