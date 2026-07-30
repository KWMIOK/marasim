"use client";

import { RECEPTION_ENTRANCE_I18N_KEYS, RECEPTION_ENTRANCE_OPTIONS } from "@/lib/reception/entrance";
import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

export function ReceptionEntrancePicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { entrance, setEntrance } = useReceptionSync();

  return (
    <div className={cn("surface-card rounded-2xl p-4 shadow-lg shadow-black/20", className)}>
      <p className="text-xs text-muted">{t("reception.entranceLabel")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {RECEPTION_ENTRANCE_OPTIONS.map((option) => {
          const active = entrance === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setEntrance(option)}
              className={cn(
                "rounded-xl px-2 py-2.5 text-[11px] font-medium leading-tight transition sm:text-xs",
                active
                  ? "btn-gold"
                  : "border border-border-gold bg-surface text-muted hover:text-gold-light"
              )}
            >
              {t(RECEPTION_ENTRANCE_I18N_KEYS[option] as "reception.entrances.main")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
