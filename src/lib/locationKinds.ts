// Rejestr rodzajów miejsc pokazywanych na mapie - patrz src/lib/db/locations.ts.

import type { LocationKind } from "./db/types";

export interface LocationKindDefinition {
  id: LocationKind;
  label: string;
  /** Kolor pinezki na mapie i obwódki karty. */
  color: string;
}

export const LOCATION_KINDS: Record<LocationKind, LocationKindDefinition> = {
  CEREMONY: { id: "CEREMONY", label: "Ceremonia ślubna", color: "#b8933f" },
  RECEPTION: { id: "RECEPTION", label: "Przyjęcie weselne", color: "#8a4b6b" },
  AFTERPARTY: { id: "AFTERPARTY", label: "Poprawiny", color: "#4b7a8a" },
  OTHER: { id: "OTHER", label: "Inne", color: "#6b6b6b" },
};

export const LOCATION_KIND_LIST: LocationKindDefinition[] = Object.values(LOCATION_KINDS);

export function isLocationKind(value: string | null | undefined): value is LocationKind {
  return !!value && Object.prototype.hasOwnProperty.call(LOCATION_KINDS, value);
}

export function getLocationKind(value: string | null | undefined): LocationKindDefinition {
  return LOCATION_KINDS[isLocationKind(value) ? value : "OTHER"];
}
