"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { ReceptionBackLink } from "@/components/reception/reception-back-link";
import { ReceptionGuestAvatar } from "@/components/reception/reception-guest-avatar";
import { GuestQrCard } from "@/components/invitation/guest-qr-card";
import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { registerReceptionGuestArrival } from "@/lib/actions/reception";
import { ROUTES } from "@/lib/constants/routes";
import { getRsvpStatusLabelKey, type ReceptionGuestDetail } from "@/lib/reception/guest";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-gold/40 py-3 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-end text-sm font-medium text-gold-light">{value}</span>
    </div>
  );
}

export function ReceptionGuestDetailContent({
  guestToken,
  initialGuest,
}: {
  guestToken: string;
  initialGuest: ReceptionGuestDetail;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { receptionToken, entrance, getGuest, syncNow } = useReceptionSync();
  const syncedGuest = getGuest(guestToken);

  const guest = useMemo<ReceptionGuestDetail>(() => {
    if (!syncedGuest) return initialGuest;

    return {
      ...syncedGuest,
      checkedInAt: syncedGuest.checkedInAt ?? initialGuest.checkedInAt,
      checkedInEntrance: syncedGuest.checkedInEntrance ?? initialGuest.checkedInEntrance,
    };
  }, [syncedGuest, initialGuest, guestToken]);

  const [isRegistering, setIsRegistering] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isCheckedIn = guest.checkInStatus === "checked_in";

  async function handleRegisterArrival() {
    if (isRegistering || isCheckedIn) return;

    setIsRegistering(true);
    setFeedback(null);

    const result = await registerReceptionGuestArrival(
      receptionToken,
      guest.guestToken,
      entrance
    );

    if (result.success) {
      await syncNow();
      router.push(ROUTES.receptionGuestArrivalSuccess(receptionToken, guest.guestToken));
      return;
    }

    if (result.error === "already_checked_in") {
      await syncNow();
      setFeedback(
        t("reception.alreadyCheckedInAtEntrance", {
          entrance: result.checkedInEntrance ?? t("reception.unknownEntrance"),
        })
      );
    } else {
      setFeedback(t("reception.registerFailed"));
    }

    setIsRegistering(false);
  }

  function handleEditDetails() {
    setFeedback(t("common.comingSoon"));
  }

  return (
    <AppPageShell className="min-h-screen pb-10 pt-8">
      <ReceptionBackLink
        receptionToken={receptionToken}
        href={ROUTES.receptionRegister(receptionToken)}
        label={t("reception.backToRegister")}
      />

      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("reception.guestDetails")}</h1>
      </header>

      <div className="surface-card mt-8 rounded-2xl p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col items-center text-center">
          <ReceptionGuestAvatar name={guest.name} avatarUrl={guest.avatarUrl} size="lg" />
          <p className="mt-4 text-lg font-semibold text-gold-light">{guest.name}</p>
        </div>

        <div className="mt-6">
          <DetailRow label={t("reception.invitationNumber")} value={guest.invitationNumber} />
          <DetailRow
            label={t("reception.invitationStatus")}
            value={t(getRsvpStatusLabelKey(guest.rsvpStatus) as TranslationKey)}
          />
          <DetailRow
            label={t("reception.companions")}
            value={String(guest.companionCount)}
          />
          {isCheckedIn ? (
            <>
              <DetailRow
                label={t("reception.checkInStatus")}
                value={t("reception.checkedIn")}
              />
              {guest.checkedInEntrance ? (
                <DetailRow
                  label={t("reception.entranceLabel")}
                  value={guest.checkedInEntrance}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <GuestQrCard
          guestToken={guest.guestToken}
          guestName={guest.name}
          invitationNumber={guest.invitationNumber}
        />
      </div>

      {feedback ? (
        <p className="mt-4 text-sm text-gold" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={handleRegisterArrival}
          disabled={isRegistering || isCheckedIn}
          className="btn-gold w-full rounded-xl px-4 py-3.5 text-sm font-medium disabled:opacity-60"
        >
          {isRegistering
            ? t("common.loading")
            : isCheckedIn
              ? t("reception.checkedIn")
              : t("reception.registerArrival")}
        </button>
        <button
          type="button"
          onClick={handleEditDetails}
          className="btn-outline-gold w-full rounded-xl px-4 py-3.5 text-sm font-medium"
        >
          {t("reception.editDetails")}
        </button>
      </div>
    </AppPageShell>
  );
}
