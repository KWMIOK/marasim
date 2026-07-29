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
import { ROUTES } from "@/lib/constants/routes";

export function useOccasionsNavHref() {
  const pathname = usePathname();
  const [href, setHref] = useState<string>(ROUTES.occasions);

  useEffect(() => {
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
    customizeForm?.hostName,
    customizeForm?.date,
    customizeForm?.timeFrom,
    customizeForm?.timeTo,
    customizeForm?.location,
    customizeForm?.primaryColor,
    customizeForm?.secondaryColor,
    customizeForm?.language,
    customizeForm?.guestQr,
    customizeForm?.sharedPhotoGallery,
    customizeForm?.guestBook,
    customizeForm?.thankYouMessage,
    customizeForm?.mapsLat,
    customizeForm?.mapsLng,
    customizeForm?.mapsUrl,
  ]);
}

export function isOccasionsNavActive(pathname: string): boolean {
  return isOccasionFlowPath(pathname);
}

export type { OccasionFlowBrowseState };
