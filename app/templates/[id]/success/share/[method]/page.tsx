import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  TemplateShareMethodContent,
  type InvitationShareMethod,
} from "@/components/pages/template-share-method-content";
import { getTemplateById } from "@/lib/data/templates";

const SHARE_METHODS = new Set<InvitationShareMethod>([
  "manual",
  "contacts",
  "import",
  "public-link",
]);

function isShareMethod(value: string): value is InvitationShareMethod {
  return SHARE_METHODS.has(value as InvitationShareMethod);
}

export default async function TemplateShareMethodPage({
  params,
}: {
  params: Promise<{ id: string; method: string }>;
}) {
  const { id, method } = await params;

  if (!isShareMethod(method)) {
    notFound();
  }

  const template = await getTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <TemplateShareMethodContent templateId={template.id} method={method} />
    </Suspense>
  );
}
