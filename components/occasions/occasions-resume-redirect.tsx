"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getOccasionFlow, getOccasionFlowResumePath } from "@/lib/flow/occasion-flow";
import { ROUTES } from "@/lib/constants/routes";

export function OccasionsResumeRedirect({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const resumePath = getOccasionFlowResumePath(getOccasionFlow());
    if (resumePath !== ROUTES.occasions) {
      router.replace(resumePath);
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}
