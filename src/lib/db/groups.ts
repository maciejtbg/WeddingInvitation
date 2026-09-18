// Grupy gości (rodzina/praca/przyjaciele) i zezwolenia na stoły dla trybu
// rozmieszczania GROUP_CONSTRAINED (patrz src/lib/seatingModes.ts).
//
// Brak jakiegokolwiek wiersza w group_table_allowances dla danej grupy
// oznacza "wszystkie stoły dozwolone" - para nie musi konfigurować
// ograniczeń dla grup, którym ufa bez zastrzeżeń. Dopiero dodanie choć
// jednego zezwolenia zawęża wybór wyłącznie do wskazanych stołów.

import { db, newId, newGuestToken } from "./client";
import type { GuestGroup, SqliteRow } from "./types";

function rowToGroup(row: SqliteRow): GuestGroup {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    name: row.name as string,
    inviteToken: row.invite_token as string | null,
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

/** Odwrotność adminListAllowancesByGroup: mapa tableId -> lista nazw grup,
 * którym ten stół jest dozwolony - do pokazania "czyj to stół" bezpośrednio
 * w planerze (src/components/TablePlanner.tsx), bez przełączania się na
 * osobną stronę Grupy gości. */
export function adminListGroupNamesByTable(weddingId: string): Record<string, string[]> {
  const rows = db
    .prepare(
      `SELECT gta.table_id, gg.name
       FROM group_table_allowances gta
       JOIN guest_groups gg ON gg.id = gta.group_id
       WHERE gg.wedding_id = ?
       ORDER BY gg.name ASC`
    )
    .all(weddingId) as { table_id: string; name: string }[];
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    (map[row.table_id] ??= []).push(row.name);
  }
  return map;
}

/** Znajduje grupę po tokenie wspólnego linku zaproszenia grupowego - jedyne
 * miejsce, gdzie wolno wyszukiwać po tym tokenie (patrz
 * src/app/zg/[token]/route.ts), analogicznie do findGuestByTokenForLogin. */
export function findGroupByInviteToken(token: string): GuestGroup | null {
  const row = db.prepare("SELECT * FROM guest_groups WHERE invite_token = ?").get(token);
  return row ? rowToGroup(row) : null;
}

/** Generuje token wspólnego linku grupowego, jeśli grupa jeszcze go nie ma -
 * zwraca istniejący bez zmian, żeby ponowne kliknięcie w panelu pary nie
 * unieważniało linku już wysłanego przedstawicielowi grupy. */
export function adminGenerateGroupInviteToken(weddingId: string, groupId: string): string {
  const group = adminFindGroupById(weddingId, groupId);
  if (!group) throw new Error("Grupa nie należy do tego wesela");
  if (group.inviteToken) return group.inviteToken;

  const token = newGuestToken();
  db.prepare("UPDATE guest_groups SET invite_token = ? WHERE id = ?").run(token, groupId);
  return token;
}

/** Świadome unieważnienie starego linku (np. wysłany niewłaściwej osobie) -
 * w odróżnieniu od adminGenerateGroupInviteToken, ZAWSZE nadpisuje token. */
export function adminRegenerateGroupInviteToken(weddingId: string, groupId: string): string {
  const group = adminFindGroupById(weddingId, groupId);
  if (!group) throw new Error("Grupa nie należy do tego wesela");

  const token = newGuestToken();
  db.prepare("UPDATE guest_groups SET invite_token = ? WHERE id = ?").run(token, groupId);
  return token;
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
