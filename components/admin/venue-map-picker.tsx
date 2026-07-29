"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { buildGoogleMapsUrl, DEFAULT_MAP_CENTER } from "@/lib/maps/utils";
import { useTranslation } from "@/hooks/use-locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VenueMapValue = {
  venue: string;
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
};

export function VenueMapPicker({
  venue,
  mapsUrl,
  mapsLat,
  mapsLng,
  onVenueChange,
  onMapsChange,
}: {
  venue: string;
  mapsUrl: string;
  mapsLat: number | null;
  mapsLng: number | null;
  onVenueChange: (venue: string) => void;
  onMapsChange: (data: VenueMapValue) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const onMapsChangeRef = useRef(onMapsChange);
  const venueRef = useRef(venue);

  const [mapsReady, setMapsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  onMapsChangeRef.current = onMapsChange;
  venueRef.current = venue;

  function emitLocation(lat: number, lng: number, nextVenue?: string, link?: string) {
    onMapsChangeRef.current({
      venue: nextVenue ?? venueRef.current,
      mapsUrl: link ?? buildGoogleMapsUrl(lat, lng),
      lat,
      lng,
    });
  }

  function reverseGeocode(lat: number, lng: number) {
    if (!geocoderRef.current) {
      emitLocation(lat, lng);
      return;
    }

    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) {
        emitLocation(lat, lng);
        return;
      }

      const result = results[0];
      const establishment = result.address_components?.find((c) =>
        c.types.includes("establishment")
      )?.long_name;
      const name = establishment ?? result.formatted_address ?? venueRef.current;
      emitLocation(lat, lng, name);
    });
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
        title: t("venue.dragHint"),
      });
      markerRef.current = marker;
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (!pos) return;
        reverseGeocode(pos.lat(), pos.lng());
      });
    }

    if (pan) {
      map.panTo(position);
      if ((map.getZoom() ?? 0) < 14) map.setZoom(15);
    }
  }

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current || !inputRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    async function init() {
      try {
        setOptions({ key: apiKey!, v: "weekly" });
        const { Map } = (await importLibrary("maps")) as google.maps.MapsLibrary;
        await importLibrary("places");
        await importLibrary("geocoding");

        if (cancelled || !mapContainerRef.current || !inputRef.current) return;

        const startLat = mapsLat ?? DEFAULT_MAP_CENTER.lat;
        const startLng = mapsLng ?? DEFAULT_MAP_CENTER.lng;

        const map = new Map(mapContainerRef.current, {
          center: { lat: startLat, lng: startLng },
          zoom: mapsLat != null ? 15 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        if (mapsLat != null && mapsLng != null) {
          placeMarker(mapsLat, mapsLng, false);
        }

        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();
          if (lat == null || lng == null) return;
          placeMarker(lat, lng, false);
          reverseGeocode(lat, lng);
        });

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
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
          onMapsChangeRef.current({ venue: name, mapsUrl: url, lat, lng });
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
      geocoderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  if (!apiKey) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="venue">{t("venue.venueName")}</Label>
          <Input
            id="venue"
            value={venue}
            onChange={(e) => onVenueChange(e.target.value)}
            placeholder={t("venue.venueName")}
            className="mt-1"
          />
        </div>
        <p className="text-sm text-amber-700">{t("venue.noApiKey")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="venue">{t("admin.venue")}</Label>
        <Input
          id="venue"
          ref={inputRef}
          value={venue}
          onChange={(e) => onVenueChange(e.target.value)}
          placeholder={t("venue.searchPlaceholder")}
          className="mt-1"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-muted">{t("venue.hint")}</p>
        {loadError ? <p className="mt-1 text-xs text-red-600">{loadError}</p> : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border-gold">
        <div ref={mapContainerRef} className="h-72 w-full bg-surface" />
        {!mapsReady ? (
          <p className="border-t border-border-gold bg-transparent px-3 py-2 text-xs text-muted">
            {t("venue.loadingMap")}
          </p>
        ) : null}
      </div>

      {mapsLat != null && mapsLng != null ? (
        <p className="text-xs text-muted">
          {t("venue.pinCoords", {
            lat: mapsLat.toFixed(6),
            lng: mapsLng.toFixed(6),
          })}
        </p>
      ) : (
        <p className="text-xs text-gold-muted">{t("venue.noPin")}</p>
      )}

      <div>
        <Label htmlFor="mapsUrl">{t("venue.mapsLink")}</Label>
        <Input
          id="mapsUrl"
          value={mapsUrl}
          onChange={(e) =>
            onMapsChange({
              venue,
              mapsUrl: e.target.value,
              lat: mapsLat,
              lng: mapsLng,
            })
          }
          placeholder="https://maps.google.com/..."
          className="mt-1"
        />
      </div>
    </div>
  );
}
