"use client";

// Mapa OpenStreetMap dla gości - tylko do odczytu, jedna pinezka na miejsce
// (ceremonia/przyjęcie/poprawiny/inne), z linkiem do nawigacji w Google/Apple
// Maps po kliknięciu. Renderowana wyłącznie po stronie klienta - patrz
// LocationsMapLoader.tsx.

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { WeddingLocation } from "@/lib/db/types";
import { getLocationKind } from "@/lib/locationKinds";

interface Props {
  locations: WeddingLocation[];
}

function externalMapsHtml(loc: WeddingLocation): string {
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
  const amaps = `https://maps.apple.com/?q=${encodeURIComponent(loc.label)}&ll=${loc.lat},${loc.lng}`;
  return `
    <div style="font-family: Arial, sans-serif; font-size: 13px; min-width: 160px;">
      <strong>${loc.label}</strong>
      ${loc.address ? `<div style="color:#666;margin-top:2px;">${loc.address}</div>` : ""}
      <div style="margin-top:8px; display:flex; gap:6px;">
        <a href="${gmaps}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">Google Maps</a>
        <a href="${amaps}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">Apple Maps</a>
      </div>
    </div>
  `;
}

export default function LocationsMap({ locations }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || locations.length === 0) return;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers = locations.map((loc) => {
      const kind = getLocationKind(loc.kind);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:${kind.color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      return L.marker([loc.lat, loc.lng], { icon }).bindPopup(externalMapsHtml(loc)).addTo(map);
    });

    function fitToMarkers() {
      if (markers.length === 1) {
        map.setView(markers[0].getLatLng(), 15);
      } else {
        map.fitBounds(L.featureGroup(markers).getBounds().pad(0.3));
      }
    }

    // Tuż po zamontowaniu (zwłaszcza przez next/dynamic, wewnątrz flexboksa)
    // kontener bywa zmierzony przez przeglądarkę jako szerokość 0 - Leaflet
    // policzony na takim rozmiarze zoom "dopasowany do zawartości" wychodzi
    // absurdalnie mały (cała kula ziemska zamiast okolicy). Ani rAF, ani
    // setTimeout nie dają gwarancji, że w tym momencie rozmiar jest już
    // prawdziwy - ResizeObserver jako jedyny mówi to na pewno (jego callback
    // dostaje realny rozmiar przy pierwszym wywołaniu zaraz po observe()).
    let didFit = false;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width === 0) return;
      map.invalidateSize();
      if (!didFit) {
        didFit = true;
        fitToMarkers();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, [locations]);

  if (locations.length === 0) return null;

  return <div ref={containerRef} className="h-80 w-full rounded-lg border border-[var(--wd-border)]" />;
}
