// Typy wierszy bazy danych. Nazwy pól po stronie TS są camelCase,
// mapowanie z kolumn snake_case dzieje się w repozytoriach (src/lib/db/*.ts).

export type RsvpStatus = "PENDING" | "YES" | "NO";

// Identyfikatory gotowych motywów graficznych strony wesela - patrz
// src/lib/themes.ts (tam pełna definicja kolorów i grafik każdego z nich).
export type ThemeId = "cream-gold" | "blush-black" | "burgundy-gold";

// Tryb rozmieszczania gości przy stołach - patrz src/lib/seatingModes.ts.
export type SeatingMode =
  | "COUPLE_ONLY"
  | "GUEST_SELF_SELECT"
  | "GUEST_REQUEST"
  | "GROUP_CONSTRAINED";

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
  // Link do filmu (YouTube/Vimeo/inny) pokazywany obok historii pary.
  videoUrl: string | null;
  theme: ThemeId;
  seatingMode: SeatingMode;
  giftNote: string | null;
  // RODO - liczba dni po dacie ślubu, po której dane osobowe gości są
  // automatycznie usuwane (patrz src/lib/dataRetention.ts). purgedAt to
  // znacznik "już wyczyszczone", null dopóki nie nastąpiło.
  dataRetentionDays: number;
  purgedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  weddingId: string;
  token: string;
  // Krótki, ręcznie wpisywalny kod dostępu - alternatywa dla linku/QR dla
  // gości bez skanera albo bez cyfrowego dostępu do wiadomości z linkiem.
  // Może być null dla gości utworzonych przed dodaniem tej funkcji.
  shortCode: string | null;
  firstName: string;
  lastName: string | null;
  groupLabel: string | null;
  // Strukturalna grupa (rodzina/praca/przyjaciele) używana do uprawnień
  // rozmieszczania w trybie GROUP_CONSTRAINED - odrębna od groupLabel, który
  // jest wolnym tekstem/notatką pary. Patrz src/lib/db/groups.ts.
  groupId: string | null;
  allowPlusOne: boolean;
  plusOneName: string | null;
  rsvpStatus: RsvpStatus;
  rsvpRespondedAt: string | null;
  dietaryNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuestGroup {
  id: string;
  weddingId: string;
  name: string;
  createdAt: string;
}

export type SeatChangeRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export interface SeatChangeRequest {
  id: string;
  weddingId: string;
  guestId: string;
  message: string | null;
  status: SeatChangeRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface SeatChangeRequestWithGuestName extends SeatChangeRequest {
  guestFirstName: string;
  guestLastName: string | null;
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

// Elementy planu sali inne niż stół - patrz src/lib/db/layoutItems.ts.
export type LayoutItemKind = "MARKER" | "WALL";

export interface LayoutItem {
  id: string;
  weddingId: string;
  roomName: string;
  kind: LayoutItemKind;
  label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
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

// Miejsca pokazywane gościom na mapie (ceremonia/przyjęcie/poprawiny) -
// patrz src/lib/db/locations.ts i src/lib/locationKinds.ts.
export type LocationKind = "CEREMONY" | "RECEPTION" | "AFTERPARTY" | "OTHER";

export interface WeddingLocation {
  id: string;
  weddingId: string;
  kind: LocationKind;
  label: string;
  address: string | null;
  lat: number;
  lng: number;
  createdAt: string;
}

// Galeria zdjęć - placeholder do czasu podłączenia Cloudflare R2, patrz
// src/lib/db/photos.ts i src/lib/photoStorage.ts (limity, kompresja).
export interface WeddingPhoto {
  id: string;
  weddingId: string;
  uploadedByGuestId: string | null;
  fileName: string;
  byteSize: number;
  createdAt: string;
}

// Harmonogram dnia/dni ślubu - patrz src/lib/db/schedule.ts.
export interface ScheduleItem {
  id: string;
  weddingId: string;
  dayLabel: string | null;
  timeLabel: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

// FAQ - patrz src/lib/db/faq.ts.
export interface FaqItem {
  id: string;
  weddingId: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
}

// Lista życzeń muzycznych - patrz src/lib/db/songRequests.ts i
// src/lib/musicSearch.ts.
export interface SongRequest {
  id: string;
  weddingId: string;
  guestId: string | null;
  trackName: string;
  artistName: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
  createdAt: string;
}

// Ewidencja zgód RODO - patrz src/lib/db/consents.ts.
export type ConsentSubjectType = "COUPLE" | "GUEST";

export interface Consent {
  id: string;
  subjectType: ConsentSubjectType;
  subjectId: string;
  consentType: string;
  policyVersion: string;
  grantedAt: string;
}
