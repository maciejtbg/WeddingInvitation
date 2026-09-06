import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listFaqItems } from "@/lib/db/faq";
import { createFaqItemAction, deleteFaqItemAction, moveFaqItemAction } from "./actions";

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const items = listFaqItems(wedding.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">FAQ</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Najczęstsze pytania gości (parking, dzieci, dress code...) - widoczne
        na Waszej publicznej stronie jako lista rozwijana.
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Nowe pytanie</h2>
        {error === "missing" && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            Podaj pytanie i odpowiedź.
          </p>
        )}
        <form action={createFaqItemAction} className="space-y-3">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Pytanie</label>
            <input
              name="question"
              required
              placeholder="np. Czy jest parking?"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Odpowiedź</label>
            <textarea
              name="answer"
              required
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Dodaj pytanie
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nie dodaliście jeszcze żadnego pytania.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">{item.question}</p>
                  <p className="text-sm text-zinc-500">{item.answer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={moveFaqItemAction}>
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
                  <form action={moveFaqItemAction}>
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
                  <form action={deleteFaqItemAction}>
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
