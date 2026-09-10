// Formatowanie daty ślubu i odliczanie dni - używane zarówno na publicznej
// stronie wesela (src/app/[slug]/page.tsx), jak i na spersonalizowanej
// stronie gościa (src/app/[slug]/moje-zaproszenie/page.tsx), stąd jeden
// wspólny plik zamiast dwóch kopii tej samej logiki.

export function formatWeddingDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Liczba pełnych dni do ślubu, licząc od dzisiejszej północy - null jeśli
 * data już minęła (wtedy nie pokazujemy odliczania) albo jej brak. */
export function daysUntilWedding(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wedding = new Date(iso + "T00:00:00");
  wedding.setHours(0, 0, 0, 0);
  const days = Math.round((wedding.getTime() - today.getTime()) / 86400000);
  return days >= 0 ? days : null;
}
