"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppBackButton } from "@/components/shared/app-back-button";
import { BottomNav } from "@/components/shared/bottom-nav";
import { PublicLanguageToggle } from "@/components/shared/public-language-toggle";
import { showAppBackButton, showPublicLanguageToggle, usesAppShell } from "@/lib/constants/app-shell";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ToastProvider } from "@/components/shared/toast-provider";
import { cn } from "@/lib/utils/cn";

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthUser();
  const shell = usesAppShell(pathname);
  const showBack = showAppBackButton(pathname, isAuthenticated);

  return (
    <ToastProvider>
      {showPublicLanguageToggle(pathname, isAuthenticated) ? <PublicLanguageToggle /> : null}
      {showBack ? <AppBackButton /> : null}
      <div className={cn("min-h-full", shell && "pb-20", showBack && "pt-14")}>{children}</div>
      {shell ? <BottomNav /> : null}
    </ToastProvider>
  );
}
