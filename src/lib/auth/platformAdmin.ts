// Sesja super-admina (Ciebie, operatora tej aplikacji) - CAŁKOWICIE osobna
// rola od konta pary (couple.ts) i od gościa (guest.ts). Nie ma tabeli
// "administratorzy" w bazie - to jeden, jedyny operator, więc dane logowania
// mieszkają w zmiennych środowiskowych (PLATFORM_ADMIN_EMAIL,
// PLATFORM_ADMIN_PASSWORD_HASH - hash, nigdy hasło jawne, patrz
// scripts/hash-password.mjs), nie w bazie danych - prościej i bezpieczniej
// niż budować pełny system kont dla jednej osoby.
//
// UWAGA: to daje dostęp do generowania kodów rabatowych i podglądu wszystkich
// wesel/płatności - sesja musi być jasno odróżnialna od sesji pary, żeby
// żadna strona panelu pary nie mogła jej pomylić z "jestem zalogowany".

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, verifySession } from "./session";

const COOKIE_NAME = "platform_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dni - krótsza niż sesja pary (30 dni), bo to konto z szerszym dostępem

interface PlatformAdminSessionPayload {
  isPlatformAdmin: true;
  [key: string]: unknown;
}

export async function createPlatformAdminSession(): Promise<void> {
  const token = await signSession({ isPlatformAdmin: true }, SESSION_TTL_SECONDS);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getPlatformAdminSession(): Promise<PlatformAdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession<PlatformAdminSessionPayload>(token);
  if (payload?.isPlatformAdmin !== true) return null;
  return { isPlatformAdmin: true };
}

export async function requirePlatformAdminSessionOrRedirect(): Promise<PlatformAdminSessionPayload> {
  const session = await getPlatformAdminSession();
  if (!session) {
    redirect("/super-admin/login");
  }
  return session;
}

export async function clearPlatformAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
