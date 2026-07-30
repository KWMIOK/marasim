"use client";

import Link from "next/link";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";

type HomeContentProps = {
  initialAuthenticated?: boolean;
};

export function HomeContent({ initialAuthenticated = false }: HomeContentProps) {
  const { t } = useTranslation();
  const { isAuthenticated: clientAuthenticated, loading } = useAuthUser();
  const isAuthenticated = initialAuthenticated || clientAuthenticated;

  if (!isAuthenticated && loading) {
    return (
      <AppPageShell className="pt-16">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (isAuthenticated) {
    return <AppPageShell className="pt-16">{null}</AppPageShell>;
  }

  return (
    <AppPageShell align="end" className="pt-16 text-center">
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
    </AppPageShell>
  );
}
