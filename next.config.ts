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
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
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
