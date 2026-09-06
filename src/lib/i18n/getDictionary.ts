// Dobiera słownik dla danego kodu języka - patrz komentarz w dictionary.ts
// (dotyczy wyłącznie stron dla gości). pl/en/uk/de są ręcznie utrzymywane
// (locales/*.ts) - każdy inny kod jest tłumaczony na żądanie przez
// translateDictionary.ts i buforowany w bazie, więc drugi i kolejni goście
// z tym samym językiem dostają już gotowy wynik z cache.

import { pl } from "./locales/pl";
import { en } from "./locales/en";
import { uk } from "./locales/uk";
import { de } from "./locales/de";
import type { Dictionary } from "./dictionary";
import { getCachedDictionary, saveCachedDictionary } from "@/lib/db/translations";
import { translateDictionary } from "./translateDictionary";

const HAND_CURATED: Record<string, Dictionary> = { pl, en, uk, de };

export async function getDictionary(locale: string): Promise<Dictionary> {
  const curated = HAND_CURATED[locale];
  if (curated) return curated;

  const cached = getCachedDictionary(locale);
  if (cached) return cached;

  try {
    const translated = await translateDictionary(locale);
    saveCachedDictionary(locale, translated);
    return translated;
  } catch {
    // Nieoficjalne, darmowe API (limit zapytań, chwilowa niedostępność) -
    // lepiej pokazać stronę po polsku niż wywalić błąd 500 gościowi.
    return pl;
  }
}
