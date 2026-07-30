"use client";

import { PageShell } from "@/components/shared/page-shell";
import { GuestQrCard } from "@/components/invitation/guest-qr-card";
import type { PublicGuestInvitation } from "@/lib/actions/guest-invitation";
import { formatReceptionEventDate } from "@/lib/reception/session";
import { useTranslation } from "@/hooks/use-locale";

export function InvitationGuestContent({ guest }: { guest: PublicGuestInvitation }) {
  const { t, locale } = useTranslation();
  const formattedDate = formatReceptionEventDate(guest.eventDate, locale);

  return (
    <main className="min-h-full">
      <PageShell className="max-w-lg py-10">
        <p className="text-xs uppercase tracking-widest text-gold">{t("invitation.preview")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gradient-gold">{guest.eventDisplayName}</h1>
        {formattedDate ? (
          <p className="mt-2 text-sm text-muted">{formattedDate}</p>
        ) : null}

        <div className="surface-card mt-8 rounded-2xl p-6 shadow-lg shadow-black/20">
          <p className="text-lg font-semibold text-gold-light">{guest.name}</p>
          <p className="mt-2 text-sm text-muted">
            {t("reception.invitationNumber")}: {guest.invitationNumber}
          </p>
        </div>

        <div className="mt-6">
          {guest.guestQrEnabled ? (
            <GuestQrCard
              guestToken={guest.guestToken}
              guestName={guest.name}
              invitationNumber={guest.invitationNumber}
            />
          ) : null}
        </div>

        {guest.guestQrEnabled ? (
          <p className="mt-6 text-sm text-muted">{t("invitation.guestQrScanHint")}</p>
        ) : null}
      </PageShell>
    </main>
  );
}
