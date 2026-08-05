import { notFound } from "next/navigation";
import { ChooseOccasionContent } from "@/components/pages/choose-occasion-content";
import { isEventCategory } from "@/lib/events/categories";

export default async function OccasionCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isEventCategory(category) || category === "vip") {
    notFound();
  }

  return <ChooseOccasionContent category={category} />;
}
