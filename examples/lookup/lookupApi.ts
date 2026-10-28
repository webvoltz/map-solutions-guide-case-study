// One endpoint, three answers for any point: the zone it falls in, the distance to the coast,
// and a street address. Each part degrades on its own, so a geocoder outage never hides the zone.

import type { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

export const lookupValidation = [
  body('lng').isFloat({ min: -180, max: 180 }),
  body('lat').isFloat({ min: -90, max: 90 }),
];

export async function lookup(req: Request, res: Response) {
  if (!validationResult(req).isEmpty()) return res.status(400).json({ error: 'INVALID_COORDINATES' });
  const { lng, lat } = req.body as { lng: number; lat: number };

  const [zone, distance, address] = await Promise.allSettled([
    findZoneAt(lng, lat),            // pointLookup.sql
    distanceToCoastMeters(lng, lat), // distanceToCoast.ts
    reverseGeocode(lng, lat),        // best effort
  ]);

  res.json({
    point: { type: 'Point', coordinates: [lng, lat] },
    zone: zone.status === 'fulfilled' ? zone.value : null,
    zoneMatched: zone.status === 'fulfilled' && zone.value !== null,
    distanceFromCoast: distance.status === 'fulfilled' ? distance.value : null,
    address: address.status === 'fulfilled' ? address.value : null,
  });
}

declare function findZoneAt(lng: number, lat: number): Promise<{ id: string; name: string; score: number } | null>;
declare function distanceToCoastMeters(lng: number, lat: number): Promise<number | null>;
declare function reverseGeocode(lng: number, lat: number): Promise<string | null>;
