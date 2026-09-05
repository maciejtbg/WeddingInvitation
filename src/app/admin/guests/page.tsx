import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminListGuests } from "@/lib/db/guests";
import { addGuestAction, deleteGuestAction } from "../actions";
import CopyLinkButton from "@/components/CopyLinkButton";

const RSVP_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  YES: "Przyjdzie",
  NO: "Nie przyjdzie",
};

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  // Sprawdzenie własności: para może zarządzać wyłącznie swoim weselem.
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const guests = adminListGuests(wedding.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Goście</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Dodaj gościa</h2>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            Podaj przynajmniej imię gościa.
          </p>
        )}
        <form action={addGuestAction} className="grid grid-cols-2 gap-3">
          <input type="hidden" name="weddingId" value={wedding.id} />
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Imię</label>
            <input
              name="firstName"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Nazwisko (opcjonalnie)
            </label>
            <input
              name="lastName"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Grupa (widoczna tylko dla Was)
            </label>
            <input
              name="groupLabel"
              placeholder="np. Rodzina Pana Młodego"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" name="allowPlusOne" className="h-4 w-4" />
              Może przyjść z osobą towarzyszącą
            </label>
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Dodaj gościa
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {guests.length === 0 && (
          <p className="text-sm text-zinc-500">Nie dodaliście jeszcze żadnego gościa.</p>
        )}
        {guests.map((guest) => (
          <div
            key={guest.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div>
              <p className="font-medium text-zinc-900">
                {guest.firstName} {guest.lastName ?? ""}
              </p>
              <p className="text-xs text-zinc-500">
                {guest.groupLabel ?? "bez grupy"}
                {guest.allowPlusOne ? " · z osobą towarzyszącą" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {RSVP_LABELS[guest.rsvpStatus]}
              </span>
              <CopyLinkButton path={`/z/${guest.token}`} />
              <Link
                href={`/admin/guests/${guest.id}?weddingId=${wedding.id}`}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
              >
                Czat
              </Link>
              <form action={deleteGuestAction}>
                <input type="hidden" name="weddingId" value={wedding.id} />
                <input type="hidden" name="guestId" value={guest.id} />
                <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                  Usuń
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
