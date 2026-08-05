import { Suspense } from "react";
import { HostInvitationGuestsContent } from "@/components/pages/host-invitation-guests-content";

export default async function HostInvitationGuestsPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  return (
    <Suspense fallback={null}>
      <HostInvitationGuestsContent invitationId={invitationId} />
    </Suspense>
  );
}
