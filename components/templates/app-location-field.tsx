"use client";

import { useState } from "react";
import { LocationFieldIcon } from "@/components/templates/invitation-field-icons";
import { LocationPickerModal, type LocationPickerValue } from "@/components/templates/location-picker-modal";
import {
  InvitationDetailField,
  InvitationDetailInput,
  InvitationDetailTextarea,
} from "@/components/templates/selected-template-form";
import { useTranslation } from "@/hooks/use-locale";

export function AppLocationField({
  label,
  htmlFor,
  location,
  locationDirections,
  mapsLat,
  mapsLng,
  onLocationChange,
  onLocationDirectionsChange,
  onMapChange,
}: {
  label: string;
  htmlFor: string;
  location: string;
  locationDirections: string;
  mapsLat: number | null;
  mapsLng: number | null;
  onLocationChange: (value: string) => void;
  onLocationDirectionsChange: (value: string) => void;
  onMapChange: (value: LocationPickerValue) => void;
}) {
  const { t } = useTranslation();
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <>
      <InvitationDetailField
        label={label}
        htmlFor={htmlFor}
        icon={<LocationFieldIcon />}
        className="sm:col-span-2"
      >
        <InvitationDetailInput
          id={htmlFor}
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder={t("selectedTemplate.locationPlaceholder")}
        />
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="btn-outline-gold mt-3 w-full rounded-xl px-3 py-2.5 text-xs font-medium"
        >
          {mapsLat != null && mapsLng != null
            ? t("selectedTemplate.editLocationOnMap")
            : t("selectedTemplate.pickLocationOnMap")}
        </button>
        {mapsLat != null && mapsLng != null ? (
          <p className="mt-2 text-xs text-muted">{t("selectedTemplate.locationPinSet")}</p>
        ) : null}
        <p className="mt-1 text-xs text-gold-muted">{t("selectedTemplate.locationGuestHint")}</p>

        <label htmlFor={`${htmlFor}-directions`} className="mt-4 block text-xs font-medium text-gold-light">
          {t("selectedTemplate.locationDirections")}
        </label>
        <InvitationDetailTextarea
          id={`${htmlFor}-directions`}
          value={locationDirections}
          onChange={(event) => onLocationDirectionsChange(event.target.value)}
          placeholder={t("selectedTemplate.locationDirectionsPlaceholder")}
          rows={3}
          className="mt-2"
        />
        <p className="mt-1.5 text-xs text-gold-muted">{t("selectedTemplate.locationDirectionsHint")}</p>
      </InvitationDetailField>

      <LocationPickerModal
        open={mapOpen}
        initialLat={mapsLat}
        initialLng={mapsLng}
        onClose={() => setMapOpen(false)}
        onConfirm={(value) => {
          onMapChange(value);
          setMapOpen(false);
        }}
      />
    </>
  );
}
