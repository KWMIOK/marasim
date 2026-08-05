"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const ADMIN_NAV_ITEMS = [
  { href: ROUTES.admin.root, labelKey: "admin.nav.dashboard" as const, match: (path: string) => path === ROUTES.admin.root },
  {
    href: ROUTES.admin.events,
    labelKey: "admin.nav.events" as const,
    match: (path: string) => path.startsWith(ROUTES.admin.events),
  },
  {
    href: ROUTES.admin.settings,
    labelKey: "admin.nav.settings" as const,
    match: (path: string) => path === ROUTES.admin.settings,
  },
  {
    href: ROUTES.admin.catalog,
    labelKey: "admin.nav.catalog" as const,
    match: (path: string) => path === ROUTES.admin.catalog,
  },
  {
    href: ROUTES.admin.pricing,
    labelKey: "admin.nav.pricing" as const,
    match: (path: string) => path === ROUTES.admin.pricing,
  },
] as const;

export function AdminPanelNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("admin.nav.label")}
      className={cn("mx-auto w-full max-w-lg px-6 pt-4", className)}
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-border-gold-strong bg-surface text-gold-light"
                  : "border-border-gold text-muted hover:border-border-gold-strong hover:text-gold-light"
              )}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
