import { HostVendorsContent } from "@/components/pages/host-vendors-content";

export default async function HostVendorsPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;
  return <HostVendorsContent invitationId={invitationId} />;
}
