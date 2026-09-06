"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { adminResolveSeatChangeRequest } from "@/lib/db/seatRequests";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function resolveSeatChangeRequestAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const requestId = readString(formData, "requestId");
  const statusInput = readString(formData, "status");

  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  if (statusInput !== "APPROVED" && statusInput !== "DECLINED") {
    redirect(`/admin/seat-requests?weddingId=${weddingId}`);
  }

  adminResolveSeatChangeRequest(wedding.id, requestId, statusInput);
  revalidatePath("/admin/seat-requests");
  redirect(`/admin/seat-requests?weddingId=${weddingId}`);
}
