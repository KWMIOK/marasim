"use client";

import type { ContentSlot, ContentLocale, ContentSlotType } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ContentSlotsEditor({
  slots,
  onChange,
}: {
  slots: ContentSlot[];
  onChange: (slots: ContentSlot[]) => void;
}) {
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
        label: "New block",
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
              Block {index + 1}: {slot.label ?? slot.key}
            </p>
            <button
              type="button"
              onClick={() => removeSlot(index)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Key</Label>
              <Input
                value={slot.key}
                onChange={(e) => updateSlot(index, { key: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={slot.label ?? ""}
                onChange={(e) => updateSlot(index, { label: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={slot.type}
                onChange={(e) =>
                  updateSlot(index, { type: e.target.value as ContentSlotType })
                }
                className="mt-1"
              >
                <option value="text">Text</option>
                <option value="image">Image URL</option>
                <option value="video">Video URL</option>
              </Select>
            </div>
            <div>
              <Label>Locale</Label>
              <Select
                value={slot.locale ?? "both"}
                onChange={(e) =>
                  updateSlot(index, { locale: e.target.value as ContentLocale })
                }
                className="mt-1"
              >
                <option value="both">Arabic & English</option>
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>

          <div className="mt-3">
            <Label>Content / URL</Label>
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
        + Add content block
      </button>
    </div>
  );
}
