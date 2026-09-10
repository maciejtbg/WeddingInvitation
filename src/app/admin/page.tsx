import Link from "next/link";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingsByCouple } from "@/lib/db/weddings";
import { THEME_LIST } from "@/lib/themes";
import { SEATING_MODE_LIST } from "@/lib/seatingModes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import { adminListSeatChangeRequests } from "@/lib/db/seatRequests";
import { listGuestIdsAwaitingReply } from "@/lib/db/chat";
import { updateWeddingAction, publishWeddingAction, logoutCoupleAction } from "./actions";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; published?: string; welcome?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { saved, published, welcome } = await searchParams;
  const wedding = findWeddingsByCouple(session.coupleId)[0];
  const pendingSeatRequests = wedding
    ? adminListSeatChangeRequests(wedding.id).filter((r) => r.status === "PENDING").length
    : 0;
  const awaitingReplyCount = wedding ? listGuestIdsAwaitingReply(wedding.id).length : 0;

  if (!wedding) {
    // W praktyce nie powinno się zdarzyć (rejestracja tworzy wesele od razu),
    // ale zostawiamy czytelny komunikat zamiast białej strony.
    return (
      <div className="p-8">
        <p>Nie znaleziono wesela powiązanego z tym kontem.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Panel pary</h1>
        <form action={logoutCoupleAction}>
          <button className="text-sm text-zinc-500 underline">Wyloguj się</button>
        </form>
      </div>

      {welcome && (
        <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Konto utworzone. Wasza strona jest na razie w wersji roboczej -
          uzupełnijcie szczegóły poniżej i opublikujcie ją, kiedy będziecie gotowi.
        </p>
      )}
      {saved && (
        <p className="mb-6 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Zapisano zmiany.
        </p>
      )}
      {published && (
        <p className="mb-6 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Strona jest opublikowana.
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-rose-900">Podgląd Waszego zaproszenia</p>
          <p className="font-mono text-sm text-rose-700">/{wedding.slug}</p>
          <p className="mt-0.5 text-xs text-rose-600">
            Dokładnie to (historia, zdjęcia, harmonogram, FAQ...) zobaczy każdy gość po
            wejściu na stronę - sprawdźcie, zanim wyślecie zaproszenia.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            wedding.publishedAt
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {wedding.publishedAt ? "Opublikowana" : "Wersja robocza"}
        </span>
        <Link
          href={`/${wedding.slug}`}
          target="_blank"
          className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
        >
          👁 Zobacz podgląd
        </Link>
        <Link
          href={`/admin/guests?weddingId=${wedding.id}`}
          className="relative rounded-full bg-zinc-900 px-4 py-1.5 text-sm text-white hover:bg-zinc-700"
        >
          Zarządzaj gośćmi
          {awaitingReplyCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-medium text-amber-950">
              💬 {awaitingReplyCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/tables"
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Planer stołów
        </Link>
        <Link
          href={`/admin/groups?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Grupy gości
        </Link>
        <Link
          href={`/admin/locations?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Miejsca
        </Link>
        <Link
          href={`/admin/gallery?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Galeria
        </Link>
        <Link
          href={`/admin/schedule?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Harmonogram
        </Link>
        <Link
          href={`/admin/faq?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          FAQ
        </Link>
        <Link
          href={`/admin/music?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Lista muzyczna
        </Link>
        <Link
          href={`/admin/invite-card?weddingId=${wedding.id}`}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Karta zaproszenia
        </Link>
        <Link
          href={`/admin/seat-requests?weddingId=${wedding.id}`}
          className="relative rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          Prośby o zmianę miejsca
          {pendingSeatRequests > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {pendingSeatRequests}
            </span>
          )}
        </Link>
        <Link
          href="/admin/privacy"
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-400"
        >
          RODO i prywatność
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Szczegóły wesela</h2>
        <form action={updateWeddingAction} className="space-y-4">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Imię pierwszej osoby
              </label>
              <input
                name="partner1Name"
                defaultValue={wedding.partner1Name}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Imię drugiej osoby
              </label>
              <input
                name="partner2Name"
                defaultValue={wedding.partner2Name}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Data ślubu</label>
            <input
              type="date"
              name="weddingDate"
              defaultValue={wedding.weddingDate ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Nazwa miejsca
              </label>
              <input
                name="venueName"
                defaultValue={wedding.venueName ?? ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Adres</label>
              <input
                name="venueAddress"
                defaultValue={wedding.venueAddress ?? ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Wasza historia
            </label>
            <p className="mb-1.5 text-xs text-zinc-500">
              Jak się poznaliście, jak wyglądały zaręczyny - to, co zobaczą goście na
              stronie głównej zaproszenia, zanim zalogują się swoim linkiem.
            </p>
            <textarea
              name="story"
              rows={4}
              placeholder="Poznaliśmy się w..."
              defaultValue={wedding.story ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Link do filmu (opcjonalnie)
            </label>
            <p className="mb-1.5 text-xs text-zinc-500">
              Np. link YouTube/Vimeo do teledysku zaręczynowego albo zaproszenia wideo -
              pojawi się na stronie głównej obok historii.
            </p>
            <input
              type="url"
              name="videoUrl"
              placeholder="https://www.youtube.com/watch?v=..."
              defaultValue={wedding.videoUrl ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Prezenty (opcjonalnie, dowolna forma - żartobliwie też można)
            </label>
            <textarea
              name="giftNote"
              rows={2}
              placeholder="np. Zamiast kwiatów wolimy dobre wino 🍷, a najbardziej ucieszy nas koperta!"
              defaultValue={wedding.giftNote ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Retencja danych gości (dni po ślubie)
            </label>
            <input
              type="number"
              name="dataRetentionDays"
              min={1}
              max={3650}
              defaultValue={wedding.dataRetentionDays}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Po tylu dniach od daty ślubu dane osobowe gości mogą zostać automatycznie
              usunięte (RODO) - szczegóły w sekcji{" "}
              <Link href="/admin/privacy" className="underline">
                RODO i prywatność
              </Link>
              .
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Rozmieszczanie gości przy stołach
            </label>
            <div className="space-y-2">
              {SEATING_MODE_LIST.map((mode) => (
                <label
                  key={mode.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-zinc-300 p-3 has-[:checked]:border-zinc-900 has-[:checked]:ring-1 has-[:checked]:ring-zinc-900"
                >
                  <input
                    type="radio"
                    name="seatingMode"
                    value={mode.id}
                    defaultChecked={wedding.seatingMode === mode.id}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900">{mode.label}</span>
                    <span className="block text-xs leading-tight text-zinc-500">
                      {mode.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Styl graficzny strony
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {THEME_LIST.map((theme) => (
                <label
                  key={theme.id}
                  className="cursor-pointer rounded-lg border border-zinc-300 p-3 has-[:checked]:border-zinc-900 has-[:checked]:ring-1 has-[:checked]:ring-zinc-900"
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme.id}
                    defaultChecked={wedding.theme === theme.id}
                    className="sr-only"
                  />
                  <div
                    className="mb-2 flex h-10 items-center justify-center rounded-md"
                    style={{ background: theme.colors.background }}
                  >
                    <ThemeOrnament
                      theme={theme.id}
                      className="h-4 w-24"
                      style={{ color: theme.colors.accent }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {theme.swatches.map((color, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-zinc-900">{theme.label}</p>
                  <p className="text-[11px] leading-tight text-zinc-500">{theme.description}</p>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Zapisz
          </button>
        </form>

        {!wedding.publishedAt && (
          <form action={publishWeddingAction} className="mt-4 border-t border-zinc-100 pt-4">
            <input type="hidden" name="weddingId" value={wedding.id} />
            <p className="mb-2 text-sm text-zinc-500">
              Strona jest widoczna tylko dla Was, dopóki jej nie opublikujecie.
            </p>
            <button
              type="submit"
              className="rounded-full border border-zinc-900 px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-900 hover:text-white"
            >
              Opublikuj stronę
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
