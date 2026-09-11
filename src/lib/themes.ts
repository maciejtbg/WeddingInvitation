// Rejestr gotowych motywów graficznych strony wesela.
//
// Każdy motyw to kolory (CSS custom properties) + para fontów (własne pliki
// w public/fonts/, licencja SIL OFL - patrz public/fonts/OFL.txt, wczytane
// przez @font-face w src/app/globals.css) + oryginalna, odręcznie napisana
// grafika ornamentu SVG (src/components/theme-ornaments).
//
// Trzy motywy mają dodatkowo `defaultCoverPhoto` - gotowe zdjęcie tła hero
// (patrz public/demo-photos/CREDITS.md, tam źródła i licencje), pokazywane
// dopóki para nie wgra własnego zdjęcia powitalnego (patrz [slug]/page.tsx,
// HeroCoverPhotos) - dzięki temu strona wygląda "gotowo" od razu, zamiast
// płaskim tłem do czasu personalizacji.
//
// Pierwsze trzy motywy (cream-gold/blush-black/burgundy-gold) to oryginalny
// zestaw - CELOWO zostają bez zmian jako prosty, "bezpieczny" wybór.
// Pozostałych siedem to bogatsze motywy z własną typografią, dodane na
// prośbę pary o więcej, ładniejszych wariantów do wyboru dla stron, które
// widzą goście (panel pary NIE korzysta z tego rejestru - ma zostać czysto
// funkcjonalny, patrz src/app/admin/*).
//
// Dodanie kolejnego motywu: dopisz wpis do THEMES poniżej + wariant w
// src/components/theme-ornaments.tsx, i gotowe - reszta aplikacji (picker
// w /admin, strona publiczna, strona gościa) czyta z tego rejestru.

import type { CSSProperties } from "react";
import type { ThemeId } from "./db/types";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  colors: {
    /** Tło całej strony - może być gradientem. */
    background: string;
    /** Tło kart / paneli na stronie. */
    surface: string;
    /** Główny kolor tekstu. */
    text: string;
    /** Tekst drugorzędny (daty, podpisy). */
    muted: string;
    /** Kolor akcentu - przyciski, obwódki, ornament. */
    accent: string;
    /** Kolor tekstu na tle accent (np. na przyciskach). */
    accentText: string;
    /** Kolor obramowań kart. */
    border: string;
  };
  fonts: {
    /** Nazwa rodziny fontu na nagłówki/imiona pary (duży, ozdobny tekst). */
    heading: string;
    /** Grubość nagłówka - dopasowana do tego, jaki plik faktycznie jest
     * wczytany przez @font-face (nie każdy motyw ma tę samą wagę). */
    headingWeight: number;
    /** Nazwa rodziny fontu na resztę tekstu (dobrze czytelna przy mniejszym rozmiarze). */
    body: string;
  };
  /** Trzy próbki koloru do miniaturki w wyborze motywu (od tła do akcentu). */
  swatches: [string, string, string];
  /** Gotowe zdjęcie tła hero, dopóki para nie wgra własnego (opcjonalne -
   * patrz public/demo-photos/CREDITS.md). */
  defaultCoverPhoto?: {
    url: string;
    /** Widoczna atrybucja, jeśli licencja zdjęcia tego wymaga (np. CC BY) -
     * pomiń dla zdjęć bez takiego wymogu. */
    credit?: string;
  };
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  "cream-gold": {
    id: "cream-gold",
    label: "Kremowo-biało-złoty",
    description: "Klasyczny, elegancki - delikatna kremowa tkanina i złoty akcent.",
    colors: {
      background: "linear-gradient(180deg, #fffdf8 0%, #f7efdd 100%)",
      surface: "#fffefb",
      text: "#3a3226",
      muted: "#8a7f68",
      accent: "#b8933f",
      accentText: "#fffefb",
      border: "#e8dcbd",
    },
    fonts: { heading: "Georgia, serif", headingWeight: 400, body: "Arial, sans-serif" },
    swatches: ["#f7efdd", "#fffefb", "#b8933f"],
    defaultCoverPhoto: { url: "/demo-photos/cream-gold-rings-bouquet.jpg" },
  },
  "blush-black": {
    id: "blush-black",
    label: "Różowo-czarny",
    description: "Nowoczesny i odważny - głęboka czerń z pudrowym różem.",
    colors: {
      background: "linear-gradient(180deg, #191416 0%, #241b1f 100%)",
      surface: "#231a1d",
      text: "#f6ecee",
      muted: "#c9a8b1",
      accent: "#e8a0b4",
      accentText: "#231017",
      border: "#3c2b30",
    },
    fonts: { heading: "Georgia, serif", headingWeight: 400, body: "Arial, sans-serif" },
    swatches: ["#191416", "#e8a0b4", "#f6ecee"],
    defaultCoverPhoto: { url: "/demo-photos/blush-black-sunset-sparkler.jpg" },
  },
  "burgundy-gold": {
    id: "burgundy-gold",
    label: "Bordowo-złoty",
    description: "Ciepły i romantyczny - głęboki bordowy z połyskiem złota.",
    colors: {
      background: "linear-gradient(180deg, #4a1119 0%, #2c0a10 100%)",
      surface: "#3a0f16",
      text: "#f6e9d8",
      muted: "#d9b9a6",
      accent: "#d4af6a",
      accentText: "#2c0a10",
      border: "#5c2530",
    },
    fonts: { heading: "Georgia, serif", headingWeight: 400, body: "Arial, sans-serif" },
    swatches: ["#4a1119", "#d4af6a", "#f6e9d8"],
    defaultCoverPhoto: {
      url: "/demo-photos/burgundy-gold-rose.jpg",
      credit: "Zdjęcie: Pink Sherbet Photography, CC BY 2.0",
    },
  },
  "botanical-elegance": {
    id: "botanical-elegance",
    label: "Botaniczna elegancja",
    description: "Szałwiowa zieleń i krem - delikatne gałązki, dużo światła.",
    colors: {
      background: "linear-gradient(180deg, #f8f6ef 0%, #e9eddd 100%)",
      surface: "#fdfcf7",
      text: "#333f2c",
      muted: "#7c8a6a",
      accent: "#7d8c5c",
      accentText: "#fdfcf7",
      border: "#dbe2ca",
    },
    fonts: { heading: "Playfair Display", headingWeight: 600, body: "Cormorant Garamond" },
    swatches: ["#e9eddd", "#fdfcf7", "#7d8c5c"],
  },
  "modern-minimal": {
    id: "modern-minimal",
    label: "Nowoczesny minimalizm",
    description: "Czerń, biel i terakota - grube litery, dużo pustej przestrzeni.",
    colors: {
      background: "linear-gradient(180deg, #faf9f6 0%, #f0eee7 100%)",
      surface: "#ffffff",
      text: "#1a1a1a",
      muted: "#8a8a84",
      accent: "#b5654a",
      accentText: "#ffffff",
      border: "#e2e0d7",
    },
    fonts: { heading: "Montserrat", headingWeight: 700, body: "Montserrat" },
    swatches: ["#f0eee7", "#ffffff", "#b5654a"],
  },
  "romantic-script": {
    id: "romantic-script",
    label: "Romantyczna kaligrafia",
    description: "Pudrowy róż i kremowa biel - płynne pismo odręczne na imionach.",
    colors: {
      background: "linear-gradient(180deg, #fdf6f5 0%, #f8e7eb 100%)",
      surface: "#fffbfa",
      text: "#5c2a35",
      muted: "#b98a92",
      accent: "#c76b83",
      accentText: "#fffbfa",
      border: "#f0d5da",
    },
    fonts: { heading: "Great Vibes", headingWeight: 400, body: "Cormorant Garamond" },
    swatches: ["#f8e7eb", "#fffbfa", "#c76b83"],
  },
  "rustic-boho": {
    id: "rustic-boho",
    label: "Rustykalne boho",
    description: "Terakota, musztarda i płótno - ciepłe, swobodne, naturalne.",
    colors: {
      background: "linear-gradient(180deg, #faf3e6 0%, #f0dfc2 100%)",
      surface: "#fffaf0",
      text: "#4a3324",
      muted: "#9c7f5c",
      accent: "#c1662f",
      accentText: "#fffaf0",
      border: "#e8d2a8",
    },
    fonts: { heading: "Josefin Sans", headingWeight: 600, body: "Cormorant Garamond" },
    swatches: ["#f0dfc2", "#fffaf0", "#c1662f"],
  },
  "art-deco-glam": {
    id: "art-deco-glam",
    label: "Glamour art deco",
    description: "Czerń i złoto - geometryczne wzory, wieczorowy blask.",
    colors: {
      background: "linear-gradient(180deg, #0f0f0f 0%, #1c1c1c 100%)",
      surface: "#181818",
      text: "#f2e9d8",
      muted: "#b8a377",
      accent: "#cba135",
      accentText: "#0f0f0f",
      border: "#3a3226",
    },
    fonts: { heading: "Cinzel", headingWeight: 600, body: "Montserrat" },
    swatches: ["#0f0f0f", "#cba135", "#f2e9d8"],
  },
  "coastal-nautical": {
    id: "coastal-nautical",
    label: "Morski, nadmorski",
    description: "Granat i piasek - lekki, wakacyjny klimat wybrzeża.",
    colors: {
      background: "linear-gradient(180deg, #f7f9fb 0%, #e6edf2 100%)",
      surface: "#ffffff",
      text: "#1c3144",
      muted: "#6b8299",
      accent: "#1c5a73",
      accentText: "#ffffff",
      border: "#d2e0e8",
    },
    fonts: { heading: "Playfair Display", headingWeight: 600, body: "Josefin Sans" },
    swatches: ["#e6edf2", "#ffffff", "#1c5a73"],
  },
  "winter-elegance": {
    id: "winter-elegance",
    label: "Zimowa elegancja",
    description: "Granat i srebro - eleganckie, chłodne, świąteczne.",
    colors: {
      background: "linear-gradient(180deg, #f4f6fa 0%, #e2e7f0 100%)",
      surface: "#ffffff",
      text: "#232c42",
      muted: "#7c869e",
      accent: "#4a5b8c",
      accentText: "#ffffff",
      border: "#d6dbea",
    },
    fonts: { heading: "Cormorant Garamond", headingWeight: 600, body: "Montserrat" },
    swatches: ["#e2e7f0", "#ffffff", "#4a5b8c"],
  },
};

export const DEFAULT_THEME: ThemeId = "cream-gold";

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && Object.prototype.hasOwnProperty.call(THEMES, value);
}

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return THEMES[isThemeId(id) ? id : DEFAULT_THEME];
}

/** Wyciąga ostatni kolor z tła motywu (często gradient, np.
 * "linear-gradient(180deg, #fff 0%, #eee 100%)" -> "#eee") - do płynnego,
 * bezszwowego przejścia między zdjęciem w hero a resztą strony pod spodem
 * (patrz [slug]/page.tsx - nakładka gradientowa "przezroczysty -> ten
 * kolor" na dole zdjęcia). Dla zwykłego, jednolitego koloru (bez przecinka)
 * zwraca go bez zmian. */
export function themeBackgroundEndColor(theme: ThemeDefinition): string {
  const matches = theme.colors.background.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
  return matches && matches.length > 0 ? matches[matches.length - 1] : theme.colors.background;
}

/** CSS custom properties do wpięcia w atrybut style kontenera strony -
 * reszta JSX używa ich przez klasy Tailwind w stylu bg-[var(--wd-bg)]. */
export function themeStyleVars(theme: ThemeDefinition): CSSProperties {
  return {
    "--wd-bg": theme.colors.background,
    "--wd-surface": theme.colors.surface,
    "--wd-text": theme.colors.text,
    "--wd-muted": theme.colors.muted,
    "--wd-accent": theme.colors.accent,
    "--wd-accent-text": theme.colors.accentText,
    "--wd-border": theme.colors.border,
    "--wd-font-heading": theme.fonts.heading,
    "--wd-font-heading-weight": theme.fonts.headingWeight,
    "--wd-font-body": theme.fonts.body,
  } as CSSProperties;
}
