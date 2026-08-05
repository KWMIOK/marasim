import {
  getOccasionFlow,
  resetOccasionFlowAfterSuccess,
} from "@/lib/flow/occasion-flow";
import { saveHostInvitation } from "@/lib/invitations/host-invitations";

/** Moves a completed success-step flow from sessionStorage into saved host invitations. */
export function migrateStuckSuccessFlowToHostInvitations(): boolean {
  const flow = getOccasionFlow();

  if (flow?.step !== "success" || !flow.templateId || !flow.generatedLinks) {
    return false;
  }

  saveHostInvitation({
    templateId: flow.templateId,
    eventDisplayName: flow.customizeForm.hostName.trim() || "Occasion",
    eventDate: flow.customizeForm.date || null,
    category: flow.category,
    occasion: flow.occasion,
    guestUrl: flow.generatedLinks.guestUrl,
    receptionistUrl: flow.customizeForm.guestQr ? flow.generatedLinks.receptionistUrl : "",
    receptionSessionToken: flow.generatedLinks.receptionistToken,
    guestQrEnabled: flow.customizeForm.guestQr,
    receptionStaffCount: flow.customizeForm.guestQr ? (flow.customizeForm.receptionStaffCount ?? 0) : 0,
    location: flow.customizeForm.location,
    locationDirections: flow.customizeForm.locationDirections,
    mapsLat: flow.customizeForm.mapsLat,
    mapsLng: flow.customizeForm.mapsLng,
    mapsUrl: flow.customizeForm.mapsUrl,
    eventLogoUrl: flow.customizeForm.eventLogoUrl,
    noKidsAllowed: flow.customizeForm.noKidsAllowed,
    dressCode: flow.customizeForm.dressCode,
    menOnly: flow.customizeForm.menOnly,
    womenOnly: flow.customizeForm.womenOnly,
    couplesOnly: flow.customizeForm.couplesOnly,
    noPhotos: flow.customizeForm.noPhotos,
  });

  resetOccasionFlowAfterSuccess();
  return true;
}
