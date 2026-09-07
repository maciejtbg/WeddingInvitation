import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminFindGuestById } from "@/lib/db/guests";
import { listMessagesForGuest } from "@/lib/db/chat";
import { sendCoupleMessageAction } from "../../actions";
import { PollingRefresher } from "@/components/PollingRefresher";

export default async function GuestChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ guestId: string }>;
  searchParams: Promise<{ weddingId?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { guestId } = await params;
  const { weddingId } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const guest = adminFindGuestById(wedding.id, guestId);
  if (!guest) redirect(`/admin/guests?weddingId=${wedding.id}`);

  const messages = listMessagesForGuest(guest.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <PollingRefresher />
      <Link
        href={`/admin/guests?weddingId=${wedding.id}`}
        className="mb-4 text-sm text-zinc-500 underline"
      >
        ← Wróć do listy gości
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">
        Rozmowa z {guest.firstName} {guest.lastName ?? ""}
      </h1>

      <div className="mb-4 flex-1 space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-400">Brak wiadomości - napiszcie pierwsi.</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              message.sender === "COUPLE"
                ? "ml-auto bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-900"
            }`}
          >
            {message.body}
          </div>
        ))}
      </div>

      <form action={sendCoupleMessageAction} className="flex gap-2">
        <input type="hidden" name="weddingId" value={wedding.id} />
        <input type="hidden" name="guestId" value={guest.id} />
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
  );
}
