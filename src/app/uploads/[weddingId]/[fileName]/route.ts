// Serwuje zdjęcia z galerii (patrz src/lib/photoStorage.ts) - pliki leżą
// w data/uploads/, NIE w public/, bo next start nie widzi plików dopisanych
// do public/ po starcie serwera (patrz obszerny komentarz w photoStorage.ts).
//
// To są zdjęcia z publicznej galerii wesela - każdy, kto zna adres strony
// wesela, i tak może je zobaczyć na /w/<slug>, więc ten route nie sprawdza
// żadnej sesji - jedyna "ochrona" to walidacja formatu id/nazwy pliku
// (musi wyglądać dokładnie tak, jak to, co sami generujemy), żeby ktoś nie
// spróbował `../../` i nie wyszedł poza katalog uploads.

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { photoFilePath } from "@/lib/photoStorage";

const SAFE_ID = /^[a-zA-Z0-9_]+$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ weddingId: string; fileName: string }> }
) {
  const { weddingId, fileName } = await params;

  if (!SAFE_ID.test(weddingId) || !/^[a-zA-Z0-9_]+\.jpg$/.test(fileName)) {
    return NextResponse.json({ error: "Nieprawidłowa ścieżka" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(photoFilePath(weddingId, fileName));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        // Bezpieczne długie cache'owanie - nazwy plików są losowe i nigdy
        // nie są nadpisywane (usunięcie zdjęcia kasuje plik, nie podmienia
        // go pod tą samą nazwą), więc raz pobrany plik zawsze jest aktualny.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Nie znaleziono zdjęcia" }, { status: 404 });
  }
}
