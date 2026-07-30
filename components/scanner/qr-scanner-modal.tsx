"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

type QrScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
};

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const { t } = useTranslation();
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<InstanceType<
    typeof import("html5-qrcode").Html5Qrcode
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function startScanner() {
      setError(null);

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
            void stopScanner();
            onClose();
          },
          () => {
            // ignore scan miss frames
          }
        );
      } catch {
        if (!cancelled) {
          setError(t("reception.qrCameraError"));
        }
      }
    }

    async function stopScanner() {
      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (!scanner) return;

      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // scanner may already be stopped
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, onClose, onScan, regionId, t]);

  if (!open) return null;

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = manualValue.trim();
    if (!value) return;
    onScan(value);
    setManualValue("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="surface-card w-full max-w-lg rounded-2xl p-5 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gold-light">{t("reception.qrScannerTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("reception.qrScannerHint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-gold px-3 py-1.5 text-sm text-gold-light"
          >
            {t("common.close")}
          </button>
        </div>

        <div
          id={regionId}
          className={cn(
            "mt-4 overflow-hidden rounded-2xl border border-border-gold bg-black",
            error ? "hidden" : "min-h-[280px]"
          )}
        />

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
          <label className="block text-xs text-muted">{t("reception.qrManualEntry")}</label>
          <input
            type="text"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder={t("reception.qrManualPlaceholder")}
            className="surface-card w-full rounded-xl px-4 py-3 text-sm text-gold-light outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/40"
          />
          <button type="submit" className="btn-outline-gold w-full rounded-xl px-4 py-3 text-sm font-medium">
            {t("reception.qrManualSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
