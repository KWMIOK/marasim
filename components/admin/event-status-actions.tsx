"use client";

import { useRouter } from "next/navigation";
import { updateEventStatus } from "@/lib/actions/events";
import { useTranslation } from "@/hooks/use-locale";
import type { EventStatus } from "@/types/database";

export function EventStatusActions({
  eventId,
  status,
}: {
  eventId: string;
  status: EventStatus;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  async function setStatus(next: EventStatus) {
    await updateEventStatus(eventId, next);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" ? (
        <button
          type="button"
          onClick={() => setStatus("published")}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {t("admin.publishEvent")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStatus("draft")}
          className="rounded-lg border border-border-gold px-4 py-2 text-sm text-foreground hover:bg-transparent"
        >
          {t("admin.unpublish")}
        </button>
      )}
      {status !== "archived" ? (
        <button
          type="button"
          onClick={() => setStatus("archived")}
          className="rounded-lg border border-border-gold px-4 py-2 text-sm text-foreground hover:bg-transparent"
        >
          {t("admin.archive")}
        </button>
      ) : null}
    </div>
  );
}
