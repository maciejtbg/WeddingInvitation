"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, PENDING_LOCALE_COOKIE } from "./locale";
import { getDictionary } from "./getDictionary";
import { getCachedDictionary } from "@/lib/db/translations";

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

/** Uruchamia tłumaczenie języka wykrytego automatycznie z kraju gościa
 * (patrz proxy.ts, countryLocale.ts) - wywoływane automatycznie przez
 * PendingLocaleBanner zaraz po wejściu na stronę, nie przez kliknięcie
 * gościa. Po sukcesie przełącza LOCALE_COOKIE na przetłumaczony język; jeśli
 * tłumaczenie się nie udało (np. padło darmowe API), zostajemy po prostu
 * przy angielskim, które i tak już jest ustawione. */
export async function applyPendingTranslationAction(formData: FormData): Promise<void> {
  const pending = formData.get("pendingLocale");
  const returnToRaw = formData.get("returnTo");
  const returnTo = typeof returnToRaw === "string" && returnToRaw ? returnToRaw : "/";

  if (typeof pending !== "string" || !pending) redirect(returnTo);

  await getDictionary(pending);

  const cookieStore = await cookies();
  // Gość mógł kliknąć "Zostań przy angielskim" (albo ręcznie zmienić
  // język) zanim to tłumaczenie w tle się skończyło - w takim wypadku nie
  // nadpisujemy jego wyboru spóźnionym wynikiem.
  const stillWaiting = cookieStore.get(PENDING_LOCALE_COOKIE)?.value === pending;
  if (stillWaiting) {
    cookieStore.delete(PENDING_LOCALE_COOKIE);
    if (getCachedDictionary(pending) !== null) {
      cookieStore.set(LOCALE_COOKIE, pending, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

/** Gość klika "Zostań przy angielskim" - po prostu chowamy pasek na stałe
 * (LOCALE_COOKIE zostaje "en", które i tak już tam jest). */
export async function cancelPendingTranslationAction(formData: FormData): Promise<void> {
  const returnToRaw = formData.get("returnTo");
  const returnTo = typeof returnToRaw === "string" && returnToRaw ? returnToRaw : "/";

  const cookieStore = await cookies();
  cookieStore.delete(PENDING_LOCALE_COOKIE);

  revalidatePath(returnTo);
  redirect(returnTo);
}
