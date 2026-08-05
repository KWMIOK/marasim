import type { ParsedGuestRow } from "@/lib/guests/parse-roster";

export type GuestImportColumn = {
  key: keyof ParsedGuestRow | "name" | "phone_number";
  labelKey: string;
  required: boolean;
  header: string;
  example: string;
};

export const GUEST_IMPORT_COLUMNS: GuestImportColumn[] = [
  {
    key: "name",
    labelKey: "hostShare.importColumnName",
    required: true,
    header: "name",
    example: "Sara Al-Ahmad",
  },
  {
    key: "phone_number",
    labelKey: "hostShare.importColumnPhone",
    required: true,
    header: "phone",
    example: "+96550000000",
  },
  {
    key: "is_vip",
    labelKey: "hostShare.importColumnVip",
    required: false,
    header: "vip",
    example: "true",
  },
  {
    key: "table_number",
    labelKey: "hostShare.importColumnTable",
    required: false,
    header: "table",
    example: "12",
  },
  {
    key: "companion_count",
    labelKey: "hostShare.importColumnCompanions",
    required: false,
    header: "companions",
    example: "1",
  },
];

export const GUEST_IMPORT_REQUIRED_COLUMNS = GUEST_IMPORT_COLUMNS.filter(
  (column) => column.required
);
