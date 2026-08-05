import { ChooseVipOccasionContent } from "@/components/pages/choose-vip-occasion-content";
import { getActiveTemplates } from "@/lib/data/templates";

export default async function VipOccasionPage() {
  const templates = await getActiveTemplates();
  return <ChooseVipOccasionContent templates={templates} />;
}
