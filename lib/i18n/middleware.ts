import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

/** Ensure first-time visitors get Arabic; preserve explicit user choice afterward. */
export function ensureLocaleCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;

  if (!isLocale(existing)) {
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, LOCALE_COOKIE_OPTIONS);
  }

  return response;
}

export function getLocaleFromRequest(request: NextRequest) {
  const value = request.cookies.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
