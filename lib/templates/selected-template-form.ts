import type { InvitationLanguage } from "@/types/events";
import {
  DEFAULT_INVITATION_THEME_ID,
  invitationThemeColors,
  resolveInvitationThemeId,
  type InvitationThemeId,
} from "@/lib/templates/invitation-themes";

export type SelectedTemplateFormState = {
  hostName: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  location: string;
  locationDirections: string;
  mapsLat: number | null;
  mapsLng: number | null;
  mapsUrl: string;
  themeId: InvitationThemeId;
  primaryColor: string;
  secondaryColor: string;
  eventLogoUrl: string | null;
  language: InvitationLanguage;
  guestQr: boolean;
  receptionStaffCount: number;
  sharedPhotoGallery: boolean;
  guestBook: boolean;
  thankYouMessage: boolean;
  noKidsAllowed: boolean;
  dressCode: boolean;
  menOnly: boolean;
  womenOnly: boolean;
  couplesOnly: boolean;
  noPhotos: boolean;
};

export const DEFAULT_SELECTED_TEMPLATE_FORM: SelectedTemplateFormState = {
  hostName: "",
  date: "",
  timeFrom: "",
  timeTo: "",
  location: "",
  locationDirections: "",
  mapsLat: null,
  mapsLng: null,
  mapsUrl: "",
  themeId: DEFAULT_INVITATION_THEME_ID,
  primaryColor: "#c9a227",
  secondaryColor: "#1a1a2e",
  eventLogoUrl: null,
  language: "ar",
  guestQr: true,
  receptionStaffCount: 0,
  sharedPhotoGallery: false,
  guestBook: false,
  thankYouMessage: true,
  noKidsAllowed: false,
  dressCode: false,
  menOnly: false,
  womenOnly: false,
  couplesOnly: false,
  noPhotos: false,
};

export function parseSelectedTemplateForm(value: unknown): SelectedTemplateFormState {
  if (!value || typeof value !== "object") {
    return DEFAULT_SELECTED_TEMPLATE_FORM;
  }

  const record = value as Partial<SelectedTemplateFormState> & { time?: string };

  const legacyTime = typeof record.time === "string" ? record.time : "";
  const themeId = resolveInvitationThemeId({
    themeId: record.themeId,
    primaryColor: record.primaryColor,
    secondaryColor: record.secondaryColor,
  });
  const themeColors = invitationThemeColors(themeId);

  return {
    hostName: typeof record.hostName === "string" ? record.hostName : "",
    date: typeof record.date === "string" ? record.date : "",
    timeFrom: typeof record.timeFrom === "string" ? record.timeFrom : legacyTime,
    timeTo: typeof record.timeTo === "string" ? record.timeTo : "",
    location: typeof record.location === "string" ? record.location : "",
    locationDirections:
      typeof record.locationDirections === "string" ? record.locationDirections : "",
    mapsLat: typeof record.mapsLat === "number" ? record.mapsLat : null,
    mapsLng: typeof record.mapsLng === "number" ? record.mapsLng : null,
    mapsUrl: typeof record.mapsUrl === "string" ? record.mapsUrl : "",
    themeId,
    primaryColor: themeColors.primaryColor,
    secondaryColor: themeColors.secondaryColor,
    eventLogoUrl:
      typeof record.eventLogoUrl === "string" && record.eventLogoUrl.startsWith("data:image/")
        ? record.eventLogoUrl
        : null,
    language: record.language === "en" ? "en" : "ar",
    guestQr: record.guestQr ?? DEFAULT_SELECTED_TEMPLATE_FORM.guestQr,
    receptionStaffCount: clampReceptionStaffCount(record.receptionStaffCount),
    sharedPhotoGallery: record.sharedPhotoGallery ?? DEFAULT_SELECTED_TEMPLATE_FORM.sharedPhotoGallery,
    guestBook: record.guestBook ?? DEFAULT_SELECTED_TEMPLATE_FORM.guestBook,
    thankYouMessage: record.thankYouMessage ?? DEFAULT_SELECTED_TEMPLATE_FORM.thankYouMessage,
    noKidsAllowed: record.noKidsAllowed ?? DEFAULT_SELECTED_TEMPLATE_FORM.noKidsAllowed,
    dressCode: record.dressCode ?? DEFAULT_SELECTED_TEMPLATE_FORM.dressCode,
    menOnly: record.menOnly ?? DEFAULT_SELECTED_TEMPLATE_FORM.menOnly,
    womenOnly: record.womenOnly ?? DEFAULT_SELECTED_TEMPLATE_FORM.womenOnly,
    couplesOnly: record.couplesOnly ?? DEFAULT_SELECTED_TEMPLATE_FORM.couplesOnly,
    noPhotos: record.noPhotos ?? DEFAULT_SELECTED_TEMPLATE_FORM.noPhotos,
  };
}

export function clampReceptionStaffCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SELECTED_TEMPLATE_FORM.receptionStaffCount;
  }
  return Math.min(20, Math.round(parsed));
}
