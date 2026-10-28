// A choropleth in one data-driven expression: the GPU colours each zone from its own score.
// No per-zone layers, no re-render when a score changes, only new data.

import { Layer, Source } from 'react-map-gl';

const RISK_COLOR = [
  'case',
  ['>=', ['get', 'score'], 5], '#dc2626', // high
  ['>=', ['get', 'score'], 3], '#ea580c', // medium
  '#22c55e',                              // low
] as const;

export function ZonesLayer({ zones }: { zones: GeoJSON.FeatureCollection }) {
  return (
    <Source id="zones" type="geojson" data={zones}>
      <Layer id="zones-fill" type="fill" paint={{ 'fill-color': RISK_COLOR as never, 'fill-opacity': 0.6 }} />
      <Layer id="zones-line" type="line" paint={{ 'line-color': RISK_COLOR as never, 'line-width': 3 }} />
    </Source>
  );
}

// Keep the legend, the popup and this expression on ONE shared scale. A lesson from a shipped
// project: its fill used 5 tiers while the legend showed 3, so a "3" read orange in the legend and
// yellow on the map. Define the bands once, as below, and derive all three from them.
export const RISK_BANDS = [
  { label: 'Low', min: 0, max: 2, color: '#22c55e' },
  { label: 'Medium', min: 3, max: 4, color: '#ea580c' },
  { label: 'High', min: 5, max: 6, color: '#dc2626' },
];
