import type { InvitationLanguage } from "@/types/events";

export type SelectedTemplateFormState = {
  hostName: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  location: string;
  mapsLat: number | null;
  mapsLng: number | null;
  mapsUrl: string;
  primaryColor: string;
  secondaryColor: string;
  language: InvitationLanguage;
  guestQr: boolean;
  sharedPhotoGallery: boolean;
  guestBook: boolean;
  thankYouMessage: boolean;
};

export const DEFAULT_SELECTED_TEMPLATE_FORM: SelectedTemplateFormState = {
  hostName: "",
  date: "",
  timeFrom: "",
  timeTo: "",
  location: "",
  mapsLat: null,
  mapsLng: null,
  mapsUrl: "",
  primaryColor: "#c9a227",
  secondaryColor: "#1a1a2e",
  language: "ar",
  guestQr: true,
  sharedPhotoGallery: false,
  guestBook: false,
  thankYouMessage: true,
};

export function parseSelectedTemplateForm(value: unknown): SelectedTemplateFormState {
  if (!value || typeof value !== "object") {
    return DEFAULT_SELECTED_TEMPLATE_FORM;
  }

  const record = value as Partial<SelectedTemplateFormState> & { time?: string };

  const legacyTime = typeof record.time === "string" ? record.time : "";

  return {
    hostName: typeof record.hostName === "string" ? record.hostName : "",
    date: typeof record.date === "string" ? record.date : "",
    timeFrom: typeof record.timeFrom === "string" ? record.timeFrom : legacyTime,
    timeTo: typeof record.timeTo === "string" ? record.timeTo : "",
    location: typeof record.location === "string" ? record.location : "",
    mapsLat: typeof record.mapsLat === "number" ? record.mapsLat : null,
    mapsLng: typeof record.mapsLng === "number" ? record.mapsLng : null,
    mapsUrl: typeof record.mapsUrl === "string" ? record.mapsUrl : "",
    primaryColor:
      typeof record.primaryColor === "string" ? record.primaryColor : DEFAULT_SELECTED_TEMPLATE_FORM.primaryColor,
    secondaryColor:
      typeof record.secondaryColor === "string"
        ? record.secondaryColor
        : DEFAULT_SELECTED_TEMPLATE_FORM.secondaryColor,
    language: record.language === "en" ? "en" : "ar",
    guestQr: record.guestQr ?? DEFAULT_SELECTED_TEMPLATE_FORM.guestQr,
    sharedPhotoGallery: record.sharedPhotoGallery ?? DEFAULT_SELECTED_TEMPLATE_FORM.sharedPhotoGallery,
    guestBook: record.guestBook ?? DEFAULT_SELECTED_TEMPLATE_FORM.guestBook,
    thankYouMessage: record.thankYouMessage ?? DEFAULT_SELECTED_TEMPLATE_FORM.thankYouMessage,
  };
}
