"use client";

import { useRef, useState } from "react";
import { InvitationDetailField } from "@/components/templates/selected-template-form";
import {
  EVENT_LOGO_ACCEPT,
  processEventLogoFile,
  type EventLogoValidationError,
} from "@/lib/media/event-logo";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

function LogoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function EventLogoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<EventLogoValidationError | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setProcessing(true);
    setError(null);

    const result = await processEventLogoFile(file);
    setProcessing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onChange(result.dataUrl);
  }

  return (
    <InvitationDetailField
      label={t("selectedTemplate.eventLogo")}
      htmlFor="eventLogo"
      icon={<LogoIcon />}
      className="sm:col-span-2"
    >
      <p className="mb-3 text-xs text-gold-muted">{t("selectedTemplate.eventLogoHint")}</p>

      {value ? (
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-gold bg-surface">
            <img src={value} alt={t("selectedTemplate.eventLogoPreviewAlt")} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={processing}
              className="rounded-xl border border-border-gold px-3 py-2 text-xs text-gold-light disabled:opacity-50"
            >
              {processing ? t("common.loading") : t("selectedTemplate.eventLogoReplace")}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onChange(null);
              }}
              disabled={processing}
              className="rounded-xl border border-red-500/40 px-3 py-2 text-xs text-red-300 disabled:opacity-50"
            >
              {t("selectedTemplate.eventLogoRemove")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border-gold px-4 py-8 text-center transition hover:border-border-gold-strong disabled:opacity-50"
        >
          <span className="text-sm font-medium text-gold-light">
            {processing ? t("common.loading") : t("selectedTemplate.eventLogoUpload")}
          </span>
          <span className="mt-2 text-xs text-muted">{t("selectedTemplate.eventLogoRequirements")}</span>
        </button>
      )}

      <input
        ref={inputRef}
        id="eventLogo"
        type="file"
        accept={EVENT_LOGO_ACCEPT}
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />

      {error ? (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {t(`selectedTemplate.eventLogoErrors.${error}` as TranslationKey)}
        </p>
      ) : null}
    </InvitationDetailField>
  );
}
