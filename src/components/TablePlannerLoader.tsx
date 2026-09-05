"use client";

// Konva potrzebuje `window`/`document` już przy inicjalizacji modułu, więc
// komponent kanwy musi być wyłączony z renderowania po stronie serwera.
// Server Component (src/app/admin/tables/page.tsx) sam nie może użyć
// next/dynamic z ssr:false, dlatego to wydzielony, mały wrapper kliencki.

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type TablePlannerComponent from "./TablePlanner";

const TablePlanner = dynamic(() => import("./TablePlanner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
      Ładowanie planera...
    </div>
  ),
});

export default function TablePlannerLoader(props: ComponentProps<typeof TablePlannerComponent>) {
  return <TablePlanner {...props} />;
}
