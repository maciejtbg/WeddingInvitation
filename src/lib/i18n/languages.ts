// Rejestr języków do przełącznika na stronach gościa. "Szybki wybór" to
// języki z ręcznie utrzymywanym słownikiem (src/lib/i18n/locales/) -
// reszta jest tłumaczona na żądanie i buforowana (patrz getDictionary.ts).
// Kody języków - ISO 639-1, zgodne z tym, czego oczekuje google-translate-api-x.

export interface LanguageOption {
  code: string;
  flag: string;
  label: string;
}

export const QUICK_LANGUAGES: LanguageOption[] = [
  { code: "pl", flag: "🇵🇱", label: "Polski" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "uk", flag: "🇺🇦", label: "Українська" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

// Szerszy wybór (w tym kilka języków afrykańskich) - tłumaczone na żądanie
// przy pierwszym wejściu gościa z danym językiem, potem z cache.
export const MORE_LANGUAGES: LanguageOption[] = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "cs", flag: "🇨🇿", label: "Čeština" },
  { code: "sk", flag: "🇸🇰", label: "Slovenčina" },
  { code: "lt", flag: "🇱🇹", label: "Lietuvių" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "he", flag: "🇮🇱", label: "עברית" },
  { code: "hi", flag: "🇮🇳", label: "हिन्दी" },
  { code: "zh-CN", flag: "🇨🇳", label: "中文" },
  { code: "ja", flag: "🇯🇵", label: "日本語" },
  { code: "ko", flag: "🇰🇷", label: "한국어" },
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
  // Afryka - różne rodziny językowe i regiony kontynentu
  { code: "sw", flag: "🇰🇪", label: "Kiswahili" },
  { code: "am", flag: "🇪🇹", label: "አማርኛ" },
  { code: "ha", flag: "🇳🇬", label: "Hausa" },
  { code: "yo", flag: "🇳🇬", label: "Yorùbá" },
  { code: "ig", flag: "🇳🇬", label: "Igbo" },
  { code: "zu", flag: "🇿🇦", label: "isiZulu" },
  { code: "xh", flag: "🇿🇦", label: "isiXhosa" },
  { code: "af", flag: "🇿🇦", label: "Afrikaans" },
  { code: "so", flag: "🇸🇴", label: "Soomaali" },
  { code: "mg", flag: "🇲🇬", label: "Malagasy" },
];

export const ALL_LANGUAGES: LanguageOption[] = [...QUICK_LANGUAGES, ...MORE_LANGUAGES];

export function findLanguage(code: string): LanguageOption | undefined {
  return ALL_LANGUAGES.find((l) => l.code === code);
}
