import { redirect } from "next/navigation";
import { AdminPricingClient } from "@/components/admin/admin-pricing-client";
import { getOccasionPricingTiers } from "@/lib/data/occasion-pricing";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";

export default async function AdminPricingPage() {
  const user = await getSessionUser();
  const profile = await getProfile();

  if (!user || profile?.role !== "super_admin") {
    redirect(ROUTES.login);
  }

  const tiers = await getOccasionPricingTiers();

  return <AdminPricingClient tiers={tiers} />;
}
