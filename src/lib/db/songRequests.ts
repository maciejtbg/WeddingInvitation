// Lista życzeń muzycznych - wspólna, widoczna dla wszystkich gości (jak
// wspólna playlista), para moderuje z /admin/music. Wyszukiwanie utworów
// (iTunes Search API) jest w src/lib/musicSearch.ts, ten plik to tylko
// zapisane w bazie prośby.

import { db, newId } from "./client";
import type { SongRequest, SqliteRow } from "./types";

function rowToRequest(row: SqliteRow): SongRequest {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    guestId: row.guest_id as string | null,
    trackName: row.track_name as string,
    artistName: row.artist_name as string,
    artworkUrl: row.artwork_url as string | null,
    previewUrl: row.preview_url as string | null,
    externalUrl: row.external_url as string | null,
    createdAt: row.created_at as string,
  };
}

export function listSongRequests(weddingId: string): SongRequest[] {
  const rows = db
    .prepare("SELECT * FROM song_requests WHERE wedding_id = ? ORDER BY created_at DESC")
    .all(weddingId);
  return rows.map(rowToRequest);
}

export function createSongRequest(params: {
  weddingId: string;
  guestId: string | null;
  trackName: string;
  artistName: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
}): SongRequest {
  const id = newId("song");
  db.prepare(
    `INSERT INTO song_requests
       (id, wedding_id, guest_id, track_name, artist_name, artwork_url, preview_url, external_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.weddingId,
    params.guestId,
    params.trackName,
    params.artistName,
    params.artworkUrl,
    params.previewUrl,
    params.externalUrl
  );
  const row = db.prepare("SELECT * FROM song_requests WHERE id = ?").get(id);
  if (!row) throw new Error("Nie udało się zapisać prośby o piosenkę");
  return rowToRequest(row);
}

export function deleteSongRequest(weddingId: string, requestId: string): void {
  db.prepare("DELETE FROM song_requests WHERE id = ? AND wedding_id = ?").run(requestId, weddingId);
}
