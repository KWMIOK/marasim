"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { ReceptionBackLink } from "@/components/reception/reception-back-link";
import { ReceptionGuestAvatar } from "@/components/reception/reception-guest-avatar";
import { ReceptionGuestSearchField } from "@/components/reception/reception-guest-search-field";
import { QrScannerModal } from "@/components/scanner/qr-scanner-modal";
import { VendorCounterModal } from "@/components/vendors/vendor-counter-modal";
import { useReceptionSync } from "@/components/reception/reception-sync-provider";
import { ROUTES } from "@/lib/constants/routes";
import { parseGuestQrPayload, parseVendorQrPayload } from "@/lib/qr/payload";
import {
  getGuestStatusDisplay,
  guestStatusToneClasses,
  matchesGuestSearch,
  type ReceptionGuestSummary,
} from "@/lib/reception/guest";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

function QrScannerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-10 w-10" aria-hidden>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4zM14 18h2v2h-2z" />
    </svg>
  );
}

function GuestSearchDropdownItem({
  receptionToken,
  guest,
  onSelect,
}: {
  receptionToken: string;
  guest: ReceptionGuestSummary;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const status = getGuestStatusDisplay(guest);

  return (
    <li role="option">
      <Link
        href={ROUTES.receptionGuest(receptionToken, guest.guestToken)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
        className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface"
      >
        <ReceptionGuestAvatar name={guest.name} avatarUrl={guest.avatarUrl} size="md" />
        <div className="min-w-0 flex-1 text-start">
          <p className="truncate text-sm font-medium text-gold-light">{guest.name}</p>
          <p className="mt-0.5 text-xs text-muted">{guest.invitationNumber}</p>
          <p className={cn("mt-0.5 text-xs", guestStatusToneClasses[status.tone].split(" ").find(c => c.startsWith("text-")))}>
            {t(status.labelKey as TranslationKey)}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function ReceptionRegisterContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { receptionToken, guests } = useReceptionSync();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorMasterToken, setVendorMasterToken] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const showDropdown = open && trimmedQuery.length > 0;

  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    return guests.filter((guest) => matchesGuestSearch(guest, trimmedQuery));
  }, [guests, trimmedQuery]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  function handleQrScan(raw: string) {
    setScanError(null);

    const vendorToken = parseVendorQrPayload(raw);
    if (vendorToken) {
      setVendorMasterToken(vendorToken);
      setVendorModalOpen(true);
      return;
    }

    const guestToken = parseGuestQrPayload(raw);

    if (!guestToken) {
      setScanError(t("reception.qrInvalid"));
      return;
    }

    const guestExists = guests.some((guest) => guest.guestToken === guestToken);
    if (guests.length > 0 && !guestExists) {
      setScanError(t("reception.qrGuestNotFound"));
      return;
    }

    router.push(ROUTES.receptionGuest(receptionToken, guestToken));
  }

  return (
    <>
      <AppPageShell className="min-h-screen pb-10 pt-8">
        <ReceptionBackLink
          receptionToken={receptionToken}
          label={t("reception.backToHome")}
        />

        <header>
          <h1 className="text-2xl font-semibold text-gold-light">
            {t("reception.registerGuestArrival")}
          </h1>
        </header>

        <div ref={containerRef} className="relative mt-6">
          <ReceptionGuestSearchField
            value={query}
            onChange={(value) => {
              setQuery(value);
              setOpen(true);
            }}
            onFocus={() => {
              if (trimmedQuery) setOpen(true);
            }}
            placeholder={t("reception.searchPlaceholder")}
            ariaExpanded={showDropdown}
          />

          {showDropdown ? (
            <ul
              className="surface-card absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-border-gold py-2 shadow-xl shadow-black/40"
              role="listbox"
            >
              {results.length > 0 ? (
                results.map((guest) => (
                  <GuestSearchDropdownItem
                    key={guest.guestToken}
                    receptionToken={receptionToken}
                    guest={guest}
                    onSelect={() => setOpen(false)}
                  />
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-muted">{t("reception.noGuestsFound")}</li>
              )}
            </ul>
          ) : null}
        </div>

        <section className="mt-8">
          <button
            type="button"
            onClick={() => {
              setScanError(null);
              setScannerOpen(true);
            }}
            className="surface-card flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-gold px-6 py-10 text-center shadow-lg shadow-black/20 transition hover:border-border-gold-strong"
          >
            <span className="text-gold">
              <QrScannerIcon />
            </span>
            <p className="mt-4 text-sm font-medium text-gold-light">{t("reception.qrScannerTitle")}</p>
            <p className="mt-2 text-xs text-muted">{t("reception.qrScannerHint")}</p>
          </button>

          {scanError ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {scanError}
            </p>
          ) : null}
        </section>
      </AppPageShell>

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleQrScan}
      />

      <VendorCounterModal
        open={vendorModalOpen}
        masterToken={vendorMasterToken}
        onClose={() => {
          setVendorModalOpen(false);
          setVendorMasterToken(null);
        }}
      />
    </>
  );
}
