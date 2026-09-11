import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { guestGetSelf } from "@/lib/db/guests";
import { hasCurrentConsent } from "@/lib/db/consents";
import { guestFindMySeat } from "@/lib/db/tables";
import { listMessagesForGuest } from "@/lib/db/chat";
import { listLocations } from "@/lib/db/locations";
import { getLocationKind } from "@/lib/locationKinds";
import { listScheduleItems } from "@/lib/db/schedule";
import { listFaqItems } from "@/lib/db/faq";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import GuestSeatSection from "@/components/GuestSeatSection";
import LocationsMap from "@/components/LocationsMapLoader";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PendingLocaleBanner from "@/components/PendingLocaleBanner";
import { PollingRefresher } from "@/components/PollingRefresher";
import { HeroCoverPhotos } from "@/components/HeroCoverPhotos";
import { listCoverPhotos } from "@/lib/db/photos";
import { photoUrl } from "@/lib/photoStorage";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { t } from "@/lib/i18n/dictionary";
import { googleCalendarUrl } from "@/lib/calendarInvite";
import { toEmbedUrl } from "@/lib/videoEmbed";
import { formatWeddingDate, daysUntilWedding } from "@/lib/weddingCountdown";
import { submitRsvpAction, sendGuestMessageAction } from "./actions";

export default async function MyInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    saved?: string;
    seatSaved?: string;
    seatError?: string;
    requestSent?: string;
  }>;
}) {
  const { slug } = await params;
  const { saved, seatSaved, seatError, requestSent } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGuestSession();
  // Sesja gościa musi dotyczyć DOKŁADNIE tego wesela, którego adres jest
  // w URL-u - inaczej gość jednej pary nie mógłby przypadkiem podejrzeć
  // strony (czy tym bardziej danych) innej pary pod innym slugiem.
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/${wedding.slug}`);
  }
  // RODO - strona z formularzami/danymi gościa jest dostępna wyłącznie PO
  // zgodzie, nie tylko z ważną sesją - sama sesja powstaje wcześniej, w
  // route handlerze /z/[token] (patrz komentarz tam), więc bez tego
  // sprawdzenia dałoby się ominąć bramę /zgoda, wpisując ten adres ręcznie.
  if (!hasCurrentConsent("GUEST", session.guestId)) {
    redirect(`/${wedding.slug}/zgoda`);
  }

  const guest = guestGetSelf(session.guestId);
  if (!guest) redirect(`/${wedding.slug}`);

  const messages = listMessagesForGuest(guest.id);
  const theme = getTheme(wedding.theme);
  // Gość widzi WYŁĄCZNIE nazwę własnego stołu i sali - nigdy plan całej sali
  // ani listę innych gości przy stole (patrz src/lib/db/tables.ts).
  const mySeat = guestFindMySeat(guest.id);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const locations = listLocations(wedding.id);
  const scheduleItems = listScheduleItems(wedding.id);
  const faqItems = listFaqItems(wedding.id);
  const days = daysUntilWedding(wedding.weddingDate);
  const coverPhotos = listCoverPhotos(wedding.id);
  // Dopóki para nie wgra własnego zdjęcia powitalnego, pokazujemy gotowe
  // zdjęcie motywu (jeśli je ma, patrz src/lib/themes.ts) - spójnie ze
  // stroną publiczną (src/app/[slug]/page.tsx).
  const usingDefaultCoverPhoto = coverPhotos.length === 0 && !!theme.defaultCoverPhoto;
  const coverUrls =
    coverPhotos.length > 0
      ? coverPhotos.map((p) => photoUrl(wedding.id, p.fileName))
      : theme.defaultCoverPhoto
        ? [theme.defaultCoverPhoto.url]
        : [];
  const hasHeroPhoto = coverUrls.length > 0;

  return (
    <>
      <PendingLocaleBanner returnTo={`/${wedding.slug}/moje-zaproszenie`} dict={dict} />
      <div
        className="flex-1 font-[family-name:var(--wd-font-body)]"
        style={{ ...themeStyleVars(theme), background: theme.colors.background }}
      >
      <PollingRefresher />

      {/* Ten sam hero co na stronie publicznej (patrz src/app/[slug]/page.tsx)
          - te same zdjęcia powitalne pary, żeby wyglądało spójnie niezależnie
          od tego, czy gość trafił tu z linku, czy z publicznej strony. */}
      <div
        className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6 py-12 text-center"
        style={!hasHeroPhoto ? { background: theme.colors.background } : undefined}
      >
        {hasHeroPhoto && <HeroCoverPhotos urls={coverUrls} />}
        {usingDefaultCoverPhoto && theme.defaultCoverPhoto?.credit && (
          <p className="absolute bottom-1.5 right-2 z-10 text-[10px] text-white/50">
            {theme.defaultCoverPhoto.credit}
          </p>
        )}
        <div className="relative z-10 w-full max-w-xl">
          <LanguageSwitcher
            currentLocale={locale}
            returnTo={`/${wedding.slug}/moje-zaproszenie`}
            dict={dict}
          />
          <ThemeOrnament
            theme={theme.id}
            className="mx-auto mb-6 h-8 w-40"
            style={{ color: hasHeroPhoto ? "#ffffff" : theme.colors.accent }}
          />
          <p className={`mb-1 text-sm ${hasHeroPhoto ? "text-white/90" : "text-[var(--wd-muted)]"}`}>
            {t(dict.greeting, { name: guest.firstName })}
          </p>
          <h1
            className={`mb-2 wd-heading-font text-3xl font-semibold ${
              hasHeroPhoto ? "text-white drop-shadow-sm" : "text-[var(--wd-text)]"
            }`}
          >
            {wedding.partner1Name} &amp; {wedding.partner2Name}
          </h1>
          {wedding.weddingDate && (
            <div className="mb-2">
              <p className={`text-sm ${hasHeroPhoto ? "text-white/90" : "text-[var(--wd-text)]"}`}>
                {formatWeddingDate(wedding.weddingDate, locale)}
              </p>
              {days !== null && (
                <p
                  className={`wd-heading-font text-lg ${
                    hasHeroPhoto ? "text-white" : "text-[var(--wd-accent)]"
                  }`}
                >
                  {days === 0
                    ? dict.todayIsWedding
                    : days === 1
                      ? dict.oneDayUntilWedding
                      : t(dict.daysUntilWedding, { days: String(days) })}
                </p>
              )}
              <div
                className={`mt-1 flex items-center justify-center gap-3 text-xs ${
                  hasHeroPhoto ? "text-white/80" : ""
                }`}
              >
                <a
                  href={googleCalendarUrl({
                    partner1Name: wedding.partner1Name,
                    partner2Name: wedding.partner2Name,
                    weddingDate: wedding.weddingDate,
                    location: wedding.venueName,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    hasHeroPhoto
                      ? "underline hover:text-white"
                      : "text-[var(--wd-muted)] underline hover:text-[var(--wd-accent)]"
                  }
                >
                  {dict.addToCalendar}
                </a>
                <span className={hasHeroPhoto ? "text-white/40" : "text-[var(--wd-border)]"}>·</span>
                <a
                  href={`/${wedding.slug}/calendar`}
                  className={
                    hasHeroPhoto
                      ? "underline hover:text-white"
                      : "text-[var(--wd-muted)] underline hover:text-[var(--wd-accent)]"
                  }
                >
                  {dict.downloadIcs}
                </a>
              </div>
            </div>
          )}
          <p className={`mt-4 text-sm ${hasHeroPhoto ? "text-white/90" : ""}`}>
            <Link
              href={`/${wedding.slug}/moje-zaproszenie/muzyka`}
              className={hasHeroPhoto ? "underline hover:text-white" : "text-[var(--wd-accent)] underline"}
            >
              {dict.musicLinkLabel}
            </Link>
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl px-6 py-12">
        {saved && (
          <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            {dict.rsvpSavedThanks}
          </p>
        )}

        <GuestSeatSection
          weddingId={wedding.id}
          seatingMode={wedding.seatingMode}
          guestId={guest.id}
          rsvpStatus={guest.rsvpStatus}
          mySeat={mySeat}
          seatError={seatError}
          seatSaved={seatSaved === "1"}
          requestSent={requestSent === "1"}
          dict={dict}
        />

        <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--wd-text)]">{dict.rsvpQuestion}</h2>
          <form action={submitRsvpAction} className="space-y-4">
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--wd-border)] px-4 py-3 text-sm text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]">
                <input
                  type="radio"
                  name="rsvpStatus"
                  value="YES"
                  defaultChecked={guest.rsvpStatus === "YES"}
                  className="sr-only"
                />
                {dict.rsvpYes}
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--wd-border)] px-4 py-3 text-sm text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]">
                <input
                  type="radio"
                  name="rsvpStatus"
                  value="NO"
                  defaultChecked={guest.rsvpStatus === "NO"}
                  className="sr-only"
                />
                {dict.rsvpNo}
              </label>
            </div>

            {guest.allowPlusOne && (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--wd-text)]">
                  {dict.plusOneLabel}
                </label>
                <input
                  name="plusOneName"
                  defaultValue={guest.plusOneName ?? ""}
                  className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--wd-text)]">
                {dict.dietaryLabel}
              </label>
              <input
                name="dietaryNotes"
                defaultValue={guest.dietaryNotes ?? ""}
                className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-[var(--wd-accent)] px-4 py-2.5 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
            >
              {dict.saveRsvp}
            </button>
          </form>
        </div>

        {locations.length > 0 && (
          <div className="mb-8">
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

        {wedding.story && (
          <p className="mb-8 whitespace-pre-line text-center text-[var(--wd-text)]">
            {wedding.story}
          </p>
        )}

        {wedding.videoUrl && (
          <div className="mb-8">
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
          <p className="mb-8 whitespace-pre-line rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] px-4 py-3 text-sm text-[var(--wd-muted)]">
            {wedding.giftNote}
          </p>
        )}

        {scheduleItems.length > 0 && (
          <div className="mb-8">
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
          <div className="mb-8">
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

        <div className="rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--wd-text)]">
            {dict.questionForCouple}
          </h2>
          <div className="mb-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-[var(--wd-muted)]">{dict.noMessagesYet}</p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
                style={
                  message.sender === "GUEST"
                    ? { marginLeft: "auto", background: theme.colors.accent, color: theme.colors.accentText }
                    : { background: theme.colors.background, color: theme.colors.text }
                }
              >
                {message.body}
              </div>
            ))}
          </div>
          <form action={sendGuestMessageAction} className="flex gap-2">
            <input
              name="body"
              required
              placeholder={dict.messagePlaceholder}
              className="flex-1 rounded-full border border-[var(--wd-border)] bg-[var(--wd-bg)] px-4 py-2 text-sm text-[var(--wd-text)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--wd-accent)] px-5 py-2 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
            >
              {dict.send}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--wd-muted)]">
          <Link href="/polityka-prywatnosci" className="underline">
            {dict.privacyPolicyLinkLabel}
          </Link>
          {" · "}
          <Link href={`/${wedding.slug}/usun-dane`} className="underline">
            {dict.deleteMyDataLink}
          </Link>
        </p>
      </div>
      </div>
    </>
  );
}
