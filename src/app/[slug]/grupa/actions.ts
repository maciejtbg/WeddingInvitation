"use server";

// Akcje strony zaproszenia grupowego (patrz page.tsx) - odpowiednik
// app/[slug]/moje-zaproszenie/actions.ts, ale każda operuje na WSZYSTKICH
// gościach z grupy przypisanej do sesji naraz, zamiast na jednym guestId.
//
// Bezpieczeństwo: identyfikatory gości w formData pochodzą od przeglądarki
// (nazwy pól typu rsvp_<guestId>), więc NIGDY im nie ufamy wprost - każde
// id jest sprawdzane względem świeżo pobranej z bazy listy członków grupy
// z sesji (groupListMemberViews), zanim cokolwiek zapiszemy pod tym id.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getGroupSession } from "@/lib/auth/groupGuest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { groupListMemberViews, guestSubmitRsvp } from "@/lib/db/guests";
import { recordConsent, hasCurrentConsent } from "@/lib/db/consents";
import { guestSelfAssignSeat } from "@/lib/db/tables";
import { allowsGuestSelfSelect } from "@/lib/seatingModes";
import type { RsvpStatus } from "@/lib/db/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireGroupContext(formData: FormData) {
  const slug = readString(formData, "slug");
  const wedding = findWeddingBySlug(slug);
  if (!wedding) redirect("/");

  const session = await getGroupSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/${wedding.slug}`);
  }

  const members = groupListMemberViews(wedding.id, session.groupId);
  return { wedding, groupId: session.groupId, members };
}

export async function groupAcceptConsentAction(formData: FormData): Promise<void> {
  const { wedding, members } = await requireGroupContext(formData);
  const groupUrl = `/${wedding.slug}/grupa`;

  if (formData.get("consent") !== "on") {
    redirect(`${groupUrl}?error=required`);
  }

  for (const member of members) {
    if (!hasCurrentConsent("GUEST", member.id)) {
      recordConsent("GUEST", member.id);
    }
  }

  revalidatePath(groupUrl);
  redirect(groupUrl);
}

export async function groupSubmitRsvpAction(formData: FormData): Promise<void> {
  const { wedding, members } = await requireGroupContext(formData);
  const groupUrl = `/${wedding.slug}/grupa`;

  // Zgoda jest bramką na poziomie renderu strony (patrz page.tsx), ale ta
  // akcja ma swój własny punkt wejścia (POST) - bez tego sprawdzenia dałoby
  // się zapisać RSVP z pominięciem ekranu zgody.
  if (members.some((m) => !hasCurrentConsent("GUEST", m.id))) {
    redirect(groupUrl);
  }

  for (const member of members) {
    if (!formData.has(`rsvp_${member.id}`)) continue; // formularz nie wysłał pola tej osoby
    const rsvpStatusRaw = readString(formData, `rsvp_${member.id}`);
    const rsvpStatus: RsvpStatus =
      rsvpStatusRaw === "YES" || rsvpStatusRaw === "NO" ? rsvpStatusRaw : "PENDING";

    guestSubmitRsvp(member.id, {
      rsvpStatus,
      dietaryNotes: readString(formData, `dietary_${member.id}`) || null,
      plusOneName: readString(formData, `plusOne_${member.id}`) || null,
    });
  }

  revalidatePath(groupUrl);
  redirect(`${groupUrl}?saved=1`);
}

export async function groupAssignSeatsAction(formData: FormData): Promise<void> {
  const { wedding, members } = await requireGroupContext(formData);
  const groupUrl = `/${wedding.slug}/grupa`;

  if (!wedding.allowGroupSeating || !allowsGuestSelfSelect(wedding.seatingMode)) {
    redirect(groupUrl);
  }

  let seatError = false;
  for (const member of members) {
    if (member.rsvpStatus !== "YES") continue;
    const raw = readString(formData, `seat_${member.id}`);
    if (!raw) continue; // ta osoba zostaje bez zmiany miejsca

    const [tableId, seatIndexRaw] = raw.split(":");
    const seatIndex = Number.parseInt(seatIndexRaw ?? "", 10);
    if (!tableId || Number.isNaN(seatIndex)) continue;

    try {
      guestSelfAssignSeat(wedding.id, member.id, tableId, seatIndex);
    } catch {
      // Ktoś inny (inny członek grupy albo sam gość osobnym linkiem) zajął
      // to miejsce chwilę wcześniej - kontynuujemy z resztą grupy zamiast
      // wywalać cały formularz.
      seatError = true;
    }
  }

  revalidatePath(groupUrl);
  redirect(`${groupUrl}${seatError ? "?seatError=taken" : "?seatSaved=1"}`);
}
