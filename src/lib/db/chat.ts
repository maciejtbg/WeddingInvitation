// Czat gość <-> para. Każda wiadomość jest przypisana do jednego guestId,
// więc te same reguły dostępu co w guests.ts (sesja gościa ograniczona do
// własnego id) wystarczają, żeby żaden gość nie zobaczył rozmowy innego.

import { db, newId } from "./client";
import type { ChatMessage, SqliteRow } from "./types";

function rowToMessage(row: SqliteRow): ChatMessage {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    guestId: row.guest_id as string,
    sender: row.sender as "GUEST" | "COUPLE",
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

/** Wątek jednego, konkretnego gościa - wywoływać z guestId z sesji gościa
 * albo, po stronie panelu pary, z guestId wybranym z listy adminListGuests. */
export function listMessagesForGuest(guestId: string): ChatMessage[] {
  const rows = db
    .prepare("SELECT * FROM chat_messages WHERE guest_id = ? ORDER BY created_at ASC")
    .all(guestId);
  return rows.map(rowToMessage);
}

export function sendMessage(params: {
  weddingId: string;
  guestId: string;
  sender: "GUEST" | "COUPLE";
  body: string;
}): ChatMessage {
  const id = newId("msg");
  db.prepare(
    `INSERT INTO chat_messages (id, wedding_id, guest_id, sender, body)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, params.weddingId, params.guestId, params.sender, params.body);
  const row = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(id);
  if (!row) throw new Error("Nie udało się zapisać wiadomości");
  return rowToMessage(row as SqliteRow);
}

/** Dla panelu pary: ostatnia wiadomość + liczba nieprzeczytanych na gościa
 * mogłyby tu dojść w kolejnym etapie. Na razie zwracamy listę gości z
 * wiadomościami, żeby para widziała z kim jest aktywna rozmowa. */
export function listGuestIdsWithMessages(weddingId: string): string[] {
  const rows = db
    .prepare(
      "SELECT DISTINCT guest_id as guestId FROM chat_messages WHERE wedding_id = ?"
    )
    .all(weddingId) as { guestId: string }[];
  return rows.map((r) => r.guestId);
}

/** Gość "czeka na odpowiedź", jeśli jego OSTATNIA wiadomość w wątku jest od
 * niego (GUEST), nie od pary - prosty sposób na "nieprzeczytane" bez osobnej
 * kolumny/tabeli śledzącej stan przeczytania. Używane do odznaki na liście
 * gości i w panelu głównym (src/app/admin/guests/page.tsx,
 * src/app/admin/page.tsx) - czat jest schowany pod "Czat" przy każdym
 * gościu z osobna (patrz model prywatności w README), więc bez takiej
 * odznaki para łatwo przeoczy, że ktoś napisał. */
export function listGuestIdsAwaitingReply(weddingId: string): string[] {
  const rows = db
    .prepare(
      `SELECT guest_id as guestId FROM chat_messages cm
       WHERE wedding_id = ? AND sender = 'GUEST'
         AND created_at = (
           SELECT MAX(created_at) FROM chat_messages
           WHERE guest_id = cm.guest_id
         )`
    )
    .all(weddingId) as { guestId: string }[];
  return rows.map((r) => r.guestId);
}
