import { createHash, randomBytes } from "crypto";

export function createReceptionStaffSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashReceptionStaffSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const RECEPTION_STAFF_SESSION_COOKIE = "marasim_reception_staff_session";
export const RECEPTION_STAFF_SESSION_STORAGE_KEY = "marasim_reception_staff_session";

export function buildStaffSessionStorageValue(receptionToken: string, sessionToken: string) {
  return `${receptionToken}:${sessionToken}`;
}

export function parseStaffSessionStorageValue(value: string | null | undefined): {
  receptionToken: string;
  sessionToken: string;
} | null {
  if (!value) return null;
  const separator = value.indexOf(":");
  if (separator <= 0) return null;

  const receptionToken = value.slice(0, separator);
  const sessionToken = value.slice(separator + 1);

  if (!receptionToken || !sessionToken) return null;
  return { receptionToken, sessionToken };
}

export function generateEmergencyPasscode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateStaffOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
