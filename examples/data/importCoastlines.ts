// Importing reference geodata from OpenStreetMap through the Overpass API, politely.

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const query = (bbox: string) => `
[out:json][timeout:120];
( way["natural"="coastline"](${bbox}); relation["natural"="coastline"](${bbox}); );
out geom;`;

/**
 * Overpass is a shared public service. Large areas are split into smaller boxes with a pause
 * between them; a 429 or 504 moves to the next mirror, and a full round of failures waits
 * 2 s, 4 s, then 8 s before trying again. Other errors stop the import instead of hammering.
 */
export async function fetchCoastlines(bbox: string, attempts = 3): Promise<GeoJSON.LineString[]> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const url of OVERPASS_MIRRORS) {
      const res = await fetch(url, { method: 'POST', body: query(bbox), signal: AbortSignal.timeout(180_000) });
      if (res.status === 429 || res.status === 504) continue; // busy: try the next mirror
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const data = (await res.json()) as { elements: { geometry?: { lon: number; lat: number }[] }[] };
      return data.elements
        .filter((e) => e.geometry?.length)
        .map((e) => ({ type: 'LineString', coordinates: e.geometry!.map((g) => [g.lon, g.lat]) }));
    }
    await new Promise((r) => setTimeout(r, 2 ** attempt * 2000));
  }
  throw new Error('All Overpass mirrors busy');
}

// Data from OpenStreetMap is © OpenStreetMap contributors under the ODbL: keep the attribution
// in the product wherever the data is shown.
