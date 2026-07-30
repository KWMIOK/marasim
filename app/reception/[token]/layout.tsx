import { notFound } from "next/navigation";
import { ReceptionSyncProvider } from "@/components/reception/reception-sync-provider";
import {
  getReceptionSessionByToken,
  listReceptionGuests,
} from "@/lib/actions/reception";

export default async function ReceptionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [session, guests] = await Promise.all([
    getReceptionSessionByToken(token),
    listReceptionGuests(token),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <ReceptionSyncProvider
      receptionToken={token}
      initialSession={session}
      initialGuests={guests}
    >
      {children}
    </ReceptionSyncProvider>
  );
}
