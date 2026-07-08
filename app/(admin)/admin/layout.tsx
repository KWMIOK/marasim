import type { ReactNode } from "react";
import { AdminLayoutClient } from "@/components/admin/admin-layout-client";
import { getProfile } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();

  return (
    <AdminLayoutClient subtitle={profile?.full_name}>{children}</AdminLayoutClient>
  );
}
