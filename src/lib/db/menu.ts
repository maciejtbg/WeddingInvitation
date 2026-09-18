// Menu wesela - dania i ich alergeny (patrz src/lib/allergens.ts). Kolejność
// jak w schedule.ts/faq.ts - ↑/↓ zamiast przeciągania, grupowanie po
// category (wolny tekst) tak samo jak dayLabel w harmonogramie.

import { db, newId } from "./client";
import type { MenuItem, SqliteRow } from "./types";

function rowToItem(row: SqliteRow): MenuItem {
  let allergens: string[] = [];
  try {
    const parsed = JSON.parse(row.allergens as string);
    if (Array.isArray(parsed)) allergens = parsed.filter((a) => typeof a === "string");
  } catch {
    allergens = [];
  }
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    category: row.category as string | null,
    name: row.name as string,
    description: row.description as string | null,
    allergens,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

export function listMenuItems(weddingId: string): MenuItem[] {
  const rows = db
    .prepare(
      "SELECT * FROM wedding_menu_items WHERE wedding_id = ? ORDER BY sort_order ASC, created_at ASC"
    )
    .all(weddingId);
  return rows.map(rowToItem);
}

export function createMenuItem(params: {
  weddingId: string;
  category: string | null;
  name: string;
  description: string | null;
  allergens: string[];
}): MenuItem {
  const id = newId("menu");
  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM wedding_menu_items WHERE wedding_id = ?")
    .get(params.weddingId) as { m: number };
  db.prepare(
    `INSERT INTO wedding_menu_items (id, wedding_id, category, name, description, allergens, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.weddingId,
    params.category,
    params.name,
    params.description,
    JSON.stringify(params.allergens),
    maxOrder.m + 1
  );
  const row = db.prepare("SELECT * FROM wedding_menu_items WHERE id = ?").get(id);
  if (!row) throw new Error("Nie udało się dodać dania");
  return rowToItem(row as SqliteRow);
}

export function deleteMenuItem(weddingId: string, itemId: string): void {
  db.prepare("DELETE FROM wedding_menu_items WHERE id = ? AND wedding_id = ?").run(itemId, weddingId);
}

export function moveMenuItem(weddingId: string, itemId: string, direction: "up" | "down"): void {
  const items = listMenuItems(weddingId);
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= items.length) return;

  const a = items[index];
  const b = items[swapWith];
  db.prepare("UPDATE wedding_menu_items SET sort_order = ? WHERE id = ?").run(b.sortOrder, a.id);
  db.prepare("UPDATE wedding_menu_items SET sort_order = ? WHERE id = ?").run(a.sortOrder, b.id);
}
