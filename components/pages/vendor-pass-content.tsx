"use client";

import { useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { VendorMasterQrCard } from "@/components/vendors/vendor-master-qr-card";
import { getVendorMasterPass } from "@/lib/actions/vendors";
import type { VendorMasterPass } from "@/lib/vendors/team";
import { buildVendorPassUrl } from "@/lib/vendors/team";
import { formatReceptionEventDate } from "@/lib/reception/session";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";

const RULE_KEYS = [
  "ruleArrival",
  "ruleQr",
  "ruleHeadcount",
  "ruleTempExit",
  "ruleReturn",
  "ruleLimit",
] as const;

export function VendorPassContent({ masterToken }: { masterToken: string }) {
  const { t, locale } = useTranslation();
  const [pass, setPass] = useState<VendorMasterPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    void getVendorMasterPass(masterToken).then((data) => {
      setPass(data);
      setLoading(false);
    });
  }, [masterToken]);

  async function handleShare() {
    const passUrl = buildVendorPassUrl(masterToken, window.location.origin);
    const title = pass?.teamName ?? t("vendorPass.shareTitle");
    const text = t("vendorPass.shareText", {
      eventName: pass?.eventDisplayName ?? "",
      passLink: passUrl,
    });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: passUrl });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy hint
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${passUrl}`);
      setShareMessage(t("vendorPass.shareCopied"));
    } catch {
      setShareMessage(t("vendorPass.shareUnsupported"));
    }
  }

  if (loading) {
    return (
      <AppPageShell className="min-h-screen pb-10 pt-8">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!pass) {
    return (
      <AppPageShell className="min-h-screen pb-10 pt-8">
        <h1 className="text-xl font-semibold text-gold-light">{t("vendorPass.notFoundTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("vendorPass.notFoundDescription")}</p>
      </AppPageShell>
    );
  }

  const formattedDate = formatReceptionEventDate(pass.eventDate, locale);

  return (
    <AppPageShell className="min-h-screen pb-10 pt-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-wide text-gold-muted">{t("vendorPass.badge")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-gold-light">{pass.eventDisplayName}</h1>
        <p className="mt-2 text-sm text-muted">
          {formattedDate ?? t("reception.datePending")}
        </p>
      </header>

      <section className="surface-card mt-6 rounded-2xl p-5 text-center shadow-lg shadow-black/20">
        <p className="text-lg font-semibold text-gold-light">{pass.teamName}</p>
        <p className="mt-2 text-sm text-muted">
          {t(`vendors.types.${pass.vendorType}` as TranslationKey)}
        </p>
        <p className="mt-4 text-sm text-gold-muted">
          {t("vendorPass.allowedHeadcount", { count: String(pass.allowedHeadcount) })}
        </p>
      </section>

      <div className="mt-6">
        <VendorMasterQrCard masterToken={pass.masterToken} />
      </div>

      <button
        type="button"
        onClick={() => void handleShare()}
        className="btn-gold mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium"
      >
        {t("vendorPass.sharePass")}
      </button>

      {shareMessage ? (
        <p className="mt-2 text-center text-xs text-gold-muted">{shareMessage}</p>
      ) : null}

      <section className="surface-card mt-8 rounded-2xl p-5 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold text-gold-light">{t("vendorPass.rulesTitle")}</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-muted">
          {RULE_KEYS.map((key) => (
            <li key={key} className="flex gap-2 text-start">
              <span className="text-gold" aria-hidden>
                •
              </span>
              <span>{t(`vendorPass.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>
    </AppPageShell>
  );
}
