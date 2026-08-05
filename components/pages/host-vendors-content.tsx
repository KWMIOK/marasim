"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { InvitationDetailField, InvitationDetailInput } from "@/components/templates/selected-template-form";
import {
  createHostVendorTeam,
  listHostVendorTeams,
  revokeHostVendorTeam,
} from "@/lib/actions/vendors";
import {
  getHostInvitation,
  getReceptionSessionToken,
  hasReceptionEmployeeLink,
} from "@/lib/invitations/host-invitations";
import { VENDOR_TYPES, clampVendorHeadcount, type VendorTypeId } from "@/lib/vendors/constants";
import {
  buildVendorPassUrl,
  buildVendorWhatsAppLink,
  type VendorTeamSummary,
} from "@/lib/vendors/team";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

function VendorTypeBadge({ vendorType }: { vendorType: string }) {
  const { t } = useTranslation();
  const labelKey = `vendors.types.${vendorType}` as TranslationKey;

  return (
    <span className="rounded-full border border-border-gold bg-surface px-2.5 py-0.5 text-[11px] text-gold-light">
      {t(labelKey)}
    </span>
  );
}

function HeadcountProgress({
  checkedIn,
  allowed,
}: {
  checkedIn: number;
  allowed: number;
}) {
  const progress = allowed > 0 ? Math.min(100, (checkedIn / allowed) * 100) : 0;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {checkedIn} / {allowed}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export function HostVendorsContent({ invitationId }: { invitationId: string }) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<VendorTeamSummary[]>([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [totalAllowed, setTotalAllowed] = useState(0);
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);
  const [eventName, setEventName] = useState("");
  const [receptionToken, setReceptionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [vendorType, setVendorType] = useState<VendorTypeId>("photography");
  const [leadPhone, setLeadPhone] = useState("");
  const [allowedHeadcount, setAllowedHeadcount] = useState("6");
  const [formError, setFormError] = useState<string | null>(null);

  const loadTeams = useCallback(async (token: string) => {
    const result = await listHostVendorTeams(token);
    if (!result.success) {
      setError(t("vendors.host.forbidden"));
      return;
    }

    setTeams(result.teams);
    setTotalTeams(result.totalTeams);
    setTotalAllowed(result.totalAllowed);
    setTotalCheckedIn(result.totalCheckedIn);
    setError(null);
  }, [t]);

  useEffect(() => {
    const invitation = getHostInvitation(invitationId);
    const token = invitation ? getReceptionSessionToken(invitation) : null;

    if (!invitation || !token) {
      setLoading(false);
      setError(t("vendors.host.invitationNotFound"));
      return;
    }

    if (!hasReceptionEmployeeLink(invitation)) {
      setLoading(false);
      setError(t("vendors.host.privateEventRequired"));
      return;
    }

    setEventName(invitation.eventDisplayName);
    setReceptionToken(token);
    void loadTeams(token).finally(() => setLoading(false));
  }, [invitationId, loadTeams, t]);

  async function handleCreateTeam(event: React.FormEvent) {
    event.preventDefault();
    if (!receptionToken || busy) return;

    setFormError(null);
    setBusy("create");

    const result = await createHostVendorTeam({
      receptionToken,
      teamName,
      vendorType,
      leadPhone,
      allowedHeadcount: clampVendorHeadcount(allowedHeadcount),
    });

    setBusy(null);

    if (!result.success) {
      setFormError(t("vendors.host.createFailed"));
      return;
    }

    setTeamName("");
    setLeadPhone("");
    setAllowedHeadcount("6");
    setVendorType("photography");
    setFormOpen(false);
    await loadTeams(receptionToken);
  }

  async function handleRevoke(teamId: string) {
    if (!receptionToken) return;
    setBusy(teamId);
    await revokeHostVendorTeam(teamId);
    await loadTeams(receptionToken);
    setBusy(null);
  }

  function handleWhatsApp(team: VendorTeamSummary) {
    const passUrl = buildVendorPassUrl(team.masterToken, window.location.origin);
    const message = t("vendors.host.whatsappMessage", {
      teamName: team.teamName,
      passLink: passUrl,
    });
    const link = buildVendorWhatsAppLink(team.leadPhone, message);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <AppPageShell className="pt-10">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (!receptionToken) {
    return (
      <AppPageShell className="pt-10">
        <p className="text-sm text-muted">{error ?? t("vendors.host.invitationNotFound")}</p>
        <Link href={ROUTES.profile} className="btn-outline-gold mt-4 inline-flex rounded-xl px-4 py-2 text-sm">
          {t("vendors.host.backToProfile")}
        </Link>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell className="pb-10 pt-8">
      <header>
        <Link href={ROUTES.profile} className="text-xs text-gold-muted underline underline-offset-2">
          {t("vendors.host.backToProfile")}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-gold-light">{t("vendors.host.title")}</h1>
        <p className="mt-2 text-sm text-muted">{eventName}</p>
      </header>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-xs text-muted">{t("vendors.host.metricTeams")}</p>
          <p className="mt-1 text-2xl font-semibold text-gold-light">{totalTeams}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20">
          <p className="text-xs text-muted">{t("vendors.host.metricCheckedIn")}</p>
          <p className="mt-1 text-2xl font-semibold text-gold-light">
            {totalCheckedIn}
            <span className="text-base text-muted"> / {totalAllowed}</span>
          </p>
        </div>
      </div>

      <section className="mt-6">
        <button
          type="button"
          onClick={() => setFormOpen((current) => !current)}
          className="btn-gold w-full rounded-xl px-4 py-3 text-sm font-medium"
        >
          {formOpen ? t("vendors.host.hideForm") : t("vendors.host.addTeam")}
        </button>

        {formOpen ? (
          <form onSubmit={(event) => void handleCreateTeam(event)} className="surface-card mt-3 space-y-3 rounded-2xl p-4 shadow-lg shadow-black/20">
            <InvitationDetailField label={t("vendors.host.teamName")} htmlFor="vendorTeamName">
              <InvitationDetailInput
                id="vendorTeamName"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder={t("vendors.host.teamNamePlaceholder")}
                required
              />
            </InvitationDetailField>

            <InvitationDetailField label={t("vendors.host.vendorType")} htmlFor="vendorType">
              <select
                id="vendorType"
                value={vendorType}
                onChange={(event) => setVendorType(event.target.value as VendorTypeId)}
                className="w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light outline-none focus:ring-2 focus:ring-gold/40"
              >
                {VENDOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`vendors.types.${type}` as TranslationKey)}
                  </option>
                ))}
              </select>
            </InvitationDetailField>

            <InvitationDetailField label={t("vendors.host.leadPhone")} htmlFor="leadPhone">
              <InvitationDetailInput
                id="leadPhone"
                type="tel"
                dir="ltr"
                value={leadPhone}
                onChange={(event) => setLeadPhone(event.target.value)}
                placeholder={t("vendors.host.leadPhonePlaceholder")}
                required
              />
            </InvitationDetailField>

            <InvitationDetailField label={t("vendors.host.allowedHeadcount")} htmlFor="allowedHeadcount">
              <InvitationDetailInput
                id="allowedHeadcount"
                type="number"
                min={1}
                max={500}
                inputMode="numeric"
                value={allowedHeadcount}
                onChange={(event) => setAllowedHeadcount(event.target.value)}
                required
              />
            </InvitationDetailField>

            {formError ? (
              <p className="text-sm text-red-400" role="alert">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy === "create"}
              className="btn-outline-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              {busy === "create" ? t("common.loading") : t("vendors.host.createTeam")}
            </button>
          </form>
        ) : null}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gold-light">{t("vendors.host.registeredTeams")}</h2>
        <div className="mt-3 space-y-3">
          {teams.length === 0 ? (
            <p className="text-sm text-muted">{t("vendors.host.noTeams")}</p>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="surface-card rounded-2xl p-4 shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gold-light">{team.teamName}</p>
                    <div className="mt-2">
                      <VendorTypeBadge vendorType={team.vendorType} />
                    </div>
                    <p dir="ltr" className="mt-2 text-xs text-muted">
                      {team.leadPhone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(team)}
                    className={cn(
                      "shrink-0 rounded-xl border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300"
                    )}
                  >
                    {t("vendors.host.whatsapp")}
                  </button>
                </div>

                <HeadcountProgress
                  checkedIn={team.checkedInCount}
                  allowed={team.allowedHeadcount}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={ROUTES.vendorPass(team.masterToken)}
                    target="_blank"
                    className="rounded-xl border border-border-gold px-3 py-1.5 text-xs text-gold-light"
                  >
                    {t("vendors.host.viewPass")}
                  </Link>
                  <button
                    type="button"
                    disabled={busy === team.id}
                    onClick={() => void handleRevoke(team.id)}
                    className="rounded-xl border border-red-500/40 px-3 py-1.5 text-xs text-red-300 disabled:opacity-50"
                  >
                    {busy === team.id ? t("common.loading") : t("vendors.host.revoke")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppPageShell>
  );
}
