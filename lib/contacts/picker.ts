export type PickedContact = {
  name: string;
  phone: string;
};

type ContactProperty = "name" | "tel";

type ContactsManager = {
  select: (
    properties: ContactProperty[],
    options?: { multiple?: boolean }
  ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
};

function getContactsManager(): ContactsManager | null {
  if (typeof navigator === "undefined") return null;
  const contacts = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
  if (!contacts || typeof contacts.select !== "function") return null;
  return contacts;
}

export function isContactPickerSupported(): boolean {
  return getContactsManager() !== null;
}

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function pickPrimaryPhone(numbers: string[] | undefined): string | null {
  if (!numbers?.length) return null;
  const raw = numbers[0].trim();
  const digits = raw.replace(/[^\d+]/g, "");
  return normalizePhone(digits || raw);
}

function pickPrimaryName(names: string[] | undefined): string {
  if (!names?.length) return "";
  return names[0]?.trim() ?? "";
}

export async function pickDeviceContacts(): Promise<PickedContact[]> {
  const manager = getContactsManager();
  if (!manager) {
    throw new Error("CONTACT_PICKER_UNAVAILABLE");
  }

  const results = await manager.select(["name", "tel"], { multiple: true });
  const picked: PickedContact[] = [];

  for (const entry of results) {
    const phone = pickPrimaryPhone(entry.tel);
    if (!phone) continue;
    picked.push({
      name: pickPrimaryName(entry.name) || phone,
      phone,
    });
  }

  return picked;
}

export function openWhatsAppInvite(phone: string, message: string) {
  const normalized = phone.replace(/\D/g, "");
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function sendWhatsAppInvites(
  contacts: PickedContact[],
  message: string,
  onProgress?: (index: number, total: number) => void
) {
  for (let index = 0; index < contacts.length; index += 1) {
    onProgress?.(index, contacts.length);
    openWhatsAppInvite(contacts[index].phone, message);
    if (index < contacts.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
    }
  }
  onProgress?.(contacts.length, contacts.length);
}
