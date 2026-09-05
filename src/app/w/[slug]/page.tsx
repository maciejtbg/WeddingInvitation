import { notFound } from "next/navigation";
import Link from "next/link";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { getGuestSession } from "@/lib/auth/guest";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function WeddingPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const guestSession = await getGuestSession();
  const isThisGuest = guestSession?.weddingId === wedding.id;

  return (
    <div className="flex flex-1 flex-col items-center bg-rose-50 px-6 py-20">
      <div className="w-full max-w-xl text-center">
        {!wedding.publishedAt && (
          <p className="mb-6 inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-medium text-amber-800">
            Wersja robocza - strona jeszcze nieopublikowana
          </p>
        )}
        <h1 className="mb-4 text-4xl font-semibold text-zinc-900">
          {wedding.partner1Name} &amp; {wedding.partner2Name}
        </h1>
        {wedding.weddingDate && (
          <p className="mb-2 text-lg text-zinc-700">{formatDate(wedding.weddingDate)}</p>
        )}
        {wedding.venueName && (
          <p className="mb-6 text-zinc-600">
            {wedding.venueName}
            {wedding.venueAddress ? `, ${wedding.venueAddress}` : ""}
          </p>
        )}
        {wedding.story && (
          <p className="mx-auto mb-8 max-w-md whitespace-pre-line text-zinc-700">
            {wedding.story}
          </p>
        )}

        {isThisGuest ? (
          <Link
            href={`/w/${wedding.slug}/moje-zaproszenie`}
            className="inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Przejdź do mojego zaproszenia
          </Link>
        ) : (
          <p className="text-sm text-zinc-500">
            Dostaliście od nas link z osobistym zaproszeniem? Otwórzcie go, żeby
            potwierdzić przybycie.
          </p>
        )}
      </div>
    </div>
  );
}
