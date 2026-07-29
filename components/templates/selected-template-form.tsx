"use client";

import { forwardRef, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AppColorPickerModal } from "@/components/templates/app-color-picker";
import { normalizeHex, parseColorHex } from "@/lib/color/utils";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  if ("showPicker" in input && typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      input.click();
    }
  }
}

export function TemplateDesignCarousel({
  images = [],
  emptyLabel,
}: {
  images?: string[];
  emptyLabel: string;
}) {
  const slides = images.length > 0 ? images : [null];
  const [index, setIndex] = useState(0);
  const hasMultiple = slides.length > 1;

  function goTo(nextIndex: number) {
    setIndex((nextIndex + slides.length) % slides.length);
  }

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border-gold shadow-lg shadow-black/25">
        {slides[index] ? (
          <img src={slides[index]!} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full items-center justify-center bg-gradient-to-br from-[rgb(18_16_12)] via-[rgb(28_24_18)] to-[rgb(201_162_39_/_0.25)] px-6"
            aria-hidden={images.length > 0}
          >
            <p className="text-sm text-muted">{emptyLabel}</p>
          </div>
        )}

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-gold bg-surface/90 text-gold-light"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-gold bg-surface/90 text-gold-light"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type="button"
              aria-label={`Slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={cn(
                "h-2 w-2 rounded-full transition",
                slideIndex === index ? "bg-gold" : "bg-border-gold"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TemplateSectionHeading({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
        {icon}
      </span>
      <h2 className="text-base font-semibold text-gold-light">{title}</h2>
    </div>
  );
}

export function TemplateFormSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card rounded-2xl p-5 shadow-lg shadow-black/20">
      <TemplateSectionHeading icon={icon} title={title} />
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function InvitationDetailField({
  label,
  htmlFor,
  icon,
  children,
  className,
  onActivate,
}: {
  label: string;
  htmlFor: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  onActivate?: () => void;
}) {
  return (
    <div
      className={cn("surface-card rounded-2xl p-4 shadow-lg shadow-black/20", onActivate && "cursor-pointer", className)}
      onClick={onActivate}
      onKeyDown={
        onActivate
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
    >
      <div className="flex items-center justify-center gap-2">
        {icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
            {icon}
          </span>
        ) : null}
        <label
          htmlFor={htmlFor}
          className={cn("text-sm font-medium text-gold-light", onActivate && "cursor-pointer")}
          onClick={(event) => {
            if (onActivate) {
              event.preventDefault();
              onActivate();
            }
          }}
        >
          {label}
        </label>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export const InvitationDetailInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function InvitationDetailInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/40",
          className
        )}
        {...props}
      />
    );
  }
);

export function InvitationDetailPickerInput({
  type,
  className,
  inputRef,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  type: "date" | "time";
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function handleOpenPicker(event: React.MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
    openNativePicker(inputRef.current);
  }

  return (
    <InvitationDetailInput
      ref={inputRef}
      type={type}
      onClick={handleOpenPicker}
      className={cn(
        "min-h-11 cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
        className
      )}
      {...props}
    />
  );
}

export function InvitationDetailPickerField({
  label,
  htmlFor,
  type,
  value,
  onChange,
}: {
  label: string;
  htmlFor: string;
  type: "date" | "time";
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <InvitationDetailField
      label={label}
      htmlFor={htmlFor}
      onActivate={() => openNativePicker(inputRef.current)}
    >
      <div className="relative">
        <InvitationDetailPickerInput
          inputRef={inputRef}
          id={htmlFor}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </InvitationDetailField>
  );
}

export function TemplateColorField({
  label,
  htmlFor,
  icon,
  value,
  onChange,
}: {
  label: string;
  htmlFor: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function commitHexInput(nextValue: string) {
    const normalized = normalizeHex(nextValue);
    if (normalized) {
      onChange(normalized);
      return;
    }
    onChange(parseColorHex(value));
  }

  return (
    <>
      <div className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
              {icon}
            </span>
            <label htmlFor={htmlFor} className="text-sm font-medium text-gold-light">
              {label}
            </label>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={t("selectedTemplate.pickColor")}
              onClick={() => setOpen(true)}
              className="relative flex h-9 w-9 overflow-hidden rounded-xl border border-border-gold bg-surface"
            >
              <span
                className="absolute inset-1 rounded-lg"
                style={{ backgroundColor: parseColorHex(value) }}
                aria-hidden
              />
            </button>
            <InvitationDetailInput
              id={htmlFor}
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onBlur={(event) => commitHexInput(event.target.value)}
              className="h-9 w-[5.5rem] px-2 py-1.5 text-xs uppercase"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <AppColorPickerModal
        open={open}
        title={label}
        value={value}
        onClose={() => setOpen(false)}
        onConfirm={(hex) => {
          onChange(hex);
          setOpen(false);
        }}
      />
    </>
  );
}

function TemplateSwitchControl({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-8 w-14 shrink-0 rounded-full border border-border-gold transition-colors",
        checked ? "bg-gold/20" : "bg-surface"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full transition-all",
          checked ? "start-7 bg-gold shadow-sm shadow-gold/40" : "start-0.5 bg-border-gold"
        )}
      />
    </button>
  );
}

export function TemplateSwitchField({
  label,
  htmlFor,
  icon,
  checked,
  onChange,
}: {
  label: string;
  htmlFor: string;
  icon: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
            {icon}
          </span>
          <label htmlFor={htmlFor} className="text-sm font-medium text-gold-light">
            {label}
          </label>
        </div>
        <TemplateSwitchControl id={htmlFor} checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gold-light">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-border-gold bg-transparent p-1"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="surface-card min-w-0 flex-1 rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm uppercase text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>
    </div>
  );
}
