export const CATALOG_KINDS = [
  "animated_templates",
  "themes",
  "fonts",
  "font_colors",
] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const CATALOG_TABLES: Record<CatalogKind, string> = {
  animated_templates: "invitation_animated_templates",
  themes: "invitation_themes",
  fonts: "invitation_fonts",
  font_colors: "invitation_font_colors",
};

export type CatalogActionResult =
  | { success: true; id: string }
  | { success: false; error: string };

export type AnimatedTemplateInput = {
  name: string;
  description?: string;
  preview_url?: string;
  animation_key: string;
  is_active: boolean;
  sort_order: number;
};

export type ThemeInput = {
  name: string;
  description?: string;
  preview_url?: string;
  primary_color: string;
  secondary_color: string;
  background_style?: string;
  is_active: boolean;
  sort_order: number;
};

export type FontInput = {
  name: string;
  language: "ar" | "en" | "both";
  font_family: string;
  preview_url?: string;
  is_active: boolean;
  sort_order: number;
};

export type FontColorInput = {
  name: string;
  color_hex: string;
  is_active: boolean;
  sort_order: number;
};

export type CatalogInputMap = {
  animated_templates: AnimatedTemplateInput;
  themes: ThemeInput;
  fonts: FontInput;
  font_colors: FontColorInput;
};
