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
 * krzeseł rozłożonych po całym obwodzie (4 boki, patrz seatPositions w
 * TablePlanner.tsx) się nie nakłada - rozciąga tylko szerokość, nie
 * wysokość, tak jak przy prawdziwym zestawianiu stołów w rząd. */
export function minRectWidth(seatsCount: number, height: number): number {
  return Math.max(MIN_RECT_WIDTH, Math.ceil((seatsCount * SEAT_PITCH) / 2 - height));
}
