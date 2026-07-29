"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: ROUTES.home, labelKey: "bottomNav.home" as const },
  { href: ROUTES.occasions, labelKey: "bottomNav.occasions" as const },
  { href: ROUTES.create, labelKey: "bottomNav.create" as const },
  { href: ROUTES.orders, labelKey: "bottomNav.orders" as const },
  { href: ROUTES.profile, labelKey: "bottomNav.profile" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      dir="ltr"
      aria-label={t("bottomNav.label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-gold bg-surface/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
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
