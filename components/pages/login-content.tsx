"use client";

import { Suspense } from "react";
import Link from "next/link";
import { SocialLogin } from "@/components/auth/social-login";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function LoginContent() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-full items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href={ROUTES.home} className="text-sm font-semibold text-rose-600">
          {t("common.appName")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{t("auth.signInTitle")}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t("auth.signInSubtitle")}</p>

        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-zinc-400">{t("common.loading")}</p>}>
            <SocialLogin />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
