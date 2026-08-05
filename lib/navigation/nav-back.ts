import {
  getOccasionFlow,
  isOccasionFlowPath,
  saveOccasionFlow,
  type OccasionFlowState,
} from "@/lib/flow/occasion-flow";
import { isEventCategory } from "@/lib/events/categories";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import { isBottomNavRoot } from "@/lib/constants/app-shell";
import {
  ADMIN_ROUTES_PREFIX,
  HOST_ROUTES_PREFIX,
  ROUTES,
} from "@/lib/constants/routes";

export type NavSection = "home" | "occasions" | "create" | "orders" | "profile" | "admin" | "host" | "other";

function pathOnly(pathname: string): string {
  return pathname.split("?")[0]?.split("#")[0] ?? pathname;
}

function browseQueryFromFlow(flow: OccasionFlowState | null): string {
  return buildTemplateBrowseQuery({
    category: flow?.category ?? null,
    occasion: flow?.occasion ?? null,
  });
}

export function getNavSection(pathname: string): NavSection {
  const path = pathOnly(pathname);

  if (path === ROUTES.home) return "home";
  if (path === ROUTES.create) return "create";
  if (path === ROUTES.orders) return "orders";
  if (path === ROUTES.profile || path.startsWith("/profile/")) return "profile";
  if (path.startsWith(ADMIN_ROUTES_PREFIX)) return "admin";
  if (path.startsWith(HOST_ROUTES_PREFIX)) return "host";
  if (isOccasionFlowPath(path)) return "occasions";
  return "other";
}

export function getNavSectionRoot(pathname: string): string {
  switch (getNavSection(pathname)) {
    case "occasions":
      return ROUTES.occasions;
    case "profile":
      return ROUTES.profile;
    case "admin":
      return ROUTES.admin.root;
    case "host":
      return ROUTES.profile;
    case "create":
      return ROUTES.create;
    case "orders":
      return ROUTES.orders;
    case "home":
      return ROUTES.home;
    default:
      return ROUTES.occasions;
  }
}

function getAdminBackPath(path: string): string | null {
  if (path === ROUTES.admin.root) {
    return ROUTES.profile;
  }

  if (path.match(/^\/admin\/events\/[^/]+$/)) {
    return ROUTES.admin.events;
  }

  if (path === ROUTES.admin.events || path === ROUTES.admin.newEvent) {
    return ROUTES.admin.root;
  }

  if (
    path === ROUTES.admin.settings ||
    path === ROUTES.admin.catalog ||
    path === ROUTES.admin.pricing
  ) {
    return ROUTES.admin.root;
  }

  return ROUTES.admin.root;
}

function getOccasionFlowBackPath(pathname: string): string | null {
  const path = pathOnly(pathname);
  const flow = getOccasionFlow();
  const query = browseQueryFromFlow(flow);

  const conditionsMatch = path.match(/^\/templates\/([^/]+)\/conditions$/);
  if (conditionsMatch) {
    const templateId = conditionsMatch[1];
    saveOccasionFlow({ step: "customize", templateId });
    return `${ROUTES.templates.customize(templateId)}${query}`;
  }

  const customizeMatch = path.match(/^\/templates\/([^/]+)\/customize$/);
  if (customizeMatch) {
    const templateId = customizeMatch[1];
    saveOccasionFlow({ step: "preview", templateId });
    return `${ROUTES.templates.preview(templateId)}${query}`;
  }

  const previewMatch = path.match(/^\/templates\/([^/]+)\/preview$/);
  if (previewMatch) {
    saveOccasionFlow({ step: "browse", templateId: previewMatch[1] });
    return `${ROUTES.templates.browse}${query}`;
  }

  const shareMethodMatch = path.match(/^\/templates\/([^/]+)\/success\/share\/([^/]+)$/);
  if (shareMethodMatch) {
    return `/templates/${shareMethodMatch[1]}/success/share`;
  }

  const shareHubMatch = path.match(/^\/templates\/([^/]+)\/success\/share$/);
  if (shareHubMatch) {
    return `/templates/${shareHubMatch[1]}/success`;
  }

  if (path.match(/^\/templates\/([^/]+)\/success$/)) {
    return ROUTES.profile;
  }

  if (path === ROUTES.templates.browse) {
    saveOccasionFlow({ step: "occasion", templateId: null });
    if (flow?.category) {
      return ROUTES.occasionCategory(flow.category);
    }
    return ROUTES.occasions;
  }

  const categoryMatch = path.match(/^\/occasions\/([^/]+)$/);
  if (categoryMatch && isEventCategory(categoryMatch[1])) {
    saveOccasionFlow({
      step: "category",
      category: null,
      occasion: null,
      templateId: null,
    });
    return ROUTES.occasions;
  }

  if (path === ROUTES.occasionsVipRequest) {
    saveOccasionFlow({ step: "occasion", category: "vip", occasion: null, templateId: null });
    return ROUTES.occasionCategory("vip");
  }

  return null;
}

/** Previous page within the same bottom-nav section (never another tab). */
export function getNavSectionBackTarget(pathname: string): string | null {
  const path = pathOnly(pathname);

  if (isBottomNavRoot(pathname)) {
    return null;
  }

  if (path.startsWith("/profile/invitations/") && path.endsWith("/guests")) {
    return ROUTES.profile;
  }

  if (path.startsWith("/profile/")) {
    return ROUTES.profile;
  }

  if (path.startsWith(ADMIN_ROUTES_PREFIX)) {
    return getAdminBackPath(path);
  }

  if (path.startsWith(HOST_ROUTES_PREFIX)) {
    return ROUTES.profile;
  }

  if (isOccasionFlowPath(path)) {
    return getOccasionFlowBackPath(pathname);
  }

  return null;
}
