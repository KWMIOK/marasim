import {
  ADMIN_ROUTES_PREFIX,
  BOTTOM_NAV_ROUTES,
  HOST_ROUTES_PREFIX,
  SCANNER_ROUTE,
} from "@/lib/constants/routes";

/** Routes that use the mobile app shell (bottom nav, gold theme, max-width content). */
export function usesAppShell(pathname: string): boolean {
  if (pathname.startsWith("/login") || pathname.startsWith("/auth/") || pathname.startsWith("/e/") || pathname.startsWith("/reception/") || pathname.startsWith("/register/")) {
    return false;
  }

  return (
    (BOTTOM_NAV_ROUTES as readonly string[]).includes(pathname) ||
    pathname.startsWith("/occasions/") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/profile/") ||
    pathname.startsWith(ADMIN_ROUTES_PREFIX) ||
    pathname.startsWith(HOST_ROUTES_PREFIX) ||
    pathname === SCANNER_ROUTE
  );
}

export function showPublicLanguageToggle(pathname: string, isAuthenticated: boolean): boolean {
  if (isAuthenticated) return false;
  return pathname === "/" || pathname === "/login";
}

/** Bottom-nav tab destinations — no back button on these root pages. */
export function isBottomNavRoot(pathname: string): boolean {
  const pathOnly = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  return (BOTTOM_NAV_ROUTES as readonly string[]).includes(pathOnly);
}

export function showAppBackButton(pathname: string, isAuthenticated: boolean): boolean {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;

  if (path.startsWith("/login") || path.startsWith("/auth/")) return false;
  if (isBottomNavRoot(path)) return false;
  if (!usesAppShell(path)) return false;

  // Occasions sub-pages, template flow, and profile sub-pages — always show tab-scoped back.
  if (
    path.startsWith("/occasions/") ||
    path.startsWith("/templates") ||
    path.startsWith("/profile/")
  ) {
    return true;
  }

  return isAuthenticated;
}

/** @deprecated Use showAppBackButton */
export function showAuthenticatedBackButton(pathname: string, isAuthenticated: boolean): boolean {
  return showAppBackButton(pathname, isAuthenticated);
}
