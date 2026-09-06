import Link from "next/link";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingsByCouple } from "@/lib/db/weddings";
import { deleteCoupleAccountAction, purgeGuestDataNowAction } from "./actions";

export default async function PrivacyDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ purged?: string; confirmDelete?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { purged, confirmDelete } = await searchParams;
  const wedding = findWeddingsByCouple(session.coupleId)[0];

  if (!wedding) {
    return (
      <div className="p-8">
        <p>Nie znaleziono wesela powiązanego z tym kontem.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">RODO i prywatność</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-medium text-zinc-900">Polityka prywatności</h2>
        <p className="mb-3 text-sm text-zinc-500">
          To, co widzą Wasi goście przed wyrażeniem zgody na przetwarzanie danych.
        </p>
        <Link
          href="/polityka-prywatnosci"
          target="_blank"
          className="text-sm font-medium text-zinc-900 underline"
        >
          Zobacz politykę prywatności ↗
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-medium text-zinc-900">Retencja danych gości</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Dane osobowe gości (RSVP, miejsce przy stole, wiadomości, zdjęcia) są
          automatycznie i trwale usuwane{" "}
          <strong>{wedding.dataRetentionDays} dni</strong> po dacie ślubu - liczbę dni
          zmienicie w ustawieniach strony na panelu głównym.{" "}
          {wedding.purgedAt
            ? `Dane gości tego wesela zostały już wyczyszczone (${new Date(wedding.purgedAt).toLocaleDateString("pl")}).`
            : "Automatyczne czyszczenie wymaga skonfigurowania crona na hostingu (patrz README) - poniżej możecie też wyczyścić dane ręcznie, w dowolnym momencie."}
        </p>
        {purged && (
          <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Dane gości zostały wyczyszczone.
          </p>
        )}
        {!wedding.purgedAt && (
          <form action={purgeGuestDataNowAction}>
            <input type="hidden" name="weddingId" value={wedding.id} />
            <button
              type="submit"
              className="rounded-full border border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Wyczyść teraz dane wszystkich gości
            </button>
            <p className="mt-2 text-xs text-zinc-400">
              Usunie nieodwracalnie wszystkich gości, ich RSVP, miejsca, wiadomości,
              prośby o zmianę miejsca i zdjęcia w galerii. Sama strona wesela (motyw,
              harmonogram, FAQ) zostanie.
            </p>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-medium text-red-900">Usuń konto i wszystkie dane</h2>
        <p className="mb-4 text-sm text-red-800">
          Usuwa nieodwracalnie Wasze konto, wszystkie Wasze wesela oraz wszystkie
          powiązane dane (gości, stoły, wiadomości, zdjęcia, harmonogram, FAQ,
          listę muzyczną). Tej operacji nie da się cofnąć.
        </p>
        {confirmDelete === "1" ? (
          <div className="rounded-md border border-red-300 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-red-900">
              Na pewno? To ostatni moment, żeby się wycofać.
            </p>
            <form action={deleteCoupleAccountAction} className="flex gap-3">
              <button
                type="submit"
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Tak, usuń trwale wszystko
              </button>
              <Link
                href="/admin/privacy"
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-400"
              >
                Anuluj
              </Link>
            </form>
          </div>
        ) : (
          <Link
            href="/admin/privacy?confirmDelete=1"
            className="inline-block rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Usuń konto i wszystkie dane
          </Link>
        )}
      </div>
    </div>
  );
}
