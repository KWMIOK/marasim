"use client";

import { useState } from "react";
import type { PickedContact } from "@/lib/contacts/picker";
import { useTranslation } from "@/hooks/use-locale";

export function ContactsFallbackModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (contacts: PickedContact[]) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState<PickedContact[]>([]);

  if (!open) return null;

  function handleAdd() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) return;

    setContacts((current) => [...current, { name: trimmedName, phone: trimmedPhone }]);
    setName("");
    setPhone("");
  }

  function handleConfirm() {
    if (contacts.length === 0) return;
    onConfirm(contacts);
    setContacts([]);
    setName("");
    setPhone("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="surface-card w-full max-w-md rounded-2xl p-5 text-start shadow-2xl shadow-black/40"
      >
        <h2 className="text-lg font-semibold text-gold-light">{t("hostShare.contactsFallbackTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("hostShare.contactsFallbackDescription")}</p>

        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("hostShare.guestNameLabel")}
            className="w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light outline-none"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            dir="ltr"
            placeholder={t("hostShare.guestPhoneLabel")}
            className="w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="btn-outline-gold w-full rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {t("hostShare.contactsFallbackAdd")}
          </button>
        </div>

        {contacts.length > 0 ? (
          <ul className="mt-4 max-h-36 space-y-2 overflow-y-auto text-xs">
            {contacts.map((contact, index) => (
              <li key={`${contact.name}-${contact.phone}-${index}`} className="text-gold-light">
                {contact.name}
                <span dir="ltr" className="ms-2 text-muted">
                  {contact.phone}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline-gold rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={contacts.length === 0}
            onClick={handleConfirm}
            className="btn-gold rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {t("hostShare.contactsSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}
