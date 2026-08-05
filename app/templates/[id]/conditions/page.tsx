import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TemplateConditionsContent } from "@/components/pages/template-conditions-content";
import { getTemplateById } from "@/lib/data/templates";

export default async function TemplateConditionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <TemplateConditionsContent template={template} />
    </Suspense>
  );
}
