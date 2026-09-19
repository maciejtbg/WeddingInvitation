// Wykrywanie niespójności między grupami gości a ich faktycznym usadzeniem -
// czysta funkcja (żadnych zapytań do bazy), używana zarówno w planerze
// stołów (na żywo, z danych już wczytanych do stanu komponentu, patrz
// src/components/TablePlanner.tsx) jak i na stronie Grupy gości (po stronie
// serwera, patrz src/app/admin/groups/page.tsx) - jedno miejsce definiujące
// "co się liczy za problem", żeby oba widoki pokazywały to samo.
//
// Świadomie NIE blokuje żadnej akcji - to tylko ostrzeżenia do wyświetlenia
// (para może mieć dobry powód, np. gość tymczasowo usadzony gdzie indziej
// przed ostatecznym ograniczeniem grupy), patrz rozmowa z parą: "Pozwól
// kontynuować ale wyświetlaj ostrzeżenia".

export interface WarningGuest {
  id: string;
  firstName: string;
  lastName: string | null;
  groupId: string | null;
}

export interface WarningGroup {
  id: string;
  name: string;
}

export interface WarningTable {
  id: string;
  label: string;
  seatsCount: number;
  disabledSeatIndexes: number[];
}

export interface WarningSeat {
  tableId: string;
  guestId: string;
}

export interface SeatingWarning {
  /** "capacity" - w dozwolonych dla grupy stołach brakuje miejsc na
   * wszystkich jej członków. "mismatch" - konkretny gość siedzi przy
   * stole spoza aktualnie dozwolonych dla jego grupy (np. bo ograniczenie
   * grupy zmieniło się PO tym, jak go usadzono - patrz rozmowa z parą). */
  type: "capacity" | "mismatch";
  message: string;
}

function guestName(g: WarningGuest): string {
  return `${g.firstName} ${g.lastName ?? ""}`.trim();
}

function freeCapacity(table: WarningTable): number {
  return Math.max(0, table.seatsCount - table.disabledSeatIndexes.length);
}

export function computeSeatingWarnings(params: {
  guests: WarningGuest[];
  groups: WarningGroup[];
  allowancesByGroup: Record<string, string[]>;
  tables: WarningTable[];
  seats: WarningSeat[];
}): SeatingWarning[] {
  const { guests, groups, allowancesByGroup, tables, seats } = params;
  const warnings: SeatingWarning[] = [];

  const tablesById = new Map(tables.map((t) => [t.id, t] as const));
  const tableIdByGuestId = new Map(seats.map((s) => [s.guestId, s.tableId] as const));
  const membersByGroup = new Map<string, WarningGuest[]>();
  for (const guest of guests) {
    if (!guest.groupId) continue;
    const list = membersByGroup.get(guest.groupId) ?? [];
    list.push(guest);
    membersByGroup.set(guest.groupId, list);
  }

  for (const group of groups) {
    const allowedTableIds = allowancesByGroup[group.id];
    // Brak jakiegokolwiek ograniczenia = grupa ma dostęp do wszystkich
    // stołów (patrz src/lib/db/groups.ts) - wtedy nie ma czego pilnować,
    // pomijamy grupę całkowicie.
    if (!allowedTableIds || allowedTableIds.length === 0) continue;

    const members = membersByGroup.get(group.id) ?? [];

    // --- Pojemność: ile miejsc razem dają dozwolone stoły vs ile osób w grupie ---
    const totalCapacity = allowedTableIds.reduce((sum, tableId) => {
      const table = tablesById.get(tableId);
      return sum + (table ? freeCapacity(table) : 0);
    }, 0);
    if (members.length > totalCapacity) {
      warnings.push({
        type: "capacity",
        message: `Grupa "${group.name}": ${members.length} ${members.length === 1 ? "osoba" : "osób"}, ale dozwolone dla niej stoły mają razem tylko ${totalCapacity} ${totalCapacity === 1 ? "miejsce" : "miejsc"}.`,
      });
    }

    // --- Niezgodność: członek grupy siedzi przy stole spoza dozwolonych ---
    for (const member of members) {
      const seatedTableId = tableIdByGuestId.get(member.id);
      if (!seatedTableId) continue;
      if (allowedTableIds.includes(seatedTableId)) continue;
      const seatedTable = tablesById.get(seatedTableId);
      warnings.push({
        type: "mismatch",
        message: `${guestName(member)} (grupa "${group.name}") siedzi przy stole "${seatedTable?.label ?? "usuniętym"}", który nie jest dla tej grupy dozwolony.`,
      });
    }
  }

  return warnings;
}
