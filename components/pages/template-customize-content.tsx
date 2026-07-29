"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { AppDatePickerField } from "@/components/templates/app-date-picker";
import { AppLocationField } from "@/components/templates/app-location-field";
import { AppTimeRangeField } from "@/components/templates/app-time-picker";
import {
  GuestBookFieldIcon,
  GuestQrFieldIcon,
  HostNameFieldIcon,
  LanguageFieldIcon,
  PhotoGalleryFieldIcon,
  PrimaryColorFieldIcon,
  SecondaryColorFieldIcon,
  ThankYouFieldIcon,
} from "@/components/templates/invitation-field-icons";
import { AppLanguagePickerField } from "@/components/templates/app-language-picker";
import {
  InvitationDetailField,
  InvitationDetailInput,
  TemplateColorField,
  TemplateDesignCarousel,
  TemplateSectionHeading,
  TemplateSwitchField,
} from "@/components/templates/selected-template-form";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import {
  DEFAULT_SELECTED_TEMPLATE_FORM,
  parseSelectedTemplateForm,
  type SelectedTemplateFormState,
} from "@/lib/templates/selected-template-form";
import { LANGUAGE_OPTIONS } from "@/lib/events/constants";
import { isEventCategory } from "@/lib/events/categories";
import { getOccasionFlow, isOccasionTypeId } from "@/lib/flow/occasion-flow";
import { useOccasionFlowPersistence } from "@/hooks/use-occasion-flow";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { InvitationAnimatedTemplate } from "@/types/events";
import type { TranslationKey } from "@/lib/i18n";

function DetailsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M12 3c-4.4 0-8 3.1-8 7s3.6 7 8 7c.8 0 1.5-.1 2.2-.3.6 1.1 1.8 1.8 3.1 1.8 2 0 3.6-1.6 3.6-3.6 0-1.3-.7-2.5-1.8-3.1.2-.7.3-1.4.3-2.2 0-4.4-3.6-7-8.4-7z" />
      <circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M12 3l1.6 4.9L18 9.4l-4.4 1.5L12 16l-1.6-5.1L6 9.4l4.4-1.5L12 3z" />
      <path d="M5 17l.8 2.4L8 20.2l-2.2.8L5 23l-.8-2.2L2 20.2l2.2-.8L5 17z" />
    </svg>
  );
}

function readSavedForm(): SelectedTemplateFormState {
  const saved = getOccasionFlow()?.customizeForm;
  return saved ? parseSelectedTemplateForm(saved) : DEFAULT_SELECTED_TEMPLATE_FORM;
}

export function TemplateCustomizeContent({ template }: { template: InvitationAnimatedTemplate }) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(DEFAULT_SELECTED_TEMPLATE_FORM);
  const [formHydrated, setFormHydrated] = useState(false);

  const categoryParam = searchParams.get("category");
  const occasionParam = searchParams.get("occasion");
  const category = categoryParam && isEventCategory(categoryParam) ? categoryParam : null;
  const occasion = occasionParam && isOccasionTypeId(occasionParam) ? occasionParam : null;

  const browseQuery = buildTemplateBrowseQuery({ category, occasion });
  const previewHref = `${ROUTES.templates.preview(template.id)}${browseQuery}`;

  const carouselImages = template.preview_url ? [template.preview_url] : [];

  useEffect(() => {
    setForm(readSavedForm());
    setFormHydrated(true);
  }, []);

  useOccasionFlowPersistence({
    enabled: formHydrated,
    step: "customize",
    category,
    occasion,
    templateId: template.id,
    customizeForm: form,
  });

  function updateForm<K extends keyof SelectedTemplateFormState>(
    key: K,
    value: SelectedTemplateFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppPageShell className="pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("selectedTemplate.title")}</h1>
      </header>

      <div className="mt-6">
        <TemplateDesignCarousel
          images={carouselImages}
          emptyLabel={t("selectedTemplate.carouselEmpty")}
        />
      </div>

      <div className="mt-6 space-y-5">
        <section>
          <TemplateSectionHeading
            icon={<DetailsIcon />}
            title={t("selectedTemplate.invitationDetails")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InvitationDetailField label={t("selectedTemplate.hostName")} htmlFor="hostName" icon={<HostNameFieldIcon />}>
              <InvitationDetailInput
                id="hostName"
                value={form.hostName}
                onChange={(event) => updateForm("hostName", event.target.value)}
                placeholder={t("selectedTemplate.hostNamePlaceholder")}
              />
            </InvitationDetailField>
            <AppDatePickerField
              label={t("selectedTemplate.date")}
              htmlFor="eventDate"
              value={form.date}
              onChange={(value) => updateForm("date", value)}
            />
            <AppTimeRangeField
              label={t("selectedTemplate.time")}
              timeFrom={form.timeFrom}
              timeTo={form.timeTo}
              onTimeFromChange={(value) => updateForm("timeFrom", value)}
              onTimeToChange={(value) => updateForm("timeTo", value)}
            />
            <AppLocationField
              label={t("selectedTemplate.location")}
              htmlFor="location"
              location={form.location}
              mapsLat={form.mapsLat}
              mapsLng={form.mapsLng}
              onLocationChange={(value) => updateForm("location", value)}
              onMapChange={(value) => {
                setForm((current) => ({
                  ...current,
                  mapsLat: value.mapsLat,
                  mapsLng: value.mapsLng,
                  mapsUrl: value.mapsUrl,
                  location:
                    !current.location.trim() && value.suggestedName
                      ? value.suggestedName
                      : current.location,
                }));
              }}
            />
          </div>
        </section>

        <section>
          <TemplateSectionHeading
            icon={<PaletteIcon />}
            title={t("selectedTemplate.visualIdentity")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TemplateColorField
              label={t("selectedTemplate.primaryColor")}
              htmlFor="primaryColor"
              icon={<PrimaryColorFieldIcon />}
              value={form.primaryColor}
              onChange={(value) => updateForm("primaryColor", value)}
            />
            <TemplateColorField
              label={t("selectedTemplate.secondaryColor")}
              htmlFor="secondaryColor"
              icon={<SecondaryColorFieldIcon />}
              value={form.secondaryColor}
              onChange={(value) => updateForm("secondaryColor", value)}
            />
            <AppLanguagePickerField
              label={t("selectedTemplate.language")}
              htmlFor="language"
              icon={<LanguageFieldIcon />}
              value={form.language}
              onChange={(value) =>
                updateForm("language", value as SelectedTemplateFormState["language"])
              }
              options={LANGUAGE_OPTIONS.map((option) => ({
                value: option.value,
                label: t(`selectedTemplate.languageOptions.${option.value}` as TranslationKey),
              }))}
              className="sm:col-span-2"
            />
          </div>
        </section>

        <section>
          <TemplateSectionHeading
            icon={<SparkIcon />}
            title={t("selectedTemplate.smartFeatures")}
          />
          <div className="grid grid-cols-2 gap-3">
            <TemplateSwitchField
              label={t("selectedTemplate.guestQr")}
              htmlFor="guestQr"
              icon={<GuestQrFieldIcon />}
              checked={form.guestQr}
              onChange={(value) => updateForm("guestQr", value)}
            />
            <TemplateSwitchField
              label={t("selectedTemplate.sharedPhotoGallery")}
              htmlFor="sharedPhotoGallery"
              icon={<PhotoGalleryFieldIcon />}
              checked={form.sharedPhotoGallery}
              onChange={(value) => updateForm("sharedPhotoGallery", value)}
            />
            <TemplateSwitchField
              label={t("selectedTemplate.guestBook")}
              htmlFor="guestBook"
              icon={<GuestBookFieldIcon />}
              checked={form.guestBook}
              onChange={(value) => updateForm("guestBook", value)}
            />
            <TemplateSwitchField
              label={t("selectedTemplate.thankYouMessage")}
              htmlFor="thankYouMessage"
              icon={<ThankYouFieldIcon />}
              checked={form.thankYouMessage}
              onChange={(value) => updateForm("thankYouMessage", value)}
            />
          </div>
        </section>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href={previewHref}
          className="btn-outline-gold flex items-center justify-center rounded-xl px-3 py-3 text-sm font-medium"
        >
          {t("selectedTemplate.previewInvitation")}
        </Link>
        <button type="button" className="btn-gold rounded-xl px-3 py-3 text-sm font-medium">
          {t("selectedTemplate.useTemplate")}
        </button>
      </div>
    </AppPageShell>
  );
}
