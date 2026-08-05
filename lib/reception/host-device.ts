import { parseReceptionistUrl } from "@/lib/invitations/parse-invitation-urls";

const HOST_DEVICE_PREFIX = "marasim_reception_host_device_";

function canUseStorage() {
  return typeof window !== "undefined";
}

export function saveHostReceptionDevice(receptionToken: string, deviceId: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(`${HOST_DEVICE_PREFIX}${receptionToken}`, deviceId);
}

export function readHostReceptionDevice(receptionToken: string): string | null {
  if (!canUseStorage()) return null;

  try {
    return localStorage.getItem(`${HOST_DEVICE_PREFIX}${receptionToken}`);
  } catch {
    return null;
  }
}

export function saveHostReceptionDeviceForUrl(receptionistUrl: string, deviceId: string) {
  const token = parseReceptionistUrl(receptionistUrl);
  if (!token) return;
  saveHostReceptionDevice(token, deviceId);
}
