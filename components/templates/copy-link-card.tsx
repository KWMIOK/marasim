"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function CopyLinkCard({
  label,
  description,
  url,
  icon,
  notice,
  shareHref,
}: {
  label: string;
  description: string;
  url: string;
  icon: ReactNode;
  notice?: ReactNode;
  shareHref?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-gold-light">{label}</h2>
      </div>
      <p className="mt-2 text-xs text-muted">{description}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          aria-label={label}
          className="min-w-0 flex-1 rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-xs text-gold-light outline-none"
        />
        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[7.5rem]">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium",
              copied ? "btn-outline-gold" : "btn-gold"
            )}
          >
            {copied ? t("hostSuccess.copied") : t("hostSuccess.copy")}
          </button>
          {shareHref ? (
            <Link
              href={shareHref}
              className="btn-outline-gold flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              {t("hostSuccess.share")}
            </Link>
          ) : null}
        </div>
      </div>
      {notice ? <div className="mt-3">{notice}</div> : null}
    </div>
  );
}
