// Grupy gości (rodzina/praca/przyjaciele) i zezwolenia na stoły dla trybu
// rozmieszczania GROUP_CONSTRAINED (patrz src/lib/seatingModes.ts).
//
// Brak jakiegokolwiek wiersza w group_table_allowances dla danej grupy
// oznacza "wszystkie stoły dozwolone" - para nie musi konfigurować
// ograniczeń dla grup, którym ufa bez zastrzeżeń. Dopiero dodanie choć
// jednego zezwolenia zawęża wybór wyłącznie do wskazanych stołów.

import { db, newId } from "./client";
import type { GuestGroup, SqliteRow } from "./types";

function rowToGroup(row: SqliteRow): GuestGroup {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

export function adminListGroups(weddingId: string): GuestGroup[] {
  const rows = db
    .prepare("SELECT * FROM guest_groups WHERE wedding_id = ? ORDER BY name ASC")
    .all(weddingId);
  return rows.map(rowToGroup);
}

export function adminFindGroupById(weddingId: string, groupId: string): GuestGroup | null {
  const row = db
    .prepare("SELECT * FROM guest_groups WHERE id = ? AND wedding_id = ?")
    .get(groupId, weddingId);
  return row ? rowToGroup(row) : null;
}

export function adminCreateGroup(weddingId: string, name: string): GuestGroup {
  const id = newId("group");
  db.prepare("INSERT INTO guest_groups (id, wedding_id, name) VALUES (?, ?, ?)").run(
    id,
    weddingId,
    name
  );
  const group = adminFindGroupById(weddingId, id);
  if (!group) throw new Error("Nie udało się utworzyć grupy");
  return group;
}

export function adminRenameGroup(weddingId: string, groupId: string, name: string): void {
  db.prepare("UPDATE guest_groups SET name = ? WHERE id = ? AND wedding_id = ?").run(
    name,
    groupId,
    weddingId
  );
}

export function adminDeleteGroup(weddingId: string, groupId: string): void {
  // ON DELETE SET NULL (guests.group_id) i ON DELETE CASCADE
  // (group_table_allowances) sprzątają powiązania automatycznie.
  db.prepare("DELETE FROM guest_groups WHERE id = ? AND wedding_id = ?").run(groupId, weddingId);
}

export function adminListAllowedTableIds(groupId: string): string[] {
  const rows = db
    .prepare("SELECT table_id FROM group_table_allowances WHERE group_id = ?")
    .all(groupId) as { table_id: string }[];
  return rows.map((r) => r.table_id);
}

/** Mapa groupId -> lista dozwolonych tableId, dla wszystkich grup wesela
 * naraz - wygodne do renderowania siatki checkboxów na stronie Grupy gości. */
export function adminListAllowancesByGroup(weddingId: string): Record<string, string[]> {
  const rows = db
    .prepare(
      `SELECT gta.group_id, gta.table_id
       FROM group_table_allowances gta
       JOIN guest_groups gg ON gg.id = gta.group_id
       WHERE gg.wedding_id = ?`
    )
    .all(weddingId) as { group_id: string; table_id: string }[];
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    (map[row.group_id] ??= []).push(row.table_id);
  }
  return map;
}

export function adminSetGroupTableAllowance(
  groupId: string,
  tableId: string,
  allowed: boolean
): void {
  if (allowed) {
    db.prepare(
      "INSERT OR IGNORE INTO group_table_allowances (id, group_id, table_id) VALUES (?, ?, ?)"
    ).run(newId("allow"), groupId, tableId);
  } else {
    db.prepare(
      "DELETE FROM group_table_allowances WHERE group_id = ? AND table_id = ?"
    ).run(groupId, tableId);
  }
}
