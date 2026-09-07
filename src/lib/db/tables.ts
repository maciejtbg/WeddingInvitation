// Warstwa danych planera stołów.
//
// Sala nie jest osobną tabelą - to po prostu wartość `room_name` na
// konkretnych stołach (patrz src/lib/db/client.ts, tabela `tables_`).
// Dzięki temu dodanie/usunięcie sali nie wymaga migracji ani osobnego
// CRUD-u: sala istnieje, dopóki istnieje choć jeden stół z tą nazwą.
//
// Ten sam podział co w guests.ts: `admin*` (pełny dostęp, tylko z tras
// zabezpieczonych sesją pary) i `guest*` (zawsze scope'owane do jednego,
// konkretnego gościa - tu: wyłącznie jego własne miejsce, nigdy plan sali).
//
// seat_assignments.guest_id ma UNIQUE - jeden gość siedzi tylko w jednym
// miejscu naraz. adminAssignSeat korzysta z tego wprost: najpierw usuwa
// starą pozycję tego gościa (jeśli była), potem usuwa kogokolwiek, kto już
// siedzi w miejscu docelowym ("podbicie"), i dopiero wtedy wstawia nowe
// przypisanie - w tej kolejności, żeby przeniesienie gościa o jedno miejsce
// dalej przy tym samym stole zadziałało mimo ograniczenia UNIQUE.

import { db, newId } from "./client";
import type { SqliteRow, TableShape, WeddingTable, SeatWithGuestName } from "./types";

function rowToTable(row: SqliteRow): WeddingTable {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    roomName: row.room_name as string,
    label: row.label as string,
    shape: row.shape as TableShape,
    x: row.x as number,
    y: row.y as number,
    rotation: row.rotation as number,
    seatsCount: row.seats_count as number,
  };
}

function rowToSeat(row: SqliteRow): SeatWithGuestName {
  return {
    id: row.id as string,
    tableId: row.table_id as string,
    guestId: row.guest_id as string,
    seatIndex: row.seat_index as number,
    guestFirstName: row.first_name as string,
    guestLastName: row.last_name as string | null,
  };
}

// --- Dostęp administracyjny (konto pary) ---

export function adminListTables(weddingId: string): WeddingTable[] {
  const rows = db
    .prepare("SELECT * FROM tables_ WHERE wedding_id = ? ORDER BY label ASC")
    .all(weddingId);
  return rows.map(rowToTable);
}

export function adminFindTableById(weddingId: string, tableId: string): WeddingTable | null {
  const row = db
    .prepare("SELECT * FROM tables_ WHERE id = ? AND wedding_id = ?")
    .get(tableId, weddingId);
  return row ? rowToTable(row) : null;
}

export function adminListSeats(weddingId: string): SeatWithGuestName[] {
  const rows = db
    .prepare(
      `SELECT sa.*, g.first_name, g.last_name
       FROM seat_assignments sa
       JOIN tables_ t ON t.id = sa.table_id
       JOIN guests g ON g.id = sa.guest_id
       WHERE t.wedding_id = ?`
    )
    .all(weddingId);
  return rows.map(rowToSeat);
}

export function adminGetPlannerSnapshot(weddingId: string): {
  tables: WeddingTable[];
  seats: SeatWithGuestName[];
} {
  return { tables: adminListTables(weddingId), seats: adminListSeats(weddingId) };
}

export function adminCreateTable(params: {
  weddingId: string;
  roomName: string;
  label: string;
  shape: TableShape;
  x: number;
  y: number;
  seatsCount: number;
}): WeddingTable {
  const id = newId("table");
  db.prepare(
    `INSERT INTO tables_ (id, wedding_id, room_name, label, shape, x, y, rotation, seats_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).run(
    id,
    params.weddingId,
    params.roomName,
    params.label,
    params.shape,
    params.x,
    params.y,
    params.seatsCount
  );
  const table = adminFindTableById(params.weddingId, id);
  if (!table) throw new Error("Nie udało się dodać stołu");
  return table;
}

export function adminUpdateTablePosition(
  weddingId: string,
  tableId: string,
  params: { x: number; y: number; rotation: number }
): void {
  db.prepare(
    "UPDATE tables_ SET x = ?, y = ?, rotation = ? WHERE id = ? AND wedding_id = ?"
  ).run(params.x, params.y, params.rotation, tableId, weddingId);
}

export function adminUpdateTableShape(
  weddingId: string,
  tableId: string,
  shape: TableShape
): WeddingTable | null {
  db.prepare("UPDATE tables_ SET shape = ? WHERE id = ? AND wedding_id = ?").run(
    shape,
    tableId,
    weddingId
  );
  return adminFindTableById(weddingId, tableId);
}

export function adminRenameTable(
  weddingId: string,
  tableId: string,
  label: string
): WeddingTable | null {
  db.prepare("UPDATE tables_ SET label = ? WHERE id = ? AND wedding_id = ?").run(
    label,
    tableId,
    weddingId
  );
  return adminFindTableById(weddingId, tableId);
}

/** Zmienia liczbę miejsc przy stole - w górę (np. dostawiono krzesła) albo
 * w dół (np. rozłączono dwa zsunięte stoły, zostaje mniej miejsc na
 * brzegu). Zmniejszenie poniżej obecnie zajętego numeru miejsca ZWALNIA
 * tych gości (usuwa ich przypisanie, nie kasuje samego gościa) - para
 * musi ich potem ręcznie posadzić gdzie indziej, ale to bezpieczniejsze niż
 * po cichu zablokować zmianę liczby miejsc z powodu jednego zajętego krzesła
 * na samym brzegu. */
export function adminUpdateSeatsCount(
  weddingId: string,
  tableId: string,
  seatsCount: number
): WeddingTable | null {
  db.prepare(
    `DELETE FROM seat_assignments
     WHERE table_id = ? AND seat_index >= ?
       AND table_id IN (SELECT id FROM tables_ WHERE id = ? AND wedding_id = ?)`
  ).run(tableId, seatsCount, tableId, weddingId);
  db.prepare("UPDATE tables_ SET seats_count = ? WHERE id = ? AND wedding_id = ?").run(
    seatsCount,
    tableId,
    weddingId
  );
  return adminFindTableById(weddingId, tableId);
}

export function adminDeleteTable(weddingId: string, tableId: string): void {
  // ON DELETE CASCADE w schemacie seat_assignments sprząta przypisania
  // gości do tego stołu automatycznie.
  db.prepare("DELETE FROM tables_ WHERE id = ? AND wedding_id = ?").run(tableId, weddingId);
}

export function adminAssignSeat(
  weddingId: string,
  params: { tableId: string; guestId: string; seatIndex: number }
): SeatWithGuestName[] {
  const table = adminFindTableById(weddingId, params.tableId);
  if (!table) throw new Error("Stół nie należy do tego wesela");
  if (params.seatIndex < 0 || params.seatIndex >= table.seatsCount) {
    throw new Error("Nieprawidłowy numer miejsca");
  }

  const guestRow = db
    .prepare("SELECT id FROM guests WHERE id = ? AND wedding_id = ?")
    .get(params.guestId, weddingId);
  if (!guestRow) throw new Error("Gość nie należy do tego wesela");

  db.prepare("DELETE FROM seat_assignments WHERE guest_id = ?").run(params.guestId);
  db.prepare("DELETE FROM seat_assignments WHERE table_id = ? AND seat_index = ?").run(
    params.tableId,
    params.seatIndex
  );
  db.prepare(
    "INSERT INTO seat_assignments (id, table_id, guest_id, seat_index) VALUES (?, ?, ?, ?)"
  ).run(newId("seat"), params.tableId, params.guestId, params.seatIndex);

  return adminListSeats(weddingId);
}

export function adminUnassignGuest(weddingId: string, guestId: string): SeatWithGuestName[] {
  db.prepare(
    `DELETE FROM seat_assignments
     WHERE guest_id = ?
       AND table_id IN (SELECT id FROM tables_ WHERE wedding_id = ?)`
  ).run(guestId, weddingId);
  return adminListSeats(weddingId);
}

// --- Dostęp gościa (wyłącznie własne miejsce, nigdy plan całej sali) ---

export interface GuestSeatView {
  tableLabel: string;
  roomName: string;
}

export function guestFindMySeat(guestId: string): GuestSeatView | null {
  const row = db
    .prepare(
      `SELECT t.label AS table_label, t.room_name AS room_name
       FROM seat_assignments sa
       JOIN tables_ t ON t.id = sa.table_id
       WHERE sa.guest_id = ?`
    )
    .get(guestId) as { table_label: string; room_name: string } | undefined;
  return row ? { tableLabel: row.table_label, roomName: row.room_name } : null;
}

// --- Dostęp gościa - tryby GUEST_SELF_SELECT / GROUP_CONSTRAINED ---
//
// W przeciwieństwie do adminAssignSeat, samodzielny wybór gościa NIGDY nie
// "podbija" kogoś, kto już siedzi w danym miejscu - to byłoby niemiłe
// zaskoczenie dla drugiego gościa. Zajęte miejsce po prostu nie jest
// wybieralne (guestSelfAssignSeat zwraca błąd, jeśli mimo to spróbować).

export interface AvailableSeat {
  seatIndex: number;
  occupiedByFirstName: string | null;
  isMe: boolean;
}

export interface AvailableTable {
  id: string;
  roomName: string;
  label: string;
  shape: TableShape;
  seats: AvailableSeat[];
}

/** Dozwolone dla grupy stoły - patrz src/lib/db/groups.ts: brak
 * jakiegokolwiek wiersza w group_table_allowances dla danej grupy oznacza
 * "wszystkie stoły dozwolone", nie "żaden". */
function allowedTableIdsForGuest(weddingId: string, guestId: string): string[] | null {
  const guestRow = db
    .prepare("SELECT group_id FROM guests WHERE id = ? AND wedding_id = ?")
    .get(guestId, weddingId) as { group_id: string | null } | undefined;
  if (!guestRow?.group_id) return null;

  const rows = db
    .prepare("SELECT table_id FROM group_table_allowances WHERE group_id = ?")
    .all(guestRow.group_id) as { table_id: string }[];
  return rows.length > 0 ? rows.map((r) => r.table_id) : null;
}

export function guestListAvailableSeats(weddingId: string, guestId: string): AvailableTable[] {
  const allowedTableIds = allowedTableIdsForGuest(weddingId, guestId);
  const tables = adminListTables(weddingId).filter(
    (t) => !allowedTableIds || allowedTableIds.includes(t.id)
  );
  const seatsByTable = new Map<string, SeatWithGuestName[]>();
  for (const seat of adminListSeats(weddingId)) {
    const list = seatsByTable.get(seat.tableId) ?? [];
    list.push(seat);
    seatsByTable.set(seat.tableId, list);
  }

  return tables.map((table) => {
    const occupied = seatsByTable.get(table.id) ?? [];
    const seats: AvailableSeat[] = Array.from({ length: table.seatsCount }).map((_, i) => {
      const seat = occupied.find((s) => s.seatIndex === i);
      return {
        seatIndex: i,
        occupiedByFirstName: seat ? seat.guestFirstName : null,
        isMe: seat?.guestId === guestId,
      };
    });
    return { id: table.id, roomName: table.roomName, label: table.label, shape: table.shape, seats };
  });
}

export function guestSelfAssignSeat(
  weddingId: string,
  guestId: string,
  tableId: string,
  seatIndex: number
): void {
  const table = adminFindTableById(weddingId, tableId);
  if (!table) throw new Error("Stół nie należy do tego wesela");
  if (seatIndex < 0 || seatIndex >= table.seatsCount) {
    throw new Error("Nieprawidłowy numer miejsca");
  }

  const allowedTableIds = allowedTableIdsForGuest(weddingId, guestId);
  if (allowedTableIds && !allowedTableIds.includes(tableId)) {
    throw new Error("Ten stół nie jest dostępny dla Twojej grupy gości");
  }

  const occupant = db
    .prepare("SELECT guest_id FROM seat_assignments WHERE table_id = ? AND seat_index = ?")
    .get(tableId, seatIndex) as { guest_id: string } | undefined;
  if (occupant && occupant.guest_id !== guestId) {
    throw new Error("To miejsce jest już zajęte - wybierz inne");
  }

  db.prepare("DELETE FROM seat_assignments WHERE guest_id = ?").run(guestId);
  db.prepare(
    "INSERT INTO seat_assignments (id, table_id, guest_id, seat_index) VALUES (?, ?, ?, ?)"
  ).run(newId("seat"), tableId, guestId, seatIndex);
}
