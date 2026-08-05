import { KUWAIT_DIAL_CODE } from "@/lib/phone/kuwait";

export function toE164KuwaitMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 8 && /^[569]\d{7}$/.test(digits)) {
    return `${KUWAIT_DIAL_CODE}${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("965") && /^965[569]\d{7}$/.test(digits)) {
    return `+${digits}`;
  }

  return null;
}
