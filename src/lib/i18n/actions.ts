"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "./locale";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = formData.get("locale");
  const returnToRaw = formData.get("returnTo");
  const returnTo = typeof returnToRaw === "string" && returnToRaw ? returnToRaw : "/";

  if (typeof locale === "string" && locale) {
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // rok - to trwały wybór, nie sesja
      sameSite: "lax",
    });
  }

  // Bez tego druga (i kolejna) zmiana języka na TEJ SAMEJ stronie w tej
  // samej wizycie potrafi nie odświeżyć widoku - klient Next.js ma
  // zbuforowany RSC payload tej ścieżki z poprzedniego wejścia i redirect()
  // do tego samego adresu sam z siebie nie wie, że cookie (a więc i wynik
  // renderu Server Component) się zmienił. Złapane empirycznie przy
  // testowaniu przełącznika języka dwa razy pod rząd bez przeładowania.
  revalidatePath(returnTo);
  redirect(returnTo);
}
