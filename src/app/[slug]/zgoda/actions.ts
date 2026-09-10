"use server";

import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { recordConsent } from "@/lib/db/consents";

export async function acceptGuestConsentAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "");
  const wedding = findWeddingBySlug(slug);
  if (!wedding) redirect("/");

  const session = await getGuestSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/${wedding.slug}`);
  }

  if (formData.get("consent") !== "on") {
    redirect(`/${wedding.slug}/zgoda?error=required`);
  }

  recordConsent("GUEST", session.guestId);
  redirect(`/${wedding.slug}/moje-zaproszenie`);
}
