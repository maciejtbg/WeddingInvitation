// Sekcja "Twój stolik" na stronie gościa - zachowanie zależy od trybu
// rozmieszczania wesela (src/lib/seatingModes.ts). Server Component: żaden
// z czterech trybów nie wymaga JS po stronie klienta, tylko zwykłe formularze
// z Server Actions - spójnie z resztą aplikacji.

import type { RsvpStatus, SeatingMode } from "@/lib/db/types";
import type { GuestSeatView } from "@/lib/db/tables";
import { guestListAvailableSeats } from "@/lib/db/tables";
import { guestListMyRequests } from "@/lib/db/seatRequests";
import { guestSelfAssignSeatAction, guestRequestSeatChangeAction } from "@/app/[slug]/moje-zaproszenie/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { t } from "@/lib/i18n/dictionary";

interface Props {
  weddingId: string;
  seatingMode: SeatingMode;
  guestId: string;
  rsvpStatus: RsvpStatus;
  mySeat: GuestSeatView | null;
  seatError?: string;
  seatSaved?: boolean;
  requestSent?: boolean;
  dict: Dictionary;
}

export default async function GuestSeatSection({
  weddingId,
  seatingMode,
  guestId,
  rsvpStatus,
  mySeat,
  seatError,
  seatSaved,
  requestSent,
  dict,
}: Props) {
  const requestStatusLabels: Record<string, string> = {
    PENDING: dict.requestStatusPending,
    APPROVED: dict.requestStatusApproved,
    DECLINED: dict.requestStatusDeclined,
  };

  const currentSeatBlock = mySeat && (
    <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6 text-center">
      <h2 className="mb-1 text-lg font-medium text-[var(--wd-text)]">{dict.yourTable}</h2>
      <p className="text-sm text-[var(--wd-muted)]">{mySeat.roomName}</p>
      <p className="font-serif text-2xl text-[var(--wd-text)]">{mySeat.tableLabel}</p>
    </div>
  );

  if (seatingMode === "COUPLE_ONLY") {
    return currentSeatBlock ?? null;
  }

  if (seatingMode === "GUEST_REQUEST") {
    const requests = await guestListMyRequests(guestId);
    const latest = requests[0] ?? null;
    return (
      <>
        {currentSeatBlock}
        <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-2 text-lg font-medium text-[var(--wd-text)]">
            {dict.wantDifferentSeat}
          </h2>
          {requestSent && (
            <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {dict.requestSentToCouple}
            </p>
          )}
          {latest && latest.status === "PENDING" ? (
            <p className="text-sm text-[var(--wd-muted)]">
              {t(dict.alreadySentRequest, { status: requestStatusLabels[latest.status] })}
              {latest.message ? t(dict.quotedMessage, { message: latest.message }) : ""}
            </p>
          ) : (
            <form action={guestRequestSeatChangeAction} className="space-y-3">
              {latest && (
                <p className="text-xs text-[var(--wd-muted)]">
                  {t(dict.lastRequest, { status: requestStatusLabels[latest.status] })}
                </p>
              )}
              <textarea
                name="message"
                rows={2}
                placeholder={dict.seatChangeMessagePlaceholder}
                className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
              />
              <button
                type="submit"
                className="rounded-full bg-[var(--wd-accent)] px-4 py-2 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
              >
                {dict.requestSeatChange}
              </button>
            </form>
          )}
        </div>
      </>
    );
  }

  // GUEST_SELF_SELECT / GROUP_CONSTRAINED
  if (rsvpStatus !== "YES") {
    return (
      <>
        {currentSeatBlock}
        <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6 text-center text-sm text-[var(--wd-muted)]">
          {dict.confirmToChooseSeat}
        </div>
      </>
    );
  }

  const tables = await guestListAvailableSeats(weddingId, guestId);
  const hasAnyFreeSeat = tables.some((tbl) => tbl.seats.some((s) => !s.occupiedByFirstName || s.isMe));

  return (
    <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
      <h2 className="mb-1 text-lg font-medium text-[var(--wd-text)]">{dict.chooseYourSeat}</h2>
      {mySeat && (
        <p className="mb-3 text-sm text-[var(--wd-muted)]">
          {t(dict.currentlyAt, { table: mySeat.tableLabel, room: mySeat.roomName })}
        </p>
      )}
      {seatSaved && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          {dict.seatSaved}
        </p>
      )}
      {seatError === "taken" && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {dict.seatTakenError}
        </p>
      )}
      {!hasAnyFreeSeat ? (
        <p className="text-sm text-[var(--wd-muted)]">{dict.allSeatsTaken}</p>
      ) : (
        <form action={guestSelfAssignSeatAction} className="space-y-4">
          {tables.map((table) => (
            <div key={table.id}>
              <p className="mb-1.5 text-sm font-medium text-[var(--wd-text)]">
                {table.label}{" "}
                <span className="font-normal text-[var(--wd-muted)]">({table.roomName})</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {table.seats.map((seat) => {
                  const taken = !!seat.occupiedByFirstName && !seat.isMe;
                  return (
                    <label
                      key={seat.seatIndex}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        taken
                          ? "cursor-not-allowed border-[var(--wd-border)] text-[var(--wd-muted)] opacity-50"
                          : "cursor-pointer border-[var(--wd-border)] text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="seat"
                        value={`${table.id}:${seat.seatIndex}`}
                        disabled={taken}
                        defaultChecked={seat.isMe}
                        className="sr-only"
                      />
                      #{seat.seatIndex + 1}
                      {taken ? dict.seatTakenSuffix : seat.isMe ? dict.seatIsYouSuffix : ""}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="rounded-full bg-[var(--wd-accent)] px-4 py-2 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
          >
            {dict.saveSelectedSeat}
          </button>
        </form>
      )}
    </div>
  );
}
