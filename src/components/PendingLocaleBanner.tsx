// Server Component - czyta ciasteczko "pending" (ustawione przez proxy.ts,
// patrz src/lib/i18n/locale.ts) i, jeśli obecne, renderuje pasek
// tłumaczenia w tle (PendingTranslationBar.tsx). Osobny plik od tego
// komponentu, żeby strony gościa (patrz np. src/app/[slug]/page.tsx) mogły
// dorzucić to jedną linijką, tak jak LanguageSwitcher.

import { getPendingLocale } from "@/lib/i18n/locale";
import { findLanguage } from "@/lib/i18n/languages";
import { PendingTranslationBar } from "./PendingTranslationBar";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface Props {
  returnTo: string;
  dict: Dictionary;
}

export default async function PendingLocaleBanner({ returnTo, dict }: Props) {
  const pending = await getPendingLocale();
  if (!pending) return null;

  const lang = findLanguage(pending);
  return (
    <PendingTranslationBar
      pendingLocale={pending}
      label={lang ? `${lang.flag} ${lang.label}` : pending}
      returnTo={returnTo}
      fetchingText={dict.fetchingLanguageBanner}
      cancelText={dict.stayInEnglish}
    />
  );
}
