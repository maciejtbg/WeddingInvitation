"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminSessionOrRedirect } from "@/lib/auth/platformAdmin";
import {
  adminCreateDiscountCode,
  adminDeleteDiscountCode,
  normalizeDiscountCode,
} from "@/lib/db/discountCodes";
import type { DiscountType } from "@/lib/db/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// Bez znaków łatwych do pomylenia (0/O, 1/I) - ten sam alfabet co krótkie
// kody dostępu gości (patrz newGuestShortCode w src/lib/db/client.ts),
// żeby autogenerowany kod dało się bezpiecznie podyktować/przepisać.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export async function createDiscountCodeAction(formData: FormData): Promise<void> {
  await requirePlatformAdminSessionOrRedirect();

  const rawCode = readString(formData, "code");
  const discountTypeRaw = readString(formData, "discountType");
  const discountType: DiscountType = discountTypeRaw === "FIXED" ? "FIXED" : "PERCENT";
  const discountValueRaw = Number.parseFloat(readString(formData, "discountValue"));
  const maxUsesRaw = readString(formData, "maxUses");
  const validFromRaw = readString(formData, "validFrom");
  const validUntilRaw = readString(formData, "validUntil");

  if (!Number.isFinite(discountValueRaw) || discountValueRaw <= 0) {
    redirect("/super-admin/discount-codes?error=" + encodeURIComponent("Podaj poprawną wartość rabatu."));
  }
  if (discountType === "PERCENT" && discountValueRaw > 100) {
    redirect("/super-admin/discount-codes?error=" + encodeURIComponent("Rabat procentowy nie może przekraczać 100%."));
  }

  const maxUses = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null;
  if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses <= 0)) {
    redirect("/super-admin/discount-codes?error=" + encodeURIComponent("Liczba użyć musi być dodatnią liczbą całkowitą."));
  }

  // Data z <input type="date"> to samo YYYY-MM-DD - datetime('now') w SQLite
  // porównuje się z tym leksykograficznie poprawnie, ale "do końca dnia"
  // wymaga dopisania czasu 23:59:59, inaczej ważność kończyłaby się o
  // północy PIERWSZEGO dnia zamiast po CAŁYM ostatnim dniu.
  const validFrom = validFromRaw || null;
  const validUntil = validUntilRaw ? `${validUntilRaw}T23:59:59` : null;

  const code = normalizeDiscountCode(rawCode || randomCode());
  if (!/^[A-Z0-9]{3,20}$/.test(code)) {
    redirect(
      "/super-admin/discount-codes?error=" +
        encodeURIComponent("Kod może zawierać tylko litery i cyfry (3-20 znaków).")
    );
  }

  try {
    adminCreateDiscountCode({
      code,
      discountType,
      discountValue: discountValueRaw,
      maxUses,
      validFrom,
      validUntil,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const friendly = message.includes("UNIQUE")
      ? "Taki kod już istnieje - wybierz inny."
      : "Nie udało się utworzyć kodu.";
    redirect("/super-admin/discount-codes?error=" + encodeURIComponent(friendly));
  }

  revalidatePath("/super-admin/discount-codes");
  redirect("/super-admin/discount-codes?created=1");
}

export async function deleteDiscountCodeAction(formData: FormData): Promise<void> {
  await requirePlatformAdminSessionOrRedirect();
  const id = readString(formData, "id");
  adminDeleteDiscountCode(id);
  revalidatePath("/super-admin/discount-codes");
  redirect("/super-admin/discount-codes");
}
