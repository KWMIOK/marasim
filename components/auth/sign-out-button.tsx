"use client";

import { signOut } from "@/lib/auth/actions";
import { useTranslation } from "@/hooks/use-locale";

export function SignOutButton() {
  const { t } = useTranslation();

  return (
    <form action={signOut}>
      <button type="submit" className="btn-outline-gold rounded-lg px-3 py-1.5 text-sm">
        {t("nav.signOut")}
      </button>
    </form>
  );
}
