"use client";

import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import { finalizeOAuthSignIn } from "@/lib/actions/auth-oauth";
import { getAuthCallbackUrl } from "@/lib/utils/app-origin";

export const NATIVE_AUTH_CALLBACK = "com.marasim.app://auth/callback";

type PendingOAuth = {
  resolve: (destination: string) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

let pendingOAuth: PendingOAuth | null = null;
let listenersRegistered = false;

function buildNativeCallbackUrl(
  nextPath?: string | null,
  extraParams?: Record<string, string>
): string {
  const url = new URL(NATIVE_AUTH_CALLBACK);

  if (nextPath?.startsWith("/")) {
    url.searchParams.set("next", nextPath);
  }

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

function isNativeAuthCallback(url: string): boolean {
  return url.startsWith(NATIVE_AUTH_CALLBACK);
}

function clearPendingOAuth(error?: Error) {
  if (!pendingOAuth) return;

  window.clearTimeout(pendingOAuth.timeoutId);
  const current = pendingOAuth;
  pendingOAuth = null;

  if (error) {
    current.reject(error);
  }
}

async function handleNativeOAuthCallback(url: string) {
  if (!isNativeAuthCallback(url)) return;

  const { Browser } = await import("@capacitor/browser");

  try {
    await Browser.close();
  } catch {
    // Browser may already be closed.
  }

  const parsed = new URL(url);
  const code = parsed.searchParams.get("code");
  const oauthError =
    parsed.searchParams.get("error_description") ??
    parsed.searchParams.get("error");
  const nextPath = parsed.searchParams.get("next");
  const adminRequest = parsed.searchParams.get("admin_request") === "1";

  if (oauthError || !code) {
    clearPendingOAuth(new Error(oauthError ?? "auth_callback_failed"));
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    clearPendingOAuth(error);
    return;
  }

  const finalized = await finalizeOAuthSignIn({
    adminRequest,
    nextPath,
  });

  if (!finalized.success) {
    clearPendingOAuth(new Error(finalized.error));
    return;
  }

  const destination = finalized.destination;
  pendingOAuth?.resolve(destination);
  if (pendingOAuth) {
    window.clearTimeout(pendingOAuth.timeoutId);
    pendingOAuth = null;
  }

  window.location.replace(destination);
}

export function registerNativeOAuthListeners() {
  if (!Capacitor.isNativePlatform() || listenersRegistered) return;
  listenersRegistered = true;

  void import("@capacitor/app").then(({ App }) => {
    void App.addListener("appUrlOpen", (event) => {
      void handleNativeOAuthCallback(event.url);
    });

    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) {
        void handleNativeOAuthCallback(launch.url);
      }
    });
  });
}

export async function signInWithGoogle(input: {
  redirectTo?: string | null;
  extraParams?: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  registerNativeOAuthListeners();

  const supabase = createClient();
  const callbackUrl = Capacitor.isNativePlatform()
    ? buildNativeCallbackUrl(input.redirectTo, input.extraParams)
    : getAuthCallbackUrl(undefined, input.redirectTo, input.extraParams);

  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error || !data.url) {
      return { ok: false, error: error?.message ?? "oauth_start_failed" };
    }

    try {
      await new Promise<string>((resolve, reject) => {
        if (pendingOAuth) {
          clearPendingOAuth(new Error("oauth_in_progress"));
        }

        const timeoutId = window.setTimeout(() => {
          clearPendingOAuth(new Error("oauth_timeout"));
        }, 5 * 60 * 1000);

        pendingOAuth = { resolve, reject, timeoutId };

        void import("@capacitor/browser").then(({ Browser }) => {
          void Browser.open({ url: data.url });
        });
      });

      return { ok: true };
    } catch (oauthError) {
      const { Browser } = await import("@capacitor/browser");
      try {
        await Browser.close();
      } catch {
        // Ignore close errors after cancel/timeout.
      }

      return {
        ok: false,
        error: oauthError instanceof Error ? oauthError.message : "oauth_failed",
      };
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export function cancelNativeOAuth() {
  clearPendingOAuth(new Error("oauth_cancelled"));
}
