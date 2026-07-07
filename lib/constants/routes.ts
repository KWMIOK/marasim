export const ROUTES = {
  home: "/",
  login: "/login",
  admin: {
    root: "/admin",
    events: "/admin/events",
    newEvent: "/admin/events/new",
    event: (id: string) => `/admin/events/${id}`,
    settings: "/admin/settings",
    catalog: "/admin/catalog",
  },
  host: {
    dashboard: (eventId: string) => `/dashboard/${eventId}`,
  },
  invitation: (slug: string, token: string) => `/e/${slug}/${token}`,
  scanner: "/scanner",
} as const;

export const PUBLIC_ROUTES = ["/", "/login", "/e"] as const;
export const ADMIN_ROUTES_PREFIX = "/admin";
export const HOST_ROUTES_PREFIX = "/dashboard";
export const SCANNER_ROUTE = "/scanner";
