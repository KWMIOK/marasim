"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/hooks/use-locale";

type CatalogItem = {
  id: string;
  name: string;
  description?: string | null;
  preview_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  color_hex?: string;
  font_family?: string;
  animation_key?: string;
};

export function CatalogPicker<T extends CatalogItem>({
  label,
  items,
  value,
  onChange,
  renderPreview,
}: {
  label: string;
  items: T[];
  value: string | null;
  onChange: (id: string) => void;
  renderPreview?: (item: T, selected: boolean) => ReactNode;
}) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-gold p-4 text-sm text-muted">
        {t("eventForm.noCatalog", { label: label.toLowerCase() })}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gold-light">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const selected = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                selected
                  ? "border-gold bg-gold/10 ring-2 ring-gold"
                  : "border-border-gold surface-card hover:border-border-gold"
              )}
            >
              {renderPreview ? (
                renderPreview(item, selected)
              ) : (
                <DefaultPreview item={item} selected={selected} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DefaultPreview({ item }: { item: CatalogItem; selected: boolean }) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className="mb-2 flex h-20 items-center justify-center rounded-lg border border-border-gold text-xs text-gold-muted"
        style={{
          background:
            item.primary_color && item.secondary_color
              ? `linear-gradient(135deg, ${item.primary_color}, ${item.secondary_color})`
              : item.color_hex ?? "#f4f4f5",
          color: item.color_hex ? item.color_hex : undefined,
        }}
      >
        {item.preview_url ? t("catalog.preview") : item.animation_key ?? t("catalog.option")}
      </div>
      <p className="text-sm font-medium text-gold-light">{item.name}</p>
      {item.description ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description}</p>
      ) : null}
      {item.font_family ? (
        <p className="mt-1 text-sm" style={{ fontFamily: item.font_family }}>
          Aa بب
        </p>
      ) : null}
    </>
  );
}
