"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getGuestSession } from "@/lib/auth/guest";
import { guestSubmitRsvp, guestGetWeddingId } from "@/lib/db/guests";
import { sendMessage } from "@/lib/db/chat";
import { findWeddingById } from "@/lib/db/weddings";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitRsvpAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");

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
  revalidatePath(`/w/${wedding?.slug ?? ""}/moje-zaproszenie`);
  redirect(`/w/${wedding?.slug ?? ""}/moje-zaproszenie?saved=1`);
}

export async function sendGuestMessageAction(formData: FormData): Promise<void> {
  const session = await getGuestSession();
  if (!session) redirect("/");

  const body = readString(formData, "body");
  const wedding = findWeddingById(session.weddingId);
  if (!body || !wedding) redirect(`/w/${wedding?.slug ?? ""}/moje-zaproszenie`);

  const weddingId = guestGetWeddingId(session.guestId);
  if (weddingId !== session.weddingId) {
    // Rozjazd między sesją a bazą (np. gość usunięty) - nie kontynuujemy.
    redirect("/");
  }

  sendMessage({ weddingId: session.weddingId, guestId: session.guestId, sender: "GUEST", body });
  revalidatePath(`/w/${wedding.slug}/moje-zaproszenie`);
  redirect(`/w/${wedding.slug}/moje-zaproszenie`);
}
