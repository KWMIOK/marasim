"use client";

import type { ContentSlot, ContentLocale, ContentSlotType } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-locale";

export function ContentSlotsEditor({
  slots,
  onChange,
}: {
  slots: ContentSlot[];
  onChange: (slots: ContentSlot[]) => void;
}) {
  const { t } = useTranslation();

  function updateSlot(index: number, patch: Partial<ContentSlot>) {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    onChange([
      ...slots,
      {
        key: `slot_${slots.length + 1}`,
        type: "text",
        value: "",
        label: t("eventForm.newBlock"),
        locale: "both",
        order: slots.length,
      },
    ]);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {slots.map((slot, index) => (
        <div
          key={`${slot.key}-${index}`}
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-800">
              {t("eventForm.block")} {index + 1}: {slot.label ?? slot.key}
            </p>
            <button
              type="button"
              onClick={() => removeSlot(index)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              {t("eventForm.remove")}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>{t("eventForm.key")}</Label>
              <Input
                value={slot.key}
                onChange={(e) => updateSlot(index, { key: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("eventForm.label")}</Label>
              <Input
                value={slot.label ?? ""}
                onChange={(e) => updateSlot(index, { label: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("eventForm.type")}</Label>
              <Select
                value={slot.type}
                onChange={(e) =>
                  updateSlot(index, { type: e.target.value as ContentSlotType })
                }
                className="mt-1"
              >
                <option value="text">{t("eventForm.text")}</option>
                <option value="image">{t("eventForm.imageUrl")}</option>
                <option value="video">{t("eventForm.videoUrl")}</option>
              </Select>
            </div>
            <div>
              <Label>{t("eventForm.locale")}</Label>
              <Select
                value={slot.locale ?? "both"}
                onChange={(e) =>
                  updateSlot(index, { locale: e.target.value as ContentLocale })
                }
                className="mt-1"
              >
                <option value="both">{t("eventForm.localeBoth")}</option>
                <option value="ar">{t("eventForm.localeAr")}</option>
                <option value="en">{t("eventForm.localeEn")}</option>
              </Select>
            </div>
          </div>

          <div className="mt-3">
            <Label>{t("eventForm.contentUrl")}</Label>
            {slot.type === "text" ? (
              <Textarea
                value={slot.value}
                onChange={(e) => updateSlot(index, { value: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <Input
                value={slot.value}
                onChange={(e) => updateSlot(index, { value: e.target.value })}
                placeholder="https://..."
                className="mt-1"
              />
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSlot}
        className="rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
      >
        {t("eventForm.addContentBlock")}
      </button>
    </div>
  );
}
