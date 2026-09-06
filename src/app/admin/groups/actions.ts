"use server";

// Server Actions strony "Grupy gości" - zarządzanie grupami (rodzina/praca/
// przyjaciele) i tym, które stoły wolno wybierać ich członkom w trybie
// rozmieszczania GROUP_CONSTRAINED (patrz src/lib/seatingModes.ts).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import {
  adminCreateGroup,
  adminDeleteGroup,
  adminFindGroupById,
  adminRenameGroup,
  adminSetGroupTableAllowance,
} from "@/lib/db/groups";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireOwnedWedding(weddingId: string) {
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) {
    redirect("/admin");
  }
  return wedding;
}

export async function createGroupAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const name = readString(formData, "name");
  if (!name) redirect(`/admin/groups?weddingId=${weddingId}&error=missing`);

  adminCreateGroup(wedding.id, name);
  revalidatePath("/admin/groups");
  redirect(`/admin/groups?weddingId=${weddingId}`);
}

export async function renameGroupAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const groupId = readString(formData, "groupId");
  const wedding = await requireOwnedWedding(weddingId);

  const group = adminFindGroupById(wedding.id, groupId);
  if (!group) redirect(`/admin/groups?weddingId=${weddingId}`);

  const name = readString(formData, "name");
  if (name) adminRenameGroup(wedding.id, groupId, name);

  revalidatePath("/admin/groups");
  redirect(`/admin/groups?weddingId=${weddingId}`);
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const groupId = readString(formData, "groupId");
  const wedding = await requireOwnedWedding(weddingId);

  adminDeleteGroup(wedding.id, groupId);
  revalidatePath("/admin/groups");
  redirect(`/admin/groups?weddingId=${weddingId}`);
}

export async function toggleGroupTableAllowanceAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const groupId = readString(formData, "groupId");
  const tableId = readString(formData, "tableId");
  const wedding = await requireOwnedWedding(weddingId);

  const group = adminFindGroupById(wedding.id, groupId);
  if (!group) redirect(`/admin/groups?weddingId=${weddingId}`);

  const allowed = readString(formData, "allowed") === "1";
  adminSetGroupTableAllowance(groupId, tableId, allowed);

  revalidatePath("/admin/groups");
  redirect(`/admin/groups?weddingId=${weddingId}`);
}
