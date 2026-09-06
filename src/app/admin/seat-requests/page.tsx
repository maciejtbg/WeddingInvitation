import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminListSeatChangeRequests } from "@/lib/db/seatRequests";
import { guestFindMySeat } from "@/lib/db/tables";
import { resolveSeatChangeRequestAction } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje",
  APPROVED: "Zaakceptowana",
  DECLINED: "Odrzucona",
};

export default async function SeatRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const requests = adminListSeatChangeRequests(wedding.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Prośby o zmianę miejsca</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-zinc-500">Nikt jeszcze nie poprosił o zmianę miejsca.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const currentSeat = guestFindMySeat(request.guestId);
            return (
              <div
                key={request.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-zinc-900">
                    {request.guestFirstName} {request.guestLastName ?? ""}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      request.status === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : request.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>
                <p className="mb-2 text-xs text-zinc-500">
                  Obecne miejsce:{" "}
                  {currentSeat ? `${currentSeat.tableLabel} (${currentSeat.roomName})` : "brak przypisanego miejsca"}
                </p>
                {request.message && (
                  <p className="mb-3 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    {request.message}
                  </p>
                )}
                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <form action={resolveSeatChangeRequestAction}>
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700">
                        Akceptuj
                      </button>
                    </form>
                    <form action={resolveSeatChangeRequestAction}>
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="DECLINED" />
                      <button className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400">
                        Odrzuć
                      </button>
                    </form>
                    <Link
                      href="/admin/tables"
                      className="ml-auto rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
                    >
                      Otwórz planer, żeby przenieść
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
