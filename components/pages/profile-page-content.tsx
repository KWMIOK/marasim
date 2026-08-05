"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminAccessRequestButton } from "@/components/auth/admin-access-request-button";
import {
  buildInvitationSuccessPath,
  getHostInvitations,
  hasReceptionEmployeeLink,
  type HostInvitation,
} from "@/lib/invitations/host-invitations";
import { migrateStuckSuccessFlowToHostInvitations } from "@/lib/invitations/migrate-stuck-flow";
import { ensureReceptionSessionForInvitation } from "@/lib/actions/reception";
import { formatReceptionEventDate } from "@/lib/reception/session";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";

function InvitationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function InvitationCard({ invitation }: { invitation: HostInvitation }) {
  const { t, locale } = useTranslation();
  const formattedDate = formatReceptionEventDate(invitation.eventDate, locale);

  return (
    <div className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
      <Link href={buildInvitationSuccessPath(invitation)} className="block transition hover:opacity-90">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
            <InvitationIcon />
          </span>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-sm font-semibold text-gold-light">{invitation.eventDisplayName}</p>
            {formattedDate ? (
              <p className="mt-1 text-xs text-muted">{formattedDate}</p>
            ) : (
              <p className="mt-1 text-xs text-gold-muted">{t("reception.datePending")}</p>
            )}
            <p className="mt-2 text-xs text-gold">{t("profile.viewInvitationLinks")}</p>
          </div>
        </div>
      </Link>
      {hasReceptionEmployeeLink(invitation) ? (
        <>
          <Link
            href={ROUTES.profileInvitationVendors(invitation.id)}
            className="btn-outline-gold mt-3 flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-medium"
          >
            {t("profile.manageVendors")}
          </Link>
          <Link
            href={ROUTES.profileInvitationStaff(invitation.id)}
            className="btn-outline-gold mt-2 flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-medium"
          >
            {t("profile.manageReceptionStaff")}
          </Link>
        </>
      ) : null}
      <Link
        href={ROUTES.profileInvitationGuests(invitation.id)}
        className="btn-outline-gold mt-3 flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-medium"
      >
        {t("hostSuccess.viewGuests")}
      </Link>
    </div>
  );
}

function AdminPanelLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card block rounded-xl px-4 py-3 text-sm font-medium text-gold-light transition hover:border-border-gold-strong"
    >
      {label}
    </Link>
  );
}

export function ProfilePageContent({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<HostInvitation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    migrateStuckSuccessFlowToHostInvitations();
    const items = getHostInvitations();

    items.forEach((invitation) => {
      void ensureReceptionSessionForInvitation({
        eventDisplayName: invitation.eventDisplayName,
        eventDate: invitation.eventDate,
        occasion: invitation.occasion,
        guestUrl: invitation.guestUrl,
        receptionistUrl: invitation.receptionistUrl,
        receptionSessionToken: invitation.receptionSessionToken,
        guestQrEnabled: invitation.guestQrEnabled,
        receptionStaffCount: invitation.receptionStaffCount,
        locationName: invitation.location,
        locationDirections: invitation.locationDirections,
        mapsLat: invitation.mapsLat,
        mapsLng: invitation.mapsLng,
        mapsUrl: invitation.mapsUrl,
        eventLogoUrl: invitation.eventLogoUrl,
      });
    });

    setInvitations(items);
    setHydrated(true);
  }, []);

  return (
    <AppPageShell className="pt-10">
      <h1 className="text-2xl font-semibold text-gold-light">{t("bottomNav.profile")}</h1>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-gold-light">{t("profile.myInvitations")}</h2>
        <p className="mt-1 text-sm text-muted">{t("profile.myInvitationsSubtitle")}</p>

        <div className="mt-4 space-y-3">
          {!hydrated ? (
            <p className="text-sm text-muted">{t("common.loading")}</p>
          ) : invitations.length > 0 ? (
            invitations.map((invitation) => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))
          ) : (
            <div className="surface-card rounded-2xl p-5 shadow-lg shadow-black/20">
              <p className="text-sm text-muted">{t("profile.noInvitations")}</p>
            </div>
          )}
        </div>
      </section>

      {isSuperAdmin ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gold-light">{t("profile.adminPanelTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("profile.adminPanelSubtitle")}</p>

          <div className="mt-4 grid gap-2">
            <AdminPanelLink href={ROUTES.admin.root} label={t("admin.nav.dashboard")} />
            <AdminPanelLink href={ROUTES.admin.events} label={t("admin.nav.events")} />
            <AdminPanelLink href={ROUTES.admin.newEvent} label={t("admin.nav.createEvent")} />
            <AdminPanelLink href={ROUTES.admin.settings} label={t("admin.nav.settings")} />
            <AdminPanelLink href={ROUTES.admin.catalog} label={t("admin.nav.catalog")} />
          </div>
        </section>
      ) : null}

      {!isSuperAdmin ? (
        <section className="surface-card mt-8 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-gold-light">{t("profile.adminAccessTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("profile.adminAccessSubtitle")}</p>
          <AdminAccessRequestButton variant="full" />
        </section>
      ) : null}

      <section className="surface-card mt-8 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-gold-light">{t("profile.languageTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("profile.languageSubtitle")}</p>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </section>

      <section className="surface-card mt-8 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-gold-light">{t("profile.accountTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("profile.signOutSubtitle")}</p>
        <div className="mt-4">
          <SignOutButton className="w-full rounded-xl px-4 py-3 text-sm font-medium" />
        </div>
      </section>
    </AppPageShell>
  );
}
