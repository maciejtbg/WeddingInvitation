// Miejsca (ceremonia/przyjęcie/poprawiny/inne) pokazywane gościom na mapie
// OpenStreetMap - patrz src/lib/locationKinds.ts. W odróżnieniu od reszty
// plików w tym katalogu nie ma tu podziału admin*/guest*: to nie są dane
// prywatne, mają być widoczne wszystkim gościom wesela (i każdy, kto zna
// slug wesela, i tak widzi publiczną stronę) - jedyna ochrona to możliwość
// EDYCJI, zarezerwowana dla zalogowanej pary w Server Actions.

import { db, newId } from "./client";
import type { LocationKind, SqliteRow, WeddingLocation } from "./types";

function rowToLocation(row: SqliteRow): WeddingLocation {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    kind: row.kind as LocationKind,
    label: row.label as string,
    address: row.address as string | null,
    lat: row.lat as number,
    lng: row.lng as number,
    createdAt: row.created_at as string,
  };
}

export function listLocations(weddingId: string): WeddingLocation[] {
  const rows = db
    .prepare("SELECT * FROM wedding_locations WHERE wedding_id = ? ORDER BY created_at ASC")
    .all(weddingId);
  return rows.map(rowToLocation);
}

export function findLocationById(weddingId: string, locationId: string): WeddingLocation | null {
  const row = db
    .prepare("SELECT * FROM wedding_locations WHERE id = ? AND wedding_id = ?")
    .get(locationId, weddingId);
  return row ? rowToLocation(row) : null;
}

export function createLocation(params: {
  weddingId: string;
  kind: LocationKind;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
}): WeddingLocation {
  const id = newId("loc");
  db.prepare(
    `INSERT INTO wedding_locations (id, wedding_id, kind, label, address, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, params.weddingId, params.kind, params.label, params.address, params.lat, params.lng);
  const location = findLocationById(params.weddingId, id);
  if (!location) throw new Error("Nie udało się dodać miejsca");
  return location;
}

export function deleteLocation(weddingId: string, locationId: string): void {
  db.prepare("DELETE FROM wedding_locations WHERE id = ? AND wedding_id = ?").run(
    locationId,
    weddingId
  );
}
