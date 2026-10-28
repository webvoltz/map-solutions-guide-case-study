# Engineering notes

The details that make a map product correct, not just good-looking. Each one is a bug we have either fixed or designed out.

- [Coordinates](#coordinates)
- [Area and distance](#area-and-distance)
- [Storing geometry](#storing-geometry)
- [Spatial indexes](#spatial-indexes)
- [External data and services](#external-data-and-services)
- [Performance](#performance)
- [Testing](#testing)
- [Known limits in the reference project](#known-limits-in-the-reference-project)

---

## Coordinates

- **One coordinate system: WGS 84 (EPSG:4326).** It's what GPS, GeoJSON and every web map use. Store it, send it, and project only for display.
- **Longitude first, everywhere inside the system.** GeoJSON and WKT are `[lng, lat]`; many forms and spreadsheets are "lat, lng". Convert once at the edges (forms, search, CSV import), never in the middle.
- **Validate ranges** (latitude −90 to 90, longitude −180 to 180) at every boundary that accepts coordinates, and close polygon rings (the first point repeated last) before storing them.

## Area and distance

- **Measure on the Earth, not on the screen.** Web maps use Web Mercator, which inflates areas away from the equator: a square in Norway looks four times larger than the same square near the equator. Turf measures area and distance on the ellipsoid.
- **Recalculate on the server** whenever a shape changes. The browser's number is for the user's feedback; the server's is the record.
- **Pick the right reference point.** A zone's distance to the coast is its nearest corner's, not its centroid's.

## Storing geometry

- **Use the database's geometry type**, not text or JSON columns. PostGIS (`geometry(Polygon, 4326)`) is our default; SQL Server's `geometry` type works too, and the reference project runs on it because the client already did.
- **Convert at the ORM boundary.** In the reference project, GeoJSON from the API is turned into WKT with SRID 4326 as it's written, and back into GeoJSON as it's read, so application code only ever sees GeoJSON.

## Spatial indexes

- A spatial index (GIST on PostGIS, a grid index on SQL Server) makes "which zone contains this point" a fast lookup instead of a scan of every zone ([`pointLookup.sql`](examples/lookup/pointLookup.sql)).
- Choose the predicate on purpose. `ST_Covers` includes points exactly on the edge; `ST_Contains` doesn't. For a lookup API, a point on the boundary between two zones should match one of them, not neither.

## External data and services

| Service | What to respect |
| --- | --- |
| Mapbox basemaps and geocoding | Attribution must stay visible; tokens are scoped and restricted by URL |
| OpenStreetMap Nominatim | At most one request per second, an identifying User-Agent, caching |
| OpenStreetMap Overpass | Small bounding boxes, pauses between requests, mirrors and exponential backoff |
| OpenStreetMap data | ODbL: credit "© OpenStreetMap contributors" |
| Natural Earth | Public domain; good for overviews, too coarse for distances under a few km |

Every external call is optional to the core product: if geocoding fails, zones still load and the lookup still returns the zone and distance.

## Performance

- **Style on the GPU.** One data-driven expression colours every zone; there are no per-zone layers.
- **Debounce user input** that triggers network calls (search, live distance) by 400–500 ms.
- **Batch writes.** The API accepts up to 100 zones in one transaction and reports exactly which ones failed.
- **When data grows:** GeoJSON sources are right up to tens of thousands of features. Past that we move to vector tiles, server-side clustering, and loading only what's in view.

## Testing

- Geometry helpers (grid cells, area, coordinate parsing, distance) are pure functions, which makes them easy to test in isolation.
- Worth covering on any map project: the antimeridian, high latitudes, rings that aren't closed, coordinates out of range, and a lookup whose geocoder is down.
- The reference project has about 1,350 test cases across its frontend and backend (Vitest), counted from the test files.

## Known limits in the reference project

Stated openly, with the fix for each:

| Limit | Upgrade path |
| --- | --- |
| Distance to coast scans every coastline line in memory, O(corners × lines) | Fetch only nearby lines through the spatial index |
| The frontend loads up to 1,000 zones in one request | Load by visible map area, or switch to vector tiles |
| Ratings are set by hand (0–6) | Derive them from data layers when the client has them |
| Legend and map fill used different colour bands | One shared band definition ([`riskLayer.tsx`](examples/styling/riskLayer.tsx)) |
