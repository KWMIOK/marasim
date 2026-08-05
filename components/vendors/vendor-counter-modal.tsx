"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adjustVendorCheckIn,
  checkInAllVendorRemaining,
  getVendorTeamForScan,
} from "@/lib/actions/vendors";
import type { VendorTeamForScan } from "@/lib/vendors/team";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export function VendorCounterModal({
  open,
  masterToken,
  onClose,
}: {
  open: boolean;
  masterToken: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [team, setTeam] = useState<VendorTeamForScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [limitWarning, setLimitWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    if (!masterToken) return;
    setLoading(true);
    setError(null);
    const data = await getVendorTeamForScan(masterToken);
    if (!data) {
      setError(t("vendors.scan.notFound"));
      setTeam(null);
    } else {
      setTeam(data);
    }
    setLoading(false);
  }, [masterToken, t]);

  useEffect(() => {
    if (open && masterToken) {
      void loadTeam();
      setLimitWarning(false);
    }
    if (!open) {
      setTeam(null);
      setLimitWarning(false);
      setError(null);
    }
  }, [open, masterToken, loadTeam]);

  async function handleAdjust(delta: number, actionKey: string) {
    if (!masterToken || !team) return;
    setBusy(actionKey);
    setLimitWarning(false);

    const result = await adjustVendorCheckIn(masterToken, delta);
    setBusy(null);

    if (!result.success) {
      if (result.error === "limit_exceeded") {
        setLimitWarning(true);
        return;
      }
      setError(t(`vendors.scan.errors.${result.error}` as TranslationKey));
      return;
    }

    setTeam({
      ...team,
      checkedInCount: result.checkedInCount,
      allowedHeadcount: result.allowedHeadcount,
    });
  }

  async function handleCheckInAll() {
    if (!masterToken || !team) return;
    setBusy("all");
    setLimitWarning(false);

    const result = await checkInAllVendorRemaining(masterToken);
    setBusy(null);

    if (!result.success) {
      setError(t("vendors.scan.actionFailed"));
      return;
    }

    setTeam({
      ...team,
      checkedInCount: result.checkedInCount,
      allowedHeadcount: result.allowedHeadcount,
    });
  }

  if (!open) return null;

  const remaining = team ? Math.max(team.allowedHeadcount - team.checkedInCount, 0) : 0;
  const progress = team && team.allowedHeadcount > 0
    ? Math.min(100, (team.checkedInCount / team.allowedHeadcount) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-counter-title"
        className="surface-card w-full max-w-md rounded-2xl p-5 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="vendor-counter-title" className="text-lg font-semibold text-gold-light">
              {t("vendors.scan.modalTitle")}
            </h2>
            {team ? (
              <p className="mt-1 text-sm text-muted">{team.teamName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-gold px-2 py-1 text-xs text-gold-muted"
          >
            {t("common.close")}
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted">{t("common.loading")}</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : team ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border-gold bg-surface px-3 py-1 text-xs text-gold-light">
                {t(`vendors.types.${team.vendorType}` as TranslationKey)}
              </span>
            </div>

            <div className="mt-5 text-center">
              <p className="text-3xl font-semibold tabular-nums text-gold-light">
                {team.checkedInCount}
                <span className="text-lg text-muted"> / {team.allowedHeadcount}</span>
              </p>
              <p className="mt-1 text-xs text-muted">{t("vendors.scan.checkedInLabel")}</p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {limitWarning ? (
              <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-200" role="alert">
                {t("vendors.scan.limitExceeded")}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={busy !== null || remaining <= 0}
                onClick={() => void handleAdjust(1, "plus")}
                className="btn-gold rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                {busy === "plus" ? t("common.loading") : t("vendors.scan.checkInOne")}
              </button>
              <button
                type="button"
                disabled={busy !== null || remaining <= 0}
                onClick={() => void handleCheckInAll()}
                className="btn-outline-gold rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                {busy === "all" ? t("common.loading") : t("vendors.scan.checkInAll")}
              </button>
              <button
                type="button"
                disabled={busy !== null || team.checkedInCount <= 0}
                onClick={() => void handleAdjust(-1, "minus")}
                className={cn(
                  "rounded-xl border border-border-gold px-4 py-3 text-sm font-medium text-gold-light disabled:opacity-50"
                )}
              >
                {busy === "minus" ? t("common.loading") : t("vendors.scan.tempExit")}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
