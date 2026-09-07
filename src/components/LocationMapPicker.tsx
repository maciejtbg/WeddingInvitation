"use client";

// Interaktywna mapka OpenStreetMap do wybrania współrzędnych nowego miejsca
// (kliknięcie ustawia pinezkę i wypełnia ukryte pola lat/lng formularza) +
// wyszukiwarka adresu przez Nominatim (darmowe geokodowanie OSM, bez klucza
// API - patrz https://operations.osmfoundation.org/policies/nominatim/,
// używamy oszczędnie, jedno zapytanie na kliknięcie "Szukaj").
//
// Renderowana wyłącznie po stronie klienta (patrz LocationMapPickerLoader.tsx)
// - Leaflet potrzebuje `window`/`document` już przy inicjalizacji.

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [52.0, 19.0]; // środek Polski
const DEFAULT_ZOOM = 6;

export default function LocationMapPicker() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const latInputRef = useRef<HTMLInputElement | null>(null);
  const lngInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function placeMarker(lat: number, lng: number) {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    if (latInputRef.current) latInputRef.current.value = lat.toFixed(6);
    if (lngInputRef.current) lngInputRef.current.value = lng.toFixed(6);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Domyślne ikonki Leaflet odwołują się do względnych URL-i, które po
    // zbundlowaniu przez Next.js nie istnieją - podajemy je jawnie, z
    // własnych kopii w public/leaflet/ (nie z CDN - blokowane przez CSP,
    // patrz next.config.ts i komentarz w LocationsMap.tsx).
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    });

    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => placeMarker(e.latlng.lat, e.latlng.lng));

    // Kontener tuż po zamontowaniu (next/dynamic, wewnątrz formularza/flexboksa)
    // bywa zmierzony przez przeglądarkę jako szerokość 0 - patrz obszerny
    // komentarz w LocationsMap.tsx. ResizeObserver jako jedyny gwarantuje
    // realny rozmiar w swoim callbacku (w przeciwieństwie do rAF/setTimeout).
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0].contentRect.width === 0) return;
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`
      );
      const results = (await res.json()) as { lat: string; lon: string }[];
      if (results.length === 0) {
        setSearchError("Nie znaleziono takiego adresu - spróbuj kliknąć ręcznie na mapie.");
        return;
      }
      const lat = Number.parseFloat(results[0].lat);
      const lng = Number.parseFloat(results[0].lon);
      mapRef.current?.setView([lat, lng], 16);
      placeMarker(lat, lng);
    } catch {
      setSearchError("Nie udało się wyszukać adresu - spróbuj kliknąć ręcznie na mapie.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Wyszukaj adres, żeby wyśrodkować mapę..."
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:border-zinc-400 disabled:opacity-50"
        >
          {searching ? "Szukam…" : "Szukaj"}
        </button>
      </div>
      {searchError && <p className="mb-2 text-xs text-red-600">{searchError}</p>}
      <p className="mb-2 text-xs text-zinc-500">
        Kliknij dokładne miejsce na mapie - to ono trafi na stronę dla gości.
      </p>
      <div ref={containerRef} className="h-72 w-full rounded-lg border border-zinc-300" />
      {/* Celowo BEZ `required` - walidacja "wybrano punkt na mapie" dzieje
          się po stronie serwera (createLocationAction), bo `required` na
          ukrytym polu potrafi po cichu zablokować wysyłkę formularza bez
          żadnego widocznego komunikatu (przeglądarka nie może przenieść
          fokusu na niewidoczny element). */}
      <input ref={latInputRef} type="hidden" name="lat" />
      <input ref={lngInputRef} type="hidden" name="lng" />
    </div>
  );
}
