"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import {
  TemplateCard,
  TemplateSearchField,
  useTemplateSelectionNavigation,
} from "@/components/templates/template-card";
import {
  enrichTemplatesForBrowse,
  filterTemplatesByName,
  buildTemplateBrowseQuery,
} from "@/lib/templates/browse";
import {
  EVENT_CATEGORIES,
  OCCASION_TYPES_BY_CATEGORY,
  isEventCategory,
  type EventCategory,
  type OccasionTypeId,
} from "@/lib/events/categories";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { InvitationAnimatedTemplate } from "@/types/events";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

type BrowseTab = "ready" | "bespoke";

const ALL_OCCASION_TYPES: OccasionTypeId[] = EVENT_CATEGORIES.flatMap(
  (category) => OCCASION_TYPES_BY_CATEGORY[category]
);

function uniqueOccasionTypes(types: OccasionTypeId[]): OccasionTypeId[] {
  return [...new Set(types)];
}

export function BrowseTemplatesContent({
  templates,
}: {
  templates: InvitationAnimatedTemplate[];
}) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category");
  const occasionParam = searchParams.get("occasion");

  const category = categoryParam && isEventCategory(categoryParam) ? categoryParam : null;
  const initialOccasion =
    occasionParam && ALL_OCCASION_TYPES.includes(occasionParam as OccasionTypeId)
      ? (occasionParam as OccasionTypeId)
      : null;

  const browseTemplates = useMemo(() => enrichTemplatesForBrowse(templates), [templates]);
  const occasionTypes = useMemo(
    () =>
      uniqueOccasionTypes(
        category ? OCCASION_TYPES_BY_CATEGORY[category] : ALL_OCCASION_TYPES
      ),
    [category]
  );

  const [activeTab, setActiveTab] = useState<BrowseTab>("ready");
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTypeId | null>(initialOccasion);
  const [searchQuery, setSearchQuery] = useState("");
  const [choosingTemplateId, setChoosingTemplateId] = useState<string | null>(null);
  const [focusTemplateId, setFocusTemplateId] = useState<string | null>(null);

  const browseQuery = buildTemplateBrowseQuery({
    category: category ?? categoryParam,
    occasion: selectedOccasion ?? occasionParam,
  });

  const navigateToCustomize = useTemplateSelectionNavigation(browseQuery);

  const filteredTemplates = useMemo(() => {
    let results = filterTemplatesByName(browseTemplates, searchQuery);
    if (focusTemplateId) {
      results = results.filter((template) => template.id === focusTemplateId);
    }
    return results;
  }, [browseTemplates, searchQuery, focusTemplateId]);

  function buildBespokeHref(currentCategory: EventCategory | null) {
    const params = new URLSearchParams({ flow: "custom" });
    if (currentCategory) params.set("category", currentCategory);
    if (selectedOccasion) params.set("occasion", selectedOccasion);
    return `${ROUTES.create}?${params.toString()}`;
  }

  function handleSearchSelect(templateId: string) {
    setFocusTemplateId(templateId);
    setChoosingTemplateId(null);
    requestAnimationFrame(() => {
      document.getElementById(`template-card-${templateId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  return (
    <AppPageShell>
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("browseTemplates.title")}</h1>
      </header>

      <div className="mt-6">
        <TemplateSearchField
          templates={browseTemplates}
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            if (!value.trim()) setFocusTemplateId(null);
          }}
          onSelectTemplate={handleSearchSelect}
        />
      </div>

      <section className="mt-5">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {occasionTypes.map((type) => {
            const selected = selectedOccasion === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedOccasion(type);
                  setFocusTemplateId(null);
                }}
                aria-pressed={selected}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition",
                  selected
                    ? "btn-gold border-border-gold-strong text-[#0a0a0a]"
                    : "surface-card text-gold-light hover:border-border-gold-strong"
                )}
              >
                {t(`occasionTypes.${type}` as TranslationKey)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-gold bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            className={cn(
              "rounded-xl px-3 py-2.5 text-xs font-medium transition sm:text-sm",
              activeTab === "ready" ? "btn-gold text-[#0a0a0a]" : "text-muted"
            )}
          >
            {t("browseTemplates.tabs.ready")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bespoke")}
            className={cn(
              "rounded-xl px-3 py-2.5 text-xs font-medium transition sm:text-sm",
              activeTab === "bespoke" ? "btn-gold text-[#0a0a0a]" : "text-muted"
            )}
          >
            {t("browseTemplates.tabs.bespoke")}
          </button>
        </div>
      </section>

      {activeTab === "ready" ? (
        <section className="mt-6 grid grid-cols-2 gap-3">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div key={template.id} id={`template-card-${template.id}`}>
                <TemplateCard
                  template={template}
                  browseQuery={browseQuery}
                  isChoosing={choosingTemplateId === template.id}
                  onChooseMode={() => setChoosingTemplateId(template.id)}
                  onChooseComplete={() => navigateToCustomize(template.id)}
                />
              </div>
            ))
          ) : (
            <p className="col-span-2 py-8 text-sm text-muted">{t("browseTemplates.noResults")}</p>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <article className="surface-card rounded-2xl p-6">
            <h2 className="text-base font-semibold text-gold-light">
              {t("chooseOccasion.bespokeDesign.title")}
            </h2>
            <p className="mt-2 text-sm text-muted">{t("chooseOccasion.bespokeDesign.description")}</p>
            <Link
              href={buildBespokeHref(category)}
              className="btn-gold mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              {t("chooseOccasion.bespokeDesign.cta")}
            </Link>
          </article>
        </section>
      )}
    </AppPageShell>
  );
}
