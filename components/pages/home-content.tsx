"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

export function HomeContent() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col justify-end px-6 pb-6 pt-16">
      <div className="mx-auto w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold leading-snug text-gold-light sm:text-4xl">
          <span className="block">{t("home.headline1")}</span>
          <span className="block">{t("home.headline2")}</span>
        </h1>

        <p className="mt-4 text-sm tracking-wide text-gold sm:text-base">
          Luxury Digital Invitation &amp; Event Platform
        </p>

        <div className="mt-6" aria-hidden="true" />

        <p className="text-base leading-relaxed text-muted sm:text-lg">
          <span className="block">{t("home.description1")}</span>
          <span className="block">{t("home.description2")}</span>
        </p>

        <Link
          href={ROUTES.signup}
          className="btn-gold mt-8 flex w-full flex-col items-center justify-center rounded-2xl px-6 py-4 text-center"
        >
          <span className="text-lg font-semibold leading-tight">{t("home.ctaArabic")}</span>
          <span className="mt-0.5 text-sm font-medium opacity-90">Get Started</span>
        </Link>

        <p className="mt-5 text-sm text-muted">
          {t("home.hasAccount")}{" "}
          <Link href={ROUTES.login} className="text-gold-light underline underline-offset-4">
            {t("home.signInLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
