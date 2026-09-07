"use client";

// Główny komponent planera stołów: kanwa react-konva z przeciąganiem stołów,
// panel boczny do przypisywania gości do konkretnych miejsc, obsługa wielu
// sal (sala = wartość roomName na stole, nie osobna tabela - patrz
// src/lib/db/tables.ts).
//
// Renderowany wyłącznie po stronie klienta (patrz TablePlannerLoader.tsx) -
// Konva potrzebuje `window` już przy imporcie modułu.

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Stage, Text } from "react-konva";
import type {
  Guest,
  SeatWithGuestName,
  TableShape,
  WeddingTable,
  LayoutItem,
} from "@/lib/db/types";
import {
  assignSeatAction,
  createTableAction,
  deleteTableAction,
  unassignSeatAction,
  updateTablePositionAction,
  updateTableShapeAction,
  renameTableAction,
  updateSeatsCountAction,
  createLayoutItemAction,
  updateLayoutItemPositionAction,
  renameLayoutItemAction,
  resizeLayoutItemAction,
  deleteLayoutItemAction,
} from "@/app/admin/tables/actions";
import { deleteTableLocal, loadTablesLocal, saveTableLocal } from "@/lib/tablePlannerLocalStore";

interface Props {
  weddingId: string;
  initialTables: WeddingTable[];
  initialSeats: SeatWithGuestName[];
  guests: Guest[];
  /** tableId -> nazwy grup, którym ten stół jest dozwolony (patrz
   * src/lib/db/groups.ts, adminListGroupNamesByTable) - puste, jeśli stół
   * nie jest ograniczony do żadnej konkretnej grupy. */
  groupNamesByTable: Record<string, string[]>;
  /** Znaczniki (DJ, bufet...) i ściany - patrz src/lib/db/layoutItems.ts. */
  initialLayoutItems: LayoutItem[];
}

const SEAT_RADIUS = 9;
const TABLE_RADIUS = 46;
const RECT_W = 130;
const RECT_H = 64;
const MARKER_RADIUS = 14;
const SAVE_DEBOUNCE_MS = 600;
const DEFAULT_ROOM = "Sala główna";

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
    const fromTables = Array.from(new Set(initialTables.map((t) => t.roomName)));
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

  /** Tylko jedno zaznaczenie naraz - stół albo znacznik/ściana. */
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
    const name = window.prompt("Nazwa nowej sali:");
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
   * przed wysłaniem, żeby nie zaskoczyć pary. */
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

  // --- Znaczniki (DJ, bufet, fotobudka...) i ściany - patrz
  // src/lib/db/layoutItems.ts. Świadomie WOLNY TEKST zamiast gotowego
  // zestawu ikon dla znaczników - para najlepiej wie, jak nazwać to, co u
  // niej stoi, a lista "typowych" miejsc na weselu jest w praktyce otwarta
  // (fontanna czekoladowa? stół z tortem? namiot dla dzieci?).

  async function handleAddMarker() {
    const label = window.prompt(
      "Co oznaczyć? (np. DJ, Orkiestra, Bufet, Fotobudka, Stół pary młodej)"
    );
    const trimmed = label?.trim();
    if (!trimmed) return;
    try {
      const item = await createLayoutItemAction(weddingId, {
        roomName: activeRoom,
        kind: "MARKER",
        label: trimmed,
        x: 120 + (layoutItemsInRoom.length % 5) * 80,
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
        y: 60 + (layoutItemsInRoom.length % 6) * 30,
        width: 160,
        height: 16,
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

  function handleRotateWall(item: LayoutItem) {
    const updated = { ...item, rotation: (item.rotation + 15) % 360 };
    setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    scheduleLayoutItemSave(updated);
  }

  function handleRenameMarker(item: LayoutItem) {
    const name = window.prompt("Nowa nazwa znacznika:", item.label ?? "");
    const trimmed = name?.trim();
    if (!trimmed || trimmed === item.label) return;
    renameLayoutItemAction(weddingId, item.id, trimmed)
      .then((updated) => setLayoutItems((prev) => prev.map((i) => (i.id === item.id ? updated : i))))
      .catch((err) => reportError(err));
  }

  /** dimension = "width" | "height", delta w pikselach - ściana zmienia
   * rozmiar krokowo (podobnie jak liczba miejsc przy stole), bez
   * przeciągania uchwytów na kanwie. */
  async function handleResizeWall(item: LayoutItem, dimension: "width" | "height", delta: number) {
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
    const label = item.kind === "MARKER" ? `znacznik "${item.label}"` : "ścianę";
    if (!window.confirm(`Usunąć ${label}?`)) return;
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
          <button
            type="button"
            onClick={handleAddRoom}
            className="rounded-full border border-dashed border-zinc-400 px-3 py-1 text-sm text-zinc-600 hover:border-zinc-600"
          >
            + Nowa sala
          </button>
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
              {/* Ściany pod spodem - to obrys/tło pomieszczenia, stoły i
                  znaczniki mają być zawsze widoczne NAD nimi. */}
              {layoutItemsInRoom
                .filter((item) => item.kind === "WALL")
                .map((item) => {
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
                        radius={TABLE_RADIUS}
                        fill={isSelected ? "#fde68a" : "#e4e4e7"}
                        stroke="#a1a1aa"
                        strokeWidth={2}
                      />
                    ) : (
                      <Rect
                        x={-RECT_W / 2}
                        y={-RECT_H / 2}
                        width={RECT_W}
                        height={RECT_H}
                        cornerRadius={8}
                        fill={isSelected ? "#fde68a" : "#e4e4e7"}
                        stroke="#a1a1aa"
                        strokeWidth={2}
                      />
                    )}
                    <Text
                      text={table.label}
                      align="center"
                      width={table.shape === "ROUND" ? TABLE_RADIUS * 2 : RECT_W}
                      x={table.shape === "ROUND" ? -TABLE_RADIUS : -RECT_W / 2}
                      y={groupNamesByTable[table.id]?.length ? -14 : -7}
                      fontSize={13}
                      fontStyle="bold"
                      fill="#3f3f46"
                    />
                    {!!groupNamesByTable[table.id]?.length && (
                      <Text
                        text={groupNamesByTable[table.id].join(", ")}
                        align="center"
                        width={table.shape === "ROUND" ? TABLE_RADIUS * 2 : RECT_W}
                        x={table.shape === "ROUND" ? -TABLE_RADIUS : -RECT_W / 2}
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
                  gdyby ktoś przesunął je blisko stołu/ściany. */}
              {layoutItemsInRoom
                .filter((item) => item.kind === "MARKER")
                .map((item) => {
                  const isSelected = item.id === selectedLayoutItemId;
                  return (
                    <Group
                      key={item.id}
                      x={item.x}
                      y={item.y}
                      draggable
                      onDragEnd={(e) => handleLayoutItemDragEnd(item, e.target.x(), e.target.y())}
                      onClick={() => selectLayoutItem(item.id)}
                      onTap={() => selectLayoutItem(item.id)}
                    >
                      <Circle
                        radius={MARKER_RADIUS}
                        fill={isSelected ? "#f59e0b" : "#fbbf24"}
                        stroke="#92400e"
                        strokeWidth={1.5}
                      />
                      <Text
                        text={item.label ?? ""}
                        align="center"
                        width={120}
                        x={-60}
                        y={MARKER_RADIUS + 4}
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
            {selectedLayoutItem.kind === "MARKER" ? (
              <button
                type="button"
                onClick={() => handleRenameMarker(selectedLayoutItem)}
                className="text-sm font-semibold text-zinc-900 underline decoration-dotted underline-offset-2 hover:text-zinc-600"
                title="Kliknij, żeby zmienić nazwę"
              >
                {selectedLayoutItem.label}
              </button>
            ) : (
              <h2 className="text-sm font-semibold text-zinc-900">Ściana</h2>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Zamknij
            </button>
          </div>

          {selectedLayoutItem.kind === "WALL" && (
            <>
              <div className="mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-500">
                    Długość ({Math.round(selectedLayoutItem.width)})
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleResizeWall(selectedLayoutItem, "width", -20)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400"
                      title="Skróć ścianę"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResizeWall(selectedLayoutItem, "width", 20)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400"
                      title="Wydłuż ścianę"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-500">
                    Grubość ({Math.round(selectedLayoutItem.height)})
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleResizeWall(selectedLayoutItem, "height", -10)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400"
                      title="Zmniejsz grubość ściany"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResizeWall(selectedLayoutItem, "height", 10)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:border-zinc-400"
                      title="Zwiększ grubość ściany"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRotateWall(selectedLayoutItem)}
                className="mb-2 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-xs hover:border-zinc-400"
              >
                Obróć o 15°
              </button>
            </>
          )}

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

function seatPositions(table: WeddingTable): { x: number; y: number }[] {
  const n = table.seatsCount;
  const positions: { x: number; y: number }[] = [];

  if (table.shape === "ROUND") {
    const radius = TABLE_RADIUS + SEAT_RADIUS + 8;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return positions;
  }

  // Stół prostokątny: miejsca rozłożone równo po dwóch dłuższych bokach.
  const perSide = Math.ceil(n / 2);
  const margin = SEAT_RADIUS + 10;
  for (let i = 0; i < n; i++) {
    const onTopSide = i < perSide;
    const indexInSide = onTopSide ? i : i - perSide;
    const countInSide = onTopSide ? perSide : n - perSide;
    const spacing = RECT_W / (countInSide + 1);
    const x = -RECT_W / 2 + spacing * (indexInSide + 1);
    const y = onTopSide ? -(RECT_H / 2 + margin) : RECT_H / 2 + margin;
    positions.push({ x, y });
  }
  return positions;
}
