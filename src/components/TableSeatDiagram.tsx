// Graficzna mapka miejsc jednego stołu - zamiast płaskiego rzędu przycisków
// "#1 #2 #3..." gość widzi kształt stołu i realne rozmieszczenie krzeseł
// dookoła niego (ten sam układ co w planerze pary, patrz seatPositions w
// src/lib/tableGeometry.ts - jedno źródło geometrii dla obu miejsc).
//
// Celowo NIE Konva/kanwa - to statyczne SVG + prawdziwe <input type="radio">
// osadzone przez <foreignObject>, więc zaznaczanie miejsca działa tak samo
// jak reszta formularzy w tej appce: bez JS, przez zwykły submit formularza
// (progressive enhancement, spójnie z resztą stron gościa). Krzesło to
// jeden <label> (całe klikalne, promień SEAT_R) z numerem miejsca w środku -
// wyłączone/zajęte miejsca w ogóle nie trafiają do table.seats (patrz
// guestListAvailableSeats w src/lib/db/tables.ts), więc tu nie ma ich czym
// narysować - dokładnie tak samo jak w dotychczasowej liście przycisków.

import { seatPositions } from "@/lib/tableGeometry";
import type { AvailableTable } from "@/lib/db/tables";

const SEAT_R = 16;
const TABLE_MARGIN = SEAT_R + 8;

export default function TableSeatDiagram({
  table,
  name,
  seatTakenSuffix,
  seatIsYouSuffix,
}: {
  table: AvailableTable;
  name: string;
  seatTakenSuffix: string;
  seatIsYouSuffix: string;
}) {
  // Pozycje dla WSZYSTKICH miejsc (łącznie z wyłączonymi), żeby odstępy
  // między widocznymi krzesłami zgadzały się z tym, co para widzi w
  // planerze - wyłączone miejsca po prostu nie mają tu odpowiednika w
  // table.seats, więc nic się dla nich nie renderuje, ale pozostałe krzesła
  // zachowują swoje "właściwe" miejsce w pierścieniu/obwodzie.
  const allPositions = seatPositions(
    { shape: table.shape, seatsCount: table.seatsCount, radius: table.radius, width: table.width, height: table.height },
    TABLE_MARGIN
  );

  const shapeHalfW = table.shape === "ROUND" ? table.radius : table.width / 2;
  const shapeHalfH = table.shape === "ROUND" ? table.radius : table.height / 2;
  const pad = SEAT_R + 4;
  const maxX = Math.max(shapeHalfW, ...allPositions.map((p) => Math.abs(p.x))) + pad;
  const maxY = Math.max(shapeHalfH, ...allPositions.map((p) => Math.abs(p.y))) + pad;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[var(--wd-text)]">
        {table.label} <span className="font-normal text-[var(--wd-muted)]">({table.roomName})</span>
      </p>
      <svg
        viewBox={`${-maxX} ${-maxY} ${maxX * 2} ${maxY * 2}`}
        role="img"
        aria-label={table.label}
        className="mx-auto block w-full max-w-[260px]"
      >
        {table.shape === "ROUND" ? (
          <circle r={table.radius} fill="var(--wd-surface)" stroke="var(--wd-border)" strokeWidth={2} />
        ) : (
          <rect
            x={-table.width / 2}
            y={-table.height / 2}
            width={table.width}
            height={table.height}
            rx={8}
            fill="var(--wd-surface)"
            stroke="var(--wd-border)"
            strokeWidth={2}
          />
        )}

        {table.seats.map((seat) => {
          const pos = allPositions[seat.seatIndex];
          const taken = !!seat.occupiedByFirstName && !seat.isMe;
          const label = `#${seat.seatIndex + 1}${taken ? ` ${seatTakenSuffix}` : seat.isMe ? ` ${seatIsYouSuffix}` : ""}`;
          return (
            <foreignObject
              key={seat.seatIndex}
              x={pos.x - SEAT_R}
              y={pos.y - SEAT_R}
              width={SEAT_R * 2}
              height={SEAT_R * 2}
            >
              <label
                title={label}
                aria-label={label}
                className={`flex h-full w-full items-center justify-center rounded-full border text-[10px] font-medium ${
                  taken
                    ? "cursor-not-allowed border-[var(--wd-border)] bg-[var(--wd-bg)] text-[var(--wd-muted)] opacity-50"
                    : "cursor-pointer border-[var(--wd-border)] text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]"
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={`${table.id}:${seat.seatIndex}`}
                  disabled={taken}
                  defaultChecked={seat.isMe}
                  className="sr-only"
                />
                {seat.seatIndex + 1}
              </label>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
