"use client";

import { useEffect, useState } from "react";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { InAppBrowserPrompt } from "@/components/reception/in-app-browser-prompt";
import { ReceptionStaffRegistrationForm } from "@/components/reception/reception-staff-registration-form";
import {
  checkReceptionStaffAccess,
  type ReceptionStaffAccess,
} from "@/lib/actions/reception-staff";
import {
  buildStaffSessionStorageValue,
  parseStaffSessionStorageValue,
  RECEPTION_STAFF_SESSION_STORAGE_KEY,
} from "@/lib/reception/staff-session";
import { useTranslation } from "@/hooks/use-locale";

function readStoredSessionToken(receptionToken: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = parseStaffSessionStorageValue(
      localStorage.getItem(RECEPTION_STAFF_SESSION_STORAGE_KEY)
    );
    if (!parsed || parsed.receptionToken !== receptionToken) return null;
    return parsed.sessionToken;
  } catch {
    return null;
  }
}

export function saveStaffSessionToStorage(receptionToken: string, sessionToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    RECEPTION_STAFF_SESSION_STORAGE_KEY,
    buildStaffSessionStorageValue(receptionToken, sessionToken)
  );
}

export function ReceptionAccessGate({
  receptionToken,
  children,
}: {
  receptionToken: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [access, setAccess] = useState<ReceptionStaffAccess | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshAccess() {
    setLoading(true);
    const sessionToken = readStoredSessionToken(receptionToken);
    const result = await checkReceptionStaffAccess(receptionToken, sessionToken);
    setAccess(result);
    setLoading(false);
  }

  useEffect(() => {
    void refreshAccess();
  }, [receptionToken]);

  if (loading || !access) {
    return (
      <AppPageShell className="min-h-screen pt-10">
        <p className="text-sm text-muted">{t("common.loading")}</p>
      </AppPageShell>
    );
  }

  if (access.status === "invalid") {
    return (
      <AppPageShell className="min-h-screen pt-10">
        <p className="text-sm text-muted">{t("reception.notFoundDescription")}</p>
      </AppPageShell>
    );
  }

  if (access.status === "needs_registration") {
    return (
      <ReceptionStaffRegistrationForm
        receptionToken={receptionToken}
        slotsRemaining={access.slotsRemaining}
        staffLimit={access.staffLimit}
        onRegistered={() => void refreshAccess()}
      />
    );
  }

  return children;
}
