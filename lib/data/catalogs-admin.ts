import { createClient } from "@/lib/supabase/server";
import type { EventCatalogs } from "@/types/events";

/** All catalog rows for super-admin management (includes inactive). */
export async function getAdminEventCatalogs(): Promise<EventCatalogs> {
  const supabase = await createClient();

  const [animatedTemplates, themes, fonts, fontColors] = await Promise.all([
    supabase.from("invitation_animated_templates").select("*").order("sort_order"),
    supabase.from("invitation_themes").select("*").order("sort_order"),
    supabase.from("invitation_fonts").select("*").order("sort_order"),
    supabase.from("invitation_font_colors").select("*").order("sort_order"),
  ]);

  return {
    animatedTemplates: (animatedTemplates.data ?? []) as EventCatalogs["animatedTemplates"],
    themes: (themes.data ?? []) as EventCatalogs["themes"],
    fonts: (fonts.data ?? []) as EventCatalogs["fonts"],
    fontColors: (fontColors.data ?? []) as EventCatalogs["fontColors"],
  };
}
