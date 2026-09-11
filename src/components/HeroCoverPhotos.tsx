"use client";

// Pełnoekranowe, rotujące tło zdjęciowe pod hero stronie głównej
// zaproszenia (patrz src/app/[slug]/page.tsx) - zdjęcia wybrane przez parę
// w /admin/gallery (patrz src/lib/db/photos.ts, MAX_COVER_PHOTOS). Zwykłe
// <img> z przenikaniem (opacity), nie karuzela z bibliotek - to tylko tło,
// nie interaktywny komponent, nie ma potrzeby przeciągania/strzałek.

import { useEffect, useState } from "react";

export function HeroCoverPhotos({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (urls.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % urls.length), 6000);
    return () => clearInterval(id);
  }, [urls.length]);

  if (urls.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {urls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- pliki wgrywane w runtime, next/image ich nie ogarnie (patrz PhotoGallery.tsx)
        <img
          key={url}
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
    </div>
  );
}
