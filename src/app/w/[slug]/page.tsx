import { notFound } from "next/navigation";
import Link from "next/link";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { getGuestSession } from "@/lib/auth/guest";
import { listLocations } from "@/lib/db/locations";
import { getLocationKind } from "@/lib/locationKinds";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import LocationsMap from "@/components/LocationsMapLoader";

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
  const theme = getTheme(wedding.theme);
  const locations = listLocations(wedding.id);

  return (
    <div
      className="flex flex-1 flex-col items-center px-6 py-20"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="w-full max-w-xl text-center">
        {!wedding.publishedAt && (
          <p className="mb-6 inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-medium text-amber-800">
            Wersja robocza - strona jeszcze nieopublikowana
          </p>
        )}
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <h1 className="mb-4 font-serif text-4xl font-semibold text-[var(--wd-text)]">
          {wedding.partner1Name} &amp; {wedding.partner2Name}
        </h1>
        {wedding.weddingDate && (
          <p className="mb-2 text-lg text-[var(--wd-text)]">{formatDate(wedding.weddingDate)}</p>
        )}
        {wedding.venueName && (
          <p className="mb-6 text-[var(--wd-muted)]">
            {wedding.venueName}
            {wedding.venueAddress ? `, ${wedding.venueAddress}` : ""}
          </p>
        )}
        {wedding.story && (
          <p className="mx-auto mb-8 max-w-md whitespace-pre-line text-[var(--wd-text)]">
            {wedding.story}
          </p>
        )}
        {wedding.giftNote && (
          <p className="mx-auto mb-8 max-w-md whitespace-pre-line rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] px-4 py-3 text-sm text-[var(--wd-muted)]">
            {wedding.giftNote}
          </p>
        )}

        {locations.length > 0 && (
          <div className="mb-8 text-left">
            <h2 className="mb-3 text-center font-serif text-xl text-[var(--wd-text)]">
              Jak do nas trafić
            </h2>
            <LocationsMap locations={locations} />
            <div className="mt-3 space-y-1">
              {locations.map((loc) => {
                const kind = getLocationKind(loc.kind);
                return (
                  <p key={loc.id} className="text-xs text-[var(--wd-muted)]">
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                      style={{ background: kind.color }}
                    />
                    <strong className="text-[var(--wd-text)]">{loc.label}</strong>
                    {" - "}
                    {kind.label}
                    {loc.address ? `, ${loc.address}` : ""}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {isThisGuest ? (
          <Link
            href={`/w/${wedding.slug}/moje-zaproszenie`}
            className="inline-block rounded-full bg-[var(--wd-accent)] px-6 py-3 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
          >
            Przejdź do mojego zaproszenia
          </Link>
        ) : (
          <p className="text-sm text-[var(--wd-muted)]">
            Dostaliście od nas link z osobistym zaproszeniem? Otwórzcie go, żeby
            potwierdzić przybycie.
          </p>
        )}
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mt-10 h-8 w-40 rotate-180"
          style={{ color: theme.colors.accent }}
        />
      </div>
    </div>
  );
}
