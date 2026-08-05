"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import {
  TemplateSectionHeading,
  TemplateSwitchField,
} from "@/components/templates/selected-template-form";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import {
  DEFAULT_SELECTED_TEMPLATE_FORM,
  parseSelectedTemplateForm,
  type SelectedTemplateFormState,
} from "@/lib/templates/selected-template-form";
import { getOccasionFlow, isOccasionTypeId } from "@/lib/flow/occasion-flow";
import { isEventCategory } from "@/lib/events/categories";
import { useOccasionFlowPersistence } from "@/hooks/use-occasion-flow";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { InvitationAnimatedTemplate } from "@/types/events";

function ConditionsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function SwitchDotIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden>
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function readSavedForm(): SelectedTemplateFormState {
  const saved = getOccasionFlow()?.customizeForm;
  return saved ? parseSelectedTemplateForm(saved) : DEFAULT_SELECTED_TEMPLATE_FORM;
}

type ConditionKey =
  | "noKidsAllowed"
  | "dressCode"
  | "menOnly"
  | "womenOnly"
  | "couplesOnly"
  | "noPhotos";

const CONDITION_KEYS: ConditionKey[] = [
  "noKidsAllowed",
  "dressCode",
  "menOnly",
  "womenOnly",
  "couplesOnly",
  "noPhotos",
];

export function TemplateConditionsContent({ template }: { template: InvitationAnimatedTemplate }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(DEFAULT_SELECTED_TEMPLATE_FORM);
  const [formHydrated, setFormHydrated] = useState(false);

  const categoryParam = searchParams.get("category");
  const occasionParam = searchParams.get("occasion");
  const category = categoryParam && isEventCategory(categoryParam) ? categoryParam : null;
  const occasion = occasionParam && isOccasionTypeId(occasionParam) ? occasionParam : null;

  const browseQuery = buildTemplateBrowseQuery({ category, occasion });
  const customizeHref = `${ROUTES.templates.customize(template.id)}${browseQuery}`;

  useEffect(() => {
    setForm(readSavedForm());
    setFormHydrated(true);
  }, []);

  useOccasionFlowPersistence({
    enabled: formHydrated,
    step: "customize",
    category,
    occasion,
    templateId: template.id,
    customizeForm: form,
  });

  function updateCondition(key: ConditionKey, value: boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppPageShell className="pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("eventConditions.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("eventConditions.subtitle")}</p>
      </header>

      <section className="mt-6">
        <TemplateSectionHeading icon={<ConditionsIcon />} title={t("eventConditions.title")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CONDITION_KEYS.map((key) => (
            <TemplateSwitchField
              key={key}
              htmlFor={key}
              icon={<SwitchDotIcon />}
              label={t(`eventConditions.${key}`)}
              checked={form[key]}
              onChange={(value) => updateCondition(key, value)}
            />
          ))}
        </div>
      </section>

      <div className="mt-8">
        <Link
          href={customizeHref}
          className="btn-outline-gold flex w-full items-center justify-center rounded-xl px-3 py-3 text-sm font-medium"
        >
          {t("eventConditions.backToTemplate")}
        </Link>
      </div>
    </AppPageShell>
  );
}
