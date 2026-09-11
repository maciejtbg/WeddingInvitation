// Mapowanie kraju gościa (wykrytego z adresu IP, patrz proxy.ts) na język
// strony. Świadomie uproszczone - część krajów ma po kilka języków
// urzędowych, wybieramy jeden najbardziej reprezentatywny; gość zawsze może
// zmienić język ręcznie przełącznikiem (LanguageSwitcher).

import { DEFAULT_LOCALE } from "./locale";
import { ALL_LANGUAGES } from "./languages";
import { HAND_CURATED_LOCALES } from "./dictionary";

// Kraje, w których angielski jest językiem urzędowym albo powszechnym
// wspólnym mianownikiem - gość z nich dostaje od razu angielski, zamiast
// zgadywania "lokalnego" języka (np. Nigeria, Indie i RPA mają po kilka
// języków urzędowych, Filipiny i Singapur są dwu/wielojęzyczne).
const ENGLISH_SPEAKING_COUNTRIES = new Set([
  "US", "GB", "IE", "AU", "NZ", "CA", "PH", "SG", "ZA", "NG", "GH", "KE",
  "JM", "TT", "BZ", "GY", "MT", "BB", "BS", "FJ", "PG", "ZW", "UG", "ZM",
  "MW", "SL", "LR", "BW", "NA", "IN",
]);

// Kraj -> kod języka. Kod MUSI istnieć w ALL_LANGUAGES (languages.ts) -
// pilnuje tego assertAllLanguagesValid() niżej, uruchamiane raz przy imporcie
// modułu, żeby literówka nie wysłała gościa na nigdy-nieistniejący język.
const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  PL: "pl",
  DE: "de", AT: "de", CH: "de",
  UA: "uk",
  FR: "fr", BE: "fr",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es",
  IT: "it",
  PT: "pt", BR: "pt",
  RU: "ru", BY: "ru", KZ: "ru",
  CZ: "cs",
  SK: "sk",
  LT: "lt",
  TR: "tr",
  SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", MA: "ar", DZ: "ar", TN: "ar", QA: "ar", KW: "ar",
  IL: "he",
  CN: "zh-CN", TW: "zh-CN", HK: "zh-CN",
  JP: "ja",
  KR: "ko",
  VN: "vi",
  TZ: "sw",
  ET: "am",
  SO: "so",
  MG: "mg",
};

function assertAllLanguagesValid(): void {
  const known = new Set(ALL_LANGUAGES.map((l) => l.code));
  for (const [country, code] of Object.entries(COUNTRY_TO_LANGUAGE)) {
    if (!known.has(code)) {
      throw new Error(`countryLocale.ts: kraj ${country} wskazuje na nieznany język "${code}"`);
    }
  }
}
assertAllLanguagesValid();

export interface CountryLocaleResult {
  /** Język do ustawienia OD RAZU (bez czekania) - "en" jako tymczasowa baza,
   * jeśli poniżej jest ustawione pendingLocale. */
  locale: string;
  /** Docelowy język, który trzeba dopiero przetłumaczyć i zbuforować (patrz
   * getDictionary.ts) - null, jeśli `locale` już jest gotowy do pokazania. */
  pendingLocale: string | null;
}

export function resolveCountryLocale(countryCode: string | null): CountryLocaleResult {
  if (!countryCode) return { locale: DEFAULT_LOCALE, pendingLocale: null };
  if (countryCode === "PL") return { locale: "pl", pendingLocale: null };
  if (ENGLISH_SPEAKING_COUNTRIES.has(countryCode)) return { locale: "en", pendingLocale: null };

  const target = COUNTRY_TO_LANGUAGE[countryCode];
  if (!target) return { locale: "en", pendingLocale: null };

  const isCurated = (HAND_CURATED_LOCALES as readonly string[]).includes(target);
  return isCurated ? { locale: target, pendingLocale: null } : { locale: "en", pendingLocale: target };
}
