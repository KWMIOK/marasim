/**
 * Resolves the current app origin for auth callbacks and invitation links.
 * Client: always uses the browser origin so localhost vs production is automatic.
 * Server: prefers request headers, then NEXT_PUBLIC_APP_URL.
 */
export function getAppOriginFromRequest(request?: Request): string {
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`;
    }

    const host = request.headers.get("host");
    if (host) {
      const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
      return `${proto}://${host}`;
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getAuthCallbackUrl(request?: Request, nextPath?: string | null): string {
  const url = new URL("/auth/callback", getAppOriginFromRequest(request));

  if (nextPath?.startsWith("/")) {
    url.searchParams.set("next", nextPath);
  }

  return url.toString();
}
