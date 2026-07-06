import type { ReactNode } from "react";
import { AppHeader } from "@/components/shared/app-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader title="Admin Panel" subtitle="Super Admin" />
      <main>{children}</main>
    </div>
  );
}
