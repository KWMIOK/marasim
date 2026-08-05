"use client";

import { signOut } from "@/lib/auth/actions";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const { t } = useTranslation();

  return (
    <form action={signOut}>
      <button
        type="submit"
        className={cn("btn-outline-gold rounded-lg px-3 py-1.5 text-sm", className)}
      >
        {t("nav.signOut")}
      </button>
    </form>
  );
}
