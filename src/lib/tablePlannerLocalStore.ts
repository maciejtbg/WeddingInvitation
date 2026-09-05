// Surowe IndexedDB (bez biblioteki) do lokalnego autosave planera stołów.
//
// Po co: przeciąganie stołu po kanwie wywołuje zapis na serwer z ~600ms
// debounce (patrz components/TablePlanner.tsx) - jeśli w tym oknie zniknie
// połączenie z internetem, zmiana pozycji nigdy nie dotrze do serwera i po
// odświeżeniu strony wróciłaby na starą pozycję. Zapis tutaj dzieje się
// SYNCHRONICZNIE z każdą zmianą (przed debounce do serwera), więc kolejne
// wejście na stronę (nawet offline) odtwarza ostatni znany stan z tej
// przeglądarki, zamiast z ostatniego udanego zapisu na serwerze.
//
// To świadomie NIE jest pełna kolejka synchronizacji (bez retry, bez
// wykrywania konfliktów) - wystarczający zakres na tym etapie projektu.

import type { WeddingTable } from "./db/types";

const DB_NAME = "wedding-table-planner";
const DB_VERSION = 1;
const STORE = "tables";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTableLocal(table: WeddingTable): Promise<void> {
  const database = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(table);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadTablesLocal(weddingId: string): Promise<WeddingTable[]> {
  const database = await openDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => {
      const all = request.result as WeddingTable[];
      resolve(all.filter((table) => table.weddingId === weddingId));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTableLocal(tableId: string): Promise<void> {
  const database = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(tableId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
