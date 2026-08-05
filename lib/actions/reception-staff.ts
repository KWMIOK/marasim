"use server";

import { getProfile } from "@/lib/auth/session";
import { readReceptionStaffSessionFromCookies } from "@/lib/reception/staff-session-server";
import { hashReceptionStaffSessionToken } from "@/lib/reception/staff-session";

export type ReceptionStaffAccess =
  | { status: "invalid" }
  | { status: "host" }
  | { status: "authenticated"; staff: { fullName: string; phone: string } }
  | { status: "needs_registration"; staffLimit: number; slotsRemaining: number | null };

type AccessRpcRow = {
  status: string;
  staff?: { full_name?: string; phone?: string };
  staff_limit?: number;
  slots_remaining?: number;
};

async function callReceptionStaffRpc<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

function mapAccessRow(data: AccessRpcRow): ReceptionStaffAccess {
  switch (data.status) {
    case "host":
      return { status: "host" };
    case "authenticated":
      return {
        status: "authenticated",
        staff: {
          fullName: data.staff?.full_name ?? "",
          phone: data.staff?.phone ?? "",
        },
      };
    case "needs_registration":
      return {
        status: "needs_registration",
        staffLimit: data.staff_limit ?? 0,
        slotsRemaining:
          typeof data.slots_remaining === "number" ? data.slots_remaining : null,
      };
    default:
      return { status: "invalid" };
  }
}

export async function checkReceptionStaffAccess(
  receptionToken: string,
  sessionTokenFromClient?: string | null
): Promise<ReceptionStaffAccess> {
  const profile = await getProfile();
  const cookieSession = await readReceptionStaffSessionFromCookies(receptionToken);
  const sessionToken = cookieSession?.sessionToken ?? sessionTokenFromClient ?? null;
  const sessionTokenHash = sessionToken
    ? hashReceptionStaffSessionToken(sessionToken)
    : null;

  const data = await callReceptionStaffRpc<AccessRpcRow>("check_reception_staff_access", {
    p_token: receptionToken,
    p_session_token_hash: sessionTokenHash,
    p_viewer_profile_id: profile?.id ?? null,
  });

  if (!data) return { status: "invalid" };
  return mapAccessRow(data);
}
