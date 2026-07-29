"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatKuwaitMobileInput, isValidKuwaitMobile } from "@/lib/phone/kuwait";
import { useTranslation } from "@/hooks/use-locale";
import { getAuthCallbackUrl } from "@/lib/utils/app-origin";
import { ROUTES } from "@/lib/constants/routes";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function KuwaitFlag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 16"
      role="img"
      aria-label="Kuwait"
    >
      <path d="M0 0 L9 3.2 L9 12.8 L0 16 Z" fill="#000000" />
      <rect x="9" y="0" width="15" height="5.333" fill="#007A3D" />
      <rect x="9" y="5.333" width="15" height="5.334" fill="#FFFFFF" />
      <rect x="9" y="10.667" width="15" height="5.333" fill="#CE1126" />
    </svg>
  );
}

export function AuthForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const errorParam = searchParams.get("error");
  const isSignup = searchParams.get("mode") === "signup";

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "auth_callback_failed" ? t("auth.signInFailed") : null
  );
  const [loading, setLoading] = useState<"google" | null>(null);

  const phoneValid = isValidKuwaitMobile(phone);

  async function signInWithGoogle() {
    setError(null);
    setLoading("google");

    const supabase = createClient();
    const callbackUrl = getAuthCallbackUrl(undefined, redirectTo);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(null);
    }
  }

  function handleSendVerificationCode() {
    if (!phoneValid) return;
    setError(null);
    // SMS OTP flow will be wired to Supabase in a follow-up step.
  }

  return (
    <div className="w-full max-w-lg">
      <h1 className="text-center text-2xl font-semibold text-gold-light sm:text-3xl">
        {isSignup ? t("auth.signUpTitle") : t("auth.signInTitle")}
      </h1>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading !== null}
          className="btn-auth-dark flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {loading === "google" ? t("auth.redirectingGoogle") : t("auth.continueGoogle")}
        </button>

        <button
          type="button"
          disabled
          className="btn-auth-dark flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-medium opacity-60"
        >
          <AppleIcon />
          {t("auth.continueApple")}
        </button>
      </div>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border-gold" />
        <span className="text-xs font-medium uppercase tracking-widest text-gold-muted">
          {t("auth.orDivider")}
        </span>
        <div className="h-px flex-1 bg-border-gold" />
      </div>

      <div
        dir="ltr"
        className="overflow-hidden rounded-2xl border border-border-gold bg-surface"
      >
        <div className="flex flex-row">
          <span className="flex shrink-0 items-center gap-2 border-r border-border-gold px-4 py-4 text-sm font-medium text-gold-light">
            <KuwaitFlag className="h-4 w-6 shrink-0 rounded-sm shadow-sm" />
            +965
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(formatKuwaitMobileInput(e.target.value))}
            placeholder="5XXXXXXX"
            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-gold-light outline-none placeholder:text-gold-muted"
            aria-label={t("auth.phonePlaceholder")}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSendVerificationCode}
        disabled={!phoneValid}
        className="btn-auth-dark mt-4 w-full rounded-2xl px-6 py-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t("auth.sendVerificationCode")}
      </button>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm text-muted">
        {isSignup ? t("auth.alreadyHaveAccount") : t("auth.needAccount")}{" "}
        <Link
          href={isSignup ? ROUTES.login : ROUTES.signup}
          className="text-gold-light underline underline-offset-4"
        >
          {isSignup ? t("auth.signInLink") : t("auth.signUpLink")}
        </Link>
      </p>
    </div>
  );
}
