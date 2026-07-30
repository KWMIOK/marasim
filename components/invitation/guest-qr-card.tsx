"use client";

import { useEffect, useState } from "react";
import { buildGuestQrPayload } from "@/lib/qr/payload";
import { generateGuestQrDataUrl } from "@/lib/qr/generate";
import { useTranslation } from "@/hooks/use-locale";

export function GuestQrCard({
  guestToken,
  guestName,
  invitationNumber,
  compact = false,
}: {
  guestToken: string;
  guestName: string;
  invitationNumber?: string | null;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQr() {
      try {
        const url = await generateGuestQrDataUrl(buildGuestQrPayload(guestToken));
        if (!cancelled) {
          setDataUrl(url);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    void loadQr();

    return () => {
      cancelled = true;
    };
  }, [guestToken]);

  return (
    <div
      className={
        compact
          ? "flex flex-col items-center text-center"
          : "surface-card rounded-2xl p-6 shadow-lg shadow-black/20"
      }
    >
      {!compact ? (
        <>
          <p className="text-sm font-medium text-gold-light">{t("invitation.guestQrTitle")}</p>
          <p className="mt-1 text-xs text-muted">{t("invitation.guestQrHint")}</p>
        </>
      ) : null}

      <div className="mt-4 rounded-2xl border border-border-gold bg-black/40 p-4">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={t("invitation.guestQrAlt", { name: guestName })}
            className="mx-auto h-48 w-48"
          />
        ) : error ? (
          <p className="px-4 py-10 text-sm text-muted">{t("invitation.guestQrError")}</p>
        ) : (
          <p className="px-4 py-10 text-sm text-muted">{t("common.loading")}</p>
        )}
      </div>

      {!compact && invitationNumber ? (
        <p className="mt-3 text-xs text-gold-muted">{invitationNumber}</p>
      ) : null}
    </div>
  );
}
