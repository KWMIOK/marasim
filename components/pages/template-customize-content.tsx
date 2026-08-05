"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ThankYouFieldIcon,
} from "@/components/templates/invitation-field-icons";
import { AppLanguagePickerField } from "@/components/templates/app-language-picker";
import { TemplateThemePicker } from "@/components/templates/template-theme-picker";
import { EventLogoField } from "@/components/templates/event-logo-field";
import {
  InvitationDetailField,
  InvitationDetailInput,
  TemplateDesignCarousel,
  TemplateSectionHeading,
  TemplateSwitchField,
} from "@/components/templates/selected-template-form";
import { invitationThemeColors } from "@/lib/templates/invitation-themes";
import type { InvitationThemeId } from "@/lib/templates/invitation-themes";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import {
  DEFAULT_SELECTED_TEMPLATE_FORM,
  parseSelectedTemplateForm,
  type SelectedTemplateFormState,
} from "@/lib/templates/selected-template-form";
import { LANGUAGE_OPTIONS } from "@/lib/events/constants";
import { isEventCategory } from "@/lib/events/categories";
import { getOccasionFlow, isOccasionTypeId, resetOccasionFlowAfterSuccess } from "@/lib/flow/occasion-flow";
import { generateInvitationLinks } from "@/lib/invitations/generate-links";
import { buildInvitationSuccessPath, saveHostInvitation } from "@/lib/invitations/host-invitations";
import { createReceptionSession } from "@/lib/actions/reception";
import { getPublicRegistrationToken } from "@/lib/actions/guest-registration";
import { buildEventDisplayName } from "@/lib/reception/session";
import { clampReceptionStaffCount } from "@/lib/templates/selected-template-form";
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

function ReceptionStaffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function readSavedForm(): SelectedTemplateFormState {
  const saved = getOccasionFlow()?.customizeForm;
  return saved ? parseSelectedTemplateForm(saved) : DEFAULT_SELECTED_TEMPLATE_FORM;
}

export function TemplateCustomizeContent({ template }: { template: InvitationAnimatedTemplate }) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(DEFAULT_SELECTED_TEMPLATE_FORM);
  const [formHydrated, setFormHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categoryParam = searchParams.get("category");
  const occasionParam = searchParams.get("occasion");
  const category = categoryParam && isEventCategory(categoryParam) ? categoryParam : null;
  const occasion = occasionParam && isOccasionTypeId(occasionParam) ? occasionParam : null;

  const browseQuery = buildTemplateBrowseQuery({ category, occasion });
  const previewHref = `${ROUTES.templates.preview(template.id)}${browseQuery}`;
  const conditionsHref = `${ROUTES.templates.conditions(template.id)}${browseQuery}`;

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

  function updateTheme(themeId: InvitationThemeId) {
    const colors = invitationThemeColors(themeId);
    setForm((current) => ({
      ...current,
      themeId,
      primaryColor: colors.primaryColor,
      secondaryColor: colors.secondaryColor,
    }));
  }

  async function handleUseTemplate() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const isPrivateEvent = form.guestQr;
    const generatedLinks = generateInvitationLinks({
      hostName: form.hostName,
      includeReceptionistLink: isPrivateEvent,
    });

    const occasionLabel = occasion
      ? t(`occasionTypes.${occasion}` as TranslationKey)
      : null;
    const eventDisplayName = buildEventDisplayName(form.hostName, occasionLabel);

    const createResult = await createReceptionSession({
      token: generatedLinks.receptionistToken,
      eventDisplayName,
      eventDate: form.date || null,
      occasion,
      eventSlug: generatedLinks.eventSlug,
      guestToken: generatedLinks.guestToken,
      guestQrEnabled: form.guestQr,
      receptionStaffCount: isPrivateEvent ? form.receptionStaffCount : 0,
      locationName: form.location,
      locationDirections: form.locationDirections,
      mapsLat: form.mapsLat,
      mapsLng: form.mapsLng,
      mapsUrl: form.mapsUrl,
      eventLogoUrl: form.eventLogoUrl,
    });

    if (!createResult.success) {
      setSubmitError(t("selectedTemplate.createFailed"));
      setIsSubmitting(false);
      return;
    }

    const publicRegistrationToken = isPrivateEvent
      ? await getPublicRegistrationToken(generatedLinks.receptionistToken)
      : null;

    const invitation = saveHostInvitation({
      templateId: template.id,
      eventDisplayName,
      eventDate: form.date || null,
      category,
      occasion,
      guestUrl: generatedLinks.guestUrl,
      receptionistUrl: isPrivateEvent ? generatedLinks.receptionistUrl : "",
      receptionSessionToken: generatedLinks.receptionistToken,
      guestQrEnabled: form.guestQr,
      receptionStaffCount: isPrivateEvent ? form.receptionStaffCount : 0,
      location: form.location,
      locationDirections: form.locationDirections,
      mapsLat: form.mapsLat,
      mapsLng: form.mapsLng,
      mapsUrl: form.mapsUrl,
      eventLogoUrl: form.eventLogoUrl,
      emergencyPasscode: isPrivateEvent ? (createResult.emergencyPasscode ?? null) : null,
      noKidsAllowed: form.noKidsAllowed,
      dressCode: form.dressCode,
      menOnly: form.menOnly,
      womenOnly: form.womenOnly,
      couplesOnly: form.couplesOnly,
      noPhotos: form.noPhotos,
      publicRegistrationToken,
    });

    resetOccasionFlowAfterSuccess();

    router.push(buildInvitationSuccessPath(invitation));
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
              locationDirections={form.locationDirections}
              mapsLat={form.mapsLat}
              mapsLng={form.mapsLng}
              onLocationChange={(value) => updateForm("location", value)}
              onLocationDirectionsChange={(value) => updateForm("locationDirections", value)}
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
            {form.guestQr ? (
              <InvitationDetailField
                label={t("selectedTemplate.receptionStaffCount")}
                htmlFor="receptionStaffCount"
                icon={<ReceptionStaffIcon />}
              >
                <InvitationDetailInput
                  id="receptionStaffCount"
                  type="number"
                  min={0}
                  max={20}
                  inputMode="numeric"
                  value={String(form.receptionStaffCount)}
                  onChange={(event) =>
                    updateForm("receptionStaffCount", clampReceptionStaffCount(event.target.value))
                  }
                />
                <p className="mt-1.5 text-xs text-gold-muted">{t("selectedTemplate.receptionStaffCountHint")}</p>
              </InvitationDetailField>
            ) : null}
          </div>
        </section>

        <section>
          <TemplateSectionHeading
            icon={<PaletteIcon />}
            title={t("selectedTemplate.visualIdentity")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TemplateThemePicker value={form.themeId} onChange={updateTheme} />
            <EventLogoField
              value={form.eventLogoUrl}
              onChange={(value) => updateForm("eventLogoUrl", value)}
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
              labelWhenChecked={t("selectedTemplate.privateEvent")}
              labelWhenUnchecked={t("selectedTemplate.publicEvent")}
              htmlFor="guestQr"
              icon={<GuestQrFieldIcon />}
              checked={form.guestQr}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  guestQr: value,
                  receptionStaffCount: value ? current.receptionStaffCount : 0,
                }));
              }}
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
          <Link
            href={conditionsHref}
            className="btn-outline-gold mt-3 flex w-full items-center justify-center rounded-xl px-3 py-3 text-sm font-medium"
          >
            {t("selectedTemplate.eventConditionsButton")}
          </Link>
        </section>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href={previewHref}
          className="btn-outline-gold flex items-center justify-center rounded-xl px-3 py-3 text-sm font-medium"
        >
          {t("selectedTemplate.previewInvitation")}
        </Link>
        <button
          type="button"
          onClick={handleUseTemplate}
          disabled={isSubmitting}
          className="btn-gold rounded-xl px-3 py-3 text-sm font-medium disabled:opacity-60"
        >
          {isSubmitting ? t("hostSuccess.generating") : t("selectedTemplate.useTemplate")}
        </button>
      </div>
      {submitError ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {submitError}
        </p>
      ) : null}
    </AppPageShell>
  );
}
