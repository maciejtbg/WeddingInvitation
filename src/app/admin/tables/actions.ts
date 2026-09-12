"use server";

// Server Actions planera stołów. W odróżnieniu od src/app/admin/actions.ts
// te NIE wołają redirect() - są wywoływane programowo z poziomu klienckiego
// komponentu kanwy (components/TablePlanner.tsx), a nie przez <form
// action=...>, więc brak uprawnień zwracamy jako wyjątek zamiast
// przekierowania.
//
// Celowo BEZ revalidatePath("/admin/tables") przy akcjach wywoływanych
// z samej kanwy (tworzenie/usuwanie stołu, zmiana kształtu, przypisanie
// miejsca) - stan po stronie klienta jest już zaktualizowany bezpośrednio
// z odpowiedzi akcji, więc revalidatePath tylko wymuszałby dodatkową
// przebudowę strony przez Next.js w tle. To ma znaczenie: strona planera
// używa next/dynamic({ssr:false}) dla komponentu Konva (patrz
// TablePlannerLoader.tsx), a taka przebudowa potrafi na chwilę zdjąć
// i ponownie zamontować <canvas>, co przy trwającym przeciąganiu stołu
// objawia się jako migotanie/utrata fokusu. revalidatePath zostaje tylko
// tam, gdzie naprawdę zmienia to co widzi INNA strona (zaproszenie gościa).

import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import {
  adminCreateTable,
  adminDeleteTable,
  adminUpdateTablePosition,
  adminUpdateTableShape,
  adminUpdateTableSize,
  adminRenameTable,
  adminUpdateSeatsCount,
  adminAssignSeat,
  adminUnassignGuest,
  adminListSeats,
  adminSetSeatDisabled,
} from "@/lib/db/tables";
import {
  adminCreateLayoutItem,
  adminUpdateLayoutItemPosition,
  adminRenameLayoutItem,
  adminSetLayoutItemShape,
  adminResizeLayoutItem,
  adminDeleteLayoutItem,
} from "@/lib/db/layoutItems";
import { MAX_TABLE_DIMENSION } from "@/lib/tableGeometry";
import type {
  TableShape,
  WeddingTable,
  SeatWithGuestName,
  LayoutItem,
  LayoutItemKind,
  LayoutItemShape,
} from "@/lib/db/types";

async function requireOwnedWedding(weddingId: string) {
  const session = await getCoupleSession();
  if (!session) throw new Error("Brak sesji - zaloguj się ponownie");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) {
    throw new Error("To wesele nie należy do zalogowanego konta");
  }
  return wedding;
}

export async function createTableAction(
  weddingId: string,
  params: {
    roomName: string;
    label: string;
    shape: TableShape;
    x: number;
    y: number;
    seatsCount: number;
  }
): Promise<WeddingTable> {
  const wedding = await requireOwnedWedding(weddingId);
  return adminCreateTable({ weddingId: wedding.id, ...params });
}

export async function updateTablePositionAction(
  weddingId: string,
  tableId: string,
  x: number,
  y: number,
  rotation: number
): Promise<void> {
  const wedding = await requireOwnedWedding(weddingId);
  adminUpdateTablePosition(wedding.id, tableId, { x, y, rotation });
}

export async function updateTableShapeAction(
  weddingId: string,
  tableId: string,
  shape: TableShape
): Promise<WeddingTable> {
  const wedding = await requireOwnedWedding(weddingId);
  const table = adminUpdateTableShape(wedding.id, tableId, shape);
  if (!table) throw new Error("Nie znaleziono stołu");
  return table;
}

export async function renameTableAction(
  weddingId: string,
  tableId: string,
  label: string
): Promise<WeddingTable> {
  const wedding = await requireOwnedWedding(weddingId);
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Nazwa stołu nie może być pusta");
  const table = adminRenameTable(wedding.id, tableId, trimmed);
  if (!table) throw new Error("Nie znaleziono stołu");
  return table;
}

export async function updateSeatsCountAction(
  weddingId: string,
  tableId: string,
  seatsCount: number
): Promise<{ table: WeddingTable; seats: SeatWithGuestName[] }> {
  const wedding = await requireOwnedWedding(weddingId);
  if (!Number.isInteger(seatsCount) || seatsCount < 1 || seatsCount > 24) {
    throw new Error("Liczba miejsc musi być liczbą całkowitą od 1 do 24");
  }
  const table = adminUpdateSeatsCount(wedding.id, tableId, seatsCount);
  if (!table) throw new Error("Nie znaleziono stołu");
  revalidatePath(`/${wedding.slug}/moje-zaproszenie`);
  return { table, seats: adminListSeats(wedding.id) };
}

/** Ręczna zmiana rozmiaru z suwaków w panelu bocznym - niezależna od
 * auto-powiększania przy dokładaniu miejsc (patrz updateSeatsCountAction).
 * Podaj TYLKO pole odpowiadające kształtowi stołu (radius dla ROUND,
 * width/height dla RECT) - reszta jest ignorowana po stronie repozytorium. */
export async function updateTableSizeAction(
  weddingId: string,
  tableId: string,
  params: { radius?: number; width?: number; height?: number }
): Promise<WeddingTable> {
  const wedding = await requireOwnedWedding(weddingId);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && (!Number.isFinite(value) || value < 20 || value > MAX_TABLE_DIMENSION)) {
      throw new Error(`Nieprawidłowa wartość dla "${key}"`);
    }
  }
  const table = adminUpdateTableSize(wedding.id, tableId, params);
  if (!table) throw new Error("Nie znaleziono stołu");
  return table;
}

export async function deleteTableAction(weddingId: string, tableId: string): Promise<void> {
  const wedding = await requireOwnedWedding(weddingId);
  adminDeleteTable(wedding.id, tableId);
}

export async function assignSeatAction(
  weddingId: string,
  tableId: string,
  guestId: string,
  seatIndex: number
): Promise<SeatWithGuestName[]> {
  const wedding = await requireOwnedWedding(weddingId);
  const seats = adminAssignSeat(wedding.id, { tableId, guestId, seatIndex });
  revalidatePath(`/${wedding.slug}/moje-zaproszenie`);
  return seats;
}

/** "Podedytor" stołu - wyłącza/przywraca jedno miejsce na jego obwodzie
 * (patrz adminSetSeatDisabled). revalidatePath tu MA sens (w odróżnieniu od
 * reszty akcji kanwy, patrz komentarz na górze pliku) - to jedyna akcja z
 * tej grupy, która zmienia to, co widzi gość w trybie GUEST_SELF_SELECT na
 * /moje-zaproszenie (guestListAvailableSeats pomija wyłączone miejsca). */
export async function toggleSeatDisabledAction(
  weddingId: string,
  tableId: string,
  seatIndex: number,
  disabled: boolean
): Promise<WeddingTable> {
  const wedding = await requireOwnedWedding(weddingId);
  const table = adminSetSeatDisabled(wedding.id, tableId, seatIndex, disabled);
  if (!table) throw new Error("Nie znaleziono stołu");
  revalidatePath(`/${wedding.slug}/moje-zaproszenie`);
  return table;
}

export async function unassignSeatAction(
  weddingId: string,
  guestId: string
): Promise<SeatWithGuestName[]> {
  const wedding = await requireOwnedWedding(weddingId);
  const seats = adminUnassignGuest(wedding.id, guestId);
  revalidatePath(`/${wedding.slug}/moje-zaproszenie`);
  return seats;
}

// --- Elementy planu sali: znaczniki (DJ, bufet...) i ściany ---
// Patrz src/lib/db/layoutItems.ts - dzielą jedną tabelę, bo to ten sam
// rodzaj obiektu z punktu widzenia kanwy (coś przeciąganego po planie sali,
// nie będącego stołem).

export async function createLayoutItemAction(
  weddingId: string,
  params: {
    roomName: string;
    kind: LayoutItemKind;
    label?: string | null;
    shape?: LayoutItemShape;
    x: number;
    y: number;
    width?: number;
    height?: number;
  }
): Promise<LayoutItem> {
  const wedding = await requireOwnedWedding(weddingId);
  return adminCreateLayoutItem({ weddingId: wedding.id, ...params });
}

export async function setLayoutItemShapeAction(
  weddingId: string,
  itemId: string,
  shape: LayoutItemShape
): Promise<LayoutItem> {
  const wedding = await requireOwnedWedding(weddingId);
  const item = adminSetLayoutItemShape(wedding.id, itemId, shape);
  if (!item) throw new Error("Nie znaleziono elementu");
  return item;
}

export async function updateLayoutItemPositionAction(
  weddingId: string,
  itemId: string,
  x: number,
  y: number,
  rotation: number
): Promise<void> {
  const wedding = await requireOwnedWedding(weddingId);
  adminUpdateLayoutItemPosition(wedding.id, itemId, { x, y, rotation });
}

export async function renameLayoutItemAction(
  weddingId: string,
  itemId: string,
  label: string
): Promise<LayoutItem> {
  const wedding = await requireOwnedWedding(weddingId);
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Nazwa znacznika nie może być pusta");
  const item = adminRenameLayoutItem(wedding.id, itemId, trimmed);
  if (!item) throw new Error("Nie znaleziono elementu");
  return item;
}

export async function resizeLayoutItemAction(
  weddingId: string,
  itemId: string,
  width: number,
  height: number
): Promise<LayoutItem> {
  const wedding = await requireOwnedWedding(weddingId);
  if (!Number.isFinite(width) || width < 20 || width > 1000) {
    throw new Error("Szerokość musi być liczbą od 20 do 1000");
  }
  if (!Number.isFinite(height) || height < 10 || height > 1000) {
    throw new Error("Wysokość musi być liczbą od 10 do 1000");
  }
  const item = adminResizeLayoutItem(wedding.id, itemId, { width, height });
  if (!item) throw new Error("Nie znaleziono elementu");
  return item;
}

export async function deleteLayoutItemAction(weddingId: string, itemId: string): Promise<void> {
  const wedding = await requireOwnedWedding(weddingId);
  adminDeleteLayoutItem(wedding.id, itemId);
}
