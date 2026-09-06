// Tłumaczenie całego słownika naraz (jedno zapytanie wsadowe zamiast
// osobnego na każdy klucz) przez darmowe, nieoficjalne API Google Translate
// (`google-translate-api-x`, bez klucza). Używane dla języków spoza
// ręcznie utrzymywanych (pl/en/uk/de) - patrz getDictionary.ts, wynik jest
// buforowany w bazie (src/lib/db/translations.ts), więc to tłumaczenie
// dzieje się raz na język, nie przy każdym wejściu gościa.

import { translate } from "google-translate-api-x";
import { pl } from "./locales/pl";
import type { Dictionary } from "./dictionary";

export async function translateDictionary(targetLocale: string): Promise<Dictionary> {
  const keys = Object.keys(pl) as (keyof Dictionary)[];
  const values = keys.map((key) => pl[key]);

  const results = await translate(values, { from: "pl", to: targetLocale });
  const resultList = Array.isArray(results) ? results : [results];

  const translated = {} as Dictionary;
  keys.forEach((key, index) => {
    // Nieoficjalne API - awaria pojedynczego elementu (rzadkie) nie
    // powinna zostawić pustego klucza w słowniku, tylko wrócić do polskiego.
    translated[key] = resultList[index]?.text ?? pl[key];
  });
  return translated;
}
