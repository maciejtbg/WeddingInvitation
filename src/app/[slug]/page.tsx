import { notFound } from "next/navigation";
import Link from "next/link";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { getGuestSession } from "@/lib/auth/guest";
import { listLocations } from "@/lib/db/locations";
import { getLocationKind } from "@/lib/locationKinds";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import LocationsMap from "@/components/LocationsMapLoader";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PhotoGallery from "@/components/PhotoGallery";
import { listPhotos } from "@/lib/db/photos";
import { listScheduleItems } from "@/lib/db/schedule";
import { listFaqItems } from "@/lib/db/faq";
import { googleCalendarUrl } from "@/lib/calendarInvite";
import { toEmbedUrl } from "@/lib/videoEmbed";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { t } from "@/lib/i18n/dictionary";
import { formatWeddingDate, daysUntilWedding } from "@/lib/weddingCountdown";

export default async function WeddingPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { slug } = await params;
  const { deleted } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const guestSession = await getGuestSession();
  const isThisGuest = guestSession?.weddingId === wedding.id;
  const theme = getTheme(wedding.theme);
  const locations = listLocations(wedding.id);
  const photos = listPhotos(wedding.id);
  const scheduleItems = listScheduleItems(wedding.id);
  const faqItems = listFaqItems(wedding.id);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const days = daysUntilWedding(wedding.weddingDate);

  return (
    <div
      className="flex flex-1 flex-col items-center px-6 py-20 font-[family-name:var(--wd-font-body)]"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="w-full max-w-xl text-center">
        <LanguageSwitcher currentLocale={locale} returnTo={`/${wedding.slug}`} dict={dict} />
        {deleted === "1" && (
          <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            {dict.deleteMyDataDone}
          </p>
        )}
        {!wedding.publishedAt && (
          <p className="mb-6 inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-medium text-amber-800">
            {dict.draftBadge}
          </p>
        )}
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <h1 className="mb-4 wd-heading-font text-4xl font-semibold text-[var(--wd-text)]">
          {wedding.partner1Name} &amp; {wedding.partner2Name}
        </h1>
        {wedding.weddingDate && (
          <>
            <p className="mb-2 text-lg text-[var(--wd-text)]">
              {formatWeddingDate(wedding.weddingDate, locale)}
            </p>
            {days !== null && (
              <p className="mb-3 wd-heading-font text-xl text-[var(--wd-accent)]">
                {days === 0
                  ? dict.todayIsWedding
                  : days === 1
                    ? dict.oneDayUntilWedding
                    : t(dict.daysUntilWedding, { days: String(days) })}
              </p>
            )}
            <div className="mb-6 flex items-center justify-center gap-3 text-xs">
              <a
                href={googleCalendarUrl({
                  partner1Name: wedding.partner1Name,
                  partner2Name: wedding.partner2Name,
                  weddingDate: wedding.weddingDate,
                  location: wedding.venueName,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--wd-muted)] underline hover:text-[var(--wd-accent)]"
              >
                {dict.addToCalendar}
              </a>
              <span className="text-[var(--wd-border)]">·</span>
              <a
                href={`/${wedding.slug}/calendar`}
                className="text-[var(--wd-muted)] underline hover:text-[var(--wd-accent)]"
              >
                {dict.downloadIcs}
              </a>
            </div>
          </>
        )}
        {/* Stary, wolnotekstowy adres pokazujemy TYLKO dopóki para nie doda
            żadnego typowanego Miejsca (patrz sekcja "howToFindUs" niżej) -
            inaczej dwa opisy tego samego miejsca (jeden bez pinezki na
            mapie) wprowadzały w błąd, np. nieaktualne "Kraków" wpisane przy
            rejestracji wisiało obok prawdziwych, dodanych już Lokalizacji. */}
        {wedding.venueName && locations.length === 0 && (
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
        {wedding.videoUrl && (
          <div className="mx-auto mb-8 max-w-md">
            {(() => {
              const embedUrl = toEmbedUrl(wedding.videoUrl);
              return embedUrl ? (
                <div className="aspect-video overflow-hidden rounded-lg border border-[var(--wd-border)]">
                  <iframe
                    src={embedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Film"
                  />
                </div>
              ) : (
                <a
                  href={wedding.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--wd-accent)] underline"
                >
                  🎬 Zobacz film
                </a>
              );
            })()}
          </div>
        )}
        {wedding.giftNote && (
          <p className="mx-auto mb-8 max-w-md whitespace-pre-line rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] px-4 py-3 text-sm text-[var(--wd-muted)]">
            {wedding.giftNote}
          </p>
        )}

        {locations.length > 0 && (
          <div className="mb-8 text-left">
            <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
              {dict.howToFindUs}
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

        {photos.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
              {dict.galleryTitle}
            </h2>
            <PhotoGallery weddingId={wedding.id} photos={photos} />
          </div>
        )}

        {scheduleItems.length > 0 && (
          <div className="mb-8 text-left">
            <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
              {dict.scheduleTitle}
            </h2>
            <div className="space-y-3 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-4">
              {scheduleItems.map((item, index) => {
                const prevDay = index > 0 ? scheduleItems[index - 1].dayLabel : undefined;
                const showDayHeader = item.dayLabel && item.dayLabel !== prevDay;
                return (
                  <div key={item.id}>
                    {showDayHeader && (
                      <p className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--wd-accent)]">
                        {item.dayLabel}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <span className="w-16 shrink-0 text-sm font-medium text-[var(--wd-accent)]">
                        {item.timeLabel}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[var(--wd-text)]">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-[var(--wd-muted)]">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {faqItems.length > 0 && (
          <div className="mb-8 text-left">
            <h2 className="mb-3 text-center wd-heading-font text-xl text-[var(--wd-text)]">
              {dict.faqTitle}
            </h2>
            <div className="space-y-2">
              {faqItems.map((item) => (
                <details
                  key={item.id}
                  className="rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-3"
                >
                  <summary className="cursor-pointer text-sm font-medium text-[var(--wd-text)]">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-[var(--wd-muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {isThisGuest ? (
          <Link
            href={`/${wedding.slug}/moje-zaproszenie`}
            className="inline-block rounded-full bg-[var(--wd-accent)] px-6 py-3 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
          >
            {dict.goToMyInvite}
          </Link>
        ) : (
          <p className="text-sm text-[var(--wd-muted)]">{dict.gotPersonalLink}</p>
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
