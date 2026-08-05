"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { CopyLinkCard } from "@/components/templates/copy-link-card";
import { getHostInvitation, hasReceptionEmployeeLink, buildInvitationSharePath } from "@/lib/invitations/host-invitations";
import { ensureReceptionSessionForInvitation } from "@/lib/actions/reception";
import type { GeneratedInvitationLinks } from "@/lib/invitations/generate-links";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";

function SuccessIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-8 w-8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

function GuestLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ReceptionistLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path d="M4 7h16M4 12h10M4 17h14" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function TemplateSuccessContent({ templateId }: { templateId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<GeneratedInvitationLinks | null>(null);
  const [receptionStaffCount, setReceptionStaffCount] = useState(0);
  const [emergencyPasscode, setEmergencyPasscode] = useState<string | null>(null);
  const [showReceptionEmployeeLink, setShowReceptionEmployeeLink] = useState(false);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [shareHref, setShareHref] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = searchParams.get("invitation");
    const savedInvitation = id ? getHostInvitation(id) : null;

    if (savedInvitation && savedInvitation.templateId === templateId) {
      void ensureReceptionSessionForInvitation({
        eventDisplayName: savedInvitation.eventDisplayName,
        eventDate: savedInvitation.eventDate,
        occasion: savedInvitation.occasion,
        guestUrl: savedInvitation.guestUrl,
        receptionistUrl: savedInvitation.receptionistUrl,
        receptionSessionToken: savedInvitation.receptionSessionToken,
        guestQrEnabled: savedInvitation.guestQrEnabled,
        receptionStaffCount: savedInvitation.receptionStaffCount,
        locationName: savedInvitation.location,
        locationDirections: savedInvitation.locationDirections,
        mapsLat: savedInvitation.mapsLat,
        mapsLng: savedInvitation.mapsLng,
        mapsUrl: savedInvitation.mapsUrl,
        eventLogoUrl: savedInvitation.eventLogoUrl,
      });

      setLinks({
        eventSlug: "",
        guestToken: "",
        receptionistToken: "",
        guestUrl: savedInvitation.guestUrl,
        receptionistUrl: savedInvitation.receptionistUrl,
      });
      setReceptionStaffCount(savedInvitation.receptionStaffCount);
      setEmergencyPasscode(savedInvitation.emergencyPasscode);
      setShowReceptionEmployeeLink(hasReceptionEmployeeLink(savedInvitation));
      setInvitationId(id);
      setShareHref(buildInvitationSharePath(savedInvitation));
      setHydrated(true);
      return;
    }

    router.replace(ROUTES.profile);
  }, [router, searchParams, templateId]);

  if (!hydrated || !links) {
    return (
      <AppPageShell className="pb-8">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell className="pb-8">
      <header className="space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
          <SuccessIcon />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gold-light">{t("hostSuccess.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("hostSuccess.subtitle")}</p>
        </div>
      </header>

      <div className="mt-8 space-y-4">
        <CopyLinkCard
          label={t("hostSuccess.guestLinkTitle")}
          description={t("hostSuccess.guestLinkDescription")}
          url={links.guestUrl}
          icon={<GuestLinkIcon />}
          shareHref={shareHref ?? undefined}
        />
        {showReceptionEmployeeLink ? (
          <CopyLinkCard
            label={t("hostSuccess.receptionistLinkTitle")}
            description={t("hostSuccess.receptionistLinkDescription")}
            url={links.receptionistUrl}
            icon={<ReceptionistLinkIcon />}
            notice={
              receptionStaffCount > 0 ? (
                <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100/90">
                  {t("hostSuccess.receptionistStaffLimitNotice", {
                    count: String(receptionStaffCount),
                  })}
                </p>
              ) : undefined
            }
          />
        ) : null}
      </div>

      {showReceptionEmployeeLink && emergencyPasscode ? (
        <div className="surface-card mt-6 rounded-2xl p-5 shadow-lg shadow-black/20">
          <h2 className="text-sm font-semibold text-gold-light">{t("hostSuccess.emergencyPinTitle")}</h2>
          <p className="mt-2 text-xs text-muted">{t("hostSuccess.emergencyPinDescription")}</p>
          <p dir="ltr" className="mt-3 font-mono text-2xl tracking-[0.4em] text-gold-light">
            {emergencyPasscode}
          </p>
        </div>
      ) : null}

      {showReceptionEmployeeLink && invitationId ? (
        <>
          <Link
            href={ROUTES.profileInvitationVendors(invitationId)}
            className="btn-outline-gold mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
          >
            {t("hostSuccess.manageVendors")}
          </Link>
          <Link
            href={ROUTES.profileInvitationStaff(invitationId)}
            className="btn-outline-gold mt-3 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
          >
            {t("hostSuccess.manageReceptionStaff")}
          </Link>
        </>
      ) : null}

      <p className="mt-6 text-xs text-gold-muted">{t("hostSuccess.invitationPending")}</p>

      {invitationId ? (
        <Link
          href={ROUTES.profileInvitationGuests(invitationId)}
          className="btn-outline-gold mt-6 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
        >
          {t("hostSuccess.viewGuests")}
        </Link>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href={ROUTES.profile}
          className="btn-outline-gold flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
        >
          {t("profile.myInvitations")}
        </Link>
        <Link
          href={ROUTES.occasions}
          className="btn-gold flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
        >
          {t("hostSuccess.createAnother")}
        </Link>
      </div>
    </AppPageShell>
  );
}
