"use client";

import { useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import {
  getPublicRegistrationEvent,
  getPublicRegistrationEventBySlug,
  submitGuestRegistrationRequest,
  submitGuestRegistrationRequestBySlug,
} from "@/lib/actions/guest-registration";
import { useTranslation } from "@/hooks/use-locale";

export function PublicGuestRegistrationContent({
  publicToken,
  eventSlug,
}: {
  publicToken?: string;
  eventSlug?: string;
}) {
  const { t } = useTranslation();
  const [eventName, setEventName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resolvedToken, setResolvedToken] = useState<string | null>(publicToken ?? null);

  useEffect(() => {
    async function loadEvent() {
      if (eventSlug) {
        const event = await getPublicRegistrationEventBySlug(eventSlug);
        setEventName(event?.eventDisplayName ?? null);
        setResolvedToken(event?.publicToken ?? null);
      } else if (publicToken) {
        const event = await getPublicRegistrationEvent(publicToken);
        setEventName(event?.eventDisplayName ?? null);
        setResolvedToken(publicToken);
      } else {
        setEventName(null);
      }
      setLoading(false);
    }

    void loadEvent();
  }, [eventSlug, publicToken]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setError(t("publicRegistration.invalidInput"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = eventSlug
      ? await submitGuestRegistrationRequestBySlug({
          eventSlug,
          name: trimmedName,
          phone: trimmedPhone,
        })
      : await submitGuestRegistrationRequest({
          publicToken: resolvedToken ?? publicToken ?? "",
          name: trimmedName,
          phone: trimmedPhone,
        });

    setSubmitting(false);

    if (!result.success) {
      setError(t("publicRegistration.submitFailed"));
      return;
    }

    setSubmitted(true);
  }

  if (loading) {
    return (
      <AppPageShell className="pb-8">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!eventName) {
    return (
      <AppPageShell className="pb-8">
        <h1 className="text-xl font-semibold text-gold-light">{t("publicRegistration.notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("publicRegistration.notFoundDescription")}</p>
      </AppPageShell>
    );
  }

  if (submitted) {
    return (
      <AppPageShell className="pb-8">
        <h1 className="text-2xl font-semibold text-gold-light">{t("publicRegistration.successTitle")}</h1>
        <p className="mt-3 text-sm text-muted">{t("publicRegistration.successDescription")}</p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell className="pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("publicRegistration.title")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("publicRegistration.subtitle", { event: eventName })}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-start">
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium text-gold-light">
            {t("publicRegistration.nameLabel")}
          </label>
          <input
            id="guestName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-border-gold bg-surface px-3 py-3 text-sm text-gold-light outline-none"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="guestPhone" className="block text-sm font-medium text-gold-light">
            {t("publicRegistration.phoneLabel")}
          </label>
          <input
            id="guestPhone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border border-border-gold bg-surface px-3 py-3 text-sm text-gold-light outline-none"
            autoComplete="tel"
            dir="ltr"
          />
        </div>
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
        >
          {submitting ? t("publicRegistration.submitting") : t("publicRegistration.submit")}
        </button>
      </form>
    </AppPageShell>
  );
}
