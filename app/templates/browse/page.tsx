import { Suspense } from "react";
import { BrowseTemplatesContent } from "@/components/pages/browse-templates-content";
import { getActiveTemplates } from "@/lib/data/templates";

export default async function BrowseTemplatesPage() {
  const templates = await getActiveTemplates();

  return (
    <Suspense fallback={null}>
      <BrowseTemplatesContent templates={templates} />
    </Suspense>
  );
}
