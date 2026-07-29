import type { UserRole } from "@/types/database";
import { ROUTES } from "@/lib/constants/routes";

export function getHomeRouteForRole(_role: UserRole | undefined): string {
  return ROUTES.occasions;
}
