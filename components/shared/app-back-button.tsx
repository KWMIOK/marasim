"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function AppBackButton({ fallbackHref = ROUTES.home }: { fallbackHref?: string }) {
  const router = useRouter();
  const { t } = useTranslation();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={t("common.back")}
      className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border-gold bg-surface-elevated text-gold-light shadow-lg shadow-black/30 transition hover:border-border-gold-strong hover:bg-surface"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
