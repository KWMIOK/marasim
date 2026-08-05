"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-locale";
import {
  getNavSectionBackTarget,
  getNavSectionRoot,
} from "@/lib/navigation/nav-back";

function pathOnly(pathname: string): string {
  return pathname.split("?")[0]?.split("#")[0] ?? pathname;
}

export function AppBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  function handleBack() {
    const sectionTarget = getNavSectionBackTarget(pathname);
    const destination = sectionTarget ?? getNavSectionRoot(pathname);
    const currentPath = pathOnly(pathname);
    const search =
      typeof window !== "undefined" && sectionTarget?.startsWith("/templates/")
        ? window.location.search
        : "";
    const fullDestination = search ? `${destination}${search}` : destination;

    if (pathOnly(fullDestination) === currentPath) {
      return;
    }

    router.push(fullDestination);
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
