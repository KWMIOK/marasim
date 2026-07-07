export type CeremonyEventType =
  | "wedding"
  | "katb_ktab"
  | "engagement"
  | "henna"
  | "birthday"
  | "graduation";

export type InvitationLanguage = "ar" | "en";

export interface EventFeatureToggles {
  confetti: boolean;
  background_music: boolean;
  show_language_selector: boolean;
  live_photo_album: boolean;
  guest_comments: boolean;
  guest_book: boolean;
  rsvp: boolean;
  dress_code: boolean;
  important_notes: boolean;
  invitation_protection: boolean;
  whatsapp_messages: boolean;
}

export interface EventDesignSettings {
  animated_template_id: string | null;
  theme_id: string | null;
  invitation_language: InvitationLanguage;
  font_id: string | null;
  font_color_id: string | null;
  name_size_px: number;
  letter_spacing_em: number;
  locale_default: InvitationLanguage;
}

export interface EventFormSettings extends EventDesignSettings {
  custom_message?: string;
  hero_image_url?: string;
  background_music_url?: string;
  dress_code_text?: string;
  important_notes_text?: string;
  toggles: EventFeatureToggles;
  maps_lat?: number | null;
  maps_lng?: number | null;
  companion_limit?: number;
  whatsapp_message_template?: string;
}

export interface InvitationAnimatedTemplate {
  id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  animation_key: string;
  is_active: boolean;
  sort_order: number;
}

export interface InvitationTheme {
  id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_style: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface InvitationFont {
  id: string;
  name: string;
  language: InvitationLanguage | "both";
  font_family: string;
  preview_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface InvitationFontColor {
  id: string;
  name: string;
  color_hex: string;
  is_active: boolean;
  sort_order: number;
}

export interface EventCatalogs {
  animatedTemplates: InvitationAnimatedTemplate[];
  themes: InvitationTheme[];
  fonts: InvitationFont[];
  fontColors: InvitationFontColor[];
}
