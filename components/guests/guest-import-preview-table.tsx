"use client";

import type { ParsedGuestPreviewRow } from "@/lib/guests/parse-roster";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

export function GuestImportPreviewTable({
  rows,
  className,
}: {
  rows: ParsedGuestPreviewRow[];
  className?: string;
}) {
  const { t } = useTranslation();
  const validCount = rows.filter((row) => row.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className={cn("surface-card overflow-hidden rounded-2xl text-start shadow-lg shadow-black/20", className)}>
      <div className="border-b border-border-gold px-4 py-3">
        <p className="text-sm font-semibold text-gold-light">{t("hostShare.importPreviewTitle")}</p>
        <p className="mt-1 text-xs text-muted">
          {t("hostShare.importPreviewSummary", {
            valid: String(validCount),
            invalid: String(invalidCount),
          })}
        </p>
      </div>
      <div className="max-h-64 overflow-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-border-gold/60 text-muted">
              <th className="px-3 py-2 text-start font-medium">#</th>
              <th className="px-3 py-2 text-start font-medium">{t("hostShare.guestNameLabel")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("hostShare.guestPhoneLabel")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("hostShare.importPreviewStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.rowIndex}
                className={cn(
                  "border-b border-border-gold/30 last:border-0",
                  !row.isValid && "bg-red-500/10"
                )}
              >
                <td className="px-3 py-2 text-muted">{row.rowIndex}</td>
                <td className="px-3 py-2 text-gold-light">{row.name || "—"}</td>
                <td dir="ltr" className="px-3 py-2 text-gold-light">
                  {row.phone_number || "—"}
                </td>
                <td className="px-3 py-2">
                  {row.isValid ? (
                    <span className="text-emerald-300">{t("hostShare.importPreviewValid")}</span>
                  ) : (
                    <span className="text-red-300">
                      {t("hostShare.importPreviewInvalid", {
                        fields: row.missingFields.join(", "),
                      })}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
