import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminListGuests } from "@/lib/db/guests";
import { countMessagesForWedding } from "@/lib/db/chat";
import { listSongRequests } from "@/lib/db/songRequests";
import { adminListSeats } from "@/lib/db/tables";
import ReportPrintButton from "@/components/ReportPrintButton";

const RSVP_LABELS: Record<string, string> = {
  YES: "Potwierdzili",
  NO: "Odmówili",
  PENDING: "Brak odpowiedzi",
};

// Sekcje raportu, które para może włączyć/wyłączyć (patrz formularz niżej) -
// GET, nie Server Action, bo raport niczego nie zapisuje, tylko czyta już
// istniejące dane (RSVP, alergie, czat, muzyka, miejsca) - zaznaczenia dają
// się przez to od razu skopiować jako link albo wydrukować bez dodatkowego kroku.
const SECTION_KEYS = ["rsvp", "allergies", "chat", "songs", "seating"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  rsvp: "Stopień potwierdzania gości",
  allergies: "Alergie i uwagi dietetyczne",
  chat: "Wiadomości na czacie",
  songs: "Zgłoszone piosenki",
  seating: "Wybrane miejsca siedzące",
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; submitted?: string } & Record<SectionKey, string | undefined>>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const params = await searchParams;
  const { weddingId } = params;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  // Przy pierwszym wejściu (brak submitted=1 w adresie) pokazujemy wszystko -
  // dopiero świadome odznaczenie i "Generuj raport" zawęża wybór.
  const isFirstLoad = params.submitted !== "1";
  const show = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, isFirstLoad || params[key] === "1"])
  ) as Record<SectionKey, boolean>;

  const guests = adminListGuests(wedding.id);
  const yesCount = guests.filter((g) => g.rsvpStatus === "YES").length;
  const noCount = guests.filter((g) => g.rsvpStatus === "NO").length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === "PENDING").length;
  const guestsWithNotes = guests.filter((g) => g.dietaryNotes?.trim());
  const messages = show.chat ? countMessagesForWedding(wedding.id) : null;
  const songs = show.songs ? listSongRequests(wedding.id) : [];
  const seats = show.seating ? adminListSeats(wedding.id) : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-zinc-900">Raport</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>

      <form method="get" className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 print:hidden">
        <input type="hidden" name="weddingId" value={wedding.id} />
        <input type="hidden" name="submitted" value="1" />
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Co ma się znaleźć w raporcie?</h2>
        <div className="mb-4 flex flex-col gap-2">
          {SECTION_KEYS.map((key) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" name={key} value="1" defaultChecked={show[key]} />
              {SECTION_LABELS[key]}
            </label>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Generuj raport
        </button>
      </form>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="wd-heading-font text-xl text-zinc-900">
            {wedding.partner1Name} &amp; {wedding.partner2Name}
          </h2>
          <p className="text-xs text-zinc-400">
            Raport wygenerowany {new Date().toLocaleDateString("pl-PL")}
          </p>
        </div>

        {show.rsvp && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="mb-3 text-base font-medium text-zinc-900">{SECTION_LABELS.rsvp}</h3>
            <p className="mb-3 text-sm text-zinc-600">
              {guests.length === 0
                ? "Brak gości."
                : `${yesCount} z ${guests.length} gości potwierdziło przybycie (${Math.round((yesCount / guests.length) * 100)}%).`}
            </p>
            <div className="flex gap-4 text-sm text-zinc-700">
              <span>✅ {RSVP_LABELS.YES}: {yesCount}</span>
              <span>❌ {RSVP_LABELS.NO}: {noCount}</span>
              <span>⏳ {RSVP_LABELS.PENDING}: {pendingCount}</span>
            </div>
          </section>
        )}

        {show.allergies && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="mb-3 text-base font-medium text-zinc-900">{SECTION_LABELS.allergies}</h3>
            {guestsWithNotes.length === 0 ? (
              <p className="text-sm text-zinc-500">Nikt nie zgłosił alergii ani uwag dietetycznych.</p>
            ) : (
              <ul className="space-y-1 text-sm text-zinc-700">
                {guestsWithNotes.map((g) => (
                  <li key={g.id}>
                    <strong>
                      {g.firstName} {g.lastName ?? ""}
                    </strong>
                    {" - "}
                    {g.dietaryNotes}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {show.chat && messages && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="mb-3 text-base font-medium text-zinc-900">{SECTION_LABELS.chat}</h3>
            <p className="text-sm text-zinc-600">
              {messages.total === 0
                ? "Nikt jeszcze nie napisał na czacie."
                : `${messages.total} wiadomości od ${messages.guestsWithMessages} gości.`}
            </p>
          </section>
        )}

        {show.songs && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="mb-3 text-base font-medium text-zinc-900">{SECTION_LABELS.songs}</h3>
            {songs.length === 0 ? (
              <p className="text-sm text-zinc-500">Nikt jeszcze nie zgłosił piosenki.</p>
            ) : (
              <ul className="space-y-1 text-sm text-zinc-700">
                {songs.map((s) => (
                  <li key={s.id}>
                    {s.trackName} - {s.artistName}
                  </li>
                ))}
              </ul>
            )}
            {songs.length > 0 && <p className="mt-2 text-xs text-zinc-400">Razem: {songs.length}</p>}
          </section>
        )}

        {show.seating && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="mb-3 text-base font-medium text-zinc-900">{SECTION_LABELS.seating}</h3>
            <p className="mb-3 text-sm text-zinc-600">
              {seats.length} z {yesCount} potwierdzonych gości ma już przypisane miejsce.
            </p>
            {seats.length > 0 && (
              <ul className="space-y-1 text-sm text-zinc-700">
                {seats.map((s) => (
                  <li key={s.id}>
                    {s.guestFirstName} {s.guestLastName ?? ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <ReportPrintButton />
      </div>
    </div>
  );
}
