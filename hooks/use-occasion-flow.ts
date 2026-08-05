"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getOccasionFlow,
  getOccasionFlowResumePath,
  isOccasionFlowPath,
  saveOccasionFlow,
  type OccasionFlowBrowseState,
  type OccasionFlowState,
} from "@/lib/flow/occasion-flow";
import { migrateStuckSuccessFlowToHostInvitations } from "@/lib/invitations/migrate-stuck-flow";
import { ROUTES } from "@/lib/constants/routes";

export function useOccasionsNavHref() {
  const pathname = usePathname();
  const [href, setHref] = useState<string>(ROUTES.occasions);

  useEffect(() => {
    if (migrateStuckSuccessFlowToHostInvitations()) {
      setHref(ROUTES.occasions);
      return;
    }

    setHref(getOccasionFlowResumePath(getOccasionFlow()));
  }, [pathname]);

  return href;
}

export function useOccasionFlowPersistence({
  enabled = true,
  step,
  category,
  occasion,
  templateId,
  browse,
  customizeForm,
  generatedLinks,
}: Partial<OccasionFlowState> & { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    saveOccasionFlow({
      step,
      category,
      occasion,
      templateId,
      browse,
      customizeForm,
      generatedLinks,
    });
  }, [
    enabled,
    step,
    category,
    occasion,
    templateId,
    browse?.searchQuery,
    browse?.activeTab,
    browse?.choosingTemplateId,
    browse?.focusTemplateId,
    customizeForm,
    generatedLinks?.guestUrl,
    generatedLinks?.receptionistUrl,
  ]);
}

export function isOccasionsNavActive(pathname: string): boolean {
  if (pathname.includes("/success")) return false;
  return isOccasionFlowPath(pathname);
}

export type { OccasionFlowBrowseState };
