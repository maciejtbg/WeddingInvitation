import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { listPhotos } from "@/lib/db/photos";
import { MAX_PHOTOS_PER_WEDDING } from "@/lib/photoStorage";
import PhotoGallery from "@/components/PhotoGallery";
import { adminUploadPhotoAction, deletePhotoAction } from "./actions";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; error?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, error } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  const photos = listPhotos(wedding.id);
  const isFull = photos.length >= MAX_PHOTOS_PER_WEDDING;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Galeria</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Placeholder galerii zdjęć - zwykły dysk serwera, nie Cloudflare R2 (to
        wymaga Twoich danych dostępowych, patrz README). Świadomy limit{" "}
        {MAX_PHOTOS_PER_WEDDING} zdjęć na wesele, żeby nie zapchać hostingu -
        każde zdjęcie jest automatycznie zmniejszane i kompresowane po
        wgraniu, niezależnie od tego, ile ważyło na telefonie gościa. Widoczna
        dla wszystkich na Waszej publicznej stronie.
      </p>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">
            Zdjęcia ({photos.length}/{MAX_PHOTOS_PER_WEDDING})
          </h2>
        </div>
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}
        {isFull ? (
          <p className="mb-4 text-sm text-amber-700">
            Galeria jest pełna - usuń jakieś zdjęcie, żeby dodać nowe.
          </p>
        ) : (
          <form
            action={adminUploadPhotoAction}
            encType="multipart/form-data"
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="weddingId" value={wedding.id} />
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="text-sm text-zinc-700"
            />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Dodaj zdjęcie
            </button>
          </form>
        )}

        {photos.length === 0 ? (
          <p className="text-sm text-zinc-500">Galeria jest jeszcze pusta.</p>
        ) : (
          <PhotoGallery weddingId={wedding.id} photos={photos} deleteAction={deletePhotoAction} />
        )}
      </div>
    </div>
  );
}
