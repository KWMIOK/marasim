"use server";

export type CreatedShareHubGuest = {
  name: string;
  phone: string;
  guestToken: string;
  invitationNumber: string;
  guestUrl?: string;
};

export type SkippedDuplicateGuest = {
  name: string;
  phone: string;
  reason: "duplicate_in_batch" | "duplicate_existing";
};

export type CreateShareHubGuestsResult =
  | {
      success: true;
      guests: CreatedShareHubGuest[];
      createdCount: number;
      skippedDuplicates: SkippedDuplicateGuest[];
      skippedCount: number;
    }
  | { success: false; error: string };

type ShareGuestInput = {
  name: string;
  phone: string;
  source: "manual" | "contacts" | "import";
  is_vip?: boolean;
  table_number?: string;
  companion_count?: number;
};

async function callRpc<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

export async function createShareHubGuests(input: {
  receptionToken: string;
  guests: ShareGuestInput[];
  origin?: string;
}): Promise<CreateShareHubGuestsResult> {
  if (input.guests.length === 0) {
    return { success: false, error: "no_guests" };
  }

  const data = await callRpc<{
    success?: boolean;
    error?: string;
    created_count?: number;
    skipped_count?: number;
    skipped_duplicates?: Array<{
      name?: string;
      phone?: string;
      reason?: "duplicate_in_batch" | "duplicate_existing";
    }>;
    guests?: Array<{
      name?: string;
      phone?: string;
      guest_token?: string;
      invitation_number?: string;
      guest_url_path?: string | null;
    }>;
  }>("create_reception_guests_bulk", {
    p_reception_token: input.receptionToken,
    p_guests: input.guests.map((guest) => ({
      name: guest.name,
      phone: guest.phone,
      source: guest.source,
      is_vip: guest.is_vip ?? false,
      table_number: guest.table_number ?? null,
      companion_count: guest.companion_count ?? 0,
    })),
  });

  if (!data?.success) {
    return { success: false, error: data?.error ?? "create_failed" };
  }

  const guests: CreatedShareHubGuest[] = (data.guests ?? [])
    .filter(
      (guest): guest is Required<typeof guest> =>
        typeof guest.name === "string" &&
        typeof guest.phone === "string" &&
        typeof guest.guest_token === "string" &&
        typeof guest.invitation_number === "string"
    )
    .map((guest) => ({
      name: guest.name,
      phone: guest.phone,
      guestToken: guest.guest_token,
      invitationNumber: guest.invitation_number,
      guestUrl:
        guest.guest_url_path && input.origin
          ? `${input.origin}${guest.guest_url_path}`
          : guest.guest_url_path ?? undefined,
    }));

  const skippedDuplicates: SkippedDuplicateGuest[] = (data.skipped_duplicates ?? [])
    .filter(
      (guest): guest is SkippedDuplicateGuest =>
        typeof guest.name === "string" &&
        typeof guest.phone === "string" &&
        (guest.reason === "duplicate_in_batch" || guest.reason === "duplicate_existing")
    )
    .map((guest) => ({
      name: guest.name,
      phone: guest.phone,
      reason: guest.reason,
    }));

  return {
    success: true,
    guests,
    createdCount: data.created_count ?? guests.length,
    skippedDuplicates,
    skippedCount: data.skipped_count ?? skippedDuplicates.length,
  };
}
