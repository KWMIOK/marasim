import { Capacitor } from "@capacitor/core";
import * as XLSX from "xlsx";
import { GUEST_IMPORT_TEMPLATE_HEADERS } from "@/lib/guests/import-columns";

const TEMPLATE_FILENAME = "marasim-guest-import-template.xlsx";

function buildWorkbook() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...GUEST_IMPORT_TEMPLATE_HEADERS],
    ["Sara Al-Ahmad", "+96550000000", "false", "12", "1"],
    ["Ahmed Hassan", "+96551111111", "true", "3", "0"],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");
  return workbook;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function downloadBlobInBrowser(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = TEMPLATE_FILENAME;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadGuestImportTemplate() {
  const workbook = buildWorkbook();
  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const mimeType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const result = await Filesystem.writeFile({
      path: TEMPLATE_FILENAME,
      data: arrayBufferToBase64(arrayBuffer),
      directory: Directory.Cache,
    });

    await Share.share({
      title: TEMPLATE_FILENAME,
      url: result.uri,
      dialogTitle: TEMPLATE_FILENAME,
    });
    return;
  }

  downloadBlobInBrowser(new Blob([arrayBuffer], { type: mimeType }));
}
