// Rejestr alergenów do oznaczania dań w panelu menu (patrz src/lib/db/menu.ts
// i app/admin/menu). Lista = 14 alergenów wymaganych do oznaczania na
// żywności w UE (Rozporządzenie 1169/2011, załącznik II) - para zaznacza
// checkboxem, które występują w danym daniu, a gość widzi to samo na swojej
// stronie zaproszenia obok własnych uwag dietetycznych (guests.dietaryNotes).

export interface AllergenDefinition {
  id: string;
  label: string;
  icon: string;
}

export const ALLERGENS: AllergenDefinition[] = [
  { id: "gluten", label: "Gluten", icon: "🌾" },
  { id: "crustaceans", label: "Skorupiaki", icon: "🦐" },
  { id: "eggs", label: "Jaja", icon: "🥚" },
  { id: "fish", label: "Ryby", icon: "🐟" },
  { id: "peanuts", label: "Orzeszki ziemne", icon: "🥜" },
  { id: "soy", label: "Soja", icon: "🫘" },
  { id: "milk", label: "Mleko / laktoza", icon: "🥛" },
  { id: "nuts", label: "Orzechy", icon: "🌰" },
  { id: "celery", label: "Seler", icon: "🥬" },
  { id: "mustard", label: "Gorczyca", icon: "🌭" },
  { id: "sesame", label: "Sezam", icon: "⚪" },
  { id: "sulphites", label: "Siarczyny/dwutlenek siarki", icon: "🍷" },
  { id: "lupin", label: "Łubin", icon: "🌱" },
  { id: "molluscs", label: "Mięczaki", icon: "🐚" },
];

const ALLERGEN_MAP = new Map(ALLERGENS.map((a) => [a.id, a]));

export function isAllergenId(value: string): boolean {
  return ALLERGEN_MAP.has(value);
}

export function getAllergen(id: string): AllergenDefinition | undefined {
  return ALLERGEN_MAP.get(id);
}

/** Filtruje i mapuje dowolną listę stringów na znane definicje - odporne na
 * stare/nieznane wartości w bazie (np. usunięty w przyszłości alergen). */
export function resolveAllergens(ids: string[]): AllergenDefinition[] {
  return ids.map((id) => ALLERGEN_MAP.get(id)).filter((a): a is AllergenDefinition => !!a);
}
