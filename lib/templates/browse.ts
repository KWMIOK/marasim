import type { InvitationAnimatedTemplate } from "@/types/events";

export type TemplateStatus = "new" | "most_selected" | "popular" | "featured";

export type BrowseTemplate = InvitationAnimatedTemplate & {
  status: TemplateStatus | null;
};

const STATUS_BY_INDEX: (TemplateStatus | null)[] = [
  "new",
  "most_selected",
  "popular",
  "featured",
  null,
];

export function enrichTemplatesForBrowse(
  templates: InvitationAnimatedTemplate[]
): BrowseTemplate[] {
  return templates.map((template, index) => ({
    ...template,
    status: STATUS_BY_INDEX[index % STATUS_BY_INDEX.length],
  }));
}

export function filterTemplatesByName(templates: BrowseTemplate[], query: string): BrowseTemplate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return templates;

  return templates.filter((template) => {
    const name = template.name.toLowerCase();
    const description = (template.description ?? "").toLowerCase();
    return name.includes(normalized) || description.includes(normalized);
  });
}

export function buildTemplateBrowseQuery(params: {
  category?: string | null;
  occasion?: string | null;
}) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.occasion) search.set("occasion", params.occasion);
  const query = search.toString();
  return query ? `?${query}` : "";
}
