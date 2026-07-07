"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/urls";
import { ROUTES } from "@/lib/constants/routes";
import type {
  ContentSlot,
  EventStatus,
  TemplateType,
} from "@/types/database";
import type { CeremonyEventType, EventFormSettings } from "@/types/events";

export type CreateEventInput = {
  title: string;
  slug?: string;
  event_type: CeremonyEventType;
  groom_name?: string;
  bride_name?: string;
  honoree_name?: string;
  template_type: TemplateType;
  status: EventStatus;
  host_id: string;
  start_datetime?: string;
  end_datetime?: string;
  venue?: string;
  maps_url?: string;
  maps_lat?: number | null;
  maps_lng?: number | null;
  custom_message?: string;
  hero_image_url?: string;
  primary_color: string;
  secondary_color: string;
  content_slots: ContentSlot[];
  settings?: EventFormSettings;
};

export type ActionResult =
  | { success: true; eventId: string }
  | { success: false; error: string };

async function requireSuperAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return profile;
}

function toTimestamp(value?: string): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function uniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, base: string) {
  let slug = slugify(base);
  if (!slug) slug = "event";

  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const { data } = await supabase
      .from("events")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  return `${slug}-${Date.now()}`;
}

export async function createEvent(input: CreateEventInput): Promise<ActionResult> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const slug = input.slug?.trim()
    ? slugify(input.slug)
    : await uniqueSlug(supabase, input.title);

  if (!slug) {
    return { success: false, error: "Could not generate a valid event slug." };
  }

  const startDatetime = toTimestamp(input.start_datetime);

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: input.host_id,
      title: input.title.trim(),
      slug,
      event_type: input.event_type,
      groom_name: input.groom_name?.trim() || null,
      bride_name: input.bride_name?.trim() || null,
      honoree_name: input.honoree_name?.trim() || null,
      template_type: input.template_type,
      status: input.status,
      event_date: startDatetime,
      start_datetime: startDatetime,
      end_datetime: toTimestamp(input.end_datetime),
      location_name: input.venue?.trim() || null,
      venue: input.venue?.trim() || null,
      maps_url: input.maps_url?.trim() || null,
      maps_lat: input.maps_lat ?? null,
      maps_lng: input.maps_lng ?? null,
      countdown_target: startDatetime,
      custom_message: input.custom_message?.trim() || null,
      hero_image_url: input.hero_image_url?.trim() || null,
      primary_color: input.primary_color,
      secondary_color: input.secondary_color,
      content_slots: input.content_slots,
      settings: input.settings ?? { locale_default: "ar", toggles: {} },
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to create event." };
  }

  const eventId = (data as { id: string }).id;

  revalidatePath(ROUTES.admin.root);
  revalidatePath(ROUTES.admin.events);

  return { success: true, eventId };
}

export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<ActionResult> {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ status } as never)
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.admin.events);
  revalidatePath(ROUTES.admin.event(eventId));

  return { success: true, eventId };
}

export async function importGuestsForEvent(
  eventId: string,
  guests: Array<{
    name: string;
    phone_number?: string;
    is_vip?: boolean;
    table_number?: string;
    companion_count?: number;
  }>
): Promise<{ success: true; imported: number } | { success: false; error: string }> {
  await requireSuperAdmin();
  const supabase = await createClient();

  if (guests.length === 0) {
    return { success: false, error: "No valid guests found in file." };
  }

  const rows = guests.map((guest) => ({
    event_id: eventId,
    name: guest.name.trim(),
    phone_number: guest.phone_number?.trim() || null,
    is_vip: guest.is_vip ?? false,
    table_number: guest.table_number?.trim() || null,
    companion_count: guest.companion_count ?? 0,
  }));

  const { error } = await supabase.from("guests").insert(rows as never);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(ROUTES.admin.event(eventId));
  revalidatePath(ROUTES.admin.root);

  return { success: true, imported: rows.length };
}

export async function redirectToEvent(eventId: string) {
  redirect(ROUTES.admin.event(eventId));
}
