import { dictionary as ar } from "./dictionaries/ar";
import { dictionary as en } from "./dictionaries/en";
import type { Locale } from "./types";

export const LOCALE_COOKIE = "marasim_locale";
export const DEFAULT_LOCALE: Locale = "ar";

const dictionaries = { en, ar } as const;

export type TranslationKey = string;

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof value === "string" ? value : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] as Record<string, unknown>;
  let text = getNestedValue(dict, key) ?? getNestedValue(dictionaries.en as Record<string, unknown>, key) ?? key;

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{${param}}`, String(value));
    }
  }

  return text;
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function isLocale(value: string | undefined): value is Locale {
  return value === "ar" || value === "en";
}

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
