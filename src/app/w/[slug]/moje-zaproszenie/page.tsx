import { redirect, notFound } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { guestGetSelf } from "@/lib/db/guests";
import { guestFindMySeat } from "@/lib/db/tables";
import { listMessagesForGuest } from "@/lib/db/chat";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import GuestSeatSection from "@/components/GuestSeatSection";
import { submitRsvpAction, sendGuestMessageAction } from "./actions";

export default async function MyInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; seatSaved?: string; seatError?: string; requestSent?: string }>;
}) {
  const { slug } = await params;
  const { saved, seatSaved, seatError, requestSent } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGuestSession();
  // Sesja gościa musi dotyczyć DOKŁADNIE tego wesela, którego adres jest
  // w URL-u - inaczej gość jednej pary nie mógłby przypadkiem podejrzeć
  // strony (czy tym bardziej danych) innej pary pod innym slugiem.
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/w/${wedding.slug}`);
  }

  const guest = guestGetSelf(session.guestId);
  if (!guest) redirect(`/w/${wedding.slug}`);

  const messages = listMessagesForGuest(guest.id);
  const theme = getTheme(wedding.theme);
  // Gość widzi WYŁĄCZNIE nazwę własnego stołu i sali - nigdy plan całej sali
  // ani listę innych gości przy stole (patrz src/lib/db/tables.ts).
  const mySeat = guestFindMySeat(guest.id);

  return (
    <div
      className="flex-1 px-6 py-12"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="mx-auto w-full max-w-xl">
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <p className="mb-1 text-center text-sm text-[var(--wd-muted)]">
          Cześć, {guest.firstName}!
        </p>
        <h1 className="mb-8 text-center font-serif text-3xl font-semibold text-[var(--wd-text)]">
          {wedding.partner1Name} &amp; {wedding.partner2Name}
        </h1>

        {saved && (
          <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Dziękujemy za odpowiedź!
          </p>
        )}

        <GuestSeatSection
          weddingId={wedding.id}
          seatingMode={wedding.seatingMode}
          guestId={guest.id}
          rsvpStatus={guest.rsvpStatus}
          mySeat={mySeat}
          seatError={seatError}
          seatSaved={seatSaved === "1"}
          requestSent={requestSent === "1"}
        />

        <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--wd-text)]">
            Czy będziesz z nami?
          </h2>
          <form action={submitRsvpAction} className="space-y-4">
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--wd-border)] px-4 py-3 text-sm text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]">
                <input
                  type="radio"
                  name="rsvpStatus"
                  value="YES"
                  defaultChecked={guest.rsvpStatus === "YES"}
                  className="sr-only"
                />
                Tak, będę!
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--wd-border)] px-4 py-3 text-sm text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]">
                <input
                  type="radio"
                  name="rsvpStatus"
                  value="NO"
                  defaultChecked={guest.rsvpStatus === "NO"}
                  className="sr-only"
                />
                Niestety nie
              </label>
            </div>

            {guest.allowPlusOne && (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--wd-text)]">
                  Imię osoby towarzyszącej (jeśli przychodzisz z kimś)
                </label>
                <input
                  name="plusOneName"
                  defaultValue={guest.plusOneName ?? ""}
                  className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--wd-text)]">
                Alergie / preferencje żywieniowe
              </label>
              <input
                name="dietaryNotes"
                defaultValue={guest.dietaryNotes ?? ""}
                className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[var(--wd-accent)] px-4 py-2.5 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
            >
              Zapisz odpowiedź
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--wd-text)]">
            Masz pytanie do pary młodej?
          </h2>
          <div className="mb-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-[var(--wd-muted)]">
                Napisz do nas, jeśli masz jakieś pytanie.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
                style={
                  message.sender === "GUEST"
                    ? { marginLeft: "auto", background: theme.colors.accent, color: theme.colors.accentText }
                    : { background: theme.colors.background, color: theme.colors.text }
                }
              >
                {message.body}
              </div>
            ))}
          </div>
          <form action={sendGuestMessageAction} className="flex gap-2">
            <input
              name="body"
              required
              placeholder="Napisz wiadomość..."
              className="flex-1 rounded-full border border-[var(--wd-border)] bg-[var(--wd-bg)] px-4 py-2 text-sm text-[var(--wd-text)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--wd-accent)] px-5 py-2 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
            >
              Wyślij
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
