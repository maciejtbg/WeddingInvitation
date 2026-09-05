import { redirect, notFound } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { guestGetSelf } from "@/lib/db/guests";
import { listMessagesForGuest } from "@/lib/db/chat";
import { submitRsvpAction, sendGuestMessageAction } from "./actions";

export default async function MyInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
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

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <p className="mb-1 text-sm text-zinc-500">Cześć, {guest.firstName}!</p>
      <h1 className="mb-8 text-3xl font-semibold text-zinc-900">
        {wedding.partner1Name} &amp; {wedding.partner2Name}
      </h1>

      {saved && (
        <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Dziękujemy za odpowiedź!
        </p>
      )}

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Czy będziesz z nami?</h2>
        <form action={submitRsvpAction} className="space-y-4">
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-3 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white">
              <input
                type="radio"
                name="rsvpStatus"
                value="YES"
                defaultChecked={guest.rsvpStatus === "YES"}
                className="sr-only"
              />
              Tak, będę!
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-3 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white">
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
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Imię osoby towarzyszącej (jeśli przychodzisz z kimś)
              </label>
              <input
                name="plusOneName"
                defaultValue={guest.plusOneName ?? ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Alergie / preferencje żywieniowe
            </label>
            <input
              name="dietaryNotes"
              defaultValue={guest.dietaryNotes ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Zapisz odpowiedź
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">
          Masz pytanie do pary młodej?
        </h2>
        <div className="mb-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-zinc-400">Napisz do nas, jeśli masz jakieś pytanie.</p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.sender === "GUEST"
                  ? "ml-auto bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-900"
              }`}
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
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Wyślij
          </button>
        </form>
      </div>
    </div>
  );
}
