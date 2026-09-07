import Link from "next/link";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingsByCouple } from "@/lib/db/weddings";
import { adminListGuests } from "@/lib/db/guests";
import { adminGetPlannerSnapshot } from "@/lib/db/tables";
import { adminListGroupNamesByTable } from "@/lib/db/groups";
import { adminListLayoutItems } from "@/lib/db/layoutItems";
import TablePlanner from "@/components/TablePlannerLoader";

export default async function TablesPage() {
  const session = await requireCoupleSessionOrRedirect();
  const wedding = findWeddingsByCouple(session.coupleId)[0];

  if (!wedding) {
    return (
      <div className="p-8">
        <p>Nie znaleziono wesela powiązanego z tym kontem.</p>
      </div>
    );
  }

  const { tables, seats } = adminGetPlannerSnapshot(wedding.id);
  const guests = adminListGuests(wedding.id);
  const groupNamesByTable = adminListGroupNamesByTable(wedding.id);
  const layoutItems = adminListLayoutItems(wedding.id);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div>
          <Link href="/admin" className="text-xs text-zinc-500 underline">
            ← Wróć do panelu
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">Planer stołów</h1>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TablePlanner
          weddingId={wedding.id}
          initialTables={tables}
          initialSeats={seats}
          guests={guests}
          groupNamesByTable={groupNamesByTable}
          initialLayoutItems={layoutItems}
        />
      </div>
    </div>
  );
}
