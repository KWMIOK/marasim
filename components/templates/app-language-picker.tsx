"use client";

import { useEffect, useState } from "react";
import { AppPickerModal } from "@/components/templates/app-picker-modal";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function AppLanguagePickerField({
  label,
  htmlFor,
  icon,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  htmlFor: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? t("selectedTemplate.pickLanguage");

  useEffect(() => {
    if (!open) return;
    setDraft(value);
  }, [open, value]);

  function openModal() {
    setDraft(value);
    setOpen(true);
  }

  return (
    <>
      <div className={cn("surface-card rounded-2xl p-4 shadow-lg shadow-black/20", className)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
              {icon}
            </span>
            <label htmlFor={htmlFor} className="text-sm font-medium text-gold-light">
              {label}
            </label>
          </div>
          <button
            id={htmlFor}
            type="button"
            onClick={openModal}
            className="min-h-9 min-w-[6.5rem] shrink-0 rounded-xl border border-border-gold bg-surface px-3 py-2 text-sm text-gold-light"
          >
            {selectedLabel}
          </button>
        </div>
      </div>

      <AppPickerModal
        open={open}
        title={t("selectedTemplate.pickLanguage")}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onChange(draft);
          setOpen(false);
        }}
      >
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDraft(option.value)}
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm font-medium transition",
                draft === option.value
                  ? "btn-gold text-[#0a0a0a]"
                  : "border border-border-gold bg-surface text-gold-light hover:bg-surface-elevated"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </AppPickerModal>
    </>
  );
}
