import { Suspense } from "react";
import { PublicGuestRegistrationContent } from "@/components/pages/public-guest-registration-content";

export default function EventRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <EventRegisterPageInner params={params} />
    </Suspense>
  );
}

async function EventRegisterPageInner({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicGuestRegistrationContent eventSlug={slug} />;
}
