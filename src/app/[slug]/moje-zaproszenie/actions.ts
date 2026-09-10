"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/auth/guest";
import { guestSubmitRsvp, guestGetWeddingId, guestGetSelf } from "@/lib/db/guests";
import { sendMessage } from "@/lib/db/chat";
import { findWeddingById } from "@/lib/db/weddings";
import type { Wedding } from "@/lib/db/types";
import { guestSelfAssignSeat } from "@/lib/db/tables";
import { guestCreateSeatChangeRequest, guestHasPendingRequest } from "@/lib/db/seatRequests";
import { allowsGuestSelfSelect } from "@/lib/seatingModes";
import { uploadPhoto } from "@/lib/photoStorage";
import { createSongRequest } from "@/lib/db/songRequests";
import { hasCurrentConsent } from "@/lib/db/consents";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** RODO - te akcje ZAPISUJĄ dane osobowe podane przez gościa (RSVP, dieta,
 * wiadomość, miejsce, zdjęcie, prośba muzyczna) - sprawdzenie zgody
 * WYŁĄCZNIE na poziomie renderu strony (patrz page.tsx) nie wystarcza, bo
 * Server Action ma swój własny punkt wejścia (POST), niezależny od tego,
 * czy gość w ogóle zobaczył formularz. Zwraca gotowy redirect() zamiast
 * boola, żeby wywołujący mógł po prostu `await requireGuestConsent(...)`
 * bez powtarzania logiki przekierowania w każdej akcji z osobna. */
async function requireGuestConsent(guestId: string, wedding: Wedding | null): Promise<void> {
  if (!wedding) redirect("/");
  if (!hasCurrentConsent("GUEST", guestId)) {
    redirect(`/${wedding.slug}/zgoda`);
  }
}

export async function submitRsvpAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");
  await requireGuestConsent(session.guestId, findWeddingById(session.weddingId));

  const rsvpStatusRaw = readString(formData, "rsvpStatus");
  const rsvpStatus = rsvpStatusRaw === "YES" || rsvpStatusRaw === "NO" ? rsvpStatusRaw : "PENDING";

  // guestSubmitRsvp działa wyłącznie na session.guestId - gość fizycznie
  // nie ma jak podać cudzego id i zmienić czyjeś RSVP.
  guestSubmitRsvp(session.guestId, {
    rsvpStatus,
    dietaryNotes: readString(formData, "dietaryNotes") || null,
    plusOneName: readString(formData, "plusOneName") || null,
  });

  const wedding = findWeddingById(session.weddingId);
  revalidatePath(`/${wedding?.slug ?? ""}/moje-zaproszenie`);
  redirect(`/${wedding?.slug ?? ""}/moje-zaproszenie?saved=1`);
}

export async function sendGuestMessageAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");
  await requireGuestConsent(session.guestId, findWeddingById(session.weddingId));

  const body = readString(formData, "body");
  const wedding = findWeddingById(session.weddingId);
  if (!body || !wedding) redirect(`/${wedding?.slug ?? ""}/moje-zaproszenie`);

  const weddingId = guestGetWeddingId(session.guestId);
  if (weddingId !== session.weddingId) {
    // Rozjazd między sesją a bazą (np. gość usunięty) - nie kontynuujemy.
    redirect("/");
  }

  sendMessage({ weddingId: session.weddingId, guestId: session.guestId, sender: "GUEST", body });
  revalidatePath(`/${wedding.slug}/moje-zaproszenie`);
  redirect(`/${wedding.slug}/moje-zaproszenie`);
}

/** Tryby GUEST_SELF_SELECT / GROUP_CONSTRAINED - gość wybiera/zmienia
 * miejsce samodzielnie. Wymaga potwierdzonego RSVP, bo nie ma sensu
 * rezerwować miejsca dla kogoś, kto jeszcze nie wie, czy przyjdzie. */
export async function guestSelfAssignSeatAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");

  const wedding = findWeddingById(session.weddingId);
  await requireGuestConsent(session.guestId, wedding);
  if (!wedding) redirect("/");
  const inviteUrl = `/${wedding.slug}/moje-zaproszenie`;

  if (!allowsGuestSelfSelect(wedding.seatingMode)) redirect(inviteUrl);

  const guest = guestGetSelf(session.guestId);
  if (!guest || guest.rsvpStatus !== "YES") {
    redirect(`${inviteUrl}?seatError=rsvp`);
  }

  // Jedno pole "tableId:seatIndex" zamiast dwóch osobnych - żeby jeden
  // wspólny <input type="radio" name="seat"> mógł ogarnąć wybór spośród
  // miejsc rozsianych po wielu stołach (gość wybiera dokładnie jedno).
  const [tableId, seatIndexRaw] = readString(formData, "seat").split(":");
  const seatIndex = Number.parseInt(seatIndexRaw ?? "", 10);
  if (!tableId || Number.isNaN(seatIndex)) redirect(inviteUrl);

  try {
    guestSelfAssignSeat(wedding.id, session.guestId, tableId, seatIndex);
  } catch {
    // Ktoś inny zajął to miejsce chwilę wcześniej (np. dwie karty równocześnie
    // otwarte) - nie wywalamy błędu 500, tylko wracamy z komunikatem.
    redirect(`${inviteUrl}?seatError=taken`);
  }

  revalidatePath(inviteUrl);
  redirect(`${inviteUrl}?seatSaved=1`);
}

/** Tryb GUEST_REQUEST - gość nie przenosi się sam, tylko zgłasza chęć zmiany;
 * para akceptuje/odrzuca na /admin/seat-requests. */
export async function guestRequestSeatChangeAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");

  const wedding = findWeddingById(session.weddingId);
  await requireGuestConsent(session.guestId, wedding);
  if (!wedding) redirect("/");
  const inviteUrl = `/${wedding.slug}/moje-zaproszenie`;

  if (!guestHasPendingRequest(session.guestId)) {
    const message = readString(formData, "message");
    guestCreateSeatChangeRequest(wedding.id, session.guestId, message || null);
  }

  revalidatePath(inviteUrl);
  redirect(`${inviteUrl}?requestSent=1`);
}

/** Galeria - placeholder do R2 (patrz src/lib/photoStorage.ts, limity i
 * kompresja). Gość może dorzucić zdjęcie do wspólnej galerii wesela, dopóki
 * nie osiągnie ona twardego limitu. */
export async function guestUploadPhotoAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");

  const wedding = findWeddingById(session.weddingId);
  await requireGuestConsent(session.guestId, wedding);
  if (!wedding) redirect("/");
  const inviteUrl = `/${wedding.slug}/moje-zaproszenie`;

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) redirect(inviteUrl);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadPhoto({
      weddingId: wedding.id,
      uploadedByGuestId: session.guestId,
      originalBuffer: buffer,
      originalByteSize: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wgrać zdjęcia";
    redirect(`${inviteUrl}?photoError=${encodeURIComponent(message)}`);
  }

  revalidatePath(inviteUrl);
  revalidatePath(`/${wedding.slug}`);
  redirect(`${inviteUrl}?photoSaved=1`);
}

/** Lista życzeń muzycznych - gość dodaje wynik wyszukiwania (patrz
 * src/lib/musicSearch.ts) do wspólnej, widocznej dla wszystkich listy.
 * Działa przez cały czas, także "w trakcie ślubu" - nie wymaga
 * potwierdzonego RSVP, w przeciwieństwie do wyboru miejsca. */
export async function addSongRequestAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");

  const wedding = findWeddingById(session.weddingId);
  await requireGuestConsent(session.guestId, wedding);
  if (!wedding) redirect("/");
  const musicUrl = `/${wedding.slug}/moje-zaproszenie/muzyka`;

  const trackName = readString(formData, "trackName");
  const artistName = readString(formData, "artistName");
  if (!trackName || !artistName) redirect(musicUrl);

  createSongRequest({
    weddingId: wedding.id,
    guestId: session.guestId,
    trackName,
    artistName,
    artworkUrl: readString(formData, "artworkUrl") || null,
    previewUrl: readString(formData, "previewUrl") || null,
    externalUrl: readString(formData, "externalUrl") || null,
  });

  revalidatePath(musicUrl);
  const q = readString(formData, "q");
  redirect(`${musicUrl}?added=1${q ? `&q=${encodeURIComponent(q)}` : ""}`);
}
