// Free-form zones with Mapbox GL Draw: one polygon at a time, area recalculated on every edit.

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import type { Map } from 'mapbox-gl';

export function attachPolygonDrawing(map: Map, onArea: (km2: number, polygon: GeoJSON.Polygon) => void) {
  // No default toolbar: the product's own panel decides when drawing starts.
  const draw = new MapboxDraw({ displayControlsDefault: false, defaultMode: 'draw_polygon' });
  map.addControl(draw);

  const update = () => {
    const all = draw.getAll();
    // keep exactly one polygon: a new shape replaces the previous one
    if (all.features.length > 1) draw.delete(all.features.slice(0, -1).map((f) => String(f.id)));
    const shape = draw.getAll().features[0];
    if (shape?.geometry.type === 'Polygon') {
      // turf.area measures on the ellipsoid in m², so a zone near the equator and one near the
      // poles are compared fairly. Never compute area from screen pixels or raw degrees.
      onArea(turf.area(shape) / 1_000_000, shape.geometry);
    }
  };
  map.on('draw.create', update);
  map.on('draw.update', update);
  return draw;
}

// Editing an existing zone uses the same control: load its polygon and switch to
// `direct_select`, so each corner can be dragged; the area updates through the same handler.
