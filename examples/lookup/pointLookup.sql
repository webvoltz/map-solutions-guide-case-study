-- "Which zone is this point in?" answered by the database, using its spatial index.
-- The same query on the two engines we've shipped it on. Coordinates are WGS 84 (SRID 4326).

-- SQL Server (geometry type)
CREATE SPATIAL INDEX zones_polygon_idx ON zones(polygon)
  USING GEOMETRY_AUTO_GRID WITH (BOUNDING_BOX = (-180, -90, 180, 90));

SELECT TOP 1 id, name, score
FROM zones
WHERE polygon.STIntersects(geometry::STGeomFromText(@point_wkt, 4326)) = 1;   -- 'POINT(lng lat)'

-- PostgreSQL + PostGIS
CREATE INDEX zones_polygon_idx ON zones USING GIST (polygon);

SELECT id, name, score
FROM zones
WHERE ST_Covers(polygon, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))      -- covers = includes the edge
LIMIT 1;

-- WKT and GeoJSON both write longitude first. Most lat/lng bugs on map projects are an
-- array that was [lat, lng] in one layer and [lng, lat] in the next.
