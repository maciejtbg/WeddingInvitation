import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listSongRequests } from "@/lib/db/songRequests";
import { adminDeleteSongAction } from "./actions";

export default async function MusicAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const songs = listSongRequests(wedding.id);

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
          href={`/w/${wedding.slug}/moje-zaproszenie`}
          target="_blank"
          className="underline"
        >
          /moje-zaproszenie/muzyka
        </Link>
        . Tu możecie usunąć niechciane zgłoszenia.
      </p>

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
