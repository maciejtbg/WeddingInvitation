// Siatka miniaturek galerii - używana zarówno w panelu pary
// (/admin/gallery, z przyciskiem usuwania) jak i na stronie publicznej
// (bez usuwania). Zwykły Server Component - zdjęcia są już skompresowane
// przy wgrywaniu (patrz src/lib/photoStorage.ts), więc to po prostu <img>
// bez dodatkowej logiki.

import type { WeddingPhoto } from "@/lib/db/types";
import { photoUrl } from "@/lib/photoStorage";

interface Props {
  weddingId: string;
  photos: WeddingPhoto[];
  /** Podaj tylko w panelu pary - obecność tej propsy włącza przycisk
   * usuwania na każdej miniaturce. */
  deleteAction?: (formData: FormData) => Promise<void>;
}

export default function PhotoGallery({ weddingId, photos, deleteAction }: Props) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pliki
              wgrywane w runtime spoza build-time, next/image ich nie ogarnie */}
          <img
            src={photoUrl(weddingId, photo.fileName)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {deleteAction && (
            <form action={deleteAction} className="absolute right-1 top-1">
              <input type="hidden" name="weddingId" value={weddingId} />
              <input type="hidden" name="photoId" value={photo.id} />
              <button
                type="submit"
                aria-label="Usuń zdjęcie"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
              >
                ✕
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
