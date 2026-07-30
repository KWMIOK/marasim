import { notFound } from "next/navigation";
import { InvitationGuestContent } from "@/components/invitation/invitation-guest-content";
import { getPublicGuestInvitation } from "@/lib/actions/guest-invitation";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const guest = await getPublicGuestInvitation(slug, token);

  if (!guest) {
    notFound();
  }

  return <InvitationGuestContent guest={guest} />;
}
