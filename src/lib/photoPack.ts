// Cennik i logika "ile zdjęć wolno tej parze" - patrz FREE_PHOTOS_LIMIT w
// src/lib/photoStorage.ts (darmowy start) i src/lib/db/photoPackPurchases.ts
// (opłacone pakiety). Konto pary jest darmowe, dopóki galeria mieści się w
// darmowym limicie - dopiero przekroczenie go wymaga zakupu pakietu, nigdy
// samo założenie konta/strony.

import type { DiscountCode } from "./db/types";
import { sumPaidPhotosGranted } from "./db/photoPackPurchases";

// Darmowy start - każde nowe wesele ma tyle miejsca w galerii bez żadnej
// płatności (patrz src/lib/photoStorage.ts - kompresja/limit rozmiaru
// pliku, ale NIE limit liczby zdjęć, ten mieszka tutaj razem z resztą
// cennika). Historycznie to była stała MAX_PHOTOS_PER_WEDDING w
// photoStorage.ts - przeniesiona tutaj, bo to decyzja cenowa, nie
// techniczna, i musi siedzieć obok PHOTOS_PER_PACK/PACK_PRICE_CENTS.
export const FREE_PHOTOS_LIMIT = 10;

export const PHOTOS_PER_PACK = 50;
export const PACK_PRICE_CENTS = 2900; // 29,00 zł (grosze - najmniejsza jednostka, jak Stripe unit_amount)
export const PACK_CURRENCY = "pln";

// Stripe (i banki) odrzucają/utrudniają bardzo małe obciążenia karty -
// rabat kwotowy nigdy nie schodzi PONIŻEJ tej kwoty, żeby nie próbować
// utworzyć sesji Checkout na np. 0,10 zł. Rabat, który zszedłby poniżej,
// jest w praktyce "prawie darmowy pakiet" - para powinna dostać kod 100%
// (PERCENT, wartość 100), nie kwotowy bliski całej cenie.
export const MIN_CHARGE_CENTS = 200; // 2,00 zł

/** Efektywny limit zdjęć TEGO wesela - darmowy start + suma opłaconych
 * pakietów. Jedyne miejsce, które wolno pytać "ile miejsca ma ta para" -
 * uploadPhoto (photoStorage.ts) i strony galerii korzystają wyłącznie z tej
 * funkcji, nigdy z samej stałej FREE_PHOTOS_LIMIT. */
export function effectivePhotoLimit(weddingId: string): number {
  return FREE_PHOTOS_LIMIT + sumPaidPhotosGranted(weddingId);
}

export interface DiscountedAmount {
  finalCents: number;
  /** Kod dał 100% rabatu - pakiet ma zostać przyznany od razu, bez sesji
   * Stripe Checkout (patrz createFreePurchaseFromDiscountCode). */
  isFree: boolean;
}

/** Przelicza cenę pakietu po zastosowaniu kodu - NIE sprawdza tu ważności
 * kodu (to już zrobił findActiveDiscountCodeByCode/isDiscountCodeActive u
 * wywołującego), tylko liczy kwotę. Wynik zawsze w przedziale
 * [0, PACK_PRICE_CENTS], nigdy ujemny. */
export function computeDiscountedAmount(code: DiscountCode | null): DiscountedAmount {
  if (!code) return { finalCents: PACK_PRICE_CENTS, isFree: false };

  let final: number;
  if (code.discountType === "PERCENT") {
    const percent = Math.min(100, Math.max(0, code.discountValue));
    final = Math.round(PACK_PRICE_CENTS * (1 - percent / 100));
  } else {
    const subtractCents = Math.round(Math.max(0, code.discountValue) * 100);
    final = PACK_PRICE_CENTS - subtractCents;
  }
  final = Math.max(0, Math.min(PACK_PRICE_CENTS, final));

  if (final === 0) return { finalCents: 0, isFree: true };
  if (final < MIN_CHARGE_CENTS) return { finalCents: MIN_CHARGE_CENTS, isFree: false };
  return { finalCents: final, isFree: false };
}

export function formatPln(cents: number): string {
  return (cents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
}

/** Główny wyłącznik całego obszaru płatnego (kupno pakietów, w tym przez
 * kod rabatowy ze 100% zniżką) - świadoma decyzja: strona ma się najpierw
 * "rozkręcić" bez sprzedaży, dopóki para prowadząca serwis nie założy JDG
 * pod sprzedaż zagraniczną i bramki płatniczej (Stripe/Paddle - patrz
 * README, sekcja "Płatności"). Domyślnie WYŁĄCZONE (brak
 * PAYMENTS_ENABLED=true w env) - ten sam wzorzec "bezpieczny domyślny stan"
 * co RETENTION_PURGE_SECRET w src/app/api/purge-expired-data/route.ts.
 * Reaktywacja to jedna zmienna środowiskowa + restart, bez zmian w kodzie -
 * patrz buyPhotoPackAction (src/app/admin/gallery/actions.ts) i
 * GalleryPage (src/app/admin/gallery/page.tsx), jedyne dwa miejsca, które
 * to sprawdzają. Panel /super-admin/discount-codes zostaje dostępny mimo
 * wyłącznika - para prowadząca serwis może przygotować kody z wyprzedzeniem. */
export function isPaymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === "true";
}
