"use server";

import { cookies } from "next/headers";
import { getProfile } from "@/lib/auth/session";
import { callServiceRpc } from "@/lib/supabase/service-rpc";
import { sendReceptionStaffOtpSms } from "@/lib/sms/send-staff-otp";
import {
  buildStaffSessionCookieValue,
  staffSessionCookieOptions,
} from "@/lib/reception/staff-session-server";
import {
  createReceptionStaffSessionToken,
  generateEmergencyPasscode,
  generateStaffOtpCode,
  hashReceptionStaffSessionToken,
  RECEPTION_STAFF_SESSION_COOKIE,
} from "@/lib/reception/staff-session";

type RpcOk = { ok?: boolean; error?: string; staff?: { full_name?: string; phone?: string } };

async function issueStaffSessionCookie(receptionToken: string) {
  const sessionToken = createReceptionStaffSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(
    RECEPTION_STAFF_SESSION_COOKIE,
    buildStaffSessionCookieValue(receptionToken, sessionToken),
    staffSessionCookieOptions()
  );

  return {
    sessionToken,
    sessionTokenHash: hashReceptionStaffSessionToken(sessionToken),
  };
}

export async function sendReceptionStaffOtp(input: {
  receptionToken: string;
  fullName: string;
  phone: string;
}): Promise<
  | { success: true; devCode?: string }
  | { success: false; error: string }
> {
  const code = generateStaffOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const stored = await callServiceRpc<RpcOk>("store_reception_staff_otp", {
    p_token: input.receptionToken,
    p_phone: input.phone,
    p_full_name: input.fullName.trim(),
    p_code_plain: code,
    p_expires_at: expiresAt,
  });

  if (!stored?.ok) {
    return { success: false, error: stored?.error ?? "otp_store_failed" };
  }

  const sms = await sendReceptionStaffOtpSms({
    phone: input.phone,
    code,
  });

  if (!sms.sent && !sms.devCode) {
    return { success: false, error: "sms_failed" };
  }

  return { success: true, devCode: sms.devCode };
}

export async function verifyReceptionStaffOtp(input: {
  receptionToken: string;
  fullName: string;
  phone: string;
  code: string;
}): Promise<
  | { success: true; sessionToken: string; staff: { fullName: string; phone: string } }
  | { success: false; error: string }
> {
  const { sessionToken, sessionTokenHash } = await issueStaffSessionCookie(input.receptionToken);

  const result = await callServiceRpc<RpcOk>("verify_reception_staff_otp", {
    p_token: input.receptionToken,
    p_phone: input.phone,
    p_code: input.code.trim(),
    p_full_name: input.fullName.trim(),
    p_session_token_hash: sessionTokenHash,
  });

  if (!result?.ok) {
    return { success: false, error: result?.error ?? "verification_failed" };
  }

  return {
    success: true,
    sessionToken,
    staff: {
      fullName: result.staff?.full_name ?? input.fullName,
      phone: result.staff?.phone ?? input.phone,
    },
  };
}

export async function loginReceptionStaffEmergency(input: {
  receptionToken: string;
  passcode: string;
  fullName: string;
  phone: string;
}): Promise<
  | { success: true; sessionToken: string; staff: { fullName: string; phone: string } }
  | { success: false; error: string }
> {
  const { sessionToken, sessionTokenHash } = await issueStaffSessionCookie(input.receptionToken);

  const result = await callServiceRpc<RpcOk>("login_reception_staff_emergency", {
    p_token: input.receptionToken,
    p_passcode: input.passcode.trim(),
    p_full_name: input.fullName.trim(),
    p_phone: input.phone,
    p_session_token_hash: sessionTokenHash,
  });

  if (!result?.ok) {
    return { success: false, error: result?.error ?? "emergency_login_failed" };
  }

  return {
    success: true,
    sessionToken,
    staff: {
      fullName: result.staff?.full_name ?? input.fullName,
      phone: result.staff?.phone ?? input.phone,
    },
  };
}

export type HostReceptionStaffMember = {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  revokedAt: string | null;
  activeSessions: number;
};

export async function listHostReceptionStaff(receptionToken: string): Promise<
  | {
      success: true;
      staffLimit: number;
      hasEmergencyPasscode: boolean;
      staff: HostReceptionStaffMember[];
    }
  | { success: false; error: string }
> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "unauthorized" };

  const data = await callServiceRpc<{
    ok?: boolean;
    error?: string;
    staff_limit?: number;
    has_emergency_passcode?: boolean;
    staff?: Array<{
      id: string;
      full_name: string;
      phone: string;
      created_at: string;
      revoked_at: string | null;
      active_sessions: number;
    }>;
  }>("list_reception_staff_for_host", {
    p_token: receptionToken,
    p_host_profile_id: profile.id,
  });

  if (!data?.ok) return { success: false, error: data?.error ?? "forbidden" };

  return {
    success: true,
    staffLimit: data.staff_limit ?? 0,
    hasEmergencyPasscode: data.has_emergency_passcode === true,
    staff: (data.staff ?? []).map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      createdAt: row.created_at,
      revokedAt: row.revoked_at,
      activeSessions: row.active_sessions,
    })),
  };
}

export async function revokeHostReceptionStaffMember(staffId: string): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return false;

  const data = await callServiceRpc<RpcOk>("revoke_reception_staff_member", {
    p_staff_id: staffId,
    p_host_profile_id: profile.id,
  });

  return data?.ok === true;
}

export async function resetHostReceptionStaffSessions(receptionToken: string): Promise<boolean> {
  const profile = await getProfile();
  if (!profile) return false;

  const data = await callServiceRpc<RpcOk>("reset_reception_staff_sessions", {
    p_token: receptionToken,
    p_host_profile_id: profile.id,
  });

  return data?.ok === true;
}

export async function regenerateHostEmergencyPasscode(
  receptionToken: string
): Promise<{ success: true; passcode: string } | { success: false; error: string }> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "unauthorized" };

  const passcode = generateEmergencyPasscode();

  const data = await callServiceRpc<RpcOk>("set_reception_emergency_passcode", {
    p_token: receptionToken,
    p_host_profile_id: profile.id,
    p_passcode_plain: passcode,
  });

  if (!data?.ok) return { success: false, error: data?.error ?? "failed" };

  return { success: true, passcode };
}

export { generateEmergencyPasscode };
