import { ChooseEventTypeContent } from "@/components/pages/choose-event-type-content";
import { OccasionsResumeRedirect } from "@/components/occasions/occasions-resume-redirect";

export default function OccasionsPage() {
  return (
    <OccasionsResumeRedirect>
      <ChooseEventTypeContent />
    </OccasionsResumeRedirect>
  );
}
