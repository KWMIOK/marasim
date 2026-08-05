"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import {
  listHostReceptionStaff,
  regenerateHostEmergencyPasscode,
  resetHostReceptionStaffSessions,
  revokeHostReceptionStaffMember,
  type HostReceptionStaffMember,
} from "@/lib/actions/reception-staff-auth";
import {
  getHostInvitation,
  getReceptionSessionToken,
  hasReceptionEmployeeLink,
  saveHostInvitation,
  type HostInvitation,
} from "@/lib/invitations/host-invitations";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";

export function HostReceptionStaffContent({ invitationId }: { invitationId: string }) {
  const { t } = useTranslation();
  const [invitation, setInvitation] = useState<HostInvitation | null>(null);
  const [staff, setStaff] = useState<HostReceptionStaffMember[]>([]);
  const [staffLimit, setStaffLimit] = useState(0);
  const [emergencyPasscode, setEmergencyPasscode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const receptionToken = invitation ? getReceptionSessionToken(invitation) : null;

  const loadStaff = useCallback(async () => {
    if (!receptionToken) return;

    const result = await listHostReceptionStaff(receptionToken);
    if (!result.success) {
      setError(t("hostStaff.forbidden"));
      return;
    }

    setStaff(result.staff);
    setStaffLimit(result.staffLimit);
    setError(null);
  }, [receptionToken, t]);

  useEffect(() => {
    const saved = getHostInvitation(invitationId);
    setInvitation(saved);
    setEmergencyPasscode(saved?.emergencyPasscode ?? null);

    if (!saved) {
      setLoading(false);
      setError(t("hostStaff.invitationNotFound"));
      return;
    }

    if (!hasReceptionEmployeeLink(saved)) {
      setLoading(false);
      setError(t("hostStaff.publicEventUnavailable"));
      return;
    }

    void loadStaff().finally(() => setLoading(false));
  }, [invitationId, loadStaff, t]);

  async function handleRevoke(staffId: string) {
    setBusy(staffId);
    await revokeHostReceptionStaffMember(staffId);
    await loadStaff();
    setBusy(null);
  }

  async function handleResetSessions() {
    if (!receptionToken) return;
    setBusy("reset");
    await resetHostReceptionStaffSessions(receptionToken);
    await loadStaff();
    setBusy(null);
  }

  async function handleRegeneratePin() {
    if (!receptionToken) return;
    setBusy("pin");
    const result = await regenerateHostEmergencyPasscode(receptionToken);
    setBusy(null);
    if (result.success) {
      setEmergencyPasscode(result.passcode);
      if (invitation) {
        saveHostInvitation({ ...invitation, emergencyPasscode: result.passcode });
      }
    }
  }

  if (loading) {
    return (
      <AppPageShell className="pt-10">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!invitation || !receptionToken) {
    return (
      <AppPageShell className="pt-10">
        <p className="text-sm text-muted">{error ?? t("hostStaff.invitationNotFound")}</p>
        <Link href={ROUTES.profile} className="btn-outline-gold mt-4 inline-flex rounded-xl px-4 py-2 text-sm">
          {t("hostStaff.backToProfile")}
        </Link>
      </AppPageShell>
    );
  }

  const activeStaff = staff.filter((member) => !member.revokedAt);

  return (
    <AppPageShell className="pb-10 pt-8">
      <header>
        <Link href={ROUTES.profile} className="text-xs text-gold-muted underline underline-offset-2">
          {t("hostStaff.backToProfile")}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-gold-light">{t("hostStaff.title")}</h1>
        <p className="mt-2 text-sm text-muted">{invitation.eventDisplayName}</p>
      </header>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <section className="surface-card mt-6 rounded-2xl p-5 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold text-gold-light">{t("hostStaff.quotaTitle")}</h2>
        <p className="mt-2 text-sm text-muted">
          {staffLimit === 0
            ? t("hostStaff.quotaUnlimited", { active: String(activeStaff.length) })
            : t("hostStaff.quotaLimited", {
                active: String(activeStaff.length),
                limit: String(staffLimit),
              })}
        </p>
      </section>

      <section className="surface-card mt-4 rounded-2xl p-5 shadow-lg shadow-black/20">
        <h2 className="text-sm font-semibold text-gold-light">{t("hostStaff.emergencyPinTitle")}</h2>
        <p className="mt-2 text-xs text-muted">{t("hostStaff.emergencyPinDescription")}</p>
        {emergencyPasscode ? (
          <p dir="ltr" className="mt-3 font-mono text-2xl tracking-[0.4em] text-gold-light">
            {emergencyPasscode}
          </p>
        ) : (
          <p className="mt-3 text-sm text-gold-muted">{t("hostStaff.emergencyPinHidden")}</p>
        )}
        <button
          type="button"
          onClick={() => void handleRegeneratePin()}
          disabled={busy === "pin"}
          className="btn-outline-gold mt-4 rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-50"
        >
          {busy === "pin" ? t("common.loading") : t("hostStaff.regeneratePin")}
        </button>
      </section>

      <section className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gold-light">{t("hostStaff.registeredStaff")}</h2>
          <button
            type="button"
            onClick={() => void handleResetSessions()}
            disabled={busy === "reset"}
            className="rounded-xl border border-border-gold px-3 py-1.5 text-xs text-gold-light disabled:opacity-50"
          >
            {busy === "reset" ? t("common.loading") : t("hostStaff.resetAllSessions")}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {staff.length === 0 ? (
            <p className="text-sm text-muted">{t("hostStaff.noStaff")}</p>
          ) : (
            staff.map((member) => (
              <div
                key={member.id}
                className="surface-card flex items-start justify-between gap-3 rounded-xl p-4 shadow-lg shadow-black/20"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gold-light">{member.fullName}</p>
                  <p dir="ltr" className="mt-1 text-xs text-muted">
                    {member.phone}
                  </p>
                  <p className="mt-1 text-xs text-gold-muted">
                    {member.revokedAt
                      ? t("hostStaff.statusRevoked")
                      : t("hostStaff.statusActive", { sessions: String(member.activeSessions) })}
                  </p>
                </div>
                {!member.revokedAt ? (
                  <button
                    type="button"
                    onClick={() => void handleRevoke(member.id)}
                    disabled={busy === member.id}
                    className="shrink-0 rounded-xl border border-red-500/40 px-3 py-1.5 text-xs text-red-300 disabled:opacity-50"
                  >
                    {busy === member.id ? t("common.loading") : t("hostStaff.revoke")}
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </AppPageShell>
  );
}
