"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { createFaqItem, deleteFaqItem, moveFaqItem } from "@/lib/db/faq";

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

export async function createFaqItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const question = readString(formData, "question");
  const answer = readString(formData, "answer");
  if (!question || !answer) {
    redirect(`/admin/faq?weddingId=${weddingId}&error=missing`);
  }

  createFaqItem({ weddingId: wedding.id, question, answer });
  revalidatePath("/admin/faq");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/faq?weddingId=${weddingId}`);
}

export async function deleteFaqItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const itemId = readString(formData, "itemId");
  const wedding = await requireOwnedWedding(weddingId);

  deleteFaqItem(wedding.id, itemId);
  revalidatePath("/admin/faq");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/faq?weddingId=${weddingId}`);
}

export async function moveFaqItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const itemId = readString(formData, "itemId");
  const direction = readString(formData, "direction");
  const wedding = await requireOwnedWedding(weddingId);

  if (direction === "up" || direction === "down") {
    moveFaqItem(wedding.id, itemId, direction);
  }
  revalidatePath("/admin/faq");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/faq?weddingId=${weddingId}`);
}
