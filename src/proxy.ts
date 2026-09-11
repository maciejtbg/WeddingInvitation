// Automatyczne wykrywanie języka gościa po kraju z adresu IP - wyłącznie
// przy PIERWSZYM wejściu (brak ciasteczka guest_locale, patrz
// src/lib/i18n/locale.ts). Jeśli trzeba dopiero przetłumaczyć słownik na
// wykryty język (patrz src/lib/i18n/countryLocale.ts), gość dostaje od razu
// angielski jako bazę + ciasteczko "pending", które strona odczytuje, żeby
// pokazać mały pasek u góry i uruchomić tłumaczenie w tle (patrz
// PendingLocaleBanner, applyPendingTranslationAction) - zamiast trzymać
// gościa na pustym ekranie, aż zewnętrzne API tłumaczeń odpowie.
//
// fast-geoip zamiast zewnętrznego API geolokalizacji - lookup korzysta z
// lokalnej bazy (leniwie doczytywanej z dysku, bardzo mała pamięć w
// porównaniu do geoip-lite - ważne na małym VPS-ie, patrz deploy/DEPLOY.md)
// i nie wysyła adresu IP gościa do trzeciej strony, spójnie z resztą
// podejścia RODO w tej aplikacji.
//
// Nagłówek Accept-Language jako drugi, korygujący sygnał (patrz
// browserLanguage() niżej) - darmowa baza geoIP potrafi się mylić
// (zaobserwowane: polski numer komórkowy rozpoznany jako Iran), a
// przeglądarka/telefon deklaruje swój język świadomie i dużo pewniej.
//
// Proxy w Next.js 16 domyślnie działa w środowisku Node.js (nie edge), więc
// zwykłe `await` na module z dostępem do dysku (fast-geoip) działa tu bez
// dodatkowej konfiguracji - patrz node_modules/next/dist/docs (sekcja
// "Runtime" w opisie proxy.js).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import geoip from "fast-geoip";
import { LOCALE_COOKIE, PENDING_LOCALE_COOKIE } from "@/lib/i18n/locale";
import { resolveCountryLocale } from "@/lib/i18n/countryLocale";
import { HAND_CURATED_LOCALES } from "@/lib/i18n/dictionary";

const ONE_YEAR = 60 * 60 * 24 * 365;
// Krótki czas życia - jeśli tłumaczenie w tle z jakiegoś powodu nie
// dobiegnie końca (gość zamknął kartę, padło zewnętrzne API), pasek sam
// przestanie się pojawiać zamiast wisieć nad gościem w nieskończoność.
const PENDING_TTL = 60 * 10;

// nginx (patrz deploy/nginx.conf) zawsze ustawia X-Real-IP na
// $remote_addr - prawdziwy adres łączącego się klienta, niemożliwy do
// podszycia. X-Forwarded-For bierzemy tylko jako zapasowe źródło (np. inny
// reverse proxy przed appką) - OSTATNI wpis, bo to ten, który dopisuje sam
// nginx (patrz $proxy_add_x_forwarded_for), wcześniejsze mogą być
// spreparowane przez klienta.
function guestIp(request: NextRequest): string | null {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const parts = forwarded.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || null;
}

// Darmowe bazy geoIP (fast-geoip nie jest wyjątkiem) potrafią się mylić,
// zwłaszcza dla zakresów operatorów komórkowych (złapane empirycznie -
// prawdziwy polski numer, baza uparcie zwracała Iran). Accept-Language to
// znacznie pewniejszy sygnał, kiedy jest dostępny - przeglądarka/telefon
// zgłasza go świadomie, więc traktujemy go jako "wygraną" nad zgadywaniem
// po kraju, ale TYLKO dla języków, które mamy gotowe od ręki (pl/en/uk/de) -
// dla reszty (tłumaczenie na żądanie) nagłówek bywa zbyt niestandardowy,
// żeby mu ślepo ufać.
function browserLanguage(request: NextRequest): string | null {
  const header = request.headers.get("accept-language");
  if (!header) return null;
  const primary = header.split(",")[0]?.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
  return primary || null;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.cookies.has(LOCALE_COOKIE)) return NextResponse.next();

  const ip = guestIp(request);
  const geo = ip ? await geoip.lookup(ip) : null;
  let { locale, pendingLocale } = resolveCountryLocale(geo?.country ?? null);

  const browserLang = browserLanguage(request);
  if (browserLang && browserLang !== locale && (HAND_CURATED_LOCALES as readonly string[]).includes(browserLang)) {
    locale = browserLang;
    pendingLocale = null;
  }

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  if (pendingLocale) {
    response.cookies.set(PENDING_LOCALE_COOKIE, pendingLocale, {
      path: "/",
      maxAge: PENDING_TTL,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!admin|api|_next/static|_next/image|favicon.ico|uploads|fonts|demo-photos|robots.txt|sitemap.xml).*)",
  ],
};
