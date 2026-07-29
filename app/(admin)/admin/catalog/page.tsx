import { redirect } from "next/navigation";
import { AdminCatalogClient } from "@/components/admin/admin-catalog-client";
import { getAdminEventCatalogs } from "@/lib/data/catalogs-admin";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";

export default async function AdminCatalogPage() {
  const user = await getSessionUser();
  const profile = await getProfile();

  if (!user || profile?.role !== "super_admin") {
    redirect(ROUTES.login);
  }

  const catalogs = await getAdminEventCatalogs();

  return <AdminCatalogClient catalogs={catalogs} />;
}
