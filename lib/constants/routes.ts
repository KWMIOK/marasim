export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/login?mode=signup",
  occasions: "/occasions",
  create: "/create",
  orders: "/orders",
  profile: "/profile",
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

export const BOTTOM_NAV_ROUTES = [
  ROUTES.home,
  ROUTES.occasions,
  ROUTES.create,
  ROUTES.orders,
  ROUTES.profile,
] as const;

export const PUBLIC_ROUTES = ["/", "/login", "/occasions", "/create", "/orders", "/profile", "/e"] as const;
export const ADMIN_ROUTES_PREFIX = "/admin";
export const HOST_ROUTES_PREFIX = "/dashboard";
export const SCANNER_ROUTE = "/scanner";
