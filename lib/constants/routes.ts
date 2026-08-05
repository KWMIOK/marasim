export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/login?mode=signup",
  occasions: "/occasions",
  occasionCategory: (category: string) => `/occasions/${category}`,
  occasionsVipRequest: "/occasions/vip/request",
  create: "/create",
  templates: {
    browse: "/templates/browse",
    preview: (id: string) => `/templates/${id}/preview`,
    customize: (id: string) => `/templates/${id}/customize`,
    conditions: (id: string) => `/templates/${id}/conditions`,
    success: (id: string) => `/templates/${id}/success`,
    successShare: (id: string) => `/templates/${id}/success/share`,
    successShareMethod: (id: string, method: string) =>
      `/templates/${id}/success/share/${method}`,
  },
  orders: "/orders",
  profile: "/profile",
  profileInvitationStaff: (invitationId: string) => `/profile/invitations/${invitationId}/staff`,
  profileInvitationVendors: (invitationId: string) => `/profile/invitations/${invitationId}/vendors`,
  profileInvitationGuests: (invitationId: string) => `/profile/invitations/${invitationId}/guests`,
  publicRegistration: (token: string) => `/register/${token}`,
  vendorPass: (masterToken: string) => `/vendor-pass/${masterToken}`,
  admin: {
    root: "/admin",
    events: "/admin/events",
    newEvent: "/admin/events/new",
    event: (id: string) => `/admin/events/${id}`,
    settings: "/admin/settings",
    catalog: "/admin/catalog",
    pricing: "/admin/pricing",
  },
  host: {
    dashboard: (eventId: string) => `/dashboard/${eventId}`,
  },
  invitation: (slug: string, token: string) => `/e/${slug}/${token}`,
  reception: (token: string) => `/reception/${token}`,
  receptionRegister: (token: string) => `/reception/${token}/register`,
  receptionGuests: (token: string) => `/reception/${token}/guests`,
  receptionReport: (token: string) => `/reception/${token}/report`,
  receptionGuest: (token: string, guestToken: string) =>
    `/reception/${token}/guest/${guestToken}`,
  receptionGuestArrivalSuccess: (token: string, guestToken: string) =>
    `/reception/${token}/guest/${guestToken}/arrival-success`,
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
