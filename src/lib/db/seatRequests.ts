// Prośby gości o zmianę wcześniej przypisanego miejsca - tryb rozmieszczania
// GUEST_REQUEST (patrz src/lib/seatingModes.ts). Gość NIE przenosi się sam -
// tylko zgłasza chęć, para akceptuje/odrzuca tutaj i fizycznie przenosi go
// w planerze stołów (src/components/TablePlanner.tsx).

import { db, newId } from "./client";
import type { SeatChangeRequest, SeatChangeRequestStatus, SeatChangeRequestWithGuestName, SqliteRow } from "./types";

function rowToRequest(row: SqliteRow): SeatChangeRequest {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    guestId: row.guest_id as string,
    message: row.message as string | null,
    status: row.status as SeatChangeRequestStatus,
    createdAt: row.created_at as string,
    resolvedAt: row.resolved_at as string | null,
  };
}

function rowToRequestWithGuest(row: SqliteRow): SeatChangeRequestWithGuestName {
  return {
    ...rowToRequest(row),
    guestFirstName: row.first_name as string,
    guestLastName: row.last_name as string | null,
  };
}

// --- Dostęp administracyjny (konto pary) ---

export function adminListSeatChangeRequests(weddingId: string): SeatChangeRequestWithGuestName[] {
  const rows = db
    .prepare(
      `SELECT scr.*, g.first_name, g.last_name
       FROM seat_change_requests scr
       JOIN guests g ON g.id = scr.guest_id
       WHERE scr.wedding_id = ?
       ORDER BY (scr.status = 'PENDING') DESC, scr.created_at DESC`
    )
    .all(weddingId);
  return rows.map(rowToRequestWithGuest);
}

export function adminResolveSeatChangeRequest(
  weddingId: string,
  requestId: string,
  status: "APPROVED" | "DECLINED"
): void {
  db.prepare(
    `UPDATE seat_change_requests
     SET status = ?, resolved_at = datetime('now')
     WHERE id = ? AND wedding_id = ?`
  ).run(status, requestId, weddingId);
}

// --- Dostęp gościa (wyłącznie własne prośby) ---

export function guestListMyRequests(guestId: string): SeatChangeRequest[] {
  const rows = db
    .prepare("SELECT * FROM seat_change_requests WHERE guest_id = ? ORDER BY created_at DESC")
    .all(guestId);
  return rows.map(rowToRequest);
}

export function guestHasPendingRequest(guestId: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM seat_change_requests WHERE guest_id = ? AND status = 'PENDING'")
    .get(guestId);
  return !!row;
}

export function guestCreateSeatChangeRequest(
  weddingId: string,
  guestId: string,
  message: string | null
): SeatChangeRequest {
  const id = newId("seatreq");
  db.prepare(
    "INSERT INTO seat_change_requests (id, wedding_id, guest_id, message) VALUES (?, ?, ?, ?)"
  ).run(id, weddingId, guestId, message);
  const row = db.prepare("SELECT * FROM seat_change_requests WHERE id = ?").get(id);
  if (!row) throw new Error("Nie udało się zapisać prośby");
  return rowToRequest(row);
}
