// RODO - "ograniczenie przechowywania" (art. 5 ust. 1 lit. e), patrz
// src/lib/dataRetention.ts. Ta trasa istnieje, bo aplikacja Next.js nie ma
// własnego, trwałego procesu w tle, który mógłby sam odpalić się raz
// dziennie - trzeba to zaplanować z ZEWNĄTRZ (cron na hostingu, patrz
// scripts/purge-expired-data.mjs i README, sekcja RODO).
//
// Zabezpieczone współdzielonym sekretem (nie sesją pary) - cron nie ma
// ciasteczka sesji, a to musi działać bez logowania w przeglądarce. Bez
// ustawionego RETENTION_PURGE_SECRET trasa jest CAŁKOWICIE wyłączona (zwraca
// 503), żeby ktoś przez pomyłkę nie zostawił jej otwartej na produkcji.

import { NextRequest, NextResponse } from "next/server";
import { purgeAllExpiredWeddings } from "@/lib/dataRetention";

export async function POST(request: NextRequest) {
  const secret = process.env.RETENTION_PURGE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "RETENTION_PURGE_SECRET nie jest ustawiony - trasa wyłączona" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });
  }

  const results = await purgeAllExpiredWeddings();
  return NextResponse.json({ purged: results.length, weddings: results });
}
