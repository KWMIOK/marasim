"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/use-locale";
import { isOccasionsNavActive, useOccasionsNavHref } from "@/hooks/use-occasion-flow";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: ROUTES.home, labelKey: "bottomNav.home" as const, dynamic: false },
  { href: ROUTES.occasions, labelKey: "bottomNav.occasions" as const, dynamic: true },
  { href: ROUTES.create, labelKey: "bottomNav.create" as const, dynamic: false },
  { href: ROUTES.orders, labelKey: "bottomNav.orders" as const, dynamic: false },
  { href: ROUTES.profile, labelKey: "bottomNav.profile" as const, dynamic: false },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const occasionsHref = useOccasionsNavHref();

  return (
    <nav
      dir="ltr"
      aria-label={t("bottomNav.label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-gold bg-surface/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {NAV_ITEMS.map((item) => {
          const href = item.dynamic ? occasionsHref : item.href;
          const active = item.dynamic ? isOccasionsNavActive(pathname) : pathname === item.href;

          return (
            <Link
              key={item.labelKey}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-2 text-center text-xs transition",
                active ? "text-gold-light" : "text-muted hover:text-gold-light"
              )}
            >
              <span className="truncate font-medium leading-tight">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
