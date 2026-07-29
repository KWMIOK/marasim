"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SocialLogin } from "@/components/auth/social-login";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

function AuthPanel() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const isSignup = searchParams.get("mode") === "signup";

  return (
    <>
      <Link href={ROUTES.home} className="text-sm font-semibold text-gold hover:text-gold-light">
        {t("common.appName")}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-gold-light">
        {isSignup ? t("auth.signUpTitle") : t("auth.signInTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
      </p>

      <div className="mt-6">
        <SocialLogin />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? t("auth.alreadyHaveAccount") : t("auth.needAccount")}{" "}
        <Link
          href={isSignup ? ROUTES.login : ROUTES.signup}
          className="text-gold-light underline underline-offset-4"
        >
          {isSignup ? t("auth.signInLink") : t("auth.signUpLink")}
        </Link>
      </p>
    </>
  );
}

export function LoginContent() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="surface-card w-full max-w-md rounded-2xl p-8 shadow-xl shadow-black/30">
        <Suspense fallback={<p className="text-sm text-gold-muted">…</p>}>
          <AuthPanel />
        </Suspense>
      </div>
    </main>
  );
}
