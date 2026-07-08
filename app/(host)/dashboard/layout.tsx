import type { ReactNode } from "react";
import { HostLayoutClient } from "@/components/host/host-layout-client";

export default function HostLayout({ children }: { children: ReactNode }) {
  return <HostLayoutClient>{children}</HostLayoutClient>;
}
