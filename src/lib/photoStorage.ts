// Galeria zdjęć - placeholder do czasu podłączenia Cloudflare R2 (patrz
// README, sekcja "Galeria zdjęć"). Świadome decyzje, żeby to NIE zapchało
// taniego hostingu (mikr.us) ani nie podbiło kosztów:
//
//  - twardy limit MAX_PHOTOS_PER_WEDDING zdjęć na wesele (globalnie, nie na
//    gościa - to jedna wspólna galeria),
//  - każde zdjęcie jest przeskalowane i przekompresowane po stronie
//    serwera, niezależnie od tego, ile ważyło na wejściu (telefon potrafi
//    wrzucić zdjęcie 8-15 MB) - docelowo mieści się w kilkuset KB,
//  - zawsze re-encode do JPEG bez metadanych (sharp domyślnie NIE
//    przepisuje EXIF przy .jpeg()) - przy okazji ucina dane lokalizacji
//    GPS, które telefony często dopisują do zdjęć, a goście niekoniecznie
//    chcieliby upubliczniać.
//
// Pliki lądują w data/uploads/<weddingId>/ (zwykły system plików, nie R2) -
// działa dobrze na VPS-ie (mikr.us), NIE zadziała na hostingu
// bezserwerowym typu Vercel (system plików tam jest tymczasowy/tylko do
// odczytu w runtime) - dokładnie to samo ograniczenie co już mamy przy
// SQLite (data/dev.db), patrz komentarz w src/lib/db/client.ts.
//
// UWAGA - to NIE jest public/uploads/: próbowałem najpierw pisać prosto do
// public/, licząc na to, że Next.js serwuje ten katalog jak zwykły system
// plików. W `next dev` faktycznie tak działa, ale w `next start` (tryb
// produkcyjny, ten na który realnie wdrożymy) pliki dopisane do public/ PO
// starcie serwera dostają 404 - lista statycznych plików jest ustalana
// wcześniej, nie odświeżana na żywo. Złapane empirycznie przez test e2e.
// Rozwiązanie: pliki poza public/, serwowane przez własny route handler
// (src/app/uploads/[weddingId]/[fileName]/route.ts), który po prostu
// czyta je z dysku na żądanie - działa identycznie w dev i w produkcji.

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { newId } from "./db/client";
import { countPhotos, createPhotoRecord, deletePhoto as deletePhotoRecord } from "./db/photos";
import type { WeddingPhoto } from "./db/types";

export const MAX_PHOTOS_PER_WEDDING = 10;
// Odrzucane PRZED przetwarzaniem - żeby nie próbować dekodować w pamięci
// czegoś absurdalnie dużego.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const MAX_DIMENSION = 1600;
const TARGET_MAX_OUTPUT_BYTES = 350 * 1024;
// Kolejne próby kompresji, od najlepszej jakości - zatrzymujemy się na
// pierwszej, która mieści się w docelowym rozmiarze.
const QUALITY_STEPS = [75, 60, 45, 32];

function uploadsDir(weddingId: string): string {
  return path.join(process.cwd(), "data", "uploads", weddingId);
}

/** Ścieżka na dysku pliku zdjęcia - do użytku WYŁĄCZNIE przez route handler
 * serwujący zdjęcia (src/app/uploads/[weddingId]/[fileName]/route.ts). */
export function photoFilePath(weddingId: string, fileName: string): string {
  return path.join(uploadsDir(weddingId), fileName);
}

export function photoUrl(weddingId: string, fileName: string): string {
  return `/uploads/${weddingId}/${fileName}`;
}

async function compressImage(buffer: Buffer): Promise<Buffer> {
  const base = sharp(buffer)
    .rotate() // uwzględnia orientację EXIF z telefonu PRZED jej odcięciem
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

  let lastOutput: Buffer | null = null;
  for (const quality of QUALITY_STEPS) {
    const output = await base.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    lastOutput = output;
    if (output.byteLength <= TARGET_MAX_OUTPUT_BYTES) return output;
  }
  // Nawet przy najniższej próbowanej jakości zdjęcie się nie zmieściło
  // (bardzo złożona/szczegółowa treść) - i tak jest wielokrotnie mniejsze
  // od oryginału, lepsze to niż odrzucić zdjęcie gościa.
  return lastOutput as Buffer;
}

/** Sprawdza limit liczby zdjęć, kompresuje i zapisuje na dysku, zapisuje
 * metadane w bazie. Rzuca czytelny błąd po polsku (do pokazania gościowi/
 * parze), jeśli coś nie pozwala kontynuować.
 *
 * UWAGA: sprawdzenie limitu i zapis nie są jedną atomową operacją bazodanową
 * (node:sqlite jest synchroniczne, ale kompresja obrazu jest asynchroniczna
 * i mogłaby przeplatać się z innym równoległym uploadem) - przy dwóch
 * uploadach w tej samej milisekundzie teoretycznie mogłoby przejść 11
 * zamiast 10. Dla skali "galeria na wesele" to akceptowalne ryzyko, nie
 * wymaga blokady/transakcji. */
export async function uploadPhoto(params: {
  weddingId: string;
  uploadedByGuestId: string | null;
  originalBuffer: Buffer;
  originalByteSize: number;
}): Promise<WeddingPhoto> {
  if (params.originalByteSize > MAX_UPLOAD_BYTES) {
    throw new Error(`Plik jest za duży (maks. ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB)`);
  }
  if (countPhotos(params.weddingId) >= MAX_PHOTOS_PER_WEDDING) {
    throw new Error(`Galeria jest już pełna (maks. ${MAX_PHOTOS_PER_WEDDING} zdjęć)`);
  }

  let compressed: Buffer;
  try {
    compressed = await compressImage(params.originalBuffer);
  } catch {
    throw new Error("Nie udało się odczytać tego pliku jako zdjęcia - spróbuj inny plik");
  }

  const dir = uploadsDir(params.weddingId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${newId("img")}.jpg`;
  await fs.writeFile(path.join(dir, fileName), compressed);

  return createPhotoRecord({
    weddingId: params.weddingId,
    uploadedByGuestId: params.uploadedByGuestId,
    fileName,
    byteSize: compressed.byteLength,
  });
}

export async function removePhoto(weddingId: string, photoId: string): Promise<void> {
  const photo = deletePhotoRecord(weddingId, photoId);
  if (!photo) return;
  await fs.unlink(path.join(uploadsDir(weddingId), photo.fileName)).catch(() => {
    // Plik już nie istnieje / nie da się usunąć - rekord w bazie już zniknął,
    // nie ma powodu wywalać błędu na tym etapie (sierota na dysku to
    // najwyżej kilkaset KB, nie problem wart przerywania operacji).
  });
}
