"use client";

import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

export function ReceptionSyncStatus({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { syncing, lastSyncedAt, syncNow } = useReceptionSync();

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <p className="text-xs text-muted">
        {syncing
          ? t("reception.syncing")
          : lastSyncedAt
            ? t("reception.lastSynced", {
                time: lastSyncedAt.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              })
            : t("reception.syncPending")}
      </p>
      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={syncing}
        className="rounded-xl border border-border-gold bg-surface px-4 py-2 text-xs font-medium text-gold-light disabled:opacity-60"
      >
        {t("reception.syncData")}
      </button>
    </div>
  );
}
