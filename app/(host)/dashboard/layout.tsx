import type { ReactNode } from "react";
import { AppHeader } from "@/components/shared/app-header";

export default function HostLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50">
      <AppHeader title="Host Dashboard" />
      <main>{children}</main>
    </div>
  );
}
