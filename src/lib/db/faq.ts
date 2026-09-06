// FAQ - do decyzji pary (parking, dzieci mile widziane?, dress code, itp.
// - to wie tylko para). Kolejność jak w schedule.ts - ↑/↓ zamiast
// przeciągania.

import { db, newId } from "./client";
import type { FaqItem, SqliteRow } from "./types";

function rowToItem(row: SqliteRow): FaqItem {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    question: row.question as string,
    answer: row.answer as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

export function listFaqItems(weddingId: string): FaqItem[] {
  const rows = db
    .prepare("SELECT * FROM wedding_faq_items WHERE wedding_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(weddingId);
  return rows.map(rowToItem);
}

export function createFaqItem(params: {
  weddingId: string;
  question: string;
  answer: string;
}): FaqItem {
  const id = newId("faq");
  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM wedding_faq_items WHERE wedding_id = ?")
    .get(params.weddingId) as { m: number };
  db.prepare(
    `INSERT INTO wedding_faq_items (id, wedding_id, question, answer, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).run(id, params.weddingId, params.question, params.answer, maxOrder.m + 1);
  const row = db.prepare("SELECT * FROM wedding_faq_items WHERE id = ?").get(id);
  if (!row) throw new Error("Nie udało się dodać pytania");
  return rowToItem(row);
}

export function deleteFaqItem(weddingId: string, itemId: string): void {
  db.prepare("DELETE FROM wedding_faq_items WHERE id = ? AND wedding_id = ?").run(itemId, weddingId);
}

export function moveFaqItem(weddingId: string, itemId: string, direction: "up" | "down"): void {
  const items = listFaqItems(weddingId);
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= items.length) return;

  const a = items[index];
  const b = items[swapWith];
  db.prepare("UPDATE wedding_faq_items SET sort_order = ? WHERE id = ?").run(b.sortOrder, a.id);
  db.prepare("UPDATE wedding_faq_items SET sort_order = ? WHERE id = ?").run(a.sortOrder, b.id);
}
