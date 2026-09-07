// WAŻNE - podział funkcji w tym pliku jest świadomy i chroni prywatność gości:
//
//  - funkcje z przedrostkiem `admin*` zwracają PEŁNE dane (całą listę gości,
//    prywatne notatki pary typu groupLabel) - wolno je wywoływać WYŁĄCZNIE
//    z tras zabezpieczonych sesją pary (requireCoupleSession, patrz
//    src/lib/auth/couple.ts), nigdy z tras dostępnych dla gościa.
//
//  - funkcje z przedrostkiem `guest*` zwracają lub modyfikują dane TYLKO
//    jednego, konkretnego gościa wskazanego przez jego własne id z sesji
//    (requireGuestSession) - nie da się nimi pobrać ani zmienić danych
//    innego gościa, nawet znając jego id, bo zapytania SQL zawsze filtrują
//    dodatkowo po guestId z sesji.
//
// Innymi słowy: to nie jest kwestia "ukrycia" czegoś w interfejsie, tylko
// fizycznego braku zapytania, które zwróciłoby więcej niż powinno.

import { db, newId, newGuestToken, newGuestShortCode } from "./client";
import type { Guest, GuestSelfView, RsvpStatus, SqliteRow } from "./types";

function rowToGuest(row: SqliteRow): Guest {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    token: row.token as string,
    shortCode: row.short_code as string | null,
    firstName: row.first_name as string,
    lastName: row.last_name as string | null,
    groupLabel: row.group_label as string | null,
    groupId: row.group_id as string | null,
    allowPlusOne: !!row.allow_plus_one,
    plusOneName: row.plus_one_name as string | null,
    rsvpStatus: row.rsvp_status as RsvpStatus,
    rsvpRespondedAt: row.rsvp_responded_at as string | null,
    dietaryNotes: row.dietary_notes as string | null,
    phone: row.phone as string | null,
    email: row.email as string | null,
    firstVisitedAt: row.first_visited_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toSelfView(g: Guest): GuestSelfView {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    allowPlusOne: g.allowPlusOne,
    plusOneName: g.plusOneName,
    rsvpStatus: g.rsvpStatus,
    dietaryNotes: g.dietaryNotes,
  };
}

// --- Dostęp administracyjny (konto pary) ---

export function adminListGuests(weddingId: string): Guest[] {
  const rows = db
    .prepare("SELECT * FROM guests WHERE wedding_id = ? ORDER BY created_at ASC")
    .all(weddingId);
  return rows.map(rowToGuest);
}

export function adminFindGuestById(weddingId: string, guestId: string): Guest | null {
  const row = db
    .prepare("SELECT * FROM guests WHERE id = ? AND wedding_id = ?")
    .get(guestId, weddingId);
  return row ? rowToGuest(row) : null;
}

export function adminCreateGuest(params: {
  weddingId: string;
  firstName: string;
  lastName?: string | null;
  groupLabel?: string | null;
  allowPlusOne?: boolean;
  phone?: string | null;
  email?: string | null;
}): Guest {
  const id = newId("guest");
  const token = newGuestToken();

  // Kolizja kodu (32-znakowy alfabet, 8 znaków) jest astronomicznie mało
  // prawdopodobna, ale pętla ze sprawdzeniem kosztuje nic, a UNIQUE index
  // na short_code i tak by odrzucił duplikat - lepiej wygenerować od nowa
  // niż wywrócić dodawanie gościa błędem bazy.
  let shortCode = newGuestShortCode();
  while (db.prepare("SELECT 1 FROM guests WHERE short_code = ?").get(shortCode)) {
    shortCode = newGuestShortCode();
  }

  db.prepare(
    `INSERT INTO guests (id, wedding_id, token, short_code, first_name, last_name, group_label, allow_plus_one, phone, email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.weddingId,
    token,
    shortCode,
    params.firstName,
    params.lastName ?? null,
    params.groupLabel ?? null,
    params.allowPlusOne ? 1 : 0,
    params.phone ?? null,
    params.email ?? null
  );
  const guest = adminFindGuestById(params.weddingId, id);
  if (!guest) throw new Error("Nie udało się dodać gościa");
  return guest;
}

export function adminDeleteGuest(weddingId: string, guestId: string): void {
  db.prepare("DELETE FROM guests WHERE id = ? AND wedding_id = ?").run(guestId, weddingId);
}

/** Edycja danych kontaktowych - osobno od tworzenia, żeby dało się
 * dopisać telefon/e-mail gościom dodanym zanim te pola istniały. */
export function adminSetGuestContact(
  weddingId: string,
  guestId: string,
  params: { phone: string | null; email: string | null }
): void {
  db.prepare("UPDATE guests SET phone = ?, email = ? WHERE id = ? AND wedding_id = ?").run(
    params.phone,
    params.email,
    guestId,
    weddingId
  );
}

/** Przypisanie gościa do grupy (rodzina/praca/przyjaciele) używanej do
 * uprawnień rozmieszczania w trybie GROUP_CONSTRAINED - patrz groups.ts.
 * groupId=null usuwa przypisanie. */
export function adminSetGuestGroup(
  weddingId: string,
  guestId: string,
  groupId: string | null
): void {
  db.prepare("UPDATE guests SET group_id = ? WHERE id = ? AND wedding_id = ?").run(
    groupId,
    guestId,
    weddingId
  );
}

// --- Dostęp gościa (sesja ograniczona do jego własnego guestId) ---

/** Używane wyłącznie przy pierwszym wejściu przez unikalny link - żeby
 * zamienić token z URL na sesję. Nigdzie indziej nie wolno wyszukiwać po token. */
export function findGuestByTokenForLogin(token: string): Guest | null {
  const row = db.prepare("SELECT * FROM guests WHERE token = ?").get(token);
  return row ? rowToGuest(row) : null;
}

/** Jak findGuestByTokenForLogin, ale przez krótki, ręcznie wpisywalny kod
 * (patrz /kod) - dla gości bez skanera QR albo bez cyfrowego dostępu do
 * wiadomości z linkiem. Normalizacja (upper-case, bez spacji/myślników)
 * pozwala wpisać kod bez przejmowania się wielkością liter czy formatem. */
export function findGuestByShortCodeForLogin(rawCode: string): Guest | null {
  const normalized = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (normalized.length !== 8) return null;
  const formatted = `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  const row = db.prepare("SELECT * FROM guests WHERE short_code = ?").get(formatted);
  return row ? rowToGuest(row) : null;
}

/** Znacznik "gość faktycznie otworzył swój link/kod" - wywoływane raz, przy
 * pierwszym udanym zalogowaniu (patrz src/app/z/[token]/route.ts i
 * src/app/kod/actions.ts). WHERE first_visited_at IS NULL - kolejne wejścia
 * tego samego gościa nie nadpisują pierwszej, prawdziwej daty. */
export function markGuestFirstVisited(guestId: string): void {
  db.prepare(
    "UPDATE guests SET first_visited_at = datetime('now') WHERE id = ? AND first_visited_at IS NULL"
  ).run(guestId);
}

export function guestGetSelf(guestId: string): GuestSelfView | null {
  const row = db.prepare("SELECT * FROM guests WHERE id = ?").get(guestId);
  return row ? toSelfView(rowToGuest(row)) : null;
}

export function guestGetWeddingId(guestId: string): string | null {
  const row = db.prepare("SELECT wedding_id FROM guests WHERE id = ?").get(guestId) as
    | { wedding_id: string }
    | undefined;
  return row?.wedding_id ?? null;
}

/** RODO - prawo do usunięcia (art. 17), wywoływane przez samego gościa
 * (nie parę) - stąd `guest*`, nie `admin*`, mimo że fizycznie to ta sama
 * operacja co adminDeleteGuest. Kaskada bazy (ON DELETE CASCADE) usuwa przy
 * okazji wiadomości czatu, przypisanie miejsca i prośby o zmianę miejsca -
 * zdjęcia w galerii trzeba skasować OSOBNO przed wywołaniem tej funkcji
 * (kaskada dla wedding_photos.uploaded_by_guest_id to celowo SET NULL, nie
 * CASCADE - patrz src/lib/db/photos.ts), patrz deleteMyDataAction. */
export function guestDeleteSelf(guestId: string): void {
  db.prepare("DELETE FROM guests WHERE id = ?").run(guestId);
}

export function guestSubmitRsvp(
  guestId: string,
  params: { rsvpStatus: RsvpStatus; dietaryNotes?: string | null; plusOneName?: string | null }
): GuestSelfView | null {
  db.prepare(
    `UPDATE guests
     SET rsvp_status = ?, dietary_notes = ?, plus_one_name = ?,
         rsvp_responded_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    params.rsvpStatus,
    params.dietaryNotes ?? null,
    params.plusOneName ?? null,
    guestId
  );
  return guestGetSelf(guestId);
}
