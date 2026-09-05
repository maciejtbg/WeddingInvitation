import { db, newId } from "./client";
import type { Couple, SqliteRow } from "./types";

function rowToCouple(row: SqliteRow): Couple {
  return {
    id: row.id as string,
    email: row.email as string,
    passwordHash: row.password_hash as string,
    createdAt: row.created_at as string,
  };
}

export function findCoupleByEmail(email: string): Couple | null {
  const row = db
    .prepare("SELECT * FROM couples WHERE email = ?")
    .get(email.trim().toLowerCase());
  return row ? rowToCouple(row) : null;
}

export function findCoupleById(id: string): Couple | null {
  const row = db.prepare("SELECT * FROM couples WHERE id = ?").get(id);
  return row ? rowToCouple(row) : null;
}

export function createCouple(email: string, passwordHash: string): Couple {
  const id = newId("couple");
  db.prepare(
    "INSERT INTO couples (id, email, password_hash) VALUES (?, ?, ?)"
  ).run(id, email.trim().toLowerCase(), passwordHash);
  const couple = findCoupleById(id);
  if (!couple) throw new Error("Nie udało się utworzyć konta");
  return couple;
}
