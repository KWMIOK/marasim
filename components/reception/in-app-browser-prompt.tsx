"use client";

import { useEffect, useState } from "react";
import { detectInAppBrowser } from "@/lib/reception/in-app-browser";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

export function InAppBrowserPrompt({ onContinueAnyway }: { onContinueAnyway?: () => void }) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ReturnType<typeof detectInAppBrowser>>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setKind(detectInAppBrowser(navigator.userAgent));
  }, []);

  if (!kind || dismissed) return null;

  const appLabel = t(`reception.inAppBrowserApps.${kind}` as TranslationKey);

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <h2 className="text-sm font-semibold text-amber-100">{t("reception.inAppBrowserTitle")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
        {t("reception.inAppBrowserDescription", { app: appLabel })}
      </p>
      <ol className="mt-3 list-decimal space-y-1 ps-5 text-xs text-amber-100/80">
        <li>{t("reception.inAppBrowserStep1")}</li>
        <li>{t("reception.inAppBrowserStep2")}</li>
      </ol>
      {onContinueAnyway ? (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onContinueAnyway();
          }}
          className="mt-4 text-xs text-amber-200 underline underline-offset-2"
        >
          {t("reception.inAppBrowserContinue")}
        </button>
      ) : null}
    </div>
  );
}
