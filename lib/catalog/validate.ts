import type { CatalogKind, CatalogInputMap } from "@/lib/catalog/tables";

export function validateCatalogInput<K extends CatalogKind>(
  kind: K,
  input: CatalogInputMap[K]
): string | null {
  const nameAr = input.name_ar.trim();
  const nameEn = input.name_en.trim();

  if (!nameAr || !nameEn) {
    return "bilingual_names_required";
  }

  if (kind === "animated_templates" || kind === "themes") {
    const withDescriptions = input as CatalogInputMap["animated_templates"];
    if (!withDescriptions.description_ar.trim() || !withDescriptions.description_en.trim()) {
      return "bilingual_descriptions_required";
    }
  }

  return null;
}

export function normalizeCatalogInput<K extends CatalogKind>(
  kind: K,
  input: CatalogInputMap[K]
): CatalogInputMap[K] {
  if (kind === "animated_templates") {
    const value = input as CatalogInputMap["animated_templates"];
    return {
      ...value,
      name_ar: value.name_ar.trim(),
      name_en: value.name_en.trim(),
      description_ar: value.description_ar.trim(),
      description_en: value.description_en.trim(),
      preview_url: value.preview_url?.trim() || undefined,
    } as CatalogInputMap[K];
  }

  if (kind === "themes") {
    const value = input as CatalogInputMap["themes"];
    return {
      ...value,
      name_ar: value.name_ar.trim(),
      name_en: value.name_en.trim(),
      description_ar: value.description_ar.trim(),
      description_en: value.description_en.trim(),
      preview_url: value.preview_url?.trim() || undefined,
      background_style: value.background_style?.trim() || undefined,
    } as CatalogInputMap[K];
  }

  if (kind === "fonts") {
    const value = input as CatalogInputMap["fonts"];
    return {
      ...value,
      name_ar: value.name_ar.trim(),
      name_en: value.name_en.trim(),
      preview_url: value.preview_url?.trim() || undefined,
    } as CatalogInputMap[K];
  }

  const value = input as CatalogInputMap["font_colors"];
  return {
    ...value,
    name_ar: value.name_ar.trim(),
    name_en: value.name_en.trim(),
  } as CatalogInputMap[K];
}
