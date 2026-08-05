"use client";

import { useTranslation } from "@/hooks/use-locale";

function buildMapsHref(mapsUrl: string | null, mapsLat: number | null, mapsLng: number | null) {
  if (mapsUrl?.trim()) return mapsUrl.trim();
  if (mapsLat != null && mapsLng != null) {
    return `https://www.google.com/maps?q=${mapsLat},${mapsLng}`;
  }
  return null;
}

export function InvitationLocationCard({
  locationName,
  locationDirections,
  mapsLat,
  mapsLng,
  mapsUrl,
}: {
  locationName: string | null;
  locationDirections: string | null;
  mapsLat: number | null;
  mapsLng: number | null;
  mapsUrl: string | null;
}) {
  const { t } = useTranslation();
  const hasName = Boolean(locationName?.trim());
  const hasDirections = Boolean(locationDirections?.trim());
  const mapsHref = buildMapsHref(mapsUrl, mapsLat, mapsLng);

  if (!hasName && !hasDirections && !mapsHref) {
    return null;
  }

  return (
    <div className="surface-card mt-6 rounded-2xl p-5 shadow-lg shadow-black/20">
      <h2 className="text-sm font-semibold text-gold-light">{t("invitation.locationTitle")}</h2>

      {hasName ? (
        <p className="mt-2 text-base font-medium text-gold-light">{locationName}</p>
      ) : null}

      {hasDirections ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {locationDirections}
        </p>
      ) : null}

      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-gold mt-4 inline-flex rounded-xl px-4 py-2.5 text-xs font-medium"
        >
          {t("invitation.openInMaps")}
        </a>
      ) : null}
    </div>
  );
}
