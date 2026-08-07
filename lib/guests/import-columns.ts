import type { ParsedGuestRow } from "@/lib/guests/parse-roster";

export type GuestImportColumn = {
  key: keyof ParsedGuestRow | "name" | "phone_number";
  labelKey: string;
  required: boolean;
  header: string;
  aliases: string[];
  example: string;
};

export const GUEST_IMPORT_TEMPLATE_HEADERS = [
  "Guest Name",
  "Phone Number",
  "VIP",
  "Table",
  "Companions",
] as const;

export const GUEST_IMPORT_COLUMNS: GuestImportColumn[] = [
  {
    key: "name",
    labelKey: "hostShare.importColumnName",
    required: true,
    header: "Guest Name",
    aliases: ["Guest Name", "Full Name", "Name"],
    example: "Sara Al-Ahmad",
  },
  {
    key: "phone_number",
    labelKey: "hostShare.importColumnPhone",
    required: true,
    header: "Phone Number",
    aliases: ["Phone Number", "Phone", "Mobile", "Mobile Number"],
    example: "+96550000000",
  },
  {
    key: "is_vip",
    labelKey: "hostShare.importColumnVip",
    required: false,
    header: "VIP",
    aliases: ["VIP", "VIP Status"],
    example: "true",
  },
  {
    key: "table_number",
    labelKey: "hostShare.importColumnTable",
    required: false,
    header: "Table",
    aliases: ["Table", "Table Number"],
    example: "12",
  },
  {
    key: "companion_count",
    labelKey: "hostShare.importColumnCompanions",
    required: false,
    header: "Companions",
    aliases: ["Companions", "Plus One", "Extra Guests"],
    example: "1",
  },
];

export const GUEST_IMPORT_REQUIRED_COLUMNS = GUEST_IMPORT_COLUMNS.filter(
  (column) => column.required
);

export function parsedRowsToShareGuests(
  rows: ParsedGuestRow[],
  source: "import"
): Array<{
  name: string;
  phone: string;
  source: "import";
  is_vip?: boolean;
  table_number?: string;
  companion_count?: number;
}> {
  return rows
    .filter((row) => row.name.trim() && row.phone_number?.trim())
    .map((row) => ({
      name: row.name.trim(),
      phone: row.phone_number!.trim(),
      source,
      is_vip: row.is_vip,
      table_number: row.table_number,
      companion_count: row.companion_count,
    }));
}
