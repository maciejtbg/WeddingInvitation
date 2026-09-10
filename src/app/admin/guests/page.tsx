import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminListGuests } from "@/lib/db/guests";
import { adminListGroups } from "@/lib/db/groups";
import { listGuestIdsAwaitingReply } from "@/lib/db/chat";
import {
  addGuestAction,
  deleteGuestAction,
  assignGuestGroupAction,
  setGuestContactAction,
} from "../actions";
import CopyLinkButton from "@/components/CopyLinkButton";
import SendInviteButtons from "@/components/SendInviteButtons";

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
  const groups = adminListGroups(wedding.id);
  const awaitingReply = new Set(listGuestIdsAwaitingReply(wedding.id));

  const openedCount = guests.filter((g) => g.firstVisitedAt).length;
  const yesCount = guests.filter((g) => g.rsvpStatus === "YES").length;
  const noCount = guests.filter((g) => g.rsvpStatus === "NO").length;
  const pendingCount = guests.length - yesCount - noCount;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Goście</h1>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/groups?weddingId=${wedding.id}`}
            className="text-sm text-zinc-500 underline"
          >
            Grupy gości
          </Link>
          <Link href="/admin" className="text-sm text-zinc-500 underline">
            ← Wróć do panelu
          </Link>
        </div>
      </div>

      {guests.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
            <p className="text-lg font-semibold text-zinc-900">{guests.length}</p>
            <p className="text-xs text-zinc-500">gości</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
            <p className="text-lg font-semibold text-zinc-900">{openedCount}</p>
            <p className="text-xs text-zinc-500">otworzyło zaproszenie</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
            <p className="text-lg font-semibold text-green-700">{yesCount}</p>
            <p className="text-xs text-zinc-500">potwierdziło</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
            <p className="text-lg font-semibold text-zinc-500">
              {pendingCount}
              {noCount > 0 ? ` / ${noCount}` : ""}
            </p>
            <p className="text-xs text-zinc-500">
              {noCount > 0 ? "oczekuje / nie przyjdzie" : "oczekuje"}
            </p>
          </div>
        </div>
      )}

      {awaitingReply.size > 0 && (
        <p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          💬 {awaitingReply.size}{" "}
          {awaitingReply.size === 1 ? "gość czeka" : "gości czeka"} na Waszą odpowiedź w
          czacie - patrz podświetlone przyciski &bdquo;Czat&rdquo; niżej.
        </p>
      )}

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
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Telefon (opcjonalnie)
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="np. 600 100 200"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              E-mail (opcjonalnie)
            </label>
            <input
              name="email"
              type="email"
              placeholder="np. jan@example.com"
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
                {guest.shortCode && (
                  <>
                    {" · kod: "}
                    <span className="font-mono">{guest.shortCode}</span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {guest.firstVisitedAt
                  ? `✓ otworzył(a) zaproszenie ${guest.firstVisitedAt.slice(0, 10)}`
                  : "jeszcze nie otworzył(a) zaproszenia"}
              </p>
              {groups.length > 0 && (
                <form action={assignGuestGroupAction} className="mt-1 flex items-center gap-1">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="guestId" value={guest.id} />
                  <select
                    name="groupId"
                    defaultValue={guest.groupId ?? ""}
                    className="rounded border border-zinc-300 px-1 py-0.5 text-xs text-zinc-700"
                  >
                    <option value="">bez grupy (rozmieszczanie)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-400">
                    Zapisz
                  </button>
                </form>
              )}
              <form action={setGuestContactAction} className="mt-1 flex flex-wrap items-center gap-1">
                <input type="hidden" name="weddingId" value={wedding.id} />
                <input type="hidden" name="guestId" value={guest.id} />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={guest.phone ?? ""}
                  placeholder="telefon"
                  className="w-24 rounded border border-zinc-300 px-1 py-0.5 text-xs text-zinc-700"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={guest.email ?? ""}
                  placeholder="e-mail"
                  className="w-32 rounded border border-zinc-300 px-1 py-0.5 text-xs text-zinc-700"
                />
                <button className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-400">
                  Zapisz
                </button>
              </form>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {RSVP_LABELS[guest.rsvpStatus]}
              </span>
              <CopyLinkButton path={`/z/${guest.token}`} />
              <SendInviteButtons
                path={`/z/${guest.token}`}
                phone={guest.phone}
                email={guest.email}
                partner1Name={wedding.partner1Name}
                partner2Name={wedding.partner2Name}
                guestFirstName={guest.firstName}
              />
              {guest.shortCode && (
                <a
                  href={`/admin/guests/${guest.id}/invite-card?weddingId=${wedding.id}`}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
                  title={`Kod ręczny: ${guest.shortCode}`}
                >
                  Pobierz zaproszenie (QR)
                </a>
              )}
              <Link
                href={`/admin/guests/${guest.id}?weddingId=${wedding.id}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  awaitingReply.has(guest.id)
                    ? "border-amber-400 bg-amber-100 text-amber-900 hover:border-amber-500"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-400"
                }`}
              >
                Czat{awaitingReply.has(guest.id) ? " 💬" : ""}
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
