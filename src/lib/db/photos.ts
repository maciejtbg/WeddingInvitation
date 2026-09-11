// Metadane galerii zdjęć - same pliki są na dysku, patrz src/lib/photoStorage.ts
// (tam też twardy limit liczby zdjęć i limity wagi - ten plik tego NIE
// pilnuje, to świadomie zadanie warstwy wyżej, żeby sprawdzenie limitu
// i zapis pliku były zawsze wykonywane razem, atomowo z punktu widzenia
// wywołującego kodu).

import { db, newId } from "./client";
import type { SqliteRow, WeddingPhoto } from "./types";

function rowToPhoto(row: SqliteRow): WeddingPhoto {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    uploadedByGuestId: row.uploaded_by_guest_id as string | null,
    fileName: row.file_name as string,
    byteSize: row.byte_size as number,
    coverOrder: row.cover_order as number | null,
    createdAt: row.created_at as string,
  };
}

export function listPhotos(weddingId: string): WeddingPhoto[] {
  const rows = db
    .prepare("SELECT * FROM wedding_photos WHERE wedding_id = ? ORDER BY created_at ASC")
    .all(weddingId);
  return rows.map(rowToPhoto);
}

export function countPhotos(weddingId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) as n FROM wedding_photos WHERE wedding_id = ?")
    .get(weddingId) as { n: number };
  return row.n;
}

/** RODO - potrzebne do prawa do usunięcia wywoływanego przez samego gościa
 * (patrz guestDeleteSelf w src/lib/db/guests.ts) - trzeba wiedzieć, KTÓRE
 * zdjęcia na dysku są jego, żeby skasować je OSOBNO przed skasowaniem
 * wiersza gościa (kaskada bazy dla uploaded_by_guest_id to SET NULL, nie
 * CASCADE - inaczej zdjęcie zostałoby "osierocone" w galerii bez wiersza
 * na dysku do skasowania). */
export function listPhotosByGuest(weddingId: string, guestId: string): WeddingPhoto[] {
  const rows = db
    .prepare(
      "SELECT * FROM wedding_photos WHERE wedding_id = ? AND uploaded_by_guest_id = ? ORDER BY created_at ASC"
    )
    .all(weddingId, guestId);
  return rows.map(rowToPhoto);
}

export function findPhotoById(weddingId: string, photoId: string): WeddingPhoto | null {
  const row = db
    .prepare("SELECT * FROM wedding_photos WHERE id = ? AND wedding_id = ?")
    .get(photoId, weddingId);
  return row ? rowToPhoto(row) : null;
}

export function createPhotoRecord(params: {
  weddingId: string;
  uploadedByGuestId: string | null;
  fileName: string;
  byteSize: number;
}): WeddingPhoto {
  const id = newId("photo");
  db.prepare(
    `INSERT INTO wedding_photos (id, wedding_id, uploaded_by_guest_id, file_name, byte_size)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, params.weddingId, params.uploadedByGuestId, params.fileName, params.byteSize);
  const photo = findPhotoById(params.weddingId, id);
  if (!photo) throw new Error("Nie udało się zapisać zdjęcia");
  return photo;
}

/** Zwraca usunięty rekord (żeby wywołujący mógł skasować plik z dysku pod
 * tą samą nazwą) albo null, jeśli nic nie pasowało. */
export function deletePhoto(weddingId: string, photoId: string): WeddingPhoto | null {
  const photo = findPhotoById(weddingId, photoId);
  if (!photo) return null;
  db.prepare("DELETE FROM wedding_photos WHERE id = ? AND wedding_id = ?").run(photoId, weddingId);
  return photo;
}

/** Zdjęcia wybrane przez parę jako pełnoekranowe tło "powitalne" na stronie
 * głównej zaproszenia (patrz src/app/[slug]/page.tsx) - podzbiór zwykłej
 * galerii, w kolejności rotacji. */
export function listCoverPhotos(weddingId: string): WeddingPhoto[] {
  const rows = db
    .prepare(
      "SELECT * FROM wedding_photos WHERE wedding_id = ? AND cover_order IS NOT NULL ORDER BY cover_order ASC"
    )
    .all(weddingId);
  return rows.map(rowToPhoto);
}

export function countCoverPhotos(weddingId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) as n FROM wedding_photos WHERE wedding_id = ? AND cover_order IS NOT NULL")
    .get(weddingId) as { n: number };
  return row.n;
}

/** Dodaje/usuwa zdjęcie z rotacji tła strony głównej. Kolejność to po
 * prostu numer kolejnego wolnego miejsca (nie da się ręcznie przestawiać -
 * przy najwyżej kilku zdjęciach na raz to niepotrzebny przerost formy). */
export function setCoverPhoto(weddingId: string, photoId: string, isCover: boolean): void {
  if (!isCover) {
    db.prepare("UPDATE wedding_photos SET cover_order = NULL WHERE id = ? AND wedding_id = ?").run(
      photoId,
      weddingId
    );
    return;
  }
  const row = db
    .prepare("SELECT MAX(cover_order) as maxOrder FROM wedding_photos WHERE wedding_id = ?")
    .get(weddingId) as { maxOrder: number | null };
  const nextOrder = (row.maxOrder ?? -1) + 1;
  db.prepare("UPDATE wedding_photos SET cover_order = ? WHERE id = ? AND wedding_id = ?").run(
    nextOrder,
    photoId,
    weddingId
  );
}
