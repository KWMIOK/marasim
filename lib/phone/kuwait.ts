export const KUWAIT_DIAL_CODE = "+965";

/** Kuwait mobile: 8 digits starting with 5, 6, or 9. */
export function isValidKuwaitMobile(input: string): boolean {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 8) {
    return /^[569]\d{7}$/.test(digits);
  }

  if (digits.length === 11 && digits.startsWith("965")) {
    return /^965[569]\d{7}$/.test(digits);
  }

  return false;
}

export function formatKuwaitMobileInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 8);
}
