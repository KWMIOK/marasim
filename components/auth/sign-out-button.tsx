"use client";

import { signOut } from "@/lib/auth/actions";
import { useTranslation } from "@/hooks/use-locale";

export function SignOutButton() {
  const { t } = useTranslation();

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
      >
        {t("nav.signOut")}
      </button>
    </form>
  );
}
