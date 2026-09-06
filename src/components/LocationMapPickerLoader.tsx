"use client";

// Leaflet potrzebuje `window` już przy imporcie modułu - jak w
// TablePlannerLoader.tsx, wydzielony mały wrapper kliencki z ssr:false.

import dynamic from "next/dynamic";

const LocationMapPicker = dynamic(() => import("./LocationMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-lg border border-zinc-300 text-sm text-zinc-500">
      Ładowanie mapy...
    </div>
  ),
});

export default function LocationMapPickerLoader() {
  return <LocationMapPicker />;
}
