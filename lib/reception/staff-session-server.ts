import { cookies } from "next/headers";
import {
  hashReceptionStaffSessionToken,
  RECEPTION_STAFF_SESSION_COOKIE,
} from "@/lib/reception/staff-session";

export async function readReceptionStaffSessionFromCookies(receptionToken: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RECEPTION_STAFF_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const separator = raw.indexOf(":");
  if (separator <= 0) return null;

  const token = raw.slice(0, separator);
  const sessionToken = raw.slice(separator + 1);

  if (token !== receptionToken || !sessionToken) return null;

  return {
    sessionToken,
    sessionTokenHash: hashReceptionStaffSessionToken(sessionToken),
  };
}

export function buildStaffSessionCookieValue(receptionToken: string, sessionToken: string) {
  return `${receptionToken}:${sessionToken}`;
}

export function staffSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
