import { db, newId } from "./client";
import type { Wedding, SqliteRow } from "./types";
import { DEFAULT_THEME, isThemeId } from "@/lib/themes";
import { DEFAULT_SEATING_MODE, isSeatingMode } from "@/lib/seatingModes";

function rowToWedding(row: SqliteRow): Wedding {
  const rawTheme = row.theme as string | null;
  const rawSeatingMode = row.seating_mode as string | null;
  return {
    id: row.id as string,
    coupleId: row.couple_id as string,
    slug: row.slug as string,
    partner1Name: row.partner1_name as string,
    partner2Name: row.partner2_name as string,
    weddingDate: row.wedding_date as string | null,
    venueName: row.venue_name as string | null,
    venueAddress: row.venue_address as string | null,
    story: row.story as string | null,
    // Obrona na wypadek starszego wiersza / nieznanej wartości w bazie -
    // zawsze wracamy z poprawnym ThemeId, nigdy z dowolnym stringiem.
    theme: isThemeId(rawTheme) ? rawTheme : DEFAULT_THEME,
    seatingMode: isSeatingMode(rawSeatingMode) ? rawSeatingMode : DEFAULT_SEATING_MODE,
    giftNote: row.gift_note as string | null,
    publishedAt: row.published_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // usuń polskie znaki diakrytyczne
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Generuje unikalny slug na bazie imion pary, dokładając numer, gdy zajęty. */
export function generateUniqueSlug(partner1Name: string, partner2Name: string): string {
  const base = slugify(`${partner1Name}-i-${partner2Name}`) || "wesele";
  let candidate = base;
  let i = 2;
  while (findWeddingBySlug(candidate)) {
    candidate = `${base}-${i}`;
    i += 1;
  }
  return candidate;
}

export function findWeddingBySlug(slug: string): Wedding | null {
  const row = db.prepare("SELECT * FROM weddings WHERE slug = ?").get(slug);
  return row ? rowToWedding(row) : null;
}

export function findWeddingById(id: string): Wedding | null {
  const row = db.prepare("SELECT * FROM weddings WHERE id = ?").get(id);
  return row ? rowToWedding(row) : null;
}

export function findWeddingsByCouple(coupleId: string): Wedding[] {
  const rows = db
    .prepare("SELECT * FROM weddings WHERE couple_id = ? ORDER BY created_at ASC")
    .all(coupleId);
  return rows.map(rowToWedding);
}

export function createWedding(params: {
  coupleId: string;
  partner1Name: string;
  partner2Name: string;
}): Wedding {
  const id = newId("wedding");
  const slug = generateUniqueSlug(params.partner1Name, params.partner2Name);
  db.prepare(
    `INSERT INTO weddings (id, couple_id, slug, partner1_name, partner2_name)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, params.coupleId, slug, params.partner1Name, params.partner2Name);
  const wedding = findWeddingById(id);
  if (!wedding) throw new Error("Nie udało się utworzyć strony wesela");
  return wedding;
}

export function updateWeddingDetails(
  id: string,
  fields: Partial<
    Pick<
      Wedding,
      | "partner1Name"
      | "partner2Name"
      | "weddingDate"
      | "venueName"
      | "venueAddress"
      | "story"
      | "theme"
      | "seatingMode"
      | "giftNote"
    >
  >
): void {
  const columnMap: Record<string, string> = {
    partner1Name: "partner1_name",
    partner2Name: "partner2_name",
    weddingDate: "wedding_date",
    venueName: "venue_name",
    venueAddress: "venue_address",
    story: "story",
    theme: "theme",
    seatingMode: "seating_mode",
    giftNote: "gift_note",
  };
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const setClause = entries.map(([key]) => `${columnMap[key]} = ?`).join(", ");
  const values = entries.map(([, v]) => v);
  db.prepare(
    `UPDATE weddings SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
  ).run(...values, id);
}

export function publishWedding(id: string): void {
  db.prepare(
    "UPDATE weddings SET published_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
  ).run(id);
}
