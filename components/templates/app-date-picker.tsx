"use client";

import { useMemo, useState } from "react";
import { AppPickerModal } from "@/components/templates/app-picker-modal";
import { DateFieldIcon } from "@/components/templates/invitation-field-icons";
import { InvitationDetailField } from "@/components/templates/selected-template-form";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function AppDatePickerField({
  label,
  htmlFor,
  value,
  onChange,
  minDate,
}: {
  label: string;
  htmlFor: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const initial = parseIsoDate(value) ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [draft, setDraft] = useState(value);

  const displayValue = useMemo(() => {
    if (!value) return t("selectedTemplate.pickDate");
    const date = parseIsoDate(value);
    if (!date) return value;
    return date.toLocaleDateString(locale === "ar" ? "ar-KW" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [locale, t, value]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso: string | null }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ day: null, iso: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, iso: toIsoDate(viewYear, viewMonth, day) });
    }

    return cells;
  }, [viewMonth, viewYear]);

  function openModal() {
    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
    setDraft(value);
    setOpen(true);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    locale === "ar" ? "ar-KW" : "en-GB",
    { month: "long", year: "numeric" }
  );

  const draftDisabled = Boolean(minDate && draft && draft < minDate);

  return (
    <>
      <InvitationDetailField
        label={label}
        htmlFor={htmlFor}
        icon={<DateFieldIcon />}
        onActivate={openModal}
      >
        <button
          id={htmlFor}
          type="button"
          onClick={openModal}
          className="min-h-11 w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light"
        >
          {displayValue}
        </button>
      </InvitationDetailField>

      <AppPickerModal
        open={open}
        title={t("selectedTemplate.pickDate")}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          if (draftDisabled) return;
          onChange(draft);
          setOpen(false);
        }}
      >
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} className="btn-outline-gold rounded-lg px-3 py-1.5 text-sm">
            ‹
          </button>
          <p className="text-sm font-medium text-gold-light">{monthLabel}</p>
          <button type="button" onClick={() => shiftMonth(1)} className="btn-outline-gold rounded-lg px-3 py-1.5 text-sm">
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key}>{t(`selectedTemplate.weekdays.${key}`)}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {calendarDays.map((cell, index) =>
            cell.day == null ? (
              <span key={`empty-${index}`} />
            ) : (
              <button
                key={cell.iso}
                type="button"
                disabled={Boolean(minDate && cell.iso! < minDate)}
                onClick={() => setDraft(cell.iso!)}
                className={cn(
                  "rounded-lg py-2 text-sm transition",
                  minDate && cell.iso! < minDate
                    ? "cursor-not-allowed text-muted/40"
                    : draft === cell.iso
                      ? "btn-gold text-[#0a0a0a]"
                      : "text-gold-light hover:bg-surface"
                )}
              >
                {cell.day}
              </button>
            )
          )}
        </div>
      </AppPickerModal>
    </>
  );
}
