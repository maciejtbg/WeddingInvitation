// Współdzielona geometria stołów - jedno źródło prawdy dla repozytorium
// (auto-powiększanie przy dokładaniu miejsc, src/lib/db/tables.ts) i
// komponentu kanwy (rozmieszczanie krzeseł, src/components/TablePlanner.tsx),
// żeby oba miejsca się nie rozjechały w to, "ile miejsca potrzebuje jedno
// krzesło".

export const SEAT_RADIUS = 9;
// Minimalny odstęp między krawędziami sąsiednich krzeseł, żeby się
// wizualnie nie stykały - dobrane "na oko", nie ma tu fizycznej reguły.
const SEAT_GAP = 8;
const SEAT_PITCH = SEAT_RADIUS * 2 + SEAT_GAP;

export const MIN_ROUND_RADIUS = 46;
export const MIN_RECT_WIDTH = 130;
export const MIN_RECT_HEIGHT = 64;
export const MAX_TABLE_DIMENSION = 500;

/** Najmniejszy promień okrągłego stołu, przy którym `seatsCount` krzeseł
 * rozłożonych po obwodzie się nie nakłada. */
export function minRoundRadius(seatsCount: number): number {
  return Math.max(MIN_ROUND_RADIUS, Math.ceil((seatsCount * SEAT_PITCH) / (2 * Math.PI)));
}

/** Najmniejsza SZEROKOŚĆ prostokątnego stołu, przy której `seatsCount`
 * krzeseł rozłożonych po całym obwodzie (4 boki, patrz seatPositions niżej)
 * się nie nakłada - rozciąga tylko szerokość, nie wysokość, tak jak przy
 * prawdziwym zestawianiu stołów w rząd. */
export function minRectWidth(seatsCount: number, height: number): number {
  return Math.max(MIN_RECT_WIDTH, Math.ceil((seatsCount * SEAT_PITCH) / 2 - height));
}

export interface SeatGeometryTable {
  shape: "ROUND" | "RECT";
  seatsCount: number;
  radius: number;
  width: number;
  height: number;
}

/** Rozmieszczenie krzeseł dookoła stołu, WZGLĘDEM JEGO ŚRODKA (nieobrócone -
 * obrót/przesunięcie całego stołu, patrz WeddingTable.rotation/x/y, to
 * osobna transformacja po stronie wywołującego: Konva Group w planerze
 * pary, transform="translate(...) rotate(...)" w SVG mapki dla gościa,
 * patrz src/components/TableSeatDiagram.tsx). Jedno źródło prawdy dla obu
 * miejsc renderujących, żeby rysowały DOKŁADNIE to samo rozmieszczenie.
 *
 * margin = jak daleko środek krzesła wystaje poza krawędź stołu - każdy z
 * dwóch renderujących podaje własną wartość dopasowaną do swojej skali
 * (zwykle promień rysowanego krzesła + mały odstęp). */
export function seatPositions(
  table: SeatGeometryTable,
  margin: number
): { x: number; y: number }[] {
  const n = table.seatsCount;
  const positions: { x: number; y: number }[] = [];

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
