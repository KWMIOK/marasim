import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TemplateShareContent } from "@/components/pages/template-share-content";
import { getTemplateById } from "@/lib/data/templates";

export default async function TemplateSharePage({
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
      <TemplateShareContent templateId={template.id} />
    </Suspense>
  );
}
