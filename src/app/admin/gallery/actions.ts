"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { uploadPhoto, removePhoto } from "@/lib/photoStorage";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireOwnedWedding(weddingId: string) {
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");
  return wedding;
}

export async function adminUploadPhotoAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/gallery?weddingId=${weddingId}&error=${encodeURIComponent("Wybierz plik ze zdjęciem")}`);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadPhoto({
      weddingId: wedding.id,
      uploadedByGuestId: null,
      originalBuffer: buffer,
      originalByteSize: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wgrać zdjęcia";
    redirect(`/admin/gallery?weddingId=${weddingId}&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/gallery");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/gallery?weddingId=${weddingId}`);
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const photoId = readString(formData, "photoId");
  const wedding = await requireOwnedWedding(weddingId);

  await removePhoto(wedding.id, photoId);
  revalidatePath("/admin/gallery");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/gallery?weddingId=${weddingId}`);
}
