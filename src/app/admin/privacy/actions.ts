"use server";

// RODO - strefa "niebezpieczna" panelu pary: usunięcie całego konta (prawo
// do usunięcia, art. 17) i ręczne wyzwolenie retencji dla WŁASNEGO wesela
// (patrz src/lib/dataRetention.ts - normalnie odpala się to automatycznie
// z crona/scripts/purge-expired-data.mjs, to tu jest dla par bez crona albo
// takich, które chcą wyczyścić dane gości wcześniej niż domyślny termin).

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession, clearCoupleSession } from "@/lib/auth/couple";
import { findWeddingsByCouple, findWeddingById } from "@/lib/db/weddings";
import { deleteCouple } from "@/lib/db/couples";
import { removeAllPhotosForWedding } from "@/lib/photoStorage";
import { purgeWeddingGuestData } from "@/lib/dataRetention";

export async function deleteCoupleAccountAction(): Promise<void> {
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");

  const weddings = findWeddingsByCouple(session.coupleId);
  // Kaskada bazy (ON DELETE CASCADE od couples -> weddings -> wszystko pod
  // spodem) sama sprząta wiersze - ale NIE dotyka systemu plików, więc
  // zdjęcia trzeba skasować z dysku jawnie, PRZED skasowaniem konta.
  for (const wedding of weddings) {
    await removeAllPhotosForWedding(wedding.id);
  }

  deleteCouple(session.coupleId);
  await clearCoupleSession();
  redirect("/?accountDeleted=1");
}

export async function purgeGuestDataNowAction(formData: FormData): Promise<void> {
  const weddingId = String(formData.get("weddingId") ?? "");
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");

  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) {
    redirect("/admin");
  }

  await purgeWeddingGuestData(weddingId);
  revalidatePath("/admin/privacy");
  redirect(`/admin/privacy?purged=1`);
}
