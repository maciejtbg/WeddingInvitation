"use client";

// Główny komponent planera stołów: kanwa react-konva z przeciąganiem stołów,
// panel boczny do przypisywania gości do konkretnych miejsc, obsługa wielu
// sal (sala = wartość roomName na stole/elemencie planu, nie osobna tabela -
// patrz src/lib/db/tables.ts) oraz dodatkowych elementów planu sali:
// znaczników (DJ, bufet...), ścian i brył reprezentujących obrys
// pomieszczenia - patrz src/lib/db/layoutItems.ts.
//
// Renderowany wyłącznie po stronie klienta (patrz TablePlannerLoader.tsx) -
// Konva potrzebuje `window` już przy imporcie modułu.

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Ellipse, Group, Layer, Rect, RegularPolygon, Stage, Text } from "react-konva";
import type {
  Guest,
  SeatWithGuestName,
  TableShape,
  WeddingTable,
  LayoutItem,
  LayoutItemShape,
} from "@/lib/db/types";
import {
  assignSeatAction,
  createTableAction,
  deleteTableAction,
  unassignSeatAction,
  updateTablePositionAction,
  updateTableShapeAction,
  updateTableSizeAction,
  renameTableAction,
  updateSeatsCountAction,
  createLayoutItemAction,
  updateLayoutItemPositionAction,
  renameLayoutItemAction,
  setLayoutItemShapeAction,
  resizeLayoutItemAction,
  deleteLayoutItemAction,
} from "@/app/admin/tables/actions";
import { deleteTableLocal, loadTablesLocal, saveTableLocal } from "@/lib/tablePlannerLocalStore";
import { SEAT_RADIUS, MAX_TABLE_DIMENSION } from "@/lib/tableGeometry";

interface Props {
  weddingId: string;
  initialTables: WeddingTable[];
  initialSeats: SeatWithGuestName[];
  guests: Guest[];
  /** tableId -> nazwy grup, którym ten stół jest dozwolony (patrz
   * src/lib/db/groups.ts, adminListGroupNamesByTable) - puste, jeśli stół
   * nie jest ograniczony do żadnej konkretnej grupy. */
  groupNamesByTable: Record<string, string[]>;
  /** Znaczniki (DJ, bufet...), ściany i bryły planu sali - patrz
   * src/lib/db/layoutItems.ts. */
  initialLayoutItems: LayoutItem[];
}

const SAVE_DEBOUNCE_MS = 600;
const DEFAULT_ROOM = "Sala główna";
// "Plan uroczystości, plan poprawin, plan przyjęcia..." - max tyle
// zakładek/sal na raz, żeby lista nie urosła w nieskończoność.
const MAX_ROOMS = 4;
// Promień odniesienia dla trójkąta/rombu (Konva RegularPolygon przyjmuje
// jeden promień, nie osobno szerokość/wysokość) - właściwy rozmiar
// dostajemy przez scaleX/scaleY liczone względem tej stałej.
const BASE_POLYGON_RADIUS = 100;

const SHAPE_LABELS: Record<LayoutItemShape, string> = {
  RECT: "Prostokąt",
  OVAL: "Owal/koło",
  TRIANGLE: "Trójkąt",
  RHOMBUS: "Romb",
};

export default function TablePlanner({
  weddingId,
  initialTables,
  initialSeats,
  guests,
  groupNamesByTable,
  initialLayoutItems,
}: Props) {
  const [tables, setTables] = useState<WeddingTable[]>(initialTables);
  const [seats, setSeats] = useState<SeatWithGuestName[]>(initialSeats);
  const [layoutItems, setLayoutItems] = useState<LayoutItem[]>(initialLayoutItems);
  const [rooms, setRooms] = useState<string[]>(() => {
    const fromTables = Array.from(
      new Set([
        ...initialTables.map((t) => t.roomName),
        ...initialLayoutItems.map((i) => i.roomName),
      ])
    );
    return fromTables.length > 0 ? fromTables : [DEFAULT_ROOM];
  });
  const [activeRoom, setActiveRoom] = useState<string>(rooms[0]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedLayoutItemId, setSelectedLayoutItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      setSize({ width: el.clientWidth, height: el.clientHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Hydratacja z IndexedDB: jeśli poprzednia sesja skończyła się offline
  // z niezapisaną na serwerze zmianą pozycji, ta lokalna wersja jest
  // nowsza niż to, co przyszło z serwera przy załadowaniu strony.
  useEffect(() => {
    loadTablesLocal(weddingId).then((localTables) => {
      if (localTables.length === 0) return;
      setTables((prev) => {
        const byId = new Map(prev.map((t) => [t.id, t] as const));
        for (const local of localTables) {
          if (byId.has(local.id)) byId.set(local.id, local);
        }
        return Array.from(byId.values());
      });
    });
  }, [weddingId]);

  function reportError(err: unknown) {
    setErrorMessage(err instanceof Error ? err.message : "Coś poszło nie tak");
    setTimeout(() => setErrorMessage(null), 4000);
  }

  const tablesInRoom = useMemo(
    () => tables.filter((t) => t.roomName === activeRoom),
    [tables, activeRoom]
  );
  const layoutItemsInRoom = useMemo(
    () => layoutItems.filter((i) => i.roomName === activeRoom),
    [layoutItems, activeRoom]
  );
  const roomShapesInRoom = useMemo(
    () => layoutItemsInRoom.filter((i) => i.kind === "ROOM_SHAPE"),
    [layoutItemsInRoom]
  );
  const wallsInRoom = useMemo(
    () => layoutItemsInRoom.filter((i) => i.kind === "WALL"),
    [layoutItemsInRoom]
  );
  const markersInRoom = useMemo(
    () => layoutItemsInRoom.filter((i) => i.kind === "MARKER"),
    [layoutItemsInRoom]
  );

  const seatsByTable = useMemo(() => {
    const map = new Map<string, SeatWithGuestName[]>();
    for (const seat of seats) {
      const list = map.get(seat.tableId) ?? [];
      list.push(seat);
      map.set(seat.tableId, list);
    }
    return map;
  }, [seats]);

  const assignedGuestIds = useMemo(() => new Set(seats.map((s) => s.guestId)), [seats]);
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;
  const selectedTableSeats = selectedTable ? seatsByTable.get(selectedTable.id) ?? [] : [];
  const selectedLayoutItem = layoutItems.find((i) => i.id === selectedLayoutItemId) ?? null;

  /** Tylko jedno zaznaczenie naraz - stół albo znacznik/ściana/bryła sali. */
  function selectTable(id: string) {
    setSelectedLayoutItemId(null);
    setSelectedTableId(id);
  }
  function selectLayoutItem(id: string) {
    setSelectedTableId(null);
    setSelectedLayoutItemId(id);
  }
  function clearSelection() {
    setSelectedTableId(null);
    setSelectedLayoutItemId(null);
  }

  function scheduleServerSave(table: WeddingTable) {
    saveTableLocal(table).catch(() => {
      // Brak IndexedDB (np. tryb prywatny) nie powinien blokować pracy -
      // zapis na serwer poniżej i tak jest głównym źródłem prawdy, gdy jest
      // połączenie z internetem.
    });
    clearTimeout(saveTimers.current[table.id]);
    saveTimers.current[table.id] = setTimeout(() => {
      updateTablePositionAction(weddingId, table.id, table.x, table.y, table.rotation).catch(
        (err) => reportError(err)
      );
    }, SAVE_DEBOUNCE_MS);
  }

  function handleDragEnd(table: WeddingTable, x: number, y: number) {
    const updated = { ...table, x, y };
    setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
    scheduleServerSave(updated);
  }

  async function handleAddTable(shape: TableShape) {
    try {
      const label = `Stół ${tablesInRoom.length + 1}`;
      const table = await createTableAction(weddingId, {
        roomName: activeRoom,
        label,
        shape,
        x: 120 + (tablesInRoom.length % 5) * 150,
        y: 120 + Math.floor(tablesInRoom.length / 5) * 150,
        seatsCount: shape === "ROUND" ? 8 : 6,
      });
      setTables((prev) => [...prev, table]);
      saveTableLocal(table).catch(() => {});
      selectTable(table.id);
    } catch (err) {
      reportError(err);
    }
  }

  function handleAddRoom() {
    if (rooms.length >= MAX_ROOMS) {
      reportError(new Error(`Można mieć maksymalnie ${MAX_ROOMS} sale/plany naraz.`));
      return;
    }
    const name = window.prompt("Nazwa nowej sali/planu (np. Ceremonia, Poprawiny):");
    const trimmed = name?.trim();
    if (!trimmed) return;
    setRooms((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setActiveRoom(trimmed);
    clearSelection();
  }

  async function handleDeleteTable(table: WeddingTable) {
    if (!window.confirm(`Usunąć stół "${table.label}"?`)) return;
    try {
      await deleteTableAction(weddingId, table.id);
      await deleteTableLocal(table.id).catch(() => {});
      setTables((prev) => prev.filter((t) => t.id !== table.id));
      setSeats((prev) => prev.filter((s) => s.tableId !== table.id));
      clearSelection();
    } catch (err) {
      reportError(err);
    }
  }

  function handleRotate(table: WeddingTable) {
    const updated = { ...table, rotation: (table.rotation + 45) % 360 };
    setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
    scheduleServerSave(updated);
  }

  async function handleToggleShape(table: WeddingTable) {
    const nextShape: TableShape = table.shape === "ROUND" ? "RECT" : "ROUND";
    try {
      const updated = await updateTableShapeAction(weddingId, table.id, nextShape);
      setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
      saveTableLocal(updated).catch(() => {});
    } catch (err) {
      reportError(err);
    }
  }

  function handleRename(table: WeddingTable) {
    const name = window.prompt("Nowa nazwa stołu:", table.label);
    const trimmed = name?.trim();
    if (!trimmed || trimmed === table.label) return;
    renameTableAction(weddingId, table.id, trimmed)
      .then((updated) => {
        setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
        saveTableLocal(updated).catch(() => {});
      })
      .catch((err) => reportError(err));
  }

  /** delta = +1/-1 - zmiana liczby miejsc o jeden na kliknięcie, prościej
   * niż pole liczbowe do wpisania ręcznie, a przy okazji nie da się wpisać
   * przypadkiem czegoś spoza sensownego zakresu. Zmniejszenie poniżej
   * numeru zajętego miejsca zwalnia gościa z tego miejsca (patrz komentarz
   * przy adminUpdateSeatsCount w src/lib/db/tables.ts) - ostrzegamy o tym
   * przed wysłaniem, żeby nie zaskoczyć pary. Stół automatycznie rośnie na
   * tyle, żeby nowe krzesła się nie nakładały (patrz src/lib/tableGeometry.ts) -
   * niezależnie od tego, para może go jeszcze ręcznie powiększyć suwakami. */
  async function handleSeatsCountChange(table: WeddingTable, delta: number) {
    const nextCount = table.seatsCount + delta;
    if (nextCount < 1 || nextCount > 24) return;
    const removedSeats = (seatsByTable.get(table.id) ?? []).filter(
      (s) => s.seatIndex >= nextCount
    );
    if (
      removedSeats.length > 0 &&
      !window.confirm(
        `Zmniejszenie liczby miejsc zwolni ${removedSeats.length === 1 ? "gościa" : "gości"}: ${removedSeats
          .map((s) => `${s.guestFirstName} ${s.guestLastName ?? ""}`.trim())
          .join(", ")}. Kontynuować?`
      )
    ) {
      return;
    }
    try {
      const { table: updated, seats: updatedSeats } = await updateSeatsCountAction(
        weddingId,
        table.id,
        nextCount
      );
      setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
      setSeats(updatedSeats);
      saveTableLocal(updated).catch(() => {});
    } catch (err) {
      reportError(err);
    }
  }

  /** Ręczne dociąganie rozmiaru stołu suwakami - niezależne od
   * auto-powiększania przy dokładaniu miejsc powyżej. Serwer i tak nie
   * pozwoli zejść poniżej minimum potrzebnego na obecną liczbę miejsc
   * (patrz adminUpdateTableSize w src/lib/db/tables.ts). */
  async function handleResizeTable(
    table: WeddingTable,
    dimension: "radius" | "width" | "height",
    delta: number
  ) {
    const next = { ...table, [dimension]: table[dimension] + delta };
    if (next[dimension] < 20 || next[dimension] > MAX_TABLE_DIMENSION) return;
    try {
      const updated = await updateTableSizeAction(weddingId, table.id, {
        [dimension]: next[dimension],
      });
      setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
      saveTableLocal(updated).catch(() => {});
    } catch (err) {
      reportError(err);
    }
  }

  async function handleAssign(table: WeddingTable, seatIndex: number, guestId: string) {
    try {
      const updatedSeats = await assignSeatAction(weddingId, table.id, guestId, seatIndex);
      setSeats(updatedSeats);
    } catch (err) {
      reportError(err);
    }
  }

  async function handleUnassign(guestId: string) {
    try {
      const updatedSeats = await unassignSeatAction(weddingId, guestId);
      setSeats(updatedSeats);
    } catch (err) {
      reportError(err);
    }
  }

  // --- Znaczniki (DJ, bufet, fotobudka...), ściany i bryły planu sali -
  // patrz src/lib/db/layoutItems.ts. Świadomie WOLNY TEKST zamiast
  // gotowego zestawu ikon dla znaczników - para najlepiej wie, jak nazwać
  // to, co u niej stoi, a lista "typowych" miejsc na weselu jest w
  // praktyce otwarta (fontanna czekoladowa? stół z tortem? namiot dla
  // dzieci?). Kształt (prostokąt/owal/trójkąt/romb) i rozmiar są za to
  // regulowalne, więc znacznik może np. udawać podjazd dla wózków, schody
  // czy strefę dla palących - bez potrzeby osobnej ikony na każdą okazję.

  async function handleAddMarker() {
    const label = window.prompt(
      "Co oznaczyć? (np. DJ, Orkiestra, Bufet, Winda, WC, Wejście, Fotobudka)"
    );
    const trimmed = label?.trim();
    if (!trimmed) return;
    try {
      const item = await createLayoutItemAction(weddingId, {
        roomName: activeRoom,
        kind: "MARKER",
        label: trimmed,
        x: 120 + (markersInRoom.length % 5) * 80,
        y: 320,
      });
      setLayoutItems((prev) => [...prev, item]);
      selectLayoutItem(item.id);
    } catch (err) {
      reportError(err);
    }
  }

  async function handleAddWall() {
    try {
      const item = await createLayoutItemAction(weddingId, {
        roomName: activeRoom,
        kind: "WALL",
        x: 100,
        y: 60 + (wallsInRoom.length % 6) * 30,
      });
      setLayoutItems((prev) => [...prev, item]);
      selectLayoutItem(item.id);
    } catch (err) {
      reportError(err);
    }
  }

  /** Duży kształt do rozciągnięcia dookoła już postawionych stołów -
   * zaznacza obrys/kontur sali. Renderowany zawsze pod wszystkim innym
   * (patrz kolejność warstw w JSX niżej), więc nie przesłania stołów. */
  async function handleAddRoomShape() {
    try {
      const item = await createLayoutItemAction(weddingId, {
        roomName: activeRoom,
        kind: "ROOM_SHAPE",
        x: size.width / 2 || 300,
        y: size.height / 2 || 250,
      });
      setLayoutItems((prev) => [...prev, item]);
      selectLayoutItem(item.id);
    } catch (err) {
      reportError(err);
    }
  }

  function scheduleLayoutItemSave(item: LayoutItem) {
    clearTimeout(saveTimers.current[item.id]);
    saveTimers.current[item.id] = setTimeout(() => {
      updateLayoutItemPositionAction(weddingId, item.id, item.x, item.y, item.rotation).catch(
        (err) => reportError(err)
      );
    }, SAVE_DEBOUNCE_MS);
  }

  function handleLayoutItemDragEnd(item: LayoutItem, x: number, y: number) {
    const updated = { ...item, x, y };
    setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    scheduleLayoutItemSave(updated);
  }

  function handleRotateItem(item: LayoutItem) {
    const updated = { ...item, rotation: (item.rotation + 15) % 360 };
    setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    scheduleLayoutItemSave(updated);
  }

  /** Zmiana nazwy - dla MARKER (etykieta typu "DJ") i ROOM_SHAPE (przydaje
   * się przy kilku bryłach na raz, np. "Namiot" vs "Sala główna"). WALL
   * nie ma nazwy - to tylko odcinek ściany, nic do podpisania. */
  function handleRenameItem(item: LayoutItem) {
    const name = window.prompt("Nowa nazwa:", item.label ?? "");
    const trimmed = name?.trim();
    if (!trimmed || trimmed === item.label) return;
    renameLayoutItemAction(weddingId, item.id, trimmed)
      .then((updated) => setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i))))
      .catch((err) => reportError(err));
  }

  function handleSetShape(item: LayoutItem, shape: LayoutItemShape) {
    setLayoutItemShapeAction(weddingId, item.id, shape)
      .then((updated) => setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i))))
      .catch((err) => reportError(err));
  }

  /** dimension = "width" | "height", delta w pikselach - rozmiar zmienia
   * się krokowo, bez przeciągania uchwytów na kanwie (spójne z resztą
   * planera - patrz handleSeatsCountChange). */
  async function handleResizeItem(item: LayoutItem, dimension: "width" | "height", delta: number) {
    const nextWidth = dimension === "width" ? item.width + delta : item.width;
    const nextHeight = dimension === "height" ? item.height + delta : item.height;
    if (nextWidth < 20 || nextWidth > 1000 || nextHeight < 10 || nextHeight > 1000) return;
    try {
      const updated = await resizeLayoutItemAction(weddingId, item.id, nextWidth, nextHeight);
      setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      reportError(err);
    }
  }

  async function handleDeleteLayoutItem(item: LayoutItem) {
    const opis =
      item.kind === "MARKER"
        ? `znacznik "${item.label}"`
        : item.kind === "WALL"
          ? "ścianę"
          : "bryłę planu sali";
    if (!window.confirm(`Usunąć ${opis}?`)) return;
    try {
      await deleteLayoutItemAction(weddingId, item.id);
      setLayoutItems((prev) => prev.filter((i) => i.id !== item.id));
      clearSelection();
    } catch (err) {
      reportError(err);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-4 py-2">
          {rooms.map((room) => (
            <button
              key={room}
              type="button"
              onClick={() => {
                setActiveRoom(room);
                clearSelection();
              }}
              className={`rounded-full px-3 py-1 text-sm ${
                room === activeRoom
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {room}
            </button>
          ))}
          {rooms.length < MAX_ROOMS && (
            <button
              type="button"
              onClick={handleAddRoom}
              className="rounded-full border border-dashed border-zinc-400 px-3 py-1 text-sm text-zinc-600 hover:border-zinc-600"
            >
              + Nowa sala/plan
            </button>
          )}
          <div className="mx-2 h-5 w-px bg-zinc-200" />
          <button
            type="button"
            onClick={() => handleAddTable("ROUND")}
            className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700"
          >
            + Stół okrągły
          </button>
          <button
            type="button"
            onClick={() => handleAddTable("RECT")}
            className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-700"
          >
            + Stół prostokątny
          </button>
          <div className="mx-2 h-5 w-px bg-zinc-200" />
          <button
            type="button"
            onClick={handleAddMarker}
            className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-sm text-amber-900 hover:border-amber-500"
          >
            + Oznaczenie (DJ, bufet...)
          </button>
          <button
            type="button"
            onClick={handleAddWall}
            className="rounded-full border border-zinc-400 bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:border-zinc-500"
          >
            + Ściana
          </button>
          <button
            type="button"
            onClick={handleAddRoomShape}
            className="rounded-full border border-sky-400 bg-sky-50 px-3 py-1 text-sm text-sky-900 hover:border-sky-500"
          >
            + Kształt sali
          </button>
          {errorMessage && (
            <span className="ml-auto rounded-md bg-red-50 px-3 py-1 text-xs text-red-700">
              {errorMessage}
            </span>
          )}
        </div>

        <div ref={containerRef} className="relative flex-1 overflow-hidden bg-zinc-50">
          <Stage
            width={size.width}
            height={size.height}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) clearSelection();
            }}
          >
            <Layer>
              {/* Bryły planu sali NA SAMYM SPODZIE - to tło/obrys
                  pomieszczenia, wszystko inne ma być nad nimi. */}
              {roomShapesInRoom.map((item) => {
                const isSelected = item.id === selectedLayoutItemId;
                return (
                  <Group
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    rotation={item.rotation}
                    draggable
                    onDragEnd={(e) => handleLayoutItemDragEnd(item, e.target.x(), e.target.y())}
                    onClick={() => selectLayoutItem(item.id)}
                    onTap={() => selectLayoutItem(item.id)}
                  >
                    <ShapeBody
                      shape={item.shape}
                      width={item.width}
                      height={item.height}
                      fill={isSelected ? "#bae6fd" : "#e0f2fe"}
                      stroke={isSelected ? "#0284c7" : "#7dd3fc"}
                      strokeWidth={2}
                    />
                  </Group>
                );
              })}
              {/* Ściany nad bryłą sali, ale pod stołami/znacznikami. */}
              {wallsInRoom.map((item) => {
                const isSelected = item.id === selectedLayoutItemId;
                return (
                  <Group
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    rotation={item.rotation}
                    draggable
                    onDragEnd={(e) => handleLayoutItemDragEnd(item, e.target.x(), e.target.y())}
                    onClick={() => selectLayoutItem(item.id)}
                    onTap={() => selectLayoutItem(item.id)}
                  >
                    <Rect
                      x={-item.width / 2}
                      y={-item.height / 2}
                      width={item.width}
                      height={item.height}
                      fill={isSelected ? "#78716c" : "#57534e"}
                      stroke={isSelected ? "#fde68a" : undefined}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  </Group>
                );
              })}
              {tablesInRoom.map((table) => {
                const tableSeats = seatsByTable.get(table.id) ?? [];
                const isSelected = table.id === selectedTableId;
                const labelWidth = table.shape === "ROUND" ? table.radius * 2 : table.width;
                const labelX = table.shape === "ROUND" ? -table.radius : -table.width / 2;
                return (
                  <Group
                    key={table.id}
                    x={table.x}
                    y={table.y}
                    rotation={table.rotation}
                    draggable
                    onDragEnd={(e) => handleDragEnd(table, e.target.x(), e.target.y())}
                    onClick={() => selectTable(table.id)}
                    onTap={() => selectTable(table.id)}
                  >
                    {table.shape === "ROUND" ? (
                      <Circle
                        radius={table.radius}
                        fill={isSelected ? "#fde68a" : "#e4e4e7"}
                        stroke="#a1a1aa"
                        strokeWidth={2}
                      />
                    ) : (
                      <Rect
                        x={-table.width / 2}
                        y={-table.height / 2}
                        width={table.width}
                        height={table.height}
                        cornerRadius={8}
                        fill={isSelected ? "#fde68a" : "#e4e4e7"}
                        stroke="#a1a1aa"
                        strokeWidth={2}
                      />
                    )}
                    <Text
                      text={table.label}
                      align="center"
                      width={labelWidth}
                      x={labelX}
                      y={groupNamesByTable[table.id]?.length ? -14 : -7}
                      fontSize={13}
                      fontStyle="bold"
                      fill="#3f3f46"
                    />
                    {!!groupNamesByTable[table.id]?.length && (
                      <Text
                        text={groupNamesByTable[table.id].join(", ")}
                        align="center"
                        width={labelWidth}
                        x={labelX}
                        y={4}
                        fontSize={10}
                        fill="#7c2d12"
                      />
                    )}
                    {seatPositions(table).map((pos, seatIndex) => {
                      const occupied = tableSeats.find((s) => s.seatIndex === seatIndex);
                      return (
                        <Circle
                          key={seatIndex}
                          x={pos.x}
                          y={pos.y}
                          radius={SEAT_RADIUS}
                          fill={occupied ? "#16a34a" : "#ffffff"}
                          stroke="#71717a"
                          strokeWidth={1}
                        />
                      );
                    })}
                  </Group>
                );
              })}
              {/* Znaczniki na wierzchu - mają być zawsze widoczne, nawet
                  gdyby ktoś przesunął je blisko stołu/ściany/bryły sali. */}
              {markersInRoom.map((item) => {
                const isSelected = item.id === selectedLayoutItemId;
                return (
                  <Group
                    key={item.id}
                    x={item.x}
                    y={item.y}
                    rotation={item.rotation}
                    draggable
                    onDragEnd={(e) => handleLayoutItemDragEnd(item, e.target.x(), e.target.y())}
                    onClick={() => selectLayoutItem(item.id)}
                    onTap={() => selectLayoutItem(item.id)}
                  >
                    <ShapeBody
                      shape={item.shape}
                      width={item.width}
                      height={item.height}
                      fill={isSelected ? "#f59e0b" : "#fbbf24"}
                      stroke="#92400e"
                      strokeWidth={1.5}
                    />
                    <Text
                      text={item.label ?? ""}
                      align="center"
                      width={120}
                      x={-60}
                      y={item.height / 2 + 6}
                      fontSize={11}
                      fontStyle="bold"
                      fill="#78350f"
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>

      {selectedTable && (
        <div className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleRename(selectedTable)}
              className="text-sm font-semibold text-zinc-900 underline decoration-dotted underline-offset-2 hover:text-zinc-600"
              title="Kliknij, żeby zmienić nazwę"
            >
              {selectedTable.label}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Zamknij
            </button>
          </div>
          {!!groupNamesByTable[selectedTable.id]?.length && (
            <p className="mb-3 text-xs text-amber-800">
              Zarezerwowany dla: {groupNamesByTable[selectedTable.id].join(", ")}
            </p>
          )}

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => handleRotate(selectedTable)}
              className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-xs hover:border-zinc-400"
            >
              Obróć
            </button>
            <button
              type="button"
              onClick={() => handleToggleShape(selectedTable)}
              className="flex-1 rounded-md border border-zinc-300 px-2 py-1.5 text-xs hover:border-zinc-400"
            >
              Zmień kształt
            </button>
            <button
              type="button"
              onClick={() => handleDeleteTable(selectedTable)}
              className="flex-1 rounded-md border border-red-300 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Usuń
            </button>
          </div>

          <div className="mb-4 space-y-2 rounded-md border border-zinc-200 p-2">
            {selectedTable.shape === "ROUND" ? (
              <SizeStepper
                name="Rozmiar stołu"
                label={`Rozmiar (${Math.round(selectedTable.radius)})`}
                onDecrease={() => handleResizeTable(selectedTable, "radius", -10)}
                onIncrease={() => handleResizeTable(selectedTable, "radius", 10)}
              />
            ) : (
              <>
                <SizeStepper
                  name="Szerokość stołu"
                  label={`Szerokość (${Math.round(selectedTable.width)})`}
                  onDecrease={() => handleResizeTable(selectedTable, "width", -20)}
                  onIncrease={() => handleResizeTable(selectedTable, "width", 20)}
                />
                <SizeStepper
                  name="Głębokość stołu"
                  label={`Głębokość (${Math.round(selectedTable.height)})`}
                  onDecrease={() => handleResizeTable(selectedTable, "height", -10)}
                  onIncrease={() => handleResizeTable(selectedTable, "height", 10)}
                />
              </>
            )}
            <p className="text-[11px] leading-tight text-zinc-400">
              Stół rośnie automatycznie, gdy dokładacie miejsca poniżej - te suwaki są do
              ręcznej korekty (np. szerszy blat, stół zsunięty z innym).
            </p>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">
              Miejsca ({selectedTable.seatsCount})
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSeatsCountChange(selectedTable, -1)}
                disabled={selectedTable.seatsCount <= 1}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                title="Usuń jedno miejsce (z brzegu)"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => handleSeatsCountChange(selectedTable, 1)}
                disabled={selectedTable.seatsCount >= 24}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                title="Dodaj jedno miejsce"
              >
                +
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: selectedTable.seatsCount }).map((_, seatIndex) => {
              const seat = selectedTableSeats.find((s) => s.seatIndex === seatIndex);
              return (
                <div
                  key={seatIndex}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 p-2 text-xs"
                >
                  <span className="w-6 shrink-0 text-zinc-400">#{seatIndex + 1}</span>
                  {seat ? (
                    <>
                      <span className="flex-1 truncate text-zinc-900">
                        {seat.guestFirstName} {seat.guestLastName ?? ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnassign(seat.guestId)}
                        className="text-red-500 hover:underline"
                      >
                        Usuń
                      </button>
                    </>
                  ) : (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleAssign(selectedTable, seatIndex, e.target.value);
                      }}
                      className="flex-1 rounded border border-zinc-300 px-1 py-1 text-xs"
                    >
                      <option value="">— przypisz gościa —</option>
                      {guests
                        .filter((g) => !assignedGuestIds.has(g.id))
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.firstName} {g.lastName ?? ""}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedLayoutItem && (
        <div className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            {selectedLayoutItem.kind === "WALL" ? (
              <h2 className="text-sm font-semibold text-zinc-900">Ściana</h2>
            ) : (
              <button
                type="button"
                onClick={() => handleRenameItem(selectedLayoutItem)}
                className="text-sm font-semibold text-zinc-900 underline decoration-dotted underline-offset-2 hover:text-zinc-600"
                title="Kliknij, żeby zmienić nazwę"
              >
                {selectedLayoutItem.label ||
                  (selectedLayoutItem.kind === "ROOM_SHAPE" ? "Bez nazwy (kliknij)" : "")}
              </button>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Zamknij
            </button>
          </div>

          {selectedLayoutItem.kind !== "WALL" && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-zinc-500">Kształt</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SHAPE_LABELS) as LayoutItemShape[]).map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => handleSetShape(selectedLayoutItem, shape)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      selectedLayoutItem.shape === shape
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-300 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {SHAPE_LABELS[shape]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 space-y-3">
            <SizeStepper
              name={selectedLayoutItem.kind === "WALL" ? "Długość ściany" : "Szerokość elementu"}
              label={`${selectedLayoutItem.kind === "WALL" ? "Długość" : "Szerokość"} (${Math.round(selectedLayoutItem.width)})`}
              onDecrease={() => handleResizeItem(selectedLayoutItem, "width", -20)}
              onIncrease={() => handleResizeItem(selectedLayoutItem, "width", 20)}
            />
            <SizeStepper
              name={selectedLayoutItem.kind === "WALL" ? "Grubość ściany" : "Wysokość elementu"}
              label={`${selectedLayoutItem.kind === "WALL" ? "Grubość" : "Wysokość"} (${Math.round(selectedLayoutItem.height)})`}
              onDecrease={() => handleResizeItem(selectedLayoutItem, "height", -10)}
              onIncrease={() => handleResizeItem(selectedLayoutItem, "height", 10)}
            />
          </div>

          <button
            type="button"
            onClick={() => handleRotateItem(selectedLayoutItem)}
            className="mb-2 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs hover:border-zinc-400"
          >
            Obróć o 15°
          </button>

          <button
            type="button"
            onClick={() => handleDeleteLayoutItem(selectedLayoutItem)}
            className="w-full rounded-md border border-red-300 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            Usuń
          </button>
        </div>
      )}
    </div>
  );
}

function SizeStepper({
  name,
  label,
  onDecrease,
  onIncrease,
}: {
  /** Stała nazwa wymiaru (np. "Długość") niezależna od aktualnej liczby w
   * `label` - używana w title przycisków, żeby dało się je znaleźć w
   * testach end-to-end niezależnie od tego, jaka wartość akurat wyświetla
   * się w nawiasie. */
  name: string;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDecrease}
          title={`Zmniejsz: ${name}`}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400"
        >
          −
        </button>
        <button
          type="button"
          onClick={onIncrease}
          title={`Zwiększ: ${name}`}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400"
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Jedna bryła Konva odpowiadająca LayoutItemShape - używana zarówno przez
 * znaczniki (MARKER) jak i bryły planu sali (ROOM_SHAPE). Trójkąt/romb to
 * ten sam RegularPolygon (Konva rysuje 4-kątny wielobok foremny jako romb -
 * wierzchołki górny/prawy/dolny/lewy - bez dodatkowego obracania), tylko
 * przeskalowany scaleX/scaleY do zadanej szerokości/wysokości, bo Konva nie
 * ma bezpośrednio "prostokątnego trójkąta/rombu" jako gotowego kształtu. */
function ShapeBody({
  shape,
  width,
  height,
  fill,
  stroke,
  strokeWidth,
}: {
  shape: LayoutItemShape;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  if (shape === "RECT") {
    return (
      <Rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  if (shape === "OVAL") {
    return (
      <Ellipse
        radiusX={width / 2}
        radiusY={height / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  const sides = shape === "TRIANGLE" ? 3 : 4;
  return (
    <RegularPolygon
      sides={sides}
      radius={BASE_POLYGON_RADIUS}
      scaleX={width / (2 * BASE_POLYGON_RADIUS)}
      scaleY={height / (2 * BASE_POLYGON_RADIUS)}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth / Math.max(width, height, 1) * BASE_POLYGON_RADIUS}
    />
  );
}

/** Rozkłada krzesła dookoła stołu tak, żeby się nie nakładały (patrz
 * src/lib/tableGeometry.ts - to samo źródło minimalnych rozmiarów, którego
 * pilnuje repozytorium przy auto-powiększaniu). Dla stołu prostokątnego
 * krzesła idą po CAŁYM obwodzie (wszystkie 4 boki), proporcjonalnie do
 * długości boku - dawniej tylko dwa dłuższe boki miały miejsca, więc przy
 * kwadratowym/krótkim stole nikt nie mógł "siadać od czoła"; ten sposób
 * automatycznie zajmuje też krótsze boki, kiedy jest ich sporo. Pełny
 * ręczny wybór "to krzesło na tym konkretnym boku" to już osobna, większa
 * funkcja (przeciąganie pojedynczych miejsc) - nie ma jej tutaj. */
function seatPositions(table: WeddingTable): { x: number; y: number }[] {
  const n = table.seatsCount;
  const positions: { x: number; y: number }[] = [];
  const margin = SEAT_RADIUS + 10;

  if (table.shape === "ROUND") {
    const radius = table.radius + margin;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return positions;
  }

  const W = table.width;
  const H = table.height;
  const perimeter = 2 * (W + H);
  for (let i = 0; i < n; i++) {
    let dist = (i / n) * perimeter;
    if (dist < W) {
      positions.push({ x: -W / 2 + dist, y: -(H / 2 + margin) });
      continue;
    }
    dist -= W;
    if (dist < H) {
      positions.push({ x: W / 2 + margin, y: -H / 2 + dist });
      continue;
    }
    dist -= H;
    if (dist < W) {
      positions.push({ x: W / 2 - dist, y: H / 2 + margin });
      continue;
    }
    dist -= W;
    positions.push({ x: -(W / 2 + margin), y: H / 2 - dist });
  }
  return positions;
}
