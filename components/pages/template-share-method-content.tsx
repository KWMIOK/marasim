"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { CopyLinkCard } from "@/components/templates/copy-link-card";
import { useHostInvitationQuery } from "@/hooks/use-host-invitation-query";
import {
  buildPublicRegistrationUrl,
  getReceptionSessionToken,
} from "@/lib/invitations/host-invitations";
import { ROUTES } from "@/lib/constants/routes";
import { addInvitationGuests } from "@/lib/invitations/invitation-guests";
import { getPublicRegistrationToken } from "@/lib/actions/guest-registration";
import { parseGuestFile } from "@/lib/guests/parse-roster";
import {
  GUEST_IMPORT_COLUMNS,
  GUEST_IMPORT_REQUIRED_COLUMNS,
} from "@/lib/guests/import-columns";
import {
  isContactPickerSupported,
  openWhatsAppInvite,
  pickDeviceContacts,
  sendWhatsAppInvites,
  type PickedContact,
} from "@/lib/contacts/picker";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

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
                <td dir="ltr" className="px-4 py-2.5 font-mono text-gold-light">
                  {column.header}
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

export function TemplateShareMethodContent({
  templateId,
  method,
}: {
  templateId: string;
  method: InvitationShareMethod;
}) {
  const { t } = useTranslation();
  const { invitation, hydrated } = useHostInvitationQuery(templateId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const [pickedContacts, setPickedContacts] = useState<PickedContact[]>([]);
  const [contactsSending, setContactsSending] = useState(false);
  const [contactsProgress, setContactsProgress] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [publicRegistrationUrl, setPublicRegistrationUrl] = useState<string | null>(null);
  const [publicLinkLoading, setPublicLinkLoading] = useState(method === "public-link");

  useEffect(() => {
    if (!invitation || method !== "public-link") return;

    const current = invitation;

    async function resolvePublicLink() {
      setPublicLinkLoading(true);
      let token = current.publicRegistrationToken;
      const receptionToken = getReceptionSessionToken(current);
      if (!token && receptionToken) {
        token = await getPublicRegistrationToken(receptionToken);
      }
      setPublicRegistrationUrl(token ? buildPublicRegistrationUrl(token) : null);
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
  const whatsappMessage = t("hostShare.whatsappMessage", {
    event: currentInvitation.eventDisplayName,
    link: currentInvitation.guestUrl,
  });

  function handleManualSubmit() {
    const name = guestName.trim();
    const phone = guestPhone.trim();
    if (!name || !phone) {
      setFeedback(t("hostShare.manualInvalid"));
      return;
    }

    addInvitationGuests(currentInvitation.id, [{ name, phone }], "manual");
    openWhatsAppInvite(phone, whatsappMessage);
    setGuestName("");
    setGuestPhone("");
    setFeedback(t("hostShare.manualSavedOne", { name }));
  }

  async function handlePickContacts() {
    setContactsError(null);
    setContactsProgress(null);

    try {
      const contacts = await pickDeviceContacts();
      if (contacts.length === 0) {
        setContactsError(t("hostShare.contactsEmpty"));
        return;
      }
      setPickedContacts(contacts);
    } catch (error) {
      if (error instanceof Error && error.message === "CONTACT_PICKER_UNAVAILABLE") {
        setContactsError(t("hostShare.contactsUnavailable"));
      } else {
        setContactsError(t("hostShare.contactsPickFailed"));
      }
    }
  }

  async function handleSendContactsWhatsApp() {
    if (pickedContacts.length === 0 || contactsSending) return;

    setContactsSending(true);
    setContactsProgress(t("hostShare.contactsSending", { count: String(pickedContacts.length) }));

    addInvitationGuests(
      currentInvitation.id,
      pickedContacts.map((contact) => ({ name: contact.name, phone: contact.phone })),
      "contacts"
    );

    await sendWhatsAppInvites(pickedContacts, whatsappMessage, (index, total) => {
      setContactsProgress(
        t("hostShare.contactsSendingProgress", {
          current: String(index + 1),
          total: String(total),
        })
      );
    });

    setContactsSending(false);
    setContactsProgress(t("hostShare.contactsSent", { count: String(pickedContacts.length) }));
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const rows = parseGuestFile(buffer, file.name);
      const withPhone = rows.filter((row) => row.phone_number?.trim());

      if (withPhone.length === 0) {
        setImportError(t("hostShare.importMissingPhone"));
        return;
      }

      addInvitationGuests(
        currentInvitation.id,
        withPhone.map((row) => ({
          name: row.name,
          phone: row.phone_number ?? "",
        })),
        "import"
      );
      setImportMessage(t("hostShare.importParsed", { count: String(withPhone.length) }));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t("hostShare.importFailed"));
    } finally {
      setImporting(false);
    }
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
              onChange={(event) => {
                setGuestName(event.target.value);
                setFeedback(null);
              }}
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
              onChange={(event) => {
                setGuestPhone(event.target.value);
                setFeedback(null);
              }}
              dir="ltr"
              className="mt-2 w-full rounded-xl border border-border-gold bg-surface px-3 py-3 text-sm text-gold-light outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleManualSubmit}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium"
          >
            {t("hostShare.manualSubmit")}
          </button>
          {feedback ? <p className="text-xs text-gold-muted">{feedback}</p> : null}
        </div>
      ) : null}

      {method === "contacts" ? (
        <div className="mt-8 space-y-4 text-start">
          <button
            type="button"
            onClick={() => void handlePickContacts()}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium"
          >
            {t("hostShare.contactsPick")}
          </button>
          {!isContactPickerSupported() ? (
            <p className="text-xs text-muted">{t("hostShare.contactsUnavailable")}</p>
          ) : (
            <p className="text-xs text-muted">{t("hostShare.contactsHint")}</p>
          )}
          {pickedContacts.length > 0 ? (
            <div className="surface-card rounded-2xl p-4">
              <p className="text-sm font-medium text-gold-light">
                {t("hostShare.contactsSelected", { count: String(pickedContacts.length) })}
              </p>
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {pickedContacts.map((contact) => (
                  <li key={`${contact.name}-${contact.phone}`} className="text-xs text-muted">
                    <span className="text-gold-light">{contact.name}</span>
                    <span dir="ltr" className="ms-2">
                      {contact.phone}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={contactsSending}
                onClick={() => void handleSendContactsWhatsApp()}
                className="btn-outline-gold mt-4 w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {contactsSending ? t("hostShare.contactsSendingShort") : t("hostShare.contactsSubmit")}
              </button>
            </div>
          ) : null}
          {contactsProgress ? <p className="text-xs text-gold-muted">{contactsProgress}</p> : null}
          {contactsError ? <p className="text-xs text-red-300">{contactsError}</p> : null}
        </div>
      ) : null}

      {method === "import" ? (
        <div className="mt-8 space-y-4 text-start">
          <GuestImportColumnsGuide />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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
          {importMessage ? <p className="text-xs text-gold-muted">{importMessage}</p> : null}
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
