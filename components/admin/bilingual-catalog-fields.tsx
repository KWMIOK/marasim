"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-locale";

export function BilingualNameFields({
  nameAr,
  nameEn,
  onChange,
}: {
  nameAr: string;
  nameEn: string;
  onChange: (patch: { name_ar?: string; name_en?: string }) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <Label>{t("catalogAdmin.nameAr")}</Label>
        <Input
          value={nameAr}
          onChange={(event) => onChange({ name_ar: event.target.value })}
          className="mt-1"
          dir="rtl"
          required
        />
      </div>
      <div>
        <Label>{t("catalogAdmin.nameEn")}</Label>
        <Input
          value={nameEn}
          onChange={(event) => onChange({ name_en: event.target.value })}
          className="mt-1"
          dir="ltr"
          required
        />
      </div>
    </>
  );
}

export function BilingualDescriptionFields({
  descriptionAr,
  descriptionEn,
  onChange,
}: {
  descriptionAr: string;
  descriptionEn: string;
  onChange: (patch: { description_ar?: string; description_en?: string }) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="sm:col-span-2">
        <Label>{t("catalogAdmin.descriptionAr")}</Label>
        <Textarea
          value={descriptionAr}
          onChange={(event) => onChange({ description_ar: event.target.value })}
          rows={2}
          className="mt-1"
          dir="rtl"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label>{t("catalogAdmin.descriptionEn")}</Label>
        <Textarea
          value={descriptionEn}
          onChange={(event) => onChange({ description_en: event.target.value })}
          rows={2}
          className="mt-1"
          dir="ltr"
          required
        />
      </div>
    </>
  );
}

export function isBilingualNameComplete(nameAr: string, nameEn: string) {
  return Boolean(nameAr.trim() && nameEn.trim());
}

export function isBilingualDescriptionComplete(descriptionAr: string, descriptionEn: string) {
  return Boolean(descriptionAr.trim() && descriptionEn.trim());
}
