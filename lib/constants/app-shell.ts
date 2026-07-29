import {
  ADMIN_ROUTES_PREFIX,
  BOTTOM_NAV_ROUTES,
  HOST_ROUTES_PREFIX,
  SCANNER_ROUTE,
} from "@/lib/constants/routes";

/** Routes that use the mobile app shell (bottom nav, gold theme, max-width content). */
export function usesAppShell(pathname: string): boolean {
  if (pathname.startsWith("/login") || pathname.startsWith("/auth/") || pathname.startsWith("/e/")) {
    return false;
  }

  return (
    (BOTTOM_NAV_ROUTES as readonly string[]).includes(pathname) ||
    pathname.startsWith("/occasions/") ||
    pathname.startsWith(ADMIN_ROUTES_PREFIX) ||
    pathname.startsWith(HOST_ROUTES_PREFIX) ||
    pathname === SCANNER_ROUTE
  );
}

export function showPublicLanguageToggle(pathname: string, isAuthenticated: boolean): boolean {
  if (isAuthenticated) return false;
  return pathname === "/" || pathname === "/login";
}

export function showAuthenticatedBackButton(pathname: string, isAuthenticated: boolean): boolean {
  if (!isAuthenticated) return false;
  if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) return false;
  return usesAppShell(pathname);
}
