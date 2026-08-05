"use client";

import { useEffect, useState } from "react";
import { buildVendorQrPayload } from "@/lib/qr/payload";
import { generateVendorQrDataUrl } from "@/lib/qr/generate";
import { useTranslation } from "@/hooks/use-locale";

export function VendorMasterQrCard({ masterToken }: { masterToken: string }) {
  const { t } = useTranslation();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQr() {
      try {
        const url = await generateVendorQrDataUrl(buildVendorQrPayload(masterToken));
        if (!cancelled) {
          setDataUrl(url);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    void loadQr();
    return () => {
      cancelled = true;
    };
  }, [masterToken]);

  return (
    <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-lg">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-black">
        {t("vendorPass.qrTitle")}
      </p>
      <div className="mt-4 flex justify-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={t("vendorPass.qrAlt")}
            className="h-64 w-64 max-w-full"
          />
        ) : error ? (
          <p className="px-4 py-16 text-sm text-neutral-600">{t("vendorPass.qrError")}</p>
        ) : (
          <p className="px-4 py-16 text-sm text-neutral-500">{t("common.loading")}</p>
        )}
      </div>
    </div>
  );
}
