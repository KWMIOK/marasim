"use client";

import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function PublicLanguageToggle() {
  return (
    <div className="fixed top-4 end-4 z-50">
      <LanguageSwitcher />
    </div>
  );
}
