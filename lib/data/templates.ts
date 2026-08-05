import { createClient } from "@/lib/supabase/server";
import type { InvitationAnimatedTemplate } from "@/types/events";

export async function getActiveTemplates(): Promise<InvitationAnimatedTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitation_animated_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) {
    return FALLBACK_TEMPLATES;
  }

  return data as InvitationAnimatedTemplate[];
}

export async function getTemplateById(id: string): Promise<InvitationAnimatedTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitation_animated_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return FALLBACK_TEMPLATES.find((template) => template.id === id) ?? null;
  }

  return data as InvitationAnimatedTemplate;
}

const FALLBACK_TEMPLATES: InvitationAnimatedTemplate[] = [
  {
    id: "demo-elegant-rise",
    name_ar: "صعود أنيق",
    name_en: "Elegant Rise",
    description_ar: "تلاشٍ ناعم مع حركة صعود للاحتفالات الراقية.",
    description_en: "Soft fade with upward motion for refined celebrations.",
    preview_url: null,
    animation_key: "fade-rise",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "demo-golden-shimmer",
    name_ar: "بريق ذهبي",
    name_en: "Golden Shimmer",
    description_ar: "دخول فاخر بلمعان ذهبي دافئ.",
    description_en: "Luxury shimmer entrance with warm gold accents.",
    preview_url: null,
    animation_key: "shimmer",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "demo-floral-bloom",
    name_ar: "ازدهار زهري",
    name_en: "Floral Bloom",
    description_ar: "حركة ازدهار عضوية مع لمسات زهرية.",
    description_en: "Organic bloom animation with delicate floral motifs.",
    preview_url: null,
    animation_key: "bloom",
    is_active: true,
    sort_order: 3,
  },
  {
    id: "demo-classic-slide",
    name_ar: "انزلاق كلاسيكي",
    name_en: "Classic Slide",
    description_ar: "انزلاق أفقي نظيف للدعوات الخالدة.",
    description_en: "Clean horizontal slide for timeless invitation layouts.",
    preview_url: null,
    animation_key: "slide",
    is_active: true,
    sort_order: 4,
  },
];
