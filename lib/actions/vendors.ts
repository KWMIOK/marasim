"use server";

import { getProfile } from "@/lib/auth/session";
import { callServiceRpc } from "@/lib/supabase/service-rpc";
import {
  parseVendorMasterPass,
  parseVendorTeamForScan,
  parseVendorTeamSummaries,
  type VendorMasterPass,
  type VendorTeamForScan,
  type VendorTeamSummary,
} from "@/lib/vendors/team";

async function callReceptionRpc<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T | null> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!anonKey || !url) return null;

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

export async function createHostVendorTeam(input: {
  receptionToken: string;
  teamName: string;
  vendorType: string;
  leadPhone: string;
  allowedHeadcount: number;
}): Promise<
  | { success: true; team: VendorTeamSummary }
  | { success: false; error: string }
> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "unauthorized" };

  const data = await callServiceRpc<{
    ok?: boolean;
    error?: string;
    team?: unknown;
  }>("create_reception_vendor_team", {
    p_reception_token: input.receptionToken,
    p_host_profile_id: profile.id,
    p_team_name: input.teamName.trim(),
    p_vendor_type: input.vendorType,
    p_lead_phone: input.leadPhone.trim(),
    p_allowed_headcount: input.allowedHeadcount,
  });

  if (!data?.ok) return { success: false, error: data?.error ?? "create_failed" };

  const teams = parseVendorTeamSummaries(data.team ? [data.team] : []);
  const team = teams[0];
  if (!team) return { success: false, error: "create_failed" };

  return { success: true, team };
}

export async function listHostVendorTeams(receptionToken: string): Promise<
  | {
      success: true;
      totalTeams: number;
      totalAllowed: number;
      totalCheckedIn: number;
      teams: VendorTeamSummary[];
    }
  | { success: false; error: string }
> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "unauthorized" };

  const data = await callServiceRpc<{
    ok?: boolean;
    error?: string;
    total_teams?: number;
    total_allowed?: number;
    total_checked_in?: number;
    teams?: unknown;
  }>("list_reception_vendor_teams_for_host", {
    p_reception_token: receptionToken,
    p_host_profile_id: profile.id,
  });

  if (!data?.ok) return { success: false, error: data?.error ?? "forbidden" };

  return {
    success: true,
    totalTeams: data.total_teams ?? 0,
    totalAllowed: data.total_allowed ?? 0,
    totalCheckedIn: data.total_checked_in ?? 0,
    teams: parseVendorTeamSummaries(data.teams),
  };
}

export async function revokeHostVendorTeam(teamId: string): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  const profile = await getProfile();
  if (!profile) return { success: false, error: "unauthorized" };

  const data = await callServiceRpc<{ ok?: boolean; error?: string }>(
    "revoke_reception_vendor_team",
    {
      p_team_id: teamId,
      p_host_profile_id: profile.id,
    }
  );

  if (!data?.ok) return { success: false, error: data?.error ?? "revoke_failed" };
  return { success: true };
}

export async function getVendorMasterPass(
  masterToken: string
): Promise<VendorMasterPass | null> {
  const data = await callReceptionRpc<{ ok?: boolean; pass?: unknown }>(
    "get_vendor_master_pass",
    { p_master_token: masterToken }
  );

  if (!data?.ok) return null;
  return parseVendorMasterPass(data.pass);
}

export async function getVendorTeamForScan(
  masterToken: string
): Promise<VendorTeamForScan | null> {
  const data = await callReceptionRpc<{ ok?: boolean; team?: unknown }>(
    "get_vendor_team_for_scan",
    { p_master_token: masterToken }
  );

  if (!data?.ok) return null;
  return parseVendorTeamForScan(data.team);
}

export type VendorCheckInResult =
  | {
      success: true;
      checkedInCount: number;
      allowedHeadcount: number;
    }
  | { success: false; error: "not_found" | "limit_exceeded" | "already_zero" | "unknown" };

export async function adjustVendorCheckIn(
  masterToken: string,
  delta: number
): Promise<VendorCheckInResult> {
  const data = await callReceptionRpc<{
    ok?: boolean;
    error?: string;
    checked_in_count?: number;
    allowed_headcount?: number;
  }>("adjust_vendor_checked_in", {
    p_master_token: masterToken,
    p_delta: delta,
  });

  if (!data) return { success: false, error: "unknown" };

  if (!data.ok) {
    const error = data.error;
    if (error === "limit_exceeded" || error === "already_zero" || error === "not_found") {
      return { success: false, error };
    }
    return { success: false, error: "unknown" };
  }

  return {
    success: true,
    checkedInCount: data.checked_in_count ?? 0,
    allowedHeadcount: data.allowed_headcount ?? 0,
  };
}

export async function checkInAllVendorRemaining(
  masterToken: string
): Promise<VendorCheckInResult> {
  const data = await callReceptionRpc<{
    ok?: boolean;
    error?: string;
    checked_in_count?: number;
    allowed_headcount?: number;
  }>("check_in_all_vendor_remaining", {
    p_master_token: masterToken,
  });

  if (!data) return { success: false, error: "unknown" };
  if (!data.ok) {
    if (data.error === "not_found") return { success: false, error: "not_found" };
    return { success: false, error: "unknown" };
  }

  return {
    success: true,
    checkedInCount: data.checked_in_count ?? 0,
    allowedHeadcount: data.allowed_headcount ?? 0,
  };
}
