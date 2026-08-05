"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import {
  getHostInvitation,
  getReceptionSessionToken,
  type HostInvitation,
} from "@/lib/invitations/host-invitations";
import { getInvitationGuests, type InvitationGuest } from "@/lib/invitations/invitation-guests";
import {
  listGuestRegistrationRequests,
  reviewGuestRegistrationRequest,
  type GuestRegistrationRequest,
} from "@/lib/actions/guest-registration";
import { openWhatsAppInvite } from "@/lib/contacts/picker";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

function statusTone(status: GuestRegistrationRequest["status"]) {
  switch (status) {
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "approved":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "declined":
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

export function HostInvitationGuestsContent({ invitationId }: { invitationId: string }) {
  const { t } = useTranslation();
  const [invitation, setInvitation] = useState<HostInvitation | null>(null);
  const [localGuests, setLocalGuests] = useState<InvitationGuest[]>([]);
  const [requests, setRequests] = useState<GuestRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = useCallback(async (current: HostInvitation) => {
    const receptionToken = getReceptionSessionToken(current);
    setLocalGuests(getInvitationGuests(invitationId));
    if (receptionToken) {
      const items = await listGuestRegistrationRequests(receptionToken);
      setRequests(items);
    } else {
      setRequests([]);
    }
  }, [invitationId]);

  useEffect(() => {
    const saved = getHostInvitation(invitationId);
    setInvitation(saved);
    if (!saved) {
      setLoading(false);
      return;
    }
    void loadData(saved).finally(() => setLoading(false));
  }, [invitationId, loadData]);

  async function handleReview(requestId: string, action: "approve" | "decline") {
    if (!invitation || reviewingId) return;
    const receptionToken = getReceptionSessionToken(invitation);
    if (!receptionToken) return;

    setReviewingId(requestId);

    const result = await reviewGuestRegistrationRequest({
      receptionToken,
      requestId,
      action,
      origin: typeof window !== "undefined" ? window.location.origin : undefined,
    });

    setReviewingId(null);

    if (!result.success) return;

    if (action === "approve" && result.guestUrl && result.phone) {
      const message = t("hostShare.approvedWhatsAppMessage", {
        event: invitation.eventDisplayName,
        link: result.guestUrl,
      });
      openWhatsAppInvite(result.phone, message);
    }

    await loadData(invitation);
  }

  if (loading) {
    return (
      <AppPageShell className="pb-8">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!invitation) {
    return (
      <AppPageShell className="pb-8">
        <p className="text-sm text-muted">{t("hostGuests.notFound")}</p>
        <Link href={ROUTES.profile} className="btn-outline-gold mt-6 inline-flex rounded-xl px-4 py-3 text-sm">
          {t("profile.myInvitations")}
        </Link>
      </AppPageShell>
    );
  }

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const reviewedRequests = requests.filter((request) => request.status !== "pending");

  return (
    <AppPageShell className="pb-8">
      <header className="text-start">
        <h1 className="text-2xl font-semibold text-gold-light">{t("hostGuests.title")}</h1>
        <p className="mt-2 text-sm text-muted">{invitation.eventDisplayName}</p>
      </header>

      <section className="mt-8 text-start">
        <h2 className="text-sm font-semibold text-gold-light">{t("hostGuests.pendingRequests")}</h2>
        <div className="mt-3 space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="text-xs text-muted">{t("hostGuests.noPendingRequests")}</p>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
                <p className="text-sm font-medium text-gold-light">{request.name}</p>
                <p dir="ltr" className="mt-1 text-xs text-muted">
                  {request.phone}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={reviewingId === request.id}
                    onClick={() => void handleReview(request.id, "decline")}
                    className="btn-outline-gold rounded-xl px-3 py-2.5 text-xs font-medium disabled:opacity-60"
                  >
                    {t("hostGuests.decline")}
                  </button>
                  <button
                    type="button"
                    disabled={reviewingId === request.id}
                    onClick={() => void handleReview(request.id, "approve")}
                    className="btn-gold rounded-xl px-3 py-2.5 text-xs font-medium disabled:opacity-60"
                  >
                    {t("hostGuests.approve")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {reviewedRequests.length > 0 ? (
        <section className="mt-8 text-start">
          <h2 className="text-sm font-semibold text-gold-light">{t("hostGuests.registrationHistory")}</h2>
          <div className="mt-3 space-y-2">
            {reviewedRequests.map((request) => (
              <div
                key={request.id}
                className="surface-card flex items-center justify-between gap-3 rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-gold-light">{request.name}</p>
                  <p dir="ltr" className="text-xs text-muted">
                    {request.phone}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
                    statusTone(request.status)
                  )}
                >
                  {t(`hostGuests.status.${request.status}`)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {localGuests.length > 0 ? (
        <section className="mt-8 text-start">
          <h2 className="text-sm font-semibold text-gold-light">{t("hostGuests.savedGuests")}</h2>
          <div className="mt-3 space-y-2">
            {localGuests.map((guest) => (
              <div key={guest.id} className="surface-card rounded-xl px-4 py-3">
                <p className="text-sm text-gold-light">{guest.name}</p>
                <p dir="ltr" className="text-xs text-muted">
                  {guest.phone}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-gold-muted">
                  {t(`hostGuests.source.${guest.source}`)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AppPageShell>
  );
}
