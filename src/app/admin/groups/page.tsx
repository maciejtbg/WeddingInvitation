import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminListGroups, adminListAllowancesByGroup } from "@/lib/db/groups";
import { adminListTables } from "@/lib/db/tables";
import {
  createGroupAction,
  deleteGroupAction,
  renameGroupAction,
  toggleGroupTableAllowanceAction,
} from "./actions";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const groups = adminListGroups(wedding.id);
  const tables = adminListTables(wedding.id);
  const allowancesByGroup = adminListAllowancesByGroup(wedding.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Grupy gości</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>

      <p className="mb-6 text-sm text-zinc-500">
        Grupy (np. rodzina, praca, przyjaciele) mają znaczenie w trybie
        rozmieszczania &bdquo;Swoboda w ramach grupy&rdquo; - członek grupy widzi
        i wybiera miejsce wyłącznie przy stołach zaznaczonych poniżej jako
        dozwolone dla jego grupy. Grupa bez żadnego zaznaczonego stołu ma
        dostęp do wszystkich stołów. Gości przypisujecie do grup na stronie{" "}
        <Link href={`/admin/guests?weddingId=${wedding.id}`} className="underline">
          Goście
        </Link>
        .
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Nowa grupa</h2>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            Podaj nazwę grupy.
          </p>
        )}
        <form action={createGroupAction} className="flex gap-2">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <input
            name="name"
            required
            placeholder="np. Rodzina Pana Młodego"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Dodaj
          </button>
        </form>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-zinc-500">Nie macie jeszcze żadnej grupy.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const allowed = new Set(allowancesByGroup[group.id] ?? []);
            return (
              <div key={group.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <form action={renameGroupAction} className="flex items-center gap-2">
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="groupId" value={group.id} />
                    <input
                      name="name"
                      defaultValue={group.name}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium text-zinc-900"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:border-zinc-400"
                    >
                      Zapisz nazwę
                    </button>
                  </form>
                  <form action={deleteGroupAction}>
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="groupId" value={group.id} />
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                      Usuń grupę
                    </button>
                  </form>
                </div>

                {tables.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    Dodajcie najpierw stoły w planerze, żeby ograniczyć wybór tej grupy.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tables.map((table) => {
                      const isAllowed = allowed.has(table.id);
                      return (
                        <form key={table.id} action={toggleGroupTableAllowanceAction}>
                          <input type="hidden" name="weddingId" value={wedding.id} />
                          <input type="hidden" name="groupId" value={group.id} />
                          <input type="hidden" name="tableId" value={table.id} />
                          <input type="hidden" name="allowed" value={isAllowed ? "0" : "1"} />
                          <button
                            type="submit"
                            className={`rounded-full px-3 py-1 text-xs ${
                              isAllowed
                                ? "bg-zinc-900 text-white"
                                : "border border-zinc-300 text-zinc-500 hover:border-zinc-400"
                            }`}
                            title={`${table.roomName} · ${table.label}`}
                          >
                            {table.label}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
