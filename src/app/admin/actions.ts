"use server";

// Server Actions panelu pary. Każda z nich sama weryfikuje sesję/uprawnienia
// zamiast polegać wyłącznie na tym, że UI nie pokazuje danego przycisku -
// bo formularz z action da się wywołać bezpośrednim POST-em z pominięciem UI.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCoupleSession, clearCoupleSession, getCoupleSession } from "@/lib/auth/couple";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/auth/rateLimit";
import { createCouple, findCoupleByEmail } from "@/lib/db/couples";
import { recordConsent } from "@/lib/db/consents";
import {
  createWedding,
  findWeddingById,
  findWeddingsByCouple,
  updateWeddingDetails,
  publishWedding,
} from "@/lib/db/weddings";
import {
  adminCreateGuest,
  adminDeleteGuest,
  adminFindGuestById,
  adminSetGuestGroup,
  adminSetGuestContact,
} from "@/lib/db/guests";
import { sendMessage } from "@/lib/db/chat";
import { isThemeId } from "@/lib/themes";
import { isSeatingMode } from "@/lib/seatingModes";
import { isInviteCardVariant } from "@/lib/inviteCard";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerCoupleAction(formData: FormData): Promise<void> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const partner1Name = readString(formData, "partner1Name");
  const partner2Name = readString(formData, "partner2Name");

  const consentGiven = formData.get("privacyConsent") === "on";

  if (!email || !password || !partner1Name || !partner2Name) {
    redirect("/admin/register?error=missing");
  }
  if (password.length < 8) {
    redirect("/admin/register?error=weak-password");
  }
  if (!consentGiven) {
    redirect("/admin/register?error=consent");
  }
  if (findCoupleByEmail(email)) {
    redirect("/admin/register?error=exists");
  }

  const passwordHash = await hashPassword(password);
  const couple = createCouple(email, passwordHash);
  // RODO - rozliczalność (art. 5 ust. 2): zapis KTO/KIEDY/na jaką WERSJĘ
  // polityki wyraził zgodę, nie tylko sam fakt zaznaczenia checkboxa w UI.
  recordConsent("COUPLE", couple.id);
  const wedding = createWedding({ coupleId: couple.id, partner1Name, partner2Name });

  await createCoupleSession(couple.id);
  redirect(`/admin?welcome=${wedding.slug}`);
}

export async function loginCoupleAction(formData: FormData): Promise<void> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const rateLimitKey = `login:${email}`;

  if (!email || isRateLimited(rateLimitKey)) {
    redirect("/admin/login?error=invalid");
  }

  const couple = findCoupleByEmail(email);
  const ok = couple ? await verifyPassword(password, couple.passwordHash) : false;
  if (!couple || !ok) {
    recordFailedAttempt(rateLimitKey);
    redirect("/admin/login?error=invalid");
  }

  clearAttempts(rateLimitKey);
  await createCoupleSession(couple.id);
  redirect("/admin");
}

export async function logoutCoupleAction(): Promise<void> {
  await clearCoupleSession();
  redirect("/");
}

async function requireOwnedWedding(weddingId: string) {
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) {
    // Gość/inna para nie ma prawa dotknąć cudzego wesela.
    redirect("/admin");
  }
  return wedding;
}

export async function updateWeddingAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const themeInput = readString(formData, "theme");
  const seatingModeInput = readString(formData, "seatingMode");
  const giftNote = readString(formData, "giftNote");
  const retentionInput = readString(formData, "dataRetentionDays");
  const retentionDays = Number.parseInt(retentionInput, 10);

  updateWeddingDetails(wedding.id, {
    partner1Name: readString(formData, "partner1Name") || undefined,
    partner2Name: readString(formData, "partner2Name") || undefined,
    weddingDate: readString(formData, "weddingDate") || undefined,
    venueName: readString(formData, "venueName") || undefined,
    venueAddress: readString(formData, "venueAddress") || undefined,
    story: readString(formData, "story") || null,
    videoUrl: readString(formData, "videoUrl") || null,
    // Nieznana/pusta wartość jest ignorowana zamiast zapisana wprost do bazy -
    // formularz mógłby zostać wywołany bezpośrednim POST-em z dowolnym stringiem.
    theme: isThemeId(themeInput) ? themeInput : undefined,
    seatingMode: isSeatingMode(seatingModeInput) ? seatingModeInput : undefined,
    giftNote: giftNote || null,
    // Rozsądne granice (1-3650 dni) - formularz mógłby zostać wywołany
    // bezpośrednim POST-em z dowolną wartością, ujemna/zerowa liczba dni
    // nie ma tu sensu.
    dataRetentionDays:
      Number.isFinite(retentionDays) && retentionDays >= 1 && retentionDays <= 3650
        ? retentionDays
        : undefined,
  });

  revalidatePath("/admin");
  revalidatePath(`/${wedding.slug}`);
  redirect("/admin?saved=1");
}

export async function publishWeddingAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);
  publishWedding(wedding.id);
  revalidatePath(`/${wedding.slug}`);
  redirect("/admin?published=1");
}

/** Styl drukowanej karty zaproszenia (QR) - osobna, mała akcja zamiast
 * dokładania kolejnego pola do wielkiego formularza `updateWeddingAction`,
 * bo wybór dzieje się na dedykowanej stronie z podglądem na żywo (patrz
 * /admin/invite-card), nie w formularzu tekstowym. */
export async function setInvitationCardVariantAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const variant = readString(formData, "variant");
  if (!isInviteCardVariant(variant)) redirect(`/admin/invite-card?weddingId=${weddingId}`);

  updateWeddingDetails(wedding.id, { invitationCardVariant: variant });
  redirect(`/admin/invite-card?weddingId=${weddingId}&saved=1`);
}

export async function addGuestAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const firstName = readString(formData, "firstName");
  if (!firstName) redirect(`/admin/guests?weddingId=${weddingId}&error=missing`);

  adminCreateGuest({
    weddingId: wedding.id,
    firstName,
    lastName: readString(formData, "lastName") || null,
    groupLabel: readString(formData, "groupLabel") || null,
    allowPlusOne: formData.get("allowPlusOne") === "on",
    phone: readString(formData, "phone") || null,
    email: readString(formData, "email") || null,
  });

  revalidatePath("/admin/guests");
  redirect(`/admin/guests?weddingId=${weddingId}`);
}

/** Dopisanie/zmiana danych kontaktowych - osobno od dodawania gościa, żeby
 * dało się uzupełnić telefon/e-mail gościom dodanym wcześniej (patrz
 * komentarz przy adminSetGuestContact w src/lib/db/guests.ts). Same dane
 * służą WYŁĄCZNIE do wygenerowania linków mailto:/sms: po stronie pary
 * (patrz SendInviteButtons) - nic nie wysyłamy sami. */
export async function setGuestContactAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const guestId = readString(formData, "guestId");
  const wedding = await requireOwnedWedding(weddingId);

  const guest = adminFindGuestById(wedding.id, guestId);
  if (!guest) redirect(`/admin/guests?weddingId=${weddingId}`);

  adminSetGuestContact(wedding.id, guestId, {
    phone: readString(formData, "phone") || null,
    email: readString(formData, "email") || null,
  });

  revalidatePath("/admin/guests");
  redirect(`/admin/guests?weddingId=${weddingId}`);
}

export async function deleteGuestAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const guestId = readString(formData, "guestId");
  const wedding = await requireOwnedWedding(weddingId);

  adminDeleteGuest(wedding.id, guestId);
  revalidatePath("/admin/guests");
  redirect(`/admin/guests?weddingId=${weddingId}`);
}

export async function assignGuestGroupAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const guestId = readString(formData, "guestId");
  const wedding = await requireOwnedWedding(weddingId);

  const guest = adminFindGuestById(wedding.id, guestId);
  if (!guest) redirect(`/admin/guests?weddingId=${weddingId}`);

  const groupId = readString(formData, "groupId");
  adminSetGuestGroup(wedding.id, guestId, groupId || null);

  revalidatePath("/admin/guests");
  redirect(`/admin/guests?weddingId=${weddingId}`);
}

export async function sendCoupleMessageAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const guestId = readString(formData, "guestId");
  const body = readString(formData, "body");
  const wedding = await requireOwnedWedding(weddingId);

  // Upewniamy się, że ten gość naprawdę należy do wesela tej pary -
  // inaczej para mogłaby (teoretycznie, znając id) pisać do cudzych gości.
  const guest = adminFindGuestById(wedding.id, guestId);
  if (!guest) redirect(`/admin/guests?weddingId=${weddingId}`);
  if (!body) redirect(`/admin/guests/${guestId}?weddingId=${weddingId}`);

  sendMessage({ weddingId: wedding.id, guestId, sender: "COUPLE", body });
  revalidatePath(`/admin/guests/${guestId}`);
  redirect(`/admin/guests/${guestId}?weddingId=${weddingId}`);
}

export async function myWeddings(coupleId: string) {
  return findWeddingsByCouple(coupleId);
}
