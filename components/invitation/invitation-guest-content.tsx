"use client";

import { PageShell } from "@/components/shared/page-shell";
import { GuestQrCard } from "@/components/invitation/guest-qr-card";
import { InvitationLocationCard } from "@/components/invitation/invitation-location-card";
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
        {guest.eventLogoUrl ? (
          <div className="mt-4 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border-gold bg-surface p-2">
              <img
                src={guest.eventLogoUrl}
                alt={t("invitation.eventLogoAlt", { name: guest.eventDisplayName })}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        ) : null}
        <h1 className="mt-4 text-2xl font-semibold text-gradient-gold">{guest.eventDisplayName}</h1>
        {formattedDate ? (
          <p className="mt-2 text-sm text-muted">{formattedDate}</p>
        ) : null}

        <div className="surface-card mt-8 rounded-2xl p-6 shadow-lg shadow-black/20">
          <p className="text-lg font-semibold text-gold-light">{guest.name}</p>
          <p className="mt-2 text-sm text-muted">
            {t("reception.invitationNumber")}: {guest.invitationNumber}
          </p>
        </div>

        <InvitationLocationCard
          locationName={guest.locationName}
          locationDirections={guest.locationDirections}
          mapsLat={guest.mapsLat}
          mapsLng={guest.mapsLng}
          mapsUrl={guest.mapsUrl}
        />

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
