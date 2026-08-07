"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { useToast } from "@/components/shared/toast-provider";
import {
  getHostInvitation,
  getReceptionSessionToken,
  type HostInvitation,
} from "@/lib/invitations/host-invitations";
import {
  listGuestRegistrationRequests,
  reviewGuestRegistrationRequest,
  type GuestRegistrationRequest,
} from "@/lib/actions/guest-registration";
import { listReceptionGuests } from "@/lib/actions/reception";
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
  const { showToast } = useToast();
  const [invitation, setInvitation] = useState<HostInvitation | null>(null);
  const [rosterGuests, setRosterGuests] = useState<
    Array<{ guestToken: string; name: string; invitationNumber: string; phone?: string | null; source?: string | null }>
  >([]);
  const [requests, setRequests] = useState<GuestRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [approvalsOpen, setApprovalsOpen] = useState(false);

  const loadData = useCallback(async (current: HostInvitation) => {
    const receptionToken = getReceptionSessionToken(current);
    if (receptionToken) {
      const [items, guests] = await Promise.all([
        listGuestRegistrationRequests(receptionToken),
        listReceptionGuests(receptionToken),
      ]);
      setRequests(items);
      setRosterGuests(
        guests.map((guest) => ({
          guestToken: guest.guestToken,
          name: guest.name,
          invitationNumber: guest.invitationNumber,
          phone: guest.phoneNumber,
          source: guest.source ?? null,
        }))
      );
    } else {
      setRequests([]);
      setRosterGuests([]);
    }
  }, []);

  useEffect(() => {
    const saved = getHostInvitation(invitationId);
    setInvitation(saved);
    if (!saved) {
      setLoading(false);
      return;
    }
    void loadData(saved).finally(() => setLoading(false));
  }, [invitationId, loadData]);

  useEffect(() => {
    if (!invitation) return;

    const interval = window.setInterval(() => {
      void loadData(invitation);
    }, 20000);

    return () => window.clearInterval(interval);
  }, [invitation, loadData]);

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

    if (!result.success) {
      showToast(t("hostGuests.reviewFailed"), "error");
      return;
    }

    if (action === "approve") {
      showToast(t("hostGuests.approvedToast"), "success");
      if (result.guestUrl && result.phone) {
        const message = t("hostShare.approvedWhatsAppMessageWithQr", {
          event: invitation.eventDisplayName,
          link: result.guestUrl,
          qr: result.qrPayload ?? "",
        });
        openWhatsAppInvite(result.phone, message);
      }
    } else {
      showToast(t("hostGuests.declinedToast"), "info");
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

      {pendingRequests.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-start">
          <p className="text-sm font-medium text-amber-100">
            {t("hostGuests.pendingBanner", { count: String(pendingRequests.length) })}
          </p>
          <button
            type="button"
            onClick={() => setApprovalsOpen(true)}
            className="btn-outline-gold mt-3 rounded-xl px-4 py-2 text-xs font-medium"
          >
            {t("hostGuests.viewPending")}
          </button>
        </div>
      ) : null}

      <section className="mt-8 text-start">
        <h2 className="text-sm font-semibold text-gold-light">{t("hostGuests.guestRoster")}</h2>
        <div className="mt-3 space-y-2">
          {rosterGuests.length === 0 ? (
            <p className="text-xs text-muted">{t("hostGuests.noRosterGuests")}</p>
          ) : (
            rosterGuests.map((guest) => (
              <div key={guest.guestToken} className="surface-card rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gold-light">{guest.name}</p>
                    {guest.phone ? (
                      <p dir="ltr" className="text-xs text-muted">
                        {guest.phone}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-gold-muted">
                    {guest.invitationNumber}
                  </span>
                </div>
                {guest.source ? (
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-gold-muted">
                    {t(`hostGuests.source.${guest.source as "manual" | "contacts" | "import" | "registration"}`)}
                  </p>
                ) : null}
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

      {approvalsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="surface-card flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl shadow-2xl shadow-black/40"
          >
            <div className="border-b border-border-gold px-5 py-4 text-start">
              <h2 className="text-lg font-semibold text-gold-light">{t("hostGuests.approvalsDrawerTitle")}</h2>
              <p className="mt-1 text-xs text-muted">{t("hostGuests.approvalsDrawerSubtitle")}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-start">
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-muted">{t("hostGuests.noPendingRequests")}</p>
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
            <div className="border-t border-border-gold px-5 py-4">
              <button
                type="button"
                onClick={() => setApprovalsOpen(false)}
                className="btn-outline-gold w-full rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  );
}
