// Distance from a point (or the nearest corner of a zone) to the nearest coastline, in metres.

import * as turf from '@turf/turf';

export function pointToCoastMeters(point: [number, number], coastlines: GeoJSON.LineString[]): number | null {
  if (!coastlines.length) return null;
  const p = turf.point(point);
  let best = Infinity;
  for (const line of coastlines) {
    best = Math.min(best, turf.pointToLineDistance(p, line, { units: 'meters' }));
  }
  return best === Infinity ? null : best;
}

/** A zone's distance is its closest corner's, not its centre's: a big zone touching the coast is 0 m away. */
export function polygonToCoastMeters(polygon: GeoJSON.Polygon, coastlines: GeoJSON.LineString[]): number | null {
  const ds = polygon.coordinates[0].map((c) => pointToCoastMeters(c as [number, number], coastlines));
  const valid = ds.filter((d): d is number => d !== null);
  return valid.length ? Math.min(...valid) : null;
}

// ponytail: this scans every coastline line in memory, O(corners × lines). Fine for a region's
// worth of coastline; for a continent, pre-filter with the spatial index (ST_DWithin / STDistance on
// a bounding box around the point) and only measure the handful of nearby lines.
