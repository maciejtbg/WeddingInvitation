import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { guestGetSelf } from "@/lib/db/guests";
import { hasCurrentConsent } from "@/lib/db/consents";
import { guestFindMySeat } from "@/lib/db/tables";
import { listMessagesForGuest } from "@/lib/db/chat";
import { listPhotos } from "@/lib/db/photos";
import { MAX_PHOTOS_PER_WEDDING } from "@/lib/photoStorage";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import GuestSeatSection from "@/components/GuestSeatSection";
import PhotoGallery from "@/components/PhotoGallery";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { PollingRefresher } from "@/components/PollingRefresher";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { t } from "@/lib/i18n/dictionary";
import { submitRsvpAction, sendGuestMessageAction, guestUploadPhotoAction } from "./actions";

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
    photoSaved?: string;
    photoError?: string;
  }>;
}) {
  const { slug } = await params;
  const { saved, seatSaved, seatError, requestSent, photoSaved, photoError } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGuestSession();
  // Sesja gościa musi dotyczyć DOKŁADNIE tego wesela, którego adres jest
  // w URL-u - inaczej gość jednej pary nie mógłby przypadkiem podejrzeć
  // strony (czy tym bardziej danych) innej pary pod innym slugiem.
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/w/${wedding.slug}`);
  }
  // RODO - strona z formularzami/danymi gościa jest dostępna wyłącznie PO
  // zgodzie, nie tylko z ważną sesją - sama sesja powstaje wcześniej, w
  // route handlerze /z/[token] (patrz komentarz tam), więc bez tego
  // sprawdzenia dałoby się ominąć bramę /zgoda, wpisując ten adres ręcznie.
  if (!hasCurrentConsent("GUEST", session.guestId)) {
    redirect(`/w/${wedding.slug}/zgoda`);
  }

  const guest = guestGetSelf(session.guestId);
  if (!guest) redirect(`/w/${wedding.slug}`);

  const messages = listMessagesForGuest(guest.id);
  const theme = getTheme(wedding.theme);
  // Gość widzi WYŁĄCZNIE nazwę własnego stołu i sali - nigdy plan całej sali
  // ani listę innych gości przy stole (patrz src/lib/db/tables.ts).
  const mySeat = guestFindMySeat(guest.id);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const photos = listPhotos(wedding.id);
  const galleryFull = photos.length >= MAX_PHOTOS_PER_WEDDING;

  return (
    <div
      className="flex-1 px-6 py-12"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="mx-auto w-full max-w-xl">
        <PollingRefresher />
        <LanguageSwitcher
          currentLocale={locale}
          returnTo={`/w/${wedding.slug}/moje-zaproszenie`}
          dict={dict}
        />
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <p className="mb-1 text-center text-sm text-[var(--wd-muted)]">
          {t(dict.greeting, { name: guest.firstName })}
        </p>
        <h1 className="mb-2 text-center font-serif text-3xl font-semibold text-[var(--wd-text)]">
          {wedding.partner1Name} &amp; {wedding.partner2Name}
        </h1>
        <p className="mb-8 text-center text-sm">
          <Link
            href={`/w/${wedding.slug}/moje-zaproszenie/muzyka`}
            className="text-[var(--wd-accent)] underline"
          >
            {dict.musicLinkLabel}
          </Link>
        </p>

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

        <div className="mt-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--wd-text)]">{dict.galleryTitle}</h2>
          {photoSaved && (
            <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {dict.photoUploaded}
            </p>
          )}
          {photoError && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{photoError}</p>
          )}
          {photos.length > 0 && (
            <div className="mb-4">
              <PhotoGallery weddingId={wedding.id} photos={photos} />
            </div>
          )}
          {galleryFull ? (
            <p className="text-sm text-[var(--wd-muted)]">{dict.galleryFull}</p>
          ) : (
            <form
              action={guestUploadPhotoAction}
              encType="multipart/form-data"
              className="flex flex-wrap items-center gap-2"
            >
              <input
                type="file"
                name="photo"
                accept="image/*"
                required
                className="text-sm text-[var(--wd-text)]"
              />
              <button
                type="submit"
                className="rounded-full bg-[var(--wd-accent)] px-4 py-1.5 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
              >
                {dict.addPhoto}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--wd-muted)]">
          <Link href="/polityka-prywatnosci" className="underline">
            {dict.privacyPolicyLinkLabel}
          </Link>
          {" · "}
          <Link href={`/w/${wedding.slug}/usun-dane`} className="underline">
            {dict.deleteMyDataLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
