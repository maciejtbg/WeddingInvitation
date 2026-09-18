// Zakupy dodatkowych zdjęć (patrz src/lib/photoPack.ts - cennik i efektywny
// limit) - jeden wiersz na jeden pakiet, niezależnie od tego, czy opłacony
// przez Stripe Checkout, czy w 100% rabatowany kodem (wtedy status od razu
// 'PAID', bez sesji Stripe - patrz stripeSessionId: null).

import { db, newId } from "./client";
import type { PhotoPackPurchase, PhotoPackPurchaseStatus, SqliteRow } from "./types";
import { incrementDiscountCodeUsage } from "./discountCodes";

function rowToPurchase(row: SqliteRow): PhotoPackPurchase {
  return {
    id: row.id as string,
    weddingId: row.wedding_id as string,
    stripeSessionId: row.stripe_session_id as string | null,
    photosGranted: row.photos_granted as number,
    amountPaidCents: row.amount_paid_cents as number,
    discountCodeId: row.discount_code_id as string | null,
    status: row.status as PhotoPackPurchaseStatus,
    createdAt: row.created_at as string,
    paidAt: row.paid_at as string | null,
  };
}

/** Suma zdjęć doliczonych przez WSZYSTKIE opłacone pakiety tego wesela -
 * to jedyne źródło prawdy dla "ile dodatkowego miejsca para dokupiła",
 * patrz effectivePhotoLimit w src/lib/photoPack.ts. Tylko status='PAID' -
 * porzucone/nieopłacone sesje Checkout nigdy nie liczą się do limitu. */
export function sumPaidPhotosGranted(weddingId: string): number {
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(photos_granted), 0) as total FROM photo_pack_purchases WHERE wedding_id = ? AND status = 'PAID'"
    )
    .get(weddingId) as { total: number };
  return row.total;
}

export function listPurchasesForWedding(weddingId: string): PhotoPackPurchase[] {
  const rows = db
    .prepare("SELECT * FROM photo_pack_purchases WHERE wedding_id = ? ORDER BY created_at DESC")
    .all(weddingId);
  return rows.map(rowToPurchase);
}

export function findPurchaseByStripeSessionId(stripeSessionId: string): PhotoPackPurchase | null {
  const row = db
    .prepare("SELECT * FROM photo_pack_purchases WHERE stripe_session_id = ?")
    .get(stripeSessionId);
  return row ? rowToPurchase(row as SqliteRow) : null;
}

/** Tworzy wiersz PRZED przekierowaniem na Stripe Checkout - stripe_session_id
 * musi być znany w tym momencie (sesja Checkout jest tworzona najpierw po
 * stronie Stripe, patrz buyPhotoPackAction), żeby webhook miał po czym
 * dopasować płatność do tego wesela. */
export function createPendingPurchase(params: {
  weddingId: string;
  stripeSessionId: string;
  photosGranted: number;
  amountPaidCents: number;
  discountCodeId: string | null;
}): PhotoPackPurchase {
  const id = newId("purchase");
  db.prepare(
    `INSERT INTO photo_pack_purchases
       (id, wedding_id, stripe_session_id, photos_granted, amount_paid_cents, discount_code_id, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`
  ).run(
    id,
    params.weddingId,
    params.stripeSessionId,
    params.photosGranted,
    params.amountPaidCents,
    params.discountCodeId
  );
  const purchase = db.prepare("SELECT * FROM photo_pack_purchases WHERE id = ?").get(id);
  if (!purchase) throw new Error("Nie udało się zapisać zakupu");
  return rowToPurchase(purchase as SqliteRow);
}

/** Pakiet w 100% rabatowany kodem - bez żadnej sesji Stripe, od razu
 * opłacony (kwota 0), patrz buyPhotoPackAction. Doliczenie użycia kodu
 * dzieje się TUTAJ (nie osobno przez wywołującego), z tego samego powodu co
 * w confirmPhotoPackPurchase - jeden punkt prawdy "kiedy kod faktycznie
 * został zużyty". */
export function createFreePurchaseFromDiscountCode(params: {
  weddingId: string;
  photosGranted: number;
  discountCodeId: string;
}): PhotoPackPurchase {
  const id = newId("purchase");
  db.prepare(
    `INSERT INTO photo_pack_purchases
       (id, wedding_id, stripe_session_id, photos_granted, amount_paid_cents, discount_code_id, status, paid_at)
     VALUES (?, ?, NULL, ?, 0, ?, 'PAID', datetime('now'))`
  ).run(id, params.weddingId, params.photosGranted, params.discountCodeId);
  incrementDiscountCodeUsage(params.discountCodeId);
  const purchase = db.prepare("SELECT * FROM photo_pack_purchases WHERE id = ?").get(id);
  if (!purchase) throw new Error("Nie udało się zapisać zakupu");
  return rowToPurchase(purchase as SqliteRow);
}

/** Potwierdzenie opłaconej sesji Stripe Checkout - wywoływane zarówno z
 * webhooka (src/app/api/stripe-webhook/route.ts, źródło prawdy) jak i ze
 * strony powrotnej w galerii (szybszy podgląd dla gościa, zanim webhook
 * zdąży dojść) - stąd idempotentnie: jeśli wiersz jest już PAID, nic nie
 * robi drugi raz (w szczególności NIE dolicza jeszcze raz użycia kodu). */
export function confirmPhotoPackPurchase(stripeSessionId: string): PhotoPackPurchase | null {
  const purchase = findPurchaseByStripeSessionId(stripeSessionId);
  if (!purchase) return null;
  if (purchase.status === "PAID") return purchase;

  db.prepare(
    "UPDATE photo_pack_purchases SET status = 'PAID', paid_at = datetime('now') WHERE id = ?"
  ).run(purchase.id);
  if (purchase.discountCodeId) {
    incrementDiscountCodeUsage(purchase.discountCodeId);
  }
  const updated = db.prepare("SELECT * FROM photo_pack_purchases WHERE id = ?").get(purchase.id);
  return updated ? rowToPurchase(updated as SqliteRow) : null;
}
