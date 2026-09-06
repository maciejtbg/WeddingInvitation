import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listScheduleItems } from "@/lib/db/schedule";
import { createScheduleItemAction, deleteScheduleItemAction, moveScheduleItemAction } from "./actions";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const items = listScheduleItems(wedding.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Harmonogram dnia</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Widoczny dla gości na Waszej publicznej stronie. Kolejność ustawiacie
        strzałkami ↑/↓ - nie musi odpowiadać kolejności dodawania.
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Nowy punkt</h2>
        {error === "missing" && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            Podaj przynajmniej godzinę i nazwę punktu.
          </p>
        )}
        <form action={createScheduleItemAction} className="space-y-3">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Dzień (opcjonalnie)
              </label>
              <input
                name="dayLabel"
                placeholder="np. Sobota"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Godzina</label>
              <input
                name="timeLabel"
                required
                placeholder="np. 14:00"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Nazwa</label>
              <input
                name="title"
                required
                placeholder="np. Ceremonia"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Opis (opcjonalnie)
            </label>
            <input
              name="description"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Dodaj punkt
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Harmonogram jest jeszcze pusty.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div>
                <p className="text-xs text-zinc-500">
                  {item.dayLabel ? `${item.dayLabel} · ` : ""}
                  {item.timeLabel}
                </p>
                <p className="font-medium text-zinc-900">{item.title}</p>
                {item.description && <p className="text-sm text-zinc-500">{item.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <form action={moveScheduleItemAction}>
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
                <form action={moveScheduleItemAction}>
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
                <form action={deleteScheduleItemAction}>
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                    Usuń
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
