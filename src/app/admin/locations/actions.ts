"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCoupleSession } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { createLocation, deleteLocation } from "@/lib/db/locations";
import { isLocationKind } from "@/lib/locationKinds";

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

export async function createLocationAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const wedding = await requireOwnedWedding(weddingId);

  const label = readString(formData, "label");
  const kindInput = readString(formData, "kind");
  const lat = Number.parseFloat(readString(formData, "lat"));
  const lng = Number.parseFloat(readString(formData, "lng"));

  if (!label || !isLocationKind(kindInput) || Number.isNaN(lat) || Number.isNaN(lng)) {
    // Najczęstsza przyczyna: para nie kliknęła punktu na mapie, więc
    // ukryte pola lat/lng zostały puste - patrz komentarz w
    // LocationMapPicker.tsx dlaczego to nie jest walidowane przez `required`.
    redirect(`/admin/locations?weddingId=${weddingId}&error=missing`);
  }

  createLocation({
    weddingId: wedding.id,
    kind: kindInput,
    label,
    address: readString(formData, "address") || null,
    lat,
    lng,
  });

  revalidatePath("/admin/locations");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/locations?weddingId=${weddingId}`);
}

export async function deleteLocationAction(formData: FormData): Promise<void> {
  const weddingId = readString(formData, "weddingId");
  const locationId = readString(formData, "locationId");
  const wedding = await requireOwnedWedding(weddingId);

  deleteLocation(wedding.id, locationId);
  revalidatePath("/admin/locations");
  revalidatePath(`/w/${wedding.slug}`);
  redirect(`/admin/locations?weddingId=${weddingId}`);
}
