"use client";

import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";
import { PageShell } from "@/components/shared/page-shell";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";
import type { EventCatalogs } from "@/types/events";
import type { Profile } from "@/types/database";

export function NewEventPageClient({
  hosts,
  currentUserId,
  catalogs,
}: {
  hosts: Pick<Profile, "id" | "full_name" | "role">[];
  currentUserId: string;
  catalogs: EventCatalogs;
}) {
  const { t } = useTranslation();

  return (
    <PageShell>
      <Link href={ROUTES.admin.events} className="text-sm text-muted hover:text-foreground">
        {t("admin.backToEvents")}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-gold-light">{t("admin.createEventTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("admin.createEventSubtitle")}</p>

      <div className="mt-8">
        <EventForm hosts={hosts} currentUserId={currentUserId} catalogs={catalogs} />
      </div>
    </PageShell>
  );
}
