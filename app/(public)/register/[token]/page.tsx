import { Suspense } from "react";
import { PublicGuestRegistrationContent } from "@/components/pages/public-guest-registration-content";

export default function PublicRegistrationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PublicRegistrationPageInner params={params} />
    </Suspense>
  );
}

async function PublicRegistrationPageInner({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicGuestRegistrationContent publicToken={token} />;
}
