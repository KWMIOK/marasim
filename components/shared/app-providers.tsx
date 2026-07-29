"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/shared/bottom-nav";
import { PublicLanguageToggle } from "@/components/shared/public-language-toggle";
import { BOTTOM_NAV_ROUTES, ROUTES } from "@/lib/constants/routes";

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showBottomNav = BOTTOM_NAV_ROUTES.includes(
    pathname as (typeof BOTTOM_NAV_ROUTES)[number]
  );
  const showPublicLanguageToggle =
    pathname === ROUTES.home || pathname === ROUTES.login;

  return (
    <>
      {showPublicLanguageToggle ? <PublicLanguageToggle /> : null}
      <div className={showBottomNav ? "min-h-full pb-20" : "min-h-full"}>{children}</div>
      {showBottomNav ? <BottomNav /> : null}
    </>
  );
}
