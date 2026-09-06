// Rejestr trybów rozmieszczania gości przy stołach. Wybór trybu widoczny
// w panelu pary (src/app/admin/page.tsx), używany przez stronę gościa
// (src/components/GuestSeatSection.tsx) do zdecydowania, co pokazać.

import type { SeatingMode } from "./db/types";

export interface SeatingModeDefinition {
  id: SeatingMode;
  label: string;
  description: string;
}

export const SEATING_MODES: Record<SeatingMode, SeatingModeDefinition> = {
  COUPLE_ONLY: {
    id: "COUPLE_ONLY",
    label: "Para decyduje o wszystkim",
    description:
      "Wy przypisujecie każdego gościa do konkretnego miejsca w planerze stołów. Gość widzi tylko wynik.",
  },
  GUEST_SELF_SELECT: {
    id: "GUEST_SELF_SELECT",
    label: "Potwierdzeni goście wybierają sami",
    description:
      "Gość, który potwierdził przybycie, widzi wolne miejsca przy wszystkich stołach i wybiera samodzielnie (może potem zmienić zdanie).",
  },
  GUEST_REQUEST: {
    id: "GUEST_REQUEST",
    label: "Goście mogą prosić o zmianę",
    description:
      "Wy przypisujecie miejsca jak w trybie podstawowym, ale gość może wysłać prośbę o zmianę - Wy ją akceptujecie lub odrzucacie.",
  },
  GROUP_CONSTRAINED: {
    id: "GROUP_CONSTRAINED",
    label: "Swoboda w ramach grupy",
    description:
      "Jak wyżej, ale gość wybiera sam - w obrębie stołów, które przypiszecie jego grupie (np. rodzina, praca, przyjaciele) na stronie Grupy gości.",
  },
};

export const DEFAULT_SEATING_MODE: SeatingMode = "COUPLE_ONLY";

export const SEATING_MODE_LIST: SeatingModeDefinition[] = Object.values(SEATING_MODES);

export function isSeatingMode(value: string | null | undefined): value is SeatingMode {
  return !!value && Object.prototype.hasOwnProperty.call(SEATING_MODES, value);
}

export function getSeatingMode(value: string | null | undefined): SeatingModeDefinition {
  return SEATING_MODES[isSeatingMode(value) ? value : DEFAULT_SEATING_MODE];
}

/** Czy w tym trybie gość może samodzielnie wybierać/zmieniać miejsce
 * (bezpośrednio, bez akceptacji pary) - wspólne dla dwóch z czterech trybów. */
export function allowsGuestSelfSelect(mode: SeatingMode): boolean {
  return mode === "GUEST_SELF_SELECT" || mode === "GROUP_CONSTRAINED";
}
