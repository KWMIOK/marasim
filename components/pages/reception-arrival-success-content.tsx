"use client";

import Link from "next/link";
import { useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";

function ArrivalSuccessIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-10 w-10"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

export function ReceptionArrivalSuccessContent({
  receptionToken,
}: {
  receptionToken: string;
}) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handlePlaceholderAction() {
    setFeedback(t("common.comingSoon"));
  }

  return (
    <AppPageShell className="flex min-h-screen flex-col pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border-gold bg-surface text-gold">
          <ArrivalSuccessIcon />
        </div>

        <h1 className="mt-8 text-2xl font-semibold leading-snug text-gold-light">
          {t("reception.arrivalSuccessTitle")}
        </h1>

        <div className="mt-10 grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handlePlaceholderAction}
            className="btn-outline-gold rounded-xl px-3 py-3.5 text-sm font-medium"
          >
            {t("reception.printCard")}
          </button>
          <button
            type="button"
            onClick={handlePlaceholderAction}
            className="btn-outline-gold rounded-xl px-3 py-3.5 text-sm font-medium"
          >
            {t("reception.sendDigitalCard")}
          </button>
        </div>

        {feedback ? (
          <p className="mt-4 text-sm text-gold" role="status">
            {feedback}
          </p>
        ) : null}
      </div>

      <Link
        href={ROUTES.reception(receptionToken)}
        className="btn-gold mt-8 flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-medium"
      >
        {t("reception.backToMain")}
      </Link>
    </AppPageShell>
  );
}
