"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type LocationsMapComponent from "./LocationsMap";

const LocationsMap = dynamic(() => import("./LocationsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-lg border border-[var(--wd-border)] text-sm text-[var(--wd-muted)]">
      Ładowanie mapy...
    </div>
  ),
});

export default function LocationsMapLoader(props: ComponentProps<typeof LocationsMapComponent>) {
  return <LocationsMap {...props} />;
}
