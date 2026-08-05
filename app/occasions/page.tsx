import { ChooseEventTypeContent } from "@/components/pages/choose-event-type-content";
import { OccasionsResumeRedirect } from "@/components/occasions/occasions-resume-redirect";
import { getOccasionLowestPrices } from "@/lib/data/occasion-pricing";

export default async function OccasionsPage() {
  const lowestPrices = await getOccasionLowestPrices();

  return (
    <OccasionsResumeRedirect>
      <ChooseEventTypeContent lowestPrices={lowestPrices} />
    </OccasionsResumeRedirect>
  );
}
