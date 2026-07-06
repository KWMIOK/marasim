import Link from "next/link";
import type { ReactNode } from "react";
import { getProfile } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppHeader } from "@/components/shared/app-header";
import { ROUTES } from "@/lib/constants/routes";

function AdminNav() {
  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href={ROUTES.admin.root} className="text-zinc-600 hover:text-zinc-900">
        Dashboard
      </Link>
      <Link href={ROUTES.admin.events} className="text-zinc-600 hover:text-zinc-900">
        Events
      </Link>
      <Link href={ROUTES.admin.settings} className="text-zinc-600 hover:text-zinc-900">
        Settings
      </Link>
    </nav>
  );
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile();

  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader
        title="Admin Panel"
        subtitle={profile?.full_name ?? "Super Admin"}
        actions={
          <>
            <AdminNav />
            <SignOutButton />
          </>
        }
      />
      <main>{children}</main>
    </div>
  );
}
