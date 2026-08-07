import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/database";
import { getHomeRouteForRole } from "@/lib/auth/roles";
import {
  ADMIN_ROUTES_PREFIX,
  HOST_ROUTES_PREFIX,
  SCANNER_ROUTE,
} from "@/lib/constants/routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/login");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isPublicInvitation = pathname.startsWith("/e/");
  const isPublicReception = pathname.startsWith("/reception/");
  const isAdminRoute = pathname.startsWith(ADMIN_ROUTES_PREFIX);
  const isHostRoute = pathname.startsWith(HOST_ROUTES_PREFIX);
  const isScannerRoute = pathname === SCANNER_ROUTE;
  const isProtectedRoute =
    isAdminRoute || isHostRoute || isScannerRoute;

  if (isAuthCallback) {
    return supabaseResponse;
  }

  const needsStrictAuth =
    isAuthRoute || isProtectedRoute;

  if (!needsStrictAuth) {
    await supabase.auth.getSession();
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile as { role: UserRole } | null)?.role;
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const url = request.nextUrl.clone();
    url.pathname =
      redirectParam && redirectParam.startsWith("/")
        ? redirectParam
        : getHomeRouteForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPublicInvitation || isPublicReception) {
    return supabaseResponse;
  }

  if (user && (isAdminRoute || isHostRoute || isScannerRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile as { role: UserRole } | null)?.role;

    if (isAdminRoute && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "check_in_staff" ? SCANNER_ROUTE : "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isHostRoute && role !== "host" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "check_in_staff" ? SCANNER_ROUTE : "/admin";
      return NextResponse.redirect(url);
    }

    if (isScannerRoute && role !== "check_in_staff" && role !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "host" ? "/dashboard" : "/admin";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
