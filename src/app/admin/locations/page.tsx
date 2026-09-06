import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listLocations } from "@/lib/db/locations";
import { LOCATION_KIND_LIST, getLocationKind } from "@/lib/locationKinds";
import LocationMapPickerLoader from "@/components/LocationMapPickerLoader";
import { createLocationAction, deleteLocationAction } from "./actions";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const locations = listLocations(wedding.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Miejsca</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Dodane tu miejsca pojawią się na mapie na Waszej publicznej stronie
        (`/w/{wedding.slug}`), żeby goście dokładnie wiedzieli, gdzie trafić -
        z linkiem do nawigacji w Google Maps i Apple Maps.
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Nowe miejsce</h2>
        {error === "missing" && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            Podaj nazwę, wybierz rodzaj miejsca i kliknij dokładny punkt na mapie.
          </p>
        )}
        <form action={createLocationAction} className="space-y-4">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Nazwa</label>
              <input
                name="label"
                required
                placeholder="np. Kościół św. Anny"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Rodzaj</label>
              <select
                name="kind"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                {LOCATION_KIND_LIST.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Adres (opcjonalnie, sam tekst dla gości)
            </label>
            <input
              name="address"
              placeholder="np. ul. Kwiatowa 12, Kraków"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <LocationMapPickerLoader />

          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Dodaj miejsce
          </button>
        </form>
      </div>

      {locations.length === 0 ? (
        <p className="text-sm text-zinc-500">Nie dodaliście jeszcze żadnego miejsca.</p>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => {
            const kind = getLocationKind(loc.kind);
            return (
              <div
                key={loc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div>
                  <p className="flex items-center gap-2 font-medium text-zinc-900">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: kind.color }}
                    />
                    {loc.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {kind.label}
                    {loc.address ? ` · ${loc.address}` : ""}
                  </p>
                </div>
                <form action={deleteLocationAction}>
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="locationId" value={loc.id} />
                  <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                    Usuń
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
