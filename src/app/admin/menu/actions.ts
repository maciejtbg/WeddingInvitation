"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { createMenuItem, deleteMenuItem, moveMenuItem } from "@/lib/db/menu";
import { isAllergenId } from "@/lib/allergens";

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

export async function createMenuItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const name = readString(formData, "name");
  if (!name) {
    redirect(`/admin/menu?weddingId=${weddingId}&error=missing`);
  }

  const allergens = formData.getAll("allergens").filter((v): v is string => typeof v === "string" && isAllergenId(v));

  createMenuItem({
    weddingId: wedding.id,
    category: readString(formData, "category") || null,
    name,
    description: readString(formData, "description") || null,
    allergens,
  });
  revalidatePath("/admin/menu");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/menu?weddingId=${weddingId}`);
}

export async function deleteMenuItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const itemId = readString(formData, "itemId");
  const wedding = await requireOwnedWedding(weddingId);

  deleteMenuItem(wedding.id, itemId);
  revalidatePath("/admin/menu");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/menu?weddingId=${weddingId}`);
}

export async function moveMenuItemAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const itemId = readString(formData, "itemId");
  const direction = readString(formData, "direction");
  const wedding = await requireOwnedWedding(weddingId);

  if (direction === "up" || direction === "down") {
    moveMenuItem(wedding.id, itemId, direction);
  }
  revalidatePath("/admin/menu");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/menu?weddingId=${weddingId}`);
}
