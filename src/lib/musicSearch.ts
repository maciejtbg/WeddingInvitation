// Szukanie utworów przez iTunes Search API - darmowe, bez klucza, zwraca
// okładkę i 30-sekundowy podgląd (previewUrl), nie tylko metadane. Wołane
// z serwera (nie z przeglądarki gościa) - unika CORS i trzyma logikę w
// jednym miejscu, łatwo podmienić na inne źródło później.
//
// https://performance-partners.apple.com/search-api (dokumentacja
// nieoficjalnego, ale powszechnie używanego endpointu).

export interface SongSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
}

interface ITunesApiTrack {
  trackId: number;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  wrapperType?: string;
  kind?: string;
}

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&media=music&entity=song&limit=8`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error("Wyszukiwarka utworów jest chwilowo niedostępna");

  const data = (await res.json()) as { results: ITunesApiTrack[] };
  return data.results
    .filter((r) => r.wrapperType === "track" && r.kind === "song" && r.trackName && r.artistName)
    .map((r) => ({
      trackId: r.trackId,
      trackName: r.trackName as string,
      artistName: r.artistName as string,
      // 100x100 -> 300x300: ten sam plik na serwerach Apple, tylko inny
      // rozmiar w URL-u, wygląda wyraźnie lepiej niż domyślna miniaturka.
      artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace("100x100bb", "300x300bb") : null,
      previewUrl: r.previewUrl ?? null,
      externalUrl: r.trackViewUrl ?? null,
    }));
}
