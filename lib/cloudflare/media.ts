export const CLOUDFLARE_R2_PUBLIC_URL =
  process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";

export const CLOUDFLARE_IMAGES_URL = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH
  ? `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}`
  : "";

export const CLOUDFLARE_STREAM_CUSTOMER_CODE =
  process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE ?? "";

export function getStreamEmbedUrl(videoId: string): string {
  return `https://customer-${CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/iframe`;
}

export function resolveMediaUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${CLOUDFLARE_R2_PUBLIC_URL}${path}`;
  }
  return `${CLOUDFLARE_R2_PUBLIC_URL}/${path}`;
}
