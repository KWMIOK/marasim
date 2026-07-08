import { InvitationPreviewClient } from "@/components/invitation/invitation-preview-client";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;

  return <InvitationPreviewClient slug={slug} tokenPreview={token.slice(0, 8)} />;
}
