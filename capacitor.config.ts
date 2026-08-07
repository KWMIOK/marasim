import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Next.js runs on a server — the APK loads it via `server.url`.
 *
 * USB dev (phone via cable, PC runs `npm run dev`):
 *   npm run cap:sync:usb
 *
 * Wi‑Fi dev (same LAN):
 *   npm run cap:apk:dev
 *
 * Standalone APK (no PC required):
 *   npm run cap:apk:prod
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "http://127.0.0.1:3000";

const config: CapacitorConfig = {
  appId: "com.marasim.app",
  appName: "Marasim",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: serverUrl.startsWith("https://") ? "https" : "http",
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2500,
      backgroundColor: "#1a1a2e",
      showSpinner: true,
      spinnerColor: "#c9a227",
    },
  },
};

export default config;
