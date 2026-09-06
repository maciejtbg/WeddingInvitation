// Warstwa dostępu do bazy danych.
//
// Na etapie developmentu używamy wbudowanego w Node.js modułu node:sqlite
// (dostępny od Node 22, na razie oznaczony jako eksperymentalny w samym Node,
// ale wystarczająco stabilny do budowy i testowania tej aplikacji).
// Powód: Prisma i podobne ORM-y pobierają przy pierwszym użyciu natywną
// binarkę silnika z zewnętrznego serwera, a to nie zawsze jest dostępne
// w każdym środowisku (np. w piaskownicy, w której to pisaliśmy).
// node:sqlite nic nie pobiera, działa od razu.
//
// Do produkcji: zamienić provider na Postgres (patrz README, sekcja "Baza
// danych"). Cała reszta aplikacji odwołuje się wyłącznie do funkcji
// w src/lib/db/*.ts (repozytoria), więc migracja polega na przepisaniu
// tego pliku i repozytoriów pod nowy sterownik, bez ruszania logiki biznesowej.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DATABASE_FILE || path.join(process.cwd(), "data", "dev.db");

// W trybie dev Next.js potrafi przeładowywać moduły (hot reload), więc
// trzymamy jedną instancję połączenia w globalThis, żeby nie otwierać
// pliku bazy wielokrotnie w tym samym procesie.
const globalForDb = globalThis as unknown as { __weddingDb?: DatabaseSync };

function createConnection(): DatabaseSync {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const database = new DatabaseSync(DB_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  return database;
}

export const db = globalForDb.__weddingDb ?? createConnection();
if (!globalForDb.__weddingDb) {
  globalForDb.__weddingDb = db;
}

// Prosty generator identyfikatorów - wystarczający dla tej skali projektu.
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

// Generuje długi, losowy, niemożliwy do odgadnięcia token zaproszenia gościa.
// To jedyny "klucz" gościa do jego własnych danych - patrz src/lib/auth/guest.ts.
export function newGuestToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

// Krótki, ręcznie wpisywalny kod dostępu (alternatywa dla linku/QR - patrz
// src/app/kod/actions.ts) - dla gości bez telefonu ze skanerem albo bez
// dostępu do wiadomości z linkiem (np. zaproszenie wręczone na papierze).
// Bez znaków łatwych do pomylenia (0/O, 1/I/L) - ma być czytelny odręcznie.
const SHORT_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newGuestShortCode(): string {
  function group(len: number): string {
    let out = "";
    for (let i = 0; i < len; i++) {
      out += SHORT_CODE_ALPHABET[Math.floor(Math.random() * SHORT_CODE_ALPHABET.length)];
    }
    return out;
  }
  return `${group(4)}-${group(4)}`;
}

let migrated = false;

export function runMigrations() {
  if (migrated) return;
  migrated = true;

  db.exec(`
    CREATE TABLE IF NOT EXISTS couples (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weddings (
      id TEXT PRIMARY KEY,
      couple_id TEXT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      slug TEXT UNIQUE NOT NULL,
      partner1_name TEXT NOT NULL,
      partner2_name TEXT NOT NULL,
      wedding_date TEXT,
      venue_name TEXT,
      venue_address TEXT,
      story TEXT,
      theme TEXT NOT NULL DEFAULT 'cream-gold',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_weddings_couple ON weddings(couple_id);

    -- Gość / gospodarstwo domowe. "token" to jedyny klucz dostępu gościa
    -- do własnych danych (RSVP, miejsce przy stole, czat) - patrz auth/guest.ts.
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT,
      group_label TEXT,
      allow_plus_one INTEGER NOT NULL DEFAULT 0,
      plus_one_name TEXT,
      rsvp_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | YES | NO
      rsvp_responded_at TEXT,
      dietary_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_guests_wedding ON guests(wedding_id);

    -- Szkielet pod planer stołów (budowany w kolejnym etapie prac).
    CREATE TABLE IF NOT EXISTS tables_ (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      room_name TEXT NOT NULL,
      label TEXT NOT NULL,
      shape TEXT NOT NULL DEFAULT 'ROUND', -- ROUND | RECT
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      rotation REAL NOT NULL DEFAULT 0,
      seats_count INTEGER NOT NULL DEFAULT 8
    );
    CREATE INDEX IF NOT EXISTS idx_tables_wedding ON tables_(wedding_id);

    CREATE TABLE IF NOT EXISTS seat_assignments (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL REFERENCES tables_(id) ON DELETE CASCADE,
      guest_id TEXT UNIQUE NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      seat_index INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_seats_table ON seat_assignments(table_id);

    -- Grupa gości (rodzina/praca/przyjaciele) - używana do trybu rozmieszczania
    -- GROUP_CONSTRAINED (patrz weddings.seating_mode) i niezależna od
    -- guests.group_label, który jest wolnym tekstem/notatką pary, nie
    -- struktura z uprawnieniami. Patrz src/lib/db/groups.ts.
    CREATE TABLE IF NOT EXISTS guest_groups (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_guest_groups_wedding ON guest_groups(wedding_id);

    -- Które stoły wolno wybierać członkom danej grupy w trybie
    -- GROUP_CONSTRAINED. Brak jakiegokolwiek wiersza dla danej grupy oznacza
    -- "wszystkie stoły dozwolone" (patrz guestListAvailableSeats w tables.ts) -
    -- para nie musi konfigurować tego dla grup bez ograniczeń.
    CREATE TABLE IF NOT EXISTS group_table_allowances (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES guest_groups(id) ON DELETE CASCADE,
      table_id TEXT NOT NULL REFERENCES tables_(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_group_table_unique
      ON group_table_allowances(group_id, table_id);

    -- Prośby gości o zmianę wcześniej przypisanego miejsca - używane w trybie
    -- GUEST_REQUEST. Para przegląda i akceptuje/odrzuca, faktyczne
    -- przeniesienie robi ręcznie w planerze (patrz src/app/admin/seat-requests).
    CREATE TABLE IF NOT EXISTS seat_change_requests (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | DECLINED
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_seat_requests_wedding ON seat_change_requests(wedding_id);

    -- Czat gość <-> para. Każda wiadomość widoczna wyłącznie temu jednemu
    -- gościowi i kontu pary (izolacja po guest_id, patrz repozytorium chat.ts).
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      wedding_id TEXT NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
      guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
      sender TEXT NOT NULL, -- GUEST | COUPLE
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_chat_wedding_guest ON chat_messages(wedding_id, guest_id);
  `);

  // CREATE TABLE IF NOT EXISTS nie dokłada kolumn do już istniejącej tabeli,
  // więc bazy założone przed dodaniem motywów graficznych potrzebują ręcznego
  // ALTER TABLE. SQLite nie ma "ADD COLUMN IF NOT EXISTS", stąd try/catch -
  // błąd "duplicate column" oznacza po prostu, że kolumna już tam jest.
  try {
    db.exec("ALTER TABLE weddings ADD COLUMN theme TEXT NOT NULL DEFAULT 'cream-gold';");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column")) throw err;
  }
  try {
    db.exec(
      "ALTER TABLE weddings ADD COLUMN seating_mode TEXT NOT NULL DEFAULT 'COUPLE_ONLY';"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column")) throw err;
  }
  try {
    db.exec("ALTER TABLE weddings ADD COLUMN gift_note TEXT;");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column")) throw err;
  }
  try {
    db.exec(
      "ALTER TABLE guests ADD COLUMN group_id TEXT REFERENCES guest_groups(id) ON DELETE SET NULL;"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column")) throw err;
  }
  try {
    db.exec("ALTER TABLE guests ADD COLUMN short_code TEXT;");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column")) throw err;
  }
  try {
    db.exec(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_short_code ON guests(short_code);"
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("duplicate column")) throw err;
  }
}

runMigrations();
