import type { Locale } from "@/lib/i18n/types";

export type CatalogBilingualName = {
  name_ar: string;
  name_en: string;
};

export type CatalogBilingualText = CatalogBilingualName & {
  description_ar: string;
  description_en: string;
};

export function getCatalogName(item: CatalogBilingualName, locale: Locale): string {
  return locale === "ar" ? item.name_ar : item.name_en;
}

export function getCatalogDescription(
  item: Partial<CatalogBilingualText>,
  locale: Locale
): string | null {
  const value = locale === "ar" ? item.description_ar : item.description_en;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function formatCatalogAdminLabel(item: CatalogBilingualName): string {
  return `${item.name_ar} · ${item.name_en}`;
}

export function getCatalogSearchText(item: Partial<CatalogBilingualText>): string {
  return [
    item.name_ar,
    item.name_en,
    item.description_ar,
    item.description_en,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
