"use server";

// Logowanie gościa krótkim, ręcznie wpisywalnym kodem - alternatywa dla
// linku/QR (patrz src/lib/db/guests.ts, findGuestByShortCodeForLogin).

import { redirect } from "next/navigation";
import { findGuestByShortCodeForLogin } from "@/lib/db/guests";
import { findWeddingById } from "@/lib/db/weddings";
import { createGuestSession } from "@/lib/auth/guest";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginByShortCodeAction(formData: FormData): Promise<void> {
  const code = readString(formData, "code");
  const guest = code ? findGuestByShortCodeForLogin(code) : null;
  if (!guest) {
    redirect("/kod?error=invalid");
  }

  const wedding = findWeddingById(guest.weddingId);
  if (!wedding) {
    redirect("/kod?error=invalid");
  }

  await createGuestSession(guest.id, guest.weddingId);
  redirect(`/w/${wedding.slug}/moje-zaproszenie`);
}
