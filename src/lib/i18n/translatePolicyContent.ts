// Tłumaczenie treści polityki prywatności na żądanie - ten sam mechanizm
// co translateDictionary.ts (darmowe, nieoficjalne API Google Translate,
// jedno zapytanie wsadowe na cały dokument), ale działa na sekcjach
// {heading, paragraphs[]} zamiast na płaskim słowniku klucz-wartość.
// Wynik buforowany w bazie (src/lib/db/policyTranslations.ts) - tłumaczenie
// dzieje się raz na język, nie przy każdym wejściu gościa.

import { translate } from "google-translate-api-x";
import { PRIVACY_POLICY_PL, type PolicySection } from "@/lib/privacyPolicyContent";
import { getCachedPolicy, saveCachedPolicy } from "@/lib/db/policyTranslations";

async function translatePolicy(targetLocale: string): Promise<PolicySection[]> {
  const flat: string[] = [];
  for (const section of PRIVACY_POLICY_PL) {
    flat.push(section.heading, ...section.paragraphs);
  }

  const results = await translate(flat, { from: "pl", to: targetLocale });
  const resultList = Array.isArray(results) ? results : [results];

  let cursor = 0;
  return PRIVACY_POLICY_PL.map((section) => {
    const heading = resultList[cursor]?.text ?? section.heading;
    cursor += 1;
    const paragraphs = section.paragraphs.map((original) => {
      const translated = resultList[cursor]?.text ?? original;
      cursor += 1;
      return translated;
    });
    return { heading, paragraphs };
  });
}

export async function getPolicyContent(locale: string): Promise<PolicySection[]> {
  if (locale === "pl") return PRIVACY_POLICY_PL;

  const cached = getCachedPolicy(locale);
  if (cached) return cached;

  try {
    const translated = await translatePolicy(locale);
    saveCachedPolicy(locale, translated);
    return translated;
  } catch {
    // Nieoficjalne, darmowe API - lepiej pokazać politykę po polsku niż
    // wywalić błąd 500 na stronie z ważną informacją prawną.
    return PRIVACY_POLICY_PL;
  }
}
