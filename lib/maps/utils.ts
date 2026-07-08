export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export const DEFAULT_MAP_CENTER = { lat: 29.3759, lng: 47.9774 }; // Kuwait City
