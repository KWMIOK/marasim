const DEVICE_STORAGE_KEY = "marasim_reception_device_id";

export function getOrCreateReceptionDeviceId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) return existing;

    const created =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    return `device-${Date.now()}`;
  }
}
