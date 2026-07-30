import { notFound, redirect } from "next/navigation";
import { ReceptionArrivalSuccessContent } from "@/components/pages/reception-arrival-success-content";
import {
  getReceptionGuest,
  getReceptionSessionByToken,
} from "@/lib/actions/reception";
import { ROUTES } from "@/lib/constants/routes";

export default async function ReceptionArrivalSuccessPage({
  params,
}: {
  params: Promise<{ token: string; guestToken: string }>;
}) {
  const { token, guestToken } = await params;
  const session = await getReceptionSessionByToken(token);

  if (!session) {
    notFound();
  }

  const guest = await getReceptionGuest(token, guestToken);

  if (!guest) {
    notFound();
  }

  if (guest.checkInStatus !== "checked_in") {
    redirect(ROUTES.receptionGuest(token, guestToken));
  }

  return <ReceptionArrivalSuccessContent receptionToken={token} />;
}
