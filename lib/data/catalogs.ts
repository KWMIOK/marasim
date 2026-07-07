import { createClient } from "@/lib/supabase/server";
import type { EventCatalogs } from "@/types/events";

export async function getEventCatalogs(): Promise<EventCatalogs> {
  const supabase = await createClient();

  const [animatedTemplates, themes, fonts, fontColors] = await Promise.all([
    supabase
      .from("invitation_animated_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("invitation_themes").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("invitation_fonts").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("invitation_font_colors")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return {
    animatedTemplates: (animatedTemplates.data ?? []) as EventCatalogs["animatedTemplates"],
    themes: (themes.data ?? []) as EventCatalogs["themes"],
    fonts: (fonts.data ?? []) as EventCatalogs["fonts"],
    fontColors: (fontColors.data ?? []) as EventCatalogs["fontColors"],
  };
}
