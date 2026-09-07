// Elementy planu sali inne niż stół - znaczniki (DJ, bufet, fotobudka...),
// ściany i bryły planu sali (obrys pomieszczenia). Patrz komentarz przy
// tabeli layout_items w src/lib/db/client.ts za wyjaśnieniem, czemu
// wszystkie trzy typy dzielą jedną tabelę.

import { db, newId } from "./client";
import type { LayoutItem, LayoutItemKind, LayoutItemShape, SqliteRow } from "./types";

function rowToLayoutItem(row: SqliteRow): LayoutItem {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    roomName: row.room_name as string,
    kind: row.kind as LayoutItemKind,
    label: row.label as string | null,
    shape: row.shape as LayoutItemShape,
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

/** Domyślny rozmiar/kształt per rodzaj - MARKER to małe kółko, WALL to
 * cienki, długi prostokąt (odcinek ściany), ROOM_SHAPE to duży prostokąt
 * (para od razu widzi coś sensownego, zanim zacznie rozciągać). */
function defaultsForKind(kind: LayoutItemKind): {
  shape: LayoutItemShape;
  width: number;
  height: number;
} {
  switch (kind) {
    case "WALL":
      return { shape: "RECT", width: 120, height: 20 };
    case "ROOM_SHAPE":
      return { shape: "RECT", width: 320, height: 220 };
    case "MARKER":
    default:
      // 28x28 = tyle, ile dawniej dawał stały promień 14px okrągłego
      // znacznika - teraz to zwykły wymiar, regulowany tymi samymi
      // suwakami co ściana/bryła sali (patrz TablePlanner.tsx).
      return { shape: "OVAL", width: 28, height: 28 };
  }
}

export function adminCreateLayoutItem(params: {
  weddingId: string;
  roomName: string;
  kind: LayoutItemKind;
  label?: string | null;
  shape?: LayoutItemShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
}): LayoutItem {
  const id = newId("layout");
  const defaults = defaultsForKind(params.kind);
  db.prepare(
    `INSERT INTO layout_items (id, wedding_id, room_name, kind, label, shape, x, y, width, height)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.weddingId,
    params.roomName,
    params.kind,
    params.label ?? null,
    params.shape ?? defaults.shape,
    params.x,
    params.y,
    params.width ?? defaults.width,
    params.height ?? defaults.height
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

/** Zmiana kształtu - dla MARKER (koło ↔ prostokąt) i ROOM_SHAPE (prostokąt/
 * koło/owal/trójkąt/romb). Bez znaczenia dla WALL (zawsze prostokąt,
 * wywołujący i tak nie pokazuje tej opcji dla ścian w UI). */
export function adminSetLayoutItemShape(
  weddingId: string,
  itemId: string,
  shape: LayoutItemShape
): LayoutItem | null {
  db.prepare("UPDATE layout_items SET shape = ? WHERE id = ? AND wedding_id = ?").run(
    shape,
    itemId,
    weddingId
  );
  return adminFindLayoutItemById(weddingId, itemId);
}

/** Rozmiar - dla WALL i ROOM_SHAPE zawsze ma znaczenie; dla MARKER tylko
 * gdy shape="RECT" (okrągły znacznik ma stały rozmiar niezależny od tych
 * pól, patrz src/components/TablePlanner.tsx). */
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
