// Zamienia zwykły link YouTube/Vimeo na URL do osadzenia w <iframe> - para
// wkleja normalny link ze swojej przeglądarki (np. "watch?v=..." albo
// "youtu.be/..."), nie musi znać formatu embed. Nierozpoznany link (inny
// serwis, literówka) zwraca null - strona publiczna pokazuje wtedy zwykły
// link zamiast osadzonego odtwarzacza, patrz src/app/[slug]/page.tsx.

export function toEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}
