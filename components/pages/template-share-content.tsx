"use client";

import { AppPageShell } from "@/components/shared/app-page-shell";
import { ShareOptionCard } from "@/components/invitations/share-option-card";
import { useHostInvitationQuery } from "@/hooks/use-host-invitation-query";
import { buildInvitationShareMethodPath } from "@/lib/invitations/host-invitations";
import { useTranslation } from "@/hooks/use-locale";

function ManualIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function ContactsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
    </svg>
  );
}

function PublicLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function TemplateShareContent({ templateId }: { templateId: string }) {
  const { t } = useTranslation();
  const { invitation, hydrated } = useHostInvitationQuery(templateId);

  if (!hydrated || !invitation) {
    return (
      <AppPageShell className="pb-8">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  const options = [
    {
      method: "manual" as const,
      icon: <ManualIcon />,
      title: t("hostShare.manualTitle"),
      description: t("hostShare.manualDescription"),
    },
    {
      method: "contacts" as const,
      icon: <ContactsIcon />,
      title: t("hostShare.contactsTitle"),
      description: t("hostShare.contactsDescription"),
    },
    {
      method: "import" as const,
      icon: <ImportIcon />,
      title: t("hostShare.importTitle"),
      description: t("hostShare.importDescription"),
    },
    {
      method: "public-link" as const,
      icon: <PublicLinkIcon />,
      title: t("hostShare.publicLinkTitle"),
      description: t("hostShare.publicLinkDescription"),
    },
  ];

  return (
    <AppPageShell className="pb-8">
      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("hostShare.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("hostShare.subtitle")}</p>
      </header>

      <div className="mt-8 space-y-3">
        {options.map((option) => (
          <ShareOptionCard
            key={option.method}
            href={buildInvitationShareMethodPath(invitation, option.method)}
            icon={option.icon}
            title={option.title}
            description={option.description}
          />
        ))}
      </div>
    </AppPageShell>
  );
}
