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
  adminAssignSeat,
  adminUnassignGuest,
} from "@/lib/db/tables";
import type { TableShape, WeddingTable, SeatWithGuestName } from "@/lib/db/types";

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
  revalidatePath(`/w/${wedding.slug}/moje-zaproszenie`);
  return seats;
}

export async function unassignSeatAction(
  weddingId: string,
  guestId: string
): Promise<SeatWithGuestName[]> {
  const wedding = await requireOwnedWedding(weddingId);
  const seats = adminUnassignGuest(wedding.id, guestId);
  revalidatePath(`/w/${wedding.slug}/moje-zaproszenie`);
  return seats;
}
