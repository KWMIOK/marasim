"use client";

import type { ReactNode } from "react";
import { TopLanguageBar } from "@/components/shared/top-language-bar";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <TopLanguageBar />
      {children}
    </>
  );
}
