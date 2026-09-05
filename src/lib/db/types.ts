// Typy wierszy bazy danych. Nazwy pól po stronie TS są camelCase,
// mapowanie z kolumn snake_case dzieje się w repozytoriach (src/lib/db/*.ts).

export type RsvpStatus = "PENDING" | "YES" | "NO";

// Identyfikatory gotowych motywów graficznych strony wesela - patrz
// src/lib/themes.ts (tam pełna definicja kolorów i grafik każdego z nich).
export type ThemeId = "cream-gold" | "blush-black" | "burgundy-gold";

// Wiersz zwrócony przez node:sqlite ma typ unknown per-kolumna - repozytoria
// rzutują pojedyncze pola na konkretne typy, znając strukturę tabeli.
export type SqliteRow = Record<string, unknown>;

export interface Couple {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Wedding {
  id: string;
  coupleId: string;
  slug: string;
  partner1Name: string;
  partner2Name: string;
  weddingDate: string | null;
  venueName: string | null;
  venueAddress: string | null;
  story: string | null;
  theme: ThemeId;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  weddingId: string;
  token: string;
  firstName: string;
  lastName: string | null;
  groupLabel: string | null;
  allowPlusOne: boolean;
  plusOneName: string | null;
  rsvpStatus: RsvpStatus;
  rsvpRespondedAt: string | null;
  dietaryNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Dane gościa okrojone do tego, co wolno zobaczyć samemu gościowi -
// nigdy groupLabel (to notatka pary), nigdy dane innych gości.
export interface GuestSelfView {
  id: string;
  firstName: string;
  lastName: string | null;
  allowPlusOne: boolean;
  plusOneName: string | null;
  rsvpStatus: RsvpStatus;
  dietaryNotes: string | null;
}

export interface ChatMessage {
  id: string;
  weddingId: string;
  guestId: string;
  sender: "GUEST" | "COUPLE";
  body: string;
  createdAt: string;
}

// Planer stołów - patrz src/lib/db/tables.ts. Sala NIE jest osobną tabelą,
// tylko wartością `roomName` na konkretnych stołach.
export type TableShape = "ROUND" | "RECT";

export interface WeddingTable {
  id: string;
  weddingId: string;
  roomName: string;
  label: string;
  shape: TableShape;
  x: number;
  y: number;
  rotation: number;
  seatsCount: number;
}

export interface SeatAssignment {
  id: string;
  tableId: string;
  guestId: string;
  seatIndex: number;
}

// Przypisanie miejsca razem z imieniem/nazwiskiem gościa - wygodne do
// wyświetlenia w panelu bocznym planera bez osobnego zapytania o gościa.
export interface SeatWithGuestName extends SeatAssignment {
  guestFirstName: string;
  guestLastName: string | null;
}
