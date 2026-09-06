// Harmonogram dnia/dni ślubu - do decyzji pary (nie mamy jak zgadnąć
// kolejności ceremonii/przyjęcia/tortu za nich). Kolejność steruje
// sort_order, zmieniana przyciskami ↑/↓ (patrz swapSortOrder) - prościej
// niż przeciąganie, i tak samo skuteczne przy liście kilkunastu punktów.

import { db, newId } from "./client";
import type { ScheduleItem, SqliteRow } from "./types";

function rowToItem(row: SqliteRow): ScheduleItem {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    dayLabel: row.day_label as string | null,
    timeLabel: row.time_label as string,
    title: row.title as string,
    description: row.description as string | null,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

export function listScheduleItems(weddingId: string): ScheduleItem[] {
  const rows = db
    .prepare("SELECT * FROM wedding_schedule_items WHERE wedding_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(weddingId);
  return rows.map(rowToItem);
}

export function createScheduleItem(params: {
  weddingId: string;
  dayLabel: string | null;
  timeLabel: string;
  title: string;
  description: string | null;
}): ScheduleItem {
  const id = newId("sched");
  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM wedding_schedule_items WHERE wedding_id = ?")
    .get(params.weddingId) as { m: number };
  db.prepare(
    `INSERT INTO wedding_schedule_items (id, wedding_id, day_label, time_label, title, description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, params.weddingId, params.dayLabel, params.timeLabel, params.title, params.description, maxOrder.m + 1);
  const row = db.prepare("SELECT * FROM wedding_schedule_items WHERE id = ?").get(id);
  if (!row) throw new Error("Nie udało się dodać punktu harmonogramu");
  return rowToItem(row);
}

export function deleteScheduleItem(weddingId: string, itemId: string): void {
  db.prepare("DELETE FROM wedding_schedule_items WHERE id = ? AND wedding_id = ?").run(itemId, weddingId);
}

/** Zamienia sort_order tego elementu z sąsiadem w podanym kierunku - patrz
 * komentarz na górze pliku, dlaczego ↑/↓ zamiast przeciągania. */
export function moveScheduleItem(weddingId: string, itemId: string, direction: "up" | "down"): void {
  const items = listScheduleItems(weddingId);
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= items.length) return;

  const a = items[index];
  const b = items[swapWith];
  db.prepare("UPDATE wedding_schedule_items SET sort_order = ? WHERE id = ?").run(b.sortOrder, a.id);
  db.prepare("UPDATE wedding_schedule_items SET sort_order = ? WHERE id = ?").run(a.sortOrder, b.id);
}
