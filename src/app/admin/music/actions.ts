"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { deleteSongRequest } from "@/lib/db/songRequests";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
