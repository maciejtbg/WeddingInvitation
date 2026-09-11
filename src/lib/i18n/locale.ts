// Odczyt preferowanego języka gościa z ciasteczka - patrz actions.ts (zapis)
// i getDictionary.ts (zamiana kodu języka na słownik).

import { cookies } from "next/headers";

export const LOCALE_COOKIE = "guest_locale";
export const DEFAULT_LOCALE = "pl";

// Ustawiane przez proxy.ts przy pierwszym wejściu, gdy kraj gościa (patrz
// countryLocale.ts) wskazuje na język, którego nie mamy jeszcze
// przetłumaczonego i zbuforowanego - LOCALE_COOKIE w tym czasie stoi na
// "en" jako bezpieczna baza, a to ciasteczko mówi stronie, żeby pokazała
// PendingLocaleBanner i uruchomiła tłumaczenie w tle (patrz actions.ts,
// applyPendingTranslationAction).
export const PENDING_LOCALE_COOKIE = "guest_locale_pending";

export async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;
}

export async function getPendingLocale(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_LOCALE_COOKIE)?.value || null;
}
