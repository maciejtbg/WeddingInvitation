"use server";

// Logowanie super-admina - osobne od logowania pary (patrz app/admin/actions.ts).
// Dane logowania NIE są w bazie (patrz src/lib/auth/platformAdmin.ts) - jeden
// operator, email/hash hasła w zmiennych środowiskowych.

import { redirect } from "next/navigation";
import { createPlatformAdminSession, clearPlatformAdminSession } from "@/lib/auth/platformAdmin";
import { verifyPassword } from "@/lib/auth/password";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/auth/rateLimit";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginPlatformAdminAction(formData: FormData): Promise<void> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const rateLimitKey = `super-admin-login:${email}`;

  const expectedEmail = (process.env.PLATFORM_ADMIN_EMAIL ?? "").toLowerCase();
  const expectedHash = process.env.PLATFORM_ADMIN_PASSWORD_HASH ?? "";

  if (!email || !expectedEmail || !expectedHash || isRateLimited(rateLimitKey)) {
    redirect("/super-admin/login?error=invalid");
  }

  // Zawsze porównujemy hasło (nawet gdy e-mail już się nie zgadza), żeby
  // czas odpowiedzi nie zdradzał, czy podany e-mail jest tym właściwym -
  // ten sam powód co przy zwykłym logowaniu pary, tu jeszcze bardziej
  // istotny (to konto z dostępem do kodów rabatowych/przychodów).
  const emailMatches = email === expectedEmail;
  const passwordOk = await verifyPassword(password, expectedHash);

  if (!emailMatches || !passwordOk) {
    recordFailedAttempt(rateLimitKey);
    redirect("/super-admin/login?error=invalid");
  }

  clearAttempts(rateLimitKey);
  await createPlatformAdminSession();
  redirect("/super-admin/discount-codes");
}

export async function logoutPlatformAdminAction(): Promise<void> {
  await clearPlatformAdminSession();
  redirect("/super-admin/login");
}
