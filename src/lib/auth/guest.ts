// Sesja gościa. Powstaje wyłącznie po wejściu na unikalny, niemożliwy do
// odgadnięcia link z tokenem (patrz app/z/[token]/route.ts). Od tego momentu
// gość korzysta ze strony przez zwykłe, podpisane ciasteczko - nie musi
// nosić tokenu w adresie przy każdej wizycie.
//
// To jest niezależny system od sesji pary (couple.ts) - te dwa nigdy się
// nie mieszają, więc konto gościa nie ma prawa uzyskać niczego, co ma
// konto pary, i odwrotnie.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, verifySession } from "./session";

const COOKIE_NAME = "guest_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // rok - zaproszenie ma działać długo

interface GuestSessionPayload {
  guestId: string;
  weddingId: string;
  [key: string]: unknown;
}

export async function createGuestSession(guestId: string, weddingId: string): Promise<void> {
  const token = await signSession({ guestId, weddingId }, SESSION_TTL_SECONDS);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getGuestSession(): Promise<GuestSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession<GuestSessionPayload>(token);
  if (!payload?.guestId || !payload?.weddingId) return null;
  return { guestId: payload.guestId, weddingId: payload.weddingId };
}

/** Do użycia w Server Components strony gościa - przekierowuje na stronę
 * główną wesela, jeśli nie ma ważnej sesji (np. gość jeszcze nie kliknął
 * swojego linku, albo wpisał adres ręcznie). */
export async function requireGuestSessionOrRedirect(
  fallbackSlug: string
): Promise<GuestSessionPayload> {
  const session = await getGuestSession();
  if (!session) {
    redirect(`/${fallbackSlug}`);
  }
  return session;
}

export async function clearGuestSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
