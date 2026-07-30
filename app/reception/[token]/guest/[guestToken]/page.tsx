import { notFound } from "next/navigation";
import { ReceptionGuestDetailContent } from "@/components/pages/reception-guest-detail-content";
import { getReceptionGuest } from "@/lib/actions/reception";

export default async function ReceptionGuestPage({
  params,
}: {
  params: Promise<{ token: string; guestToken: string }>;
}) {
  const { token, guestToken } = await params;
  const guest = await getReceptionGuest(token, guestToken);

  if (!guest) {
    notFound();
  }

  return <ReceptionGuestDetailContent guestToken={guestToken} initialGuest={guest} />;
}
