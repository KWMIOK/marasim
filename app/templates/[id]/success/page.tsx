import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TemplateSuccessContent } from "@/components/pages/template-success-content";
import { getTemplateById } from "@/lib/data/templates";

export default async function TemplateSuccessPage({
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
      <TemplateSuccessContent templateId={template.id} />
    </Suspense>
  );
}
