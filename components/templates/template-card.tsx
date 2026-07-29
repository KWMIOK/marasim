"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlideToChoose } from "@/components/templates/slide-to-choose";
import type { BrowseTemplate } from "@/lib/templates/browse";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

function TemplateCardBackground({ template }: { template: BrowseTemplate }) {
  if (template.preview_url) {
    return (
      <img
        src={template.preview_url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  const gradients = [
    "linear-gradient(160deg, rgb(18 16 12) 0%, rgb(201 162 39 / 0.45) 100%)",
    "linear-gradient(160deg, rgb(12 12 12) 0%, rgb(154 132 85 / 0.5) 100%)",
    "linear-gradient(160deg, rgb(20 18 14) 0%, rgb(232 213 163 / 0.35) 100%)",
    "linear-gradient(160deg, rgb(8 8 8) 0%, rgb(201 162 39 / 0.3) 100%)",
  ];

  return (
    <div
      className="absolute inset-0"
      style={{ background: gradients[template.sort_order % gradients.length] }}
    />
  );
}

export function TemplateCard({
  template,
  browseQuery,
  isChoosing,
  onChooseMode,
  onChooseComplete,
}: {
  template: BrowseTemplate;
  browseQuery: string;
  isChoosing: boolean;
  onChooseMode: () => void;
  onChooseComplete: () => void;
}) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isChoosing) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isChoosing]);

  function handleCardClick() {
    onChooseMode();
  }

  function handlePreviewClick(event: ReactMouseEvent) {
    event.stopPropagation();
  }

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
      className={cn(
        "relative min-h-[12.75rem] overflow-hidden rounded-2xl border border-border-gold shadow-lg shadow-black/25 transition",
        isChoosing && "ring-2 ring-gold/50"
      )}
    >
      <TemplateCardBackground template={template} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

      {template.status ? (
        <span className="absolute start-3 top-3 rounded-full border border-border-gold-strong bg-surface/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-light backdrop-blur-sm">
          {t(`browseTemplates.status.${template.status}` as TranslationKey)}
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-4 pt-10 text-center">
        <h3 className="text-sm font-semibold text-gold-light">{template.name}</h3>
        {template.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{template.description}</p>
        ) : null}

        {isChoosing ? (
          <div className="mt-3 w-full" onClick={(event) => event.stopPropagation()}>
            <SlideToChoose
              label={t("browseTemplates.chooseTemplate")}
              onComplete={onChooseComplete}
            />
          </div>
        ) : (
          <Link
            href={`${ROUTES.templates.preview(template.id)}${browseQuery}`}
            onClick={handlePreviewClick}
            className="btn-outline-gold mt-3 rounded-xl px-4 py-2 text-xs font-medium"
          >
            {t("browseTemplates.preview")}
          </Link>
        )}
      </div>
    </article>
  );
}

export function TemplateSearchField({
  templates,
  value,
  onChange,
  onSelectTemplate,
}: {
  templates: BrowseTemplate[];
  value: string;
  onChange: (value: string) => void;
  onSelectTemplate: (templateId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return [];

    return templates
      .filter((template) => template.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [templates, value]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t("browseTemplates.searchPlaceholder")}
        className="surface-card w-full rounded-2xl px-4 py-3.5 text-sm text-gold-light outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/40"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
      />

      {open && suggestions.length > 0 ? (
        <ul
          className="surface-card absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-border-gold py-2 shadow-xl shadow-black/40"
          role="listbox"
        >
          {suggestions.map((template) => (
            <li key={template.id} role="option">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-sm text-gold-light transition hover:bg-surface"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(template.name);
                  onSelectTemplate(template.id);
                  setOpen(false);
                }}
              >
                {template.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function useTemplateSelectionNavigation(browseQuery: string) {
  const router = useRouter();

  return (templateId: string) => {
    router.push(`${ROUTES.templates.customize(templateId)}${browseQuery}`);
  };
}
