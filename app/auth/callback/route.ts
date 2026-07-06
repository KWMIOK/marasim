import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { getHomeRouteForRole } from "@/lib/auth/roles";
import {
  promoteSuperAdminIfAllowed,
  syncProfileFromOAuth,
} from "@/lib/auth/oauth";
import type { UserRole } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const { supabase, applyCookies } = createRouteHandlerClient(request);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncProfileFromOAuth(supabase, user);
    await promoteSuperAdminIfAllowed(supabase, user);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  const role = (profile as { role: UserRole } | null)?.role;
  const destination =
    nextParam && nextParam.startsWith("/")
      ? nextParam
      : getHomeRouteForRole(role);

  const response = NextResponse.redirect(`${origin}${destination}`);
  return applyCookies(response);
}
