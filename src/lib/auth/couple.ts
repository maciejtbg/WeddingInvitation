// Sesja konta pary (panel admina). Logowanie na razie tylko email/hasło -
// logowanie Google/Facebook to kolejny krok opisany w README, bo wymaga
// zarejestrowania aplikacji OAuth u dostawcy i podania nam client id/secret.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, verifySession } from "./session";

const COOKIE_NAME = "couple_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dni

interface CoupleSessionPayload {
  coupleId: string;
  [key: string]: unknown;
}

export async function createCoupleSession(coupleId: string): Promise<void> {
  const token = await signSession({ coupleId }, SESSION_TTL_SECONDS);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getCoupleSession(): Promise<CoupleSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession<CoupleSessionPayload>(token);
  if (!payload?.coupleId) return null;
  return { coupleId: payload.coupleId };
}

/** Do użycia w Server Components stron panelu admina - przekierowuje na
 * ekran logowania, jeśli para nie jest zalogowana. */
export async function requireCoupleSessionOrRedirect(): Promise<CoupleSessionPayload> {
  const session = await getCoupleSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function clearCoupleSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
