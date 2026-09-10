import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listSongRequests } from "@/lib/db/songRequests";
import { searchSongs } from "@/lib/musicSearch";
import { adminDeleteSongAction, adminAddSongAction } from "./actions";
import { LiveSearchInput } from "@/components/LiveSearchInput";

export default async function MusicAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; q?: string; added?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, q, added } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const songs = listSongRequests(wedding.id);
  const query = q?.trim() ?? "";
  let results: Awaited<ReturnType<typeof searchSongs>> = [];
  let searchError: string | null = null;
  if (query) {
    try {
      results = await searchSongs(query);
    } catch (err) {
      searchError = err instanceof Error ? err.message : "Błąd wyszukiwania";
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Lista muzyczna</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Prośby gości o piosenki (wyszukane przez darmowe iTunes Search API) -
        widoczne dla wszystkich na{" "}
        <Link
          href={`/${wedding.slug}/moje-zaproszenie`}
          target="_blank"
          className="underline"
        >
          /moje-zaproszenie/muzyka
        </Link>
        . Możecie tu też sami dorzucić piosenki (np. jeśli DJ ma dostęp do panelu) i
        usunąć niechciane zgłoszenia.
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-medium text-zinc-700">Dodaj piosenkę</h2>
        <div className="mb-4">
          <LiveSearchInput
            placeholder="Szukaj piosenki lub wykonawcy..."
            className="w-full rounded-full border border-zinc-300 px-4 py-2 text-sm"
          />
        </div>

        {added === "1" && (
          <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Dodano do listy!
          </p>
        )}

        {query && (
          <div className="space-y-2">
            {searchError && <p className="text-sm text-red-700">{searchError}</p>}
            {!searchError && results.length === 0 && (
              <p className="text-sm text-zinc-500">Nic nie znaleziono - spróbuj inaczej.</p>
            )}
            {results.map((song) => (
              <div
                key={song.trackId}
                className="flex items-center gap-3 rounded-md border border-zinc-200 p-2"
              >
                {song.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- zewnętrzny URL z Apple
                  <img
                    src={song.artworkUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded bg-zinc-200" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{song.trackName}</p>
                  <p className="truncate text-xs text-zinc-500">{song.artistName}</p>
                </div>
                <form action={adminAddSongAction}>
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="trackName" value={song.trackName} />
                  <input type="hidden" name="artistName" value={song.artistName} />
                  <input type="hidden" name="artworkUrl" value={song.artworkUrl ?? ""} />
                  <input type="hidden" name="previewUrl" value={song.previewUrl ?? ""} />
                  <input type="hidden" name="externalUrl" value={song.externalUrl ?? ""} />
                  <input type="hidden" name="q" value={query} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-zinc-900 px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-900 hover:text-white"
                  >
                    Dodaj
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {songs.length === 0 ? (
        <p className="text-sm text-zinc-500">Nikt jeszcze nie poprosił o piosenkę.</p>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3"
            >
              {song.artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- zewnętrzny URL z Apple, next/image tego nie ogarnie bez konfiguracji domen
                <img
                  src={song.artworkUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-zinc-200" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900">{song.trackName}</p>
                <p className="truncate text-sm text-zinc-500">{song.artistName}</p>
              </div>
              <form action={adminDeleteSongAction}>
                <input type="hidden" name="weddingId" value={wedding.id} />
                <input type="hidden" name="requestId" value={song.id} />
                <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                  Usuń
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
