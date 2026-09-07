"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { deleteSongRequest, createSongRequest } from "@/lib/db/songRequests";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Para (albo ktoś z jej dostępem do panelu, np. DJ, jeśli para zdecyduje
 * się podać mu dane logowania) też może dorzucić piosenkę - nie tylko
 * goście. guestId zostaje puste (song_requests.guest_id dopuszcza NULL),
 * bo to zgłoszenie nie jest powiązane z żadnym konkretnym gościem. */
export async function adminAddSongAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const trackName = readString(formData, "trackName");
  const artistName = readString(formData, "artistName");
  const q = readString(formData, "q");
  if (!trackName || !artistName) redirect(`/admin/music?weddingId=${weddingId}&q=${encodeURIComponent(q)}`);

  createSongRequest({
    weddingId: wedding.id,
    guestId: null,
    trackName,
    artistName,
    artworkUrl: readString(formData, "artworkUrl") || null,
    previewUrl: readString(formData, "previewUrl") || null,
    externalUrl: readString(formData, "externalUrl") || null,
  });

  revalidatePath("/admin/music");
  revalidatePath(`/w/${wedding.slug}/moje-zaproszenie/muzyka`);
  redirect(`/admin/music?weddingId=${weddingId}&q=${encodeURIComponent(q)}&added=1`);
}

export async function adminDeleteSongAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const requestId = readString(formData, "requestId");

  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  deleteSongRequest(wedding.id, requestId);
  revalidatePath("/admin/music");
  revalidatePath(`/w/${wedding.slug}/moje-zaproszenie/muzyka`);
  redirect(`/admin/music?weddingId=${weddingId}`);
}
