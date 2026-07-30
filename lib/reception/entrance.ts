const ENTRANCE_STORAGE_PREFIX = "marasim_reception_entrance_";

export const RECEPTION_ENTRANCE_OPTIONS = [
  "Main entrance",
  "North entrance",
  "South entrance",
  "VIP entrance",
] as const;

export type ReceptionEntranceLabel = (typeof RECEPTION_ENTRANCE_OPTIONS)[number];

export const RECEPTION_ENTRANCE_I18N_KEYS: Record<ReceptionEntranceLabel, string> = {
  "Main entrance": "reception.entrances.main",
  "North entrance": "reception.entrances.north",
  "South entrance": "reception.entrances.south",
  "VIP entrance": "reception.entrances.vip",
};

export function getReceptionEntranceStorageKey(receptionToken: string) {
  return `${ENTRANCE_STORAGE_PREFIX}${receptionToken}`;
}

export function readReceptionEntrance(receptionToken: string): string {
  if (typeof window === "undefined") {
    return RECEPTION_ENTRANCE_OPTIONS[0];
  }

  try {
    const saved = localStorage.getItem(getReceptionEntranceStorageKey(receptionToken));
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {
    // ignore storage errors
  }

  return RECEPTION_ENTRANCE_OPTIONS[0];
}

export function saveReceptionEntrance(receptionToken: string, entranceLabel: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getReceptionEntranceStorageKey(receptionToken), entranceLabel.trim());
  } catch {
    // ignore storage errors
  }
}
