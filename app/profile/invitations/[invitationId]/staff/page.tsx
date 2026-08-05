import { HostReceptionStaffContent } from "@/components/pages/host-reception-staff-content";

export default async function HostReceptionStaffPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  return <HostReceptionStaffContent invitationId={invitationId} />;
}
