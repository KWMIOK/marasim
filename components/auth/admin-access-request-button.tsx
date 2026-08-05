"use client";

import { useState } from "react";
import { requestAdminAccess } from "@/lib/actions/admin-access-request";
import { useTranslation } from "@/hooks/use-locale";

type AdminAccessRequestButtonProps = {
  phone?: string;
  variant?: "inline" | "full";
  onRequestAdminOAuth?: () => void;
  oauthPending?: boolean;
};

export function AdminAccessRequestButton({
  phone,
  variant = "inline",
  onRequestAdminOAuth,
  oauthPending = false,
}: AdminAccessRequestButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [oauthHint, setOauthHint] = useState(false);

  async function handleDirectRequest() {
    setLoading(true);
    setFeedback(null);

    const result = await requestAdminAccess(phone ? { phone } : undefined);

    if (result.success) {
      setFeedback(t("auth.adminAccessRequestSent"));
    } else if (result.error === "missing_contact") {
      setFeedback(t("auth.adminAccessRequestNeedContact"));
    } else {
      setFeedback(t("auth.adminAccessRequestFailed"));
    }

    setLoading(false);
  }

  function handleSignupFlow() {
    setFeedback(null);

    if (phone) {
      void handleDirectRequest();
      return;
    }

    if (onRequestAdminOAuth) {
      setOauthHint(true);
      onRequestAdminOAuth();
      return;
    }

    setFeedback(t("auth.adminAccessRequestNeedContact"));
  }

  return (
    <div className={variant === "full" ? "space-y-2" : "mt-4 text-center"}>
      <button
        type="button"
        onClick={handleSignupFlow}
        disabled={loading || oauthPending}
        className={
          variant === "full"
            ? "btn-outline-gold w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
            : "text-xs text-gold-muted underline underline-offset-4 transition hover:text-gold-light disabled:opacity-50"
        }
      >
        {loading || oauthPending
          ? t("auth.adminAccessRequestSending")
          : t("auth.adminAccessRequest")}
      </button>

      {oauthHint ? (
        <p className="text-xs text-muted">{t("auth.adminAccessRequestOAuthHint")}</p>
      ) : null}

      {feedback ? (
        <p className="text-xs text-gold" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
