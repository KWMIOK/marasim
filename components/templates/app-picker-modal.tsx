"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/hooks/use-locale";

export function AppPickerModal({
  open,
  title,
  children,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label={t("common.cancel")} onClick={onClose} />
      <div className="surface-card relative z-10 w-full max-w-lg rounded-2xl border border-border-gold p-5 shadow-2xl shadow-black/50">
        <h3 className="text-base font-semibold text-gold-light">{title}</h3>
        <div className="mt-4">{children}</div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="btn-outline-gold rounded-xl px-4 py-2.5 text-sm font-medium">
            {t("common.cancel")}
          </button>
          <button type="button" onClick={onConfirm} className="btn-gold rounded-xl px-4 py-2.5 text-sm font-medium">
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
