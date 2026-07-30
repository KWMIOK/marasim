"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import {
  buildInvitationSuccessPath,
  getHostInvitations,
  type HostInvitation,
} from "@/lib/invitations/host-invitations";
import { migrateStuckSuccessFlowToHostInvitations } from "@/lib/invitations/migrate-stuck-flow";
import { ensureReceptionSessionForInvitation } from "@/lib/actions/reception";
import { formatReceptionEventDate } from "@/lib/reception/session";
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
    <Link
      href={buildInvitationSuccessPath(invitation)}
      className="surface-card block rounded-2xl p-4 shadow-lg shadow-black/20 transition hover:border-border-gold-strong"
    >
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
  );
}

export function ProfilePageContent() {
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

      <section className="surface-card mt-8 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-gold-light">{t("profile.languageTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("profile.languageSubtitle")}</p>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </section>
    </AppPageShell>
  );
}
