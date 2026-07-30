"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { ReceptionBackLink } from "@/components/reception/reception-back-link";
import { ReceptionGuestAvatar } from "@/components/reception/reception-guest-avatar";
import { ReceptionGuestSearchField } from "@/components/reception/reception-guest-search-field";
import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { ROUTES } from "@/lib/constants/routes";
import {
  getGuestStatusDisplay,
  guestStatusToneClasses,
  matchesGuestListFilter,
  matchesGuestSearch,
  type ReceptionGuestListFilter,
  type ReceptionGuestSummary,
} from "@/lib/reception/guest";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const FILTERS: ReceptionGuestListFilter[] = [
  "all",
  "not_arrived",
  "arrived",
  "confirmed",
];

function GuestListRow({
  receptionToken,
  guest,
}: {
  receptionToken: string;
  guest: ReceptionGuestSummary;
}) {
  const { t } = useTranslation();
  const status = getGuestStatusDisplay(guest);

  return (
    <Link
      href={ROUTES.receptionGuest(receptionToken, guest.guestToken)}
      className="surface-card flex items-center gap-3 rounded-2xl p-4 shadow-lg shadow-black/20 transition hover:border-border-gold-strong"
    >
      <ReceptionGuestAvatar name={guest.name} avatarUrl={guest.avatarUrl} size="md" />
      <div className="min-w-0 flex-1 text-start">
        <p className="truncate text-sm font-semibold text-gold-light">{guest.name}</p>
        <p className="mt-0.5 text-xs text-muted">{guest.invitationNumber}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium leading-tight sm:text-xs",
          guestStatusToneClasses[status.tone]
        )}
      >
        {t(status.labelKey as TranslationKey)}
      </span>
    </Link>
  );
}

export function ReceptionGuestsListContent() {
  const { t } = useTranslation();
  const { receptionToken, guests } = useReceptionSync();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReceptionGuestListFilter>("all");

  const filteredGuests = useMemo(() => {
    return guests.filter(
      (guest) => matchesGuestListFilter(guest, filter) && matchesGuestSearch(guest, query)
    );
  }, [guests, filter, query]);

  const filterLabelKey: Record<ReceptionGuestListFilter, TranslationKey> = {
    all: "reception.filterAll",
    not_arrived: "reception.filterNotArrived",
    arrived: "reception.filterArrived",
    confirmed: "reception.filterConfirmed",
  };

  return (
    <>
      <AppPageShell className="min-h-screen pb-28 pt-8">
        <ReceptionBackLink
          receptionToken={receptionToken}
          label={t("reception.backToHome")}
        />

        <header>
          <h1 className="text-2xl font-semibold text-gold-light">{t("reception.showGuestsList")}</h1>
        </header>

        <div className="mt-6">
          <ReceptionGuestSearchField
            value={query}
            onChange={setQuery}
            placeholder={t("reception.searchPlaceholder")}
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-xl px-1 py-2.5 text-[10px] font-medium leading-tight transition sm:text-xs",
                  active
                    ? "btn-gold"
                    : "border border-border-gold bg-surface text-muted hover:text-gold-light"
                )}
              >
                {t(filterLabelKey[item])}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {filteredGuests.length > 0 ? (
            filteredGuests.map((guest) => (
              <GuestListRow key={guest.guestToken} receptionToken={receptionToken} guest={guest} />
            ))
          ) : (
            <div className="surface-card rounded-2xl p-5 shadow-lg shadow-black/20">
              <p className="text-sm text-muted">{t("reception.noGuestsFound")}</p>
            </div>
          )}
        </div>
      </AppPageShell>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-gold bg-surface/95 backdrop-blur-md">
        <div className="mx-auto max-w-lg px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            href={ROUTES.receptionReport(receptionToken)}
            className="btn-outline-gold flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-medium"
          >
            {t("reception.issueReport")}
          </Link>
        </div>
      </div>
    </>
  );
}
