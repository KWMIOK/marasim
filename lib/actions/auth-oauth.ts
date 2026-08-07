"use server";

import { createClient } from "@/lib/supabase/server";
import { getHomeRouteForRole } from "@/lib/auth/roles";
import { sendAdminAccessRequestEmail } from "@/lib/email/send-admin-access-request";
import {
  promoteSuperAdminIfAllowed,
  syncProfileFromOAuth,
} from "@/lib/auth/oauth";
import type { Profile, UserRole } from "@/types/database";

export async function finalizeOAuthSignIn(input: {
  adminRequest?: boolean;
  nextPath?: string | null;
}): Promise<{ success: true; destination: string } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "not_authenticated" };
  }

  await syncProfileFromOAuth(supabase, user);
  await promoteSuperAdminIfAllowed(supabase, user);

  if (input.adminRequest) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name, email, phone, role")
      .eq("id", user.id)
      .maybeSingle();

    const profile = profileRow as Pick<Profile, "full_name" | "email" | "phone" | "role"> | null;

    if (profile?.role !== "super_admin") {
      await sendAdminAccessRequestEmail({
        userId: user.id,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? user.email ?? null,
        phone: profile?.phone ?? user.phone ?? null,
        source: "oauth_callback",
      });
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role: UserRole } | null)?.role;
  const destination =
    input.nextPath && input.nextPath.startsWith("/")
      ? input.nextPath
      : getHomeRouteForRole(role);

  return { success: true, destination };
}
