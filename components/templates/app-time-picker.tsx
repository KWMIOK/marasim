"use client";

import { useMemo, useState } from "react";
import { AppPickerModal } from "@/components/templates/app-picker-modal";
import { TimeFieldIcon } from "@/components/templates/invitation-field-icons";
import { InvitationDetailField } from "@/components/templates/selected-template-form";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

function parseTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 19,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function toTimeValue(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function TimePickerControl({
  id,
  sublabel,
  value,
  onChange,
  modalTitle,
}: {
  id: string;
  sublabel: string;
  value: string;
  onChange: (value: string) => void;
  modalTitle: string;
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const parsed = parseTime(value);
  const [draftHour, setDraftHour] = useState(parsed.hour);
  const [draftMinute, setDraftMinute] = useState(parsed.minute);

  const displayValue = useMemo(() => {
    if (!value) return t("selectedTemplate.pickTime");
    const date = new Date(`1970-01-01T${value}:00`);
    return date.toLocaleTimeString(locale === "ar" ? "ar-KW" : "en-GB", {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [locale, t, value]);

  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  function openModal() {
    const next = parseTime(value);
    setDraftHour(next.hour);
    setDraftMinute(next.minute);
    setOpen(true);
  }

  return (
    <>
      <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">
          {sublabel}
        </label>
        <button
          id={id}
          type="button"
          onClick={openModal}
          className="min-h-11 w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light"
        >
          {displayValue}
        </button>
      </div>

      <AppPickerModal
        open={open}
        title={modalTitle}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onChange(toTimeValue(draftHour, draftMinute));
          setOpen(false);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">{t("selectedTemplate.hour")}</p>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border-gold bg-surface p-2">
              {hours.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => setDraftHour(hour)}
                  className={cn(
                    "w-full rounded-lg px-2 py-2 text-sm",
                    draftHour === hour ? "btn-gold text-[#0a0a0a]" : "text-gold-light hover:bg-surface-elevated"
                  )}
                >
                  {String(hour).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted">{t("selectedTemplate.minute")}</p>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-border-gold bg-surface p-2">
              {minutes.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => setDraftMinute(minute)}
                  className={cn(
                    "w-full rounded-lg px-2 py-2 text-sm",
                    draftMinute === minute ? "btn-gold text-[#0a0a0a]" : "text-gold-light hover:bg-surface-elevated"
                  )}
                >
                  {String(minute).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppPickerModal>
    </>
  );
}

export function AppTimeRangeField({
  label,
  timeFrom,
  timeTo,
  onTimeFromChange,
  onTimeToChange,
}: {
  label: string;
  timeFrom: string;
  timeTo: string;
  onTimeFromChange: (value: string) => void;
  onTimeToChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <InvitationDetailField label={label} htmlFor="timeFrom" icon={<TimeFieldIcon />}>
      <div className="grid grid-cols-2 gap-3">
        <TimePickerControl
          id="timeFrom"
          sublabel={t("selectedTemplate.timeFrom")}
          value={timeFrom}
          onChange={onTimeFromChange}
          modalTitle={t("selectedTemplate.pickTimeFrom")}
        />
        <TimePickerControl
          id="timeTo"
          sublabel={t("selectedTemplate.timeTo")}
          value={timeTo}
          onChange={onTimeToChange}
          modalTitle={t("selectedTemplate.pickTimeTo")}
        />
      </div>
    </InvitationDetailField>
  );
}
