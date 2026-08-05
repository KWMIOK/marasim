"use client";

import { useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { InAppBrowserPrompt } from "@/components/reception/in-app-browser-prompt";
import { isLikelyInAppBrowser } from "@/lib/reception/in-app-browser";
import { saveStaffSessionToStorage } from "@/components/reception/reception-access-gate";
import {
  loginReceptionStaffEmergency,
  sendReceptionStaffOtp,
  verifyReceptionStaffOtp,
} from "@/lib/actions/reception-staff-auth";
import { toE164KuwaitMobile } from "@/lib/phone/format-e164";
import { formatKuwaitMobileInput, isValidKuwaitMobile } from "@/lib/phone/kuwait";
import { useTranslation } from "@/hooks/use-locale";

type Step = "details" | "otp" | "emergency";

export function ReceptionStaffRegistrationForm({
  receptionToken,
  slotsRemaining,
  staffLimit,
  onRegistered,
}: {
  receptionToken: string;
  slotsRemaining: number | null;
  staffLimit: number;
  onRegistered: () => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [passcode, setPasscode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inAppDismissed, setInAppDismissed] = useState(false);
  const [inAppBlocked, setInAppBlocked] = useState(false);

  useEffect(() => {
    setInAppBlocked(isLikelyInAppBrowser(navigator.userAgent));
  }, []);

  const phoneValid = isValidKuwaitMobile(phone);
  const e164Phone = phoneValid ? toE164KuwaitMobile(phone) : null;

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!e164Phone || !fullName.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await sendReceptionStaffOtp({
      receptionToken,
      fullName: fullName.trim(),
      phone: e164Phone,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(
        result.error === "sms_failed"
          ? t("reception.staffOtpSmsFailed")
          : t("reception.staffRegistrationFailed")
      );
      return;
    }

    setDevCode(result.devCode ?? null);
    setStep("otp");
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!e164Phone || otp.trim().length !== 6 || submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await verifyReceptionStaffOtp({
      receptionToken,
      fullName: fullName.trim(),
      phone: e164Phone,
      code: otp.trim(),
    });

    setSubmitting(false);

    if (!result.success) {
      if (result.error === "staff_limit_reached") {
        setError(t("reception.staffLimitReached", { limit: String(staffLimit) }));
        return;
      }
      if (result.error === "invalid_otp") {
        setError(t("reception.staffOtpInvalid"));
        return;
      }
      setError(t("reception.staffRegistrationFailed"));
      return;
    }

    saveStaffSessionToStorage(receptionToken, result.sessionToken);
    onRegistered();
  }

  async function handleEmergencyLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!e164Phone || passcode.trim().length !== 6 || !fullName.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await loginReceptionStaffEmergency({
      receptionToken,
      passcode: passcode.trim(),
      fullName: fullName.trim(),
      phone: e164Phone,
    });

    setSubmitting(false);

    if (!result.success) {
      if (result.error === "invalid_passcode") {
        setError(t("reception.emergencyPasscodeInvalid"));
        return;
      }
      if (result.error === "staff_limit_reached") {
        setError(t("reception.staffLimitReached", { limit: String(staffLimit) }));
        return;
      }
      setError(t("reception.staffRegistrationFailed"));
      return;
    }

    saveStaffSessionToStorage(receptionToken, result.sessionToken);
    onRegistered();
  }

  return (
    <AppPageShell className="min-h-screen pb-10 pt-8">
      <InAppBrowserPrompt
        onContinueAnyway={inAppBlocked ? () => setInAppDismissed(true) : undefined}
      />

      <header>
        <h1 className="text-2xl font-semibold text-gold-light">{t("reception.staffRegistrationTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("reception.staffRegistrationSubtitle")}</p>
        {slotsRemaining !== null && slotsRemaining > 0 ? (
          <p className="mt-1 text-xs text-gold-muted">
            {t("reception.staffRegistrationSlots", { count: slotsRemaining })}
          </p>
        ) : null}
        {staffLimit > 0 && slotsRemaining === 0 ? (
          <p className="mt-1 text-xs text-gold-muted">{t("reception.staffRegistrationFullHint")}</p>
        ) : null}
      </header>

      {step === "details" ? (
        <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
          <div>
            <label htmlFor="staffFullName" className="block text-sm font-medium text-gold-light">
              {t("reception.staffFullName")}
            </label>
            <input
              id="staffFullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="surface-card mt-2 w-full rounded-xl px-4 py-3 text-sm text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="staffPhone" className="block text-sm font-medium text-gold-light">
              {t("reception.staffPhone")}
            </label>
            <div dir="ltr" className="surface-card mt-2 flex overflow-hidden rounded-xl border border-border-gold">
              <span className="flex shrink-0 items-center border-r border-border-gold px-3 text-sm text-gold-light">
                +965
              </span>
              <input
                id="staffPhone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) => setPhone(formatKuwaitMobileInput(event.target.value))}
                placeholder="5XXXXXXX"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-gold-light outline-none placeholder:text-gold-muted"
                autoComplete="tel-national"
                required
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={
              !fullName.trim() || !phoneValid || submitting || (inAppBlocked && !inAppDismissed)
            }
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? t("common.loading") : t("reception.staffSendOtp")}
          </button>

          <button
            type="button"
            onClick={() => setStep("emergency")}
            className="w-full text-center text-xs text-gold-muted underline underline-offset-2"
          >
            {t("reception.emergencyAccessLink")}
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
          <p className="text-sm text-muted">{t("reception.staffOtpSent", { phone: e164Phone ?? "" })}</p>
          {devCode ? (
            <p className="rounded-xl border border-border-gold bg-surface px-3 py-2 text-xs text-gold-muted">
              {t("reception.staffOtpDevHint", { code: devCode })}
            </p>
          ) : null}

          <div>
            <label htmlFor="staffOtp" className="block text-sm font-medium text-gold-light">
              {t("reception.staffOtpLabel")}
            </label>
            <input
              id="staffOtp"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              className="surface-card mt-2 w-full rounded-xl px-4 py-3 text-sm tracking-[0.3em] text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={otp.length !== 6 || submitting}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? t("common.loading") : t("reception.staffRegistrationSubmit")}
          </button>

          <button
            type="button"
            onClick={() => setStep("details")}
            className="w-full text-xs text-gold-muted underline underline-offset-2"
          >
            {t("common.back")}
          </button>
        </form>
      ) : null}

      {step === "emergency" ? (
        <form onSubmit={handleEmergencyLogin} className="mt-8 space-y-4">
          <p className="text-sm text-muted">{t("reception.emergencyAccessDescription")}</p>

          <div>
            <label htmlFor="emergencyFullName" className="block text-sm font-medium text-gold-light">
              {t("reception.staffFullName")}
            </label>
            <input
              id="emergencyFullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="surface-card mt-2 w-full rounded-xl px-4 py-3 text-sm text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
          </div>

          <div>
            <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gold-light">
              {t("reception.staffPhone")}
            </label>
            <div dir="ltr" className="surface-card mt-2 flex overflow-hidden rounded-xl border border-border-gold">
              <span className="flex shrink-0 items-center border-r border-border-gold px-3 text-sm text-gold-light">
                +965
              </span>
              <input
                id="emergencyPhone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) => setPhone(formatKuwaitMobileInput(event.target.value))}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-gold-light outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="emergencyPasscode" className="block text-sm font-medium text-gold-light">
              {t("reception.emergencyPasscodeLabel")}
            </label>
            <input
              id="emergencyPasscode"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              className="surface-card mt-2 w-full rounded-xl px-4 py-3 text-sm tracking-[0.3em] text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={!fullName.trim() || !phoneValid || passcode.length !== 6 || submitting}
            className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? t("common.loading") : t("reception.emergencyAccessSubmit")}
          </button>

          <button
            type="button"
            onClick={() => setStep("details")}
            className="w-full text-xs text-gold-muted underline underline-offset-2"
          >
            {t("reception.backToOtpRegistration")}
          </button>
        </form>
      ) : null}
    </AppPageShell>
  );
}
