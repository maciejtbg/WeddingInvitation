// Odczyt preferowanego języka gościa z ciasteczka - patrz actions.ts (zapis)
// i getDictionary.ts (zamiana kodu języka na słownik).

import { cookies } from "next/headers";

export const LOCALE_COOKIE = "guest_locale";
export const DEFAULT_LOCALE = "pl";

export async function getLocale(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;
}
