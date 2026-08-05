"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppHeader } from "@/components/shared/app-header";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

function AdminNav() {
  const { t } = useTranslation();

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href={ROUTES.admin.root} className="nav-link">
        {t("admin.nav.dashboard")}
      </Link>
      <Link href={ROUTES.admin.events} className="nav-link">
        {t("admin.nav.events")}
      </Link>
      <Link href={ROUTES.admin.settings} className="nav-link">
        {t("admin.nav.settings")}
      </Link>
      <Link href={ROUTES.admin.catalog} className="nav-link">
        {t("admin.nav.catalog")}
      </Link>
    </nav>
  );
}

export function AdminLayoutClient({
  children,
  subtitle,
}: {
  children: ReactNode;
  subtitle?: string | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-full">
      <AppHeader
        title={t("admin.panel")}
        subtitle={subtitle ?? t("common.superAdmin")}
        actions={
          <>
            <AdminNav />
            <SignOutButton />
          </>
        }
      />
      <main>{children}</main>
    </div>
  );
}
