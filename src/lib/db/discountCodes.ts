// Kody rabatowe - wyłącznie generowane/zarządzane z panelu super-admina
// (patrz src/app/super-admin/discount-codes), nigdy przez parę. Kod jest
// aktywny, jeśli: mieści się w (valid_from, valid_until) - obie granice
// opcjonalne - ORAZ used_count < max_uses (max_uses NULL = bez limitu).
// Faktyczne przeliczenie rabatu na kwotę patrz computeDiscountedAmount w
// src/lib/photoPack.ts - ten plik zajmuje się WYŁĄCZNIE samym kodem
// (istnieje/aktywny/zużycie), nie kwotami w groszach.

import { db, newId } from "./client";
import type { DiscountCode, DiscountType, SqliteRow } from "./types";

function rowToCode(row: SqliteRow): DiscountCode {
  return {
    id: row.id as string,
    code: row.code as string,
    discountType: row.discount_type as DiscountType,
    discountValue: row.discount_value as number,
    maxUses: row.max_uses as number | null,
    usedCount: row.used_count as number,
    validFrom: row.valid_from as string | null,
    validUntil: row.valid_until as string | null,
    createdAt: row.created_at as string,
  };
}

export function adminListDiscountCodes(): DiscountCode[] {
  const rows = db.prepare("SELECT * FROM discount_codes ORDER BY created_at DESC").all();
  return rows.map(rowToCode);
}

export function adminFindDiscountCodeById(id: string): DiscountCode | null {
  const row = db.prepare("SELECT * FROM discount_codes WHERE id = ?").get(id);
  return row ? rowToCode(row as SqliteRow) : null;
}

export function adminCreateDiscountCode(params: {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  validFrom: string | null;
  validUntil: string | null;
}): DiscountCode {
  const id = newId("discount");
  db.prepare(
    `INSERT INTO discount_codes (id, code, discount_type, discount_value, max_uses, valid_from, valid_until)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.code,
    params.discountType,
    params.discountValue,
    params.maxUses,
    params.validFrom,
    params.validUntil
  );
  const code = adminFindDiscountCodeById(id);
  if (!code) throw new Error("Nie udało się utworzyć kodu rabatowego");
  return code;
}

export function adminDeleteDiscountCode(id: string): void {
  db.prepare("DELETE FROM discount_codes WHERE id = ?").run(id);
}

/** Normalizacja wpisanego kodu - bez spacji, wielkimi literami, tak samo
 * przy tworzeniu (adminCreateDiscountCode nie normalizuje sama, robi to
 * wywołujący Server Action) jak i przy próbie użycia, żeby "letnia20" i
 * "LETNIA20" trafiały w ten sam wiersz. */
export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Czy kod jest aktywny TERAZ - okno ważności i limit użyć. Osobna funkcja
 * od findActiveDiscountCodeByCode, żeby dało się sprawdzić ważność kodu już
 * znalezionego (np. tuż przed doliczeniem użycia w confirmPhotoPackPurchase),
 * bez drugiego zapytania po samym stringu kodu. */
export function isDiscountCodeActive(code: DiscountCode, now: Date = new Date()): boolean {
  if (code.maxUses !== null && code.usedCount >= code.maxUses) return false;
  if (code.validFrom && now < new Date(code.validFrom)) return false;
  if (code.validUntil && now > new Date(code.validUntil)) return false;
  return true;
}

/** Jedyne miejsce, gdzie wolno wyszukiwać kod po wpisanym stringu (patrz
 * findGuestByTokenForLogin w guests.ts - ten sam wzorzec uzasadnienia).
 * Zwraca null zarówno gdy kod nie istnieje, jak i gdy istnieje, ale nie jest
 * aktywny - wywołujący nie musi rozróżniać tych dwóch przypadków przy
 * pokazywaniu błędu gościowi ("nieprawidłowy lub nieaktywny kod"). */
export function findActiveDiscountCodeByCode(rawCode: string): DiscountCode | null {
  const normalized = normalizeDiscountCode(rawCode);
  if (!normalized) return null;
  const row = db.prepare("SELECT * FROM discount_codes WHERE code = ?").get(normalized);
  if (!row) return null;
  const code = rowToCode(row as SqliteRow);
  return isDiscountCodeActive(code) ? code : null;
}

/** Doliczenie użycia - wywoływane WYŁĄCZNIE przy potwierdzonej (opłaconej
 * albo w 100% rabatowanej) transakcji, nigdy przy samym utworzeniu sesji
 * Stripe Checkout - patrz confirmPhotoPackPurchase w photoPackPurchases.ts. */
export function incrementDiscountCodeUsage(id: string): void {
  db.prepare("UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?").run(id);
}
