// Elementy planu sali inne niż stół - znaczniki (DJ, bufet, fotobudka...) i
// ściany. Patrz komentarz przy tabeli layout_items w src/lib/db/client.ts
// za wyjaśnieniem, czemu oba typy dzielą jedną tabelę.

import { db, newId } from "./client";
import type { LayoutItem, LayoutItemKind, SqliteRow } from "./types";

function rowToLayoutItem(row: SqliteRow): LayoutItem {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    roomName: row.room_name as string,
    kind: row.kind as LayoutItemKind,
    label: row.label as string | null,
    x: row.x as number,
    y: row.y as number,
    width: row.width as number,
    height: row.height as number,
    rotation: row.rotation as number,
  };
}

export function adminListLayoutItems(weddingId: string): LayoutItem[] {
  const rows = db
    .prepare("SELECT * FROM layout_items WHERE wedding_id = ?")
    .all(weddingId);
  return rows.map(rowToLayoutItem);
}

export function adminFindLayoutItemById(weddingId: string, itemId: string): LayoutItem | null {
  const row = db
    .prepare("SELECT * FROM layout_items WHERE id = ? AND wedding_id = ?")
    .get(itemId, weddingId);
  return row ? rowToLayoutItem(row) : null;
}

export function adminCreateLayoutItem(params: {
  weddingId: string;
  roomName: string;
  kind: LayoutItemKind;
  label?: string | null;
  x: number;
  y: number;
  width?: number;
  height?: number;
}): LayoutItem {
  const id = newId("layout");
  db.prepare(
    `INSERT INTO layout_items (id, wedding_id, room_name, kind, label, x, y, width, height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.weddingId,
    params.roomName,
    params.kind,
    params.label ?? null,
    params.x,
    params.y,
    params.width ?? (params.kind === "WALL" ? 120 : 0),
    params.height ?? (params.kind === "WALL" ? 20 : 0)
  );
  const item = adminFindLayoutItemById(params.weddingId, id);
  if (!item) throw new Error("Nie udało się dodać elementu planu sali");
  return item;
}

export function adminUpdateLayoutItemPosition(
  weddingId: string,
  itemId: string,
  params: { x: number; y: number; rotation: number }
): void {
  db.prepare(
    "UPDATE layout_items SET x = ?, y = ?, rotation = ? WHERE id = ? AND wedding_id = ?"
  ).run(params.x, params.y, params.rotation, itemId, weddingId);
}

export function adminRenameLayoutItem(
  weddingId: string,
  itemId: string,
  label: string
): LayoutItem | null {
  db.prepare("UPDATE layout_items SET label = ? WHERE id = ? AND wedding_id = ?").run(
    label,
    itemId,
    weddingId
  );
  return adminFindLayoutItemById(weddingId, itemId);
}

/** Tylko dla WALL - MARKER ignoruje width/height (renderowany jako stały
 * rozmiar znacznika niezależnie od tego, co tu zapisane). */
export function adminResizeLayoutItem(
  weddingId: string,
  itemId: string,
  params: { width: number; height: number }
): LayoutItem | null {
  db.prepare("UPDATE layout_items SET width = ?, height = ? WHERE id = ? AND wedding_id = ?").run(
    params.width,
    params.height,
    itemId,
    weddingId
  );
  return adminFindLayoutItemById(weddingId, itemId);
}

export function adminDeleteLayoutItem(weddingId: string, itemId: string): void {
  db.prepare("DELETE FROM layout_items WHERE id = ? AND wedding_id = ?").run(itemId, weddingId);
}
