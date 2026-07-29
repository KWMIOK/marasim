"use client";

import { useEffect, useRef, useState } from "react";
import { AppPickerModal } from "@/components/templates/app-picker-modal";
import { hexToHsv, hsvToHex, normalizeHex, parseColorHex, type HsvColor } from "@/lib/color/utils";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

const PRESET_COLORS = ["#c9a227", "#e8d5a3", "#1a1a2e", "#0a0a0a", "#ffffff", "#8b1e3f"];

function clampChannel(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function SaturationPanel({
  hue,
  saturation,
  value,
  onChange,
}: {
  hue: number;
  saturation: number;
  value: number;
  onChange: (next: Pick<HsvColor, "s" | "v">) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  function updateFromPointer(clientX: number, clientY: number) {
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    onChange({
      s: clampChannel((x / rect.width) * 100),
      v: clampChannel(100 - (y / rect.height) * 100),
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event.clientX, event.clientY);
  }

  return (
    <div
      ref={panelRef}
      className="relative h-44 w-full cursor-crosshair overflow-hidden rounded-xl border border-border-gold touch-none"
      style={{ backgroundColor: hsvToHex(hue, 100, 100) }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md shadow-black/40"
        style={{
          left: `${saturation}%`,
          top: `${100 - value}%`,
          backgroundColor: hsvToHex(hue, saturation, value),
        }}
      />
    </div>
  );
}

function HueSlider({
  hue,
  onChange,
}: {
  hue: number;
  onChange: (hue: number) => void;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);

  function updateFromPointer(clientX: number) {
    const slider = sliderRef.current;
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    onChange(Math.round((x / rect.width) * 360));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updateFromPointer(event.clientX);
  }

  return (
    <div
      ref={sliderRef}
      className="relative mt-4 h-4 w-full cursor-pointer overflow-hidden rounded-full border border-border-gold touch-none"
      style={{
        background:
          "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <span
        className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md shadow-black/40"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: hsvToHex(hue, 100, 100),
        }}
      />
    </div>
  );
}

export function AppColorPickerModal({
  open,
  title,
  value,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onConfirm: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const [draftHex, setDraftHex] = useState(parseColorHex(value));
  const [draftHsv, setDraftHsv] = useState(() => hexToHsv(parseColorHex(value)));

  useEffect(() => {
    if (!open) return;
    const nextHex = parseColorHex(value);
    setDraftHex(nextHex);
    setDraftHsv(hexToHsv(nextHex));
  }, [open, value]);

  function updateFromHsv(next: HsvColor) {
    setDraftHsv(next);
    setDraftHex(hsvToHex(next.h, next.s, next.v));
  }

  function updateFromHexInput(nextValue: string) {
    setDraftHex(nextValue);
    const normalized = normalizeHex(nextValue);
    if (normalized) {
      setDraftHsv(hexToHsv(normalized));
    }
  }

  return (
    <AppPickerModal
      open={open}
      title={title}
      onClose={onClose}
      onConfirm={() => onConfirm(parseColorHex(draftHex))}
    >
      <SaturationPanel
        hue={draftHsv.h}
        saturation={draftHsv.s}
        value={draftHsv.v}
        onChange={(next) => updateFromHsv({ ...draftHsv, ...next })}
      />
      <HueSlider hue={draftHsv.h} onChange={(hue) => updateFromHsv({ ...draftHsv, h: hue })} />

      <div className="mt-4 flex items-center gap-3">
        <span
          className="h-11 w-11 shrink-0 rounded-xl border border-border-gold"
          style={{ backgroundColor: parseColorHex(draftHex) }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <label htmlFor="colorHex" className="mb-1.5 block text-xs font-medium text-muted">
            {t("selectedTemplate.colorHex")}
          </label>
          <input
            id="colorHex"
            value={draftHex}
            onChange={(event) => updateFromHexInput(event.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm uppercase text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted">{t("selectedTemplate.colorPresets")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              onClick={() => {
                setDraftHex(preset);
                setDraftHsv(hexToHsv(preset));
              }}
              className={cn(
                "h-9 w-9 rounded-xl border transition",
                draftHex.toLowerCase() === preset ? "border-gold ring-2 ring-gold/40" : "border-border-gold"
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </div>
    </AppPickerModal>
  );
}
