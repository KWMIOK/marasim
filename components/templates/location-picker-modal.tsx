"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { AppPickerModal } from "@/components/templates/app-picker-modal";
import { buildGoogleMapsUrl, DEFAULT_MAP_CENTER } from "@/lib/maps/utils";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";

export type LocationPickerValue = {
  mapsLat: number | null;
  mapsLng: number | null;
  mapsUrl: string;
  suggestedName: string;
};

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#121212" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e8d5a3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2418" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b0b0b" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1408" }] },
];

export function LocationPickerModal({
  open,
  initialLat,
  initialLng,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initialLat: number | null;
  initialLng: number | null;
  onClose: () => void;
  onConfirm: (value: LocationPickerValue) => void;
}) {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [mapsReady, setMapsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draftLat, setDraftLat] = useState<number | null>(initialLat);
  const [draftLng, setDraftLng] = useState<number | null>(initialLng);
  const [draftUrl, setDraftUrl] = useState("");
  const [suggestedName, setSuggestedName] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  function emitDraft(lat: number, lng: number, name?: string, url?: string) {
    setDraftLat(lat);
    setDraftLng(lng);
    setDraftUrl(url ?? buildGoogleMapsUrl(lat, lng));
    if (name) setSuggestedName(name);
  }

  function placeMarker(lat: number, lng: number, pan = true) {
    const map = mapRef.current;
    if (!map) return;

    const position = { lat, lng };

    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      const marker = new google.maps.Marker({
        map,
        position,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });
      markerRef.current = marker;
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (!pos) return;
        emitDraft(pos.lat(), pos.lng());
      });
    }

    if (pan) {
      map.panTo(position);
      if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
    }
  }

  useEffect(() => {
    if (!open) return;
    setDraftLat(initialLat);
    setDraftLng(initialLng);
    setDraftUrl(initialLat != null && initialLng != null ? buildGoogleMapsUrl(initialLat, initialLng) : "");
  }, [open, initialLat, initialLng]);

  useEffect(() => {
    if (!open || !apiKey || !mapContainerRef.current || !searchRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    async function init() {
      try {
        setOptions({ key: apiKey!, v: "weekly" });
        const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
        await importLibrary("places");

        if (cancelled || !mapContainerRef.current || !searchRef.current) return;

        const startLat = draftLat ?? initialLat ?? DEFAULT_MAP_CENTER.lat;
        const startLng = draftLng ?? initialLng ?? DEFAULT_MAP_CENTER.lng;

        const map = new Map(mapContainerRef.current, {
          center: { lat: startLat, lng: startLng },
          zoom: draftLat != null ? 15 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: MAP_STYLES,
        });

        mapRef.current = map;

        if (draftLat != null && draftLng != null) {
          placeMarker(draftLat, draftLng, false);
        }

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();
          if (lat == null || lng == null) return;
          placeMarker(lat, lng, false);
          emitDraft(lat, lng);
        });

        autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
          fields: ["name", "formatted_address", "geometry", "url"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          if (!place?.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.name ?? place.formatted_address ?? "";
          const url = place.url ?? buildGoogleMapsUrl(lat, lng);

          placeMarker(lat, lng);
          emitDraft(lat, lng, name, url);
        });

        setMapsReady(true);
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : t("venue.loadFailed"));
      }
    }

    init();

    return () => {
      cancelled = true;
      autocomplete = null;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
      setMapsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apiKey]);

  if (!open) return null;

  return (
    <AppPickerModal
      open={open}
      title={t("selectedTemplate.pickLocation")}
      onClose={onClose}
      onConfirm={() =>
        onConfirm({
          mapsLat: draftLat,
          mapsLng: draftLng,
          mapsUrl: draftUrl,
          suggestedName,
        })
      }
    >
      {!apiKey ? (
        <p className="text-sm text-muted">{t("venue.noApiKey")}</p>
      ) : (
        <div className="space-y-3">
          <input
            ref={searchRef}
            type="text"
            placeholder={t("venue.searchPlaceholder")}
            className="w-full rounded-xl border border-border-gold bg-surface px-3 py-2.5 text-sm text-gold-light outline-none placeholder:text-gold-muted focus:ring-2 focus:ring-gold/40"
            autoComplete="off"
          />
          <p className="text-xs text-muted">{t("selectedTemplate.locationMapHint")}</p>
          <div className="overflow-hidden rounded-xl border border-border-gold">
            <div ref={mapContainerRef} className={cn("h-56 w-full bg-surface", !mapsReady && "animate-pulse")} />
          </div>
          {loadError ? <p className="text-xs text-red-400">{loadError}</p> : null}
          {draftLat != null && draftLng != null ? (
            <p className="text-xs text-muted">
              {t("venue.pinCoords", { lat: draftLat.toFixed(5), lng: draftLng.toFixed(5) })}
            </p>
          ) : (
            <p className="text-xs text-gold-muted">{t("venue.noPin")}</p>
          )}
          {suggestedName ? (
            <p className="text-xs text-muted">
              {t("selectedTemplate.suggestedLocation", { name: suggestedName })}
            </p>
          ) : null}
        </div>
      )}
    </AppPickerModal>
  );
}
