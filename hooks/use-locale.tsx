"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  localeDirection,
  translate,
  type TranslationKey,
} from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import { LocaleContext, useLocale } from "@/hooks/locale-context";

export { useLocale } from "@/hooks/locale-context";

function writeCookieLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  defaultLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocaleState(defaultLocale);
  }, [defaultLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeCookieLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const next = current === "ar" ? "en" : "ar";
      writeCookieLocale(next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      dir: localeDirection(locale),
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const { t, locale, dir, setLocale, toggleLocale } = useLocale();
  return { t, locale, dir, setLocale, toggleLocale };
}
