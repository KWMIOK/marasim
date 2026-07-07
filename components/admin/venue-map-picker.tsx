"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onMapsChange: (data: {
    venue: string;
    mapsUrl: string;
    lat: number | null;
    lng: number | null;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;

    async function init() {
      setOptions({ key: apiKey!, v: "weekly", libraries: ["places"] });
      await importLibrary("places");
      if (!inputRef.current) return;

      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["name", "formatted_address", "geometry", "url"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();
        if (!place?.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.name ?? place.formatted_address ?? "";
        const url =
          place.url ??
          `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

        onMapsChange({ venue: name, mapsUrl: url, lat, lng });
      });

      setMapsReady(true);
    }

    init();

    return () => {
      autocomplete = null;
    };
  }, [apiKey, onMapsChange]);

  const embedPreview =
    mapsLat != null && mapsLng != null
      ? `https://www.google.com/maps?q=${mapsLat},${mapsLng}&z=15&output=embed`
      : null;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          ref={inputRef}
          value={venue}
          onChange={(e) => onVenueChange(e.target.value)}
          placeholder={
            apiKey
              ? "Search venue on Google Maps…"
              : "Venue name (add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map search)"
          }
          className="mt-1"
        />
        {apiKey && mapsReady ? (
          <p className="mt-1 text-xs text-green-600">Map search enabled</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="mapsUrl">Google Maps link</Label>
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

      {embedPreview ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <iframe
            title="Venue map preview"
            src={embedPreview}
            className="h-48 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  );
}
