"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

import { registerNativeOAuthListeners } from "@/lib/auth/google-oauth";

const SPLASH_FALLBACK_MS = 8000;

/** Hides the native splash once the WebView has mounted (with a timeout fallback). */
export function CapacitorShellInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    registerNativeOAuthListeners();

    let cancelled = false;

    async function hideSplash() {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      if (!cancelled) {
        await SplashScreen.hide();
      }
    }

    void hideSplash();

    const timeout = window.setTimeout(() => {
      void hideSplash();
    }, SPLASH_FALLBACK_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
