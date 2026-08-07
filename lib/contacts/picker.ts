import { Capacitor } from "@capacitor/core";

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

export function isNativeApp(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function isContactPickerSupported(): boolean {
  return isNativeApp() || getContactsManager() !== null;
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

function contactFromPayload(contact: {
  name?: { display?: string | null; given?: string | null; family?: string | null };
  phones?: Array<{ number?: string | null; isPrimary?: boolean | null }>;
}): PickedContact | null {
  const phoneEntry =
    contact.phones?.find((entry) => entry.isPrimary && entry.number?.trim()) ??
    contact.phones?.find((entry) => entry.number?.trim());
  const phone = phoneEntry?.number?.trim();
  if (!phone) return null;

  const name =
    contact.name?.display?.trim() ||
    [contact.name?.given, contact.name?.family].filter(Boolean).join(" ").trim() ||
    phone;

  return { name, phone: normalizePhone(phone) };
}

async function ensureContactsPermission(): Promise<void> {
  const { Contacts } = await import("@capacitor-community/contacts");
  let permission = await Contacts.requestPermissions();
  if (permission.contacts !== "granted" && permission.contacts !== "limited") {
    permission = await Contacts.checkPermissions();
  }
  if (permission.contacts !== "granted" && permission.contacts !== "limited") {
    throw new Error("CONTACT_PERMISSION_DENIED");
  }
}

export async function pickSingleNativeContact(): Promise<PickedContact | null> {
  await ensureContactsPermission();

  const { Contacts } = await import("@capacitor-community/contacts");
  const { contact } = await Contacts.pickContact({
    projection: {
      name: true,
      phones: true,
    },
  });

  return contactFromPayload(contact);
}

export async function loadNativeContacts(): Promise<PickedContact[]> {
  await ensureContactsPermission();

  const { Contacts } = await import("@capacitor-community/contacts");
  const { contacts } = await Contacts.getContacts({
    projection: {
      name: true,
      phones: true,
    },
  });

  const picked: PickedContact[] = [];
  for (const contact of contacts) {
    const mapped = contactFromPayload(contact);
    if (mapped) picked.push(mapped);
  }

  return picked.sort((a, b) => a.name.localeCompare(b.name));
}

export async function pickDeviceContacts(): Promise<PickedContact[]> {
  if (isNativeApp()) {
    const contact = await pickSingleNativeContact();
    return contact ? [contact] : [];
  }

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
  message: string | ((contact: PickedContact, index: number) => string),
  onProgress?: (index: number, total: number) => void
) {
  for (let index = 0; index < contacts.length; index += 1) {
    onProgress?.(index, contacts.length);
    const text = typeof message === "function" ? message(contacts[index], index) : message;
    openWhatsAppInvite(contacts[index].phone, text);
    if (index < contacts.length - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
    }
  }
  onProgress?.(contacts.length, contacts.length);
}
