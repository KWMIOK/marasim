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
    receptionistUrl: flow.generatedLinks.receptionistUrl,
    guestQrEnabled: flow.customizeForm.guestQr,
  });

  resetOccasionFlowAfterSuccess();
  return true;
}
