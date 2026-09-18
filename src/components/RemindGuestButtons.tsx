"use client";

// Przyciski "Przypomnij" - jak SendInviteButtons (ten sam brak integracji z
// dostawcą SMS/email, tylko otwieramy domyślny program pocztowy/SMS pary
// z gotową treścią), ale do WYSŁANIA PRZYPOMNIENIA już zaproszonemu
// gościowi, nie pierwszego zaproszenia - stąd inna treść domyślna i osobne
// pole na własną notatkę (np. "zmieniliśmy godzinę ceremonii na 15:00"),
// żeby para mogła doprecyzować, o co konkretnie przypomina, bez pisania
// całej wiadomości od zera w swoim programie pocztowym.
//
// Świadomie WYŁĄCZNIE ręczne (para klika, kiedy sama uzna, że trzeba) -
// zero automatyzacji/harmonogramu, więc zero nowej infrastruktury czy
// kosztów (patrz decyzja w rozmowie z parą).

import { useState } from "react";

export default function RemindGuestButtons({
  path,
  phone,
  email,
  partner1Name,
  partner2Name,
  guestFirstName,
  rsvpPending,
}: {
  path: string;
  phone: string | null;
  email: string | null;
  partner1Name: string;
  partner2Name: string;
  guestFirstName: string;
  rsvpPending: boolean;
}) {
  const [note, setNote] = useState("");

  if (!phone && !email) return null;

  function inviteUrl() {
    return `${window.location.origin}${path}`;
  }

  function reminderBody() {
    const trimmed = note.trim();
    if (trimmed) {
      return `Cześć ${guestFirstName}! ${trimmed} Szczegóły: ${inviteUrl()}`;
    }
    return rsvpPending
      ? `Cześć ${guestFirstName}! Przypominamy o potwierdzeniu obecności na naszym ślubie - ${partner1Name} i ${partner2Name}. Zrobisz to tutaj: ${inviteUrl()}`
      : `Cześć ${guestFirstName}! Przypominamy o naszym ślubie - ${partner1Name} i ${partner2Name}. Wszystkie informacje na Twojej stronie: ${inviteUrl()}`;
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Przypomnienie - ślub ${partner1Name} i ${partner2Name}`);
    const body = encodeURIComponent(reminderBody());
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function handleSms() {
    const body = encodeURIComponent(reminderBody());
    window.location.href = `sms:${phone}?body=${body}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="np. zmieniliśmy godzinę (opcjonalnie)"
        className="w-48 rounded border border-zinc-300 px-1.5 py-1 text-[11px] text-zinc-700"
      />
      {email && (
        <button
          type="button"
          onClick={handleEmail}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
          title={`Przypomnij mailem na ${email}`}
        >
          ✉️ Przypomnij mailem
        </button>
      )}
      {phone && (
        <button
          type="button"
          onClick={handleSms}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
          title={`Przypomnij SMS-em na ${phone}`}
        >
          💬 Przypomnij SMS-em
        </button>
      )}
    </div>
  );
}
