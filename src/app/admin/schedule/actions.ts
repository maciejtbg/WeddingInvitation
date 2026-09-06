"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { createScheduleItem, deleteScheduleItem, moveScheduleItem } from "@/lib/db/schedule";

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

export async function createScheduleItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const timeLabel = readString(formData, "timeLabel");
  const title = readString(formData, "title");
  if (!timeLabel || !title) {
    redirect(`/admin/schedule?weddingId=${weddingId}&error=missing`);
  }

  createScheduleItem({
    weddingId: wedding.id,
    dayLabel: readString(formData, "dayLabel") || null,
    timeLabel,
    title,
    description: readString(formData, "description") || null,
  });

  revalidatePath("/admin/schedule");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/schedule?weddingId=${weddingId}`);
}

export async function deleteScheduleItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const itemId = readString(formData, "itemId");
  const wedding = await requireOwnedWedding(weddingId);

  deleteScheduleItem(wedding.id, itemId);
  revalidatePath("/admin/schedule");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/schedule?weddingId=${weddingId}`);
}

export async function moveScheduleItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const itemId = readString(formData, "itemId");
  const direction = readString(formData, "direction");
  const wedding = await requireOwnedWedding(weddingId);

  if (direction === "up" || direction === "down") {
    moveScheduleItem(wedding.id, itemId, direction);
  }
  revalidatePath("/admin/schedule");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/schedule?weddingId=${weddingId}`);
}
