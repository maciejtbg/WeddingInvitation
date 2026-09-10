import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { hasCurrentConsent } from "@/lib/db/consents";
import { listSongRequests } from "@/lib/db/songRequests";
import { searchSongs } from "@/lib/musicSearch";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import { LiveSearchInput } from "@/components/LiveSearchInput";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { addSongRequestAction } from "../actions";

export default async function MusicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; added?: string }>;
}) {
  const { slug } = await params;
  const { q, added } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGuestSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/${wedding.slug}`);
  }
  if (!hasCurrentConsent("GUEST", session.guestId)) {
    redirect(`/${wedding.slug}/zgoda`);
  }

  const theme = getTheme(wedding.theme);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const requests = listSongRequests(wedding.id);

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
    <div
      className="flex-1 px-6 py-12"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="mx-auto w-full max-w-xl">
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <h1 className="mb-1 text-center font-serif text-3xl font-semibold text-[var(--wd-text)]">
          {dict.musicTitle}
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--wd-muted)]">
          <Link href={`/${wedding.slug}/moje-zaproszenie`} className="underline">
            {dict.backToInvite}
          </Link>
        </p>

        <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <div className="mb-4">
            <LiveSearchInput
              placeholder={dict.musicSearchPlaceholder}
              className="w-full rounded-full border border-[var(--wd-border)] bg-[var(--wd-bg)] px-4 py-2 text-sm text-[var(--wd-text)]"
            />
          </div>

          {added === "1" && (
            <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {dict.musicAdded}
            </p>
          )}

          {query && (
            <div className="space-y-2">
              {searchError && <p className="text-sm text-red-700">{searchError}</p>}
              {!searchError && results.length === 0 && (
                <p className="text-sm text-[var(--wd-muted)]">{dict.musicNoResults}</p>
              )}
              {results.map((song) => (
                <div
                  key={song.trackId}
                  className="flex items-center gap-3 rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] p-2"
                >
                  {song.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- zewnętrzny URL z Apple
                    <img
                      src={song.artworkUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded bg-black/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--wd-text)]">
                      {song.trackName}
                    </p>
                    <p className="truncate text-xs text-[var(--wd-muted)]">{song.artistName}</p>
                  </div>
                  <form action={addSongRequestAction}>
                    <input type="hidden" name="trackName" value={song.trackName} />
                    <input type="hidden" name="artistName" value={song.artistName} />
                    <input type="hidden" name="artworkUrl" value={song.artworkUrl ?? ""} />
                    <input type="hidden" name="previewUrl" value={song.previewUrl ?? ""} />
                    <input type="hidden" name="externalUrl" value={song.externalUrl ?? ""} />
                    <input type="hidden" name="q" value={query} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-[var(--wd-accent)] px-3 py-1 text-xs font-medium text-[var(--wd-accent)] hover:bg-[var(--wd-accent)] hover:text-[var(--wd-accent-text)]"
                    >
                      {dict.musicAdd}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--wd-text)]">{dict.musicCurrentList}</h2>
          {requests.length === 0 ? (
            <p className="text-sm text-[var(--wd-muted)]">{dict.musicEmpty}</p>
          ) : (
            <div className="space-y-2">
              {requests.map((song) => (
                <div key={song.id} className="flex items-center gap-3">
                  {song.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- zewnętrzny URL z Apple
                    <img
                      src={song.artworkUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded bg-black/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--wd-text)]">
                      {song.trackName}
                    </p>
                    <p className="truncate text-xs text-[var(--wd-muted)]">{song.artistName}</p>
                  </div>
                  {song.previewUrl && (
                    <audio controls preload="none" src={song.previewUrl} className="h-8 w-36 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
