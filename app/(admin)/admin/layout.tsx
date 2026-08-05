import type { ReactNode } from "react";
import { AdminPanelNav } from "@/components/admin/admin-panel-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminPanelNav />
      {children}
    </>
  );
}
