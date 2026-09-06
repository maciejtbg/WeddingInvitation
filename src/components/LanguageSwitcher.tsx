// Przełącznik języka na stronach dla gości - flagi szybkiego wyboru
// (pl/en/uk/de, ręcznie tłumaczone) + rozwijana lista szerszego wyboru
// (tłumaczona na żądanie i buforowana, patrz getDictionary.ts). Zwykły
// Server Component z formularzami - bez JS po stronie klienta, spójnie
// z resztą aplikacji.

import { QUICK_LANGUAGES, MORE_LANGUAGES } from "@/lib/i18n/languages";
import { setLocaleAction } from "@/lib/i18n/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface Props {
  currentLocale: string;
  returnTo: string;
  dict: Dictionary;
}

export default function LanguageSwitcher({ currentLocale, returnTo, dict }: Props) {
  const isMoreLanguage = MORE_LANGUAGES.some((l) => l.code === currentLocale);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
      {QUICK_LANGUAGES.map((lang) => (
        <form key={lang.code} action={setLocaleAction}>
          <input type="hidden" name="locale" value={lang.code} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            type="submit"
            title={lang.label}
            aria-label={lang.label}
            className={`rounded-full px-1.5 py-1 text-lg leading-none ${
              currentLocale === lang.code
                ? "ring-2 ring-[var(--wd-accent)]"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            {lang.flag}
          </button>
        </form>
      ))}
      <form action={setLocaleAction} className="inline-flex items-center gap-1">
        <input type="hidden" name="returnTo" value={returnTo} />
        <select
          name="locale"
          defaultValue={isMoreLanguage ? currentLocale : ""}
          className="rounded-full border border-[var(--wd-border)] bg-[var(--wd-bg)] px-2 py-1 text-xs text-[var(--wd-text)]"
        >
          <option value="" disabled>
            {dict.moreLanguages}
          </option>
          {MORE_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full border border-[var(--wd-border)] px-2 py-1 text-xs text-[var(--wd-text)] hover:border-[var(--wd-accent)]"
        >
          OK
        </button>
      </form>
    </div>
  );
}
