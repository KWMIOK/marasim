export type InAppBrowserKind = "whatsapp" | "instagram" | "facebook" | "messenger" | "tiktok" | "other";

export function detectInAppBrowser(userAgent: string): InAppBrowserKind | null {
  const ua = userAgent.toLowerCase();

  if (ua.includes("whatsapp")) return "whatsapp";
  if (ua.includes("instagram")) return "instagram";
  if (ua.includes("fbav") || ua.includes("fban")) return "facebook";
  if (ua.includes("messenger")) return "messenger";
  if (ua.includes("tiktok")) return "tiktok";

  return null;
}

export function isLikelyInAppBrowser(userAgent: string): boolean {
  return detectInAppBrowser(userAgent) !== null;
}
