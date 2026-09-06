// Cache przetłumaczonych słowników - patrz src/lib/i18n/getDictionary.ts.
// Jeden wiersz na język, cały słownik jako JSON - tłumaczenie kosztuje
// jedno zapytanie do darmowego API na CAŁY słownik naraz (patrz
// translateDictionary w getDictionary.ts), nie osobne zapytanie na klucz.

import { db } from "./client";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function getCachedDictionary(locale: string): Dictionary | null {
  const row = db
    .prepare("SELECT dictionary_json FROM translation_cache WHERE locale = ?")
    .get(locale) as { dictionary_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.dictionary_json) as Dictionary;
  } catch {
    return null;
  }
}

export function saveCachedDictionary(locale: string, dictionary: Dictionary): void {
  db.prepare(
    `INSERT INTO translation_cache (locale, dictionary_json)
     VALUES (?, ?)
     ON CONFLICT (locale) DO UPDATE SET dictionary_json = excluded.dictionary_json`
  ).run(locale, JSON.stringify(dictionary));
}
