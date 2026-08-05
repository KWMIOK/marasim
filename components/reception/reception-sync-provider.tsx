"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { syncReceptionData } from "@/lib/actions/reception";
import { RECEPTION_ENTRANCE_OPTIONS } from "@/lib/reception/entrance";
import type { ReceptionGuestSummary } from "@/lib/reception/guest";
import type { ReceptionSession } from "@/lib/reception/session";

const SYNC_INTERVAL_MS = 5000;

type ReceptionSyncContextValue = {
  receptionToken: string;
  session: ReceptionSession;
  guests: ReceptionGuestSummary[];
  entrance: string;
  syncing: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
  getGuest: (guestToken: string) => ReceptionGuestSummary | null;
};

const ReceptionSyncContext = createContext<ReceptionSyncContextValue | null>(null);

export function ReceptionSyncProvider({
  receptionToken,
  initialSession,
  initialGuests,
  children,
}: {
  receptionToken: string;
  initialSession: ReceptionSession;
  initialGuests: ReceptionGuestSummary[];
  children: ReactNode;
}) {
  const [session, setSession] = useState(initialSession);
  const [guests, setGuests] = useState(initialGuests);
  const entrance = RECEPTION_ENTRANCE_OPTIONS[0];
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  const syncNow = useCallback(async () => {
    setSyncing(true);

    try {
      const data = await syncReceptionData(receptionToken);
      if (data.session) {
        setSession(data.session);
      }
      setGuests(data.guests);
      setLastSyncedAt(new Date());
    } finally {
      setSyncing(false);
    }
  }, [receptionToken]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void syncNow();
    }, SYNC_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void syncNow();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncNow]);

  const getGuest = useCallback(
    (guestToken: string) => guests.find((guest) => guest.guestToken === guestToken) ?? null,
    [guests]
  );

  const value = useMemo(
    () => ({
      receptionToken,
      session,
      guests,
      entrance,
      syncing,
      lastSyncedAt,
      syncNow,
      getGuest,
    }),
    [receptionToken, session, guests, entrance, syncing, lastSyncedAt, syncNow, getGuest]
  );

  return (
    <ReceptionSyncContext.Provider value={value}>{children}</ReceptionSyncContext.Provider>
  );
}

export function useReceptionSync() {
  const context = useContext(ReceptionSyncContext);

  if (!context) {
    throw new Error("useReceptionSync must be used within ReceptionSyncProvider");
  }

  return context;
}
