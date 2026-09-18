import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getGroupSession } from "@/lib/auth/groupGuest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { adminFindGroupById } from "@/lib/db/groups";
import { groupListMemberViews } from "@/lib/db/guests";
import { hasCurrentConsent } from "@/lib/db/consents";
import { guestFindMySeat, guestListAvailableSeats } from "@/lib/db/tables";
import { listLocations } from "@/lib/db/locations";
import { listScheduleItems } from "@/lib/db/schedule";
import { listFaqItems } from "@/lib/db/faq";
import { listMenuItems } from "@/lib/db/menu";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { allowsGuestSelfSelect } from "@/lib/seatingModes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import WeddingInfoSections from "@/components/WeddingInfoSections";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PendingLocaleBanner from "@/components/PendingLocaleBanner";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { t } from "@/lib/i18n/dictionary";
import { googleCalendarUrl } from "@/lib/calendarInvite";
import { formatWeddingDate, daysUntilWedding } from "@/lib/weddingCountdown";
import { groupAcceptConsentAction, groupSubmitRsvpAction, groupAssignSeatsAction } from "./actions";

export default async function GroupInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; seatSaved?: string; seatError?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { saved, seatSaved, seatError, error } = await searchParams;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGroupSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/${wedding.slug}`);
  }

  const group = adminFindGroupById(wedding.id, session.groupId);
  if (!group) redirect(`/${wedding.slug}`);

  const members = groupListMemberViews(wedding.id, group.id);
  if (members.length === 0) redirect(`/${wedding.slug}`);

  const theme = getTheme(wedding.theme);
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const days = daysUntilWedding(wedding.weddingDate);

  const header = (
    <div
      className="flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{ background: theme.colors.background }}
    >
      <LanguageSwitcher currentLocale={locale} returnTo={`/${wedding.slug}/grupa`} dict={dict} />
      <ThemeOrnament theme={theme.id} className="mx-auto mb-6 h-8 w-40" style={{ color: theme.colors.accent }} />
      <p className="mb-1 text-sm text-[var(--wd-muted)]">{t(dict.greeting, { name: group.name })}</p>
      <h1 className="mb-2 wd-heading-font text-3xl font-semibold text-[var(--wd-text)]">
        {wedding.partner1Name} &amp; {wedding.partner2Name}
      </h1>
      {wedding.weddingDate && (
        <div className="mb-2">
          <p className="text-sm text-[var(--wd-text)]">{formatWeddingDate(wedding.weddingDate, locale)}</p>
          {days !== null && (
            <p className="wd-heading-font text-lg text-[var(--wd-accent)]">
              {days === 0
                ? dict.todayIsWedding
                : days === 1
                  ? dict.oneDayUntilWedding
                  : t(dict.daysUntilWedding, { days: String(days) })}
            </p>
          )}
          <a
            href={googleCalendarUrl({
              partner1Name: wedding.partner1Name,
              partner2Name: wedding.partner2Name,
              weddingDate: wedding.weddingDate,
              location: wedding.venueName,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-[var(--wd-muted)] underline hover:text-[var(--wd-accent)]"
          >
            {dict.addToCalendar}
          </a>
        </div>
      )}
    </div>
  );

  const unconsented = members.filter((m) => !hasCurrentConsent("GUEST", m.id));

  if (unconsented.length > 0) {
    return (
      <>
        <PendingLocaleBanner returnTo={`/${wedding.slug}/grupa`} dict={dict} />
        <div className="flex-1 font-[family-name:var(--wd-font-body)]" style={{ ...themeStyleVars(theme), background: theme.colors.background }}>
          {header}
          <div className="mx-auto w-full max-w-xl px-6 py-8">
            <div className="rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
              <h2 className="mb-3 text-lg font-medium text-[var(--wd-text)]">{dict.groupConsentTitle}</h2>
              <p className="mb-4 text-sm text-[var(--wd-muted)]">{dict.groupConsentIntro}</p>
              <ul className="mb-4 list-inside list-disc text-sm text-[var(--wd-text)]">
                {members.map((m) => (
                  <li key={m.id}>
                    {m.firstName} {m.lastName ?? ""}
                  </li>
                ))}
              </ul>
              {error === "required" && (
                <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
                  {dict.groupConsentRequiredError}
                </p>
              )}
              <form action={groupAcceptConsentAction} className="space-y-4">
                <input type="hidden" name="slug" value={wedding.slug} />
                <label className="flex items-start gap-2 text-sm text-[var(--wd-text)]">
                  <input type="checkbox" name="consent" className="mt-1" />
                  {dict.groupConsentAgree}
                </label>
                <p className="text-xs text-[var(--wd-muted)]">
                  <Link href="/polityka-prywatnosci" className="underline">
                    {dict.privacyPolicyLinkLabel}
                  </Link>
                </p>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--wd-accent)] px-4 py-2.5 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
                >
                  {dict.groupConsentAgreeButton}
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  const locations = listLocations(wedding.id);
  const scheduleItems = listScheduleItems(wedding.id);
  const faqItems = listFaqItems(wedding.id);
  const menuItems = listMenuItems(wedding.id);

  const showSeating = wedding.allowGroupSeating && allowsGuestSelfSelect(wedding.seatingMode);
  const yesMembers = members.filter((m) => m.rsvpStatus === "YES");
  const seatDataByMember = showSeating
    ? yesMembers.map((m) => ({
        member: m,
        mySeat: guestFindMySeat(m.id),
        tables: guestListAvailableSeats(wedding.id, m.id),
      }))
    : [];

  return (
    <>
      <PendingLocaleBanner returnTo={`/${wedding.slug}/grupa`} dict={dict} />
      <div className="flex-1 font-[family-name:var(--wd-font-body)]" style={{ ...themeStyleVars(theme), background: theme.colors.background }}>
        {header}

        <div className="mx-auto w-full max-w-xl px-6 py-12">
          <p className="mb-8 text-center text-sm text-[var(--wd-muted)]">{dict.groupPageIntro}</p>

          {saved === "1" && (
            <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              {dict.groupRsvpSavedThanks}
            </p>
          )}
          {seatSaved === "1" && (
            <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              {dict.groupSeatsSavedThanks}
            </p>
          )}
          {seatError === "taken" && (
            <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {dict.seatTakenError}
            </p>
          )}

          <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
            <h2 className="mb-1 text-lg font-medium text-[var(--wd-text)]">{dict.groupRsvpSectionTitle}</h2>
            <p className="mb-4 text-xs uppercase tracking-wide text-[var(--wd-muted)]">
              {dict.groupMembersTitle}
            </p>
            <form action={groupSubmitRsvpAction} className="space-y-6">
              <input type="hidden" name="slug" value={wedding.slug} />
              {members.map((member) => (
                <div key={member.id} className="border-t border-[var(--wd-border)] pt-4 first:border-t-0 first:pt-0">
                  <p className="mb-2 text-sm font-medium text-[var(--wd-text)]">
                    {member.firstName} {member.lastName ?? ""}
                  </p>
                  <div className="mb-3 flex gap-3">
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--wd-border)] px-4 py-2.5 text-sm text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]">
                      <input
                        type="radio"
                        name={`rsvp_${member.id}`}
                        value="YES"
                        defaultChecked={member.rsvpStatus === "YES"}
                        className="sr-only"
                      />
                      {dict.rsvpYes}
                    </label>
                    <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--wd-border)] px-4 py-2.5 text-sm text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]">
                      <input
                        type="radio"
                        name={`rsvp_${member.id}`}
                        value="NO"
                        defaultChecked={member.rsvpStatus === "NO"}
                        className="sr-only"
                      />
                      {dict.rsvpNo}
                    </label>
                  </div>
                  {member.allowPlusOne && (
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-medium text-[var(--wd-text)]">
                        {dict.plusOneLabel}
                      </label>
                      <input
                        name={`plusOne_${member.id}`}
                        defaultValue={member.plusOneName ?? ""}
                        className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--wd-text)]">
                      {dict.dietaryLabel}
                    </label>
                    <input
                      name={`dietary_${member.id}`}
                      defaultValue={member.dietaryNotes ?? ""}
                      className="w-full rounded-md border border-[var(--wd-border)] bg-[var(--wd-bg)] px-3 py-2 text-sm text-[var(--wd-text)]"
                    />
                  </div>
                </div>
              ))}
              <button
                type="submit"
                className="w-full rounded-full bg-[var(--wd-accent)] px-4 py-2.5 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
              >
                {dict.groupSaveAllButton}
              </button>
            </form>
          </div>

          {showSeating && (
            <div className="mb-8 rounded-lg border border-[var(--wd-border)] bg-[var(--wd-surface)] p-6">
              <h2 className="mb-1 text-lg font-medium text-[var(--wd-text)]">{dict.groupSeatSectionTitle}</h2>
              <p className="mb-4 text-sm text-[var(--wd-muted)]">{dict.groupSeatIntro}</p>
              {yesMembers.length === 0 ? (
                <p className="text-sm text-[var(--wd-muted)]">{dict.groupConfirmRsvpFirstForSeat}</p>
              ) : (
                <form action={groupAssignSeatsAction} className="space-y-6">
                  <input type="hidden" name="slug" value={wedding.slug} />
                  {seatDataByMember.map(({ member, mySeat, tables }) => (
                    <div key={member.id} className="border-t border-[var(--wd-border)] pt-4 first:border-t-0 first:pt-0">
                      <p className="mb-1.5 text-sm font-medium text-[var(--wd-text)]">
                        {member.firstName} {member.lastName ?? ""}
                        {mySeat && (
                          <span className="ml-2 font-normal text-[var(--wd-muted)]">
                            {t(dict.currentlyAt, { table: mySeat.tableLabel, room: mySeat.roomName })}
                          </span>
                        )}
                      </p>
                      <div className="space-y-2">
                        {tables.map((tbl) => (
                          <div key={tbl.id}>
                            <p className="mb-1 text-xs text-[var(--wd-muted)]">
                              {tbl.label} ({tbl.roomName})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {tbl.seats.map((seat) => {
                                const taken = !!seat.occupiedByFirstName && !seat.isMe;
                                return (
                                  <label
                                    key={seat.seatIndex}
                                    className={`rounded-full border px-3 py-1 text-xs ${
                                      taken
                                        ? "cursor-not-allowed border-[var(--wd-border)] text-[var(--wd-muted)] opacity-50"
                                        : "cursor-pointer border-[var(--wd-border)] text-[var(--wd-text)] has-[:checked]:border-[var(--wd-accent)] has-[:checked]:bg-[var(--wd-accent)] has-[:checked]:text-[var(--wd-accent-text)]"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`seat_${member.id}`}
                                      value={`${tbl.id}:${seat.seatIndex}`}
                                      disabled={taken}
                                      defaultChecked={seat.isMe}
                                      className="sr-only"
                                    />
                                    #{seat.seatIndex + 1}
                                    {taken ? dict.seatTakenSuffix : seat.isMe ? dict.seatIsYouSuffix : ""}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[var(--wd-accent)] px-4 py-2.5 text-sm font-medium text-[var(--wd-accent-text)] hover:opacity-90"
                  >
                    {dict.groupSaveAllButton}
                  </button>
                </form>
              )}
            </div>
          )}

          <WeddingInfoSections
            wedding={wedding}
            locations={locations}
            scheduleItems={scheduleItems}
            faqItems={faqItems}
            menuItems={menuItems}
            dict={dict}
          />

          <p className="mt-8 text-center text-xs text-[var(--wd-muted)]">
            <Link href="/polityka-prywatnosci" className="underline">
              {dict.privacyPolicyLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
