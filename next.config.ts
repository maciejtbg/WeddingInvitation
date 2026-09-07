import type { NextConfig } from "next";

// RODO/RODO art. 32 - "bezpieczeństwo przetwarzania". Nagłówki HTTP nie
// zastępują właściwej ochrony danych w kodzie, ale są tanim, standardowym
// pierwszym pierścieniem obrony przed najczęstszymi atakami (XSS przez
// wstrzyknięty <script> z obcej domeny, clickjacking przez osadzenie w
// <iframe>, wyciek adresu strony przez nagłówek Referer).
//
// CSP dopuszcza 'unsafe-inline' dla script-src i style-src - to świadomy
// kompromis, nie przeoczenie: Next.js sam wstrzykuje inline-owe skrypty
// hydratujące (bez ich dopuszczenia strona w ogóle by nie ruszyła bez
// dodatkowej infrastruktury nonce w middleware), a masa komponentów w tej
// aplikacji celowo używa inline style={{...}} do wstrzykiwania zmiennych
// CSS motywu (patrz src/lib/themes.ts, themeStyleVars). To nadal blokuje
// najpowszechniejszy wektor - wczytanie skryptu/stylu z OBCEJ domeny.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Kafelki map (OpenStreetMap) i okładki utworów (iTunes/Apple CDN),
  // patrz src/components/LocationsMap.tsx i src/lib/musicSearch.ts.
  "img-src 'self' data: https://*.tile.openstreetmap.org https://*.mzstatic.com",
  "media-src 'self' https://*.mzstatic.com",
  // Wyszukiwanie adresu w panelu pary (src/components/LocationMapPicker.tsx)
  // odpytuje Nominatim bezpośrednio z przeglądarki.
  "connect-src 'self' https://nominatim.openstreetmap.org",
  // Osadzony film na stronie głównej zaproszenia (opcjonalny link
  // YouTube/Vimeo od pary) - patrz src/lib/videoEmbed.ts.
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // UWAGA: NIE włączaj tu `output: "standalone"`. Próbowaliśmy - przy
  // wdrożeniu, gdzie build robi się na INNEJ maszynie niż ta produkcyjna
  // (patrz deploy/DEPLOY.md, sekcja o buildzie lokalnym + transferze na
  // małe VPS-y bez wystarczającego RAM-u), Turbopack w trybie standalone
  // referencuje pakiety natywne (sharp) przez wygenerowany, specyficzny dla
  // TEGO builda hash (np. "sharp-20c6a5da84e2135f") zamiast zwykłego
  // `require("sharp")" - ten hash nie istnieje jako prawdziwy pakiet na
  // serwerze docelowym, więc runtime wywala ERR_MODULE_NOT_FOUND przy
  // pierwszym użyciu sharp (upload zdjęcia). Zwykły `next start` z pełnym
  // node_modules na serwerze nie ma tego problemu - referencje zostają
  // zwykłym `require`.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
