"use server";

import { redirect } from "next/navigation";
import { getGuestSession, clearGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { guestDeleteSelf } from "@/lib/db/guests";
import { removePhotosByGuest } from "@/lib/photoStorage";

export async function deleteMyDataAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const wedding = findWeddingBySlug(slug);
  if (!wedding) redirect("/");

  const session = await getGuestSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/w/${wedding.slug}`);
  }

  // Kolejność ma znaczenie: zdjęcia trzeba skasować PRZED wierszem gościa,
  // bo dopiero wtedy wiadomo, które pliki na dysku są jego (patrz komentarz
  // przy guestDeleteSelf w src/lib/db/guests.ts).
  await removePhotosByGuest(wedding.id, session.guestId);
  guestDeleteSelf(session.guestId);
  await clearGuestSession();

  redirect(`/w/${wedding.slug}?deleted=1`);
}
