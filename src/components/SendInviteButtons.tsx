"use client";

// Przyciski "Wyślij" dla poszczególnych kanałów - NIE wysyłamy niczego sami
// (brak integracji z żadnym dostawcą SMS/email), tylko otwieramy domyślny
// program pocztowy/SMS gościa z gotowym tematem i treścią, wliczając link
// zaproszenia. Pełny URL liczony dopiero w onClick (nie w href przy
// renderze), tak jak w CopyLinkButton - komponent kliencki i tak jest
// server-side wyrenderowany raz bez window, więc window.location.origin
// musi poczekać do faktycznej interakcji.
export default function SendInviteButtons({
  path,
  phone,
  email,
  partner1Name,
  partner2Name,
  guestFirstName,
}: {
  path: string;
  phone: string | null;
  email: string | null;
  partner1Name: string;
  partner2Name: string;
  guestFirstName: string;
}) {
  if (!phone && !email) return null;

  function inviteUrl() {
    return `${window.location.origin}${path}`;
  }

  function inviteBody() {
    return `Cześć ${guestFirstName}! Zapraszamy Cię na nasz ślub - ${partner1Name} i ${partner2Name}. Szczegóły i potwierdzenie obecności: ${inviteUrl()}`;
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Zaproszenie na ślub - ${partner1Name} i ${partner2Name}`);
    const body = encodeURIComponent(inviteBody());
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function handleSms() {
    const body = encodeURIComponent(inviteBody());
    window.location.href = `sms:${phone}?body=${body}`;
  }

  return (
    <>
      {email && (
        <button
          type="button"
          onClick={handleEmail}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
          title={`Wyślij mailem na ${email}`}
        >
          ✉️ Wyślij mailem
        </button>
      )}
      {phone && (
        <button
          type="button"
          onClick={handleSms}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
          title={`Wyślij SMS-em na ${phone}`}
        >
          💬 Wyślij SMS-em
        </button>
      )}
    </>
  );
}
