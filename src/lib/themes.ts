// Rejestr gotowych motywów graficznych strony wesela.
//
// Każdy motyw to wyłącznie kolory (CSS custom properties) + oryginalna,
// odręcznie napisana grafika ornamentu SVG (src/components/theme-ornaments)
// - żadnych pobranych zdjęć. W środowisku, w którym to powstało, dostęp do
// serwisów ze zdjęciami (Unsplash/Pexels/Pixabay/Wikimedia) jest zablokowany
// przez politykę sieciową piaskownicy, więc zamiast zdjęć są wektorowe
// ornamenty - poza tym nie niosą żadnego ryzyka licencyjnego i ważą
// ułamek tego, co zdjęcie w rozdzielczości nadającej się na tło strony.
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
  /** Trzy próbki koloru do miniaturki w wyborze motywu (od tła do akcentu). */
  swatches: [string, string, string];
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
    swatches: ["#f7efdd", "#fffefb", "#b8933f"],
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
    swatches: ["#191416", "#e8a0b4", "#f6ecee"],
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
    swatches: ["#4a1119", "#d4af6a", "#f6e9d8"],
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
  } as CSSProperties;
}
