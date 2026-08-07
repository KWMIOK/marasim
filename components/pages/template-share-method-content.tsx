"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { CopyLinkCard } from "@/components/templates/copy-link-card";
import { ContactsFallbackModal } from "@/components/guests/contacts-fallback-modal";
import { GuestImportPreviewTable } from "@/components/guests/guest-import-preview-table";
import { useToast } from "@/components/shared/toast-provider";
import { useHostInvitationQuery } from "@/hooks/use-host-invitation-query";
import {
  buildPublicRegistrationUrlForInvitation,
  getReceptionSessionToken,
} from "@/lib/invitations/host-invitations";
import { ROUTES } from "@/lib/constants/routes";
import { ensureReceptionSessionForInvitation } from "@/lib/actions/reception";
import { createShareHubGuests } from "@/lib/actions/share-guests";
import { getPublicRegistrationToken } from "@/lib/actions/guest-registration";
import {
  buildGuestImportPreview,
  parseGuestFile,
  type ParsedGuestPreviewRow,
} from "@/lib/guests/parse-roster";
import {
  GUEST_IMPORT_COLUMNS,
  GUEST_IMPORT_REQUIRED_COLUMNS,
  parsedRowsToShareGuests,
} from "@/lib/guests/import-columns";
import { downloadGuestImportTemplate } from "@/lib/guests/download-import-template";
import {
  isContactPickerSupported,
  isNativeApp,
  openWhatsAppInvite,
  pickDeviceContacts,
  sendWhatsAppInvites,
  type PickedContact,
} from "@/lib/contacts/picker";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import type { HostInvitation } from "@/lib/invitations/host-invitations";

export type InvitationShareMethod = "manual" | "contacts" | "import" | "public-link";

const METHOD_TITLE_KEYS: Record<InvitationShareMethod, TranslationKey> = {
  manual: "hostShare.manualTitle",
  contacts: "hostShare.contactsTitle",
  import: "hostShare.importTitle",
  "public-link": "hostShare.publicLinkTitle",
};

const METHOD_DESCRIPTION_KEYS: Record<InvitationShareMethod, TranslationKey> = {
  manual: "hostShare.manualPageDescription",
  contacts: "hostShare.contactsPageDescription",
  import: "hostShare.importPageDescription",
  "public-link": "hostShare.publicLinkPageDescription",
};

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function GuestImportColumnsGuide() {
  const { t } = useTranslation();

  return (
    <div className="surface-card overflow-hidden rounded-2xl text-start shadow-lg shadow-black/20">
      <div className="border-b border-border-gold px-4 py-3">
        <p className="text-sm font-semibold text-gold-light">{t("hostShare.importColumnsTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("hostShare.importColumnsSubtitle")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-border-gold/60 text-muted">
              <th className="px-4 py-2 text-start font-medium">{t("hostShare.importColumnHeader")}</th>
              <th className="px-4 py-2 text-start font-medium">{t("hostShare.importRequiredHeader")}</th>
              <th className="px-4 py-2 text-start font-medium">{t("hostShare.importAliasesHeader")}</th>
              <th className="px-4 py-2 text-start font-medium">{t("hostShare.importExampleHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {GUEST_IMPORT_COLUMNS.map((column) => (
              <tr key={column.key} className="border-b border-border-gold/30 last:border-0">
                <td className="px-4 py-2.5 font-medium text-gold-light">
                  {t(column.labelKey as TranslationKey)}
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {column.required ? t("hostShare.importRequiredYes") : t("hostShare.importRequiredNo")}
                </td>
                <td dir="ltr" className="px-4 py-2.5 text-gold-light">
                  {column.aliases.join(", ")}
                </td>
                <td dir="ltr" className="px-4 py-2.5 text-gold-muted">
                  {column.example}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        {t("hostShare.importRequiredSummary", {
          columns: GUEST_IMPORT_REQUIRED_COLUMNS.map((column) => column.header).join(", "),
        })}
      </p>
    </div>
  );
}

async function resolveReceptionToken(invitation: HostInvitation): Promise<string | null> {
  const existing = getReceptionSessionToken(invitation);
  if (existing) return existing;

  const result = await ensureReceptionSessionForInvitation({
    eventDisplayName: invitation.eventDisplayName,
    eventDate: invitation.eventDate,
    occasion: invitation.occasion,
    guestUrl: invitation.guestUrl,
    receptionistUrl: invitation.receptionistUrl,
    receptionSessionToken: invitation.receptionSessionToken,
    guestQrEnabled: invitation.guestQrEnabled,
    receptionStaffCount: invitation.receptionStaffCount,
    locationName: invitation.location || null,
    locationDirections: invitation.locationDirections || null,
    mapsLat: invitation.mapsLat,
    mapsLng: invitation.mapsLng,
    mapsUrl: invitation.mapsUrl || null,
    eventLogoUrl: invitation.eventLogoUrl,
  });

  if (!result.success) return null;
  return getReceptionSessionToken(invitation);
}

function buildWhatsAppMessage(
  t: (key: TranslationKey, params?: Record<string, string>) => string,
  eventName: string,
  guestUrl: string
) {
  return t("hostShare.whatsappMessage", { event: eventName, link: guestUrl });
}

export function TemplateShareMethodContent({
  templateId,
  method,
}: {
  templateId: string;
  method: InvitationShareMethod;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { invitation, hydrated } = useHostInvitationQuery(templateId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [pickedContacts, setPickedContacts] = useState<PickedContact[]>([]);
  const [selectedContactKeys, setSelectedContactKeys] = useState<Set<string>>(new Set());
  const [contactsSending, setContactsSending] = useState(false);
  const [contactsProgress, setContactsProgress] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const [importPreview, setImportPreview] = useState<ParsedGuestPreviewRow[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [publicRegistrationUrl, setPublicRegistrationUrl] = useState<string | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(method === "public-link");

  useEffect(() => {
    if (!invitation || method !== "public-link") return;

    const current = invitation;

    async function resolvePublicLink() {
      setPublicLinkLoading(true);
      const slugUrl = buildPublicRegistrationUrlForInvitation(current);
      if (slugUrl) {
        setPublicRegistrationUrl(slugUrl);
        setPublicLinkLoading(false);
        return;
      }

      let token = current.publicRegistrationToken;
      const receptionToken = getReceptionSessionToken(current);
      if (!token && receptionToken) {
        token = await getPublicRegistrationToken(receptionToken);
      }
      setPublicRegistrationUrl(
        token ? buildPublicRegistrationUrlForInvitation({ ...current, publicRegistrationToken: token }) : null
      );
      setPublicLinkLoading(false);
    }

    void resolvePublicLink();
  }, [invitation, method]);

  if (!hydrated || !invitation) {
    return (
      <AppPageShell className="pb-8">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  const currentInvitation = invitation;

  async function persistAndDispatch(
    guests: Array<{
      name: string;
      phone: string;
      source: "manual" | "contacts" | "import";
      is_vip?: boolean;
      table_number?: string;
      companion_count?: number;
    }>,
    options: { openWhatsApp: boolean }
  ) {
    const receptionToken = await resolveReceptionToken(currentInvitation);
    if (!receptionToken) {
      showToast(t("hostShare.guestSaveFailed"), "error");
      return null;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const result = await createShareHubGuests({
      receptionToken,
      guests,
      origin,
    });

    if (!result.success) {
      showToast(t("hostShare.guestSaveFailed"), "error");
      return null;
    }

    if (result.createdCount > 0) {
      showToast(t("hostShare.guestSavedToast", { count: String(result.createdCount) }));
    }

    if (result.skippedCount > 0) {
      showToast(t("hostShare.guestDuplicatesSkipped", { count: String(result.skippedCount) }), "error");
    }

    if (result.createdCount === 0 && result.skippedCount > 0) {
      return null;
    }

    if (options.openWhatsApp) {
      for (const created of result.guests) {
        if (!created.guestUrl) continue;
        const contact = guests.find(
          (guest) => guest.phone === created.phone && guest.name === created.name
        );
        if (!contact) continue;
        openWhatsAppInvite(
          contact.phone,
          buildWhatsAppMessage(t, currentInvitation.eventDisplayName, created.guestUrl)
        );
        await new Promise((resolve) => window.setTimeout(resolve, 600));
      }
    }

    return result;
  }

  async function handleManualSubmit() {
    const name = guestName.trim();
    const phone = guestPhone.trim();
    if (!name || !phone) {
      showToast(t("hostShare.manualInvalid"), "error");
      return;
    }

    setSaving(true);
    const result = await persistAndDispatch([{ name, phone, source: "manual" }], {
      openWhatsApp: true,
    });
    setSaving(false);

    if (result) {
      setGuestName("");
      setGuestPhone("");
    }
  }

  function contactKey(contact: PickedContact) {
    return `${contact.name}::${contact.phone}`;
  }

  function mergePickedContact(contact: PickedContact) {
    const key = contactKey(contact);
    setPickedContacts((current) => {
      if (current.some((entry) => contactKey(entry) === key)) {
        return current;
      }
      return [...current, contact].sort((a, b) => a.name.localeCompare(b.name));
    });
    setSelectedContactKeys((current) => new Set([...current, key]));
  }

  async function handlePickContacts() {
    setContactsError(null);
    setContactsProgress(null);

    if (!isContactPickerSupported()) {
      setFallbackOpen(true);
      return;
    }

    try {
      const contacts = await pickDeviceContacts();
      if (contacts.length === 0) {
        setContactsError(t("hostShare.contactsEmpty"));
        return;
      }
      for (const contact of contacts) {
        mergePickedContact(contact);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "CONTACT_PERMISSION_DENIED") {
        setContactsError(t("hostShare.contactsPermissionDenied"));
      } else if (error instanceof Error && error.message === "CONTACT_PICKER_UNAVAILABLE") {
        setFallbackOpen(true);
      } else {
        setContactsError(t("hostShare.contactsPickFailed"));
      }
    }
  }

  function toggleContactSelection(key: string) {
    setSelectedContactKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedContacts = pickedContacts.filter((contact) =>
    selectedContactKeys.has(contactKey(contact))
  );

  async function handleSendContactsWhatsApp(contacts: PickedContact[]) {
    if (contacts.length === 0 || contactsSending) return;

    setContactsSending(true);
    setContactsProgress(t("hostShare.contactsSending", { count: String(contacts.length) }));

    const receptionToken = await resolveReceptionToken(currentInvitation);
    if (!receptionToken) {
      showToast(t("hostShare.guestSaveFailed"), "error");
      setContactsSending(false);
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const result = await createShareHubGuests({
      receptionToken,
      guests: contacts.map((contact) => ({
        name: contact.name,
        phone: contact.phone,
        source: "contacts" as const,
      })),
      origin,
    });

    if (!result.success) {
      showToast(t("hostShare.guestSaveFailed"), "error");
      setContactsSending(false);
      return;
    }

    if (result.createdCount > 0) {
      showToast(t("hostShare.guestSavedToast", { count: String(result.createdCount) }));
    }
    if (result.skippedCount > 0) {
      showToast(t("hostShare.guestDuplicatesSkipped", { count: String(result.skippedCount) }), "error");
    }
    if (result.createdCount === 0) {
      setContactsSending(false);
      return;
    }

    const urlByPhone = new Map(result.guests.map((guest) => [guest.phone, guest.guestUrl]));

    await sendWhatsAppInvites(contacts, (contact) => {
      const guestUrl = urlByPhone.get(contact.phone);
      if (!guestUrl) {
        return buildWhatsAppMessage(t, currentInvitation.eventDisplayName, currentInvitation.guestUrl);
      }
      return buildWhatsAppMessage(t, currentInvitation.eventDisplayName, guestUrl);
    }, (index, total) => {
      setContactsProgress(
        t("hostShare.contactsSendingProgress", {
          current: String(index + 1),
          total: String(total),
        })
      );
    });

    setContactsSending(false);
    setContactsProgress(t("hostShare.contactsSent", { count: String(contacts.length) }));
    setPickedContacts([]);
    setSelectedContactKeys(new Set());
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportPreview(null);

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseGuestFile(buffer, file.name);
      if (rows.length === 0) {
        setImportError(t("hostShare.importMissingPhone"));
        return;
      }
      setImportPreview(buildGuestImportPreview(rows));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t("hostShare.importFailed"));
    } finally {
      setImporting(false);
    }
  }

  async function handleConfirmImport() {
    if (!importPreview) return;
    const validRows = importPreview.filter((row) => row.isValid);
    if (validRows.length === 0) {
      showToast(t("hostShare.importMissingPhone"), "error");
      return;
    }

    setImporting(true);
    await persistAndDispatch(parsedRowsToShareGuests(validRows, "import"), { openWhatsApp: false });
    setImporting(false);
    setImportPreview(null);
  }

  return (
    <AppPageShell className="pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t(METHOD_TITLE_KEYS[method])}</h1>
        <p className="mt-2 text-sm text-muted">{t(METHOD_DESCRIPTION_KEYS[method])}</p>
      </header>

      {method === "manual" ? (
        <div className="mt-8 space-y-4 text-start">
          <div>
            <label htmlFor="guestName" className="block text-sm font-medium text-gold-light">
              {t("hostShare.guestNameLabel")}
            </label>
            <input
              id="guestName"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border-gold bg-surface px-3 py-3 text-sm text-gold-light outline-none"
            />
          </div>
          <div>
            <label htmlFor="guestPhone" className="block text-sm font-medium text-gold-light">
              {t("hostShare.guestPhoneLabel")}
            </label>
            <input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(event) => setGuestPhone(event.target.value)}
              dir="ltr"
              className="mt-2 w-full rounded-xl border border-border-gold bg-surface px-3 py-3 text-sm text-gold-light outline-none"
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleManualSubmit()}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            {saving ? t("hostShare.savingGuest") : t("hostShare.manualSubmit")}
          </button>
        </div>
      ) : null}

      {method === "contacts" ? (
        <div className="mt-8 space-y-4 text-start">
          <button
            type="button"
            onClick={() => void handlePickContacts()}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium"
          >
            {pickedContacts.length > 0 && isNativeApp()
              ? t("hostShare.contactsAddMore")
              : isNativeApp()
                ? t("hostShare.contactsLoad")
                : t("hostShare.contactsPick")}
          </button>
          {!isContactPickerSupported() ? (
            <p className="text-xs text-muted">{t("hostShare.contactsFallbackHint")}</p>
          ) : (
            <p className="text-xs text-muted">
              {isNativeApp() ? t("hostShare.contactsNativeHint") : t("hostShare.contactsHint")}
            </p>
          )}
          {pickedContacts.length > 0 ? (
            <div className="surface-card rounded-2xl p-4">
              <p className="text-sm font-medium text-gold-light">
                {t("hostShare.contactsSelected", { count: String(selectedContacts.length) })}
              </p>
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {pickedContacts.map((contact) => {
                  const key = contactKey(contact);
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-center gap-3 text-xs">
                        {isNativeApp() ? (
                          <input
                            type="checkbox"
                            checked={selectedContactKeys.has(key)}
                            onChange={() => toggleContactSelection(key)}
                            className="h-4 w-4 accent-[#c9a227]"
                          />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="text-gold-light">{contact.name}</span>
                          <span dir="ltr" className="ms-2 text-muted">
                            {contact.phone}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                disabled={contactsSending || selectedContacts.length === 0}
                onClick={() => void handleSendContactsWhatsApp(selectedContacts)}
                className="btn-outline-gold mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {contactsSending ? t("hostShare.contactsSendingShort") : t("hostShare.contactsSubmit")}
              </button>
            </div>
          ) : null}
          {contactsProgress ? <p className="text-xs text-gold-muted">{contactsProgress}</p> : null}
          {contactsError ? <p className="text-xs text-red-300">{contactsError}</p> : null}
          <ContactsFallbackModal
            open={fallbackOpen}
            onClose={() => setFallbackOpen(false)}
            onConfirm={(contacts) => {
              setPickedContacts(contacts);
              setSelectedContactKeys(new Set(contacts.map(contactKey)));
              void handleSendContactsWhatsApp(contacts);
            }}
          />
        </div>
      ) : null}

      {method === "import" ? (
        <div className="mt-8 space-y-4 text-start">
          <GuestImportColumnsGuide />
          <button
            type="button"
            onClick={() => void downloadGuestImportTemplate()}
            className="btn-outline-gold w-full rounded-xl px-4 py-3 text-sm font-medium"
          >
            {t("hostShare.importDownloadTemplate")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
          >
            {importing ? t("guestImport.importing") : t("hostShare.importSubmit")}
          </button>
          {importPreview ? (
            <>
              <GuestImportPreviewTable rows={importPreview} />
              <button
                type="button"
                disabled={importing || importPreview.every((row) => !row.isValid)}
                onClick={() => void handleConfirmImport()}
                className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {importing ? t("hostShare.savingGuest") : t("hostShare.importConfirm")}
              </button>
            </>
          ) : null}
          {importError ? <p className="text-xs text-red-300">{importError}</p> : null}
        </div>
      ) : null}

      {method === "public-link" ? (
        <div className="mt-8 space-y-4">
          {publicLinkLoading ? (
            <p className="text-sm text-muted">{t("common.loading")}</p>
          ) : publicRegistrationUrl ? (
            <>
              <CopyLinkCard
                label={t("hostShare.publicLinkCardTitle")}
                description={t("hostShare.publicLinkCardDescription")}
                url={publicRegistrationUrl}
                icon={<LinkIcon />}
              />
              <Link
                href={ROUTES.profileInvitationGuests(currentInvitation.id)}
                className="btn-outline-gold flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
              >
                {t("hostShare.manageRequests")}
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">{t("hostShare.publicLinkUnavailable")}</p>
          )}
        </div>
      ) : null}
    </AppPageShell>
  );
}
