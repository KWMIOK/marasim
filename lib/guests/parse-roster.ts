import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedGuestRow = {
  name: string;
  phone_number?: string;
  is_vip?: boolean;
  table_number?: string;
  companion_count?: number;
};

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const str = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "vip"].includes(str);
}

function parseNumber(value: unknown): number {
  const num = Number(String(value ?? "").trim());
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function rowToGuest(row: Record<string, unknown>): ParsedGuestRow | null {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value;
  }

  const name = String(
    normalized.name ??
      normalized.guest_name ??
      normalized.full_name ??
      normalized["guest"] ??
      ""
  ).trim();

  if (!name) return null;

  const phone = String(
    normalized.phone_number ??
      normalized.phone ??
      normalized.mobile ??
      normalized.number ??
      ""
  ).trim();

  return {
    name,
    phone_number: phone || undefined,
    is_vip: parseBoolean(normalized.is_vip ?? normalized.vip),
    table_number: String(normalized.table_number ?? normalized.table ?? "").trim() || undefined,
    companion_count: parseNumber(
      normalized.companion_count ?? normalized.companions ?? normalized.plus_ones
    ),
  };
}

export function parseGuestFile(buffer: ArrayBuffer, filename: string): ParsedGuestRow[] {
  const lower = filename.toLowerCase();

  let rows: Record<string, unknown>[] = [];

  if (lower.endsWith(".csv")) {
    const text = new TextDecoder().decode(buffer);
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    rows = parsed.data;
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  } else {
    throw new Error("Unsupported file type. Upload CSV or Excel (.xlsx).");
  }

  return rows
    .map(rowToGuest)
    .filter((row): row is ParsedGuestRow => row !== null);
}
