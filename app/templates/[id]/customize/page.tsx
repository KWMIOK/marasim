import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TemplateCustomizeContent } from "@/components/pages/template-customize-content";
import { getTemplateById } from "@/lib/data/templates";

export default async function TemplateCustomizePage({
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
      <TemplateCustomizeContent template={template} />
    </Suspense>
  );
}
