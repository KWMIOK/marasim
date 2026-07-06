import type { UserRole } from "@/types/database";
import { ROUTES } from "@/lib/constants/routes";

export function getHomeRouteForRole(role: UserRole | undefined): string {
  switch (role) {
    case "super_admin":
      return ROUTES.admin.root;
    case "host":
      return "/dashboard";
    case "check_in_staff":
      return ROUTES.scanner;
    default:
      return ROUTES.admin.root;
  }
}
