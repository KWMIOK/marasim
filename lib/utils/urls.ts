import { getAppOriginFromRequest } from "@/lib/utils/app-origin";

export function getGuestInvitationUrl(slug: string, token: string, request?: Request): string {
  const base = getAppOriginFromRequest(request);
  return `${base}/e/${slug}/${token}`;
}

export function getWhatsAppLink(
  phone: string,
  message: string
): string {
  const normalized = phone.replace(/\D/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
