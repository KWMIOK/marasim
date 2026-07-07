export type UserRole = "super_admin" | "host" | "check_in_staff";
export type TemplateType = "standard" | "vip";
export type RsvpStatus =
  | "not_opened"
  | "opened_no_response"
  | "confirmed"
  | "declined"
  | "maybe";
export type CheckInStatus = "not_checked_in" | "checked_in";
export type EventStatus = "draft" | "published" | "archived";
export type ContentSlotType = "text" | "image" | "video";
export type ContentLocale = "ar" | "en" | "both";

export interface ContentSlot {
  key: string;
  type: ContentSlotType;
  value: string;
  label?: string;
  locale?: ContentLocale;
  order?: number;
}

export interface EventSettings {
  locale_default?: "ar" | "en";
  companion_limit?: number;
  whatsapp_message_template?: string;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  slug: string;
  event_type: string;
  groom_name: string | null;
  bride_name: string | null;
  honoree_name: string | null;
  template_type: TemplateType;
  status: EventStatus;
  event_date: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  location_name: string | null;
  venue: string | null;
  maps_url: string | null;
  maps_lat: number | null;
  maps_lng: number | null;
  countdown_target: string | null;
  custom_message: string | null;
  hero_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  content_slots: ContentSlot[];
  settings: EventSettings;
  is_template: boolean;
  source_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  phone_number: string | null;
  unique_token: string;
  rsvp_status: RsvpStatus;
  check_in_status: CheckInStatus;
  checked_in_at: string | null;
  table_number: string | null;
  is_vip: boolean;
  companion_count: number;
  opened_at: string | null;
  rsvp_updated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckInLog {
  id: string;
  guest_id: string;
  event_id: string;
  gate_id: string | null;
  checked_in_by: string | null;
  checked_in_at: string;
  is_duplicate: boolean;
  metadata: Record<string, unknown>;
}

export interface EventAnalytics {
  event_id: string;
  total_guests: number;
  confirmed: number;
  declined: number;
  maybe: number;
  not_opened: number;
  opened_no_response: number;
  checked_in: number;
  total_companions_checked_in: number;
}

export interface GuestInvitationPayload {
  guest: Pick<
    Guest,
    "id" | "name" | "phone_number" | "rsvp_status" | "is_vip" | "companion_count"
  >;
  event: Pick<
    Event,
    | "id"
    | "title"
    | "slug"
    | "template_type"
    | "event_date"
    | "location_name"
    | "maps_url"
    | "countdown_target"
    | "primary_color"
    | "secondary_color"
    | "content_slots"
    | "settings"
  >;
}

type DefaultRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Profile>;
        Relationships: DefaultRelationship[];
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Event>;
        Relationships: DefaultRelationship[];
      };
      guests: {
        Row: Guest;
        Insert: Omit<Guest, "id" | "created_at" | "updated_at" | "unique_token"> & {
          id?: string;
          unique_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Guest>;
        Relationships: DefaultRelationship[];
      };
      check_in_logs: {
        Row: CheckInLog;
        Insert: Omit<CheckInLog, "id" | "checked_in_at"> & {
          id?: string;
          checked_in_at?: string;
        };
        Update: Partial<CheckInLog>;
        Relationships: DefaultRelationship[];
      };
    };
    Views: {
      event_analytics: {
        Row: EventAnalytics;
        Relationships: DefaultRelationship[];
      };
    };
    Functions: {
      get_guest_invitation: {
        Args: { p_slug: string; p_token: string };
        Returns: Json;
      };
      submit_guest_rsvp: {
        Args: {
          p_token: string;
          p_name: string;
          p_phone: string;
          p_status: RsvpStatus;
          p_companion_count?: number;
        };
        Returns: Json;
      };
      check_in_guest: {
        Args: {
          p_token: string;
          p_gate_id?: string | null;
          p_staff_id?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      template_type: TemplateType;
      rsvp_status: RsvpStatus;
      check_in_status: CheckInStatus;
      event_status: EventStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
