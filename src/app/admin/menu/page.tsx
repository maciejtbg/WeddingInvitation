import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listMenuItems } from "@/lib/db/menu";
import { ALLERGENS, resolveAllergens } from "@/lib/allergens";
import { createMenuItemAction, deleteMenuItemAction, moveMenuItemAction } from "./actions";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const items = listMenuItems(wedding.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Menu i alergeny</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Dania, które podacie na uroczystości, wraz z alergenami - widoczne dla
        gości na ich stronie zaproszenia, obok pola na własne uwagi
        dietetyczne. Uwagi gości widzicie na stronie{" "}
        <Link href={`/admin/guests?weddingId=${wedding.id}`} className="underline">
          Goście
        </Link>
        .
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Nowe danie</h2>
        {error === "missing" && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            Podaj nazwę dania.
          </p>
        )}
        <form action={createMenuItemAction} className="space-y-3">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Kategoria</label>
              <input
                name="category"
                placeholder="np. Danie główne"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Nazwa dania</label>
              <input
                name="name"
                required
                placeholder="np. Kaczka z jabłkami"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Opis (opcjonalnie)
            </label>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Alergeny</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((allergen) => (
                <label
                  key={allergen.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white"
                >
                  <input type="checkbox" name="allergens" value={allergen.id} className="sr-only" />
                  {allergen.icon} {allergen.label}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Dodaj danie
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nie dodaliście jeszcze żadnego dania.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  {item.category && (
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      {item.category}
                    </p>
                  )}
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  {item.description && <p className="text-sm text-zinc-500">{item.description}</p>}
                  {item.allergens.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      {resolveAllergens(item.allergens)
                        .map((a) => `${a.icon} ${a.label}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={moveMenuItemAction}>
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      disabled={index === 0}
                      className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveMenuItemAction}>
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      disabled={index === items.length - 1}
                      className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:border-zinc-400 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteMenuItemAction}>
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="itemId" value={item.id} />
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                      Usuń
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
