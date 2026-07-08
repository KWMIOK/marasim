"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, importGuestsForEvent } from "@/lib/actions/events";
import { defaultContentSlots } from "@/lib/events/defaults";
import {
  DEFAULT_FEATURE_TOGGLES,
  EVENT_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  defaultEventTitle,
  isCoupleEventType,
} from "@/lib/events/constants";
import { parseGuestFile } from "@/lib/guests/parse-roster";
import { slugify } from "@/lib/utils/urls";
import { CatalogPicker } from "@/components/admin/catalog-picker";
import { ContentSlotsEditor } from "@/components/admin/content-slots-editor";
import { RangeField } from "@/components/admin/range-field";
import { SwitchField } from "@/components/admin/switch-field";
import { VenueMapPicker } from "@/components/admin/venue-map-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CeremonyEventType,
  EventCatalogs,
  EventFeatureToggles,
  InvitationLanguage,
} from "@/types/events";
import type { ContentSlot, Profile, TemplateType } from "@/types/database";
import { useTranslation } from "@/hooks/use-locale";

type HostOption = Pick<Profile, "id" | "full_name" | "role">;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EventForm({
  hosts,
  currentUserId,
  catalogs,
}: {
  hosts: HostOption[];
  currentUserId: string;
  catalogs: EventCatalogs;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  const [eventType, setEventType] = useState<CeremonyEventType>("wedding");
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [honoreeName, setHonoreeName] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [urlText, setUrlText] = useState("");
  const [slug, setSlug] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("standard");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [hostId, setHostId] = useState(currentUserId);
  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [venue, setVenue] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsLat, setMapsLat] = useState<number | null>(null);
  const [mapsLng, setMapsLng] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [animatedTemplateId, setAnimatedTemplateId] = useState<string | null>(
    catalogs.animatedTemplates[0]?.id ?? null
  );
  const [themeId, setThemeId] = useState<string | null>(catalogs.themes[0]?.id ?? null);
  const [invitationLanguage, setInvitationLanguage] = useState<InvitationLanguage>("ar");
  const [fontId, setFontId] = useState<string | null>(null);
  const [fontColorId, setFontColorId] = useState<string | null>(
    catalogs.fontColors[0]?.id ?? null
  );
  const [nameSizePx, setNameSizePx] = useState(48);
  const [letterSpacingEm, setLetterSpacingEm] = useState(0.04);
  const [localeDefault, setLocaleDefault] = useState<InvitationLanguage>("ar");
  const [primaryColor, setPrimaryColor] = useState("#1a1a2e");
  const [secondaryColor, setSecondaryColor] = useState("#e94560");
  const [contentSlots, setContentSlots] = useState<ContentSlot[]>(
    defaultContentSlots("standard")
  );
  const [toggles, setToggles] = useState<EventFeatureToggles>({
    ...DEFAULT_FEATURE_TOGGLES,
  });
  const [dressCodeText, setDressCodeText] = useState("");
  const [importantNotesText, setImportantNotesText] = useState("");
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState("");
  const [guestFile, setGuestFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const coupleEvent = isCoupleEventType(eventType);
  const autoTitle = useMemo(
    () => defaultEventTitle(eventType, groomName, brideName, honoreeName),
    [eventType, groomName, brideName, honoreeName]
  );
  const autoSlug = useMemo(() => slugify(urlText || title || autoTitle), [urlText, title, autoTitle]);

  const filteredFonts = useMemo(
    () =>
      catalogs.fonts.filter(
        (font) => font.language === invitationLanguage || font.language === "both"
      ),
    [catalogs.fonts, invitationLanguage]
  );

  useEffect(() => {
    if (!titleTouched) setTitle(autoTitle);
  }, [autoTitle, titleTouched]);

  useEffect(() => {
    if (filteredFonts.length === 0) {
      setFontId(null);
      return;
    }
    if (!fontId || !filteredFonts.some((f) => f.id === fontId)) {
      setFontId(filteredFonts[0].id);
    }
  }, [filteredFonts, fontId]);

  useEffect(() => {
    const theme = catalogs.themes.find((t) => t.id === themeId);
    if (theme) {
      setPrimaryColor(theme.primary_color);
      setSecondaryColor(theme.secondary_color);
    }
  }, [themeId, catalogs.themes]);

  const handleMapsChange = useCallback(
    (data: { venue: string; mapsUrl: string; lat: number | null; lng: number | null }) => {
      setVenue(data.venue);
      setMapsUrl(data.mapsUrl);
      setMapsLat(data.lat);
      setMapsLng(data.lng);
    },
    []
  );

  function updateToggle(key: keyof EventFeatureToggles, value: boolean) {
    setToggles((prev) => ({ ...prev, [key]: value }));
  }

  function handleTemplateChange(value: TemplateType) {
    setTemplateType(value);
    setContentSlots(defaultContentSlots(value));
  }

  function generateUrlSlug() {
    setSlug(slugify(urlText || title));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!title.trim()) {
      setError(t("eventForm.titleRequired"));
      setLoading(false);
      return;
    }

    if (coupleEvent && !groomName.trim() && !brideName.trim()) {
      setError(t("eventForm.coupleNameRequired"));
      setLoading(false);
      return;
    }

    if (!coupleEvent && !honoreeName.trim()) {
      setError(t("eventForm.honoreeRequired"));
      setLoading(false);
      return;
    }

    const result = await createEvent({
      title: title.trim(),
      slug: slug.trim() || autoSlug,
      event_type: eventType,
      groom_name: coupleEvent ? groomName.trim() : undefined,
      bride_name: coupleEvent ? brideName.trim() : undefined,
      honoree_name: !coupleEvent ? honoreeName.trim() : undefined,
      template_type: templateType,
      status,
      host_id: hostId,
      start_datetime: startDatetime || undefined,
      end_datetime: endDatetime || undefined,
      venue,
      maps_url: mapsUrl,
      maps_lat: mapsLat,
      maps_lng: mapsLng,
      custom_message: customMessage,
      hero_image_url: heroImageUrl || undefined,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      content_slots: contentSlots,
      settings: {
        animated_template_id: animatedTemplateId,
        theme_id: themeId,
        invitation_language: invitationLanguage,
        font_id: fontId,
        font_color_id: fontColorId,
        name_size_px: nameSizePx,
        letter_spacing_em: letterSpacingEm,
        locale_default: localeDefault,
        custom_message: customMessage,
        hero_image_url: heroImageUrl || undefined,
        background_music_url: toggles.background_music ? backgroundMusicUrl : undefined,
        dress_code_text: toggles.dress_code ? dressCodeText : undefined,
        important_notes_text: toggles.important_notes ? importantNotesText : undefined,
        maps_lat: mapsLat,
        maps_lng: mapsLng,
        toggles,
      },
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (guestFile) {
      try {
        const buffer = await guestFile.arrayBuffer();
        const guests = parseGuestFile(buffer, guestFile.name);
        const importResult = await importGuestsForEvent(result.eventId, guests);
        if (!importResult.success) {
          setError(`Event created, but guest import failed: ${importResult.error}`);
          setLoading(false);
          router.push(`/admin/events/${result.eventId}`);
          return;
        }
      } catch (importError) {
        const message =
          importError instanceof Error ? importError.message : t("guestImport.importFailed");
        setError(`Event created, but guest import failed: ${message}`);
        setLoading(false);
        router.push(`/admin/events/${result.eventId}`);
        return;
      }
    }

    router.push(`/admin/events/${result.eventId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={t("eventForm.eventTypeNames")} description={t("eventForm.eventTypeNamesDesc")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="eventType">{t("eventForm.eventType")}</Label>
            <Select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as CeremonyEventType)}
              className="mt-1"
            >
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`eventTypes.${option.value}`)}
                </option>
              ))}
            </Select>
          </div>

          {coupleEvent ? (
            <>
              <div>
                <Label htmlFor="groom">{t("eventForm.groomName")}</Label>
                <Input
                  id="groom"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bride">{t("eventForm.brideName")}</Label>
                <Input
                  id="bride"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <Label htmlFor="honoree">{t("eventForm.honoreeName")}</Label>
              <Input
                id="honoree"
                value={honoreeName}
                onChange={(e) => setHonoreeName(e.target.value)}
                placeholder={t("eventForm.honoreePlaceholder")}
                className="mt-1"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <Label htmlFor="title">{t("eventForm.eventTitle")} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitleTouched(true);
                setTitle(e.target.value);
              }}
              className="mt-1"
              required
            />
          </div>
        </div>
      </Section>

      <Section title={t("eventForm.customUrl")}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="urlText">{t("eventForm.urlText")}</Label>
            <Input
              id="urlText"
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              placeholder="ahmed-and-sara-wedding"
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={generateUrlSlug}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
            >
              {t("eventForm.generateUrl")}
            </button>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="slug">{t("eventForm.finalSlug")}</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-zinc-500">
              {t("eventForm.urlPreview", { slug: slug.trim() || autoSlug || "your-slug" })}
            </p>
          </div>
        </div>
      </Section>

      <Section title={t("eventForm.scheduleVenue")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="start">{t("eventForm.startDatetime")}</Label>
            <Input
              id="start"
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end">{t("eventForm.endDatetime")}</Label>
            <Input
              id="end"
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <VenueMapPicker
              venue={venue}
              mapsUrl={mapsUrl}
              mapsLat={mapsLat}
              mapsLng={mapsLng}
              onVenueChange={setVenue}
              onMapsChange={handleMapsChange}
            />
          </div>
        </div>
      </Section>

      <Section title={t("eventForm.messageMedia")}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">{t("eventForm.customMessage")}</Label>
            <Textarea
              id="message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="mt-1"
              placeholder={t("eventForm.customMessagePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="heroImage">{t("eventForm.imageOptional")}</Label>
            <Input
              id="heroImage"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        </div>
      </Section>

      <Section
        title={t("eventForm.animatedTemplate")}
        description={t("eventForm.animatedTemplateDesc")}
      >
        <CatalogPicker
          label={t("eventForm.animatedTemplate")}
          items={catalogs.animatedTemplates}
          value={animatedTemplateId}
          onChange={setAnimatedTemplateId}
          renderPreview={(item, selected) => (
            <div>
              <div
                className={`mb-2 flex h-20 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white ${
                  selected ? "animate-pulse" : ""
                }`}
              >
                {item.animation_key}
              </div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-zinc-500">{item.description}</p>
            </div>
          )}
        />
      </Section>

      <Section title={t("eventForm.invitationTheme")}>
        <CatalogPicker
          label={t("eventForm.invitationTheme")}
          items={catalogs.themes}
          value={themeId}
          onChange={setThemeId}
        />
      </Section>

      <Section title={t("eventForm.typography")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("eventForm.invitationLanguage")}</Label>
            <Select
              value={invitationLanguage}
              onChange={(e) => setInvitationLanguage(e.target.value as InvitationLanguage)}
              className="mt-1"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`common.${option.value === "ar" ? "arabic" : "english"}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("eventForm.defaultGuestLanguage")}</Label>
            <Select
              value={localeDefault}
              onChange={(e) => setLocaleDefault(e.target.value as InvitationLanguage)}
              className="mt-1"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`common.${option.value === "ar" ? "arabic" : "english"}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <CatalogPicker
            label={t("eventForm.font")}
            items={filteredFonts}
            value={fontId}
            onChange={setFontId}
            renderPreview={(item) => (
              <div>
                <p className="text-xl" style={{ fontFamily: item.font_family }}>
                  {invitationLanguage === "ar" ? "محمد & سارة" : "Mohammed & Sara"}
                </p>
                <p className="mt-1 text-sm font-medium">{item.name}</p>
              </div>
            )}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <RangeField
            label={t("eventForm.nameSize")}
            value={nameSizePx}
            min={36}
            max={72}
            step={1}
            unit="px"
            onChange={setNameSizePx}
          />
          <RangeField
            label={t("eventForm.letterSpacing")}
            value={letterSpacingEm}
            min={-0.02}
            max={0.2}
            step={0.01}
            onChange={setLetterSpacingEm}
            formatValue={(v) => `${v.toFixed(2)}em`}
          />
        </div>

        <div className="mt-4">
          <CatalogPicker
            label={t("eventForm.fontColor")}
            items={catalogs.fontColors}
            value={fontColorId}
            onChange={setFontColorId}
            renderPreview={(item) => (
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-8 w-8 rounded-full border"
                  style={{ backgroundColor: item.color_hex }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
            )}
          />
        </div>
      </Section>

      <Section title={t("eventForm.featureToggles")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField label={t("eventForm.confetti")} checked={toggles.confetti} onChange={(v) => updateToggle("confetti", v)} />
          <SwitchField label={t("eventForm.backgroundMusic")} checked={toggles.background_music} onChange={(v) => updateToggle("background_music", v)} />
          <SwitchField label={t("eventForm.showLanguageSelector")} checked={toggles.show_language_selector} onChange={(v) => updateToggle("show_language_selector", v)} />
          <SwitchField label={t("eventForm.livePhotoAlbum")} checked={toggles.live_photo_album} onChange={(v) => updateToggle("live_photo_album", v)} />
          <SwitchField label={t("eventForm.guestComments")} checked={toggles.guest_comments} onChange={(v) => updateToggle("guest_comments", v)} />
          <SwitchField label={t("eventForm.guestBook")} checked={toggles.guest_book} onChange={(v) => updateToggle("guest_book", v)} />
          <SwitchField label={t("eventForm.rsvp")} checked={toggles.rsvp} onChange={(v) => updateToggle("rsvp", v)} />
          <SwitchField label={t("eventForm.dressCode")} checked={toggles.dress_code} onChange={(v) => updateToggle("dress_code", v)} />
          <SwitchField label={t("eventForm.importantNotes")} checked={toggles.important_notes} onChange={(v) => updateToggle("important_notes", v)} />
          <SwitchField label={t("eventForm.invitationProtection")} checked={toggles.invitation_protection} onChange={(v) => updateToggle("invitation_protection", v)} />
          <SwitchField label={t("eventForm.whatsappMessages")} checked={toggles.whatsapp_messages} onChange={(v) => updateToggle("whatsapp_messages", v)} />
        </div>

        {toggles.background_music ? (
          <div className="mt-4">
            <Label htmlFor="music">{t("eventForm.musicUrl")}</Label>
            <Input id="music" value={backgroundMusicUrl} onChange={(e) => setBackgroundMusicUrl(e.target.value)} className="mt-1" />
          </div>
        ) : null}

        {toggles.dress_code ? (
          <div className="mt-4">
            <Label htmlFor="dressCode">{t("eventForm.dressCodeDetails")}</Label>
            <Textarea id="dressCode" value={dressCodeText} onChange={(e) => setDressCodeText(e.target.value)} rows={2} className="mt-1" />
          </div>
        ) : null}

        {toggles.important_notes ? (
          <div className="mt-4">
            <Label htmlFor="notes">{t("eventForm.importantNotesDetails")}</Label>
            <Textarea id="notes" value={importantNotesText} onChange={(e) => setImportantNotesText(e.target.value)} rows={2} className="mt-1" />
          </div>
        ) : null}
      </Section>

      <Section title={t("eventForm.adminLayout")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="host">{t("eventForm.hostClient")}</Label>
            <Select id="host" value={hostId} onChange={(e) => setHostId(e.target.value)} className="mt-1">
              {hosts.map((host) => (
                <option key={host.id} value={host.id}>
                  {host.full_name ?? host.id} ({host.role})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="layout">{t("eventForm.layoutType")}</Label>
            <Select id="layout" value={templateType} onChange={(e) => handleTemplateChange(e.target.value as TemplateType)} className="mt-1">
              <option value="standard">{t("eventForm.standard")}</option>
              <option value="vip">{t("eventForm.vip")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">{t("admin.status")}</Label>
            <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="mt-1">
              <option value="draft">{t("eventForm.draft")}</option>
              <option value="published">{t("eventForm.published")}</option>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="primary">{t("eventForm.primaryColor")}</Label>
            <div className="mt-1 flex gap-2">
              <input id="primary" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-12 rounded border" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="secondary">{t("eventForm.secondaryColor")}</Label>
            <div className="mt-1 flex gap-2">
              <input id="secondary" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-12 rounded border" />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>
          </div>
        </div>
      </Section>

      <Section title={t("eventForm.contentBlocks")} description={t("eventForm.contentBlocksDesc")}>
        <ContentSlotsEditor slots={contentSlots} onChange={setContentSlots} />
      </Section>

      <Section title={t("eventForm.guestImport")}>
        <p className="mb-4 text-sm text-zinc-500">{t("eventForm.guestImportDesc")}</p>
        <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setGuestFile(e.target.files?.[0] ?? null)} />
        {guestFile ? (
          <p className="mt-2 text-sm text-zinc-600">
            {t("eventForm.selectedFile", { name: guestFile.name })}
          </p>
        ) : null}
      </Section>

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {loading ? t("eventForm.creating") : t("eventForm.createEvent")}
      </button>
    </form>
  );
}
