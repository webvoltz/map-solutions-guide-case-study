// Fixed-size grid cells: one click drops a square of a known size, centred on the point.
// Lifted from a shipped zoning tool (sizes 100 m, 200 m, 500 m and 1 km).

/**
 * A square cell of `sizeKm` centred on `[lng, lat]`, as a GeoJSON polygon.
 * A degree of latitude is ~111 km everywhere; a degree of longitude shrinks with cos(latitude),
 * so the cell stays square on the ground instead of on the screen.
 */
export function gridCell(center: [number, number], sizeKm: number): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const halfLat = sizeKm / 2 / 111;
  const halfLng = sizeKm / 2 / (111 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [
    [lng - halfLng, lat - halfLat],
    [lng + halfLng, lat - halfLat],
    [lng + halfLng, lat + halfLat],
    [lng - halfLng, lat + halfLat],
    [lng - halfLng, lat - halfLat], // GeoJSON rings close on their first point
  ];
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} };
}

// ponytail: the 111 km/degree approximation is fine for cells up to a few km; for large cells or
// polar latitudes, build the square with turf.destination on the ellipsoid instead.

// UX detail that matters: a 100 m cell is invisible at country zoom. The product flies the map to
// zoom 14 first when the user picks 100 m and is zoomed out further, then places the cell.
