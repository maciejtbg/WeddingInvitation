import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listPhotos } from "@/lib/db/photos";
import { MAX_COVER_PHOTOS } from "@/lib/photoStorage";
import {
  FREE_PHOTOS_LIMIT,
  PHOTOS_PER_PACK,
  PACK_PRICE_CENTS,
  effectivePhotoLimit,
  formatPln,
  isPaymentsEnabled,
} from "@/lib/photoPack";
import { confirmPhotoPackPurchase } from "@/lib/db/photoPackPurchases";
import { isStripeConfigured, getStripeClient } from "@/lib/stripeClient";
import PhotoGallery from "@/components/PhotoGallery";
import { adminUploadPhotoAction, deletePhotoAction, toggleCoverPhotoAction, buyPhotoPackAction } from "./actions";

/** Podgląd tuż po powrocie ze Stripe Checkout - szybsze potwierdzenie niż
 * czekanie na webhook (patrz app/api/stripe-webhook), ale NIE zastępuje go:
 * confirmPhotoPackPurchase jest idempotentne, więc obie ścieżki mogą
 * bezpiecznie wywołać się dla tej samej sesji. Sprawdzamy status wprost u
 * Stripe (nie ufamy samemu parametrowi w adresie) - dopiero payment_status
 * === "paid" uznajemy za faktyczną płatność. */
async function confirmIfNeeded(sessionId: string | undefined): Promise<void> {
  if (!sessionId || !isStripeConfigured()) return;
  try {
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      confirmPhotoPackPurchase(session.id);
    }
  } catch {
    // Sesja nieznana/błąd sieci do Stripe - webhook i tak dotrze osobno,
    // nie ma sensu wywalać całej strony galerii z tego powodu.
  }
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string; purchase?: string; session_id?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error, purchase, session_id } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const paymentsEnabled = isPaymentsEnabled();
  if (purchase === "success" && paymentsEnabled) {
    await confirmIfNeeded(session_id);
  }

  const photos = listPhotos(wedding.id);
  const limit = effectivePhotoLimit(wedding.id);
  const isFull = photos.length >= limit;
  const purchasedExtra = limit - FREE_PHOTOS_LIMIT;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Galeria</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Placeholder galerii zdjęć - zwykły dysk serwera, nie Cloudflare R2 (to
        wymaga Twoich danych dostępowych, patrz README). Konto jest darmowe do{" "}
        {FREE_PHOTOS_LIMIT} zdjęć - każde zdjęcie jest automatycznie
        zmniejszane i kompresowane po wgraniu, niezależnie od tego, ile
        ważyło na telefonie gościa. Widoczna dla wszystkich na Waszej
        publicznej stronie.
      </p>
      <p className="mb-6 text-sm text-zinc-500">
        Spośród swoich zdjęć (nie gości) możecie wybrać do {MAX_COVER_PHOTOS}{" "}
        jako rotujące tło pod Waszymi imionami na stronie głównej zaproszenia -
        przycisk &bdquo;Ustaw jako powitalne&rdquo; pod miniaturką.
      </p>

      {purchase === "success" && (
        <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Płatność przyjęta - limit galerii zwiększył się o {PHOTOS_PER_PACK} zdjęć.
        </p>
      )}
      {purchase === "free" && (
        <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Kod rabatowy dał Wam +{PHOTOS_PER_PACK} zdjęć całkowicie za darmo.
        </p>
      )}
      {purchase === "cancelled" && (
        <p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Płatność anulowana - limit galerii bez zmian.
        </p>
      )}

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">
            Zdjęcia ({photos.length}/{limit})
          </h2>
        </div>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
        {isFull ? (
          <p className="mb-4 text-sm text-amber-700">
            Galeria jest pełna - usuńcie jakieś zdjęcie
            {paymentsEnabled ? " albo dokupcie więcej miejsca poniżej." : "."}
          </p>
        ) : (
          <form
            action={adminUploadPhotoAction}
            encType="multipart/form-data"
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="weddingId" value={wedding.id} />
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="text-sm text-zinc-700"
            />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Dodaj zdjęcie
            </button>
          </form>
        )}

        {photos.length === 0 ? (
          <p className="text-sm text-zinc-500">Galeria jest jeszcze pusta.</p>
        ) : (
          <PhotoGallery
            weddingId={wedding.id}
            photos={photos}
            deleteAction={deletePhotoAction}
            coverAction={toggleCoverPhotoAction}
          />
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-medium text-zinc-900">Więcej miejsca w galerii</h2>
        {paymentsEnabled ? (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              {FREE_PHOTOS_LIMIT} zdjęć macie za darmo
              {purchasedExtra > 0 ? `, dokupione dotychczas: +${purchasedExtra}` : ""}. Każdy pakiet to +
              {PHOTOS_PER_PACK} zdjęć za {formatPln(PACK_PRICE_CENTS)}, jednorazowo - możecie dokupić
              kolejne w dowolnej chwili.
            </p>
            {/* Formularz jest widoczny zawsze, gdy płatności są włączone,
                nawet jeśli Stripe akurat nie jest skonfigurowany - kod
                rabatowy na 100% nie wymaga Stripe wcale (patrz
                buyPhotoPackAction). Dopiero próba realnej płatności bez
                skonfigurowanego Stripe kończy się czytelnym błędem z samej
                akcji. */}
            <form action={buyPhotoPackAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="weddingId" value={wedding.id} />
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700">
                  Kod rabatowy (opcjonalnie)
                </label>
                <input
                  name="discountCode"
                  placeholder="np. LATO2026"
                  className="w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm uppercase"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Kup pakiet +{PHOTOS_PER_PACK} zdjęć
              </button>
            </form>
            {!isStripeConfigured() && (
              <p className="mt-2 text-xs text-zinc-400">
                Płatności kartą/BLIK-iem nie są jeszcze skonfigurowane po stronie serwera - zadziała
                wyłącznie kod rabatowy dający 100% zniżki.
              </p>
            )}
          </>
        ) : (
          // Wyłącznik całego obszaru płatnego (patrz isPaymentsEnabled w
          // src/lib/photoPack.ts) - świadoma decyzja, żeby strona najpierw
          // "rozkręciła się" bez sprzedaży. Reaktywacja to jedna zmienna
          // środowiskowa (PAYMENTS_ENABLED=true) + restart serwera.
          <p className="text-sm text-zinc-400">
            Dokupowanie dodatkowego miejsca będzie dostępne wkrótce - na razie {FREE_PHOTOS_LIMIT}{" "}
            darmowych zdjęć wystarczy na start.
          </p>
        )}
      </div>
    </div>
  );
}
