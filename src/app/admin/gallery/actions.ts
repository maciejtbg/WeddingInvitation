"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { uploadPhoto, removePhoto, MAX_COVER_PHOTOS } from "@/lib/photoStorage";
import { setCoverPhoto, countCoverPhotos, findPhotoById } from "@/lib/db/photos";
import { findActiveDiscountCodeByCode } from "@/lib/db/discountCodes";
import { createPendingPurchase, createFreePurchaseFromDiscountCode } from "@/lib/db/photoPackPurchases";
import { PHOTOS_PER_PACK, PACK_CURRENCY, computeDiscountedAmount, isPaymentsEnabled } from "@/lib/photoPack";
import { getStripeClient } from "@/lib/stripeClient";
import { externalOriginFromHeaders } from "@/lib/externalOrigin";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireOwnedWedding(weddingId: string) {
  const session = await getCoupleSession();
  if (!session) redirect("/admin/login");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");
  return wedding;
}

export async function adminUploadPhotoAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/gallery?weddingId=${weddingId}&error=${encodeURIComponent("Wybierz plik ze zdjęciem")}`);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadPhoto({
      weddingId: wedding.id,
      uploadedByGuestId: null,
      originalBuffer: buffer,
      originalByteSize: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się wgrać zdjęcia";
    redirect(`/admin/gallery?weddingId=${weddingId}&error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/gallery");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/gallery?weddingId=${weddingId}`);
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const photoId = readString(formData, "photoId");
  const wedding = await requireOwnedWedding(weddingId);

  await removePhoto(wedding.id, photoId);
  revalidatePath("/admin/gallery");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/gallery?weddingId=${weddingId}`);
}

/** Wybór zdjęć na rotujące tło "powitalne" strony głównej (patrz
 * src/app/[slug]/page.tsx) - podzbiór zwykłej galerii, tylko zdjęcia
 * dodane przez samą parę (nie gości - to jej wybór wizerunkowy). */
export async function toggleCoverPhotoAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const photoId = readString(formData, "photoId");
  const wedding = await requireOwnedWedding(weddingId);

  const photo = findPhotoById(wedding.id, photoId);
  if (!photo || photo.uploadedByGuestId !== null) redirect(`/admin/gallery?weddingId=${weddingId}`);

  const isCurrentlyCover = photo.coverOrder !== null;
  if (!isCurrentlyCover && countCoverPhotos(wedding.id) >= MAX_COVER_PHOTOS) {
    redirect(
      `/admin/gallery?weddingId=${weddingId}&error=${encodeURIComponent(
        `Można wybrać maksymalnie ${MAX_COVER_PHOTOS} zdjęć powitalnych`
      )}`
    );
  }

  setCoverPhoto(wedding.id, photoId, !isCurrentlyCover);
  revalidatePath("/admin/gallery");
  revalidatePath(`/${wedding.slug}`);
  redirect(`/admin/gallery?weddingId=${weddingId}`);
}

/** Zakup pakietu +50 zdjęć (patrz src/lib/photoPack.ts) - opcjonalny kod
 * rabatowy. Rabat 100% (finalCents === 0) NIGDY nie tworzy sesji Stripe -
 * Stripe Checkout w trybie "payment" nie obsługuje kwoty 0, więc pakiet
 * jest po prostu od razu przyznawany (patrz createFreePurchaseFromDiscountCode).
 * W przeciwnym razie tworzymy sesję Checkout i przekierowujemy tam gościa -
 * FAKTYCZNE przyznanie zdjęć dzieje się dopiero po opłaceniu, przez webhook
 * (patrz app/api/stripe-webhook) albo stronę powrotną (ten sam gallery/page.tsx). */
export async function buyPhotoPackAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);
  const galleryUrl = `/admin/gallery?weddingId=${weddingId}`;

  // Wyłącznik całego obszaru płatnego (patrz isPaymentsEnabled) - UI go już
  // nie pokazuje, ale to sprawdzenie zostaje jako obrona w głąb na wypadek
  // bezpośredniego POST-a albo starej, zbuforowanej strony z widocznym
  // jeszcze formularzem.
  if (!isPaymentsEnabled()) {
    redirect(`${galleryUrl}&error=${encodeURIComponent("Zakup dodatkowego miejsca nie jest jeszcze dostępny.")}`);
  }

  const rawCode = readString(formData, "discountCode");
  const discountCode = rawCode ? findActiveDiscountCodeByCode(rawCode) : null;
  if (rawCode && !discountCode) {
    redirect(`${galleryUrl}&error=${encodeURIComponent("Nieprawidłowy lub nieaktywny kod rabatowy")}`);
  }

  const { finalCents, isFree } = computeDiscountedAmount(discountCode);

  if (isFree) {
    // discountCode na pewno nie jest null tutaj - isFree tylko gdy kod
    // istnieje i dał 100% rabatu (patrz computeDiscountedAmount).
    createFreePurchaseFromDiscountCode({
      weddingId: wedding.id,
      photosGranted: PHOTOS_PER_PACK,
      discountCodeId: discountCode!.id,
    });
    revalidatePath("/admin/gallery");
    redirect(`${galleryUrl}&purchase=free`);
  }

  const origin = await externalOriginFromHeaders();
  let session;
  try {
    session = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: PACK_CURRENCY,
            product_data: { name: `Dodatkowe ${PHOTOS_PER_PACK} zdjęć - galeria wesela` },
            unit_amount: finalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}${galleryUrl}&purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${galleryUrl}&purchase=cancelled`,
      metadata: { weddingId: wedding.id, photosGranted: String(PHOTOS_PER_PACK) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się rozpocząć płatności";
    redirect(`${galleryUrl}&error=${encodeURIComponent(message)}`);
  }
  if (!session.url) {
    redirect(`${galleryUrl}&error=${encodeURIComponent("Nie udało się rozpocząć płatności")}`);
  }

  createPendingPurchase({
    weddingId: wedding.id,
    stripeSessionId: session.id,
    photosGranted: PHOTOS_PER_PACK,
    amountPaidCents: finalCents,
    discountCodeId: discountCode?.id ?? null,
  });

  redirect(session.url);
}
