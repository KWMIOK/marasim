/** Strip non-digits for consistent phone comparison (matches DB normalize_phone_digits). */
export function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}
