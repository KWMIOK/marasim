import * as XLSX from "xlsx";
import { GUEST_IMPORT_TEMPLATE_HEADERS } from "@/lib/guests/import-columns";

export function downloadGuestImportTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...GUEST_IMPORT_TEMPLATE_HEADERS],
    ["Sara Al-Ahmad", "+96550000000", "false", "12", "1"],
    ["Ahmed Hassan", "+96551111111", "true", "3", "0"],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");
  XLSX.writeFile(workbook, "marasim-guest-import-template.xlsx");
}
