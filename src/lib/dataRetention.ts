// RODO - "ograniczenie przechowywania" (art. 5 ust. 1 lit. e). Para nie
// potrzebuje trzymać danych gości długo po ślubie - ten moduł znajduje
// wesela, którym minął ustawiony okres retencji (weddingDate +
// dataRetentionDays), i czyści z nich dane osobowe GOŚCI (nie samo wesele -
// para może zachować swoją stronę, motyw, harmonogram, FAQ, tak długo jak
// chce, to jej własne dane, którymi zarządza przez konto).
//
// Czyszczone jest: wszystkie zdjęcia (dysk + baza, mogą przedstawiać
// rozpoznawalne osoby), wszyscy goście (kaskada bazy sama usuwa przy okazji
// wiadomości czatu, przypisania miejsc i prośby o zmianę miejsca - patrz
// ON DELETE CASCADE w src/lib/db/client.ts). Piosenki zostają (nie są
// danymi osobowymi same w sobie), ale tracą powiązanie z gościem (ON DELETE
// SET NULL na song_requests.guest_id).
//
// UWAGA: ten proces Next.js nie ma własnego, trwałego workera w tle - nie
// ma tu "setInterval, który sam coś odpali za tydzień". Wywołanie tej
// funkcji trzeba zaplanować z zewnątrz:
//  - scripts/purge-expired-data.mjs uruchamiany np. raz dziennie z crona
//    (patrz README, sekcja RODO) - zalecany sposób na produkcji,
//  - albo ręczny przycisk "Wyczyść teraz" w panelu pary
//    (src/app/admin/privacy/page.tsx) dla par, które nie skonfigurowały crona.

import { db } from "./db/client";
import { adminListGuests, adminDeleteGuest } from "./db/guests";
import { markWeddingPurged } from "./db/weddings";
import { removeAllPhotosForWedding } from "./photoStorage";
import type { Wedding } from "./db/types";

function rowToWedding(row: Record<string, unknown>): Wedding {
  return {
    id: row.id as string,
    coupleId: row.couple_id as string,
    slug: row.slug as string,
    partner1Name: row.partner1_name as string,
    partner2Name: row.partner2_name as string,
    weddingDate: row.wedding_date as string | null,
    venueName: row.venue_name as string | null,
    venueAddress: row.venue_address as string | null,
    story: row.story as string | null,
    videoUrl: row.video_url as string | null,
    theme: row.theme as Wedding["theme"],
    invitationCardVariant: row.invitation_card_variant as Wedding["invitationCardVariant"],
    seatingMode: row.seating_mode as Wedding["seatingMode"],
    giftNote: row.gift_note as string | null,
    dataRetentionDays: row.data_retention_days as number,
    purgedAt: row.purged_at as string | null,
    publishedAt: row.published_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Wesela, którym minął okres retencji, a jeszcze nie zostały wyczyszczone -
 * porównanie dat po stronie SQLite (julianday), nie w JS, żeby nie trzeba
 * było wczytywać wszystkich wesel do pamięci, żeby odfiltrować jedno pole. */
export function findWeddingsPastRetention(): Wedding[] {
  const rows = db
    .prepare(
      `SELECT * FROM weddings
       WHERE wedding_date IS NOT NULL
         AND purged_at IS NULL
         AND julianday('now') > julianday(wedding_date) + data_retention_days`
    )
    .all();
  return rows.map((r) => rowToWedding(r as Record<string, unknown>));
}

/** Czyści dane gości JEDNEGO wesela i oznacza je jako wyczyszczone -
 * używane zarówno przez automatyczny skrypt, jak i ręczny przycisk
 * "Wyczyść teraz" w panelu pary (ten drugi celowo pomija sprawdzenie daty -
 * para może chcieć wyczyścić dane wcześniej, np. zaraz po weselu). */
export async function purgeWeddingGuestData(weddingId: string): Promise<{ guestsDeleted: number }> {
  await removeAllPhotosForWedding(weddingId);
  const guests = adminListGuests(weddingId);
  for (const guest of guests) {
    adminDeleteGuest(weddingId, guest.id);
  }
  markWeddingPurged(weddingId);
  return { guestsDeleted: guests.length };
}

/** Przechodzi po WSZYSTKICH weselach, którym minął okres retencji -
 * wywoływane przez scripts/purge-expired-data.mjs (patrz komentarz u góry
 * pliku). Zwraca podsumowanie do zalogowania przez skrypt wywołujący. */
export async function purgeAllExpiredWeddings(): Promise<
  { weddingId: string; slug: string; guestsDeleted: number }[]
> {
  const expired = findWeddingsPastRetention();
  const results: { weddingId: string; slug: string; guestsDeleted: number }[] = [];
  for (const wedding of expired) {
    const { guestsDeleted } = await purgeWeddingGuestData(wedding.id);
    results.push({ weddingId: wedding.id, slug: wedding.slug, guestsDeleted });
  }
  return results;
}
