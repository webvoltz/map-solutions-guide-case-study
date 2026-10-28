// One search box for addresses AND raw coordinates.

/** "18.47, -69.89" or "18.47;-69.89" -> { lat, lng }; anything else -> null (try geocoding). */
export function parseCoordinates(query: string): { lat: number; lng: number } | null {
  const q = query.trim();
  if (q.length > 50) return null;
  // A bounded number pattern, so a hostile input can't trigger catastrophic regex backtracking.
  const num = /[+-]?(?:\d+(?:\.\d+)?|\.\d+)/.source;
  const m = new RegExp(`^(${num})\\s*[,;]\\s*(${num})$`).exec(q);
  if (!m) return null;
  const lat = parseFloat(m[1]!), lng = parseFloat(m[2]!);
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? { lat, lng } : null;
}

/**
 * Address suggestions from OpenStreetMap Nominatim: at least 3 characters, 400 ms after the user
 * stops typing, 5 results. Nominatim's public server asks for an identifying User-Agent and at
 * most one request per second, so debounce and cache; use a commercial geocoder at scale.
 */
export async function suggest(query: string, signal: AbortSignal) {
  if (query.trim().length < 3 || parseCoordinates(query)) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return rows.map((r) => ({ lat: +r.lat, lng: +r.lon, label: r.display_name }));
}
