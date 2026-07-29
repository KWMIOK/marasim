import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TemplatePreviewContent } from "@/components/pages/template-preview-content";
import { getTemplateById } from "@/lib/data/templates";

export default async function TemplatePreviewPage({
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
      <TemplatePreviewContent template={template} />
    </Suspense>
  );
}
