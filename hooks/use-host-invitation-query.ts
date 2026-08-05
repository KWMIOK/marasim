"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getHostInvitation,
  type HostInvitation,
} from "@/lib/invitations/host-invitations";
import { ROUTES } from "@/lib/constants/routes";

export function useHostInvitationQuery(templateId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invitation, setInvitation] = useState<HostInvitation | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = searchParams.get("invitation");
    const savedInvitation = id ? getHostInvitation(id) : null;

    if (savedInvitation && savedInvitation.templateId === templateId) {
      setInvitation(savedInvitation);
      setHydrated(true);
      return;
    }

    router.replace(ROUTES.profile);
  }, [router, searchParams, templateId]);

  return { invitation, hydrated };
}
